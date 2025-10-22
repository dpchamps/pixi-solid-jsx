import {
  createComputed,
  createSignal,
} from "../../pixi-jsx/solidjs-universal-renderer/patched-types.js";

type WindowDimensions = {
  innerWidth: number;
  outerWidth: number;
  innerHeight: number;
  outerHeight: number;
};

const intoCurrentDimensions = (window: Window) => ({
  innerWidth: window.innerWidth,
  outerWidth: window.outerWidth,
  innerHeight: window.innerHeight,
  outerHeight: window.outerHeight,
});

export const createWindowDimensions = (element: Window) => {
  const [windowDimensions, setWindowDimensions] =
    createSignal<WindowDimensions>(intoCurrentDimensions(element.window));

  const setCurrentDimensions = () =>
    setWindowDimensions(intoCurrentDimensions(element.window));

  createComputed(() => {
    element.window.addEventListener("resize", setCurrentDimensions);
    setCurrentDimensions();
    return () => {
      element.window.removeEventListener("resize", setCurrentDimensions);
    };
  });

  return windowDimensions;
};
