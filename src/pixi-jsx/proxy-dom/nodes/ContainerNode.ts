import {expectNodeNot, ProxyDomNode, ProxyNode} from "./Node.ts";
import {Application, Container} from "pixi.js";

export class ContainerNode extends ProxyNode<'container', Container, ProxyDomNode> {
    static create(){
        return new ContainerNode("container", new Container());
    }

    addChildProxy(node: ProxyDomNode, anchor?: ProxyDomNode) {
        expectNodeNot(node, "unexpected child to container", "application", "html");
        if(node.tag === 'raw') return;
        // find the index of the next nonraw node from anchor
        const anchorIndex = anchor ? this.children.findIndex((childNode) => childNode.id === anchor.id) : -1;
        const insertIndex = anchor ? this.children.findIndex((childNode, idx) => childNode.tag !== "raw" && idx >= anchorIndex) : -1;
        const finalIndex = insertIndex === -1 ? this.container.children.length : insertIndex !== anchorIndex ? insertIndex-1 : insertIndex;

        this.container.addChildAt(node.container,finalIndex);
    }

    removeChildProxy(proxied: ProxyDomNode) {
        expectNodeNot(proxied, "unexpected child to container on removal (this is an invariant state)", "application", "html");
        if(proxied.tag === 'raw') return;
        this.container.removeChild(proxied.container);
    }

    override addChildProxyUntracked(untracked: Container) {
        this.container.addChild(untracked);
        this.untrackedChildren.push(untracked)
    }

    override removeChildProxyUntracked(untracked: Container) {
        this.container.removeChild(untracked);
        this.untrackedChildren = this.untrackedChildren.filter(x => x.uid!==untracked.uid);
    }

    override syncUntracked() {
        for(const untracked of this.untrackedChildren){
            if(!this.container.children.includes(untracked)){
                this.container.children.push(untracked);
            }
        }
    }
}