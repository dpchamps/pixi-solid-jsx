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
  createEventKey,
  createPointerEventData,
  isDuplicateMouseEvent,
} from "./utilities-pointer.js";

const POINTER_EVENTS = [
  "pointerdown",
  "pointerup",
  "pointermove",
  "pointercancel",
  "pointerover",
  "pointerout",
  "pointerenter",
  "pointerleave",
  "gotpointercapture",
  "lostpointercapture",
] as const;

const createPointerEventState = () => {
  const eventBuffer: PointerEventData[] = [];
  const eventSubscriptions = new Set<EventSubscriber>();
  const seenEvents = new Set<string>();
  let hadEventsLastFrame = false;

  return {
    isEmptyEventQueue: () =>
      eventSubscriptions.size === 0 ||
      (eventBuffer.length === 0 && !hadEventsLastFrame),
    shouldNotifySubscriptionsOfNoEvents: () =>
      eventBuffer.length === 0 && hadEventsLastFrame,
    performEmptyEventNotification: () => {
      // When there were no new events, we should notify subscribers that no events occured
      hadEventsLastFrame = false;
      eventSubscriptions.forEach((subscriber) => {
        subscriber.setValue([]);
      });
    },
    performEmptyQueueEventAction: (forceClean: boolean = false) => {
      if (eventSubscriptions.size === 0 || forceClean) {
        hadEventsLastFrame = false;
        eventBuffer.length = 0;
        eventSubscriptions.clear();
        seenEvents.clear();
      }
    },
    performStandardEventNotificationAction: () => {
      hadEventsLastFrame = true;
      eventSubscriptions.forEach((subscriber) => {
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
    },
    addEventData: (event: PointerEvent, type: PointerEventType) => {
      const eventKey = createEventKey(event);
      const eventData = createPointerEventData(event, type);
      if (isDuplicateMouseEvent(event, eventKey, seenEvents)) return;
      seenEvents.add(eventKey);
      eventBuffer.push(eventData);
    },
    addSubscription: (eventSubscription: EventSubscriber) => {
      eventSubscriptions.add(eventSubscription);
    },
    removeSubscription: (eventSubscription: EventSubscriber) => {
      eventSubscriptions.delete(eventSubscription);
    },
  };
};

export const createPointerImpl = (element: PointerLikeEl): Pointer => {
  const listenerOptions = { passive: true } satisfies AddEventListenerOptions;
  const pointerEventState = createPointerEventState();

  const createEventFn =
    <T extends PointerEventType>(eventType: T) =>
    (event: PointerEvent) =>
      pointerEventState.addEventData(event, eventType);

  const eventFns = POINTER_EVENTS.map(
    (eventType) => [eventType, createEventFn(eventType)] as const,
  );

  createComputed(() => {
    eventFns.forEach(([eventType, fn]) => {
      element.addEventListener(eventType, fn, listenerOptions);
    });
  });

  onCleanup(() => {
    eventFns.forEach(([eventType, fn]) => {
      element.removeEventListener(eventType, fn, listenerOptions);
    });
    pointerEventState.performEmptyQueueEventAction(true);
  });

  onEveryFrame(() => {
    if (pointerEventState.isEmptyEventQueue())
      return pointerEventState.performEmptyQueueEventAction();
    if (pointerEventState.shouldNotifySubscriptionsOfNoEvents())
      return pointerEventState.performEmptyEventNotification();
    pointerEventState.performStandardEventNotificationAction();
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

    pointerEventState.addSubscription(subscriber);

    onCleanup(() => {
      pointerEventState.removeSubscription(subscriber);
      setEvents([]);
    });

    return events;
  };

  return {
    onPointerEvent,
  };
};
