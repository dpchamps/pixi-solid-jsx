import {ApplicationOptions, ContainerOptions, SpriteOptions, TextOptions} from "pixi.js";
import {
    BuildableApplicationNode,
    BuildableContainerNode, BuildableSpriteNode,
    BuildableTextNode,
    PixiNodePropsIntrinsic,
} from "jsx-runtime/jsx-node.ts";

type IntrinsicProps<Options,  RefType = unknown, OptionsToOmit extends keyof Options = never> = PixiNodePropsIntrinsic<Partial<Omit<Options, OptionsToOmit | "children">>, RefType>

export type TextIntrinsicProps = IntrinsicProps<TextOptions, BuildableTextNode, "text">;

export type ContainerIntrinsicProps = IntrinsicProps<ContainerOptions, BuildableContainerNode>

export type ApplicationIntrinsicProps = IntrinsicProps<ApplicationOptions, BuildableApplicationNode>;

export type SpriteIntrinsicProps = IntrinsicProps<SpriteOptions, BuildableSpriteNode>;