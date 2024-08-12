import {intoArray, Maybe, UnknownRecord} from "../utility-types.ts";
import {RuntimeNode, withRuntime} from "./jsx-core-runtime.ts";
import {
    Application,
    ApplicationOptions,
    Container,
    ContainerOptions,
    Text,
    TextOptions
} from "pixi.js";
import {withChild} from "jsx-runtime/node-utilities.ts";


export type ContainerClass = typeof Container;
export type ApplicationClass = typeof Application;

export {type RuntimeNode} from "./jsx-core-runtime.ts";
export type UnknownNodeProps = Record<string, unknown>;
export type PixiNodeProps<T extends UnknownRecord = {}> = T & ChildPropType & ClassType;
export type PixiNodePropsIntrinsic<T extends UnknownNodeProps = {}> = T & ChildPropIntrinsicType & ClassType;
export type RawNode = string | number

export type Children<T = never> = Maybe<(RuntimeNode)[] | RuntimeNode | T>;
export type ChildPropType = {children?: Children};
export type ChildPropIntrinsicType = {children?: Children<RawNode>};

export type ClassType = {class?: string | undefined};


export type JSXNode =
    | RuntimeNode
    | (() => JSXNode)
    | RawNode

export type FunctionComponent = <T extends UnknownNodeProps>(props: T) => JSXNode


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

const ApplicationRuntimeNode = <T extends ApplicationClass>(node: T, options?: Partial<ApplicationOptions>) =>
    withRuntime(() => new node(), options)

export const RuntimeTextNode = <T extends TextOptions>(textOptions?: T) => RuntimeNode(Text, textOptions)

export const RuntimeContainerNode = <T extends ContainerOptions>(containerOptions?: T) => RuntimeNode(Container, containerOptions);


export const RuntimeApplicationNode = <T extends Partial<ApplicationOptions>>(applicationOptions?: T) => ApplicationRuntimeNode(Application, applicationOptions)

export const PixieJsxNode = <P extends ContainerOptions>(args?: P, children?: Maybe<RuntimeNode[]>) =>
    runtimeNodeOfChildren(Container, [args], children);


export * from "./intrinsic-nodes.ts"