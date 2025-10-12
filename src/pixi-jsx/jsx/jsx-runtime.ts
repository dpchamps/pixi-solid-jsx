import {
  PixiNodeProps,
  UnknownNodeProps,
  TextIntrinsicProps,
  ContainerIntrinsicProps,
  ApplicationIntrinsicProps,
  SpriteIntrinsicProps,
  JSXNode,
  GraphicsIntrinsicProps,
} from "./jsx-node.ts";

// Reference: https://www.typescriptlang.org/docs/handbook/jsx.html#type-checking

namespace JSX {
  export type IntrinsicElements = {
    text: TextIntrinsicProps;
    container: ContainerIntrinsicProps;
    application: ApplicationIntrinsicProps;
    sprite: SpriteIntrinsicProps;
    graphics: GraphicsIntrinsicProps;
  };

  export type Element = JSXNode;

  export type ElementChildrenAttribute = {
    children: {};
  };

  export type PixieNodeProps<T extends UnknownNodeProps = {}> =
    PixiNodeProps<T>;
}

export type { JSX };
