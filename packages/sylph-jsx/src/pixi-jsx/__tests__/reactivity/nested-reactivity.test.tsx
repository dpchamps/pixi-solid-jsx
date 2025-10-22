import { describe, test, expect } from "vitest";
import { createSignal, createMemo } from "../../solidjs-universal-renderer";
import { Container } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils";

describe("nested reactivity", () => {
  test("deeply nested signal updates", async () => {
    const [value, setValue] = createSignal(10);

    const stage = await renderApplicationNode(() => (
      <container x={value()}>
        <container y={value()}>
          <container width={value()}>
            <text>Deep</text>
          </container>
        </container>
      </container>
    ));

    const level1 = stage.children[0] as Container;
    const level2 = level1.children[0] as Container;
    const level3 = level2.children[0] as Container;

    expect(level1.x).toBe(10);
    expect(level2.y).toBe(10);
    expect(level3.width).toBe(10);

    setValue(50);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(level1.x).toBe(50);
    expect(level2.y).toBe(50);
    expect(level3.width).toBe(50);
  });

  test("parent signal does not affect child", async () => {
    const [parentX, setParentX] = createSignal(0);
    const [childX] = createSignal(100);

    const stage = await renderApplicationNode(() => (
      <container x={parentX()}>
        <container x={childX()}>
          <text>Child</text>
        </container>
      </container>
    ));

    const parent = stage.children[0] as Container;
    const child = parent.children[0] as Container;

    expect(parent.x).toBe(0);
    expect(child.x).toBe(100);

    setParentX(200);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(parent.x).toBe(200);
    expect(child.x).toBe(100);
  });

  test("sibling signals are independent", async () => {
    const [x1, setX1] = createSignal(0);
    const [x2, setX2] = createSignal(0);

    const stage = await renderApplicationNode(() => (
      <container>
        <container x={x1()}>
          <text>Sibling 1</text>
        </container>
        <container x={x2()}>
          <text>Sibling 2</text>
        </container>
      </container>
    ));

    const parent = stage.children[0] as Container;
    const sibling1 = parent.children[0] as Container;
    const sibling2 = parent.children[1] as Container;

    expect(sibling1.x).toBe(0);
    expect(sibling2.x).toBe(0);

    setX1(100);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sibling1.x).toBe(100);
    expect(sibling2.x).toBe(0);

    setX2(200);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(sibling1.x).toBe(100);
    expect(sibling2.x).toBe(200);
  });

  test("chained derived signals", async () => {
    const [base, setBase] = createSignal(10);
    const double = createMemo(() => base() * 2);
    const triple = createMemo(() => double() + base());

    const stage = await renderApplicationNode(() => (
      <container x={triple()}>
        <text>Chained</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.x).toBe(30);

    setBase(20);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.x).toBe(60);
  });

  test("multiple derived signals from same source", async () => {
    const [radius, setRadius] = createSignal(5);
    const diameter = createMemo(() => radius() * 2);
    const area = createMemo(() => Math.PI * radius() * radius());

    const stage = await renderApplicationNode(() => (
      <container width={diameter()} height={area()}>
        <text>Circle</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.width).toBe(10);
    expect(container.height).toBeCloseTo(78.54, 2);

    setRadius(10);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.width).toBe(20);
    expect(container.height).toBeCloseTo(314.16, 2);
  });

  test("nested component with isolated state", async () => {
    const [outerAlpha, setOuterAlpha] = createSignal(1);
    const [innerAlpha, setInnerAlpha] = createSignal(1);

    const stage = await renderApplicationNode(() => (
      <container alpha={outerAlpha()}>
        <container alpha={innerAlpha()}>
          <text>Nested Alpha</text>
        </container>
      </container>
    ));

    const outer = stage.children[0] as Container;
    const inner = outer.children[0] as Container;

    expect(outer.alpha).toBe(1);
    expect(inner.alpha).toBe(1);

    setOuterAlpha(0.5);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(outer.alpha).toBe(0.5);
    expect(inner.alpha).toBe(1);

    setInnerAlpha(0.3);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(outer.alpha).toBe(0.5);
    expect(inner.alpha).toBe(0.3);
  });
});
