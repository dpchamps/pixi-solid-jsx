import {intoArray, Maybe, UnknownRecord} from "../utility-types.ts";
import {RuntimeNode, withRuntime} from "./core-runtime.ts";
import {Container, ContainerOptions, Text, TextOptions} from "pixi.js";


type ContainerClass = typeof Container;

export {type RuntimeNode} from "./core-runtime.ts";
export type UnknownNodeProps = Record<string, unknown>;
export type PixiNodeProps<T extends UnknownRecord> = T & ChildPropType & ClassType;

export type RawNode = string | number

export type Children = Maybe<RuntimeNode[] | RuntimeNode>;
export type ChildPropType = {children?: Children};
export type ClassType = {class?: string | undefined};


export type JSXNode =
    | RuntimeNode
    | (() => JSXNode)
    | RawNode

export type FunctionComponent = <T extends UnknownNodeProps>(props: T) => JSXNode

const withChild = (parent: RuntimeNode, child: RuntimeNode) => {
    parent.addChild(child);
    return parent;
}
const runtimeNodeOfChildren = <T extends ContainerClass, U extends ConstructorParameters<T>>(node: T, params: U, children: Children) =>
    intoArray(children).reduce(
        withChild,
        RuntimeNode(node, ...params)
    );

/**
 * @info This node is the top-level runtime type. It wraps pixi container for
 * decorating jsx-runtime stuff into it
 */
const RuntimeNode = <T extends ContainerClass, U extends ConstructorParameters<T>>(node: T, ...params: U) =>
    withRuntime(new node(...params))


export const RuntimeTextNode = <T extends TextOptions>(textOptions?: T) => RuntimeNode(Text, textOptions)

export const RuntimeContainerNode = <T extends ContainerOptions>(containerOptions?: T) => RuntimeNode(Container, containerOptions);

export const PixieJsxNode = <P extends ContainerOptions>(args?: P, children?: Maybe<RuntimeNode[]>) =>
    runtimeNodeOfChildren(Container, [args], children);


export type TextIntrinsicProps = PixiNodeProps<Partial<Omit<TextOptions, "text" | "children">>>
export const TextIntrinsic = ({children, ...props}: TextIntrinsicProps) =>
    intoArray(children).reduce(
        withChild,
        RuntimeTextNode(props)
    );

export type ContainerIntrinsicProps = PixiNodeProps<Partial<Omit<ContainerOptions, "children">>>;
export const ContainerIntrinsic = ({children, ...props}: ContainerIntrinsicProps) =>
    intoArray(children).reduce(
        withChild,
        RuntimeContainerNode(props)
    )