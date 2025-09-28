import type { IClockView, ViewConfig, Weekday } from "./types";

export type ClockWorkerOptions = {
  intervalMs?: number;
};

export type ClockWorkerFactory = (
  view: IClockView,
  options: ClockWorkerOptions
) => ClockWorker;

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
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      ring: 9,
      weekday: String((date.getDay() + 6) % 7) as Weekday,
    };
  }

  private handleViewConfigChange() {
    const config = this.makeViewConfig();

    this.handleSecondChange(config.second) &&
      this.handleMinuteChange(config.minute) &&
      this.handleHourChange(config.hour) &&
      this.handleRingChange(config.ring) &&
      this.handleWeekdayChange(config.weekday);
  }

  private handleHourChange(hour: ViewConfig["hour"]): boolean {
    if (this.viewConfig.hour === hour) {
      return false;
    }

    this.clockView.updateView("hour", hour);
    this.viewConfig.hour = hour;
    return true;
  }

  private handleMinuteChange(minute: ViewConfig["minute"]): boolean {
    if (this.viewConfig.minute === minute) {
      return false;
    }

    this.clockView.updateView("minute", minute);
    this.viewConfig.minute = minute;
    return true;
  }

  private handleSecondChange(second: ViewConfig["second"]): boolean {
    if (this.viewConfig.second === second) {
      return false;
    }

    this.clockView.updateView("second", second);
    this.viewConfig.second = second;
    return true;
  }

  private handleRingChange(ring: ViewConfig["ring"]): boolean {
    if (this.viewConfig.ring !== ring) {
      // Точка эмита события для будильника
      this.clockView.updateView("ring", ring);
      this.viewConfig.ring = ring;
    }

    // Всегда должно возвращать true, чтобы не блокировать обработку дальшейшей цепочки
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
