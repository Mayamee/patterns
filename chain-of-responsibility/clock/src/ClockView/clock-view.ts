import styles from "./index.module.scss";
import clsx from "clsx";

type ClockViewOptions = {
  updateTimeInterval: number;
};
class ClockView {
  private rootElement: HTMLElement;
  private isMounted = false;
  private intervalId: number | null = null;

  constructor(
    private readonly mountElement: HTMLElement,
    private readonly options: ClockViewOptions = {
      updateTimeInterval: 1000,
    }
  ) {
    this.rootElement = this.makeRootElement();
  }

  public render() {
    this.beforeRender();

    const clockBody = document.createElement("div");
    clockBody.className = styles["clock-body"];
    this.renderHandHolder(clockBody);
    this.renderHourPointers(clockBody);
    this.renderMarkers(clockBody);
    this.renderHands(clockBody);
    this.rootElement.appendChild(clockBody);
  }

  private makeRootElement() {
    return document.createElement("div");
  }

  private beforeRender() {
    this.rootElement.innerHTML = "";

    if (!this.isMounted) {
      this.mount();
    }
  }

  private mount() {
    this.mountElement.appendChild(this.rootElement);
    this.isMounted = true;
    this.intervalId = window.setInterval(() => {
      this.render();
    }, this.options?.updateTimeInterval);
  }

  public destroy() {
    if (this.isMounted) {
      this.mountElement.removeChild(this.rootElement);
      this.isMounted = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  private renderMarkers(parent: HTMLElement) {
    const markers = Array.from({ length: 60 }).map((_, minuteIdx) => {
      const marker = document.createElement("div");
      marker.style.setProperty("--angle-offset-idx", minuteIdx.toString());
      const markerContent = document.createElement("div");
      marker.appendChild(markerContent);
      marker.className = clsx(styles.marker, {
        [styles["marker-hour"]]: minuteIdx % 5 === 0,
      });
      return marker;
    });

    markers.forEach((marker) => parent.appendChild(marker));
  }

  private renderHourPointers(parent: HTMLElement) {
    const pointers = Array.from({ length: 12 }).map((_, hourIdx) => {
      const pointer = document.createElement("div");
      pointer.style.setProperty("--angle-offset-idx", hourIdx.toString());
      const pointerContent = document.createElement("div");
      pointer.appendChild(pointerContent);
      pointer.className = styles["hour-pointer"];
      pointerContent.textContent = (hourIdx === 0 ? 12 : hourIdx).toString();
      return pointer;
    });

    pointers.forEach((pointer) => parent.appendChild(pointer));
  }

  private renderHandHolder(parent: HTMLElement) {
    const handHolder = document.createElement("div");
    handHolder.className = styles["hand-holder"];
    parent.appendChild(handHolder);
  }

  private renderHands(parent: HTMLElement) {
    const hourHand = document.createElement("div");
    const minuteHand = document.createElement("div");
    const secondHand = document.createElement("div");
    const ringHand = document.createElement("div");

    const currentHour = new Date().getHours() % 12;
    const currentMinute = new Date().getMinutes();
    const currentSecond = new Date().getSeconds();
    const currentRing = 9;

    hourHand.style.setProperty("--angle-offset-idx", currentHour.toString());

    minuteHand.style.setProperty(
      "--angle-offset-idx",
      currentMinute.toString()
    );

    secondHand.style.setProperty(
      "--angle-offset-idx",
      currentSecond.toString()
    );

    ringHand.style.setProperty("--angle-offset-idx", currentRing.toString());

    hourHand.className = clsx(
      styles.hand,
      styles["hand-step-hour"],
      styles["hand-hour"]
    );

    minuteHand.className = clsx(
      styles.hand,
      styles["hand-step-minute"],
      styles["hand-minute"]
    );

    secondHand.className = clsx(
      styles.hand,
      styles["hand-step-minute"],
      styles["hand-second"]
    );

    ringHand.className = clsx(
      styles.hand,
      styles["hand-step-hour"],
      styles["hand-ring"]
    );

    [ringHand, hourHand, minuteHand, secondHand].forEach((hand) => {
      parent.appendChild(hand);
    });
  }
}

export const makeClockView = (mountElement: HTMLElement) => {
  const view = new ClockView(mountElement);
  view.render();
  return view;
};
