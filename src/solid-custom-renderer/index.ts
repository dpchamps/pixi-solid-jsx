import { createRenderer } from "solid-js/universal";

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
    mergeProps
} = createRenderer({
    createElement(tag) {
        return undefined;
    },
    createTextNode(value) {
        return undefined;
    },
    getFirstChild<NodeType>(node) {
        return undefined;
    },
    getNextSibling<NodeType>(node: NodeType): NodeType | undefined {
        return undefined;
    },
    getParentNode<NodeType>(node: NodeType): NodeType | undefined {
        return undefined;
    },
    insertNode<NodeType>(parent: NodeType, node: NodeType, anchor: NodeType | undefined): void {
    },
    isTextNode<NodeType>(node: NodeType): boolean {
        return false;
    },
    removeNode<NodeType>(parent: NodeType, node: NodeType): void {
    },
    replaceText<NodeType>(textNode: NodeType, value: string): void {
    },
    setProperty<T>(node: NodeType, name: string, value: T, prev: T | undefined): void {
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
    ErrorBoundary
} from "solid-js";
