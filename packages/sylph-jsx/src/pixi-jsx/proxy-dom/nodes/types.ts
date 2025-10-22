import {
  Application,
  Container,
  Graphics,
  RenderLayer,
  Sprite,
  Text,
} from "pixi.js";
import { Maybe } from "../../../utility-types.js";

export type ProxyDomNode =
  | IProxyNode<"application", Application, ProxyDomNode>
  | IProxyNode<"html", HTMLElement, ProxyDomNode>
  | IProxyNode<"text", Text, ProxyDomNode>
  | IProxyNode<"container", Container, ProxyDomNode>
  | IProxyNode<"render-layer", null, ProxyDomNode>
  | IProxyNode<"raw", string, ProxyDomNode>
  | IProxyNode<"sprite", Sprite, ProxyDomNode>
  | IProxyNode<"graphics", Graphics, ProxyDomNode>;

export interface GenericNode extends IProxyNode<any, any, any> {}

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
