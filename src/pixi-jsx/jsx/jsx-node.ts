import {assert, invariant, Maybe, UnknownRecord} from "../../utility-types.ts";
import {
    Application,
    Container, TextOptions, ApplicationOptions, Text, ContainerOptions, Sprite, SpriteOptions,
} from "pixi.js";
import {buildableNode} from "./buildable-node.ts";


export type ContainerClass = typeof Container;
export type ApplicationClass = typeof Application;

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
    removeChild: (node: BuildablePixiJsxNode) => void,
    getParent: () => BuildablePixiJsxNode|undefined,
    getChildren: () => BuildablePixiJsxNode[],
    setParent: (parent: BuildablePixiJsxNode) => void;
    setProp: <T>(name: string, value: T, prev: Maybe<T>) => void,
}

export type BuildableApplicationNode = BuildableNode<'application', Application> & {initializationProps: () => Partial<ApplicationOptions>, initialize: () => Promise<void>};
export type BuildableContainerNode = BuildableNode<'container', Container>;
export type BuildableTextNode = BuildableNode<'text', Text>;
export type BuildableRawTextNode = BuildableNode<'raw', string|number>
export type BuildableHTMLElementNode = BuildableNode<'html', HTMLElement>
export type BuildableSpriteNode = BuildableNode<'sprite', Sprite>

type IntrinsicProps<Options,  RefType = unknown, OptionsToOmit extends keyof Options = never> = PixiNodePropsIntrinsic<Partial<Omit<Options, OptionsToOmit | "children">>, RefType>

export type TextIntrinsicProps = IntrinsicProps<TextOptions, BuildableTextNode, "text">;

export type ContainerIntrinsicProps = IntrinsicProps<ContainerOptions, BuildableContainerNode>

export type ApplicationIntrinsicProps = IntrinsicProps<ApplicationOptions, BuildableApplicationNode>;

export type SpriteIntrinsicProps = IntrinsicProps<SpriteOptions, BuildableSpriteNode>;

export type JSXNode =
    | PixiJsxNode
    | (() => JSXNode)
    | RawNode

export const RuntimeApplicationNode = (): BuildableApplicationNode => {
    const application = new Application();
    const initializationProps: Record<string, unknown> = {};
    return buildableNode({
        tag: "application",
        container: application,
        onAddChild: (node) => {
            assert(node.tag !== "application" && node.tag !== 'html', `unexpected node as child to application: ${node.tag}`);
            const child = node.tag === "raw" ? RuntimeTextNode({text: node.container}) : node;
            application.stage.addChild(child.container)
            return child
        },
        onRemoveChild: (child) => {
            assert(child.tag !== "raw" && child.tag !== 'html' && child.tag !== "application", `unexpected node as child to application: ${child.tag}`);
            application.stage.removeChild(child.container);
        },
        setProp: (name, value) => {
            initializationProps[name] = value
        },
        initializationProps: () => initializationProps,
        async initialize() {
            const root = this.getParent?.();
            invariant(root, `Cannot initialize application before root has been appended`);
            assert(root.tag === "html", `Received an unexpected parent for Application: ${root.tag}. Expected html`);
            await application.init(initializationProps);
            root.container.appendChild(application.canvas);
        },
    }) as BuildableApplicationNode
}


export const RuntimeHTMLElementNode = (element: HTMLElement): BuildableHTMLElementNode => buildableNode({
    tag: "html",
    container: element,
    onAddChild: (child) => {
        assert(child.tag === "application", "Application must be inserted into HTMLElement");
        return child;
    },
    onRemoveChild: (child) => {
        assert(child.tag === "application", "Application must be inserted into HTMLElement");
        if(child.container.canvas){
            element.removeChild(child.container.canvas);
        }
    }
})


export const RuntimeTextNode = <T extends TextOptions>(textOptions?: T): BuildableTextNode => {
    const textNode = new Text(textOptions);

    return buildableNode({
        tag: "text",
        container: textNode,
        onAddChild: (node, children) => {
            assert(node.tag === "raw", `unexpected tag for text: ${node.tag}`);
            textNode.text = `${[...children, node].map(({container}) => container).join("")}`;
            return node;
        },
        onRemoveChild: (node, children) => {
            textNode.text = children.filter(x => x.id !== node.id).map(({container}) => container).join("")
        },
    })
}

export const RuntimeContainerNode = <T extends ContainerOptions>(containerOptions?: T): BuildableContainerNode => {
    const container = new Container(containerOptions);

    return buildableNode({
        tag: "container",
        container,
        onAddChild: (node) => {
            assert(node.tag !== "application" && node.tag !== "html" && node.tag !== "raw", `unexpected node as child to container: ${node.tag}`);
            container.addChild(node.container);
            return node;
        },
        onRemoveChild: (node) => {
            assert(node.tag !== "application" && node.tag !== "html" && node.tag !== "raw", `unexpected node as child to container: ${node.tag}`);
            container.removeChild(node.container)
        }
    })
}

export const RuntimeRawNode = (value: string): BuildableRawTextNode => buildableNode({
    tag: "raw",
    container: value,
    onAddChild: (_) => {
        throw new Error(`cannot add a child to a raw node`);
    },
    onRemoveChild: (_) => {
        throw new Error(`cannot remove a child from a raw node`);
    }
})

export const RuntimeSpriteNode = (spriteOptions?: SpriteOptions): BuildableSpriteNode => {
    const sprite = new Sprite(spriteOptions);

    return buildableNode({
        tag: "sprite",
        container: sprite,
        onAddChild: (_) => {
            throw new Error(`sprite does not take children`);
        },
        onRemoveChild: (_) => {
            throw new Error(`cannot remove children from sprite`)
        }
    })
}