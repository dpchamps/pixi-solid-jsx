import {assert, invariant, isDefined, Maybe, unimplemented, UnknownRecord} from "../utility-types.ts";
import {
    Application,
    Container, TextOptions, ApplicationOptions, Text, ContainerOptions, Sprite, SpriteOptions,
} from "pixi.js";


export type ContainerClass = typeof Container;
export type ApplicationClass = typeof Application;

export type UnknownNodeProps = Record<string, unknown>;
export type PixiNodeProps<T extends UnknownRecord = {}> = T & ChildPropType & ClassType;
export type PixiNodePropsIntrinsic<T extends UnknownNodeProps = {}, RefValue = unknown> = T & ChildPropIntrinsicType & ClassType & RefType<RefValue>;
export type RawNode = string | number

export type Children<T = never> = Maybe<(PixiJsxNode)[] | PixiJsxNode | T>;
export type ChildPropType = {children?: Children};
export type ChildPropIntrinsicType = {children?: Children<RawNode>};
export type RefType<RefValue> = {ref?: Maybe<RefValue> | ((e: Maybe<RefValue>) => void)}

export type ClassType = {class?: string | undefined};
export type PixiJsxNode = Container

export type BuildablePixiJsxNode =
    | BuildableApplicationNode
    | BuildableContainerNode
    | BuildableTextNode
    | BuildableRawTextNode
    | BuildableHTMLElementNode
    | BuildableSpriteNode

export type BuildableNode<Tag extends string, Container> = {
    tag: Tag,
    id: number,
    container: Container
    addChild: (node: BuildablePixiJsxNode) => void,
    getParent: () => BuildablePixiJsxNode|undefined,
    getChildren: () => BuildablePixiJsxNode[],
    setParent: (parent: BuildablePixiJsxNode) => void;
    setProp: <T>(name: string, value: T, prev: Maybe<T>) => void,
}

export type BuildableApplicationNode = BuildableNode<'application', Application> & {initializationProps: Partial<ApplicationOptions>, initialize: () => Promise<void>};
export type BuildableContainerNode = BuildableNode<'container', Container>;
export type BuildableTextNode = BuildableNode<'text', Text>;
export type BuildableRawTextNode = BuildableNode<'raw', string|number>
export type BuildableHTMLElementNode = BuildableNode<'html', HTMLElement>
export type BuildableSpriteNode = BuildableNode<'sprite', Sprite>

export type JSXNode =
    | PixiJsxNode
    | (() => JSXNode)
    | RawNode

export type FunctionComponent = <T extends UnknownNodeProps>(props: T) => JSXNode

const createId = () => Math.floor(Math.random() * 10000);

export const RuntimeApplicationNode = (): BuildableApplicationNode => {
    const application = new Application();
    const props: Record<string, unknown> = {};
    let root: Maybe<BuildablePixiJsxNode> = null;
    const children: BuildablePixiJsxNode[] = [];
    const id = createId();
    
    return {
        tag: "application",
        container: application,
        get id(){ return id},
        addChild: (node: BuildablePixiJsxNode) => {
            assert(node.tag !== "application" && node.tag !== 'html', `unexpected node as child to application: ${node.tag}`);
            const child = node.tag === "raw" ? new Text({text:node.container}) : node.container;

            application.stage.addChild(child);
            children.push(node);
        },
        setProp: (name, value) => {
            props[name] = value;
        },
        get initializationProps(){
            return props;
        },
        setParent: (element) => {
            root = element
        },
        getChildren: () => children,
        initialize: async () => {
            invariant(root, `Cannot initialize application before root has been appended`);
            assert(root.tag === "html", `Received an unexpected parent for Application: ${root.tag}. Expected html`);
            await application.init(props);
            root.container.appendChild(application.canvas);
        },
        getParent: () => isDefined(root) ? root : undefined
    };
}

export const RuntimeHTMLElementNode = (element: HTMLElement): BuildableHTMLElementNode => {
    const children: BuildablePixiJsxNode[] = [];
    const id = createId();


    return {
        tag: "html",
        container: element,
        get id(){ return id},
        addChild(child: BuildablePixiJsxNode){
            assert(child.tag === "application", "Application must be inserted into HTMLElement");
            child.setParent(this);
            children.push(child);
        },
        setParent: (parent) => {
            return unimplemented(parent)
        },
        getParent: () => {
            return unimplemented()
        },
        getChildren: () => children,
        setProp: (name, value) => {
            return unimplemented(name, value)
        }
    };
}

export const RuntimeTextNode = <T extends TextOptions>(textOptions?: T): BuildableTextNode => {
    const textNode = new Text(textOptions);
    let parent: Maybe<BuildablePixiJsxNode> = null;
    const children: BuildablePixiJsxNode[] = [];
    const id = createId();

    return {
        tag: "text",
        container: textNode,
        get id(){ return id },
        addChild(node: BuildablePixiJsxNode){
            assert(node.tag === "raw", `unexpected tag for text: ${node.tag}`);
            textNode.text += node.container;
            node.setParent(this);
            children.push(node);
        },
        setParent: (node) => {
            parent = node
        },
        getParent: () => isDefined(parent) ? parent : undefined,
        getChildren: () => children,
        setProp: (name, value) => {
            (textNode as any)[name] = value
        }
    }
}

export const RuntimeContainerNode = <T extends ContainerOptions>(containerOptions?: T): BuildableContainerNode => {
    const container = new Container(containerOptions);
    let parent: Maybe<BuildablePixiJsxNode> = null;
    const children: BuildablePixiJsxNode[] = [];
    const id = createId();

    return {
        tag: "container",
        container,
        get id(){ return id},
        addChild(node: BuildablePixiJsxNode){
            assert(node.tag !== "application" && node.tag !== "html" && node.tag !== "raw", `unexpected node as child to container: ${node.tag}`);
            node.setParent(this);
            container.addChild(node.container);
            children.push(node);
        },
        setParent: (node) => {
            parent = node
        },
        getParent: () => isDefined(parent) ? parent : undefined,
        getChildren: () => children,
        setProp: (name, value) => {
            (container as any)[name] = value
        }
    }
}

export const RuntimeRawNode = (value: string): BuildableRawTextNode => {
    let parent: Maybe<BuildablePixiJsxNode> = null;
    const id = createId();

    return {
        tag: "raw",
        container: value,
        get id(){ return id},
        addChild: (node: BuildablePixiJsxNode) => {
            unimplemented(node)
        },
        setProp: (name, value) => {
            unimplemented(name, value)
        },
        setParent: (node) => {
            parent = node
        },
        getChildren: () => {
            return unimplemented();
        },
        getParent: () => isDefined(parent) ? parent : undefined,
    }
}


export const RuntimeSpriteNode = (spriteOptions?: SpriteOptions): BuildableSpriteNode => {
    const sprite = new Sprite(spriteOptions);
    let parent: Maybe<BuildablePixiJsxNode> = null;
    const id = createId();

    return {
        tag: "sprite",
        container: sprite,
        get id(){ return id},
        addChild: (_) => {
            throw new Error(`sprite does not take children`)
        },
        setProp: (name, value) => {
            Reflect.set(sprite, name, value);
        },
        setParent: (node) => {
            parent = node;
        },
        getChildren: () => {
            throw new Error(`sprite does not take children`)
        },
        getParent: () => isDefined(parent) ? parent : undefined
    }
};


export * from "./intrinsic-nodes.ts"