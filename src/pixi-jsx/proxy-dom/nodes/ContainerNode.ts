import { expectNodeNot, ProxyDomNode, ProxyNode } from "./Node.ts";
import { Application, Container } from "pixi.js";
import { invariant } from "../../../utility-types.ts";

export class ContainerNode extends ProxyNode<
  "container",
  Container,
  ProxyDomNode
> {
  static create() {
    return new ContainerNode("container", new Container());
  }

  addChildProxy(node: ProxyDomNode, anchor?: ProxyDomNode) {
    expectNodeNot(node, "unexpected child to container", "application", "html");
    if (node.tag === "raw") return;
    if (node.tag === "render-layer") {
      const renderLayer = node.getRenderLayer();
      invariant(renderLayer, "Encountered RenderLayerNode with no RenderLayer");
      this.container.addChild(renderLayer);
      return;
    }

    // find the index of the next nonraw node from anchor
    const anchorIndex = anchor
      ? this.children.findIndex((childNode) => childNode.id === anchor.id)
      : -1;
    const insertIndex = anchor
      ? this.children.findIndex(
          (childNode, idx) => childNode.tag !== "raw" && idx >= anchorIndex,
        )
      : -1;
    const finalIndex =
      insertIndex === -1
        ? this.container.children.length
        : insertIndex !== anchorIndex
          ? insertIndex - 1
          : insertIndex;

    this.container.addChildAt(node.container, finalIndex);

    // RenderLayerNodes are ephemeral, it's possible this child is being attached
    // _from_ a RenderLayerNode, in which case, we don't want to move it.
    if (!node.getRenderLayer()) {
      this.getRenderLayer()?.attach(node.container);
    }
  }

  removeChildProxy(proxied: ProxyDomNode) {
    expectNodeNot(
      proxied,
      "unexpected child to container on removal (this is an invariant state)",
      "application",
      "html",
    );
    // Raw Nodes are transparent, there's nothing to remove from the pixi node
    if (proxied.tag === "raw") return;
    // RenderLayer nodes are also transparent, but their children propagate upwards
    // So we need to remove all of their children from the parent container
    if (proxied.tag === "render-layer") {
      for (const child of proxied.getChildren()) {
        if (
          child.tag === "raw" ||
          child.tag === "render-layer" ||
          child.tag === "html" ||
          child.tag === "application"
        )
          continue;
        this.container.removeChild(child.container);
      }
      // We also need to be sure to remove the actual render layer
      const renderLayer = proxied.getRenderLayer();
      invariant(renderLayer);
      this.container.removeChild(renderLayer);
      return;
    }
    // Otherwise, this container is a candidate for removal
    this.container.removeChild(proxied.container);
  }

  override addChildProxyUntracked(untracked: Container) {
    this.container.addChild(untracked);
    this.untrackedChildren.push(untracked);
  }

  override removeChildProxyUntracked(untracked: Container) {
    this.container.removeChild(untracked);
    this.untrackedChildren = this.untrackedChildren.filter(
      (x) => x.uid !== untracked.uid,
    );
  }

  override syncUntracked() {
    for (const untracked of this.untrackedChildren) {
      if (!this.container.children.includes(untracked)) {
        this.container.children.push(untracked);
      }
    }
  }
}
