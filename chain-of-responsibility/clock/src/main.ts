import { makeClockView } from "./ClockView";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("No root element");
}

makeClockView(rootElement);
