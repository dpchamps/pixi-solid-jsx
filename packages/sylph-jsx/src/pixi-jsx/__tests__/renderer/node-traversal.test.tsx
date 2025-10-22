import { describe, test, expect } from "vitest";
import { Text, Container } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils.js";

describe("node traversal", () => {
  test("parent contains children", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>Child</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);
  });

  test("deeply nested traversal", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <container>
          <container>
            <text>Deep</text>
          </container>
        </container>
      </container>
    ));

    const level1 = stage.children[0] as Container;
    const level2 = level1.children[0] as Container;
    const level3 = level2.children[0] as Container;
    const text = level3.children[0] as Text;

    expect(text.text).toBe("Deep");
  });

  test("multiple children at same level", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <container>
          <text>A</text>
        </container>
        <container>
          <text>B</text>
        </container>
        <container>
          <text>C</text>
        </container>
      </container>
    ));

    const parent = stage.children[0] as Container;
    expect(parent.children.length).toBe(3);

    const textA = (parent.children[0] as Container).children[0] as Text;
    const textB = (parent.children[1] as Container).children[0] as Text;
    const textC = (parent.children[2] as Container).children[0] as Text;

    expect(textA.text).toBe("A");
    expect(textB.text).toBe("B");
    expect(textC.text).toBe("C");
  });

  test("empty containers", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <container />
        <container />
      </container>
    ));

    const parent = stage.children[0] as Container;
    expect(parent.children.length).toBe(2);

    const child1 = parent.children[0] as Container;
    const child2 = parent.children[1] as Container;

    expect(child1.children.length).toBe(0);
    expect(child2.children.length).toBe(0);
  });
});
