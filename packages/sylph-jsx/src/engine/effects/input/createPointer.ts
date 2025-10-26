import {
  createComputed,
  createSignal,
  onCleanup,
} from "../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { onEveryFrame } from "../../core/query-fns.js";
import { shallowEqual } from "../../../utility-arrays.js";
import type {
  Pointer,
  PointerEventData,
  PointerEventOptions,
  PointerEventType,
  PointerLikeEl,
  PointerState,
  PointerTrackOptions,
  PointerType,
  EventSubscriber,
  TrackingSubscriber,
} from "./pointer-types.js";

const extractPointerState = (event: PointerEvent): PointerState => ({
  pointerId: event.pointerId,
  pointerType: event.pointerType as PointerType,
  isPrimary: event.isPrimary,
  x: event.x,
  y: event.y,
  screenX: event.screenX,
  screenY: event.screenY,
  clientX: event.clientX,
  clientY: event.clientY,
  pageX: event.pageX,
  pageY: event.pageY,
  offsetX: event.offsetX,
  offsetY: event.offsetY,
  movementX: event.movementX,
  movementY: event.movementY,
  pressure: event.pressure,
  tangentialPressure: event.tangentialPressure,
  tiltX: event.tiltX,
  tiltY: event.tiltY,
  twist: event.twist,
  altitudeAngle: event.altitudeAngle,
  azimuthAngle: event.azimuthAngle,
  width: event.width,
  height: event.height,
  buttons: event.buttons,
  button: event.button,
  ctrlKey: event.ctrlKey,
  shiftKey: event.shiftKey,
  altKey: event.altKey,
  metaKey: event.metaKey,
  timeStamp: event.timeStamp,
});

const createPointerEventData = (
  event: PointerEvent,
  eventType: PointerEventType,
): PointerEventData => ({
  ...extractPointerState(event),
  eventType,
  target: event.target,
});

const isDuplicateMouseEvent = (
  event: PointerEvent,
  seenEvents: Set<string>,
): boolean => {
  if (event.pointerType !== "mouse") {
    return false;
  }

  const eventKey = `${event.type}-${event.timeStamp}`;

  if (seenEvents.has(eventKey)) {
    return true;
  }

  seenEvents.add(eventKey);
  return false;
};

const createPointerImpl = (element: PointerLikeEl): Pointer => {
  const pointerMap = new Map<number, PointerState>();
  const eventBuffer: PointerEventData[] = [];
  const eventSubscribers = new Set<EventSubscriber>();
  const trackingSubscribers = new Set<TrackingSubscriber>();
  const seenEvents = new Set<string>();

  const handlePointerDown = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    const state = extractPointerState(event);
    pointerMap.set(event.pointerId, state);
    eventBuffer.push(createPointerEventData(event, "pointerdown"));
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    pointerMap.delete(event.pointerId);
    eventBuffer.push(createPointerEventData(event, "pointerup"));
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    const state = extractPointerState(event);
    if (pointerMap.has(event.pointerId)) {
      pointerMap.set(event.pointerId, state);
    }
    eventBuffer.push(createPointerEventData(event, "pointermove"));
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    pointerMap.delete(event.pointerId);
    eventBuffer.push(createPointerEventData(event, "pointercancel"));
  };

  const handlePointerOver = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    eventBuffer.push(createPointerEventData(event, "pointerover"));
  };

  const handlePointerOut = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    eventBuffer.push(createPointerEventData(event, "pointerout"));
  };

  const handlePointerEnter = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    eventBuffer.push(createPointerEventData(event, "pointerenter"));
  };

  const handlePointerLeave = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    eventBuffer.push(createPointerEventData(event, "pointerleave"));
  };

  const handleGotPointerCapture = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    eventBuffer.push(createPointerEventData(event, "gotpointercapture"));
  };

  const handleLostPointerCapture = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    eventBuffer.push(createPointerEventData(event, "lostpointercapture"));
  };

  createComputed(() => {
    const listenerOptions: AddEventListenerOptions = { passive: true };

    element.addEventListener("pointerdown", handlePointerDown, listenerOptions);
    element.addEventListener("pointerup", handlePointerUp, listenerOptions);
    element.addEventListener("pointermove", handlePointerMove, listenerOptions);
    element.addEventListener(
      "pointercancel",
      handlePointerCancel,
      listenerOptions,
    );
    element.addEventListener("pointerover", handlePointerOver, listenerOptions);
    element.addEventListener("pointerout", handlePointerOut, listenerOptions);
    element.addEventListener(
      "pointerenter",
      handlePointerEnter,
      listenerOptions,
    );
    element.addEventListener(
      "pointerleave",
      handlePointerLeave,
      listenerOptions,
    );
    element.addEventListener(
      "gotpointercapture",
      handleGotPointerCapture,
      listenerOptions,
    );
    element.addEventListener(
      "lostpointercapture",
      handleLostPointerCapture,
      listenerOptions,
    );

    onCleanup(() => {
      element.removeEventListener(
        "pointerdown",
        handlePointerDown,
        listenerOptions,
      );
      element.removeEventListener(
        "pointerup",
        handlePointerUp,
        listenerOptions,
      );
      element.removeEventListener(
        "pointermove",
        handlePointerMove,
        listenerOptions,
      );
      element.removeEventListener(
        "pointercancel",
        handlePointerCancel,
        listenerOptions,
      );
      element.removeEventListener(
        "pointerover",
        handlePointerOver,
        listenerOptions,
      );
      element.removeEventListener(
        "pointerout",
        handlePointerOut,
        listenerOptions,
      );
      element.removeEventListener(
        "pointerenter",
        handlePointerEnter,
        listenerOptions,
      );
      element.removeEventListener(
        "pointerleave",
        handlePointerLeave,
        listenerOptions,
      );
      element.removeEventListener(
        "gotpointercapture",
        handleGotPointerCapture,
        listenerOptions,
      );
      element.removeEventListener(
        "lostpointercapture",
        handleLostPointerCapture,
        listenerOptions,
      );

      pointerMap.clear();
      eventBuffer.length = 0;
      eventSubscribers.clear();
      trackingSubscribers.clear();
      seenEvents.clear();
    });
  });

  onEveryFrame(() => {
    if (eventSubscribers.size === 0 && trackingSubscribers.size === 0) {
      return;
    }

    if (eventSubscribers.size > 0 && eventBuffer.length > 0) {
      eventSubscribers.forEach((subscriber) => {
        const matchedEvents = eventBuffer.filter((event) => {
          const typeMatches = subscriber.eventTypes.has(event.eventType);
          const filterMatches = subscriber.filter
            ? subscriber.filter(event)
            : true;
          return typeMatches && filterMatches;
        });

        subscriber.setValue(matchedEvents);
      });

      eventBuffer.length = 0;
    }

    if (trackingSubscribers.size > 0) {
      const activePointers = Array.from(pointerMap.values());

      trackingSubscribers.forEach((subscriber) => {
        const pointerIdSet = subscriber.pointerIds;
        const matchedPointers = activePointers.filter((state) => {
          const idMatches = pointerIdSet
            ? pointerIdSet.has(state.pointerId)
            : true;
          const filterMatches = subscriber.filter
            ? subscriber.filter(state)
            : true;
          return idMatches && filterMatches;
        });

        const currentCount = matchedPointers.length;
        const lastCount = subscriber.lastActiveCount ?? 0;

        if (currentCount > 0 || lastCount > 0) {
          subscriber.setValue(matchedPointers);
        }

        subscriber.lastActiveCount = currentCount;
      });
    }

    seenEvents.clear();
  });

  const onPointerEvent = (...args: unknown[]) => {
    let eventTypes: PointerEventType[];
    let options: PointerEventOptions | undefined;

    if (
      Array.isArray(args[0]) &&
      typeof args[1] === "object" &&
      args[1] !== null
    ) {
      eventTypes = args[0] as PointerEventType[];
      options = args[1] as PointerEventOptions;
    } else {
      eventTypes = args as PointerEventType[];
      options = undefined;
    }

    const eventTypesSet = new Set(eventTypes);
    const [events, setEvents] = createSignal<PointerEventData[]>([], {
      equals: shallowEqual,
    });

    const subscriber: EventSubscriber = {
      eventTypes: eventTypesSet,
      filter: options?.filter,
      setValue: (matchedEvents) => setEvents(matchedEvents),
    };

    eventSubscribers.add(subscriber);

    onCleanup(() => {
      eventSubscribers.delete(subscriber);
      setEvents([]);
    });

    return events;
  };

  const onPointerTrack = (
    pointerIds?: number[],
    options?: PointerTrackOptions,
  ) => {
    const pointerIdSet = pointerIds ? new Set(pointerIds) : undefined;
    const [pointers, setPointers] = createSignal<PointerState[]>([], {
      equals: false,
    });

    const subscriber: TrackingSubscriber = {
      pointerIds: pointerIdSet,
      filter: options?.filter,
      setValue: (matchedPointers) => setPointers(matchedPointers),
    };

    trackingSubscribers.add(subscriber);

    onCleanup(() => {
      trackingSubscribers.delete(subscriber);
      setPointers([]);
    });

    return pointers;
  };

  const getPrimaryPointer = () => {
    const [primary, setPrimary] = createSignal<PointerState | undefined>(
      undefined,
    );

    onEveryFrame(() => {
      const activePointers = Array.from(pointerMap.values());
      const primaryPointer = activePointers.find((p) => p.isPrimary);
      setPrimary(primaryPointer);
    });

    return primary;
  };

  const getPointerById = (id: number) => {
    const [pointer, setPointer] = createSignal<PointerState | undefined>(
      undefined,
    );

    onEveryFrame(() => {
      setPointer(pointerMap.get(id));
    });

    return pointer;
  };

  const getPrimaryPointerOfType = (type: PointerType) => {
    const [primary, setPrimary] = createSignal<PointerState | undefined>(
      undefined,
    );

    onEveryFrame(() => {
      const activePointers = Array.from(pointerMap.values());
      const primaryPointer = activePointers.find(
        (p) => p.isPrimary && p.pointerType === type,
      );
      setPrimary(primaryPointer);
    });

    return primary;
  };

  const onPrimaryPointer = () => {
    const [primary, setPrimary] = createSignal<PointerState | undefined>(
      undefined,
    );

    onEveryFrame(() => {
      const activePointers = Array.from(pointerMap.values());
      const primaryPointer = activePointers.find((p) => p.isPrimary);
      setPrimary(primaryPointer);
    });

    return primary;
  };

  const trackPointerType = (type: PointerType) =>
    onPointerTrack(undefined, { filter: (p) => p.pointerType === type });

  const trackWithPressure = (minPressure: number) =>
    onPointerTrack(undefined, { filter: (p) => p.pressure >= minPressure });

  return {
    onPointerEvent,
    onPointerTrack,
    getPrimaryPointer,
    getPointerById,
    getPrimaryPointerOfType,
    onPrimaryPointer,
    trackPointerType,
    trackWithPressure,
    capabilities: {
      hasMultiTouch: false,
      hasStylus: false,
      hasPressure: false,
    },
  };
};

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
  options: { expect: true },
): Pointer;

export function createPointer(
  element: PointerLikeEl,
  options?: { expect?: boolean },
): Pointer | undefined {
  if (typeof window === "undefined" || !("PointerEvent" in window)) {
    if (options?.expect) {
      throw new Error(
        "PointerEvent API is not supported in this browser. Cannot create pointer manager.",
      );
    }
    return undefined;
  }

  return createPointerImpl(element);
}
