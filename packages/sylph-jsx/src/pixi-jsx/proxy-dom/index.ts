import { TextNode } from "./nodes/TextNode.js";
import { ContainerNode } from "./nodes/ContainerNode.js";
import { ApplicationNode } from "./nodes/ApplicationNode.js";
import { SpriteNode } from "./nodes/SpriteNode.js";
import { GraphicsNode } from "./nodes/Graphics.js";
import { RenderLayerNode } from "./nodes/RenderLayerNode.js";

export { RawNode } from "./nodes/RawNode.js";
export { HtmlElementNode } from "./nodes/HtmlElementNode.js";
export { type ProxyDomNode } from "./nodes/types.js";

export * from "./nodes/TextNode.js";
export * from "./nodes/ContainerNode.js";
export * from "./nodes/ApplicationNode.js";
export * from "./nodes/SpriteNode.js";
export * from "./nodes/RenderLayerNode.js";

export const createProxiedPixieContainerNode = (tag: string) => {
  switch (tag) {
    case "text":
      return TextNode.create();
    case "container":
      return ContainerNode.create();
    case "application":
      return ApplicationNode.create();
    case "sprite":
      return SpriteNode.create();
    case "graphics":
      return GraphicsNode.create();
    case "render-layer":
      return RenderLayerNode.create();
    default: {
      throw new Error(`Received Invalid Tag ${tag}`);
    }
  }
};
