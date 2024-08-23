import {expectNode, ProxyDomNode, ProxyNode} from "./Node.ts";
import {Text} from "pixi.js";


export class TextNode extends ProxyNode<"text", Text, ProxyDomNode> {

    static create() {
        return new TextNode("text", new Text())
    }

    addChildProxy(node: ProxyDomNode): void {
        expectNode(node, "raw", `unexpect tag for text`);
        const nextText = this.children.reduce(
            (acc, el) => `${acc}${el.container}`,
            ""
        );
        const value = `${nextText}${node.container}`
        this.container.text = value;
    }

    override addChildProxyUntracked(_untracked: Text) {
        throw new Error("cannot add untracked child to text")
    }

    removeChildProxy(proxied: ProxyDomNode) {
        const nextText = this.children.reduce(
            (acc, el) => {
                if(proxied.id === el.id) return acc;
                return `${acc}${el.container}`
            },
            ""
        );

        this.container.text = nextText;
    }
}