import { describe, test, expect } from "vitest";
import {
  createSignal,
  Show,
  For,
  Index,
} from "../../solidjs-universal-renderer";
import { Text, Container, RenderLayer } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";

describe("Fragment nodes", () => {
  test("basic fragment renders children to parent", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <>
          <text>Child 1</text>
          <text>Child 2</text>
        </>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(2);
    expect((container.children[0] as Text).text).toBe("Child 1");
    expect((container.children[1] as Text).text).toBe("Child 2");
  });

  test("fragment at root level", async () => {
    const stage = await renderApplicationNode(() => (
      <>
        <container>
          <text>Container 1</text>
        </container>
        <container>
          <text>Container 2</text>
        </container>
      </>
    ));

    expect(stage.children.length).toBe(2);
    expect(stage.children[0]).toBeInstanceOf(Container);
    expect(stage.children[1]).toBeInstanceOf(Container);
  });

  test("fragment with Show (add/remove children)", async () => {
    const [show, setShow] = createSignal(true);

    const stage = await renderApplicationNode(() => (
      <container>
        <>
          <Show when={show()}>
            <text>Conditional</text>
          </Show>
        </>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);
    expect((container.children[0] as Text).text).toBe("Conditional");

    setShow(false);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children.length).toBe(0);
  });

  test("For returning fragments for each item", async () => {
    const [items] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <For each={items()}>
          {(item) => (
            <>
              <text>{item}-1</text>
              <text>{item}-2</text>
            </>
          )}
        </For>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(6);

    const textNodes = container.children.map((c) => (c as Text).text);
    expect(textNodes).toEqual(["A-1", "A-2", "B-1", "B-2", "C-1", "C-2"]);
  });

  describe("Regression: render-layer inside fragments", () => {
    test("component returns fragment > render-layer", async () => {
      const MyComponent = () => (
        <>
          <render-layer>
            <text>In Layer</text>
          </render-layer>
        </>
      );

      const stage = await renderApplicationNode(() => <MyComponent />);

      const layer = stage.children.find((c) => c instanceof RenderLayer);
      expect(layer).toBeDefined();
      expect(layer).toBeInstanceOf(RenderLayer);
    });

    test("Show + component returning fragment with render-layer + Index", async () => {
      const [items] = createSignal([
        { id: "1", value: "A" },
        { id: "2", value: "B" },
      ]);

      const EntityComponent = (props: { id: string; value: string }) => (
        <container>
          <text>{props.value}</text>
        </container>
      );

      const SceneComponent = () => (
        <>
          <render-layer sortableChildren={true}>
            <Index each={items()}>
              {(item) => (
                <container>
                  <EntityComponent {...item()} />
                </container>
              )}
            </Index>
          </render-layer>
        </>
      );

      const [showScene, setShowScene] = createSignal(true);

      const stage = await renderApplicationNode(() => (
        <container>
          <Show when={showScene()}>
            <SceneComponent />
          </Show>
        </container>
      ));

      const outerContainer = stage.children[0] as Container;
      expect(outerContainer.children.length).toBe(3);

      const layer = outerContainer.children[0] as RenderLayer;
      expect(layer).toBeInstanceOf(RenderLayer);
      expect(layer.sortableChildren).toBe(true);

      const wrapperContainers = outerContainer.children
        .slice(1)
        .filter((c) => c instanceof Container);
      expect(wrapperContainers.length).toBe(2);

      const firstWrapper = wrapperContainers[0] as Container;
      const entityContainer = firstWrapper.children[0] as Container;
      expect((entityContainer.children[0] as Text).text).toBe("A");

      setShowScene(false);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(outerContainer.children.length).toBe(0);
    });
  });
});
