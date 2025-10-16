import { UnknownRecord } from "../../utility-types.ts";
import {
  TextOptions,
  ApplicationOptions,
  ContainerOptions,
  SpriteOptions,
  GraphicsOptions,
  Application,
  Ticker, RenderLayer,
} from "pixi.js";
import {
  ApplicationNode,
  ContainerNode,
  ProxyDomNode,
  SpriteNode,
  TextNode,
} from "../proxy-dom";
import { Setter } from "../solidjs-universal-renderer";
import { GraphicsNode } from "../proxy-dom/nodes/Graphics.ts";
import {RenderLayerNode} from "../proxy-dom/nodes/RenderLayerNode.ts";

export type UnknownNodeProps = Record<string, unknown>;
export type PixiNodeProps<
  Props extends UnknownRecord = {},
  RefValue = JSXNode,
  ChildType = JSXNode,
> = Props & RefType<RefValue> & ChildPropType<ChildType> & ClassType;

export type Children<Node = JSXNode> = Node | Node[];
export type ChildPropType<Node = JSXNode> = { children?: Children<Node> };

export type RefType<RefValue> = {
  ref?: RefValue | undefined | Setter<RefValue | undefined>;
};

export type ClassType = { class?: string | undefined };

type PixieOptionsProps<
  Options,
  OptionsToOmit extends keyof Options = never,
> = Partial<Omit<Options, OptionsToOmit | "children">>;

export type RawNode = string | number;

export type TextIntrinsicProps = PixiNodeProps<
  PixieOptionsProps<TextOptions, "text">,
  TextNode,
  RawNode | RawNode[] | (() => RawNode) | (() => RawNode[])
>;

export type ContainerIntrinsicProps = PixiNodeProps<
  PixieOptionsProps<ContainerOptions>,
  ContainerNode
>;

type ApplicationInitializationProps = {
  loadingState: JSXNode;
  appInitialize?: (application: Application) => Promise<void> | void;
  createTicker?: () => Ticker;
};

export type ApplicationIntrinsicProps = PixiNodeProps<
  PixieOptionsProps<ApplicationOptions & ApplicationInitializationProps>,
  ApplicationNode
>;

export type SpriteIntrinsicProps = PixiNodeProps<
  PixieOptionsProps<SpriteOptions>,
  SpriteNode,
  never
>;

export type GraphicsIntrinsicProps = PixiNodeProps<
  PixieOptionsProps<GraphicsOptions>,
  GraphicsNode,
  never
>;

export type RenderLayerIntrinsicProps = PixiNodeProps<
    PixieOptionsProps<RenderLayer>,
    RenderLayerNode
>

export type JSXNode = ProxyDomNode | JSXNode[] | (() => JSXNode) | undefined;
