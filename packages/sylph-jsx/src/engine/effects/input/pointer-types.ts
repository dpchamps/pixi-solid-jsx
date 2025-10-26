import type { Accessor } from "../../../pixi-jsx/solidjs-universal-renderer/index.js";

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
 * const tracking = pointer.onPointerTrack();
 * createSynchronizedEffect(
 *   () => tracking(),
 *   (pointers) => {
 *     pointers.forEach(p => {
 *       updateGesture(p.pointerId, p.x, p.y);
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
  // Identity
  pointerId: number;
  pointerType: PointerType;
  isPrimary: boolean;

  // Position
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

  // Pressure & Force
  pressure: number;
  tangentialPressure: number;

  // Orientation (stylus - feature-detect before using)
  tiltX: number;
  tiltY: number;
  twist: number;
  altitudeAngle?: number;
  azimuthAngle?: number;

  // Contact Geometry
  width: number;
  height: number;

  // Button State
  buttons: number;
  button: number;

  // Modifiers
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;

  // Timestamp
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
   * @example
   * ```tsx
   * // Only track primary pointer
   * const primaryOnly = pointer.onPointerEvent("pointerdown", {
   *   filter: (event) => event.isPrimary
   * });
   *
   * // Only track pen input
   * const penOnly = pointer.onPointerEvent("pointermove", {
   *   filter: (event) => event.pointerType === "pen"
   * });
   * ```
   */
  filter?: (event: PointerEventData) => boolean;

  /**
   * Whether to call preventDefault on matched events.
   *
   * @remarks
   * ⚠️ WARNING: Enabling this disables native scrolling, pinch-zoom,
   * and context menus. Only enable when implementing custom gestures.
   *
   * @defaultValue false (passive listeners)
   */
  preventDefault?: boolean;
};

/**
 * Options for pointer tracking via `onPointerTrack`.
 *
 * @public
 */
export type PointerTrackOptions = {
  /**
   * Filter function to selectively track pointers.
   *
   * @example
   * ```tsx
   * // Only track touch pointers
   * const touches = pointer.onPointerTrack(undefined, {
   *   filter: (p) => p.pointerType === "touch"
   * });
   *
   * // Only track pointers with pressure above threshold
   * const pressing = pointer.onPointerTrack(undefined, {
   *   filter: (p) => p.pressure > 0.5
   * });
   * ```
   */
  filter?: (state: PointerState) => boolean;

  /**
   * Whether to track only while pointer is down (buttons > 0).
   *
   * @defaultValue true
   */
  activeOnly?: boolean;
};

/**
 * Pointer manager instance returned by {@link createPointer}.
 *
 * Provides unified pointer event handling with two distinct tracking modes:
 * - `onPointerEvent`: Discrete event-based tracking (clicks, taps, releases)
 * - `onPointerTrack`: Continuous frame-synchronized tracking (dragging, drawing)
 *
 * @public
 */
export type Pointer = {
  /**
   * Creates a signal that updates when specific pointer events occur.
   *
   * Ideal for discrete actions like clicks, taps, hover detection, and gestures.
   *
   * @param eventTypes - One or more pointer event types to track
   * @returns Signal containing array of pointer events that occurred this frame
   *
   * @example
   * ```tsx
   * // Track all pointer down events
   * const taps = pointer.onPointerEvent("pointerdown");
   *
   * // Track multiple event types
   * const interactions = pointer.onPointerEvent(
   *   "pointerdown",
   *   "pointerup",
   *   "pointercancel"
   * );
   * ```
   */
  onPointerEvent(
    ...eventTypes: PointerEventType[]
  ): Accessor<PointerEventData[]>;

  /**
   * Creates a signal that updates when specific pointer events occur.
   *
   * Overload with options for filtering and preventDefault control.
   *
   * @param eventTypes - Array of pointer event types to track
   * @param options - Filtering and configuration options
   * @returns Signal containing array of pointer events that occurred this frame
   *
   * @example
   * ```tsx
   * // With filtering
   * const primaryOnly = pointer.onPointerEvent(["pointerdown"], {
   *   filter: (event) => event.isPrimary
   * });
   *
   * const penOnly = pointer.onPointerEvent(["pointermove"], {
   *   filter: (event) => event.pointerType === "pen"
   * });
   * ```
   */
  onPointerEvent(
    eventTypes: PointerEventType[],
    options: PointerEventOptions,
  ): Accessor<PointerEventData[]>;

  /**
   * Creates a signal that updates every frame with active pointer states.
   *
   * Ideal for continuous actions like dragging, drawing, multi-touch gestures,
   * and pressure-sensitive input.
   *
   * @param pointerIds - Optional specific pointer IDs to track (tracks all if omitted)
   * @param options - Optional filtering and configuration
   * @returns Signal containing array of active pointer states
   *
   * @example
   * ```tsx
   * // Track all active pointers every frame
   * const allPointers = pointer.onPointerTrack();
   *
   * // Drawing with pressure sensitivity
   * const drawing = pointer.onPointerTrack();
   * createSynchronizedEffect(
   *   () => drawing(),
   *   (pointers, ticker) => {
   *     pointers.forEach(p => {
   *       const thickness = p.pressure * 10;
   *       const alpha = p.pressure;
   *       drawBrushStroke(p.x, p.y, thickness, alpha);
   *     });
   *   }
   * );
   *
   * // Multi-touch pinch gesture
   * const touches = pointer.onPointerTrack(undefined, {
   *   filter: (p) => p.pointerType === "touch"
   * });
   * createSynchronizedEffect(
   *   () => touches(),
   *   (pointers) => {
   *     if (pointers.length === 2) {
   *       const distance = calculateDistance(pointers[0], pointers[1]);
   *       handlePinch(distance);
   *     }
   *   }
   * );
   * ```
   */
  onPointerTrack(
    pointerIds?: number[],
    options?: PointerTrackOptions,
  ): Accessor<PointerState[]>;

  /**
   * Gets the primary pointer (first pointer of each type).
   *
   * @returns Signal containing the primary pointer state, or undefined if no pointers active
   *
   * @example
   * ```tsx
   * const primary = pointer.getPrimaryPointer();
   *
   * createSynchronizedEffect(
   *   () => primary(),
   *   (p) => {
   *     if (p) {
   *       cursor.x = p.x;
   *       cursor.y = p.y;
   *     }
   *   }
   * );
   * ```
   */
  getPrimaryPointer(): Accessor<PointerState | undefined>;

  /**
   * Gets a specific pointer by ID.
   *
   * @remarks
   * ⚠️ WARNING: Pointer IDs are transient and may be reused by the browser
   * after pointerup. Only use within the same gesture.
   *
   * @param id - Pointer ID to track
   * @returns Signal containing the pointer state, or undefined if not active
   *
   * @example
   * ```tsx
   * const [trackedId, setTrackedId] = createSignal<number>();
   * const tracked = pointer.getPointerById(trackedId()!);
   *
   * // Start tracking on first touch
   * const touches = pointer.onPointerEvent("pointerdown", {
   *   filter: (e) => e.pointerType === "touch"
   * });
   *
   * createSynchronizedEffect(
   *   () => touches(),
   *   (events) => {
   *     if (events.length > 0 && !trackedId()) {
   *       setTrackedId(events[0].pointerId);
   *     }
   *   }
   * );
   * ```
   */
  getPointerById(id: number): Accessor<PointerState | undefined>;

  /**
   * Gets the primary pointer of a specific type.
   *
   * @param type - Pointer type to filter ("mouse", "pen", or "touch")
   * @returns Signal containing the primary pointer of that type, or undefined if none active
   *
   * @example
   * ```tsx
   * const touch = pointer.getPrimaryPointerOfType("touch");
   *
   * createSynchronizedEffect(
   *   () => touch(),
   *   (p) => {
   *     if (p) {
   *       handleTouchInput(p.x, p.y);
   *     }
   *   }
   * );
   * ```
   */
  getPrimaryPointerOfType(
    type: PointerType,
  ): Accessor<PointerState | undefined>;

  /**
   * Track only primary pointer (main mouse, first touch, first pen).
   *
   * Equivalent to: `onPointerTrack(undefined, { filter: p => p.isPrimary })`
   *
   * @returns Signal containing the primary pointer, or undefined if no primary pointer active
   *
   * @example
   * ```tsx
   * const primary = pointer.onPrimaryPointer();
   *
   * createSynchronizedEffect(
   *   () => primary(),
   *   (p) => {
   *     if (p) moveCursor(p.x, p.y);
   *   }
   * );
   * ```
   */
  onPrimaryPointer(): Accessor<PointerState | undefined>;

  /**
   * Track pointers of a specific type.
   *
   * Equivalent to: `onPointerTrack(undefined, { filter: p => p.pointerType === type })`
   *
   * @param type - Pointer type to track
   * @returns Signal containing array of active pointers of that type
   *
   * @example
   * ```tsx
   * const touches = pointer.trackPointerType("touch");
   *
   * createSynchronizedEffect(
   *   () => touches(),
   *   (pointers) => {
   *     if (pointers.length === 2) {
   *       handlePinchGesture(pointers);
   *     }
   *   }
   * );
   * ```
   */
  trackPointerType(type: PointerType): Accessor<PointerState[]>;

  /**
   * Track pointers with pressure above threshold.
   *
   * Useful for pen/stylus interactions that require minimum pressure.
   *
   * @param minPressure - Minimum pressure threshold (0-1)
   * @returns Signal containing array of active pointers above pressure threshold
   *
   * @example
   * ```tsx
   * const pressing = pointer.trackWithPressure(0.5);
   *
   * createSynchronizedEffect(
   *   () => pressing(),
   *   (pointers) => {
   *     pointers.forEach(p => drawInk(p.x, p.y, p.pressure));
   *   }
   * );
   * ```
   */
  trackWithPressure(minPressure: number): Accessor<PointerState[]>;

  /**
   * Detected pointer capabilities.
   *
   * @remarks
   * These are runtime-detected based on observed pointer events.
   * Values may change as different input devices are used.
   */
  capabilities: {
    hasMultiTouch: boolean;
    hasStylus: boolean;
    hasPressure: boolean;
  };
};

/**
 * Pointer-like DOM element interface.
 *
 * Defines the minimal interface required for pointer event handling.
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

/**
 * Internal subscriber for continuous pointer tracking.
 *
 * @internal
 */
export type TrackingSubscriber = {
  pointerIds?: ReadonlySet<number>;
  filter?: (state: PointerState) => boolean;
  setValue: (states: PointerState[]) => void;
  lastActiveCount?: number;
};
