import { beforeAll, describe, expect, test, vi } from "vitest";
import { createSignal } from "../../../../pixi-jsx/solidjs-universal-renderer/index";
import { createMouse } from "../../../effects/input/createMouse";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils";
import { assert, invariant } from "../../../../utility-types";
import { Sprite, Text } from "pixi.js";
import { createSynchronizedEffect } from "../../../core/query-fns";

type MockMouseElement = {
  addEventListener: (
    name: "mousedown" | "mouseup" | "mousemove" | "wheel",
    cb: (evt: any) => void,
  ) => void;
  removeEventListener: (
    name: "mousedown" | "mouseup" | "mousemove" | "wheel",
    cb: (evt: any) => void,
  ) => void;
  dispatchClick: (x: number, y: number, button: number) => void;
  dispatchMouseUp: () => void;
  dispatchMove: (x: number, y: number) => void;
  dispatchWheel: (deltaX: number, deltaY: number, deltaZ: number) => void;
};

const createMockMouseElement = (): MockMouseElement => {
  const listeners = new Map<
    "mousedown" | "mouseup" | "mousemove" | "wheel",
    (evt: any) => void
  >();

  return {
    addEventListener: (name, cb) => listeners.set(name, cb),
    removeEventListener: (name) => listeners.delete(name),
    dispatchClick: (x, y, button) => {
      const listener = listeners.get("mousedown");
      if (listener) {
        listener({ x, y, button });
      }
    },
    dispatchMouseUp: () => {
      const listener = listeners.get("mouseup");
      if (listener) {
        listener({});
      }
    },
    dispatchMove: (x, y) => {
      const listener = listeners.get("mousemove");
      if (listener) {
        listener({ x, y });
      }
    },
    dispatchWheel: (deltaX, deltaY, deltaZ) => {
      const listener = listeners.get("wheel");
      if (listener) {
        listener({ deltaX, deltaY, deltaZ, x: 0, y: 0, button: 0 });
      }
    },
  };
};

describe("createMouse", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  describe("Basic Mouse Event Handling", () => {
    test("single click sets click signal and lastClickPosition", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.click() || "none"}:{mouse.lastClickPosition()?.x ?? "?"},
            {mouse.lastClickPosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("none:?,?");

      mockEl.dispatchClick(100, 200, 0);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("Main:100,200");
    });

    test("mouse up clears click signal", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(100, 200, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none");
    });

    test("lastClickPosition persists after mouse up", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.lastClickPosition()?.x ?? "?"},
            {mouse.lastClickPosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(150, 250, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("150,250");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("150,250");
    });

    test("rapid click/release sequences", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none");

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none");
    });

    test("multiple clicks update lastClickPosition", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.lastClickPosition()?.x ?? "?"},
            {mouse.lastClickPosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(10, 20, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("10,20");

      mockEl.dispatchMouseUp();
      mockEl.dispatchClick(30, 40, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("30,40");

      mockEl.dispatchMouseUp();
      mockEl.dispatchClick(50, 60, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("50,60");
    });

    test("Main button (0) maps to Main", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main");
    });

    test("Auxiliary button (1) maps to Auxiliary", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Auxiliary");
    });

    test("Secondary button (2) maps to Secondary", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 2);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Secondary");
    });

    test("Forth button (3) maps to Forth", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 3);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Forth");
    });

    test("Fifth button (4) maps to Fifth", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 4);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Fifth");
    });

    test("unknown button number maps to Unknown", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 999);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Unknown");
    });
  });

  describe("Mouse Position Tracking", () => {
    test("mousemove updates currentMousePosition", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("?,?");

      mockEl.dispatchMove(100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("100,200");
    });

    test("position accuracy with various coordinates", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchMove(0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("0,0");

      mockEl.dispatchMove(1920, 1080);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("1920,1080");

      mockEl.dispatchMove(-50, -100);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("-50,-100");
    });

    test("movement without clicks works independently", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}:{mouse.click() || "none"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchMove(100, 200);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("100,200:none");
    });

    test("initial state is undefined", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        const pos = mouse.currentMousePosition();

        return <text>{pos === undefined ? "undefined" : "defined"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      await ticker.tickFrames(1);
      expect(textNode.text).toBe("undefined");
    });

    test("rapid movement events", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchMove(10, 10);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("10,10");

      mockEl.dispatchMove(20, 20);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("20,20");

      mockEl.dispatchMove(30, 30);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("30,30");
    });

    test("lastClickPosition vs currentMousePosition independence", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            current:{mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}|click:
            {mouse.lastClickPosition()?.x ?? "?"},
            {mouse.lastClickPosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(100, 100, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("current:?,?|click:100,100");

      mockEl.dispatchMove(200, 200);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("current:200,200|click:100,100");
    });
  });

  describe("Wheel Events", () => {
    test("wheel updates deltaX, deltaY, deltaZ", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.wheel()?.deltaX ?? "?"},{mouse.wheel()?.deltaY ?? "?"},
            {mouse.wheel()?.deltaZ ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("?,?,?");

      mockEl.dispatchWheel(1, 2, 3);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("1,2,3");
    });

    test("multiple wheel events (scroll up/down)", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return <text>{mouse.wheel()?.deltaY ?? "?"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchWheel(0, 100, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100");

      mockEl.dispatchWheel(0, -100, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("-100");
    });

    test("wheel without other events", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.wheel()?.deltaY ?? "?"}:{mouse.click() || "none"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchWheel(0, 50, 0);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("50:none");
    });

    test("delta value accuracy", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.wheel()?.deltaX ?? "?"},{mouse.wheel()?.deltaY ?? "?"},
            {mouse.wheel()?.deltaZ ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchWheel(-5.5, 10.25, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("-5.5,10.25,0");
    });

    test("horizontal scroll (deltaX)", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return <text>{mouse.wheel()?.deltaX ?? "?"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchWheel(50, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("50");

      mockEl.dispatchWheel(-50, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("-50");
    });
  });

  describe("Multi-Signal Interactions", () => {
    test("click while moving updates both signals", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.click() || "none"}|current:
            {mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}|click:
            {mouse.lastClickPosition()?.x ?? "?"},
            {mouse.lastClickPosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchMove(50, 50);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none|current:50,50|click:?,?");

      mockEl.dispatchClick(100, 100, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main|current:50,50|click:100,100");

      mockEl.dispatchMove(150, 150);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main|current:150,150|click:100,100");
    });

    test("wheel while clicking", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.click() || "none"}:{mouse.wheel()?.deltaY ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main:?");

      mockEl.dispatchWheel(0, 100, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main:100");
    });

    test("multiple simultaneous events", async () => {
      const mockEl = createMockMouseElement();
      const eventLog: string[] = [];

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        createSynchronizedEffect(mouse.click, (click) => {
          eventLog.push(`click:${click}`);
        });

        createSynchronizedEffect(mouse.currentMousePosition, (pos) => {
          eventLog.push(`move:${pos?.x},${pos?.y}`);
        });

        createSynchronizedEffect(mouse.wheel, (wheel) => {
          eventLog.push(`wheel:${wheel?.deltaY}`);
        });

        return <text>tracking</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      mockEl.dispatchClick(10, 20, 0);
      mockEl.dispatchMove(30, 40);
      mockEl.dispatchWheel(0, 50, 0);
      await ticker.tickFrames(1);

      expect(eventLog).toContain("click:Main");
      expect(eventLog).toContain("move:30,40");
      expect(eventLog).toContain("wheel:50");
    });

    test("signal independence verification", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.click() || "none"}|{mouse.currentMousePosition()?.x ?? "?"}|
            {mouse.lastClickPosition()?.x ?? "?"}|{mouse.wheel()?.deltaY ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchMove(100, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none|100|?|?");

      mockEl.dispatchClick(200, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main|100|200|?");

      mockEl.dispatchWheel(0, 300, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main|100|200|300");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none|100|200|300");
    });

    test("drag pattern: click, move, release", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        const isDragging = () => mouse.click() !== false;

        return (
          <text>
            {isDragging() ? "dragging" : "idle"}:
            {mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(50, 50, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("dragging:?,?");

      mockEl.dispatchMove(100, 100);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("dragging:100,100");

      mockEl.dispatchMove(150, 150);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("dragging:150,150");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("idle:150,150");
    });
  });

  describe("Integration with PixiJS Scene", () => {
    test("sprite follows mouse position", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <sprite
            x={mouse.currentMousePosition()?.x ?? 0}
            y={mouse.currentMousePosition()?.y ?? 0}
          />
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);

      mockEl.dispatchMove(100, 200);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(200);

      mockEl.dispatchMove(300, 400);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(300);
      expect(sprite.y).toBe(400);
    });

    test("click-to-move mechanic", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <sprite
            x={mouse.lastClickPosition()?.x ?? 0}
            y={mouse.lastClickPosition()?.y ?? 0}
          />
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      mockEl.dispatchClick(100, 200, 0);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(200);

      mockEl.dispatchMouseUp();
      mockEl.dispatchClick(300, 400, 0);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(300);
      expect(sprite.y).toBe(400);
    });

    test("drag-and-drop implementation", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        const isDragging = () => mouse.click() !== false;

        return (
          <sprite
            x={isDragging() ? (mouse.currentMousePosition()?.x ?? 0) : 0}
            y={isDragging() ? (mouse.currentMousePosition()?.y ?? 0) : 0}
          />
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);

      mockEl.dispatchClick(50, 50, 0);
      mockEl.dispatchMove(100, 150);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(100);
      expect(sprite.y).toBe(150);

      mockEl.dispatchMove(200, 250);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(200);
      expect(sprite.y).toBe(250);

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(0);
      expect(sprite.y).toBe(0);
    });

    test("text displays coordinates dynamically", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            x: {mouse.currentMousePosition()?.x ?? "?"}, y:{" "}
            {mouse.currentMousePosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("x: ?, y: ?");

      mockEl.dispatchMove(123, 456);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("x: 123, y: 456");

      mockEl.dispatchMove(789, 101);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("x: 789, y: 101");
    });

    test("wheel zoom (deltaY controls scale)", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        const [scale, setScale] = createSignal(1);

        createSynchronizedEffect(mouse.wheel, (wheel) => {
          if (wheel) {
            setScale((s) => Math.max(0.1, s + wheel.deltaY * 0.01));
          }
        });

        return <sprite scale={scale()} />;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const sprite = stage.children[0]?.children[0];
      invariant(sprite);
      assert(sprite instanceof Sprite);

      expect(sprite.scale.x).toBe(1);

      mockEl.dispatchWheel(0, 100, 0);
      await ticker.tickFrames(1);
      expect(sprite.scale.x).toBe(2);

      mockEl.dispatchWheel(0, -50, 0);
      await ticker.tickFrames(1);
      expect(sprite.scale.x).toBe(1.5);
    });

    test("different buttons trigger different actions", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        const [action, setAction] = createSignal("none");

        createSynchronizedEffect(mouse.click, (click) => {
          if (click === "Main") setAction("shoot");
          else if (click === "Secondary") setAction("special");
          else setAction("none");
        });

        return <text>{action()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("shoot");

      mockEl.dispatchMouseUp();
      mockEl.dispatchClick(0, 0, 2);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("special");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none");
    });

    test("cursor position indicator sprite", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        const isClicking = () => mouse.click() !== false;

        return (
          <>
            <sprite
              x={mouse.currentMousePosition()?.x ?? -100}
              y={mouse.currentMousePosition()?.y ?? -100}
            />
            <text y={50}>{isClicking() ? "clicking" : "idle"}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const sprite = container.children[0];
      const textNode = container.children[1];
      invariant(sprite instanceof Sprite);
      invariant(textNode instanceof Text);

      expect(sprite.x).toBe(-100);
      expect(textNode.text).toBe("idle");

      mockEl.dispatchMove(250, 300);
      await ticker.tickFrames(1);
      expect(sprite.x).toBe(250);
      expect(sprite.y).toBe(300);
      expect(textNode.text).toBe("idle");

      mockEl.dispatchClick(250, 300, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("clicking");
    });

    test("tracking click count", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        const [count, setCount] = createSignal(0);

        createSynchronizedEffect(mouse.click, (click) => {
          if (click === "Main") {
            setCount((c) => c + 1);
          }
        });

        return <text>Clicks: {count()}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("Clicks: 0");

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Clicks: 1");

      mockEl.dispatchMouseUp();
      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Clicks: 2");

      mockEl.dispatchMouseUp();
      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Clicks: 3");
    });
  });

  describe("Cleanup and Lifecycle", () => {
    test("multiple mouse instances are independent", async () => {
      const mockEl1 = createMockMouseElement();
      const mockEl2 = createMockMouseElement();

      const TestComponent = () => {
        const mouse1 = createMouse(mockEl1);
        const mouse2 = createMouse(mockEl2);

        return (
          <>
            <text>{mouse1.click() || "none1"}</text>
            <text y={50}>{mouse2.click() || "none2"}</text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);
      const text1 = container.children[0];
      const text2 = container.children[1];
      invariant(text1 instanceof Text);
      invariant(text2 instanceof Text);

      mockEl1.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(text1.text).toBe("Main");
      expect(text2.text).toBe("none2");

      mockEl2.dispatchClick(0, 0, 2);
      await ticker.tickFrames(1);
      expect(text1.text).toBe("Main");
      expect(text2.text).toBe("Secondary");
    });

    test("re-creating mouse after cleanup works", async () => {
      const mockEl = createMockMouseElement();
      const [version, setVersion] = createSignal(1);

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            v{version()}:{mouse.click() || "none"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("v1:Main");

      setVersion(2);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("v2:Main");
    });

    test("signals track events after re-creation", async () => {
      const mockEl = createMockMouseElement();
      const [recreate, setRecreate] = createSignal(0);

      const TestComponent = () => {
        recreate();
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchMove(100, 200);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100,200");

      setRecreate(1);
      await ticker.tickFrames(1);

      mockEl.dispatchMove(300, 400);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("300,400");
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("events before initial render completes", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.click() || "none"}:{mouse.currentMousePosition()?.x ?? "?"},
            {mouse.currentMousePosition()?.y ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(100, 200, 0);
      mockEl.dispatchMove(150, 250);
      await ticker.tickFrames(1);

      expect(textNode.text).toBe("Main:150,250");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none:150,250");
    });

    test("unusual button numbers", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);
        return <text>{mouse.click() || "none"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchClick(0, 0, -1);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Unknown");

      mockEl.dispatchMouseUp();
      mockEl.dispatchClick(0, 0, 42);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Unknown");
    });

    test("rapid mixed events", async () => {
      const mockEl = createMockMouseElement();
      const eventLog: string[] = [];

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        createSynchronizedEffect(mouse.click, (click) => {
          eventLog.push(`c:${click}`);
        });

        createSynchronizedEffect(mouse.currentMousePosition, (pos) => {
          if (pos) eventLog.push(`m:${pos.x}`);
        });

        createSynchronizedEffect(mouse.wheel, (wheel) => {
          if (wheel) eventLog.push(`w:${wheel.deltaY}`);
        });

        return <text>tracking</text>;
      };

      const { ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      await ticker.tickFrames(1);

      mockEl.dispatchClick(0, 0, 0);
      mockEl.dispatchMove(10, 10);
      mockEl.dispatchWheel(0, 5, 0);
      mockEl.dispatchMouseUp();
      mockEl.dispatchMove(20, 20);

      await ticker.tickFrames(1);

      expect(eventLog.length).toBeGreaterThan(0);
    });

    test("late subscriber picks up current state", async () => {
      const mockEl = createMockMouseElement();
      const [showSecond, setShowSecond] = createSignal(false);

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <>
            <text>{mouse.click() || "none1"}</text>
            <text y={50}>
              {showSecond() ? mouse.click() || "none2" : "waiting"}
            </text>
          </>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const container = stage.children[0];
      invariant(container);

      mockEl.dispatchClick(0, 0, 0);
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("Main");
      expect((container.children[1] as Text).text).toBe("waiting");

      setShowSecond(true);
      await ticker.tickFrames(1);
      expect((container.children[0] as Text).text).toBe("Main");
      expect((container.children[1] as Text).text).toBe("Main");
    });

    test("all signals update independently", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return (
          <text>
            {mouse.click() || "none"}|{mouse.lastClickPosition()?.x ?? "?"}|
            {mouse.currentMousePosition()?.x ?? "?"}|
            {mouse.wheel()?.deltaY ?? "?"}
          </text>
        );
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      expect(textNode.text).toBe("none|?|?|?");

      mockEl.dispatchClick(10, 0, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main|10|?|?");

      mockEl.dispatchMove(20, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main|10|20|?");

      mockEl.dispatchWheel(0, 30, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("Main|10|20|30");

      mockEl.dispatchMouseUp();
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("none|10|20|30");
    });

    test("wheel event persists across frames", async () => {
      const mockEl = createMockMouseElement();

      const TestComponent = () => {
        const mouse = createMouse(mockEl);

        return <text>{mouse.wheel()?.deltaY ?? "?"}</text>;
      };

      const { stage, ticker } = await renderApplicationWithFakeTicker(() => (
        <TestComponent />
      ));

      const textNode = stage.children[0]?.children[0];
      invariant(textNode);
      assert(textNode instanceof Text);

      mockEl.dispatchWheel(0, 100, 0);
      await ticker.tickFrames(1);
      expect(textNode.text).toBe("100");

      await ticker.tickFrames(3);
      expect(textNode.text).toBe("100");
    });
  });
});
