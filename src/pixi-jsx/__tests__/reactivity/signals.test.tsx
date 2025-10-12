import { describe, test, expect } from "vitest";
import { createSignal, createMemo } from "../../solidjs-universal-renderer";
import { Text, Container, Sprite } from "pixi.js";
import { renderApplicationNode } from "../../../__tests__/test-utils/test-utils.tsx";

describe("signal reactivity", () => {
  test("signal updates container position", async () => {
    const [x, setX] = createSignal(0);
    const [y, setY] = createSignal(0);

    const stage = await renderApplicationNode(() => (
      <container x={x()} y={y()}>
        <text>Test</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.x).toBe(0);
    expect(container.y).toBe(0);

    setX(100);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.x).toBe(100);

    setY(200);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.y).toBe(200);
  });

  test("signal updates sprite properties", async () => {
    const [width, setWidth] = createSignal(50);
    const [height, setHeight] = createSignal(50);

    const stage = await renderApplicationNode(() => (
      <sprite width={width()} height={height()} />
    ));

    const sprite = stage.children[0] as Sprite;
    expect(sprite.width).toBe(50);
    expect(sprite.height).toBe(50);

    setWidth(100);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sprite.width).toBe(100);

    setHeight(150);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sprite.height).toBe(150);
  });

  test("derived signal updates properties", async () => {
    const [radius, setRadius] = createSignal(10);
    const diameter = createMemo(() => radius() * 2);

    const stage = await renderApplicationNode(() => (
      <sprite width={diameter()} height={diameter()} />
    ));

    const sprite = stage.children[0] as Sprite;
    expect(sprite.width).toBe(20);
    expect(sprite.height).toBe(20);

    setRadius(25);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sprite.width).toBe(50);
    expect(sprite.height).toBe(50);
  });

  test("multiple signals update independently", async () => {
    const [x, setX] = createSignal(0);
    const [alpha, setAlpha] = createSignal(1);

    const stage = await renderApplicationNode(() => (
      <container x={x()} alpha={alpha()}>
        <text>Test</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.x).toBe(0);
    expect(container.alpha).toBe(1);

    setX(50);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.x).toBe(50);
    expect(container.alpha).toBe(1);

    setAlpha(0.5);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.x).toBe(50);
    expect(container.alpha).toBe(0.5);
  });

  test("signal updates nested properties", async () => {
    const [parentX, setParentX] = createSignal(10);
    const [childX, setChildX] = createSignal(20);

    const stage = await renderApplicationNode(() => (
      <container x={parentX()}>
        <container x={childX()}>
          <text>Nested</text>
        </container>
      </container>
    ));

    const parent = stage.children[0] as Container;
    const child = parent.children[0] as Container;

    expect(parent.x).toBe(10);
    expect(child.x).toBe(20);

    setParentX(100);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(parent.x).toBe(100);
    expect(child.x).toBe(20);

    setChildX(50);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(parent.x).toBe(100);
    expect(child.x).toBe(50);
  });

  test("computed position from multiple signals", async () => {
    const [baseX, setBaseX] = createSignal(0);
    const [offsetX, setOffsetX] = createSignal(10);
    const computedX = createMemo(() => baseX() + offsetX());

    const stage = await renderApplicationNode(() => (
      <container x={computedX()}>
        <text>Computed</text>
      </container>
    ));

    const container = stage.children[0] as Container;
    expect(container.x).toBe(10);

    setBaseX(100);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.x).toBe(110);

    setOffsetX(50);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container.x).toBe(150);
  });
});
