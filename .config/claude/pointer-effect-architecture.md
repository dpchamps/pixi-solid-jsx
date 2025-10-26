# Pointer Effect Architecture & Execution Plan

**Project:** Sylph.jsx
**Feature:** `createPointer` - Unified Pointer Input Effect
**Author:** Architecture Document
**Date:** 2025-10-25
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Background & Context](#background--context)
3. [Architecture Design](#architecture-design)
4. [API Design](#api-design)
5. [Implementation Plan](#implementation-plan)
6. [References](#references)

---

## Executive Summary

This document outlines the architecture and implementation plan for `createPointer`, a new input effect for Sylph.jsx that provides unified, reactive pointer input handling. The effect will leverage the modern [PointerEvent API](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent) to support mice, touch screens, styluses, and other pointing devices through a single, type-safe interface.

### Key Benefits

- **Hardware Agnostic**: Single API for mouse, touch, pen, and future input devices
- **Rich Input Data**: Pressure, tilt, rotation, contact geometry
- **Multi-Pointer Support**: Track multiple simultaneous pointers with unique IDs
- **Frame-Synchronized**: Integrates with Sylph's game loop architecture
- **Type-Safe**: Full TypeScript support with comprehensive event types
- **Complementary**: Works alongside `createMouse` and `createKeyboard` for comprehensive input handling

---

## Background & Context

### Current State

Sylph.jsx currently provides input effects in `/packages/sylph-jsx/src/engine/effects/input/`:

1. **`createMouse.ts`** - Simple mouse input tracking
   - Tracks: click state, last click position, current position, wheel events
   - Best for: Desktop-only apps with simple mouse interactions
   - Location: [`/packages/sylph-jsx/src/engine/effects/input/createMouse.ts`](../../../packages/sylph-jsx/src/engine/effects/input/createMouse.ts)

2. **`create-keyboard.ts`** - Comprehensive keyboard input manager
   - Two modes: `onKeyPress` (discrete) and `onKeyHold` (continuous)
   - Frame-synchronized via `onEveryFrame`
   - Subscriber pattern for efficient multi-consumer tracking
   - Location: [`/packages/sylph-jsx/src/engine/effects/input/create-keyboard.ts`](../../../packages/sylph-jsx/src/engine/effects/input/create-keyboard.ts)

3. **`key-codes.ts`** - TypeScript key code definitions (157 codes)
   - Location: [`/packages/sylph-jsx/src/engine/effects/input/key-codes.ts`](../../../packages/sylph-jsx/src/engine/effects/input/key-codes.ts)

### Sylph.jsx Architecture Principles

From the [Project Overview](./project-overview-final.md):

> **Core Principles**
> - Declarative over Imperative: Write what you want, not how to achieve it
> - Fine-Grained Reactivity: Only update what changed, when it changed
> - Frame-Synchronized Effects: Deterministic, low-latency updates aligned with the render loop
> - Progressive Enhancement: Escape hatches for imperative code when needed
> - Type Safety: Full TypeScript support throughout

**Relevant Patterns:**

1. **Effect Cascade Processing** (Section 7.1)
   - Process all triggered effects within single frame
   - Respects 16.6ms frame budget
   - Collapses multi-frame latency into single frame

2. **createSynchronizedEffect** (Section 7.1)
   - Frame-synchronized reactive effects
   - Query phase → Schedule phase → Effect phase
   - Ownership preservation for proper cleanup

3. **onEveryFrame** (Section 7.1)
   - Continuous per-frame effects
   - No reactive tracking
   - Ideal for continuous input processing

### Why PointerEvent?

The [PointerEvent API](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent) provides a unified interface for all pointing devices:

> "A pointer is a hardware agnostic representation of input devices (such as a mouse, pen or contact point on a touch-enable surface)."

**Comparison with MouseEvent:**

| Feature | `createMouse` | `createPointer` |
|---------|---------------|-----------------|
| **Mouse support** | ✅ | ✅ |
| **Touch support** | ❌ | ✅ |
| **Stylus support** | ❌ | ✅ |
| **Pressure sensitivity** | ❌ | ✅ (0-1 range) |
| **Tilt tracking** | ❌ | ✅ (-90° to 90°) |
| **Rotation/twist** | ❌ | ✅ (0-359°) |
| **Multi-pointer** | ❌ | ✅ (unique IDs) |
| **Contact geometry** | ❌ | ✅ (width/height) |
| **Wheel events** | ✅ | ⚠️ (use separate wheel listener) |
| **API simplicity** | ✅ Simple | ⚠️ More complex |
| **Use case** | Desktop mouse-only | Cross-platform, advanced input |

**Event Types Available:**
- `pointerdown`, `pointerup`, `pointermove` - Basic interaction
- `pointerover`, `pointerout`, `pointerenter`, `pointerleave` - Hover states
- `pointercancel` - System interruption
- `gotpointercapture`, `lostpointercapture` - Capture state management
- `pointerrawupdate` - High-frequency updates (experimental)

---

## Architecture Design

### Design Goals

1. **Consistency**: Follow patterns established by `createKeyboard` and `createMouse`
2. **Performance**: Frame-synchronized updates, efficient subscriber pattern
3. **Flexibility**: Support both discrete events and continuous tracking
4. **Type Safety**: Comprehensive TypeScript definitions
5. **Extensibility**: Easy to add new pointer properties/events
6. **Compatibility**: Handle mouse/touch event duplication gracefully

### Performance Strategy

**Key Optimizations:**

1. **Immutable updates** - Only update pointer state when it actually changes
2. **Short-circuit evaluation** - Early exits prevent unnecessary work
3. **Set-based lookups** - O(1) for event type matching, O(n) for pointer ID matching
4. **Shallow references** - Pass pointerState references, not clones
5. **Lazy tracking** - `lastActiveCount` prevents redundant empty-array updates

### Core Architecture

```typescript
// High-level API structure
export const createPointer = (element: PointerLikeEl) => {
  // Internal state
  const pointerMap = new Map<number, PointerState>();
  const [activePointers, setActivePointers] = createSignal<Map<number, PointerState>>();

  // Subscriber management
  const eventSubscribers = new Set<EventSubscriber>();
  const trackingSubscribers = new Set<TrackingSubscriber>();

  // Event listener setup
  createComputed(() => {
    // Attach event listeners
    // Handle pointerdown, pointerup, pointermove, etc.

    onCleanup(() => {
      // Remove listeners
      // Clear state
    });
  });

  // Frame-synchronized update loop
  onEveryFrame(() => {
    // Update tracking subscribers with active pointer states
    // Similar to keyboard's onKeyHold pattern
  });

  return {
    // Discrete event tracking (like onKeyPress)
    onPointerEvent: (eventType, options?) => Signal<PointerEventData[]>,

    // Continuous tracking (like onKeyHold)
    onPointerTrack: (pointerIds?, options?) => Signal<PointerState[]>,

    // Convenience methods
    getPrimaryPointer: () => Signal<PointerState | undefined>,
    getPointerById: (id: number) => Signal<PointerState | undefined>,
  };
};
```

### Data Model

```typescript
/**
 * Complete pointer state snapshot
 */
type PointerState = {
  // Identity
  pointerId: number;              // Unique pointer identifier (transient, browser-managed)
  pointerType: PointerType;       // "mouse" | "pen" | "touch"
  isPrimary: boolean;             // Primary pointer flag

  // Position
  x: number;                      // Client X coordinate
  y: number;                      // Client Y coordinate
  screenX: number;                // Screen X coordinate
  screenY: number;                // Screen Y coordinate
  clientX: number;                // Client X (alias for x)
  clientY: number;                // Client Y (alias for y)
  pageX: number;                  // Page X coordinate
  pageY: number;                  // Page Y coordinate
  offsetX: number;                // Offset within target
  offsetY: number;                // Offset within target
  movementX: number;              // Movement delta X
  movementY: number;              // Movement delta Y

  // Pressure & Force (browser-provided, no overrides)
  pressure: number;               // 0-1 normalized pressure (browser default respected)
  tangentialPressure: number;     // -1 to 1 barrel pressure (stylus only)

  // Orientation (stylus - optional, feature-detect before using)
  tiltX: number;                  // -90° to 90° X-axis tilt
  tiltY: number;                  // -90° to 90° Y-axis tilt
  twist: number;                  // 0-359° rotation
  altitudeAngle?: number;         // Angle from X-Y plane (experimental)
  azimuthAngle?: number;          // Angle in X-Y plane (experimental)

  // Contact Geometry
  width: number;                  // Contact width in CSS pixels
  height: number;                 // Contact height in CSS pixels

  // Button State
  buttons: number;                // Bitmask of pressed buttons
  button: number;                 // Button that caused event

  // Modifiers
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;

  // Timestamp
  timeStamp: number;              // DOMHighResTimeStamp
};

/**
 * Pointer event data with event type context
 */
type PointerEventData = PointerState & {
  eventType: PointerEventType;    // Which event triggered this
  target: EventTarget | null;     // Event target
};

/**
 * Pointer event types
 */
type PointerEventType =
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
 * Pointer device types
 */
type PointerType = "mouse" | "pen" | "touch";
```

### Pointer Identity & Lifecycle

**⚠️ CRITICAL: Pointer IDs are Transient**

Pointer IDs are **browser-managed and reusable**. They are only stable within a single gesture (pointerdown → pointerup sequence). After `pointerup`, the browser may reassign that ID to a new pointer.

**Safe Usage:**
```typescript
// ✅ GOOD: Use ID within gesture
const tracking = pointer.onPointerTrack();
createSynchronizedEffect(
  () => tracking(),
  (pointers) => {
    pointers.forEach(p => {
      // p.pointerId is stable during this gesture
      updateGesture(p.pointerId, p.x, p.y);
    });
  }
);
```

**Unsafe Usage:**
```typescript
// ❌ BAD: Saving ID across gestures
let savedId: number;
const downs = pointer.onPointerEvent("pointerdown");
createSynchronizedEffect(
  () => downs(),
  (events) => {
    savedId = events[0].pointerId; // ID may be reused later!
  }
);

// Later...
const byId = pointer.getPointerById(savedId); // Might get a DIFFERENT pointer!
```

**Lifecycle Phases:**

1. **Allocated** - Browser assigns unique ID on `pointerdown`
2. **Active** - ID remains stable during gesture (down → move... → up/cancel)
3. **Released** - ID freed on `pointerup`/`pointercancel`
4. **Reusable** - Browser may reuse ID for next pointerdown

**Recommended Pattern for Long-Lived Tracking:**

```typescript
// Track gesture state by ID, but clear on release
const gestureState = new Map<number, GestureData>();

const events = pointer.onPointerEvent("pointerdown", "pointerup", "pointercancel");

createSynchronizedEffect(
  () => events(),
  (evts) => {
    evts.forEach(evt => {
      if (evt.eventType === "pointerdown") {
        gestureState.set(evt.pointerId, initGesture(evt));
      } else {
        // Clean up on release to prevent ID reuse bugs
        gestureState.delete(evt.pointerId);
      }
    });
  }
);
```

**Helper: Gesture Tracking (Future API)**

Consider a high-level helper that handles ID lifecycle automatically:

```typescript
// Proposed API
pointer.trackGesture({
  onStart: (p: PointerState) => GestureData,
  onMove: (p: PointerState, data: GestureData) => void,
  onEnd: (p: PointerState, data: GestureData) => void,
});
```

### Pointer Capture & Cancellation Semantics

**State Transition Diagram:**

```
┌─────────────┐
│   IDLE      │ ◄──────────────┐
│ (no active  │                │
│  pointers)  │                │
└──────┬──────┘                │
       │                       │
       │ pointerdown           │ pointerup
       ↓                       │ pointercancel
┌─────────────┐                │
│   ACTIVE    │ ───────────────┘
│ (tracking   │
│  pointer)   │
└──────┬──────┘
       │
       │ setPointerCapture()
       ↓
┌─────────────┐
│  CAPTURED   │ ──┐
│ (exclusive  │   │ releasePointerCapture()
│  tracking)  │   │ lostpointercapture
└──────┬──────┘ ◄─┘
       │
       │ pointerup
       │ pointercancel
       ↓
    [CLEANUP]
```

**Event-Driven State Transitions:**

1. **`pointerdown`**
   - Add pointer to `pointerMap`
   - Notify `onPointerEvent` subscribers
   - Begin tracking for `onPointerTrack` subscribers

2. **`pointerup`**
   - Remove pointer from `pointerMap`
   - Notify `onPointerEvent` subscribers
   - Stop tracking (pointer no longer in `onPointerTrack` results)
   - Release from object pool

3. **`pointercancel`**
   - **Immediately remove** pointer from `pointerMap`
   - Notify `onPointerEvent` subscribers with `eventType: "pointercancel"`
   - All tracking subscribers see pointer disappear
   - **User code must handle mid-gesture cancellation**

   Common causes:
   - System gesture (e.g., iOS Control Center swipe)
   - Browser navigation
   - Touch intercepted by parent element
   - Device orientation change

4. **`gotpointercapture`**
   - Mark pointer as captured in state
   - Pointer events now directed exclusively to capturing element
   - Tracking continues normally

5. **`lostpointercapture`**
   - Clear captured flag
   - Pointer may now fire events on other elements
   - Tracking continues if pointer still active

**Cleanup Guarantees:**

```typescript
// All these scenarios trigger cleanup:
// 1. Normal pointerup
// 2. pointercancel (system interruption)
// 3. Component unmount (via onCleanup)
// 4. Pointer leaves capture while tracked

onCleanup(() => {
  // CRITICAL ORDER: Release pooled objects BEFORE clearing map
  pointerMap.forEach(state => releasePointerState(state));
  pointerMap.clear();

  // Clear all subscriber signals
  eventSubscribers.forEach(sub => sub.setValue([]));
  trackingSubscribers.forEach(sub => sub.setValue([]));
});
```

**User Code Guidance:**

```typescript
// GOOD: Handle cancellation gracefully
const drawing = pointer.onPointerTrack();

createSynchronizedEffect(
  () => drawing(),
  (pointers) => {
    if (pointers.length === 0) {
      // Pointer was released OR cancelled
      finalizeStroke();
      return;
    }

    pointers.forEach(p => continueDrawing(p));
  }
);

// BETTER: Detect cancellation explicitly
const events = pointer.onPointerEvent("pointercancel");

createSynchronizedEffect(
  () => events(),
  (cancelEvents) => {
    if (cancelEvents.length > 0) {
      // Gesture was interrupted - clean up state
      cancelCurrentGesture();
    }
  }
);
```

### Subscriber Pattern

Following `createKeyboard`'s proven subscriber architecture:

```typescript
type EventSubscriber = {
  eventTypes: ReadonlySet<PointerEventType>;
  filter?: (event: PointerEventData) => boolean;
  setValue: (events: PointerEventData[]) => void;
};

type TrackingSubscriber = {
  pointerIds?: ReadonlySet<number>;  // Specific pointers, or all if undefined
  filter?: (state: PointerState) => boolean;
  setValue: (states: PointerState[]) => void;
  lastActiveCount?: number;          // For hold detection
};
```

### Event Stream Semantics

**Event Queue Management:**

`onPointerEvent` maintains a frame-local event buffer that follows these semantics:

1. **Accumulation Phase**: DOM pointer events are captured and added to an internal buffer
2. **Processing Phase**: During `onEveryFrame`, the buffer is processed:
   - Events are matched against subscriber filters
   - Matched events are passed to subscriber `setValue` callbacks
   - **Buffer is cleared after processing** - no events persist across frames
3. **Deterministic Replay**: Each subscriber sees events exactly once, in the frame they occurred

This prevents stale event replay and ensures deterministic behavior:

```typescript
// Events from frame N are NEVER visible in frame N+1
const clicks = pointer.onPointerEvent("pointerdown");

// Frame 1: User clicks
createSynchronizedEffect(
  () => clicks(),  // Returns [clickEvent]
  (events) => console.log(events.length)  // 1
);

// Frame 2: No new clicks
createSynchronizedEffect(
  () => clicks(),  // Returns [] - buffer was cleared
  (events) => console.log(events.length)  // 0
);
```

**Explicit Flush (Future Enhancement):**

Consider exposing manual flush control for advanced use cases:
```typescript
const { events, clear } = pointer.onPointerEvent("pointerdown", {
  manualFlush: true
});

// Process events when ready
processEvents(events());
clear(); // Explicit flush
```

### Integration with Sylph.jsx Engine

**Frame Synchronization Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│  DOM PointerEvents                                          │
│  (pointerdown, pointermove, pointerup, etc.)                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Event Listeners (createComputed)                           │
│  • Capture PointerEvent properties                          │
│  • Update internal pointerMap state                         │
│  • Call preventDefault() to avoid duplication               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  Reactive Signals                                           │
│  • setActivePointers(pointerMap)                            │
│  • Triggers SolidJS reactivity                              │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  onEveryFrame (Game Loop)                                   │
│  • Process eventSubscribers (discrete events)               │
│  • Process trackingSubscribers (continuous tracking)        │
│  • Update subscriber signals                                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  User Code (createSynchronizedEffect)                       │
│  • Consumes pointer signals                                 │
│  • Updates PixiJS objects                                   │
│  • Runs within frame budget                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## API Design

### Core Function: `createPointer`

```typescript
/**
 * Creates a reactive pointer input manager supporting mouse, touch, and stylus.
 *
 * Returns `undefined` if PointerEvent API is not supported in the current browser.
 * Use the overload with `expect: true` to throw an error instead.
 *
 * Provides unified pointer event handling with two distinct tracking modes:
 * - `onPointerEvent`: Discrete event-based tracking (clicks, taps, releases)
 * - `onPointerTrack`: Continuous frame-synchronized tracking (dragging, drawing)
 *
 * @param element - DOM element to attach pointer event listeners to
 * @returns Pointer manager, or undefined if PointerEvent not supported
 *
 * @example
 * ```tsx
 * const pointer = createPointer(window);
 * if (!pointer) {
 *   // Handle unsupported browser
 *   return;
 * }
 *
 * // Discrete events - fires when pointer events occur
 * const clicks = pointer.onPointerEvent("pointerdown");
 *
 * // Continuous tracking - fires every frame while pointers active
 * const drawing = pointer.onPointerTrack();
 *
 * createSynchronizedEffect(
 *   () => drawing(),
 *   (pointers) => {
 *     pointers.forEach(p => {
 *       if (p.pressure > 0.5) drawThickLine(p.x, p.y);
 *     });
 *   }
 * );
 * ```
 *
 * @public
 */
export function createPointer(element: PointerLikeEl): Pointer | undefined;

/**
 * Creates a reactive pointer input manager supporting mouse, touch, and stylus.
 *
 * Throws an error if PointerEvent API is not supported.
 *
 * @param element - DOM element to attach pointer event listeners to
 * @param options - Options with `expect: true` to enforce PointerEvent support
 * @returns Pointer manager (or throws)
 * @throws Error if PointerEvent API is not supported
 *
 * @example
 * ```tsx
 * // Throws if PointerEvent not supported
 * const pointer = createPointer(window, { expect: true });
 *
 * const clicks = pointer.onPointerEvent("pointerdown");
 * ```
 *
 * @public
 */
export function createPointer(
  element: PointerLikeEl,
  options: { expect: true }
): Pointer;
```

### Method: `onPointerEvent`

```typescript
/**
 * Creates a signal that updates when specific pointer events occur.
 *
 * Ideal for discrete actions like clicks, taps, hover detection, and gestures.
 *
 * @param eventTypes - One or more pointer event types to track
 * @param options - Optional filtering and configuration
 * @returns Signal containing array of pointer events that occurred
 *
 * @example
 * ```tsx
 * // Track all pointer down events
 * const taps = pointer.onPointerEvent("pointerdown");
 *
 * // Track pointer releases
 * const releases = pointer.onPointerEvent("pointerup");
 *
 * // Track multiple event types
 * const interactions = pointer.onPointerEvent(
 *   "pointerdown",
 *   "pointerup",
 *   "pointercancel"
 * );
 *
 * // With filtering
 * const primaryOnly = pointer.onPointerEvent("pointerdown", {
 *   filter: (event) => event.isPrimary
 * });
 *
 * const penOnly = pointer.onPointerEvent("pointermove", {
 *   filter: (event) => event.pointerType === "pen"
 * });
 * ```
 */
onPointerEvent(
  ...eventTypes: PointerEventType[]
): Accessor<PointerEventData[]>;

onPointerEvent(
  eventTypes: PointerEventType[],
  options: PointerEventOptions
): Accessor<PointerEventData[]>;
```

### Method: `onPointerTrack`

```typescript
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
 * // Track specific pointer by ID (for persistent tracking)
 * const mainPointer = pointer.onPointerTrack([pointerId]);
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
  options?: PointerTrackOptions
): Accessor<PointerState[]>;
```

### Convenience Methods

```typescript
/**
 * Gets the primary pointer (first pointer of each type).
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
 * Useful for tracking a specific touch or stylus across frames.
 *
 * @param id - Pointer ID to track
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
getPrimaryPointerOfType(type: PointerType): Accessor<PointerState | undefined>;
```

### High-Level Helper Methods

To improve ergonomics for common use cases, consider these additional helpers:

```typescript
/**
 * Track only primary pointer (main mouse, first touch, first pen).
 *
 * Equivalent to: onPointerTrack(undefined, { filter: p => p.isPrimary })
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
 * Equivalent to: onPointerTrack(undefined, { filter: p => p.pointerType === type })
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
```

### Type Definitions

```typescript
/**
 * Options for pointer event tracking
 */
type PointerEventOptions = {
  /**
   * Filter function to selectively process events
   */
  filter?: (event: PointerEventData) => boolean;

  /**
   * Whether to call preventDefault on matched events.
   *
   * ⚠️ WARNING: Enabling this disables native scrolling, pinch-zoom,
   * and context menus. Only enable when implementing custom gestures.
   *
   * @defaultValue false (passive listeners)
   */
  preventDefault?: boolean;
};

/**
 * Options for pointer tracking
 */
type PointerTrackOptions = {
  /**
   * Filter function to selectively track pointers
   */
  filter?: (state: PointerState) => boolean;

  /**
   * Whether to track only while pointer is down (buttons > 0)
   * @defaultValue true
   */
  activeOnly?: boolean;
};

/**
 * Pointer manager instance
 */
export type Pointer = {
  // Core API
  onPointerEvent: {
    (...eventTypes: PointerEventType[]): Accessor<PointerEventData[]>;
    (
      eventTypes: PointerEventType[],
      options: PointerEventOptions
    ): Accessor<PointerEventData[]>;
  };
  onPointerTrack: (
    pointerIds?: number[],
    options?: PointerTrackOptions
  ) => Accessor<PointerState[]>;

  // Convenience methods
  getPrimaryPointer: () => Accessor<PointerState | undefined>;
  getPointerById: (id: number) => Accessor<PointerState | undefined>;
  getPrimaryPointerOfType: (type: PointerType) => Accessor<PointerState | undefined>;

  // High-level helpers (for better DX - most users should start here)
  onPrimaryPointer: () => Accessor<PointerState | undefined>;
  trackPointerType: (type: PointerType) => Accessor<PointerState[]>;
  trackWithPressure: (minPressure: number) => Accessor<PointerState[]>;

  // Capability detection
  capabilities: {
    hasMultiTouch: boolean;
    hasStylus: boolean;
    hasPressure: boolean;
  };
};

/**
 * Pointer-like DOM element interface
 */
type PointerLikeEl = {
  addEventListener(
    name: PointerEventType,
    cb: (evt: PointerEvent) => void
  ): void;
  removeEventListener(
    name: PointerEventType,
    cb: (evt: PointerEvent) => void
  ): void;
};
```

---

## Implementation Plan

### Phase 1: Foundation

**Files to Create:**
- `packages/sylph-jsx/src/engine/effects/input/createPointer.ts`
- `packages/sylph-jsx/src/engine/effects/input/pointer-types.ts`

**Tasks:**

1. **Create Type Definitions** (`pointer-types.ts`)
   - [ ] Define `PointerState` interface with all PointerEvent properties
   - [ ] Define `PointerEventData` interface
   - [ ] Define `PointerEventType` union type
   - [ ] Define `PointerType` union type
   - [ ] Define `PointerEventOptions` and `PointerTrackOptions` interfaces
   - [ ] Define `Pointer` return type
   - [ ] Define `PointerLikeEl` interface for event target abstraction
   - [ ] Add comprehensive JSDoc comments for all types

2. **Implement Core Infrastructure** (`createPointer.ts`)
   - [ ] Implement overloaded function signatures for `createPointer`
   - [ ] Add PointerEvent detection, return `undefined` if not supported
   - [ ] Add `expect: true` variant that throws on unsupported browsers
   - [ ] Import necessary SolidJS primitives from universal renderer
   - [ ] Import `onEveryFrame` from core query functions
   - [ ] Set up internal state management:
     - [ ] `pointerMap: Map<number, PointerState>` for active pointers
     - [ ] `eventBuffer: PointerEventData[]` for frame-local events
     - [ ] `eventSubscribers` Set
     - [ ] `trackingSubscribers` Set
   - [ ] Implement helper function to extract `PointerState` from `PointerEvent`
   - [ ] Implement helper function to filter out duplicate mouse/touch events

3. **Event Listener Setup**
   - [ ] Implement `createComputed` block for lifecycle management
   - [ ] Add **passive listeners by default** for all pointer event types:
     - [ ] `pointerdown` - Add pointer to map, set active state
     - [ ] `pointerup` - Remove pointer from map
     - [ ] `pointermove` - Update pointer state in map
     - [ ] `pointercancel` - Clean up pointer state
     - [ ] `pointerover`, `pointerout`, `pointerenter`, `pointerleave` - Track hover
     - [ ] `gotpointercapture`, `lostpointercapture` - Track capture state
   - [ ] Implement proper cleanup with `onCleanup`
   - [ ] Handle `preventDefault()` only when explicitly requested via options
   - [ ] Implement internal deduplication for mouse/pointer events without requiring preventDefault

### Phase 2: API Implementation

**Tasks:**

1. **Implement `onPointerEvent`**
   - [ ] Create signal with `shallowEqual` comparison (like `onKeyPress`)
   - [ ] Set up event subscriber with event type filtering
   - [ ] Implement options handling (filter, preventDefault)
   - [ ] Add subscriber to `eventSubscribers` Set
   - [ ] Set up cleanup to remove subscriber
   - [ ] Handle overloaded function signatures
   - [ ] Add comprehensive JSDoc with examples

2. **Implement `onPointerTrack`**
   - [ ] Create signal with `equals: false` (like `onKeyHold`)
   - [ ] Set up tracking subscriber with pointer ID filtering
   - [ ] Implement options handling (filter, activeOnly)
   - [ ] Add subscriber to `trackingSubscribers` Set
   - [ ] Implement `lastActiveCount` logic for efficient updates
   - [ ] Set up cleanup to remove subscriber
   - [ ] Add comprehensive JSDoc with examples

3. **Implement Frame Loop**
   - [ ] Add `onEveryFrame` callback
   - [ ] Early exit if no subscribers and no events
   - [ ] Process `eventSubscribers`:
     - [ ] Match events by type (use Set for O(1) lookup)
     - [ ] Apply filter functions
     - [ ] Call `setValue` with matched events
     - [ ] **Clear event buffer after processing** (prevents stale replay)
   - [ ] Process `trackingSubscribers`:
     - [ ] Match pointers by ID using Set intersection (or all if undefined)
     - [ ] Apply filter functions
     - [ ] Apply `activeOnly` filtering (check `buttons > 0`)
     - [ ] Implement hold detection with `lastActiveCount` optimization
     - [ ] Call `setValue` with active pointer states (shallow clone array only)

4. **Implement Convenience Methods**
   - [ ] `getPrimaryPointer()`:
     - [ ] Create computed signal
     - [ ] Filter for `isPrimary === true`
     - [ ] Return first match
   - [ ] `getPointerById(id)`:
     - [ ] Create computed signal with ID closure
     - [ ] Look up pointer in active map
     - [ ] Return state or undefined
   - [ ] `getPrimaryPointerOfType(type)`:
     - [ ] Filter for `isPrimary && pointerType === type`
     - [ ] Return first match

5. **Implement High-Level Helpers** (Optional Phase 2.5)
   - [ ] `onPrimaryPointer()`:
     - [ ] Wrapper around `onPointerTrack` with primary filter
     - [ ] Return single pointer or undefined
   - [ ] `trackPointerType(type)`:
     - [ ] Wrapper around `onPointerTrack` with type filter
   - [ ] `trackWithPressure(min)`:
     - [ ] Wrapper around `onPointerTrack` with pressure filter

### Phase 3: Documentation & Examples

**Files to Create/Update:**
- `packages/sylph-jsx/src/engine/effects/input/README.md`
- `examples/pointer-drawing/` (example application)

**Tasks:**

1. **API Documentation**
   - [ ] Write comprehensive API reference
   - [ ] Document all types and interfaces
   - [ ] Add usage examples for each method
   - [ ] Document common patterns and best practices
   - [ ] Add migration guide from `createMouse`

2. **Example: Pressure-Sensitive Drawing**
   - [ ] Set up PixiJS Graphics for drawing
   - [ ] Implement brush stroke rendering
   - [ ] Use pointer pressure for line thickness
   - [ ] Use pointer tilt for brush angle
   - [ ] Add color palette and brush selection
   - [ ] Demonstrate multi-touch support

3. **Example: Multi-Touch Gestures**
   - [ ] Implement pinch-to-zoom
   - [ ] Implement two-finger rotation
   - [ ] Implement pan with touch/mouse
   - [ ] Show pointer type differentiation

4. **Update Project Documentation**
   - [ ] Add `createPointer` to project overview
   - [ ] Update input effects section
   - [ ] Add to public API exports in `src/index.ts`

### Phase 4: Integration & Polish

**Tasks:**

1. **Export Configuration**
   - [ ] Add exports to `src/index.ts`
   - [ ] Add exports to `src/engine/effects/input/index.ts` (if exists)
   - [ ] Verify TypeScript type exports

2. **Browser Verification**
   - [ ] Verify on Chrome, Firefox, Safari
   - [ ] Verify on mobile devices (iOS Safari, Chrome Android)

3. **Performance Verification**
   - [ ] Profile memory usage with many pointers
   - [ ] Verify frame loop performance

---

## References

### Primary Resources

1. **MDN Web Docs: PointerEvent API**
   - URL: https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
   - Key Sections: Properties, Event Types, Browser Compatibility
   - Accessed: 2025-10-25

2. **Sylph.jsx Project Overview**
   - File: `/Users/dpchamps/Documents/Code/pixi-jsx/.config/claude/project-overview-final.md`
   - Sections: Architecture Overview (§2), Engine Runtime (§7), Testing Architecture (§11)
   - Key Patterns: Effect Cascade Processing, Frame Synchronization

3. **Existing Input Effects**
   - `createMouse.ts`: `/packages/sylph-jsx/src/engine/effects/input/createMouse.ts`
   - `create-keyboard.ts`: `/packages/sylph-jsx/src/engine/effects/input/create-keyboard.ts`
   - `key-codes.ts`: `/packages/sylph-jsx/src/engine/effects/input/key-codes.ts`

### Related APIs

- **W3C Pointer Events Specification**: https://www.w3.org/TR/pointerevents/
- **SolidJS Documentation**: https://www.solidjs.com/docs/latest
- **PixiJS Documentation**: https://pixijs.com/docs

### Related Sylph.jsx Files

- **Core Game Loop**: `src/engine/core/time.ts`
- **Query Functions**: `src/engine/core/query-fns.ts` (createSynchronizedEffect, onEveryFrame)
- **Game Loop Context**: `src/engine/core/game-loop-context.ts`

---

## Success Criteria

This implementation will be considered successful when:

1. **Functionality**
   - [ ] All pointer event types are supported
   - [ ] Multi-pointer tracking works correctly
   - [ ] Frame synchronization maintains < 16.6ms latency
   - [ ] Memory usage scales linearly with active pointers

2. **API Quality**
   - [ ] API is intuitive and follows Sylph.jsx conventions
   - [ ] TypeScript types are comprehensive and accurate
   - [ ] JSDoc documentation is complete with examples
   - [ ] API surface is consistent with `createKeyboard`

3. **Documentation**
   - [ ] API reference is complete
   - [ ] Migration guide is clear and actionable
   - [ ] Example applications demonstrate key features
   - [ ] Project overview is updated

4. **Performance**
   - [ ] All performance benchmarks met
   - [ ] No memory leaks detected
   - [ ] Frame budget respected under load
   - [ ] Performance comparable to `createMouse` for mouse-only usage

5. **Compatibility**
   - [ ] Returns `undefined` on unsupported browsers
   - [ ] Throws with `expect: true` on unsupported browsers
   - [ ] Graceful handling of mouse/touch event duplication
   - [ ] Can coexist with `createMouse` without conflicts

---

**Document Status:** Draft for Review
**Next Review Date:** Upon Implementation Start
**Approved By:** _Pending_