import {
  PixiNodeProps,
  UnknownNodeProps,
  TextIntrinsicProps,
  ContainerIntrinsicProps,
  ApplicationIntrinsicProps,
  SpriteIntrinsicProps,
  JSXNode,
  GraphicsIntrinsicProps, RenderLayerIntrinsicProps,
} from "./jsx-node.ts";

// Reference: https://www.typescriptlang.org/docs/handbook/jsx.html#type-checking

namespace JSX {
  export type IntrinsicElements = {
    text: TextIntrinsicProps;
    container: ContainerIntrinsicProps;
    application: ApplicationIntrinsicProps;
    sprite: SpriteIntrinsicProps;
    graphics: GraphicsIntrinsicProps;
    'render-layer': RenderLayerIntrinsicProps
  };

  export type Element = JSXNode;

  export type ElementChildrenAttribute = {
    children: {};
  };

  export type PixieNodeProps<T extends UnknownNodeProps = {}> =
    PixiNodeProps<T>;
}

export type { JSX };
