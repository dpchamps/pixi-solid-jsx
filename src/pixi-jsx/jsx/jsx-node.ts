import {Maybe, UnknownRecord} from "../../utility-types.ts";
import {
    Container, TextOptions, ApplicationOptions, ContainerOptions, SpriteOptions,
} from "pixi.js";
import {ApplicationNode, ContainerNode, ProxyDomNode, SpriteNode, TextNode} from "../proxy-dom";

export type UnknownNodeProps = Record<string, unknown>;
export type PixiNodeProps<T extends UnknownRecord = {}> = T & ChildPropType & ClassType;
export type PixiNodePropsIntrinsic<T extends UnknownNodeProps = {}, RefValue = unknown> = T & ChildPropIntrinsicType & ClassType & RefType<RefValue>;
export type RawNode = string | number

export type Children<T = never, Node = PixiJsxNode> = Maybe<(Node)[] | Node | T>;
export type ChildPropType = {children?: Children};
export type ChildPropIntrinsicType = {children?: Children<RawNode>};
export type RefType<RefValue> = {ref?: Maybe<RefValue> | ((e: Maybe<RefValue>) => void)}

export type ClassType = {class?: string | undefined};
export type PixiJsxNode = Container

type IntrinsicProps<Options,  RefType = unknown, OptionsToOmit extends keyof Options = never> = PixiNodePropsIntrinsic<Partial<Omit<Options, OptionsToOmit | "children">>, RefType>

export type TextIntrinsicProps = IntrinsicProps<TextOptions, TextNode, "text">;

export type ContainerIntrinsicProps = IntrinsicProps<ContainerOptions, ContainerNode>

export type ApplicationIntrinsicProps = IntrinsicProps<ApplicationOptions, ApplicationNode>;

export type SpriteIntrinsicProps = IntrinsicProps<SpriteOptions, SpriteNode>;

export type JSXNode = ProxyDomNode