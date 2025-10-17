import { ProxyDomNode, ProxyNode } from "./Node.ts";
import {expectNode} from "./utility-node.ts";

export class HtmlElementNode extends ProxyNode<
  "html",
  HTMLElement,
  ProxyDomNode
> {
  static create(element: HTMLElement) {
    return new HtmlElementNode("html", element);
  }

  addChildProxy(node: ProxyDomNode): void {
    expectNode(
      node,
      "application",
      `application must be inserted into HTMLElement`,
    );
  }

  removeChildProxy(proxied: ProxyDomNode): void {
    expectNode(
      proxied,
      "application",
      `bad state. expected application as child to root HTMLElement`,
    );
    if (proxied.container.canvas) {
      this.container.removeChild(proxied.container.canvas);
    }
  }

  override addChildProxyUntracked(_untracked: HTMLElement) {
    throw new Error("cannot add untracked child to html node");
  }

  override removeChildProxyUntracked(_untracked: HTMLElement) {
    throw new Error("cannot remove an untracked child from HTMLElement");
  }
}
