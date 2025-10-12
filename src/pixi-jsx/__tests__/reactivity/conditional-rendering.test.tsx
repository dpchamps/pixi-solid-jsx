import { describe, test, expect } from "vitest";
import { createSignal, Show } from "../../solidjs-universal-renderer";
import { Text, Container } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils.tsx";

describe("conditional rendering", () => {
  test("Show component adds and removes nodes", async () => {
    const [visible, setVisible] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={visible()}>
          <text>Conditional</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(0);

    setVisible(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("Conditional");

    setVisible(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(0);
  });

  test("Show preserves nodes when toggled back on", async () => {
    const [visible, setVisible] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={visible()}>
          <text>Toggle</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);
    const originalText = container.children[0] as Text;
    expect(originalText.text).toBe("Toggle");

    setVisible(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(0);

    setVisible(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("Toggle");
  });

  test("nested Show components", async () => {
    const [outer, setOuter] = createSignal(false);
    const [inner, setInner] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={outer()}>
          <container>
            <Show when={inner()}>
              <text>Nested</text>
            </Show>
          </container>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(0);

    setOuter(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(1);
    const innerContainer = container.children[0] as Container;
    expect(innerContainer.children.length).toBe(0);

    setInner(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(innerContainer.children.length).toBe(1);
    expect((innerContainer.children[0] as Text).text).toBe("Nested");

    setOuter(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(0);
  });

  test("Show with fallback", async () => {
    const [condition, setCondition] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={condition()} fallback={<text>Fallback</text>}>
          <text>Primary</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("Fallback");

    setCondition(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("Primary");

    setCondition(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("Fallback");
  });

  test("multiple Show components in same container", async () => {
    const [showA, setShowA] = createSignal(false);
    const [showB, setShowB] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <Show when={showA()}>
          <text>A</text>
        </Show>
        <Show when={showB()}>
          <text>B</text>
        </Show>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(0);

    setShowA(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("A");

    setShowB(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("A");
    expect((container.children[1] as Text).text).toBe("B");

    setShowA(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("B");
  });
});
