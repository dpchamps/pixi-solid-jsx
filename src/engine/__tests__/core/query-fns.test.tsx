import { describe, test, expect } from "vitest";
import { createSignal } from "../../../pixi-jsx/solidjs-universal-renderer";
import { createSynchronizedEffect, onEveryFrame } from "../../core/query-fns";
import { Text, Sprite, Container } from "pixi.js";
import { renderApplicationWithFakeTicker } from "../../../__tests__/test-utils/test-utils.tsx";
import { invariant, assert } from "../../../utility-types.ts";
import { vi, beforeAll, afterEach, afterAll } from "vitest";

describe("createSynchronizedEffect", () => {
  describe("basic reactivity", () => {
    test("signal changes trigger effect on next frame", async () => {
      const TestComponent = () => {
        const [x, setX] = createSignal(0);
        const [effectRan, setEffectRan] = createSignal(false);

        createSynchronizedEffect(
          () => x(),
          (value) => {
            setEffectRan(true);
          },
        );

        return (
          <container>
            <text>{effectRan() ? "ran" : "not-ran"}</text>
            <sprite x={x()} />
          </container>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);
      assert(container instanceof Container);
      const textNode = container.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("not-ran");

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("ran");
    });

    test("effect receives queried value from signal", async () => {
      const [x, setX] = createSignal(100);
      const TestComponent = () => {
        const [receivedValue, setReceivedValue] = createSignal(0);

        createSynchronizedEffect(x, (value) => {
          setReceivedValue(value);
        });

        return <text>{receivedValue()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100");

      setX(250);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("250");
    });

    test("updates sprite position based on signal changes", async () => {
      const [targetX, setTargetX] = createSignal(0);
      const TestComponent = () => {
        const [spriteX, setSpriteX] = createSignal(0);

        createSynchronizedEffect(targetX, (x) => {
          setSpriteX(x);
        });

        return <sprite x={spriteX()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);

      await ticker.tickFrames(1);
      expect(sprite.x).toBe(0);

      setTargetX(100);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(100);

      setTargetX(250);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(250);
    });

    test("updates only when signals update, otherwise does not fire", async () => {
      const [x, setX] = createSignal(100);
      const mockFn = vi.fn();
      const TestComponent = () => {
        const [receivedValue, setReceivedValue] = createSignal(0);

        createSynchronizedEffect(x, (value) => {
          setReceivedValue(value);
          mockFn();
        });

        return <text>{receivedValue()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");
      expect(mockFn).not.toHaveBeenCalled();

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100");
      expect(mockFn).toHaveBeenCalledTimes(1);

      await ticker.tickFrames(10);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("multiple signal tracking", () => {
    test("query tracks multiple signals", async () => {
      const [x, setX] = createSignal(0);
      const [y, setY] = createSignal(0);

      const TestComponent = () => {
        const [text, setText] = createSignal("");

        createSynchronizedEffect(
          () => ({ x: x(), y: y() }),
          ({ x, y }) => {
            setText(`${x},${y}`);
          },
        );

        return <text>{text()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("");

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("0,0");

      setX(100);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100,0");

      setY(200);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100,200");

      setX(50);
      setY(75);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("50,75");
    });

    test("effect only runs when tracked signals change", async () => {
      const [tracked, setTracked] = createSignal(0);
      const [untracked, setUntracked] = createSignal(0);
      const [runCount, setRunCount] = createSignal(0);

      const TestComponent = () => {
        createSynchronizedEffect(
          () => tracked(),
          () => {
            setRunCount((c) => c + 1);
          },
        );

        return (
          <container>
            <text>runs: {runCount()}</text>
            <sprite x={untracked()} />
          </container>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);
      assert(container instanceof Container);
      const textNode = container.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("runs: 0");

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("runs: 1");

      setUntracked(100);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("runs: 1");

      setTracked(1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("runs: 2");
    });
  });

  describe("disposal", () => {
    test("dispose function stops effect execution", async () => {
      const [counter, setCounter] = createSignal(0);
      let dispose: () => void = () => {};

      const TestComponent = () => {
        const [effectCounter, setEffectCounter] = createSignal(0);

        dispose = createSynchronizedEffect(
          () => counter(),
          () => {
            setEffectCounter((c) => c + 1);
          },
        );

        return <text>{effectCounter()}</text>;
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

      setCounter(1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");

      dispose();

      setCounter(2);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");

      setCounter(3);
      await ticker.tickFrames(5);
      expect(textNode.text).toBe("2");
    });

    test("early disposal prevents any execution", async () => {
      const TestComponent = () => {
        const [executed, setExecuted] = createSignal(false);

        const dispose = createSynchronizedEffect(
          () => ({}),
          () => {
            setExecuted(true);
          },
        );

        dispose();

        return <text>{executed() ? "executed" : "not-executed"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("not-executed");

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("not-executed");
    });
  });

  describe("complex patterns", () => {
    test("multiple effects can coexist independently", async () => {
      const [a, setA] = createSignal(0);
      const [b, setB] = createSignal(0);

      const TestComponent = () => {
        const [resultA, setResultA] = createSignal(0);
        const [resultB, setResultB] = createSignal(0);

        createSynchronizedEffect(
          () => a(),
          (val) => setResultA(val * 2),
        );

        createSynchronizedEffect(
          () => b(),
          (val) => setResultB(val * 3),
        );

        return (
          <container>
            <text>A: {resultA()}</text>
            <text>B: {resultB()}</text>
          </container>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);
      assert(container instanceof Container);
      const textA = container.children[0];
      const textB = container.children[1];
      invariant(textA);
      invariant(textB);
      assert(textA instanceof Text);
      assert(textB instanceof Text);

      expect(textA.text).toBe("A: 0");
      expect(textB.text).toBe("B: 0");

      await ticker.tickFrames(1);
      expect(textA.text).toBe("A: 0");
      expect(textB.text).toBe("B: 0");

      setA(5);
      await ticker.tickFrames(1);
      expect(textA.text).toBe("A: 10");
      expect(textB.text).toBe("B: 0");

      setB(7);
      await ticker.tickFrames(1);
      expect(textA.text).toBe("A: 10");
      expect(textB.text).toBe("B: 21");
    });

    test("query can return complex objects", async () => {
      const [pos, setPos] = createSignal({ x: 0, y: 0 });

      const TestComponent = () => {
        const [spritePos, setSpritePos] = createSignal({ x: 0, y: 0 });

        createSynchronizedEffect(
          () => ({ position: pos(), scale: 2 }),
          ({ position, scale }) => {
            setSpritePos({
              x: position.x * scale,
              y: position.y * scale,
            });
          },
        );

        return <sprite x={spritePos().x} y={spritePos().y} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);

      await ticker.tickFrames(1);
      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);

      setPos({ x: 10, y: 20 });
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(20);
      expect(sprite.y).toBe(40);
    });
  });
});

describe("onEveryFrame", () => {
  describe("unconditional execution", () => {
    test("runs on every single frame", async () => {
      const TestComponent = () => {
        const [frameCount, setFrameCount] = createSignal(0);

        onEveryFrame(() => {
          setFrameCount((c) => c + 1);
        });

        return <text>{frameCount()}</text>;
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

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("7");

      await ticker.tickFrames(10);
      expect(textNode.text).toBe("17");
    });

    test("continues execution regardless of signal changes", async () => {
      const [shouldRun, setShouldRun] = createSignal(true);

      const TestComponent = () => {
        const [frameCount, setFrameCount] = createSignal(0);

        onEveryFrame(() => {
          setFrameCount((c) => c + 1);
        });

        return (
          <container>
            <text>count: {frameCount()}</text>
            <sprite x={shouldRun() ? 1 : 0} />
          </container>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);
      assert(container instanceof Container);
      const textNode = container.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("count: 0");

      await ticker.tickFrames(3);
      expect(textNode.text).toBe("count: 3");

      setShouldRun(false);
      await ticker.tickFrames(3);
      expect(textNode.text).toBe("count: 6");
    });
  });

  describe("time data access", () => {
    test("receives deltaTime every frame", async () => {
      const TestComponent = () => {
        const [totalDelta, setTotalDelta] = createSignal(0);

        onEveryFrame((time) => {
          setTotalDelta((t) => t + time.deltaTime);
        });

        return <text>{totalDelta().toFixed(2)}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0.00");

      await ticker.tickFrames(1);
      expect(parseFloat(textNode.text)).toBeGreaterThan(0);

      await ticker.tickFrames(5);
      expect(parseFloat(textNode.text)).toBeGreaterThan(5);
    });

    test("receives elapsedMsSinceLastFrame every frame", async () => {
      const TestComponent = () => {
        const [lastElapsed, setLastElapsed] = createSignal(0);

        onEveryFrame((time) => {
          setLastElapsed(time.elapsedMS);
        });

        return <text>{lastElapsed()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");

      await ticker.tickFrames(2);
      expect(parseFloat(textNode.text)).toBe(17);

      await ticker.tickFrames(1);
      expect(parseFloat(textNode.text)).toBe(17);
    });

    test("receives fps every frame", async () => {
      const TestComponent = () => {
        const [currentFps, setCurrentFps] = createSignal(0);

        onEveryFrame((time) => {
          setCurrentFps(time.FPS);
        });

        return <text>{currentFps().toFixed(1)}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0.0");

      await ticker.tickFrames(2);
      expect(parseFloat(textNode.text)).toBeGreaterThan(0);
    });
  });

  describe("continuous updates", () => {
    test("continuously rotates sprite", async () => {
      const TestComponent = () => {
        const [rotation, setRotation] = createSignal(0);

        onEveryFrame((time) => {
          setRotation((r) => r + 0.1 * time.deltaTime);
        });

        return <sprite rotation={rotation()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.rotation).toBe(0);

      await ticker.tickFrames(1);
      expect(sprite.rotation).toBeGreaterThan(0);
      const firstRotation = sprite.rotation;

      await ticker.tickFrames(1);
      expect(sprite.rotation).toBeGreaterThan(firstRotation);

      await ticker.tickFrames(10);
      expect(sprite.rotation).toBeGreaterThan(firstRotation);
    });

    test("accumulates time-based movement", async () => {
      const TestComponent = () => {
        const [x, setX] = createSignal(0);
        const velocity = 10;

        onEveryFrame((time) => {
          setX((prevX) => prevX + velocity * time.deltaTime);
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

      await ticker.tickFrames(2);
      expect(sprite.x).toBeGreaterThan(0);
      const firstX = sprite.x;

      await ticker.tickFrames(1);
      expect(sprite.x).toBeGreaterThan(firstX);
      const secondX = sprite.x;

      await ticker.tickFrames(1);
      const thirdX = sprite.x;

      const diff1 = secondX - firstX;
      const diff2 = thirdX - secondX;
      expect(diff1).toBeCloseTo(diff2, 0);
    });
  });

  describe("disposal", () => {
    test("dispose stops execution", async () => {
      let dispose: () => void = () => {};

      const TestComponent = () => {
        const [count, setCount] = createSignal(0);

        dispose = onEveryFrame(() => {
          setCount((c) => c + 1);
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

      await ticker.tickFrames(3);
      expect(textNode.text).toBe("3");

      dispose();

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("3");
    });
  });

  describe("performance characteristics", () => {
    test("executes exact number of times as frames ticked", async () => {
      const TestComponent = () => {
        const [executions, setExecutions] = createSignal(0);

        onEveryFrame(() => {
          setExecutions((e) => e + 1);
        });

        return <text>{executions()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      const framesToTick = [1, 5, 10, 20, 100];
      let expectedTotal = 0;

      for (const frames of framesToTick) {
        await ticker.tickFrames(frames);
        expectedTotal += frames;
        expect(parseInt(textNode.text)).toBe(expectedTotal);
      }
    });
  });
});

describe("edge cases", () => {
  describe("ownership and cleanup", () => {
    test("effects run on next frame after creation", async () => {
      const TestComponent = () => {
        const [counter, setCounter] = createSignal(0);

        createSynchronizedEffect(
          () => ({}),
          () => {
            setCounter((c) => c + 1);
          },
        );

        return <text>{counter()}</text>;
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
    });

    test("multiple onEveryFrame effects execute independently", async () => {
      const TestComponent = () => {
        const [countA, setCountA] = createSignal(0);
        const [countB, setCountB] = createSignal(0);

        onEveryFrame(() => {
          setCountA((c) => c + 1);
        });

        onEveryFrame(() => {
          setCountB((c) => c + 2);
        });

        return (
          <container>
            <text>A: {countA()}</text>
            <text>B: {countB()}</text>
          </container>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);
      assert(container instanceof Container);
      const textA = container.children[0];
      const textB = container.children[1];
      invariant(textA);
      invariant(textB);
      assert(textA instanceof Text);
      assert(textB instanceof Text);

      expect(textA.text).toBe("A: 0");
      expect(textB.text).toBe("B: 0");

      await ticker.tickFrames(1);
      expect(textA.text).toBe("A: 1");
      expect(textB.text).toBe("B: 2");

      await ticker.tickFrames(3);
      expect(textA.text).toBe("A: 4");
      expect(textB.text).toBe("B: 8");
    });
  });

  describe("reactive vs non-reactive", () => {
    test("createSynchronizedEffect is reactive to query dependencies", async () => {
      const [trigger, setTrigger] = createSignal(0);

      const TestComponent = () => {
        const [execCount, setExecCount] = createSignal(0);

        createSynchronizedEffect(
          () => trigger(),
          () => {
            setExecCount((c) => c + 1);
          },
        );

        return <text>{execCount()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("1");

      setTrigger(1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("2");

      await ticker.tickFrames(5);
      expect(textNode.text).toBe("2");
    });

    test("onEveryFrame is not reactive", async () => {
      const [trigger, setTrigger] = createSignal(0);

      const TestComponent = () => {
        const [execCount, setExecCount] = createSignal(0);

        onEveryFrame(() => {
          trigger();
          setExecCount((c) => c + 1);
        });

        return (
          <container>
            <text>{execCount()}</text>
            <sprite x={trigger()} />
          </container>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0]?.children[0];
      invariant(container);
      assert(container instanceof Container);
      const textNode = container.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");

      await ticker.tickFrames(3);
      expect(textNode.text).toBe("3");

      setTrigger(1);
      await ticker.tickFrames(3);
      expect(textNode.text).toBe("6");
    });
  });

  describe("effect cascades", () => {
    beforeAll(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.clearAllTimers();
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    test("a cascaded createSynchronizedEffect runs within the same frame", async () => {
      const cascadeSpy = vi.fn();
      const flagSpy = vi.fn();
      let setFlag: ((value: boolean) => void) | undefined;

      const TestComponent = (props: {
        registerSetter: (setter: (value: boolean) => void) => void;
      }) => {
        const [flag, updateFlag] = createSignal(false);
        const [cascade, setCascade] = createSignal(false);

        props.registerSetter(updateFlag);

        createSynchronizedEffect(
          () => flag(),
          (value) => {
            flagSpy(value);
            if (value) setCascade(true);
          },
        );

        createSynchronizedEffect(
          () => cascade(),
          (value) => {
            if (value) cascadeSpy(value);
          },
        );

        return <container />;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent registerSetter={(setter) => (setFlag = setter)} />
      ));

      invariant(setFlag);

      expect(flagSpy).toHaveBeenCalledTimes(0);
      expect(cascadeSpy).toHaveBeenCalledTimes(0);

      await ticker.tickFrames(1);
      // effects are fired the first time after the first tick
      expect(flagSpy).toHaveBeenCalledTimes(1);
      // we conditionally call cascadeSpy only when `flag` is true
      expect(cascadeSpy).toHaveBeenCalledTimes(0);

      setFlag(true);

      // we haven't ticked the timer yet, so nothing has changed from the last state,
      // but because the `flag` signal has been set we've scheduled work for the next frame
      expect(flagSpy).toHaveBeenCalledTimes(1);
      expect(cascadeSpy).toHaveBeenCalledTimes(0);

      //now, we capture a cascade in a single frame:
      // 1. the effect depending on `flag` fires, which in turn updates `cascade`
      // 2. the effect depending on `cascade` fires in the same frame
      await ticker.tickFrames(1);
      expect(flagSpy).toHaveBeenCalledTimes(2);
      expect(cascadeSpy).toHaveBeenCalledTimes(1);
    });

    test("three-level cascades flush within a single frame when within budget", async () => {
      const firstSpy = vi.fn();
      const secondSpy = vi.fn();
      const thirdSpy = vi.fn();
      let setFlag: ((value: boolean) => void) | undefined;

      const TestComponent = (props: {
        registerSetter: (setter: (value: boolean) => void) => void;
      }) => {
        const [flag, updateFlag] = createSignal(false);
        const [mid, setMid] = createSignal(false);
        const [final, setFinal] = createSignal(false);

        props.registerSetter(updateFlag);

        createSynchronizedEffect(
          () => flag(),
          (value) => {
            firstSpy(value);
            if (value) setMid(true);
          },
        );

        createSynchronizedEffect(
          () => mid(),
          (value) => {
            if (value) {
              secondSpy(value);
              setFinal(true);
            }
          },
        );

        createSynchronizedEffect(
          () => final(),
          (value) => {
            if (value) thirdSpy(value);
          },
        );

        return <container />;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent registerSetter={(setter) => (setFlag = setter)} />
      ));

      invariant(setFlag);

      await ticker.tickFrames(1);
      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).toHaveBeenCalledTimes(0);
      expect(thirdSpy).toHaveBeenCalledTimes(0);

      setFlag(true);
      await ticker.tickFrames(1);
      expect(firstSpy).toHaveBeenCalledTimes(2);
      expect(secondSpy).toHaveBeenCalledTimes(1);
      expect(thirdSpy).toHaveBeenCalledTimes(1);
    });

    test("a heavy cascade defers until the following frame when the budget is exhausted", async () => {
      const cascadeSpy = vi.fn();
      const flagSpy = vi.fn();
      let setFlag: ((value: boolean) => void) | undefined;

      const TestComponent = (props: {
        registerSetter: (setter: (value: boolean) => void) => void;
      }) => {
        const [flag, updateFlag] = createSignal(false);
        const [cascade, setCascade] = createSignal(false);

        props.registerSetter(updateFlag);

        createSynchronizedEffect(
          () => flag(),
          (value) => {
            flagSpy(value);
            if (value) {
              // intentionally make this effect take more than the budgeted frame window
              vi.advanceTimersByTime(20);
              setCascade(true);
            }
          },
        );

        createSynchronizedEffect(
          () => cascade(),
          (value) => {
            if (value) cascadeSpy(value);
          },
        );

        return <container />;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent registerSetter={(setter) => (setFlag = setter)} />
      ));

      invariant(setFlag);

      await ticker.tickFrames(1);
      // effects are fired the first time after the first tick
      expect(flagSpy).toHaveBeenCalledTimes(1);
      // we conditionally call cascadeSpy only when `flag` is true
      expect(cascadeSpy).toHaveBeenCalledTimes(0);

      setFlag(true);
      await ticker.tickFrames(1);
      // setting the flag spy effect was computationally expensive.
      // this effect still fires...
      expect(flagSpy).toHaveBeenCalledTimes(2);
      // but this one didn't yet
      expect(cascadeSpy).toHaveBeenCalledTimes(0);

      await ticker.tickFrames(1);
      // now one tick later, the flag effect is stable (it hasn't been run again)
      expect(flagSpy).toHaveBeenCalledTimes(2);
      // ...and the cascade spills over from last frame's computation
      expect(cascadeSpy).toHaveBeenCalledTimes(1);
    });

    test("downstream cascades defer when earlier stage exceeds budget", async () => {
      const firstSpy = vi.fn();
      const secondSpy = vi.fn();
      const thirdSpy = vi.fn();
      let setFlag: ((value: boolean) => void) | undefined;

      const TestComponent = (props: {
        registerSetter: (setter: (value: boolean) => void) => void;
      }) => {
        const [flag, updateFlag] = createSignal(false);
        const [mid, setMid] = createSignal(false);
        const [final, setFinal] = createSignal(false);

        props.registerSetter(updateFlag);

        createSynchronizedEffect(
          () => flag(),
          (value) => {
            firstSpy(value);
            if (value) {
              vi.advanceTimersByTime(20);
              setMid(true);
            }
          },
        );

        createSynchronizedEffect(
          () => mid(),
          (value) => {
            if (value) {
              secondSpy(value);
              setFinal(true);
            }
          },
        );

        createSynchronizedEffect(
          () => final(),
          (value) => {
            if (value) thirdSpy(value);
          },
        );

        return <container />;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent registerSetter={(setter) => (setFlag = setter)} />
      ));

      invariant(setFlag);

      await ticker.tickFrames(1);
      expect(firstSpy).toHaveBeenCalledTimes(1);
      expect(secondSpy).toHaveBeenCalledTimes(0);
      expect(thirdSpy).toHaveBeenCalledTimes(0);

      setFlag(true);
      await ticker.tickFrames(1);
      expect(firstSpy).toHaveBeenCalledTimes(2);
      expect(secondSpy).toHaveBeenCalledTimes(0);
      expect(thirdSpy).toHaveBeenCalledTimes(0);

      await ticker.tickFrames(1);
      expect(firstSpy).toHaveBeenCalledTimes(2);
      expect(secondSpy).toHaveBeenCalledTimes(1);
      expect(thirdSpy).toHaveBeenCalledTimes(1);
    });
  });
});
