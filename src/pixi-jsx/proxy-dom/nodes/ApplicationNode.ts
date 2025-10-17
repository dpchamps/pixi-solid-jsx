import { ProxyNode } from "./Node.ts";
import { ProxyDomNode } from "./types.ts";
import { Application } from "pixi.js";
import { assert, invariant } from "../../../utility-types.ts";
import { TextNode } from "./TextNode.ts";
import { expectNodeNot, expectNode } from "./utility-node.ts";

export class ApplicationNode extends ProxyNode<
  "application",
  Application,
  ProxyDomNode
> {
  initializationProps: Record<string, unknown> = {};

  static create() {
    return new ApplicationNode("application", new Application());
  }

  override addChildProxy(node: ProxyDomNode) {
    assert(
      node.tag !== "application" && node.tag !== "html",
      `unexpected node as child to application: ${node.tag}`,
    );

    if (node.tag === "raw") {
      const child = TextNode.createFromRaw(node.container);
      this.container.stage.addChild(child.container);
      return child;
    }

    if (node.tag === "render-layer") {
      const renderLayer = node.getRenderLayer();
      invariant(renderLayer, "Encountered RenderLayerNode with no RenderLayer");
      this.container.stage.addChild(renderLayer);
      return;
    }

    this.container.stage.addChild(node.container);
    return node;
  }

  override removeChildProxy(proxied: ProxyDomNode) {
    expectNodeNot(
      proxied,
      `unexpected node as child to application`,
      "raw",
      "html",
      "application",
    );

    if (proxied.tag === "render-layer") {
      const renderLayer = proxied.getRenderLayer();
      invariant(renderLayer, "Encountered RenderLayerNode with no RenderLayer");
      this.container.stage.removeChild(renderLayer);
      return;
    }

    this.container.stage.removeChild(proxied.container);
  }

  override setProp<T>(name: string, value: T) {
    this.initializationProps[name] = value;
  }

  async initialize() {
    const root = this.getParent();
    invariant(
      root,
      `Cannot initialize application before root has been appended`,
    );
    expectNode(root, "html", `unexpected parent for application`);
    await this.container.init(this.initializationProps);
    this.container.render();
    root.container.appendChild(this.container.canvas);
  }

  override addChildProxyUntracked(_untracked: Application) {
    throw new Error("cannot add untracked child to application");
  }

  override removeChildProxyUntracked(_untracked: Application) {
    throw new Error("cannot remove an untracked child from application");
  }
}
