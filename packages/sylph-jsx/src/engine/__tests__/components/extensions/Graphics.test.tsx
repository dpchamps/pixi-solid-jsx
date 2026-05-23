import { describe, expect, test, vi } from "vitest";
import {
  createSignal,
  Show,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { Container, Graphics as PixiGraphics } from "pixi.js";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import { GraphicsBuilder } from "../../../components/extensions/Graphics.jsx";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;

const getRenderedGraphics = (stage: Container) => {
  const root = getSceneRoot(stage);
  const graphics = root.children[0];

  expect(graphics).toBeInstanceOf(PixiGraphics);
  return graphics as PixiGraphics;
};

describe("GraphicsBuilder", () => {
  test("renders a Pixi Graphics node", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <GraphicsBuilder graphicsBuilder={() => undefined} />,
    );

    const graphics = getRenderedGraphics(stage);
    expect(graphics.parent).toBe(getSceneRoot(stage));

    await ticker.tickFrames(1);
    dispose();
  });

  test("invokes the builder with the rendered Pixi Graphics instance on the next frame", async () => {
    const builder = vi.fn((graphics: PixiGraphics) => {
      graphics.label = "built";
      graphics.rect(0, 0, 20, 10);
      graphics.fill(0xff00ff);
    });

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <GraphicsBuilder graphicsBuilder={builder} />,
    );

    const graphics = getRenderedGraphics(stage);
    expect(builder).not.toHaveBeenCalled();

    await ticker.tickFrames(1);

    expect(builder).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledWith(graphics);
    expect(graphics.label).toBe("built");
    expect(graphics.width).toBe(20);
    expect(graphics.height).toBe(10);

    dispose();
  });

  test("reactively runs a new builder when the builder prop changes", async () => {
    const firstBuilder = vi.fn((graphics: PixiGraphics) => {
      graphics.label = "first";
    });
    const secondBuilder = vi.fn((graphics: PixiGraphics) => {
      graphics.label = "second";
    });
    const [useSecondBuilder, setUseSecondBuilder] = createSignal(false);

    const TestComponent = () => (
      <GraphicsBuilder
        graphicsBuilder={
          useSecondBuilder() ? secondBuilder : firstBuilder
        }
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );
    const graphics = getRenderedGraphics(stage);

    await ticker.tickFrames(1);
    expect(firstBuilder).toHaveBeenCalledTimes(1);
    expect(secondBuilder).not.toHaveBeenCalled();
    expect(graphics.label).toBe("first");

    setUseSecondBuilder(true);
    await ticker.tickFrames(1);

    expect(firstBuilder).toHaveBeenCalledTimes(1);
    expect(secondBuilder).toHaveBeenCalledTimes(1);
    expect(secondBuilder).toHaveBeenCalledWith(graphics);
    expect(graphics.label).toBe("second");

    dispose();
  });

  test("removed graphics nodes leave the Pixi scene graph and no longer run builders", async () => {
    const builder = vi.fn((graphics: PixiGraphics) => {
      graphics.label = "visible";
    });
    const [visible, setVisible] = createSignal(true);
    const [builderVersion, setBuilderVersion] = createSignal(0);

    const TestComponent = () => (
      <Show when={visible()}>
        <GraphicsBuilder
          graphicsBuilder={(graphics) => {
            builderVersion();
            builder(graphics);
          }}
        />
      </Show>
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );
    const root = getSceneRoot(stage);

    await ticker.tickFrames(1);
    expect(root.children.length).toBe(1);
    expect(builder).toHaveBeenCalledTimes(1);

    setVisible(false);
    await ticker.tickFrames(1);

    expect(root.children.length).toBe(0);

    setBuilderVersion(1);
    await ticker.tickFrames(1);

    expect(builder).toHaveBeenCalledTimes(1);
    dispose();
  });
});
