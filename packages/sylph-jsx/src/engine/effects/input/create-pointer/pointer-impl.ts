import {
  createComputed,
  createSignal,
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
  let hadEventsLastFrame = false;

  const clearEventAndSubscriberTracking = () => {
    eventBuffer.length = 0;
    eventSubscribers.clear();
    seenEvents.clear();
    hadEventsLastFrame = false;
  };

  const noEventsToProcess = () =>
    eventBuffer.length === 0 && !hadEventsLastFrame;

  const shouldNotifyOnLastFrame = () =>
    eventBuffer.length === 0 && hadEventsLastFrame;

  const eventMap: Record<PointerEventType, (event: PointerEvent) => void> = {
    pointerdown: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointerdown"));
    },
    pointerup: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointerup"));
    },
    pointermove: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointermove"));
    },
    pointercancel: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointercancel"));
    },
    pointerover: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointerover"));
    },
    pointerout: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointerout"));
    },
    pointerenter: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointerenter"));
    },
    pointerleave: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "pointerleave"));
    },
    gotpointercapture: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "gotpointercapture"));
    },
    lostpointercapture: (event) => {
      if (isDuplicateMouseEvent(event, seenEvents)) return;
      eventBuffer.push(createPointerEventData(event, "lostpointercapture"));
    },
  };

  createComputed(() => {
    Object.entries(eventMap).forEach(([name, fn]) => {
      element.addEventListener(name as PointerEventType, fn, listenerOptions);
    });
  });

  onCleanup(() => {
    Object.entries(eventMap).forEach(([name, fn]) => {
      element.removeEventListener(
        name as PointerEventType,
        fn,
        listenerOptions,
      );
    });
    clearEventAndSubscriberTracking();
  });

  onEveryFrame(() => {
    // Clear stale events when no subscribers to prevent replay later
    if (eventSubscribers.size === 0) return clearEventAndSubscriberTracking();
    // No events to process so we return early
    if (noEventsToProcess()) return;
    // No events this frame, but had events last frame - notify with empty arrays
    if (shouldNotifyOnLastFrame()) {
      hadEventsLastFrame = false;
      eventSubscribers.forEach((subscriber) => {
        subscriber.setValue([]);
      });
    } else {
      hadEventsLastFrame = true;
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
    }
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
  };
};
