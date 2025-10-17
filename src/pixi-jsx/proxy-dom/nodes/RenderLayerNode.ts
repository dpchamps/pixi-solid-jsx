import { expectNode, ProxyDomNode, ProxyNode } from "./Node.ts";
import { RenderLayer } from "pixi.js";
import { invariant } from "../../../utility-types.ts";

export class RenderLayerNode extends ProxyNode<
  "render-layer",
  null,
  ProxyDomNode
> {
  override renderLayer: RenderLayer;
  private pendingChildren: Array<{
    child: ProxyDomNode;
    anchor: ProxyDomNode | undefined;
  }> = [];

  static create() {
    return new RenderLayerNode(new RenderLayer());
  }

  protected constructor(renderLayer: RenderLayer) {
    super("render-layer", null);
    this.renderLayer = renderLayer;
  }

  override setParent(parent: ProxyDomNode): void {
    super.setParent(parent);
    invariant(this.parent, "parent cannot be undefined");

    for (const { child, anchor } of this.pendingChildren) {
      this.parent.addChildProxy(child, anchor);
    }

    this.pendingChildren = [];
  }

  addChildProxy(
    child: ProxyDomNode,
    anchor: ProxyDomNode | undefined,
  ): void | ProxyDomNode {
    child.setRenderLayer(this.renderLayer);
    // This is not strictly necessary,
    // Because `attachRenderLayerRecursive` is called on setParent
    // However, it's a performance optimization
    // For non-detached component trees, we can propagate the render layer downward once
    // without having to do a recursive computation
    ProxyNode.attachRenderLayer(child, this.renderLayer);

    if (!this.parent) {
      this.pendingChildren.push({ child, anchor });
      return;
    }

    return this.parent.addChildProxy(child, anchor);
  }

  addChildProxyUntracked(node: never): void {
    throw new Error(`RenderLayerNode Does not Support untracked children.`);
  }

  removeChildProxy(child: ProxyDomNode): void {
    child.setRenderLayer(undefined);
    return this.parent?.removeChildProxy(child);
  }

  removeChildProxyUntracked(node: never): void {
    throw new Error(
      `RenderLayerNode Does not Support untracked children. Hint: use the parent container.`,
    );
  }
}
