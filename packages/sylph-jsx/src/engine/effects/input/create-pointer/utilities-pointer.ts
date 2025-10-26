import type {
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

export const isDuplicateMouseEvent = (
  event: PointerEvent,
  seenEvents: Set<string>,
): boolean => {
  if (event.pointerType !== "mouse") {
    return false;
  }

  const eventKey = `${event.type}-${event.pointerId}-${event.timeStamp}`;

  if (seenEvents.has(eventKey)) {
    return true;
  }

  seenEvents.add(eventKey);
  return false;
};
