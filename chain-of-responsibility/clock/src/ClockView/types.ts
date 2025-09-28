export type UpdateElementType =
  | "weekday"
  | "hour"
  | "minute"
  | "second"
  | "ring";

export type ElementTypeValueMap<TKey extends UpdateElementType> = {
  weekday: Weekday;
  hour: number;
  minute: number;
  second: number;
  ring: number;
}[TKey];

export type Weekday = "0" | "1" | "2" | "3" | "4" | "5" | "6";

export interface IClockView {
  updateView<TElementType extends UpdateElementType>(
    elementType: TElementType,
    value: ElementTypeValueMap<TElementType>
  ): void;
}

export const isWeekday = (value: unknown): value is Weekday => {
  if (typeof value !== "string") {
    return false;
  }

  return ["0", "1", "2", "3", "4", "5", "6"].includes(value);
};


export type UpdateCssVarElement = {
  element: HTMLElement;
  cssVar: string;
};

export const isUpdateCssVarElement = (
  value: unknown
): value is UpdateCssVarElement => {
  return (
    Object.hasOwn(value as object, "element") &&
    Object.hasOwn(value as object, "cssVar")
  );
};

export type UpdateElement = HTMLElement | UpdateCssVarElement;

export type ViewConfig = {
  hour: number;
  minute: number;
  second: number;
  ring: number;
  weekday: Weekday;
};