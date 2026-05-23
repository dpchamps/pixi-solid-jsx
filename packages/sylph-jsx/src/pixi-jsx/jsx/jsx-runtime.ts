import {
  PixiNodeProps,
  UnknownNodeProps,
  TextIntrinsicProps,
  ContainerIntrinsicProps,
  ApplicationIntrinsicProps,
  SpriteIntrinsicProps,
  GraphicsIntrinsicProps,
  RenderLayerIntrinsicProps,
  JSXNode,
  Ref,
} from "./jsx-node.js";

export * from "../solidjs-universal-renderer/index.js";

type TextProps = TextIntrinsicProps;
type ContainerProps = ContainerIntrinsicProps;
type ApplicationProps = ApplicationIntrinsicProps;
type SpriteProps = SpriteIntrinsicProps;
type GraphicsProps = GraphicsIntrinsicProps;
type RenderLayerProps = RenderLayerIntrinsicProps;

export {
  type JSXNode,
  type PixiNodeProps,

  /** @deprecated Prefer {@link TextProps} */
  type TextIntrinsicProps,
  /** @deprecated Prefer {@link ContainerProps} */
  type ContainerIntrinsicProps,
  /** @deprecated Prefer {@link ApplicationProps} */
  type ApplicationIntrinsicProps,
  /** @deprecated Prefer {@link SpriteProps} */
  type SpriteIntrinsicProps,
  /** @deprecated Prefer {@link GraphicsProps} */
  type GraphicsIntrinsicProps,
  /** @deprecated Prefer {@link RenderLayerProps} */
  type RenderLayerIntrinsicProps,
  type Ref,
  type TextProps,
  type ContainerProps,
  type ApplicationProps,
  type SpriteProps,
  type GraphicsProps,
  type RenderLayerProps,
};

// Reference: https://www.typescriptlang.org/docs/handbook/jsx.html#type-checking

export namespace JSX {
  export interface IntrinsicElements {
    text: TextIntrinsicProps;
    container: ContainerIntrinsicProps;
    application: ApplicationIntrinsicProps;
    sprite: SpriteIntrinsicProps;
    graphics: GraphicsIntrinsicProps;
    "render-layer": RenderLayerIntrinsicProps;
  }

  export type Element = JSXNode;

  export interface ElementChildrenAttribute {
    children: {};
  }

  export type PixieNodeProps<T extends UnknownNodeProps = {}> =
    PixiNodeProps<T>;
}
