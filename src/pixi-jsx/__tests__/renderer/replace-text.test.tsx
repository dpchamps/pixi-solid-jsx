import { describe, test, expect } from "vitest";
import { createSignal } from "../../solidjs-universal-renderer";
import { Text } from "pixi.js";
import { renderApplicationNode } from "../test-utils";

describe("text replacement", () => {
  test("replacing text content with signal", async () => {
    const [text, setText] = createSignal("Initial");

    const stage = await renderApplicationNode(() => (
      <text>{text()}</text>
    ));

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("Initial");

    setText("Updated");
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(textNode.text).toBe("Updated");
  });

  test("replacing entire text multiple times", async () => {
    const [content, setContent] = createSignal("One");

    const stage = await renderApplicationNode(() => (
      <text>{content()}</text>
    ));

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("One");

    setContent("Two");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(textNode.text).toBe("Two");

    setContent("Three");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(textNode.text).toBe("Three");

    setContent("Four");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(textNode.text).toBe("Four");
  });

  test("replacing part of concatenated text", async () => {
    const [prefix, setPrefix] = createSignal("Hello");
    const [suffix, setSuffix] = createSignal("World");

    const stage = await renderApplicationNode(() => (
      <text>{prefix()} {suffix()}</text>
    ));

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("Hello World");

    setPrefix("Goodbye");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(textNode.text).toBe("Goodbye World");

    setSuffix("Universe");
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(textNode.text).toBe("Goodbye Universe");
  });

  test("replacing with empty string", async () => {
    const [text, setText] = createSignal("Something");

    const stage = await renderApplicationNode(() => (
      <text>{text()}</text>
    ));

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("Something");

    setText("");
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(textNode.text).toBe("");
  });

  test("replacing empty string with content", async () => {
    const [text, setText] = createSignal("");

    const stage = await renderApplicationNode(() => (
      <text>{text()}</text>
    ));

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("");

    setText("Now has content");
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(textNode.text).toBe("Now has content");
  });
});