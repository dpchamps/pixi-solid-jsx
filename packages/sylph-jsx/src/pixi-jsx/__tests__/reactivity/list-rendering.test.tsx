import { describe, test, expect } from "vitest";
import { createSignal, For } from "../../solidjs-universal-renderer";
import { Text, Container } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";

describe("list rendering", () => {
  test("For renders initial list", async () => {
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

  test("For adds items to list", async () => {
    const [items, setItems] = createSignal(["A", "B"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>{(item) => <text>{item}</text>}</For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(2);

    setItems(["A", "B", "C", "D"]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(4);
    expect((container.children[0] as Text).text).toBe("A");
    expect((container.children[1] as Text).text).toBe("B");
    expect((container.children[2] as Text).text).toBe("C");
    expect((container.children[3] as Text).text).toBe("D");
  });

  test("For removes items from list", async () => {
    const [items, setItems] = createSignal(["A", "B", "C", "D"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>{(item) => <text>{item}</text>}</For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(4);

    setItems(["A", "C"]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("A");
    expect((container.children[1] as Text).text).toBe("C");
  });

  test("For clears list", async () => {
    const [items, setItems] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>{(item) => <text>{item}</text>}</For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);

    setItems([]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(0);
  });

  test("For maintains order during updates", async () => {
    const [items, setItems] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>{(item) => <text>{item}</text>}</For>
      </container>
    ));

    const container = stage.children[0] as Container;

    setItems(["C", "B", "A"]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(3);
    expect((container.children[0] as Text).text).toBe("C");
    expect((container.children[1] as Text).text).toBe("B");
    expect((container.children[2] as Text).text).toBe("A");
  });

  test("For with nested components", async () => {
    const [items, setItems] = createSignal([1, 2, 3]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item) => (
            <container>
              <text>{item}</text>
            </container>
          )}
        </For>
      </container>
    ));

    const parent = stage.children[0] as Container;
    expect(parent.children.length).toBe(3);

    const firstChild = parent.children[0] as Container;
    expect((firstChild.children[0] as Text).text).toBe("1");

    setItems([1, 2]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(parent.children.length).toBe(2);
  });

  test("For with complex objects", async () => {
    const [items, setItems] = createSignal([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>{(item) => <text>{item.name}</text>}</For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("Alice");
    expect((container.children[1] as Text).text).toBe("Bob");

    setItems([
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("Bob");
    expect((container.children[1] as Text).text).toBe("Charlie");
  });

  test("For with index accessor", async () => {
    const [items] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item, index) => (
            <text>
              {index()}: {item}
            </text>
          )}
        </For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);
    expect((container.children[0] as Text).text).toBe("0: A");
    expect((container.children[1] as Text).text).toBe("1: B");
    expect((container.children[2] as Text).text).toBe("2: C");
  });
});
