import { describe, expect, test } from "vitest";
import { Container, HTMLText } from "pixi.js";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import { HTMLTextNode } from "../../../components/extensions/ui/HTMLTextNode.jsx";
import { UIHTMLTextNode } from "../../../index.js";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;
const getWrapper = (stage: Container) => getSceneRoot(stage).children[0] as Container;

const getHTMLText = (stage: Container) => {
  const wrapper = getWrapper(stage);
  const htmlText = wrapper.children[0];

  expect(htmlText).toBeInstanceOf(HTMLText);
  return htmlText as HTMLText;
};

describe("ui/HTMLTextNode", () => {
  test("inserts a Pixi HTMLText instance through an external container", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <HTMLTextNode
          text="Hello <strong>UI</strong>"
          style={{ fontSize: 20, fill: "#ffffff" }}
          x={12}
          y={34}
        />
      ),
    );

    await ticker.tickFrames(1);

    const wrapper = getWrapper(stage);
    const htmlText = getHTMLText(stage);
    expect(htmlText.text).toBe("Hello <strong>UI</strong>");
    expect(htmlText.style.fontSize).toBe(20);
    expect(htmlText.x).toBe(12);
    expect(htmlText.y).toBe(34);
    expect(htmlText.parent).toBe(wrapper);

    dispose();
  });

  test("passes props directly to the HTMLText constructor", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <HTMLTextNode
          text="Configured"
          style={{ fontSize: 18, fill: "#ff00ff", align: "center" }}
          alpha={0.5}
          rotation={0.25}
        />
      ),
    );

    await ticker.tickFrames(1);

    const htmlText = getHTMLText(stage);
    expect(htmlText.text).toBe("Configured");
    expect(htmlText.style.fontSize).toBe(18);
    expect(htmlText.style.align).toBe("center");
    expect(htmlText.alpha).toBe(0.5);
    expect(htmlText.rotation).toBe(0.25);

    dispose();
  });

  test("removes the bridged HTMLText from the scene graph on cleanup", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <HTMLTextNode text="Cleanup" style={{ fontSize: 18 }} />,
    );

    await ticker.tickFrames(1);
    const wrapper = getWrapper(stage);
    const htmlText = getHTMLText(stage);

    dispose();

    expect(htmlText.parent).toBeNull();
    expect(wrapper.children).toHaveLength(0);
  });

  test("is exported at the engine top level as UIHTMLTextNode", () => {
    expect(UIHTMLTextNode).toBe(HTMLTextNode);
  });
});
