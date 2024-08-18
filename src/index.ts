import {BuildablePixiJsxNode, RuntimeHTMLElementNode} from "./pixi-jsx/jsx/jsx-node.ts";
import {render} from "./pixi-jsx/solidjs-universal-renderer";
import {createRoot} from "solid-js";

export const renderRoot = (root: () => BuildablePixiJsxNode, attachTo: HTMLElement) => {
    createRoot((_dispose) => {
        render(root, RuntimeHTMLElementNode(attachTo))
    })
}