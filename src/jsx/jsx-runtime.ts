import {
    PixiNodeProps,
    UnknownNodeProps,
    TextIntrinsicProps,
    ContainerIntrinsicProps,
    ApplicationIntrinsicProps,
    SpriteIntrinsicProps,
    RuntimeTextNode,
    RuntimeContainerNode,
    RuntimeApplicationNode,
    BuildablePixiJsxNode, RuntimeSpriteNode
} from "./jsx-node.ts";

namespace JSX {
    export type IntrinsicElements = {
        text: TextIntrinsicProps
        container: ContainerIntrinsicProps,
        application: ApplicationIntrinsicProps,
        sprite: SpriteIntrinsicProps
    }

    export type Element = BuildablePixiJsxNode

    export type PixieNodeProps<T extends UnknownNodeProps = {}> = PixiNodeProps<T>
}

export type {JSX}

export const createNode = (tag: keyof JSX.IntrinsicElements|string) => {
    switch (tag){
        case "text": return RuntimeTextNode();
        case "container": return RuntimeContainerNode();
        case "application": return RuntimeApplicationNode();
        case "sprite": return RuntimeSpriteNode();
        default: {
            throw new Error(`Received Invalid Tag ${tag}`)
        }
    }
}