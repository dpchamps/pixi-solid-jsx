export * from "solid-custom-renderer/index.ts";
export * from "./jsx/jsx-runtime.ts";

import { createRoot } from "solid-js";
import { JSX } from "jsx-runtime/jsx-runtime.ts";
import { HtmlElementNode } from "./proxy-dom";
import { render } from "solid-custom-renderer/index.ts";

export const renderRoot = (root: () => JSX.Element, attachTo: HTMLElement) => {
  createRoot((_dispose) => {
    render(root as any, HtmlElementNode.create(attachTo));
  });
};
