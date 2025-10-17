import { ProxyDomNode, ProxyNode } from "./Node.ts";
import { Container } from "pixi.js";
import { invariant } from "../../../utility-types.ts";
import {expectNodeNot, isNodeWithPixiContainer} from "./utility-node.ts";

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
    if (node.tag === "render-layer") return this.addRenderLayer(node);

    const insertIndex = anchor ? this.resolveInsertIndex(anchor) : this.container.children.length;
    this.container.addChildAt(node.container, insertIndex);

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
    if (proxied.tag === "render-layer") return this.removeRenderLayer(proxied);
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

  /**
   * Resolves the insertion index in the container for a new child, given an anchor node.
   *
   * Finds the first non-raw sibling at or after the anchor in this.children and returns
   * the appropriate insertion index:
   * - If the anchor itself is non-raw, returns its index
   * - If a non-raw sibling exists after the anchor, returns (that sibling's index - 1)
   * - If no non-raw sibling exists, returns the end of the container
   *
   * @param anchor - The reference node to insert relative to
   * @returns The index to use with container.addChildAt()
   */
  private resolveInsertIndex(anchor: ProxyDomNode) {
    let canSelectPosition = false;

    for(let index = 0; index <= this.children.length-1; index +=1){
      const child = this.children[index];
      invariant(child);
      const isAnchor =  child.id === anchor.id
      canSelectPosition = canSelectPosition || isAnchor;

      // Anchor itself is non-raw: insert at its position
      if(child.tag !== "raw" && canSelectPosition && isAnchor) return index
      // Found non-raw node after anchor: insert before it
      if(child.tag !== "raw" && canSelectPosition) return index-1
    }

    return this.container.children.length;
  }

  private addRenderLayer(node: Extract<ProxyDomNode, {tag: "render-layer"}>) {
    const renderLayer = node.getRenderLayer();
    invariant(renderLayer, "Encountered RenderLayerNode with no RenderLayer");
    this.container.addChild(renderLayer);
    return;
  }

  private removeRenderLayer(node: Extract<ProxyDomNode, { tag: "render-layer" }>){
    // ...So we need to remove all of their children from the parent container
    for (const child of node.getChildren()) {
      if(isNodeWithPixiContainer(child)){
        this.container.removeChild(child.container);
      }
    }
    // We also need to be sure to remove the actual render layer
    const renderLayer = node.getRenderLayer();
    invariant(renderLayer);
    this.container.removeChild(renderLayer);
  }
}
