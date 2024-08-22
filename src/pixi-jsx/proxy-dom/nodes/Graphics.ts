import {ProxyDomNode, ProxyNode} from "./Node.ts";
import {Graphics} from "pixi.js";

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
}