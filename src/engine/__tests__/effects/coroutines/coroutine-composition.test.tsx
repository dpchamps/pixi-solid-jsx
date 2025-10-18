import { describe, expect, test } from "vitest";
import { createSignal } from "solid-custom-renderer/index.ts";
import {
  chainCoroutine,
  CoroutineControl,
  createEasingCoroutine,
  startCoroutine,
  waitFrameCoroutine,
  waitMsCoroutine,
} from "../../../effects/coroutines.ts";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.tsx";
import { invariant } from "../../../../utility-types.ts";
import { Container, Sprite, Text } from "pixi.js";

describe("coroutine composition", () => {
  describe("chainCoroutine", () => {
    test("executes coroutines sequentially", async () => {
      const TestComponent = () => {
        const [log, setLog] = createSignal("");

        const step1 = function* () {
          setLog((prev) => prev + "A");
          yield CoroutineControl.continue();
          setLog((prev) => prev + "B");
        };

        const step2 = function* () {
          setLog((prev) => prev + "C");
          yield CoroutineControl.continue();
          setLog((prev) => prev + "D");
        };

        const step3 = function* () {
          setLog((prev) => prev + "E");
        };

        startCoroutine(chainCoroutine(step1, step2, step3));

        return <text>{log()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("ABC");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("ABCDE");
    });

    test("chains easing coroutines", async () => {
      const MAX_X = 100;
      const MAX_Y = 50;
      const TestComponent = () => {
        const [x, setX] = createSignal(0);
        const [y, setY] = createSignal(0);

        const moveRight = createEasingCoroutine(
          (lerp) => setX(lerp(0, MAX_X)),
          (t) => t,
          34,
        );

        const moveDown = createEasingCoroutine(
          (lerp) => setY(lerp(0, MAX_Y)),
          (t) => t,
          34,
        );

        startCoroutine(chainCoroutine(moveRight, moveDown));

        return <sprite x={x()} y={y()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const sprite = container.children[0] as Sprite;
      invariant(sprite);

      // First frame, duration is 0
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);

      await ticker.tickFrames(1);
      expect(sprite.x).toBe(MAX_X / 2);
      expect(sprite.y).toBe(0);

      await ticker.tickFrames(1);
      expect(sprite.x).toBe(MAX_X);
      expect(sprite.y).toBe(0);

      await ticker.tickFrames(1);
      expect(sprite.x).toBe(MAX_X);
      expect(sprite.y).toBe(MAX_Y / 2);

      await ticker.tickFrames(1);
      expect(sprite.x).toBe(MAX_X);
      expect(sprite.y).toBe(MAX_Y);
    });

    test("stops chain when coroutine returns stop", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("start");

        const step1 = function* () {
          setStatus("step1");
          yield CoroutineControl.continue();
        };

        const step2 = function* () {
          setStatus("step2");
          yield CoroutineControl.stop();
        };

        const step3 = function* () {
          setStatus("step3-never-reached");
        };

        startCoroutine(chainCoroutine(step1, step2, step3));

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step2");
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("step2");
    });

    test("chains with wait coroutines", async () => {
      const TestComponent = () => {
        const [log, setLog] = createSignal("");

        const step1 = function* () {
          setLog((prev) => prev + "A");
        };

        const step2 = function* () {
          setLog((prev) => prev + "B");
        };

        startCoroutine(chainCoroutine(step1, waitFrameCoroutine(2), step2));

        return <text>{log()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("");
      // Frame 1: step1 executes (no yield, completes immediately), waitFrameCoroutine(2) starts
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      // Frame 2: still waiting (1 of 2 frames)
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      // Frame 3: wait completes, step2 executes
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("AB");
    });

    test("handles empty chain", async () => {
      const TestComponent = () => {
        const { stopped } = startCoroutine(chainCoroutine());

        return <text>{stopped() ? "stopped" : "running"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("running");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("stopped");
    });

    test("chains single coroutine", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        const increment = function* () {
          setCount(1);
          yield CoroutineControl.continue();
          setCount(2);
        };

        startCoroutine(chainCoroutine(increment));

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");
    });
  });

  describe("waitFrameCoroutine", () => {
    test("waits exact number of frames", async () => {
      const TestComponent = () => {
        const [log, setLog] = createSignal("");

        const sequence = function* () {
          setLog("A");
          yield* waitFrameCoroutine(3)();
          setLog("B");
        };

        startCoroutine(sequence);

        return <text>{log()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("B");
    });

    test("works in chainCoroutine", async () => {
      const STEP1_X = 10;
      const STEP2_X = 20;
      const WAIT_FRAMES = 2;

      const TestComponent = () => {
        const [x, setX] = createSignal(0);

        const step1 = function* () {
          setX(STEP1_X);
        };

        const step2 = function* () {
          setX(STEP2_X);
        };

        startCoroutine(
          chainCoroutine(step1, waitFrameCoroutine(WAIT_FRAMES), step2),
        );

        return <sprite x={x()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const sprite = container.children[0] as Sprite;
      invariant(sprite);

      expect(sprite.x).toBe(0);
      // Frame 1: step1 executes, wait starts
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(STEP1_X);
      // Frame 2: waiting (1 of 2)
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(STEP1_X);
      // Frame 3: wait completes, step2 executes
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(STEP2_X);
    });

    test("can chain multiple frame waits", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        startCoroutine(
          chainCoroutine(
            function* () {
              setCount(1);
            },
            waitFrameCoroutine(1),
            function* () {
              setCount(2);
            },
            waitFrameCoroutine(2),
            function* () {
              setCount(3);
            },
          ),
        );

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("3");
    });
  });

  describe("waitMsCoroutine", () => {
    test("waits for milliseconds", async () => {
      const TestComponent = () => {
        const [log, setLog] = createSignal("");

        const sequence = function* () {
          setLog("A");
          yield* waitMsCoroutine(51)();
          setLog("B");
        };

        startCoroutine(sequence);

        return <text>{log()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("B");
    });

    test("works in chainCoroutine", async () => {
      const TestComponent = () => {
        const [status, setStatus] = createSignal("start");

        startCoroutine(
          chainCoroutine(
            function* () {
              setStatus("step1");
            },
            waitMsCoroutine(34),
            function* () {
              setStatus("step2");
            },
          ),
        );

        return <text>{status()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step2");
    });

    test("can mix with waitFrameCoroutine", async () => {
      const TestComponent = () => {
        const [log, setLog] = createSignal("");

        startCoroutine(
          chainCoroutine(
            function* () {
              setLog("A");
            },
            waitMsCoroutine(34),
            function* () {
              setLog((p) => p + "B");
            },
            waitFrameCoroutine(1),
            function* () {
              setLog((p) => p + "C");
            },
          ),
        );

        return <text>{log()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("AB");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("ABC");
    });

    test("zero milliseconds completes on next frame", async () => {
      const TestComponent = () => {
        const [log, setLog] = createSignal("");

        startCoroutine(
          chainCoroutine(
            function* () {
              setLog("A");
            },
            waitMsCoroutine(0),
            function* () {
              setLog((p) => p + "B");
            },
          ),
        );

        return <text>{log()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("");
      // Frame 1: first step executes, waitMs(0) starts
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("A");
      // Frame 2: wait completes (0ms elapsed), second step executes
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("AB");
    });
  });

  describe("complex composition patterns", () => {
    test("chains easing with waits and custom logic", async () => {
      const TestComponent = () => {
        const [x, setX] = createSignal(0);
        const [status, setStatus] = createSignal("");

        const animation = chainCoroutine(
          createEasingCoroutine(
            (lerp) => setX(lerp(0, 100)),
            (t) => t,
            51,
          ),
          waitFrameCoroutine(2),
          function* () {
            setStatus("middle");
            yield CoroutineControl.continue();
          },
          waitMsCoroutine(17),
          createEasingCoroutine(
            (lerp) => setX(lerp(100, 0)),
            (t) => t,
            51,
          ),
          function* () {
            setStatus("done");
          },
        );

        startCoroutine(animation);

        return (
          <text>
            {x().toFixed(0)},{status()}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      await ticker.tickFrames(1);
      expect(textNode.text).toMatch(/^\d+,$/);

      await ticker.tickFrames(3);
      expect(textNode.text).toMatch(/^100,$/);

      await ticker.tickFrames(2);
      expect(textNode.text).toBe("100,middle");

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100,middle");

      await ticker.tickFrames(4);
      const [xValue] = textNode.text.split(",");
      expect(Number(xValue || "")).toBeLessThan(100);

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("0,done");
    });

    test("nested chains work correctly", async () => {
      const TestComponent = () => {
        const [log, setLog] = createSignal("");

        const innerChain = chainCoroutine(
          function* () {
            setLog((p) => p + "B");
          },
          waitFrameCoroutine(1),
          function* () {
            setLog((p) => p + "C");
          },
        );

        const outerChain = chainCoroutine(
          function* () {
            setLog("A");
          },
          innerChain,
          function* () {
            setLog((p) => p + "D");
          },
        );

        startCoroutine(outerChain);

        return <text>{log()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("");
      // Frame 1: outer step A executes, inner step B executes, wait starts
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("AB");
      // Frame 2: wait completes, inner step C executes, outer step D executes
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("ABCD");
    });

    test("composition with conditional logic", async () => {
      const TestComponent = () => {
        const [count, setCount] = createSignal(0);
        const [shouldStop] = createSignal(false);

        const conditionalStep = function* () {
          if (shouldStop()) {
            yield CoroutineControl.stop();
          } else {
            yield CoroutineControl.continue();
          }
        };

        startCoroutine(
          chainCoroutine(
            function* () {
              setCount(1);
            },
            waitFrameCoroutine(1),
            function* () {
              setCount(2);
            },
            conditionalStep,
            function* () {
              setCount(3);
            },
          ),
        );

        return <text>{count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));
      const container = stage.children[0] as Container;
      const textNode = container.children[0] as Text;
      invariant(textNode);

      expect(textNode.text).toBe("0");
      // Frame 1: setCount(1) executes, waitFrameCoroutine(1) starts
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      // Frame 2: wait completes, setCount(2) executes, conditionalStep yields continue
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");
      // Frame 3: setCount(3) executes
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("3");
    });
  });
});
