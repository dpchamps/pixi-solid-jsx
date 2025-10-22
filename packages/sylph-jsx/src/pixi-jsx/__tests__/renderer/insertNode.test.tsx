import { describe, test, expect } from "vitest";
import { createSignal, Show, For } from "../../solidjs-universal-renderer";
import { Text, Container } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";

describe("insertNode", () => {
  test("inserts child into parent", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>Child</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);
    expect(container.children[0]).toBeInstanceOf(Text);
  });

  test("inserts multiple children in order", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>First</text>
        <text>Second</text>
        <text>Third</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);
    expect((container.children[0] as Text).text).toBe("First");
    expect((container.children[1] as Text).text).toBe("Second");
    expect((container.children[2] as Text).text).toBe("Third");
  });

  test("conditional insertion adds node", async () => {
    const [show, setShow] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={show()}>
          <text>Conditional</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(0);

    setShow(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("Conditional");
  });

  test("inserts before anchor node", async () => {
    const [show, setShow] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <text>First</text>
        <Show when={show()}>
          <text>Inserted</text>
        </Show>
        <text>Last</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("First");
    expect((container.children[1] as Text).text).toBe("Last");

    setShow(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children.length).toBe(3);
    expect((container.children[0] as Text).text).toBe("First");
    expect((container.children[1] as Text).text).toBe("Inserted");
    expect((container.children[2] as Text).text).toBe("Last");
  });

  test("For loop inserts items in correct order", async () => {
    const [items] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>{(item) => <text>{item}</text>}</For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);
    expect((container.children[0] as Text).text).toBe("A");
    expect((container.children[1] as Text).text).toBe("B");
    expect((container.children[2] as Text).text).toBe("C");
  });

  test("raw text transformed to TextNode under application", async () => {
    const stage = await renderApplicationNode(() => <>Plain text</>);

    expect(stage.children[0]).toBeInstanceOf(Text);
    expect((stage.children[0] as Text).text).toBe("Plain text");
  });

  test("deeply nested insertion", async () => {
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
});
