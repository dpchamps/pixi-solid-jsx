import {expectNode, ProxyDomNode, ProxyNode} from "./Node.ts";
import {Application, Text} from "pixi.js";
import {isDefined} from "../../../utility-types.ts";


export class TextNode extends ProxyNode<"text", Text, ProxyDomNode> {
    static create() {
        return new TextNode("text", new Text())
    }

    addChildProxy(node: ProxyDomNode, anchor?: ProxyDomNode): void {
        expectNode(node, "raw", `unexpect tag for text`);
        const nextText = this.children.reduce(
            (acc, el, idx, arr) => {
                if(isDefined(anchor) && el.id === anchor.id && node.id === anchor.id) {
                    return `${acc}${node.container}`
                } else if (isDefined(anchor) && el.id === anchor.id) {
                    return `${acc}${node.container}${el.container}`
                } else {
                    return `${acc}${el.container}`;
                }
            },
            ""
        );
        const value = isDefined(anchor) ? nextText : `${nextText}${node.container}`

        this.container.text = value;
    }

    override addChildProxyUntracked(_untracked: Text) {
        throw new Error("cannot add untracked child to text")
    }

    override removeChildProxyUntracked(_untracked: Text) {
        throw new Error("cannot remove an untracked child from Text")
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