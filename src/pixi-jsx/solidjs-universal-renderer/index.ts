import { createRenderer } from "solid-js/universal";
import { invariant, unimplemented } from "../../utility-types.ts";
import {
  createProxiedPixieContainerNode,
  ProxyDomNode,
  RawNode,
} from "../proxy-dom";

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
} = createRenderer<ProxyDomNode>({
  createElement(tag) {
    const node = createProxiedPixieContainerNode(tag);
    return node;
  },
  createTextNode(value) {
    return RawNode.create(value);
  },
  getFirstChild(node) {
    return node.getChildren()[0];
  },
  getNextSibling(node) {
    const parent = node.getParent();
    invariant(parent);
    const children = parent.getChildren();
    const index = children.findIndex((el) => el.id === node.id);
    if (index === -1 || index === children.length - 1) return undefined;
    return children[index + 1];
  },
  getParentNode(node) {
    const parent = node.getParent();
    return parent === null ? undefined : parent;
  },
  insertNode(parent, node, anchor): void {
    parent.addChild(node, anchor);
  },
  isTextNode(node): boolean {
    return node.tag === "text";
  },
  removeNode(parent, node): void {
    parent.removeChild(node);
  },
  replaceText(rawNode, value): void {
    const parent = rawNode.getParent();
    invariant(parent);
    parent.replaceChild(rawNode, RawNode.create(value));
  },
  setProperty(node, name, value, prev): void {
    node.setProp(name, value, prev);
  },
});

export * from "./patched-types.ts";
