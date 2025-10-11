import { createRoot } from "solid-js";
import { JSX } from "../jsx/jsx-runtime.ts";
import { render } from "../solidjs-universal-renderer";
import { HtmlElementNode, ProxyDomNode, ApplicationNode } from "../proxy-dom";
import { vi } from "vitest";
import { Container } from "pixi.js";

export const renderPixiScene = (jsx: () => JSX.Element): HtmlElementNode => {
  const mockElement = {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  } as unknown as HTMLElement;

  const htmlNode = HtmlElementNode.create(mockElement);
  createRoot(() => render(jsx as () => ProxyDomNode, htmlNode));

  return htmlNode;
};

export const renderApplicationNode = async (jsx: () => JSX.Element): Promise<Container> => {
  const htmlNode = renderPixiScene(() => (
    <application width={800} height={600} preference={"webgl"} autoStart={false} hello={false}>
      {jsx()}
    </application>
  ));

  const appNode = htmlNode.getChildren()[0] as ApplicationNode;
  await appNode.initialize();

  return appNode.container.stage;
};