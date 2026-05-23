import { describe, expect, test } from "vitest";
import {
  createSignal,
  Show,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { Container, HTMLText, TextureStyle } from "pixi.js";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import { HTMLTextNode } from "../../../components/extensions/HTMLTextNode.jsx";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;
const getWrapper = (stage: Container) => getSceneRoot(stage).children[0] as Container;

const getRenderedHTMLText = (stage: Container) => {
  const wrapper = getWrapper(stage);
  const text = wrapper.children[0];

  expect(text).toBeInstanceOf(HTMLText);
  return text as HTMLText;
};

describe("HTMLTextNode", () => {
  test("renders an empty wrapper until text is defined", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <HTMLTextNode text={undefined} style={{ fontSize: 18 }} />,
    );

    const wrapper = getWrapper(stage);
    expect(wrapper.children.length).toBe(0);

    await ticker.tickFrames(1);
    expect(wrapper.children.length).toBe(0);

    dispose();
  });

  test("creates an external Pixi HTMLText from initial props", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <HTMLTextNode
          text="Hello <strong>Sylph</strong>"
          style={{ fontSize: 24, fontFamily: "Arial", align: "center" }}
          x={12}
          y={34}
          alpha={0.75}
          rotation={0.25}
          anchor={0.5}
          zIndex={42}
        />
      ),
    );

    const wrapper = getWrapper(stage);
    expect(wrapper.children.length).toBe(0);

    await ticker.tickFrames(1);

    const htmlText = getRenderedHTMLText(stage);
    expect(wrapper.zIndex).toBe(42);
    expect(htmlText.text).toBe("Hello <strong>Sylph</strong>");
    expect(htmlText.style.fontSize).toBe(24);
    expect(htmlText.style.fontFamily).toBe("Arial");
    expect(htmlText.style.align).toBe("center");
    expect(htmlText.x).toBe(12);
    expect(htmlText.y).toBe(34);
    expect(htmlText.alpha).toBe(0.75);
    expect(htmlText.rotation).toBe(0.25);
    expect(htmlText.anchor.x).toBe(0.5);
    expect(htmlText.anchor.y).toBe(0.5);

    dispose();
  });

  test("renders defined falsy text values", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <HTMLTextNode text={0} style={{ fontSize: 16 }} />,
    );

    await ticker.tickFrames(1);

    const htmlText = getRenderedHTMLText(stage);
    expect(htmlText.text).toBe("0");

    dispose();
  });

  test("reactively updates text, style, position, zIndex, and transform props", async () => {
    const [text, setText] = createSignal("Initial");
    const [fontSize, setFontSize] = createSignal(18);
    const [x, setX] = createSignal(1);
    const [y, setY] = createSignal(2);
    const [zIndex, setZIndex] = createSignal(3);
    const [scale, setScale] = createSignal({ x: 1, y: 1 });

    const TestComponent = () => (
      <HTMLTextNode
        text={text()}
        style={{ fontSize: fontSize(), fontFamily: "Arial" }}
        x={x()}
        y={y()}
        zIndex={zIndex()}
        scale={scale()}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(2);
    const wrapper = getWrapper(stage);
    const htmlText = getRenderedHTMLText(stage);

    expect(htmlText.text).toBe("Initial");
    expect(htmlText.style.fontSize).toBe(18);
    expect(htmlText.x).toBe(1);
    expect(htmlText.y).toBe(2);
    expect(wrapper.zIndex).toBe(3);

    setText("Updated <em>text</em>");
    setFontSize(30);
    setX(15);
    setY(25);
    setZIndex(30);
    setScale({ x: 2, y: 3 });
    await ticker.tickFrames(1);

    expect(getRenderedHTMLText(stage)).toBe(htmlText);
    expect(htmlText.text).toBe("Updated <em>text</em>");
    expect(htmlText.style.fontSize).toBe(30);
    expect(htmlText.x).toBe(15);
    expect(htmlText.y).toBe(25);
    expect(wrapper.zIndex).toBe(30);
    expect(htmlText.scale.x).toBe(2);
    expect(htmlText.scale.y).toBe(3);

    dispose();
  });

  test("removes and destroys the external HTMLText when text becomes undefined", async () => {
    const [text, setText] = createSignal<string | undefined>("Visible");

    const TestComponent = () => (
      <HTMLTextNode text={text()} style={{ fontSize: 18 }} />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const wrapper = getWrapper(stage);
    const htmlText = getRenderedHTMLText(stage);

    setText(undefined);
    await ticker.tickFrames(1);

    expect(wrapper.children.length).toBe(0);
    expect(htmlText.destroyed).toBe(true);

    dispose();
  });

  test("recreates HTMLText safely when textureStyle changes", async () => {
    const [textureStyle, setTextureStyle] = createSignal(
      new TextureStyle({ scaleMode: "linear" }),
    );

    const TestComponent = () => (
      <HTMLTextNode
        text="Texture styled"
        style={{ fontSize: 18 }}
        textureStyle={textureStyle()}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const wrapper = getWrapper(stage);
    const firstText = getRenderedHTMLText(stage);

    setTextureStyle(new TextureStyle({ scaleMode: "nearest" }));
    await ticker.tickFrames(1);

    expect(wrapper.children.length).toBe(1);
    const secondText = getRenderedHTMLText(stage);
    expect(secondText).not.toBe(firstText);
    expect(secondText.textureStyle?.scaleMode).toBe("nearest");
    expect(firstText.destroyed).toBe(true);

    dispose();
  });

  test("removed HTMLTextNode nodes leave the Pixi scene graph", async () => {
    const [visible, setVisible] = createSignal(true);

    const TestComponent = () => (
      <Show when={visible()}>
        <HTMLTextNode text="Visible" style={{ fontSize: 18 }} />
      </Show>
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );
    const root = getSceneRoot(stage);

    await ticker.tickFrames(1);
    expect(root.children.length).toBe(1);
    expect(getWrapper(stage).children.length).toBe(1);

    setVisible(false);
    await ticker.tickFrames(1);

    expect(root.children.length).toBe(0);

    dispose();
  });
});
