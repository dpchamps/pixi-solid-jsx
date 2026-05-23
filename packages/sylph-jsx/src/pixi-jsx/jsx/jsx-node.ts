import { UnknownRecord } from "../../utility-types.js";
import {
  TextOptions,
  ApplicationOptions,
  ContainerOptions,
  SpriteOptions,
  GraphicsOptions,
  Application,
  Ticker,
  RenderLayer,
} from "pixi.js";
import {
  ApplicationNode,
  ContainerNode,
  ProxyDomNode,
  SpriteNode,
  TextNode,
  GraphicsNode,
  RenderLayerNode,
} from "../proxy-dom/index.js";
import { Setter } from "../solidjs-universal-renderer/index.js";

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

/**
 * Use this to get handle into a ref type, instead of exposing direct container types.
 *
 * Example usage:
 *
 * ```typescript
 *  const [graphics, setGraphics] = createSignal<Ref<GraphicsProps>>();
 * ```_
 */
export type Ref<Intrinsic extends PixiNodeProps> =
  Intrinsic extends PixiNodeProps<{}, infer T, any> ? T : never;

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
>;

export type JSXNode = ProxyDomNode | JSXNode[] | (() => JSXNode) | undefined;
