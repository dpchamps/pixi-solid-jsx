import {TextNode} from "./nodes/TextNode.ts";
import {ContainerNode} from "./nodes/ContainerNode.ts";
import {ApplicationNode} from "./nodes/ApplicationNode.ts";
import {SpriteNode} from "./nodes/SpriteNode.ts";



export {RawNode} from "./nodes/RawNode.ts";
export {HtmlElementNode} from "./nodes/HtmlElementNode.ts";
export {type ProxyDomNode} from "./nodes/Node.ts";

export * from "./nodes/TextNode.ts";
export * from "./nodes/ContainerNode.ts";
export * from "./nodes/ApplicationNode.ts";
export * from "./nodes/SpriteNode.ts";


export const createProxiedPixieContainerNode = (tag: string) => {
    switch (tag){
        case "text": return TextNode.create();
        case "container": return ContainerNode.create();
        case "application": return ApplicationNode.create();
        case "sprite": return SpriteNode.create();
        default: {
            throw new Error(`Received Invalid Tag ${tag}`)
        }
    }
}

