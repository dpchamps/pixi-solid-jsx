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
  createPointerEventState,
  LISTENER_OPTIONS,
  POINTER_EVENTS,
  type PointerEventState,
} from "./utilities-pointer.js";

const createEventFunctionsWithPointerEventState = (
  pointerEventState: PointerEventState,
) =>
  POINTER_EVENTS.map(
    (eventType) =>
      [
        eventType,
        (event: PointerEvent) =>
          pointerEventState.addEventData(event, eventType),
      ] as const,
  );

export const createPointerImpl = (element: PointerLikeEl): Pointer => {
  const pointerEventState = createPointerEventState();
  const eventFns = createEventFunctionsWithPointerEventState(pointerEventState);

  createComputed(() => {
    eventFns.forEach(([eventType, fn]) => {
      element.addEventListener(eventType, fn, LISTENER_OPTIONS);
    });
  });

  onCleanup(() => {
    eventFns.forEach(([eventType, fn]) => {
      element.removeEventListener(eventType, fn, LISTENER_OPTIONS);
    });
    pointerEventState.reset();
  });

  onEveryFrame(pointerEventState.updateAndTransition);

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
