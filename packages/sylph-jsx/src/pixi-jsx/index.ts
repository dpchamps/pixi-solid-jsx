export * from "./solidjs-universal-renderer/index.js";
export * from "./jsx/jsx-runtime.js";

import { createRoot } from "solid-js";
import { JSX } from "./jsx/jsx-runtime.js";
import { HtmlElementNode } from "./proxy-dom/index.js";
import { render } from "./solidjs-universal-renderer/index.js";

export const renderRoot = (root: () => JSX.Element, attachTo: HTMLElement) => {
  createRoot((_dispose) => {
    render(root as any, HtmlElementNode.create(attachTo));
  });
};
