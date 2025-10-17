import { describe, test, expect } from "vitest";
import {
  createSignal,
  Show,
  For,
  Index,
} from "../../solidjs-universal-renderer";
import { Text, Container, RenderLayer, Sprite } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils.tsx";

describe("RenderLayer node", () => {
  test("render-layer is added to parent container as RenderLayer instance", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer />
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(1);
    expect(container.children[0]).toBeInstanceOf(RenderLayer);
  });

  test("children of render-layer are added to parent container", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <text>Inside Layer</text>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(2);
    expect(container.children[0]).toBeInstanceOf(RenderLayer);
    expect(container.children[1]).toBeInstanceOf(Text);
    expect((container.children[1] as Text).text).toBe("Inside Layer");
  });

  test("children are automatically attached to render layer", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <sprite />
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;
    const sprite = container.children[1] as Sprite;

    expect(layer.renderLayerChildren.length).toBe(1);
    expect(layer.renderLayerChildren[0]).toBe(sprite);
  });

  test("multiple children are all attached to layer", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <text>First</text>
          <sprite />
          <text>Second</text>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect(container.children.length).toBe(4);
    expect(container.children[0]).toBe(layer);
    expect(container.children[1]).toBeInstanceOf(Text);
    expect(container.children[2]).toBeInstanceOf(Sprite);
    expect(container.children[3]).toBeInstanceOf(Text);

    expect(layer.renderLayerChildren.length).toBe(3);
    expect(layer.renderLayerChildren[0]).toBeInstanceOf(Text);
    expect(layer.renderLayerChildren[1]).toBeInstanceOf(Sprite);
    expect(layer.renderLayerChildren[2]).toBeInstanceOf(Text);
  });

  test("nested containers and their children all attach to layer", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <container>
            <text>Nested</text>
          </container>
        </render-layer>
      </container>
    ));

    const outerContainer = stage.children[0] as Container;
    const layer = outerContainer.children[0] as RenderLayer;
    const innerContainer = outerContainer.children[1] as Container;
    const text = innerContainer.children[0] as Text;

    expect(outerContainer.children.length).toBe(2);
    expect(innerContainer.children.length).toBe(1);

    expect(layer.renderLayerChildren.length).toBe(2);
    expect(layer.renderLayerChildren[0]).toBe(innerContainer);
    expect(layer.renderLayerChildren[1]).toBe(text);
  });

  test("props are applied to RenderLayer instance", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer sortableChildren={true} />
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect(layer.sortableChildren).toBe(true);
  });

  test("reactive props update RenderLayer", async () => {
    const [sortable, setSortable] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer sortableChildren={sortable()} />
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect(layer.sortableChildren).toBe(false);

    setSortable(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(layer.sortableChildren).toBe(true);
  });

  test("conditional rendering within layer attaches/detaches from layer", async () => {
    const [show, setShow] = createSignal(false);

    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <Show when={show()}>
            <text>Conditional</text>
          </Show>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect(container.children.length).toBe(1);
    expect(layer.renderLayerChildren.length).toBe(0);

    setShow(true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children.length).toBe(2);
    expect(layer.renderLayerChildren.length).toBe(1);
    expect((layer.renderLayerChildren[0] as Text).text).toBe("Conditional");

    setShow(false);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children.length).toBe(1);
    expect(layer.renderLayerChildren.length).toBe(0);
  });

  test("multiple render layers are independent", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <text>Layer 1</text>
        </render-layer>
        <render-layer>
          <text>Layer 2</text>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;

    const layer1 = container.children[0] as RenderLayer;
    const layer2 = container.children[1] as RenderLayer;
    const text1 = container.children[2] as Text;
    const text2 = container.children[3] as Text;

    expect(layer1.renderLayerChildren.length).toBe(1);
    expect(layer1.renderLayerChildren[0]).toBe(text1);
    expect(text1.text).toBe("Layer 1");

    expect(layer2.renderLayerChildren.length).toBe(1);
    expect(layer2.renderLayerChildren[0]).toBe(text2);
    expect(text2.text).toBe("Layer 2");
  });

  test("children outside render-layer are not attached to it", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>Outside</text>
        <render-layer>
          <text>Inside</text>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const outsideText = container.children[0] as Text;
    const layer = container.children[1] as RenderLayer;
    const insideText = container.children[2] as Text;

    expect(layer.renderLayerChildren.length).toBe(1);
    expect(layer.renderLayerChildren[0]).toBe(insideText);
    expect(layer.renderLayerChildren).not.toContain(outsideText);
  });

  test("BUG: removing raw text child proxied through render-layer does not throw", async () => {
    const [text, setText] = createSignal("Hello");

    const stage = await renderApplicationNode(() => (
      <render-layer>
        <Show when={text()}>
          {(value) => value() as unknown as any}
        </Show>
      </render-layer>
    ));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(stage.children.length).toBe(2);
    expect(stage.children[0]).toBeInstanceOf(RenderLayer);
    expect(stage.children[1]).toBeInstanceOf(Text);

    let caught: unknown;
    try {
      setText("");
      await new Promise((resolve) => setTimeout(resolve, 0));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeUndefined();
    expect(stage.children.length).toBe(1);
    expect(stage.children[0]).toBeInstanceOf(RenderLayer);
  });

  test("deeply nested children all inherit and attach to layer", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <container>
            <container>
              <text>Deep</text>
            </container>
          </container>
        </render-layer>
      </container>
    ));

    const outerContainer = stage.children[0] as Container;
    const layer = outerContainer.children[0] as RenderLayer;
    const level1 = outerContainer.children[1] as Container;
    const level2 = level1.children[0] as Container;
    const text = level2.children[0] as Text;

    expect(layer.renderLayerChildren.length).toBe(3);
    expect(layer.renderLayerChildren[0]).toBe(level1);
    expect(layer.renderLayerChildren[1]).toBe(level2);
    expect(layer.renderLayerChildren[2]).toBe(text);
    expect(text.text).toBe("Deep");
  });

  test("render-layer preserves child insertion order in both container and layer", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <text>First</text>
          <text>Second</text>
          <text>Third</text>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect((container.children[1] as Text).text).toBe("First");
    expect((container.children[2] as Text).text).toBe("Second");
    expect((container.children[3] as Text).text).toBe("Third");

    expect((layer.renderLayerChildren[0] as Text).text).toBe("First");
    expect((layer.renderLayerChildren[1] as Text).text).toBe("Second");
    expect((layer.renderLayerChildren[2] as Text).text).toBe("Third");
  });

  test("nested render-layers create separate layer contexts", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <text>Outer Layer</text>
          <container>
            <render-layer>
              <text>Inner Layer</text>
            </render-layer>
          </container>
        </render-layer>
      </container>
    ));

    const outerContainer = stage.children[0] as Container;
    const outerLayer = outerContainer.children[0] as RenderLayer;
    const outerText = outerContainer.children[1] as Text;
    const middleContainer = outerContainer.children[2] as Container;
    const innerLayer = middleContainer.children[0] as RenderLayer;
    const innerText = middleContainer.children[1] as Text;

    expect(outerLayer.renderLayerChildren.length).toBe(2);
    expect(outerLayer.renderLayerChildren[0]).toBe(outerText);
    expect(outerLayer.renderLayerChildren[1]).toBe(middleContainer);

    expect(innerLayer.renderLayerChildren.length).toBe(1);
    expect(innerLayer.renderLayerChildren[0]).toBe(innerText);
  });

  test("For loop creates items that all attach to layer", async () => {
    const [items] = createSignal(["A", "B", "C"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <For each={items()}>{(item) => <text>{item}</text>}</For>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect(container.children.length).toBe(4);
    expect(layer.renderLayerChildren.length).toBe(3);
    expect((layer.renderLayerChildren[0] as Text).text).toBe("A");
    expect((layer.renderLayerChildren[1] as Text).text).toBe("B");
    expect((layer.renderLayerChildren[2] as Text).text).toBe("C");
  });

  test("dynamic item additions update layer attachments", async () => {
    const [items, setItems] = createSignal(["A"]);

    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <For each={items()}>{(item) => <text>{item}</text>}</For>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect(layer.renderLayerChildren.length).toBe(1);

    setItems(["A", "B", "C"]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children.length).toBe(4);
    expect(layer.renderLayerChildren.length).toBe(3);

    setItems([]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.children.length).toBe(1);
    expect(layer.renderLayerChildren.length).toBe(0);
  });

  test("render-layer with mixed content types", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <render-layer>
          <text>Text Node</text>
          <sprite />
          <container>
            <graphics />
          </container>
        </render-layer>
      </container>
    ));

    const container = stage.children[0] as Container;
    const layer = container.children[0] as RenderLayer;

    expect(layer.renderLayerChildren.length).toBe(4);
    expect(layer.renderLayerChildren[0]).toBeInstanceOf(Text);
    expect(layer.renderLayerChildren[1]).toBeInstanceOf(Sprite);
    expect(layer.renderLayerChildren[2]).toBeInstanceOf(Container);
    expect(layer.renderLayerChildren[3]).toBeInstanceOf(Container);
  });

  test("layer position in scene graph affects render order", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>Before Layer</text>
        <render-layer>
          <text>In Layer</text>
        </render-layer>
        <text>After Layer</text>
      </container>
    ));

    const container = stage.children[0] as Container;

    expect(container.children.length).toBe(4);
    expect((container.children[0] as Text).text).toBe("Before Layer");
    expect(container.children[1]).toBeInstanceOf(RenderLayer);
    expect((container.children[2] as Text).text).toBe("After Layer");
    expect((container.children[3] as Text).text).toBe("In Layer");
  });

  test("Regression: render layer not propagating", async () => {
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
      <container>
        <render-layer sortableChildren={true}>
          <Index each={items()}>
            {(item) => (
              <container>
                <EntityComponent {...item()} />
              </container>
            )}
          </Index>
        </render-layer>
      </container>
    );

    const stage = await renderApplicationNode(() => (
      <container>
        <SceneComponent />
      </container>
    ));

    const outerContainer = stage.children[0] as Container;
    const layer = outerContainer.children[0]?.children[0] as RenderLayer;

    expect(layer.renderLayerChildren).toHaveLength(6);
  });
});
