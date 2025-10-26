import {
  createComputed,
  createSignal,
  createStore,
  onCleanup,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { onEveryFrame } from "../../../core/query-fns.js";
import { shallowEqual } from "../../../../utility-arrays.js";
import type {
  Pointer,
  PointerEventData,
  PointerEventOptions,
  PointerEventType,
  PointerLikeEl,
  EventSubscriber,
} from "./types.js";
import {
  createPointerEventData,
  isDuplicateMouseEvent,
} from "./utilities-pointer.js";

export const createPointerImpl = (element: PointerLikeEl): Pointer => {
  const listenerOptions = { passive: true } satisfies AddEventListenerOptions;
  const eventBuffer: PointerEventData[] = [];
  const eventSubscribers = new Set<EventSubscriber>();
  const seenEvents = new Set<string>();
  const activePointers = new Set<number>();

  // Reactive capability store
  const [capabilities, setCapabilities] = createStore({
    hasMultiTouch: false,
    hasStylus: false,
    hasPressure: false,
  });

  const updateCapabilities = (event: PointerEvent) => {
    if (event.pointerType === "pen") {
      setCapabilities("hasStylus", true);
    }
    // Only detect true pressure-sensitive devices
    // Mice and basic touch report 0.5 when pressed but don't have real pressure sensing
    if (
      event.pointerType === "pen" ||
      (event.pressure > 0 && event.pressure !== 0.5)
    ) {
      setCapabilities("hasPressure", true);
    }
    if (activePointers.size > 1) {
      setCapabilities("hasMultiTouch", true);
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    activePointers.add(event.pointerId);
    updateCapabilities(event);
    eventBuffer.push(createPointerEventData(event, "pointerdown"));
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    activePointers.delete(event.pointerId);
    updateCapabilities(event);
    eventBuffer.push(createPointerEventData(event, "pointerup"));
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    updateCapabilities(event);
    eventBuffer.push(createPointerEventData(event, "pointermove"));
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (isDuplicateMouseEvent(event, seenEvents)) {
      return;
    }

    activePointers.delete(event.pointerId);
    updateCapabilities(event);
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

    activePointers.delete(event.pointerId);
    eventBuffer.push(createPointerEventData(event, "lostpointercapture"));
  };

  createComputed(() => {
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
  });

  onCleanup(() => {
    element.removeEventListener(
      "pointerdown",
      handlePointerDown,
      listenerOptions,
    );
    element.removeEventListener("pointerup", handlePointerUp, listenerOptions);
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

    eventBuffer.length = 0;
    eventSubscribers.clear();
    seenEvents.clear();
    activePointers.clear();
  });

  onEveryFrame(() => {
    if (eventSubscribers.size === 0) {
      return;
    }

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
    seenEvents.clear();
  });

  const onPointerEvent = (
    eventTypes: PointerEventType | PointerEventType[],
    options?: PointerEventOptions,
  ) => {
    const eventTypesArray = Array.isArray(eventTypes)
      ? eventTypes
      : [eventTypes];
    const eventTypesSet = new Set(eventTypesArray);
    const [events, setEvents] = createSignal<PointerEventData[]>([], {
      equals: shallowEqual,
    });

    const subscriber = {
      eventTypes: eventTypesSet,
      filter: options?.filter,
      setValue: (matchedEvents) => setEvents(matchedEvents),
    } satisfies EventSubscriber;

    eventSubscribers.add(subscriber);

    onCleanup(() => {
      eventSubscribers.delete(subscriber);
      setEvents([]);
    });

    return events;
  };

  return {
    onPointerEvent,
    capabilities,
  };
};
