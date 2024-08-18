import {BuildablePixiJsxNode, RuntimeHTMLElementNode} from "jsx-runtime/jsx-node.ts";
import {render} from "solid-custom-renderer/index.ts";
import {createRoot} from "solid-js";

export const renderRoot = (root: () => BuildablePixiJsxNode, attachTo: HTMLElement) => {
    createRoot((_dispose) => {
        render(root, RuntimeHTMLElementNode(attachTo))
    })
}