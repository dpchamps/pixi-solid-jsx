import { describe, test, expect } from "vitest";
import { Text, Container, Sprite, Graphics } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";

describe("element creation through JSX", () => {
  test("renders text element", async () => {
    const stage = await renderApplicationNode(() => <text>Hello</text>);

    expect(stage.children[0]).toBeInstanceOf(Text);
  });

  test("renders container element", async () => {
    const stage = await renderApplicationNode(() => <container />);

    expect(stage.children[0]).toBeInstanceOf(Container);
  });

  test("renders sprite element", async () => {
    const stage = await renderApplicationNode(() => <sprite />);

    expect(stage.children[0]).toBeInstanceOf(Sprite);
  });

  test("renders graphics element", async () => {
    const stage = await renderApplicationNode(() => <graphics />);

    expect(stage.children[0]).toBeInstanceOf(Graphics);
  });

  test("renders nested containers", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <container>
          <text>Nested</text>
        </container>
      </container>
    ));

    const outer = stage.children[0] as Container;
    const inner = outer.children[0] as Container;
    const text = inner.children[0];

    expect(outer).toBeInstanceOf(Container);
    expect(inner).toBeInstanceOf(Container);
    expect(text).toBeInstanceOf(Text);
  });

  test("renders multiple children", async () => {
    const stage = await renderApplicationNode(() => (
      <container>
        <text>First</text>
        <sprite />
        <text>Second</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.children.length).toBe(3);
    expect(container.children[0]).toBeInstanceOf(Text);
    expect(container.children[1]).toBeInstanceOf(Sprite);
    expect(container.children[2]).toBeInstanceOf(Text);
  });

  test("raw text nodes become Text elements under application", async () => {
    const stage = await renderApplicationNode(() => <>Raw text content</>);

    expect(stage.children[0]).toBeInstanceOf(Text);
    expect((stage.children[0] as Text).text).toBe("Raw text content");
  });
});
