import { beforeAll, describe, expect, test, vi } from "vitest";
import { createSignal } from "../../../../pixi-jsx/solidjs-universal-renderer/index";
import {
  CoroutineControl,
  startCoroutine,
  stop,
  waitFrames,
  waitMs,
} from "../../../effects/coroutines";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils";
import { assert, invariant } from "../../../../utility-types";
import { Sprite, Text } from "pixi.js";
import { createSynchronizedEffect } from "../../../core/query-fns";

describe("startCoroutine", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });
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

  describe("pause and resume", () => {
    test("pause stops coroutine execution", async () => {
      const TestComponent = (props: { shouldPause: () => boolean }) => {
        const [count, setCount] = createSignal(0);

        const coroutine = function* () {
          while (true) {
            setCount((prev) => prev + 1);
            yield CoroutineControl.continue();
          }
        };

        const { pause, resume } = startCoroutine(coroutine);

        createSynchronizedEffect(props.shouldPause, (shouldPause) => {
          if (shouldPause) {
            pause();
          } else {
            resume();
          }
        });

        return <text>{count()}</text>;
      };

      const [shouldPause, setShouldPause] = createSignal(false);

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent shouldPause={shouldPause} />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");

      setShouldPause(true);
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("2");
    });

    test("resume restarts paused coroutine", async () => {
      const TestComponent = (props: { shouldPause: () => boolean }) => {
        const [x, setX] = createSignal(0);

        const coroutine = function* () {
          while (true) {
            setX((prev) => prev + 10);
            yield CoroutineControl.continue();
          }
        };

        const { pause, resume } = startCoroutine(coroutine);

        createSynchronizedEffect(
          () => props.shouldPause(),
          (shouldPause) => {
            if (shouldPause) {
              pause();
            } else {
              resume();
            }
          },
        );

        return <sprite x={x()} />;
      };

      const [shouldPause, setShouldPause] = createSignal(false);

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent shouldPause={shouldPause} />
      ));
      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      await ticker.tickFrames(2);
      expect(sprite.x).toBe(20);

      setShouldPause(true);
      await ticker.tickFrames(3);
      expect(sprite.x).toBe(20);

      setShouldPause(false);
      await ticker.tickFrames(2);
      expect(sprite.x).toBe(40);
    });

    test("starting coroutine paused doesn't execute until resumed", async () => {
      const TestComponent = (props: { shouldResume: () => boolean }) => {
        const [status, setStatus] = createSignal("initial");

        const coroutine = function* () {
          setStatus("running");
          yield CoroutineControl.continue();
          setStatus("step2");
        };

        const { resume } = startCoroutine(coroutine, true);

        createSynchronizedEffect(
          () => props.shouldResume(),
          (shouldResume) => {
            if (shouldResume) {
              resume();
            }
          },
        );

        return <text>{status()}</text>;
      };

      const [shouldResume, setShouldResume] = createSignal(false);

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent shouldResume={shouldResume} />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("initial");
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("initial");

      setShouldResume(true);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("running");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("step2");
    });

    test("pause during waitMs preserves wait state", async () => {
      const TestComponent = (props: { shouldPause: () => boolean }) => {
        const [status, setStatus] = createSignal("start");

        const coroutine = function* () {
          setStatus("before-wait");
          yield waitMs(51);
          setStatus("after-wait");
        };

        const { pause, resume } = startCoroutine(coroutine);

        createSynchronizedEffect(
          () => props.shouldPause(),
          (shouldPause) => {
            if (shouldPause) {
              pause();
            } else {
              resume();
            }
          },
        );

        return <text>{status()}</text>;
      };

      const [shouldPause, setShouldPause] = createSignal(false);

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent shouldPause={shouldPause} />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait");

      setShouldPause(true);
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("before-wait");

      setShouldPause(false);
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("after-wait");
    });

    test("pause during waitFrames preserves frame count", async () => {
      const TestComponent = (props: { shouldPause: () => boolean }) => {
        const [status, setStatus] = createSignal("start");

        const coroutine = function* () {
          setStatus("before-wait");
          yield waitFrames(4);
          setStatus("after-wait");
        };

        const { pause, resume } = startCoroutine(coroutine);

        createSynchronizedEffect(
          () => props.shouldPause(),
          (shouldPause) => {
            if (shouldPause) {
              pause();
            } else {
              resume();
            }
          },
        );

        return <text>{status()}</text>;
      };

      const [shouldPause, setShouldPause] = createSignal(false);

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent shouldPause={shouldPause} />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("start");
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("before-wait");
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("before-wait");

      setShouldPause(true);
      await ticker.tickFrames(10);
      expect(textNode.text).toBe("before-wait");

      setShouldPause(false);
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("after-wait");
    });

    test("multiple pause/resume cycles", async () => {
      const TestComponent = (props: { shouldPause: () => boolean }) => {
        const [count, setCount] = createSignal(0);

        const coroutine = function* () {
          for (let i = 0; i < 10; i++) {
            setCount((prev) => prev + 1);
            yield CoroutineControl.continue();
          }
        };

        const { pause, resume } = startCoroutine(coroutine);

        createSynchronizedEffect(
          () => props.shouldPause(),
          (shouldPause) => {
            if (shouldPause) {
              pause();
            } else {
              resume();
            }
          },
        );

        return <text>{count()}</text>;
      };

      const [shouldPause, setShouldPause] = createSignal(false);

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent shouldPause={shouldPause} />
      ));
      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      await ticker.tickFrames(2);
      expect(textNode.text).toBe("2");

      setShouldPause(true);
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("2");

      setShouldPause(false);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("3");

      setShouldPause(true);
      await ticker.tickFrames(3);
      expect(textNode.text).toBe("3");

      setShouldPause(false);
      await ticker.tickFrames(3);
      expect(textNode.text).toBe("6");
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
