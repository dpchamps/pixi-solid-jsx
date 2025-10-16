import { expectNode, ProxyDomNode, ProxyNode } from "./Node.ts";
import { RenderLayer } from "pixi.js";

export class RenderLayerNode extends ProxyNode<
  "render-layer",
  null,
  ProxyDomNode
> {
  override renderLayer: RenderLayer;
  static create() {
    return new RenderLayerNode(new RenderLayer());
  }

  protected constructor(renderLayer: RenderLayer) {
    super("render-layer", null);
    this.renderLayer = renderLayer;
  }

  addChildProxy(
    child: ProxyDomNode,
    anchor: ProxyDomNode | undefined,
  ): void | ProxyDomNode {
    if (
      child.tag !== "render-layer" &&
      child.tag !== "raw" &&
      child.tag !== "application" &&
      child.tag !== "html"
    ) {
      this.renderLayer.attach(child.container);
    }
    child.setRenderLayer(this.renderLayer);
    return this.parent?.addChildProxy(child, anchor);
  }

  addChildProxyUntracked(node: never): void {
    throw new Error(
      `RenderLayerNode Does not Support untracked children. Hint: use the parent container.`,
    );
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
