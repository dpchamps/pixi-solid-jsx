import {ApplicationOptions, ContainerOptions, Sprite, SpriteOptions, TextOptions} from "pixi.js";
import {assertTruthy, intoArray, isSome} from "../utility-types.ts";
import {
    PixiNodePropsIntrinsic,
    RuntimeApplicationNode,
    RuntimeContainerNode,
    RuntimeTextNode
} from "jsx-runtime/jsx-node.ts";
import {withChild} from "jsx-runtime/node-utilities.ts";

type IntrinsicProps<Options, OptionsToOmit extends keyof Options = never> = PixiNodePropsIntrinsic<Partial<Omit<Options, OptionsToOmit | "children">>>

export type TextIntrinsicProps = IntrinsicProps<TextOptions, "text">;
export const TextIntrinsic = ({children, ...props}: TextIntrinsicProps) => {
    const text = intoArray(children).reduce(
        (fragment, el) => {
            return `${fragment}${el}`;
        },
        ""
    )
    return RuntimeTextNode({...props, text})
}

export type ContainerIntrinsicProps = IntrinsicProps<ContainerOptions>
export const ContainerIntrinsic = ({children, ...props}: ContainerIntrinsicProps) =>
    intoArray(children).reduce(
        withChild,
        RuntimeContainerNode(props)
    );


export type ApplicationIntrinsicProps = IntrinsicProps<ApplicationOptions>;
export const ApplicationIntrinsic = ({children, ...props}: ApplicationIntrinsicProps) =>
    intoArray(children).reduce(
        withChild,
        RuntimeApplicationNode(props)
    )

export type SpriteIntrinsicProps = IntrinsicProps<SpriteOptions>;

export const SpriteIntrinsic = ({children, ...props}: SpriteIntrinsicProps) => {
    assertTruthy(Array.isArray(children) && children.length === 1, "One child for sprite element");
    const texture = children[0]?.texture;
    debugger
    const sprite = new Sprite({texture})

    const spriteContainer = RuntimeContainerNode();
    spriteContainer.addChild(sprite);

    return spriteContainer;
}