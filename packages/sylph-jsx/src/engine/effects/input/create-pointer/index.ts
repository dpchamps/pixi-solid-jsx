import type { Pointer, PointerLikeEl } from "./types.js";
import { createPointerImpl } from "./pointer-impl.js";

export * from "./types.js";

/**
 * Creates a reactive pointer input manager supporting mouse, touch, and stylus.
 *
 * Returns `undefined` if PointerEvent API is not supported in the current browser.
 * Use the overload with `expect: true` to throw an error instead.
 *
 * Provides unified event-driven pointer handling through `onPointerEvent`,
 * which buffers all pointer events and delivers them once per frame.
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
 * // Single event type
 * const clicks = pointer.onPointerEvent("pointerdown");
 *
 * // Multiple event types
 * const interactions = pointer.onPointerEvent(["pointerdown", "pointerup"]);
 *
 * // With filter options - drawing with pressure
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
