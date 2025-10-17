import {
  assert,
  invariant,
  isDefined,
  Maybe,
  unimplemented,
} from "../../../utility-types.ts";
import {
  Application,
  Container,
  Graphics,
  RenderLayer,
  Sprite,
  Text,
} from "pixi.js";
import {isNodeWithPixiContainer} from "./utility-node.ts";

export type ProxyDomNode =
  | IProxyNode<"application", Application, ProxyDomNode>
  | IProxyNode<"html", HTMLElement, ProxyDomNode>
  | IProxyNode<"text", Text, ProxyDomNode>
  | IProxyNode<"container", Container, ProxyDomNode>
  | IProxyNode<"render-layer", null, ProxyDomNode>
  | IProxyNode<"raw", string, ProxyDomNode>
  | IProxyNode<"sprite", Sprite, ProxyDomNode>
  | IProxyNode<"graphics", Graphics, ProxyDomNode>;

interface GenericNode extends IProxyNode<any, any, any> {}

export interface IProxyNode<
  Tag extends string,
  Container,
  NodeType extends GenericNode,
> {
  id: number;
  tag: Tag;
  container: Container;

  addChild: (node: NodeType, anchor?: NodeType) => void;
  removeChild: (node: NodeType) => void;
  replaceChild: (oldNode: NodeType, newNode: NodeType) => void;
  getParent: () => Maybe<NodeType>;
  getChildren: () => Array<NodeType>;
  addChildProxy: (child: NodeType, anchor?: NodeType) => NodeType | void;
  removeChildProxy: (child: NodeType) => void;
  setParent: (parent: NodeType) => void;
  getRenderLayer: () => Maybe<RenderLayer>;
  setRenderLayer: (layer: Maybe<RenderLayer>) => void;
  setProp: <PropType>(
    name: string,
    value: PropType,
    prev: Maybe<PropType>,
  ) => void;
}

// Bad foo for now
let _id = 0;
const getId = () => ++_id;

export abstract class ProxyNode<
  Tag extends string,
  Container,
  NodeType extends GenericNode,
> implements GenericNode
{
  readonly tag: Tag;
  readonly container: Container;
  readonly id: number;

  protected parent: Maybe<NodeType> = null;
  protected children: NodeType[] = [];
  protected proxiedChildren: NodeType[] = [];
  protected untrackedChildren: Container[] = [];
  protected renderLayer: Maybe<RenderLayer> = null;

  protected constructor(tag: Tag, container: Container) {
    this.tag = tag;
    this.container = container;
    this.id = getId();
  }

  static attachRenderLayer(node: ProxyDomNode, renderLayer: RenderLayer) {
    if (isNodeWithPixiContainer(node)) {
      renderLayer.attach(node.container);
    }
  }

  static attachRenderLayerRecursive(
    node: ProxyDomNode,
    renderLayer: RenderLayer,
  ) {
    ProxyNode.attachRenderLayer(node, renderLayer);

    for (const child of node.getChildren()) {
      if (!child.getRenderLayer()) {
        child.setRenderLayer(renderLayer);
      }
    }
  }

  private addChildWithProxy(
    child: NodeType,
    proxiedChild: NodeType,
    anchor?: NodeType,
  ) {
    const idx = this.children.findIndex((n) => anchor?.id === n.id);
    const spliceAt = idx === -1 ? this.children.length : idx;

    this.children.splice(spliceAt, 0, child);
    this.proxiedChildren.splice(spliceAt, 0, proxiedChild);

    child.setParent(this);
  }

  abstract addChildProxy(child: NodeType, anchor?: NodeType): NodeType | void;
  abstract addChildProxyUntracked(untracked: Container): void;
  abstract removeChildProxyUntracked(untracked: Container): void;

  addChild(node: NodeType, anchor?: NodeType) {
    const proxied = this.addChildProxy(node, anchor);
    this.addChildWithProxy(node, proxied || node, anchor);
    this.recomputeProxy();
  }

  replaceChild(oldNode: NodeType, newNode: NodeType) {
    this.addChild(newNode, oldNode);
    this.removeChild(oldNode);
    this.recomputeProxy();
  }

  getChildren() {
    return this.children;
  }

  getParent() {
    return this.parent;
  }

  getRenderLayer() {
    return this.renderLayer;
  }

  private removeChildBase(node: NodeType) {
    const index = this.children.findIndex((child) => child.id === node.id);
    assert(
      index > -1,
      "Attempted to remove a child that did not exist. This is a runtime error that cannot be recovered from",
    );
    const childElement = this.children[index];
    const proxiedChild = this.proxiedChildren[index];
    invariant(childElement);
    invariant(proxiedChild);
    this.children.splice(index, 1);
    this.proxiedChildren.splice(index, 1);

    return proxiedChild;
  }

  abstract removeChildProxy(node: NodeType): void;

  syncUntracked() {}

  removeChild(node: NodeType) {
    const proxiedChild = this.removeChildBase(node);
    this.removeChildProxy(proxiedChild);
    this.recomputeProxy();
  }

  setParent(parent: NodeType): void {
    this.parent = parent;
    if (!this.renderLayer) {
      this.setRenderLayer(parent.getRenderLayer());
    }
  }

  setRenderLayer(layer: Maybe<RenderLayer>) {
    this.renderLayer = layer ?? null;
    if (layer) {
      ProxyNode.attachRenderLayerRecursive(
          // this is never _not_ a proxydomnode.
          // could think of a better pattern,
          // but it works
        this as unknown as ProxyDomNode,
        layer,
      );
    }
  }

  setProp<T>(name: string, value: T, _prev: Maybe<T>): void {
    if (typeof this.container === "object" && this.container !== null) {
      Reflect.set(this.container, name, value);
    } else if (this.tag === "render-layer" && isDefined(this.renderLayer)) {
      Reflect.set(this.renderLayer, name, value);
    }
  }

  protected recomputeProxy() {
    // noop
  }
}
