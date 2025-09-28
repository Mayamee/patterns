export type UpdateElementType = "weekday" | "hour" | "minute" | "second" | "ring";

export interface IClockView {
  updateView(elementType: UpdateElementType, value: string): void;
}
