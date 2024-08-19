import {assert, invariant, Maybe} from "../../../utility-types.ts";
import {Application, Container, Sprite, Text} from "pixi.js";

export type ProxyDomNode =
    | IProxyNode<'application', Application, ProxyDomNode>
    | IProxyNode<'html', HTMLElement, ProxyDomNode>
    | IProxyNode<'text', Text, ProxyDomNode>
    | IProxyNode<'container', Container, ProxyDomNode>
    | IProxyNode<'raw', string, ProxyDomNode>
    | IProxyNode<'sprite', Sprite, ProxyDomNode>

interface GenericNode extends IProxyNode<any, any, any>{}

interface IProxyNode<Tag extends string, Container, NodeType extends GenericNode> {
    id: number,
    tag: Tag,
    container: Container,

    addChild: (node: NodeType) => void,
    removeChild: (node: NodeType) => void,
    getParent: () => Maybe<NodeType>,
    getChildren: () => Array<NodeType>
    setParent: (parent: NodeType) => void,
    setProp: <PropType>(name: string, value: PropType, prev: Maybe<PropType>) => void
}

export function expectNode<Node extends ProxyDomNode, Tag extends ProxyDomNode['tag']>(node: Node, tag: Tag, context: string): asserts node is Extract<Node, {tag: Tag}> {
    assert(node.tag === tag, `${context}. unexpected node: expected ${tag}, got ${node.tag}`);
}

export function expectNodeNot<Node extends ProxyDomNode, Tag extends ProxyDomNode['tag']>(node: Node, context: string, ...tags: Tag[]): asserts node is Exclude<Node, {tag: Tag}> {
    if(tags.some((tag) => node.tag === tag)){
        throw new Error(`${context}. unexpected node ${node.tag}. cannot be: ${tags.join(",")}`)
    }
}

// Bad foo for now
let _id = 0;
const getId = () => ++_id;

export abstract class ProxyNode<Tag extends string, Container, NodeType extends GenericNode> implements GenericNode {
    readonly tag: Tag;
    readonly container: Container;
    readonly id: number;

    protected parent: Maybe<NodeType> = null;
    protected children: NodeType[] = [];
    protected proxiedChildren: NodeType[] = [];

    protected constructor(tag: Tag, container: Container) {
        this.tag = tag;
        this.container = container;
        this.id = getId();
    }

    private addChildWithProxy(child: NodeType, proxiedChild: NodeType){
        this.children.push(child);
        this.proxiedChildren.push(proxiedChild);
        child.setParent(this);
    }

    abstract addChildProxy(child: NodeType): NodeType|void

    addChild(node: NodeType) {
        const proxied = this.addChildProxy(node);
        this.addChildWithProxy(node, proxied || node);
    }

    getChildren() {
        return this.children;
    }

    getParent() {
        return this.parent;
    }

    private removeChildBase(node: NodeType){
        const index = this.children.findIndex((child) => child.id === node.id);
        assert(index > -1, "Attempted to remove a child that did not exist. This is a runtime error that cannot be recovered from");
        const childElement = this.children[index];
        const proxiedChild = this.proxiedChildren[index];
        invariant(childElement);
        invariant(proxiedChild);
        this.children.splice(index, 1);
        this.proxiedChildren.splice(index,1);

        return proxiedChild;
    }

    abstract removeChildProxy(node: NodeType): void;

    removeChild(node: NodeType){
        const proxiedChild = this.removeChildBase(node);
        this.removeChildProxy(proxiedChild);
    }

    setParent(parent: NodeType): void {
        this.parent = parent
    }

    setProp<T>(name: string, value: T, _prev: Maybe<T>): void {
        if(typeof this.container === "object" && this.container !== null){
            Reflect.set(this.container, name, value);
        }
    }
}