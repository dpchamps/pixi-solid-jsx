import {expectNodeNot, ProxyDomNode, ProxyNode} from "./Node.ts";
import {Container} from "pixi.js";

export class ContainerNode extends ProxyNode<'container', Container, ProxyDomNode> {
    static create(){
        return new ContainerNode("container", new Container());
    }

    addChildProxy(node: ProxyDomNode) {
        expectNodeNot(node, "unexpected child to container", "application", "html", "raw");
        this.container.addChild(node.container);
    }

    removeChildProxy(proxied: ProxyDomNode) {
        expectNodeNot(proxied, "unexpected child to container on removal (this is an invariant state)", "application", "html", "raw");
        this.container.removeChild(proxied.container);
    }

    override addChildProxyUntracked(untracked: Container) {
        this.container.addChild(untracked);
        this.untrackedChildren.push(untracked)
    }

    override syncUntracked() {
        for(const untracked of this.untrackedChildren){
            if(!this.container.children.includes(untracked)){
                this.container.children.push(untracked);
            }
        }
    }
}