import { createRenderer } from "solid-js/universal";
import {BuildablePixiJsxNode, RuntimeRawNode} from "jsx-runtime/jsx-node.ts";
import {invariant, unimplemented} from "../utility-types.ts";
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
        const parent = node.getParent();
        invariant(parent);
        const children = parent.getChildren();
        const index = children.findIndex((el) => el.id === node.id);
        if(index === -1 || index === children.length-1) return undefined;
        return children[index+1]

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
        parent.removeChild(node);
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
