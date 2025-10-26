import type {
  EventSubscriber,
  PointerEventData,
  PointerEventType,
  PointerState,
  PointerType,
} from "./types.js";

export const extractPointerState = (event: PointerEvent): PointerState => ({
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

export const createPointerEventData = (
  event: PointerEvent,
  eventType: PointerEventType,
): PointerEventData => ({
  ...extractPointerState(event),
  eventType,
  target: event.target,
});

type EventKey = ReturnType<typeof createEventKey>;

export const createEventKey = (event: PointerEvent) =>
  `${event.type}-${event.pointerId}-${event.timeStamp}` as const;

export const isDuplicateMouseEvent = (
  event: PointerEvent,
  key: EventKey,
  seenEvents: Set<string>,
): boolean => {
  if (event.pointerType !== "mouse") {
    return false;
  }

  return seenEvents.has(key);
};

export type PointerEventState = ReturnType<typeof createPointerEventState>;

export const createPointerEventState = () => {
  const eventBuffer: PointerEventData[] = [];
  const eventSubscriptions = new Set<EventSubscriber>();
  const seenEvents = new Set<string>();
  let hadEventsLastFrame = false;

  const reset = () => {
    hadEventsLastFrame = false;
    eventBuffer.length = 0;
    eventSubscriptions.clear();
    seenEvents.clear();
  };

  const canTransitionIntoEmptyStateAction = () =>
    eventSubscriptions.size === 0 ||
    (eventBuffer.length === 0 && !hadEventsLastFrame);

  const canTransitionIntoEmptyEventNotificationAction = () =>
    eventBuffer.length === 0 && hadEventsLastFrame;

  const performEmptyStateEventAction = () => {
    if (eventSubscriptions.size === 0) {
      reset();
    }
  };

  const performEmptyEventNotificationAction = () => {
    // When there were no new events, we should notify subscribers that no events occured
    hadEventsLastFrame = false;
    eventSubscriptions.forEach((subscriber) => {
      subscriber.setValue([]);
    });
  };

  const performDefaultEventNotificationAction = () => {
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
  };

  return {
    reset: () => reset(),
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
    updateAndTransition: () => {
      // If there's no actions to perform then we'll transition into empty state
      if (canTransitionIntoEmptyStateAction())
        return performEmptyStateEventAction();
      // If we can transition into the empty event notification action, we will
      if (canTransitionIntoEmptyEventNotificationAction())
        return performEmptyEventNotificationAction();
      // Other wise perform default
      performDefaultEventNotificationAction();
    },
  };
};

export const POINTER_EVENTS = [
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

export const LISTENER_OPTIONS = {
  passive: true,
} satisfies AddEventListenerOptions;
