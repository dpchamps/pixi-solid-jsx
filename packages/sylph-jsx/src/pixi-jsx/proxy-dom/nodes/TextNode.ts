import { ProxyNode } from "./Node.js";
import { ProxyDomNode } from "./types.js";
import { Text } from "pixi.js";
import { RawNode } from "./RawNode.js";
import { expectNode } from "./utility-node.js";

export class TextNode extends ProxyNode<"text", Text, ProxyDomNode> {
  static create() {
    return new TextNode("text", new Text());
  }

  static createFromRaw(...nodes: string[]) {
    const node = TextNode.create();
    nodes.forEach((child) => node.addChild(RawNode.create(child)));
    return node;
  }

  addChildProxy(node: ProxyDomNode, _anchor?: ProxyDomNode): void {
    expectNode(node, "raw", `unexpect tag for text`);
  }

  protected override recomputeProxy() {
    this.container.text = this.children.reduce(
      (acc, child) => `${acc}${child.container}`,
      ``,
    );
  }

  override addChildProxyUntracked(_untracked: Text) {
    throw new Error("cannot add untracked child to text");
  }

  override removeChildProxyUntracked(_untracked: Text) {
    throw new Error("cannot remove an untracked child from Text");
  }

  removeChildProxy(proxied: ProxyDomNode) {
    const nextText = this.children.reduce((acc, el) => {
      if (proxied.id === el.id) return acc;
      return `${acc}${el.container}`;
    }, "");

    this.container.text = nextText;
  }
}
