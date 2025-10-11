import {ProxyDomNode, ProxyNode} from "./Node.ts";


export class RawNode extends ProxyNode<"raw", string, ProxyDomNode> {
    static create(value: string) {
        return new RawNode('raw', value);
    }

    addChildProxy(node: ProxyDomNode) {
        throw new Error(`cannot add child to raw node (value: ${this.container}), got: ${node.tag}`);
    }

    removeChildProxy(node: ProxyDomNode) {
        throw new Error(`invariant state: cannot remove child from raw node (value: ${this.container}), got: ${node.tag}`);
    }

    override addChildProxyUntracked(_untracked: string) {
        throw new Error(`invariant state: cannot add untracked child to raw`);
    }

    override removeChildProxyUntracked(_untracked: string) {
        throw new Error("cannot remove an untracked child from RawNode")
    }
}