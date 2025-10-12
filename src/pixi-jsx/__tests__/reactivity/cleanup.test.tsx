import { describe, test, expect } from "vitest";
import { createSignal, Show, For, onCleanup } from "../../solidjs-universal-renderer";
import { Text, Container } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils.tsx";

describe("cleanup and memory management", () => {
  test("removed nodes no longer appear in scene", async () => {
    const [show, setShow] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={show()}>
          <text>Temporary</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);

    setShow(false);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.children.length).toBe(0);
  });

  test("multiple remove and add cycles", async () => {
    const [show, setShow] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={show()}>
          <text>Toggle</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;

    for (let i = 0; i < 5; i++) {
      setShow(false);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.children.length).toBe(0);

      setShow(true);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.children.length).toBe(1);
    }
  });

  test("removing list items cleans up nodes", async () => {
    const [items, setItems] = createSignal(["A", "B", "C", "D", "E"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item) => <text>{item}</text>}
        </For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(5);

    setItems(["A", "B"]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.children.length).toBe(2);

    setItems([]);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container.children.length).toBe(0);
  });

  test("nested removal cleans up all children", async () => {
    const [show, setShow] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={show()}>
          <container>
            <text>Child 1</text>
            <text>Child 2</text>
            <container>
              <text>Grandchild</text>
            </container>
          </container>
        </Show>
      </container>
    ));

    const outerContainer = stage.children[0] as Container;
    expect(outerContainer.children.length).toBe(1);

    const innerContainer = outerContainer.children[0] as Container;
    expect(innerContainer.children.length).toBe(3);

    setShow(false);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(outerContainer.children.length).toBe(0);
  });

  test("onCleanup runs when component is removed", async () => {
    const [show, setShow] = createSignal(true);
    let cleanupCalled = false;

    const TestComponent = () => {
      onCleanup(() => {
        cleanupCalled = true;
      });
      return <text>Cleanup Test</text>;
    };

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={show()}>
          <TestComponent />
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);
    expect(cleanupCalled).toBe(false);

    setShow(false);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.children.length).toBe(0);
    expect(cleanupCalled).toBe(true);
  });

  test("rapid add and remove cycles", async () => {
    const [items, setItems] = createSignal<string[]>([]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item) => <text>{item}</text>}
        </For>
      </container>
    ));

    const container = stage.children[0] as Container;

    for (let i = 0; i < 10; i++) {
      setItems([`Item ${i}`]);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.children.length).toBe(1);

      setItems([]);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(container.children.length).toBe(0);
    }
  });

  test("cleanup with mixed static and dynamic children", async () => {
    const [showDynamic, setShowDynamic] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <text>Static 1</text>
        <Show when={showDynamic()}>
          <text>Dynamic</text>
        </Show>
        <text>Static 2</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);

    setShowDynamic(false);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("Static 1");
    expect((container.children[1] as Text).text).toBe("Static 2");
  });
});