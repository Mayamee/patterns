import styles from "./index.module.scss";
import clsx from "clsx";
import {
  isUpdateCssVarElement,
  isWeekday,
  type ElementTypeValueMap,
  type IClockView,
  type UpdateElement,
  type UpdateElementType,
} from "./types";
import {
  ClockWorker,
  makeClockWorker,
  type ClockWorkerFactory,
  type ClockWorkerOptions,
} from "./clock-worker";
import { WEEKDAY_NAMES } from "./weekdayMap";

class ClockView implements IClockView {
  private rootElement: HTMLElement;
  private clockWorker: ClockWorker;
  private isMounted = false;
  private updateElements: Map<UpdateElementType, UpdateElement> = new Map();

  constructor(
    private readonly mountElement: HTMLElement,
    options: ClockWorkerOptions = {
      intervalMs: 1000,
    },
    makeClockWorker: ClockWorkerFactory
  ) {
    this.rootElement = this.makeRootElement();
    this.clockWorker = makeClockWorker(this, options);
  }

  public updateView<TElementType extends UpdateElementType>(
    elementType: TElementType,
    value: ElementTypeValueMap<TElementType>
  ) {
    if (!this.isMounted) {
      return;
    }

    const updateElement = this.updateElements.get(elementType);

    if (!updateElement) {
      return;
    }

    if (isUpdateCssVarElement(updateElement) && typeof value === "number") {
      const { cssVar, element } = updateElement;

      element.style.setProperty(cssVar, String(value));

      return;
    }

    if (updateElement instanceof HTMLElement && isWeekday(value)) {
      updateElement.textContent = WEEKDAY_NAMES[value];
      return;
    }
  }

  public mount() {
    this.rootElement.innerHTML = "";

    if (!this.isMounted) {
      this.mountElement.appendChild(this.rootElement);
      this.clockWorker.run();
      this.isMounted = true;
    }

    const clockBody = document.createElement("div");
    clockBody.className = styles["clock-body"];
    this.renderHandHolder(clockBody);
    this.renderHourPointers(clockBody);
    this.renderMarkers(clockBody);
    this.renderHands(clockBody);
    this.renderWeekDay(clockBody);
    this.rootElement.appendChild(clockBody);
  }

  public destroy() {
    if (this.isMounted) {
      this.mountElement.removeChild(this.rootElement);
      this.clockWorker.stop();
      this.updateElements.clear();
      this.isMounted = false;
    }
  }

  private makeRootElement() {
    return document.createElement("div");
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

  private renderWeekDay(parent: HTMLElement) {
    const config = this.getViewConfig();
    const element = document.createElement("div");
    element.textContent = WEEKDAY_NAMES[config.weekday];
    element.className = styles["week-day"];
    this.updateElements.set("weekday", element);

    parent.appendChild(element);
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

    const config = this.getViewConfig();

    hourHand.style.setProperty("--angle-offset-idx", config.hour);
    minuteHand.style.setProperty("--angle-offset-idx", config.minute);
    secondHand.style.setProperty("--angle-offset-idx", config.second);
    ringHand.style.setProperty("--angle-offset-idx", config.ring);

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

    this.updateElements.set("hour", {
      element: hourHand,
      cssVar: "--angle-offset-idx",
    });

    this.updateElements.set("minute", {
      element: minuteHand,
      cssVar: "--angle-offset-idx",
    });

    this.updateElements.set("second", {
      element: secondHand,
      cssVar: "--angle-offset-idx",
    });

    this.updateElements.set("ring", {
      element: ringHand,
      cssVar: "--angle-offset-idx",
    });

    [ringHand, hourHand, minuteHand, secondHand].forEach((hand) => {
      parent.appendChild(hand);
    });
  }

  private getViewConfig() {
    const config = this.clockWorker.makeViewConfig();
    return {
      hour: String(config.hour % 12),
      minute: String(config.minute),
      second: String(config.second),
      ring: String(config.ring),
      weekday: config.weekday,
    };
  }
}

export const makeClockView = (
  mountElement: HTMLElement,
  options?: ClockWorkerOptions
) => {
  const view = new ClockView(mountElement, options, makeClockWorker);
  view.mount();
  return view;
};
