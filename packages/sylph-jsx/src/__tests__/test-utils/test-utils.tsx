import { createRoot } from "solid-js";
import { JSX } from "../../pixi-jsx/jsx/jsx-runtime";
import { render } from "../../pixi-jsx/solidjs-universal-renderer/index";
import {
  HtmlElementNode,
  ProxyDomNode,
  ApplicationNode,
} from "../../pixi-jsx/proxy-dom";
import { vi } from "vitest";
import { Container } from "pixi.js";
import { FakeTestingTicker } from "./FakeTestingTicker";
import { Application as PixiApplication } from "pixi.js";
import { Application } from "../../engine";
import { setImmediate } from "node:timers/promises";

export const renderPixiScene = (jsx: () => JSX.Element): HtmlElementNode => {
  const mockElement = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  } as unknown as HTMLElement;

  const htmlNode = HtmlElementNode.create(mockElement);
  createRoot(() => render(jsx as () => ProxyDomNode, htmlNode));

  return htmlNode;
};

export const renderPixiSceneWithDispose = (jsx: () => JSX.Element) => {
  const mockElement = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  } as unknown as HTMLElement;

  const htmlNode = HtmlElementNode.create(mockElement);
  const dispose = render(jsx as () => ProxyDomNode, htmlNode);

  return { htmlNode, dispose };
};

export const renderApplicationNode = async (
  jsx: () => JSX.Element,
): Promise<Container> => {
  const htmlNode = renderPixiScene(() => (
    <application
      width={800}
      height={600}
      preference={"webgl"}
      autoStart={false}
      hello={false}
    >
      {jsx()}
    </application>
  ));

  const appNode = htmlNode.getChildren()[0] as ApplicationNode;

  return appNode.container.stage;
};

/**
 * Renders an Application component with a FakeTestingTicker for deterministic test control.
 * Returns both the stage and the ticker instance, allowing tests to manually advance frames.
 *
 * @param jsx - The JSX component to render inside the Application
 * @returns Object containing the stage Container and the FakeTestingTicker instance
 * @example
 * const { stage, ticker } = await renderApplicationWithFakeTicker(() => <MyComponent />);
 * ticker.tick(16.67); // Advance by one frame at 60fps
 * ticker.tickFrames(10); // Advance by 10 frames
 */
export const renderApplicationWithFakeTicker = async (
  jsx: () => JSX.Element,
): Promise<{
  stage: Container;
  ticker: FakeTestingTicker;
  dispose: () => void;
}> => {
  const ticker = new FakeTestingTicker();

  const { app, dispose } = await new Promise<{
    app: PixiApplication;
    dispose: () => void;
  }>((res) => {
    let { dispose } = renderPixiSceneWithDispose(() => (
      <Application
        preference={"webgl"}
        createTicker={() => ticker}
        appInitialize={(app) => res({ app, dispose })}
      >
        {jsx()}
      </Application>
    ));
  });
  // allow render tree to update into intialized state
  await setImmediate();

  return {
    stage: app.stage,
    ticker,
    dispose,
  };
};
