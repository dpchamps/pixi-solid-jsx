import {ProxyDomNode, ProxyNode} from "./Node.ts";
import {Application, Graphics} from "pixi.js";

export class GraphicsNode extends ProxyNode<"graphics", Graphics  , ProxyDomNode> {
    static create() {
        return new GraphicsNode('graphics', new Graphics());
    }

    addChildProxy(node: ProxyDomNode) {
        throw new Error(`cannot add child to sprite node (id: ${this.id}), got: ${node.tag}`);
    }

    removeChildProxy(node: ProxyDomNode) {
        throw new Error(`invariant state: cannot remove child from sprite node (id: ${this.id}), got: ${node.tag}`);
    }

    override addChildProxyUntracked(_untracked: Graphics) {
        throw new Error("cannot add untracked child to graphics")
    }

    override removeChildProxyUntracked(_untracked: Graphics) {
        throw new Error("cannot remove an untracked child from graphics")
    }
}