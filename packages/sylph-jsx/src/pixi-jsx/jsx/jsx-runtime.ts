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
} from "./jsx-node.js";

export * from "../solidjs-universal-renderer/index.js";

export {
  type JSXNode,
  type PixiNodeProps,
  type TextIntrinsicProps,
  type ContainerIntrinsicProps,
  type ApplicationIntrinsicProps,
  type SpriteIntrinsicProps,
  type GraphicsIntrinsicProps,
  type RenderLayerIntrinsicProps,
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
