import { ProxyDomNode } from "./types.ts";
import { assert, unreachable } from "../../../utility-types.ts";

export function expectNodeNot<
  Node extends ProxyDomNode,
  Tag extends ProxyDomNode["tag"],
>(
  node: Node,
  context: string,
  ...tags: Tag[]
): asserts node is Exclude<Node, { tag: Tag }> {
  if (tags.some((tag) => node.tag === tag)) {
    throw new Error(
      `${context}. unexpected node ${node.tag}. cannot be: ${tags.join(",")}`,
    );
  }
}

export function expectNode<
  Node extends ProxyDomNode,
  Tag extends ProxyDomNode["tag"],
>(
  node: Node,
  tag: Tag,
  context: string,
): asserts node is Extract<Node, { tag: Tag }> {
  assert(
    node.tag === tag,
    `${context}. unexpected node: expected ${tag}, got ${node.tag}`,
  );
}

export const isNodeWithPixiContainer = <Node extends ProxyDomNode>(
  node: Node,
): node is Extract<
  Node,
  { tag: "container" | "sprite" | "text" | "graphics" }
> => {
  switch (node.tag) {
    case "container":
    case "text":
    case "graphics":
    case "sprite":
      return true;
    case "raw":
    case "html":
    case "render-layer":
    case "application":
      return false;
    default:
      return unreachable(node);
  }
};
