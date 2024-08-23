import {ProxyNode, ProxyDomNode, expectNode, expectNodeNot} from "./Node.ts";
import {Application} from "pixi.js";
import {assert, invariant} from "../../../utility-types.ts";
import {TextNode} from "./TextNode.ts";

export class ApplicationNode extends ProxyNode<"application", Application, ProxyDomNode> {
    initializationProps: Record<string, unknown> = {};

    static create(){
        return new ApplicationNode("application", new Application())
    }

    override addChildProxy(node: ProxyDomNode) {
        assert(node.tag !== "application" && node.tag !== 'html', `unexpected node as child to application: ${node.tag}`);
        const child = node.tag === "raw" ? TextNode.create() : node;
        this.container.stage.addChild(child.container);
        return child;
    }

    override removeChildProxy(proxied: ProxyDomNode) {
        expectNodeNot(proxied, `unexpected node as child to application`, "raw", "html", "application");
        this.container.stage.removeChild(proxied.container);
    }

    override setProp<T>(name: string, value: T) {
        this.initializationProps[name] = value;
    }

    async initialize(){
        const root = this.getParent();
        invariant(root, `Cannot initialize application before root has been appended`);
        expectNode(root, "html", `unexpected parent for application`);
        await this.container.init(this.initializationProps);
        this.container.render();
        root.container.appendChild(this.container.canvas);
    }

    override addChildProxyUntracked(_untracked: Application) {
        throw new Error("cannot add untracked child to application")
    }
}