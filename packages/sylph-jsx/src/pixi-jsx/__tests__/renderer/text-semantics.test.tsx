import { describe, test, expect } from "vitest";
import { createSignal } from "../../solidjs-universal-renderer";
import { Text } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";

describe("text node semantics", () => {
  test("text element renders string content", async () => {
    const stage = await renderApplicationNode(() => <text>Static text</text>);

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("Static text");
  });

  test("dynamic text content updates", async () => {
    const [message, setMessage] = createSignal("Hello");

    const stage = await renderApplicationNode(() => <text>{message()}</text>);

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("Hello");

    setMessage("World");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(textNode.text).toBe("World");
  });

  test("text concatenation with multiple expressions", async () => {
    const [first, setFirst] = createSignal("Hello");
    const [second, setSecond] = createSignal("World");

    const stage = await renderApplicationNode(() => (
      <text>
        {first()} {second()}
      </text>
    ));

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("Hello World");

    setFirst("Goodbye");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(textNode.text).toBe("Goodbye World");

    setSecond("Moon");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(textNode.text).toBe("Goodbye Moon");
  });

  test("text with static and dynamic parts", async () => {
    const [name, setName] = createSignal("Alice");

    const stage = await renderApplicationNode(() => (
      <text>Hello, {name()}!</text>
    ));

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("Hello, Alice!");

    setName("Bob");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(textNode.text).toBe("Hello, Bob!");
  });

  test("empty text content", async () => {
    const stage = await renderApplicationNode(() => <text></text>);

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("");
  });

  test("numeric text content", async () => {
    const [count, setCount] = createSignal(42);

    const stage = await renderApplicationNode(() => <text>{count()}</text>);

    const textNode = stage.children[0] as Text;
    expect(textNode.text).toBe("42");

    setCount(100);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(textNode.text).toBe("100");
  });
});
