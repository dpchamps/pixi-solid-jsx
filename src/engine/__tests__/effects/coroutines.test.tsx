import { describe, test, expect } from "vitest";
import { createSignal } from "../../../pixi-jsx/solidjs-universal-renderer";
import {
  startCoroutine,
  waitFrames,
  stop,
  createEasingCoroutine,
  CoroutineControl,
  waitMs,
} from "../../effects/coroutines";
import { Sprite, Text } from "pixi.js";

import { renderApplicationWithFakeTicker } from "../../../__tests__/test-utils/test-utils.tsx";
import { invariant, assert } from "../../../utility-types.ts";

describe("startCoroutine", () => {
  describe("basic execution", () => {
    test("executes generator function frame by frame", async () => {
      const TestComponent = () => {
        const [i, setI] = createSignal(0);

        startCoroutine(function* () {
          setI(1);
          yield CoroutineControl.continue();
          setI(2);
          yield CoroutineControl.continue();
          setI(3);
        });

        return <text>Test {i()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("Test 0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Test 1");
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("Test 3");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Test 3");
    });

    test("passes elapsed milliseconds to generator", async () => {
      const TestComponent = () => {
        const [elapsedText, setElapsedText] = createSignal("");

        startCoroutine(function* () {
          const elapsed1 = yield CoroutineControl.continue();
          setElapsedText(`${Math.floor(elapsed1)},`);
          const elapsed2 = yield CoroutineControl.continue();
          setElapsedText((prev) => prev + Math.floor(elapsed2));
        });

        return <text>{elapsedText()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("");
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("17,");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("17,17");
    });

    test("updates sprite position over frames", async () => {
      const TestComponent = () => {
        const [x, setX] = createSignal(0);

        startCoroutine(function* () {
          for (let i = 0; i < 3; i++) {
            setX((prev) => prev + 10);
            yield CoroutineControl.continue();
          }
        });

        return <sprite x={x()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(10);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(20);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(30);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(30); // Coroutine stopped, no more changes
    });
  });

  describe("waitMs", () => {
    test("pauses execution for at least the number of specified ms", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("start");
        const frameMs = 17;

        startCoroutine(function* () {
          setStatus("before-wait");
          yield waitMs(frameMs * 2);
          setStatus("after-wait");
        });

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait");
      // wait 2*17
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("after-wait");
    });

    test("pauses execution for at least the number of specified ms but sometimes more than", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("start");
        const frameMs = 17;
        // one more than 17*2,
        const waitForMs = 35;

        startCoroutine(function* () {
          setStatus("before-wait");
          yield waitMs(waitForMs);
          setStatus("after-wait");
        });

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait");
      // wait 2*17
      await ticker.tickFrames(2);
      // we still haven't waited 35ms (34ms have elapsed)
      expect(textNode.text).toBe("before-wait");
      // we need to wait one more frame
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("after-wait");
    });
  });

  describe("waitFrames", () => {
    test("pauses execution for exact number of frames", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("start");

        startCoroutine(function* () {
          setStatus("before-wait");
          yield waitFrames(3);
          setStatus("after-wait");
        });

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait"); // Still waiting
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait"); // Still waiting
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("after-wait"); // Exactly 3 frames later
    });

    test("waitFrames(0) should resolve immediately but stalls indefinitely", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("start");

        startCoroutine(function* () {
          setStatus("before-wait");
          yield waitFrames(0);
          setStatus("after-wait");
        });

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait");
      await ticker.tickFrames(5);
      // BUG: waitFrames(0) never advances; assertion documents the broken behavior
      expect(textNode.text).toBe("after-wait");
    });

    test("waitFrames(1) waits exactly one frame", async () => {
      const TestComponent = () => {
        const [x, setX] = createSignal(0);

        startCoroutine(function* () {
          setX(1);
          yield waitFrames(1);
          setX(2);
          yield waitFrames(1);
          setX(3);
        });

        return <sprite x={x()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(1);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(2);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(3);
    });
  });

  describe("stop", () => {
    test("terminates coroutine immediately", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("start");

        startCoroutine(function* () {
          setStatus("step1");
          yield CoroutineControl.continue();
          setStatus("step2");
          yield stop();
          setStatus("never-reached");
        });

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step2");
      await ticker.tickFrames(10); // Run many more frames
      expect(textNode.text).toBe("step2"); // Still step2, never reached the "never-reached" state
    });

    test("sets stopped signal to true", async () => {
      const TestComponent = () => {
        const { stopped } = startCoroutine(function* () {
          yield CoroutineControl.continue();
          yield stop();
        });

        return <text>{stopped() ? "stopped" : "running"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("running");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("running");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("stopped");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("stopped");
    });
  });

  describe("dispose", () => {
    test("stops coroutine execution when called", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        const coroutine = function* () {
          while (true) {
            setCount((prev) => prev + 1);
            yield CoroutineControl.continue();
          }
        };

        const { dispose } = startCoroutine(coroutine);

        // Expose dispose for the test
        (globalThis as any).testDispose = dispose;

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("3");

      // Call dispose
      (globalThis as any).testDispose();

      await ticker.tickFrames(3);
      expect(textNode.text).toBe("3"); // Should stay at 3 after dispose

      // Cleanup
      delete (globalThis as any).testDispose;
    });

    test("disposed coroutine doesn't update scene", async () => {
      const TestComponent = () => {
        const [x, setX] = createSignal(0);

        const coroutine = function* () {
          while (true) {
            setX((prev) => prev + 10);
            yield CoroutineControl.continue();
          }
        };

        const { dispose } = startCoroutine(coroutine);

        // Expose dispose for the test
        (globalThis as any).testDispose2 = dispose;

        return <sprite x={x()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(10);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(20);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(30);

      // Dispose and verify no more updates
      (globalThis as any).testDispose2();

      await ticker.tickFrames(5);
      expect(sprite.x).toBe(30); // Should remain 30 after disposal

      // Cleanup
      delete (globalThis as any).testDispose2;
    });
  });

  describe("complex patterns", () => {
    test("mixing continue yields with waitFrames", async () => {
      const TestComponent = () => {
        const [step, setStep] = createSignal(0);

        startCoroutine(function* () {
          setStep(1);
          yield CoroutineControl.continue();
          setStep(2);
          yield waitFrames(2);
          setStep(3);
          yield CoroutineControl.continue();
          setStep(4);
        });

        return <text>{step()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1"); // After first yield
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2"); // After 1 frame
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2"); // Still waiting (1 of 2 frames)
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("3"); // After waitFrames(2) completed
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("4"); // After final yield
    });

    test("infinite loop with stop condition", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        startCoroutine(function* () {
          while (true) {
            const current = count();
            if (current >= 5) {
              yield stop();
            }
            setCount((prev) => prev + 1);
            yield CoroutineControl.continue();
          }
        });

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("3");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("4");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("5"); // Stops at 5
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("5"); // Remains at 5
    });
  });
});

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
