import { describe, expect, test } from "vitest";
import { createSignal } from "solid-custom-renderer/index.ts";
import {
  createEasingCoroutine,
  startCoroutine,
} from "../../../effects/coroutines.ts";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.tsx";
import { assert, invariant } from "../../../../utility-types.ts";
import { Sprite } from "pixi.js";

describe("createEasingCoroutine", () => {
  test("interpolates sprite position with linear easing", async () => {
    const TestComponent = () => {
      const [x, setX] = createSignal(0);
      const startX = 0;
      const targetX = 100;
      const linearEasing = (t: number) => t;

      startCoroutine(
        createEasingCoroutine(
          (lerp) => {
            setX(lerp(startX, targetX));
          },
          linearEasing,
          1020,
        ),
      );

      return <sprite x={x()} />;
    };

    const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
      <TestComponent />
    ));
    const sprite = stage.children[0]?.children[0];
    invariant(sprite);
    assert(sprite instanceof Sprite);

    expect(sprite.x).toBe(0);

    await ticker.tickFrames(31);
    expect(sprite.x).toBeCloseTo(50, 0);

    await ticker.tickFrames(30);
    expect(sprite.x).toBeCloseTo(100, 0);

    // Additional frames shouldn't change position
    await ticker.tickFrames(10);
    expect(sprite.x).toBeCloseTo(100, 0);
  });

  test("applies easing function correctly", async () => {
    const TestComponent = () => {
      const [x, setX] = createSignal(0);

      startCoroutine(
        createEasingCoroutine(
          (lerp) => {
            setX(lerp(0, 100));
          },
          (t) => t * t, // Quadratic easing
          1020,
        ),
      );

      return <sprite x={x()} />;
    };

    const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
      <TestComponent />
    ));
    const sprite = stage.children[0]?.children[0];
    invariant(sprite);
    assert(sprite instanceof Sprite);

    expect(sprite.x).toBe(0);

    // At 50% time with quadratic easing (0.5 * 0.5 = 0.25), should be at 25% position
    await ticker.tickFrames(31);
    expect(sprite.x).toBeCloseTo(25, 0);

    // Complete the animation
    await ticker.tickFrames(30);
    expect(sprite.x).toBeCloseTo(100, 0);
  });

  test("interpolates multiple properties simultaneously", async () => {
    const TestComponent = () => {
      const [x, setX] = createSignal(0);
      const [y, setY] = createSignal(50);
      const linearEasing = (t: number) => t;

      startCoroutine(
        createEasingCoroutine(
          (lerp) => {
            setX(lerp(0, 100));
            setY(lerp(50, 150));
          },
          linearEasing,
          1020,
        ),
      );

      return <sprite x={x()} y={y()} />;
    };

    const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
      <TestComponent />
    ));
    const sprite = stage.children[0]?.children[0];
    invariant(sprite);
    assert(sprite instanceof Sprite);

    expect(sprite.x).toBe(0);
    expect(sprite.y).toBe(50);

    // At 50% completion
    await ticker.tickFrames(31);
    expect(sprite.x).toBeCloseTo(50, 0);
    expect(sprite.y).toBeCloseTo(100, 0);

    // At 100% completion
    await ticker.tickFrames(30);
    expect(sprite.x).toBeCloseTo(100, 0);
    expect(sprite.y).toBeCloseTo(150, 0);
  });

  test("zero-duration easing should snap to target but currently yields NaN", async () => {
    const TestComponent = () => {
      const [x, setX] = createSignal(0);

      startCoroutine(
        createEasingCoroutine(
          (lerp) => {
            setX(lerp(0, 100));
          },
          (t) => t,
          0,
        ),
      );

      return <sprite x={x()} />;
    };

    const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
      <TestComponent />
    ));
    const sprite = stage.children[0]?.children[0];
    invariant(sprite);
    assert(sprite instanceof Sprite);

    await ticker.tickFrames(1);
    // BUG: createEasingCoroutine divides by duration; a 0 duration tween propagates NaN
    expect(sprite.x).toBe(100);
  });
});
