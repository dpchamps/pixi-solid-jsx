import { describe, expect, test } from "vitest";
import {
  createSignal,
  Show,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { Container, Texture } from "pixi.js";
import { ScrollBox } from "@pixi/ui";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import {
  getScrollableContentChildContainer,
  ScrollableContent,
} from "../../../components/extensions/ui/ScrollableContent.jsx";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;
const getWrapper = (stage: Container) => getSceneRoot(stage).children[0] as Container;

const getScrollBox = (stage: Container) => {
  const wrapper = getWrapper(stage);
  const scrollBox = wrapper.children[0];

  expect(scrollBox).toBeInstanceOf(ScrollBox);
  return scrollBox as ScrollBox;
};

describe("ScrollableContent", () => {
  test("wraps child containers in a Pixi UI ScrollBox with dimensions", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <ScrollableContent width={320} height={180}>
          <sprite texture={Texture.WHITE} width={40} height={20} label="first" />
          <sprite texture={Texture.WHITE} width={50} height={30} label="second" />
        </ScrollableContent>
      ),
    );

    await ticker.tickFrames(1);

    const wrapper = getWrapper(stage);
    const scrollBox = getScrollBox(stage);

    expect(wrapper.children).toHaveLength(1);
    expect(scrollBox.width).toBe(320);
    expect(scrollBox.height).toBe(180);
    expect(scrollBox.items).toHaveLength(2);
    expect(scrollBox.items[0]?.label).toBe("first");
    expect(scrollBox.items[1]?.label).toBe("second");
    expect(scrollBox.items[0]?.parent).toBe(scrollBox.list);
    expect(scrollBox.items[1]?.parent).toBe(scrollBox.list);

    dispose();
  });

  test("passes additional ScrollBox options", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <ScrollableContent
          width={100}
          height={80}
          scrollBoxOptions={{
            type: "horizontal",
            elementsMargin: 12,
            padding: 4,
            background: 0xff00ff,
          }}
        >
          <sprite texture={Texture.WHITE} width={40} height={20} label="item" />
        </ScrollableContent>
      ),
    );

    await ticker.tickFrames(1);

    const scrollBox = getScrollBox(stage);
    expect(scrollBox.width).toBe(100);
    expect(scrollBox.height).toBe(80);
    expect(scrollBox.items).toHaveLength(1);
    expect(scrollBox.scrollWidth).toBeGreaterThan(0);

    dispose();
  });

  test("throws when a child does not expose a Pixi container", () => {
    expect(() => getScrollableContentChildContainer("raw text")).toThrow(
      /ScrollableContent children must have a container property/,
    );
  });

  test("reconstructs the ScrollBox when dimensions or children change", async () => {
    const [width, setWidth] = createSignal(120);
    const [showSecond, setShowSecond] = createSignal(false);

    const TestComponent = () => (
      <ScrollableContent width={width()} height={90}>
        <sprite texture={Texture.WHITE} width={40} height={20} label="first" />
        <Show when={showSecond()}>
          <sprite texture={Texture.WHITE} width={50} height={30} label="second" />
        </Show>
      </ScrollableContent>
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const firstScrollBox = getScrollBox(stage);
    const firstChild = firstScrollBox.items[0];
    expect(firstScrollBox.width).toBe(120);
    expect(firstScrollBox.items).toHaveLength(1);

    setWidth(240);
    setShowSecond(true);
    await ticker.tickFrames(1);

    const secondScrollBox = getScrollBox(stage);
    expect(secondScrollBox).not.toBe(firstScrollBox);
    expect(firstScrollBox.destroyed).toBe(true);
    expect(secondScrollBox.width).toBe(240);
    expect(secondScrollBox.height).toBe(90);
    expect(secondScrollBox.items).toHaveLength(2);
    expect(secondScrollBox.items[0]).toBe(firstChild);
    expect(secondScrollBox.items[1]?.label).toBe("second");
    expect(getWrapper(stage).children).toEqual([secondScrollBox]);

    dispose();
  });

  test("removes the ScrollBox from the scene graph when unmounted", async () => {
    const [visible, setVisible] = createSignal(true);

    const TestComponent = () => (
      <Show when={visible()}>
        <ScrollableContent width={100} height={100}>
          <sprite texture={Texture.WHITE} width={40} height={20} label="item" />
        </ScrollableContent>
      </Show>
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );
    const root = getSceneRoot(stage);

    await ticker.tickFrames(1);
    expect(root.children).toHaveLength(1);
    const scrollBox = getScrollBox(stage);

    setVisible(false);
    await ticker.tickFrames(1);

    expect(root.children).toHaveLength(0);
    expect(scrollBox.destroyed).toBe(true);

    dispose();
  });
});
