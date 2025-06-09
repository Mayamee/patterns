// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventsMap = Record<PropertyKey, (...args: any[]) => void>;

export type Keys<T> = keyof T;
