import { describe, test, expect } from "vitest";
import { createSignal, Show, For } from "../../solidjs-universal-renderer";
import { Text, Container } from "pixi.js";
import { renderApplicationNode } from "../test-utils";

describe("removeNode", () => {
  test("conditional removal removes node from scene", async () => {
    const [show, setShow] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={show()}>
          <text>Removable</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);

    setShow(false);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.children.length).toBe(0);
  });

  test("removes item from list", async () => {
    const [items, setItems] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item) => <text>{item}</text>}
        </For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);

    setItems(["A", "C"]);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("A");
    expect((container.children[1] as Text).text).toBe("C");
  });

  test("removes all items from list", async () => {
    const [items, setItems] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item) => <text>{item}</text>}
        </For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);

    setItems([]);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.children.length).toBe(0);
  });

  test("removes nested container with children", async () => {
    const [show, setShow] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={show()}>
          <container>
            <text>Child 1</text>
            <text>Child 2</text>
          </container>
        </Show>
      </container>
    ));

    const outerContainer = stage.children[0] as Container;
    expect(outerContainer.children.length).toBe(1);

    const innerContainer = outerContainer.children[0] as Container;
    expect(innerContainer.children.length).toBe(2);

    setShow(false);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(outerContainer.children.length).toBe(0);
  });

  test("removes middle item maintains order", async () => {
    const [items, setItems] = createSignal(["First", "Middle", "Last"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item) => <text>{item}</text>}
        </For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);

    setItems(["First", "Last"]);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("First");
    expect((container.children[1] as Text).text).toBe("Last");
  });

  test("remove and re-add maintains correct structure", async () => {
    const [show, setShow] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <text>Before</text>
        <Show when={show()}>
          <text>Toggle</text>
        </Show>
        <text>After</text>
        <Show when={show()}>
          <text>Final</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(4);
    expect((container.children[0] as Text).text).toBe("Before");
    expect((container.children[1] as Text).text).toBe("Toggle");
    expect((container.children[2] as Text).text).toBe("After");
    expect((container.children[3] as Text).text).toBe("Final");

    setShow(false);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("Before");
    expect((container.children[1] as Text).text).toBe("After");

    setShow(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect((container.children[0] as Text).text).toBe("Before");
    expect((container.children[1] as Text).text).toBe("Toggle");
    expect((container.children[2] as Text).text).toBe("After");
    expect((container.children[3] as Text).text).toBe("Final");
  });
});