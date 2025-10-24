import { describe, expect, test } from "vitest";
import { createSignal } from "../../../pixi-jsx/solidjs-universal-renderer/index";
import { renderApplicationWithFakeTicker } from "../../../__tests__/test-utils/test-utils";
import { assert, invariant } from "../../../utility-types";
import { Sprite } from "pixi.js";
import { EasingCoroutine } from "../../components/extensions/EasingCoroutine";

describe("EasingCoroutine", () => {
  describe("basic easing animation", () => {
    test("animates from initial to target value", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Initial value
      expect(sprite.x).toBe(0);

      // Halfway through animation (32 frames accounting for 2-frame offset)
      await ticker.tickFrames(32);
      expect(sprite.x).toBeCloseTo(50, 10);

      // Complete the animation
      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(100, 10);

      // Additional frames shouldn't change position
      await ticker.tickFrames(10);
      expect(sprite.x).toBe(100);
    });

    test("applies custom easing function correctly", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t * t} // Quadratic easing
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);

      // At 50% time with quadratic easing (0.5^2 = 0.25), should be at 25% position
      await ticker.tickFrames(32);
      expect(sprite.x).toBeCloseTo(25, 10);

      // Complete the animation (30 more frames)
      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(100, 10);
    });

    test("animates multiple properties using same value", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine from={1} to={2} duration={1020} easingFn={(t) => t}>
            {(scale) => (
              <sprite scale={{ x: scale(), y: scale() }} />
            )}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.scale.x).toBe(1);
      expect(sprite.scale.y).toBe(1);

      await ticker.tickFrames(32);
      expect(sprite.scale.x).toBe(1.5);
      expect(sprite.scale.y).toBe(1.5);

      await ticker.tickFrames(30);
      expect(sprite.scale.x).toBe(2);
      expect(sprite.scale.y).toBe(2);
    });

    test("negative value ranges work correctly", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={-50}
            to={50}
            duration={1020}
            easingFn={(t) => t}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(-50);

      await ticker.tickFrames(32);
      expect(sprite.x).toBeCloseTo(0, 10);

      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(50, 10);
    });
  });

  describe("reverse animation", () => {
    test("plays forward then backward with reverse=true", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
            reverse={true}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Initial
      expect(sprite.x).toBe(0);

      // Halfway through forward animation (32 frames with offset)
      await ticker.tickFrames(32);
      expect(sprite.x).toBeCloseTo(50, 10);

      // End of forward animation
      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(100, 10);

      // Halfway through reverse animation
      await ticker.tickFrames(29);
      expect(sprite.x).toBeCloseTo(50, -1);

      // End of reverse animation (back to start)
      await ticker.tickFrames(31);
      expect(sprite.x).toBeCloseTo(0, -1);
    });

    test("reverse animation with non-linear easing applies flip correctly", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t * t} // Quadratic
            reverse={true}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);

      // Forward: 50% time with quadratic = 25% position
      await ticker.tickFrames(32);
      expect(sprite.x).toBeCloseTo(25, 10);

      // End of forward
      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(100, 10);

      // Reverse: 50% time with flipped quadratic = 75% position
      await ticker.tickFrames(29);
      expect(sprite.x).toBeCloseTo(75, -1);

      // End of reverse
      await ticker.tickFrames(31);
      expect(sprite.x).toBeCloseTo(0, -1);
    });
  });

  describe("replay/looping", () => {
    test("repeats animation when replay=true", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
            replay={true}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // First iteration
      expect(sprite.x).toBe(0);
      await ticker.tickFrames(62);
      expect(sprite.x).toBeCloseTo(100, 10);

      // Should restart from beginning
      await ticker.tickFrames(31);
      expect(sprite.x).toBeCloseTo(50, -1);

      // Complete second iteration
      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(100, -1);

      // And restart again
      await ticker.tickFrames(2);
      expect(sprite.x).toBeCloseTo(0, -1);
    });

    test("replay with reverse creates continuous loop", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
            replay={true}
            reverse={true}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // First forward
      expect(sprite.x).toBe(0);
      await ticker.tickFrames(62);
      expect(sprite.x).toBeCloseTo(100, 10);

      // First reverse
      await ticker.tickFrames(60);
      expect(sprite.x).toBeCloseTo(0, -1);

      // Second forward
      await ticker.tickFrames(61);
      expect(sprite.x).toBeCloseTo(100, -1);

      // Second reverse
      await ticker.tickFrames(61);
      expect(sprite.x).toBeCloseTo(0, 10);
    });
  });

  describe("delay", () => {
    test("waits before starting animation with delay prop", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            delay={500}
            easingFn={(t) => t}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Should stay at initial value during delay
      expect(sprite.x).toBe(0);
      await ticker.tickFrames(15); // ~250ms
      expect(sprite.x).toBe(0);

      await ticker.tickFrames(15); // ~500ms total
      expect(sprite.x).toBe(0);

      // After delay, animation should progress
      await ticker.tickFrames(31); // Animation should be halfway now
      expect(sprite.x).toBeCloseTo(50, 10);

      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(100, 10);
    });

    test("delay applies to reverse animation on replay", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={500}
            delay={500}
            easingFn={(t) => t}
            replay={true}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Initial delay
      await ticker.tickFrames(30); // ~500ms
      expect(sprite.x).toBe(0);

      // Animation completes (duration is 500ms = ~29 frames, but with offset need 31)
      await ticker.tickFrames(31);
      expect(sprite.x).toBe(100);

      // Replay delay (another ~29-30 frames)
      await ticker.tickFrames(29);
      expect(sprite.x).toBe(100);

      // Replay animation starts
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(0);
    });
  });

  describe("shouldStart pause/resume", () => {
    test("pauses animation when shouldStart is false", async () => {
      const [shouldStart, setShouldStart] = createSignal(true);

      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
            shouldStart={shouldStart()}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Animation starts
      expect(sprite.x).toBe(0);
      await ticker.tickFrames(20);
      const pausedX = sprite.x;
      expect(pausedX).toBeGreaterThan(0);

      // Pause the animation
      setShouldStart(false);
      await ticker.tickFrames(1);

      // Value should not change while paused
      await ticker.tickFrames(30);
      expect(sprite.x).toBe(pausedX);

      // Resume the animation
      setShouldStart(true);
      await ticker.tickFrames(1);

      // Should continue from where it paused
      await ticker.tickFrames(10);
      expect(sprite.x).toBeGreaterThan(pausedX);
    });

    test("starts paused when shouldStart is initially false", async () => {
      const [shouldStart, setShouldStart] = createSignal(false);

      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
            shouldStart={shouldStart()}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Should stay at initial value
      expect(sprite.x).toBe(0);
      await ticker.tickFrames(30);
      expect(sprite.x).toBe(0);

      // Start the animation
      setShouldStart(true);
      await ticker.tickFrames(1);

      // Should now animate
      await ticker.tickFrames(31);
      expect(sprite.x).toBe(50);
    });

    test("multiple pause/resume cycles work correctly", async () => {
      const [shouldStart, setShouldStart] = createSignal(true);

      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
            shouldStart={shouldStart()}
          >
            {(value) => <sprite x={value()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);

      // Animate a bit
      await ticker.tickFrames(10);
      const checkpoint1 = sprite.x;
      expect(checkpoint1).toBeGreaterThan(0);

      // Pause
      setShouldStart(false);
      await ticker.tickFrames(1);
      await ticker.tickFrames(10);
      expect(sprite.x).toBe(checkpoint1);

      // Resume
      setShouldStart(true);
      await ticker.tickFrames(1);
      await ticker.tickFrames(10);
      const checkpoint2 = sprite.x;
      expect(checkpoint2).toBeGreaterThan(checkpoint1);

      // Pause again
      setShouldStart(false);
      await ticker.tickFrames(1);
      await ticker.tickFrames(10);
      expect(sprite.x).toBe(checkpoint2);

      // Resume to completion
      setShouldStart(true);
      await ticker.tickFrames(1);
      await ticker.tickFrames(100);
      expect(sprite.x).toBe(100);
    });
  });

  describe("completion status", () => {
    test("done accessor is false during animation", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
          >
            {(value, done) => <sprite x={value()} alpha={done() ? 0.5 : 1} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Not done yet
      expect(sprite.alpha).toBe(1);

      await ticker.tickFrames(30);
      expect(sprite.alpha).toBe(1);

      await ticker.tickFrames(30);
      expect(sprite.alpha).toBe(1);
    });

    test("done accessor is true after animation completes", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={1020}
            easingFn={(t) => t}
          >
            {(value, done) => <sprite x={value()} alpha={done() ? 0.5 : 1} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.alpha).toBe(1);

      // Complete the animation
      await ticker.tickFrames(61);

      // Now it should be done
      await ticker.tickFrames(5);
      expect(sprite.alpha).toBe(0.5);
      expect(sprite.x).toBe(100);
    });

    test("done stays false with replay enabled", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine
            from={0}
            to={100}
            duration={500}
            easingFn={(t) => t}
            replay={true}
          >
            {(value, done) => <sprite x={value()} alpha={done() ? 0.5 : 1} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      // Never done because it replays
      expect(sprite.alpha).toBe(1);

      await ticker.tickFrames(30);
      expect(sprite.alpha).toBe(1);

      await ticker.tickFrames(30);
      expect(sprite.alpha).toBe(1);

      // Even after multiple cycles
      await ticker.tickFrames(100);
      expect(sprite.alpha).toBe(1);
    });
  });

  describe("integration scenarios", () => {
    test("multiple EasingCoroutine instances do not interfere", async () => {
      const TestComponent = () => {
        return (
          <container>
            <EasingCoroutine from={0} to={100} duration={1020} easingFn={(t) => t}>
              {(value) => <sprite x={value()} y={0} />}
            </EasingCoroutine>
            <EasingCoroutine from={0} to={200} duration={1020} easingFn={(t) => t}>
              {(value) => <sprite x={0} y={value()} />}
            </EasingCoroutine>
          </container>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);
      const sprite1 = container.children[0];
      const sprite2 = container.children[1];
      invariant(sprite1 instanceof Sprite);
      invariant(sprite2 instanceof Sprite);

      expect(sprite1.x).toBe(0);
      expect(sprite1.y).toBe(0);
      expect(sprite2.x).toBe(0);
      expect(sprite2.y).toBe(0);

      await ticker.tickFrames(32);
      expect(sprite1.x).toBeCloseTo(50, 10);
      expect(sprite2.y).toBeCloseTo(100, 10);

      await ticker.tickFrames(30);
      expect(sprite1.x).toBeCloseTo(100, 10);
      expect(sprite2.y).toBeCloseTo(200, 10);
    });

    test("works with reactive children content", async () => {
      const [color, setColor] = createSignal(0xff0000);

      const TestComponent = () => {
        return (
          <EasingCoroutine from={0} to={100} duration={1020} easingFn={(t) => t}>
            {(value) => <sprite x={value()} tint={color()} />}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.tint).toBe(0xff0000);

      // Change color mid-animation
      await ticker.tickFrames(20);
      setColor(0x00ff00);
      await ticker.tickFrames(1);

      expect(sprite.tint).toBe(0x00ff00);
      expect(sprite.x).toBeGreaterThan(0);
      expect(sprite.x).toBeLessThan(100);
    });

    test("nested EasingCoroutine components", async () => {
      const TestComponent = () => {
        return (
          <EasingCoroutine from={0} to={100} duration={1020} easingFn={(t) => t}>
            {(x) => (
              <EasingCoroutine from={0} to={50} duration={1020} easingFn={(t) => t}>
                {(y) => <sprite x={x()} y={y()} />}
              </EasingCoroutine>
            )}
          </EasingCoroutine>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      // EasingCoroutine creates containers, navigate down to find the sprite
      let sprite: any = stage.children[0];
      while (sprite && !(sprite instanceof Sprite)) {
        sprite = sprite.children?.[0];
      }
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);

      await ticker.tickFrames(32);
      expect(sprite.x).toBeCloseTo(50, 10);
      expect(sprite.y).toBeCloseTo(25, 10);

      await ticker.tickFrames(30);
      expect(sprite.x).toBeCloseTo(100, 10);
      expect(sprite.y).toBeCloseTo(50, 10);
    });
  });
});