import { createRenderer } from "solid-js/universal";
import {BuildablePixiJsxNode, RuntimeRawNode} from "jsx-runtime/jsx-node.ts";
import {assert, unimplemented} from "../utility-types.ts";
import {createNode} from "jsx-runtime/jsx-runtime.ts";

export const {
    render,
    effect,
    memo,
    createComponent,
    createElement,
    createTextNode,
    insertNode,
    insert,
    spread,
    setProp,
    mergeProps,
    use,
} = createRenderer<BuildablePixiJsxNode>({
    createElement(tag) {
        const node = createNode(tag);
        return node
    },
    createTextNode(value) {
        return RuntimeRawNode(value)
    },
    getFirstChild(node) {
        return node.getChildren()[0];
    },
    getNextSibling(node) {
        return unimplemented(node);
    },
    getParentNode(node) {
        return node.getParent();
    },
    insertNode(parent, node, _anchor): void {
        parent.addChild(node);
    },
    isTextNode(node): boolean {
        return node.tag === "text";
    },
    removeNode(parent, node): void {
        switch(parent.tag){
            case "text":
            case "container": {
                if(node.tag === "container" || node.tag === "text"){
                    parent.container.removeChild(node.container);
                }
                break
            }
            case "html": {
                assert(node.tag === "application");
                parent.container.removeChild(node.container.canvas);
            }
        }
        const childIdx = parent.getChildren().findIndex((c) => c.id === node.id);
        if(childIdx !== -1){
            parent.getChildren().splice(childIdx, 1)
        }
    },
    replaceText(textNode, value): void {
        return unimplemented(textNode, value)
    },
    setProperty(node, name, value, prev): void {
        node.setProp(name, value, prev);
    }

});

export {
    For,
    Show,
    Suspense,
    SuspenseList,
    Switch,
    Match,
    Index,
    ErrorBoundary,
    createContext,
} from "solid-js";
