import { beforeAll, describe, expect, test, vi } from "vitest";
import { createPointer, Pointer } from "../../../effects/input/create-pointer";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils";
import { assert, invariant, Maybe } from "../../../../utility-types";
import { Text } from "pixi.js";

type MockPointerElement = {
  addEventListener: (
    name: string,
    cb: (evt: PointerEvent) => void,
    options?: AddEventListenerOptions,
  ) => void;
  removeEventListener: (
    name: string,
    cb: (evt: PointerEvent) => void,
    options?: AddEventListenerOptions,
  ) => void;
  dispatchPointerDown: (
    pointerId: number,
    x: number,
    y: number,
    options?: { pointerType?: "mouse" | "pen" | "touch"; isPrimary?: boolean },
  ) => void;
  dispatchPointerMove: (
    pointerId: number,
    x: number,
    y: number,
    options?: { pointerType?: "mouse" | "pen" | "touch"; pressure?: number },
  ) => void;
  dispatchPointerUp: (pointerId: number) => void;
  dispatchPointerOver: (pointerId: number, x: number, y: number) => void;
  dispatchPointerOut: (pointerId: number, x: number, y: number) => void;
  dispatchPointerEnter: (pointerId: number, x: number, y: number) => void;
  dispatchPointerLeave: (pointerId: number, x: number, y: number) => void;
  dispatchPointerCancel: (pointerId: number) => void;
  dispatchGotPointerCapture: (pointerId: number) => void;
  dispatchLostPointerCapture: (pointerId: number) => void;
  dispatch: (
    eventType: string,
    pointerId: number,
    overrides?: Partial<PointerEvent>,
  ) => void;
};

const createMockPointerElement = (): MockPointerElement => {
  const listeners = new Map<string, (evt: PointerEvent) => void>();
  let timestampCounter = 0;

  const createEvent = (
    type: string,
    pointerId: number,
    x: number = 0,
    y: number = 0,
    overrides: Partial<PointerEvent> = {},
  ): PointerEvent =>
    ({
      pointerId,
      pointerType: "mouse",
      pressure: 0,
      x,
      y,
      type,
      timeStamp: timestampCounter++,
      isPrimary: true,
      screenX: x,
      screenY: y,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      offsetX: x,
      offsetY: y,
      movementX: 0,
      movementY: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      width: 1,
      height: 1,
      buttons: 0,
      button: 0,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      target: null,
      ...overrides,
    }) as PointerEvent;

  return {
    addEventListener: vi.fn((name, cb) => listeners.set(name, cb)),
    removeEventListener: vi.fn((name) => listeners.delete(name)),
    dispatchPointerDown: (pointerId, x, y, options = {}) => {
      const listener = listeners.get("pointerdown");
      if (listener) {
        listener(
          createEvent("pointerdown", pointerId, x, y, {
            pointerType: options.pointerType ?? "mouse",
            isPrimary: options.isPrimary ?? true,
            buttons: 1,
          }),
        );
      }
    },
    dispatchPointerMove: (pointerId, x, y, options = {}) => {
      const listener = listeners.get("pointermove");
      if (listener) {
        listener(
          createEvent("pointermove", pointerId, x, y, {
            pointerType: options.pointerType ?? "mouse",
            pressure: options.pressure ?? 0,
          }),
        );
      }
    },
    dispatchPointerUp: (pointerId) => {
      const listener = listeners.get("pointerup");
      if (listener) {
        listener(createEvent("pointerup", pointerId, 0, 0));
      }
    },
    dispatchPointerOver: (pointerId, x, y) => {
      const listener = listeners.get("pointerover");
      if (listener) {
        listener(createEvent("pointerover", pointerId, x, y));
      }
    },
    dispatchPointerOut: (pointerId, x, y) => {
      const listener = listeners.get("pointerout");
      if (listener) {
        listener(createEvent("pointerout", pointerId, x, y));
      }
    },
    dispatchPointerEnter: (pointerId, x, y) => {
      const listener = listeners.get("pointerenter");
      if (listener) {
        listener(createEvent("pointerenter", pointerId, x, y));
      }
    },
    dispatchPointerLeave: (pointerId, x, y) => {
      const listener = listeners.get("pointerleave");
      if (listener) {
        listener(createEvent("pointerleave", pointerId, x, y));
      }
    },
    dispatchPointerCancel: (pointerId) => {
      const listener = listeners.get("pointercancel");
      if (listener) {
        listener(createEvent("pointercancel", pointerId, 0, 0));
      }
    },
    dispatchGotPointerCapture: (pointerId) => {
      const listener = listeners.get("gotpointercapture");
      if (listener) {
        listener(createEvent("gotpointercapture", pointerId, 0, 0));
      }
    },
    dispatchLostPointerCapture: (pointerId) => {
      const listener = listeners.get("lostpointercapture");
      if (listener) {
        listener(createEvent("lostpointercapture", pointerId, 0, 0));
      }
    },
    dispatch: (eventType, pointerId, overrides = {}) => {
      const listener = listeners.get(eventType);
      if (listener) {
        listener(createEvent(eventType, pointerId, 0, 0, overrides));
      }
    },
  };
};

describe("createPointer", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  describe("Basic Event Handling", () => {
    test("pointerdown event is captured and delivered", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("0");

      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("events cleared after frame", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");

      // Next frame without new events - should be empty
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("0");
    });
  });

  describe("Event Filtering", () => {
    test("filter option works", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const primaryOnly = pointer.onPointerEvent("pointerdown", {
          filter: (e) => e.isPrimary,
        });

        return <text>{primaryOnly().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Dispatch primary pointer - should be captured
      mockEl.dispatchPointerDown(1, 100, 200, { isPrimary: true });
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");

      // Dispatch non-primary pointer - should be filtered out
      mockEl.dispatchPointerDown(2, 150, 250, { isPrimary: false });
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("0");
    });
  });

  describe("Multiple Event Types", () => {
    test("subscribe to multiple event types", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent(["pointerdown", "pointerup"]);

        return (
          <text>
            {events()
              .map((e) => e.eventType)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("pointerdown");

      mockEl.dispatchPointerUp(1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("pointerup");

      // Both in same frame
      mockEl.dispatchPointerDown(1, 100, 200);
      mockEl.dispatchPointerUp(1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("pointerdown,pointerup");
    });
  });

  describe("All Pointer Event Types", () => {
    test("pointerover event is captured", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerover");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerOver(1, 100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("pointerout event is captured", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerout");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerOut(1, 100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("pointerenter event is captured", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerenter");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerEnter(1, 100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("pointerleave event is captured", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerleave");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerLeave(1, 100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("pointercancel event is captured", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointercancel");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerCancel(1);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("gotpointercapture event is captured", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("gotpointercapture");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchGotPointerCapture(1);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });

    test("lostpointercapture event is captured", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("lostpointercapture");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchLostPointerCapture(1);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1");
    });
  });

  describe("Event Data Properties", () => {
    test("captures position coordinates correctly", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => `${e.x},${e.y}`)
              .join(";")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 123, 456);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("123,456");
    });

    test("captures pointerId correctly", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => e.pointerId)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(42, 100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("42");
    });

    test("captures pointerType correctly", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => e.pointerType)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200, { pointerType: "pen" });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("pen");
    });

    test("captures pressure correctly", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointermove");

        return (
          <text>
            {events()
              .map((e) => e.pressure)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerMove(1, 100, 200, { pressure: 0.75 });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("0.75");
    });

    test("captures isPrimary correctly", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => String(e.isPrimary))
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200, { isPrimary: false });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("false");
    });

    test("captures stylus properties (tilt, twist, tangentialPressure)", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointermove");

        return (
          <text>
            {events()
              .map(
                (e) =>
                  `${e.tiltX},${e.tiltY},${e.twist},${e.tangentialPressure}`,
              )
              .join(";")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerMove(1, 100, 200, {
        pointerType: "pen",
        pressure: 0.8,
      });
      mockEl.dispatch("pointermove", 1, {
        tiltX: 15,
        tiltY: -20,
        twist: 45,
        tangentialPressure: 0.3,
      });
      await ticker.tickFrames(1);

      // Should have 2 events
      const events = textNode.text.split(";");
      expect(events.length).toBe(2);
      expect(events[1]).toBe("15,-20,45,0.3");
    });
  });

  describe("Pointer Types", () => {
    test("mouse pointer type works", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => e.pointerType)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200, { pointerType: "mouse" });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("mouse");
    });

    test("pen pointer type works", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => e.pointerType)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200, { pointerType: "pen" });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("pen");
    });

    test("touch pointer type works", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => e.pointerType)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200, { pointerType: "touch" });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("touch");
    });
  });

  describe("Multi-Touch Scenarios", () => {
    test("tracks multiple simultaneous touch points", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {events()
              .map((e) => e.pointerId)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Dispatch 3 touches in same frame
      mockEl.dispatchPointerDown(1, 100, 200, { pointerType: "touch" });
      mockEl.dispatchPointerDown(2, 150, 250, { pointerType: "touch" });
      mockEl.dispatchPointerDown(3, 200, 300, { pointerType: "touch" });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1,2,3");
    });

    test("pointercancel removes pointer from active set", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent(["pointerdown", "pointercancel"]);

        return (
          <text>
            {events()
              .map((e) => e.eventType)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Start with 2 pointers
      mockEl.dispatchPointerDown(1, 100, 200);
      mockEl.dispatchPointerDown(2, 150, 250);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("pointerdown,pointerdown");

      // Cancel one
      mockEl.dispatchPointerCancel(1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("pointercancel");
    });

    test("lostpointercapture keeps pointer in active set", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent([
          "pointerdown",
          "lostpointercapture",
        ]);

        return (
          <text>
            {events()
              .map((e) => e.eventType)
              .join(",")}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200);
      mockEl.dispatchLostPointerCapture(1);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("pointerdown,lostpointercapture");
    });
  });

  describe("Mouse Event Deduplication", () => {
    test("deduplicates mouse events with same timestamp", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Dispatch same mouse event twice (same pointerId, same timestamp)
      const timestamp = Date.now();
      mockEl.dispatch("pointerdown", 1, {
        pointerType: "mouse",
        timeStamp: timestamp,
      });
      mockEl.dispatch("pointerdown", 1, {
        pointerType: "mouse",
        timeStamp: timestamp,
      });
      await ticker.tickFrames(1);

      // Should only have 1 event due to deduplication
      expect(textNode.text).toBe("1");
    });

    test("does not deduplicate different pointer IDs", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Different pointer IDs, same timestamp - should NOT deduplicate
      const timestamp = Date.now();
      mockEl.dispatch("pointerdown", 1, {
        pointerType: "mouse",
        timeStamp: timestamp,
      });
      mockEl.dispatch("pointerdown", 2, {
        pointerType: "mouse",
        timeStamp: timestamp,
      });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("2");
    });

    test("does not deduplicate non-mouse events", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Pen events should not be deduplicated even with same timestamp
      const timestamp = Date.now();
      mockEl.dispatch("pointerdown", 1, {
        pointerType: "pen",
        timeStamp: timestamp,
      });
      mockEl.dispatch("pointerdown", 1, {
        pointerType: "pen",
        timeStamp: timestamp,
      });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("2");
    });
  });

  describe("Cleanup", () => {
    test("removes all 10 event listeners on dispose", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");
        return <text>{events().length}</text>;
      };

      const { dispose } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      // Should have added 10 event listeners
      expect(mockEl.addEventListener).toHaveBeenCalledTimes(10);
      expect(mockEl.removeEventListener).toHaveBeenCalledTimes(0);

      // Dispose should remove all 10 listeners
      dispose();

      expect(mockEl.removeEventListener).toHaveBeenCalledTimes(10);
    });

    test("stops capturing events after dispose", async () => {
      const mockEl = createMockPointerElement();
      const capturedEvents: string[] = [];

      // Track events that make it through to handlers
      const originalAddEventListener = mockEl.addEventListener;
      mockEl.addEventListener = (name, cb, options) => {
        const wrappedCb = (evt: PointerEvent) => {
          capturedEvents.push(evt.type);
          cb(evt);
        };
        return originalAddEventListener(name, wrappedCb as any, options);
      };

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");
        return <text>{events().length}</text>;
      };

      const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
        () => <TestComponent />,
      );

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Events work before dispose
      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);
      expect(capturedEvents.length).toBe(1);
      expect(capturedEvents[0]).toBe("pointerdown");
      expect(textNode.text).toBe("1");

      // Dispose
      dispose();

      // Try to dispatch events after dispose - they should NOT be captured
      mockEl.dispatchPointerDown(1, 100, 200);
      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);

      // Still only 1 event captured (from before dispose)
      expect(capturedEvents.length).toBe(1);
    });

    test("clears event buffer on dispose", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");
        return <text>{events().length}</text>;
      };

      const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
        () => <TestComponent />,
      );

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Dispatch events but DON'T tick the frame yet
      mockEl.dispatchPointerDown(1, 100, 200);
      mockEl.dispatchPointerDown(1, 101, 201);

      // Dispose before the frame processes the events
      dispose();
      // Now tick - events should have been cleared by dispose
      await ticker.tickFrames(1);

      // If buffer was properly cleared, we should see 0 events
      // (the signal will have been cleaned up)
      expect(textNode.text).toBe("0");
    });
  });

  describe("Browser Support", () => {
    test("returns undefined when PointerEvent not supported", () => {
      const originalPointerEvent = (global.window as any).PointerEvent;

      try {
        // Mock unsupported browser
        delete (global.window as any).PointerEvent;

        const mockEl = createMockPointerElement();
        const pointer = createPointer(mockEl);

        expect(pointer).toBeUndefined();
      } finally {
        // Restore
        (global.window as any).PointerEvent = originalPointerEvent;
      }
    });

    test("throws error when expect: true and PointerEvent not supported", () => {
      const originalPointerEvent = (global.window as any).PointerEvent;

      try {
        // Mock unsupported browser
        delete (global.window as any).PointerEvent;

        const mockEl = createMockPointerElement();

        expect(() => {
          createPointer(mockEl, { expect: true });
        }).toThrow(
          "PointerEvent API is not supported in this browser. Cannot create pointer manager.",
        );
      } finally {
        // Restore
        (global.window as any).PointerEvent = originalPointerEvent;
      }
    });
  });

  describe("Edge Cases", () => {
    test("handles rapid event sequences", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent([
          "pointerdown",
          "pointermove",
          "pointerup",
        ]);

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Rapid sequence
      mockEl.dispatchPointerDown(1, 100, 200);
      mockEl.dispatchPointerMove(1, 101, 201);
      mockEl.dispatchPointerMove(1, 102, 202);
      mockEl.dispatchPointerMove(1, 103, 203);
      mockEl.dispatchPointerUp(1);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("5");
    });

    test("multiple subscribers receive same events", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const sub1 = pointer.onPointerEvent("pointerdown");
        const sub2 = pointer.onPointerEvent("pointerdown");

        return (
          <text>
            {sub1().length},{sub2().length}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1,1");
    });

    test("subscribers with different filters see different events", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const primary = pointer.onPointerEvent("pointerdown", {
          filter: (e) => e.isPrimary,
        });
        const nonPrimary = pointer.onPointerEvent("pointerdown", {
          filter: (e) => !e.isPrimary,
        });

        return (
          <text>
            {primary().length},{nonPrimary().length}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchPointerDown(1, 100, 200, { isPrimary: true });
      mockEl.dispatchPointerDown(2, 150, 250, { isPrimary: false });
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1,1");
    });

    test("events are cleared between frames even with no subscribers", async () => {
      const mockEl = createMockPointerElement();

      const TestComponent = () => {
        const pointer = createPointer(mockEl, { expect: true });
        const events = pointer.onPointerEvent("pointerdown");

        return <text>{events().length}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      // Dispatch events
      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");

      // Multiple frames without events
      await ticker.tickFrames(3);
      expect(textNode.text).toBe("0");

      // New event after gap
      mockEl.dispatchPointerDown(1, 100, 200);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1");
    });

    test("stale events before subscriber attaches are discarded", async () => {
      const mockEl = createMockPointerElement();
      let pointer: Maybe<Pointer> = null;

      const TestComponent = () => {
        pointer = createPointer(mockEl, { expect: true });
        return <text>ready</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      // Pointer exists but NO subscriber yet
      invariant(pointer);

      // Fire events BEFORE any subscriber exists - they'll buffer
      mockEl.dispatchPointerDown(1, 100, 200);
      mockEl.dispatchPointerDown(2, 150, 250);

      // Tick frames with no subscribers - buffer should be cleared
      await ticker.tickFrames(2);

      // NOW create a subscriber
      const events = (pointer as Pointer).onPointerEvent("pointerdown");

      // Tick a frame - should get empty array, not stale events
      await ticker.tickFrames(1);
      expect(events()).toEqual([]);

      // New events should work normally
      mockEl.dispatchPointerDown(3, 200, 300);
      await ticker.tickFrames(1);
      expect(events().length).toBe(1);
      expect(events()[0]?.pointerId).toBe(3);
    });
  });
});
