import {intoArray, is, isDefined, isSome, Maybe, UnknownRecord, unreachable} from "../utility-types.ts";
import {
    FunctionComponent,
    JSXNode,
    PixiNodeProps,
    UnknownNodeProps,
    RuntimeNode,
    RuntimeTextNode,
    PixieJsxNode,
    TextIntrinsicProps,
    TextIntrinsic,
    ContainerIntrinsicProps,
    ContainerIntrinsic,
    ApplicationIntrinsicProps, ApplicationIntrinsic, SpriteIntrinsicProps, SpriteIntrinsic
} from "./jsx-node.ts";

namespace JSX {
    export type IntrinsicElements = {
        text: TextIntrinsicProps
        container: ContainerIntrinsicProps,
        application: ApplicationIntrinsicProps,
        sprite: SpriteIntrinsicProps
    }

    export type Element = RuntimeNode

    export type PixieNodeProps<T extends UnknownNodeProps = {}> = PixiNodeProps<T>
}

export type {JSX}
x``
export const jsx = renderJsx;
export const jsxs = renderJsx;
export const jsxDEV =  renderJsx;

export function renderJsx<T extends UnknownRecord>(
    tag: Maybe<FunctionComponent | keyof JSX.IntrinsicElements>,
    props: JSX.PixieNodeProps<T>,
    _key?: string
): JSX.Element {
    if(is(tag, "function")) return renderJsxNode(tag(props));
    if(is(tag, "string")) return renderTag(tag, props);

    return PixieJsxNode(undefined, renderChildren(props));
}

export const Fragment = <T extends UnknownNodeProps>(props: JSX.PixieNodeProps<T>) => PixieJsxNode(undefined, renderChildren(props))

const renderTag = <P extends UnknownNodeProps>(tag: keyof JSX.IntrinsicElements, props: JSX.PixieNodeProps<P>) => {
    switch (tag){
        case "text": return TextIntrinsic({...props});
        case "container": return ContainerIntrinsic({...props, children: renderChildren(props)});
        case "application": return ApplicationIntrinsic({...props, children: renderChildren(props)});
        case "sprite": return SpriteIntrinsic({...props, children: renderChildren(props)})
        default: return unreachable(tag)
    }
}

const renderChildren = <P extends UnknownNodeProps>(props: JSX.PixieNodeProps<P>) =>
    isDefined(props.children) ? intoArray(props.children).map(renderJsxNode) : []

const renderJsxNode = (jsxNode: JSXNode): RuntimeNode => {
    if(is(jsxNode, "function")) return renderJsxNode(jsxNode());
    if(isSome(jsxNode, "string", "number")) return RuntimeTextNode({text: jsxNode});
    return jsxNode;
}