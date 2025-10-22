import {
  createComputed,
  createSignal,
  onCleanup,
} from "../../pixi-jsx/solidjs-universal-renderer/patched-types.js";
import { Point } from "../libs/Point.js";

type ButtonType =
  | "Main"
  | "Auxiliary"
  | "Secondary"
  | "Forth"
  | "Fifth"
  | "Unknown";

type MouseLikeEvent = {
  x: number;
  y: number;
  button: number;
};

type WheelLikeEvent = MouseLikeEvent & {
  deltaX: number;
  deltaY: number;
  deltaZ: number;
};

type MouseLikeEl = {
  addEventListener(name: "mousedown", cb: (evt: MouseEvent) => void): void;
  addEventListener(name: "mouseup", cb: (evt: MouseEvent) => void): void;
  addEventListener(name: "mousemove", cb: (evt: MouseEvent) => void): void;
  addEventListener(name: "wheel", cb: (evt: WheelLikeEvent) => void): void;
  removeEventListener(name: "mousedown", cb: (evt: MouseEvent) => void): void;
  removeEventListener(name: "mouseup", cb: (evt: MouseEvent) => void): void;
  removeEventListener(name: "mousemove", cb: (evt: MouseEvent) => void): void;
  removeEventListener(name: "wheel", cb: (evt: WheelLikeEvent) => void): void;
};

const getButtonType = (button: number): ButtonType => {
  switch (button) {
    case 0:
      return "Main";
    case 1:
      return "Auxiliary";
    case 2:
      return "Secondary";
    case 3:
      return "Forth";
    case 4:
      return "Fifth";
    default:
      return "Unknown";
  }
};

export type Mouse = ReturnType<typeof createMouse>;

export const createMouse = (element: MouseLikeEl) => {
  const [click, setClick] = createSignal<ButtonType | false>(false);
  const [lastClickPosition, setLastClickPosition] = createSignal<Point>();
  const [currentMousePosition, setCurrentMousePosition] = createSignal<Point>();
  const [wheel, setWheel] =
    createSignal<Pick<WheelLikeEvent, "deltaZ" | "deltaY" | "deltaX">>();

  const onClickEvt = (evt: MouseLikeEvent) => {
    setClick(getButtonType(evt.button));
    setLastClickPosition({
      x: evt.x,
      y: evt.y,
    });
  };
  const onMouseUpEvt = (_: MouseEvent) => setClick(false);

  const onWheelEvt = (evt: WheelLikeEvent) =>
    setWheel({
      deltaX: evt.deltaX,
      deltaY: evt.deltaY,
      deltaZ: evt.deltaZ,
    });

  const onMousemove = (evt: MouseEvent) =>
    setCurrentMousePosition({
      x: evt.x,
      y: evt.y,
    });

  createComputed(() => {
    element.addEventListener("mousedown", onClickEvt);
    element.addEventListener("mouseup", onMouseUpEvt);
    element.addEventListener("wheel", onWheelEvt);
    element.addEventListener("mousemove", onMousemove);

    onCleanup(() => {
      element.removeEventListener("mousedown", onClickEvt);
      element.removeEventListener("mouseup", onMouseUpEvt);
      element.removeEventListener("mousemove", onMousemove);
      element.removeEventListener("wheel", onWheelEvt);
    });
  });

  return { click, lastClickPosition, currentMousePosition, wheel };
};
