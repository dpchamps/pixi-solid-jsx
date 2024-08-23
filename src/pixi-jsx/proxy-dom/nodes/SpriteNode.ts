import {ProxyDomNode, ProxyNode} from "./Node.ts";
import {Sprite} from "pixi.js";

export class SpriteNode extends ProxyNode<"sprite", Sprite  , ProxyDomNode> {
    static create() {
        return new SpriteNode('sprite', new Sprite());
    }

    addChildProxy(node: ProxyDomNode) {
        throw new Error(`cannot add child to sprite node (id: ${this.id}), got: ${node.tag}`);
    }

    override addChildProxyUntracked(_untracked: Sprite) {
        throw new Error(`cannot add untracked child to sprite`);
    }

    removeChildProxy(node: ProxyDomNode) {
        throw new Error(`invariant state: cannot remove child from sprite node (id: ${this.id}), got: ${node.tag}`);
    }
}