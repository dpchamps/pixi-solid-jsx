import {render} from "solid-custom-renderer/index.ts";
import {createRoot} from "solid-js";
import {JSX} from "jsx-runtime/jsx-runtime.ts";
import {HtmlElementNode} from "./proxy-dom";

export const renderRoot = (root: () => JSX.Element, attachTo: HTMLElement) => {
    createRoot((_dispose) => {
        render(root, HtmlElementNode.create(attachTo))
    })
}