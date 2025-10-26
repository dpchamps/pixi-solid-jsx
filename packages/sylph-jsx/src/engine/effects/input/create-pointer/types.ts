import type { Accessor } from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";

/**
 * Pointer device types supported by the PointerEvent API.
 *
 * @public
 */
export type PointerType = "mouse" | "pen" | "touch";

/**
 * Pointer event types available in the PointerEvent API.
 *
 * @public
 */
export type PointerEventType =
  | "pointerdown"
  | "pointerup"
  | "pointermove"
  | "pointerover"
  | "pointerout"
  | "pointerenter"
  | "pointerleave"
  | "pointercancel"
  | "gotpointercapture"
  | "lostpointercapture";

/**
 * Complete pointer state snapshot containing all PointerEvent properties.
 *
 * @remarks
 * Pointer IDs are transient and browser-managed. They are only stable within
 * a single gesture (pointerdown → pointerup sequence). Do not save pointer IDs
 * across gestures as they may be reused by the browser.
 *
 * @example
 * ```tsx
 * // SAFE: Use ID within gesture
 * const moves = pointer.onPointerEvent("pointermove");
 * createSynchronizedEffect(
 *   () => moves(),
 *   (events) => {
 *     events.forEach(e => {
 *       updateGesture(e.pointerId, e.x, e.y);
 *     });
 *   }
 * );
 * ```
 *
 * @example
 * ```tsx
 * // UNSAFE: Saving ID across gestures
 * let savedId: number;
 * const downs = pointer.onPointerEvent("pointerdown");
 * createSynchronizedEffect(
 *   () => downs(),
 *   (events) => {
 *     savedId = events[0].pointerId; // May be reused later!
 *   }
 * );
 * ```
 *
 * @public
 */
export type PointerState = {
  pointerId: number;
  pointerType: PointerType;
  isPrimary: boolean;
  x: number;
  y: number;
  screenX: number;
  screenY: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  offsetX: number;
  offsetY: number;
  movementX: number;
  movementY: number;
  pressure: number;
  tangentialPressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  altitudeAngle?: number;
  azimuthAngle?: number;
  width: number;
  height: number;
  buttons: number;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  timeStamp: number;
};

/**
 * Pointer event data with event type context.
 *
 * Extends {@link PointerState} with the event type that triggered the data
 * and the event target.
 *
 * @public
 */
export type PointerEventData = PointerState & {
  eventType: PointerEventType;
  target: EventTarget | null;
};

/**
 * Options for pointer event tracking via `onPointerEvent`.
 *
 * @public
 */
export type PointerEventOptions = {
  /**
   * Filter function to selectively process events.
   *
   * Only events where this function returns `true` will be included
   * in the returned signal.
   *
   * @example
   * ```tsx
   * // Only track primary pointer events
   * const primaryClicks = pointer.onPointerEvent("pointerdown", {
   *   filter: (e) => e.isPrimary
   * });
   * ```
   *
   * @example
   * ```tsx
   * // Only track pen input with sufficient pressure
   * const penDrawing = pointer.onPointerEvent("pointermove", {
   *   filter: (e) => e.pointerType === "pen" && e.pressure > 0.3
   * });
   * ```
   */
  filter?: (event: PointerEventData) => boolean;
};

/**
 * Pointer manager instance returned by {@link createPointer}.
 *
 * Provides event-driven pointer handling for mouse, touch, and stylus input.
 *
 * @public
 */
export type Pointer = {
  /**
   * Creates a signal that updates when specific pointer events occur.
   *
   * Events are buffered and delivered once per frame, then cleared. This prevents stale
   * event replay and ensures deterministic behavior.
   *
   * @param eventTypes - Single event type or array of event types to track
   * @param options - Optional filtering and configuration
   * @returns Signal containing array of pointer events that occurred this frame
   *
   * @example
   * ```tsx
   * // Track clicks
   * const clicks = pointer.onPointerEvent("pointerdown");
   *
   * createSynchronizedEffect(
   *   () => clicks(),
   *   (events) => {
   *     events.forEach(e => {
   *       console.log(`Clicked at ${e.x}, ${e.y}`);
   *     });
   *   }
   * );
   * ```
   *
   * @example
   * ```tsx
   * // Track dragging
   * const drags = pointer.onPointerEvent("pointermove", {
   *   filter: (e) => e.buttons > 0
   * });
   *
   * createSynchronizedEffect(
   *   () => drags(),
   *   (events) => {
   *     events.forEach(e => {
   *       sprite.x = e.x;
   *       sprite.y = e.y;
   *     });
   *   }
   * );
   * ```
   *
   * @example
   * ```tsx
   * // Track gesture lifecycle
   * const interactions = pointer.onPointerEvent([
   *   "pointerdown",
   *   "pointerup",
   *   "pointercancel"
   * ]);
   *
   * createSynchronizedEffect(
   *   () => interactions(),
   *   (events) => {
   *     events.forEach(e => {
   *       if (e.eventType === "pointerdown") startGesture(e);
   *       if (e.eventType === "pointerup") endGesture(e);
   *       if (e.eventType === "pointercancel") cancelGesture(e);
   *     });
   *   }
   * );
   * ```
   *
   * @example
   * ```tsx
   * // Drawing with pressure sensitivity
   * const drawing = pointer.onPointerEvent("pointermove", {
   *   filter: (e) => e.pointerType === "pen" && e.pressure > 0.1
   * });
   *
   * createSynchronizedEffect(
   *   () => drawing(),
   *   (events) => {
   *     events.forEach(e => {
   *       const thickness = e.pressure * 10;
   *       drawBrushStroke(e.x, e.y, thickness);
   *     });
   *   }
   * );
   * ```
   *
   * @example
   * ```tsx
   * // Multi-touch pinch gesture
   * const touches = pointer.onPointerEvent(["pointerdown", "pointermove", "pointerup"], {
   *   filter: (e) => e.pointerType === "touch"
   * });
   *
   * // Track active touch points
   * const activeTouches = new Map();
   *
   * createSynchronizedEffect(
   *   () => touches(),
   *   (events) => {
   *     events.forEach(e => {
   *       if (e.eventType === "pointerdown") {
   *         activeTouches.set(e.pointerId, { x: e.x, y: e.y });
   *       }
   *       if (e.eventType === "pointermove" && activeTouches.has(e.pointerId)) {
   *         activeTouches.set(e.pointerId, { x: e.x, y: e.y });
   *       }
   *       if (e.eventType === "pointerup") {
   *         activeTouches.delete(e.pointerId);
   *       }
   *     });
   *
   *     if (activeTouches.size === 2) {
   *       const [p1, p2] = Array.from(activeTouches.values());
   *       const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
   *       handlePinchZoom(distance);
   *     }
   *   }
   * );
   * ```
   */
  onPointerEvent(
    eventTypes: PointerEventType | PointerEventType[],
    options?: PointerEventOptions,
  ): Accessor<PointerEventData[]>;
};

/**
 * Pointer-like DOM element interface.
 *
 * @public
 */
export type PointerLikeEl = {
  addEventListener(
    name: PointerEventType,
    cb: (evt: PointerEvent) => void,
    options?: AddEventListenerOptions,
  ): void;
  removeEventListener(
    name: PointerEventType,
    cb: (evt: PointerEvent) => void,
    options?: AddEventListenerOptions,
  ): void;
};

/**
 * Internal subscriber for discrete pointer events.
 *
 * @internal
 */
export type EventSubscriber = {
  eventTypes: ReadonlySet<PointerEventType>;
  filter?: (event: PointerEventData) => boolean;
  setValue: (events: PointerEventData[]) => void;
};
