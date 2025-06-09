import { type EventsMap, type Keys } from "./types";

export abstract class EventEmitter<TEventsMap extends EventsMap> {
  private events: Map<Keys<TEventsMap>, Set<TEventsMap[Keys<TEventsMap>]>> =
    new Map();

  protected dropEventListeners() {
    this.events.clear();
  }

  protected notify<TKey extends Keys<TEventsMap>>(
    eventName: TKey,
    ...args: Parameters<TEventsMap[TKey]>
  ) {
    this.events
      .get(eventName)
      ?.forEach((eventHandler) => eventHandler(...args));
  }

  public on = <TKey extends Keys<TEventsMap>>(
    eventName: TKey,
    eventHandler: TEventsMap[TKey]
  ) => {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName)?.add(eventHandler);

    return () => this.off(eventName, eventHandler);
  };

  public off = <TKey extends Keys<TEventsMap>>(
    eventName: TKey,
    eventHandler: TEventsMap[TKey]
  ) => {
    this.events.get(eventName)?.delete(eventHandler);
  };
}
