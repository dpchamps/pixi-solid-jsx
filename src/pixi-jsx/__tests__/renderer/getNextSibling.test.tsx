import { describe, test, expect } from "vitest";
import { Text, Container } from "pixi.js";
import { renderApplicationNode } from "../test-utils";

describe("getNextSibling traversal", () => {
  test("siblings render in correct order", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>First</text>
        <text>Second</text>
        <text>Third</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    const first = container.children[0] as Text;
    const second = container.children[1] as Text;
    const third = container.children[2] as Text;

    expect(first.text).toBe("First");
    expect(second.text).toBe("Second");
    expect(third.text).toBe("Third");
  });

  test("nested siblings maintain order", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <container>
          <text>A1</text>
          <text>A2</text>
        </container>
        <container>
          <text>B1</text>
          <text>B2</text>
        </container>
      </container>
    ));

    const parent = stage.children[0] as Container;
    const containerA = parent.children[0] as Container;
    const containerB = parent.children[1] as Container;

    expect((containerA.children[0] as Text).text).toBe("A1");
    expect((containerA.children[1] as Text).text).toBe("A2");
    expect((containerB.children[0] as Text).text).toBe("B1");
    expect((containerB.children[1] as Text).text).toBe("B2");
  });

  test("mixed element types maintain order", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>Text 1</text>
        <sprite />
        <text>Text 2</text>
        <graphics />
        <text>Text 3</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(5);
    expect(container.children[0]).toBeInstanceOf(Text);
    expect((container.children[0] as Text).text).toBe("Text 1");
    expect(container.children[2]).toBeInstanceOf(Text);
    expect((container.children[2] as Text).text).toBe("Text 2");
    expect(container.children[4]).toBeInstanceOf(Text);
    expect((container.children[4] as Text).text).toBe("Text 3");
  });
});