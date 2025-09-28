import type { IClockView } from "./types";

export type ClockWorkerOptions = {
  intervalMs?: number;
};

export type Weekday = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export type ClockWorkerFactory = (
  view: IClockView,
  options: ClockWorkerOptions
) => ClockWorker;

type ViewConfig = {
  hour: string;
  minute: string;
  second: string;
  ring: string;
  weekday: Weekday;
};

export class ClockWorker {
  private intervalId: number | null = null;

  private viewConfig: ViewConfig;

  constructor(
    private readonly clockView: IClockView,
    private readonly options: ClockWorkerOptions
  ) {
    this.viewConfig = this.makeViewConfig();
  }

  public run() {
    this.intervalId = setInterval(
      this.handleViewConfigChange.bind(this),
      this.options.intervalMs
    );
  }

  public stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public makeViewConfig(): ViewConfig {
    const date = new Date();

    return {
      hour: String(date.getHours() % 12),
      minute: String(date.getMinutes()),
      second: String(date.getSeconds()),
      ring: String(9),
      weekday: String((date.getDay() + 6) % 7) as Weekday,
    };
  }

  private handleViewConfigChange() {
    const config = this.makeViewConfig();

    if (!this.handleSecondChange(config.second)) {
      return;
    }

    if (!this.handleMinuteChange(config.minute)) {
      return;
    }

    if (!this.handleHourChange(config.hour)) {
      return;
    }

    if (!this.handleRingChange(config.ring)) {
      return;
    }

    if (!this.handleWeekdayChange(config.weekday)) {
      return;
    }
  }

  private handleHourChange(hour: string): boolean {
    if (this.viewConfig.hour === hour) {
      return false;
    }

    this.clockView.updateView("hour", hour);
    this.viewConfig.hour = hour;
    return true;
  }

  private handleMinuteChange(minute: string): boolean {
    if (this.viewConfig.minute === minute) {
      return false;
    }

    this.clockView.updateView("minute", minute);
    this.viewConfig.minute = minute;
    return true;
  }

  private handleSecondChange(second: string): boolean {
    if (this.viewConfig.second === second) {
      return false;
    }

    this.clockView.updateView("second", second);
    this.viewConfig.second = second;
    return true;
  }

  private handleRingChange(ring: string): boolean {
    if (this.viewConfig.ring === ring) {
      return false;
    }

    this.clockView.updateView("ring", ring);
    this.viewConfig.ring = ring;
    return true;
  }

  private handleWeekdayChange(weekday: Weekday): boolean {
    if (this.viewConfig.weekday === weekday) {
      return false;
    }

    this.clockView.updateView("weekday", weekday);
    this.viewConfig.weekday = weekday;
    return true;
  }
}

export const makeClockWorker: ClockWorkerFactory = (view, options) => {
  return new ClockWorker(view, options);
};
