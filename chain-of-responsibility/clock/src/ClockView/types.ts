export type UpdateElementType = "hour" | "minute" | "second" | "ring";

export interface IClockView {
  updateView(elementType: UpdateElementType, value: string): void;
}
