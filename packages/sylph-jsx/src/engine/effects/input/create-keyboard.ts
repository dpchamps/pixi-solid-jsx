import {
  createComputed,
  onCleanup,
  createSignal,
} from "../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { onEveryFrame } from "../../core/query-fns.js";
import { shallowEqual } from "../../../utility-arrays.js";
import { type KeyCode } from "./key-codes.js";

/**
 * Reactive keyboard input manager.
 *
 * @public
 */
export type Keyboard = ReturnType<typeof createKeyboard>;

type Subscriber = {
  keyCodes: ReadonlySet<KeyCode>;
  setValue: (keys: string[]) => void;
  lastHeldCount?: number;
};

type KeyboardEventLike = { code: string };

type KeyboardLikeEl = {
  addEventListener(name: "keydown", cb: (evt: KeyboardEventLike) => void): void;
  addEventListener(name: "keyup", cb: (evt: KeyboardEventLike) => void): void;
  removeEventListener(
    name: "keydown",
    cb: (evt: KeyboardEventLike) => void,
  ): void;
  removeEventListener(
    name: "keyup",
    cb: (evt: KeyboardEventLike) => void,
  ): void;
};

/**
 * Creates a reactive keyboard input manager that tracks key presses and holds.
 *
 * Provides two distinct methods for tracking keyboard input:
 * - `onKeyPress`: Updates only when the set of pressed keys changes (discrete actions)
 * - `onKeyHold`: Updates every frame while keys are held (continuous movement)
 *
 *
 * @param element - DOM element to attach keyboard event listeners to (typically `window`)
 * @returns Keyboard manager with `onKeyPress` and `onKeyHold` methods
 *
 * @example
 * ```tsx
 * const keyboard = createKeyboard(window);
 *
 * // Discrete actions - only fires when key set changes
 * const actions = keyboard.onKeyPress("Space", "Enter");
 *
 * // Continuous movement - fires every frame while held
 * const movement = keyboard.onKeyHold("KeyW", "KeyA", "KeyS", "KeyD");
 *
 * createSynchronizedEffect(movement, (keys) => {
 *   if (keys.includes("KeyW")) moveUp();
 *   if (keys.includes("KeyS")) moveDown();
 * });
 * ```
 *
 * @remarks
 * Requires ES2025 Set methods (`Set.prototype.intersection`).
 * Ensure your build pipeline includes appropriate polyfills for older browsers.
 *
 * @public
 */
export const createKeyboard = (element: KeyboardLikeEl) => {
  const [keyMap, setKeyMap] = createSignal(new Set<string>());

  const holdSubscribers = new Set<Subscriber>();
  const pressSubscribers = new Set<Subscriber>();

  createComputed(() => {
    const keyDownListener = (event: KeyboardEventLike) => {
      setKeyMap((last) => {
        last.add(event.code);
        return new Set(last);
      });
    };
    element.addEventListener("keydown", keyDownListener);

    const keyUpListener = (event: KeyboardEventLike) => {
      setKeyMap((last) => {
        last.delete(event.code);
        return new Set(last);
      });
    };
    element.addEventListener("keyup", keyUpListener);

    onCleanup(() => {
      element.removeEventListener("keydown", keyDownListener);
      element.removeEventListener("keyup", keyUpListener);
    });
  });

  onEveryFrame(() => {
    if (pressSubscribers.size === 0 && holdSubscribers.size === 0) return;

    const activeKeys = keyMap();

    pressSubscribers.forEach(({ keyCodes, setValue }) => {
      const pressed = [...keyCodes.intersection(activeKeys)];
      setValue(pressed);
    });

    holdSubscribers.forEach((subscriber) => {
      const { keyCodes, setValue } = subscriber;
      const heldKeys = [...keyCodes.intersection(activeKeys)];
      const currentCount = heldKeys.length;
      const lastCount = subscriber.lastHeldCount ?? 0;

      if (currentCount > 0 || lastCount > 0) {
        setValue(heldKeys);
      }

      subscriber.lastHeldCount = currentCount;
    });
  });

  return {
    /**
     * Creates a signal that updates only when the set of pressed keys changes.
     *
     * @param keyCodes - Key codes to watch (automatically deduplicated)
     * @returns Signal containing array of currently pressed watched keys
     *
     * @example
     * ```tsx
     * const actions = keyboard.onKeyPress("Space", "Enter", "Escape");
     *
     * createSynchronizedEffect(actions, (keys) => {
     *   if (keys.includes("Space")) jump();
     *   if (keys.includes("Enter")) interact();
     * });
     * ```
     */
    onKeyPress: (...keyCodes: KeyCode[]) => {
      const keyCodesSet = new Set(keyCodes);
      const [keyPress, setKeyPress] = createSignal<string[]>([], {
        equals: shallowEqual,
      });

      const subscriber = {
        keyCodes: keyCodesSet,
        setValue: (pressed) => setKeyPress(pressed),
      } satisfies Subscriber;

      pressSubscribers.add(subscriber);
      subscriber.setValue([...keyCodesSet.intersection(keyMap())]);
      onCleanup(() => {
        pressSubscribers.delete(subscriber);
        setKeyPress([]);
      });

      return keyPress;
    },
    /**
     * Creates a signal that updates every frame while any watched key is held.
     *
     * Ideal for continuous actions like movement, scrolling, or charging attacks.
     *
     * @param keyCodes - Key codes to watch (automatically deduplicated)
     * @returns Signal containing array of currently held watched keys
     *
     * @example
     * ```tsx
     * const movement = keyboard.onKeyHold("KeyW", "KeyA", "KeyS", "KeyD");
     *
     * createSynchronizedEffect(movement, (keys, time) => {
     *   const speed = 5 * time.deltaTime;
     *   if (keys.includes("KeyW")) player.y -= speed;
     *   if (keys.includes("KeyS")) player.y += speed;
     *   if (keys.includes("KeyA")) player.x -= speed;
     *   if (keys.includes("KeyD")) player.x += speed;
     * });
     * ```
     */
    onKeyHold: (...keyCodes: KeyCode[]) => {
      const keyCodesSet = new Set(keyCodes);
      const [keyDown, setKeyDown] = createSignal<string[]>([], {
        equals: false,
      });

      const subscriber = {
        keyCodes: keyCodesSet,
        setValue: (held) => setKeyDown(held),
      } satisfies Subscriber;

      holdSubscribers.add(subscriber);
      subscriber.setValue([...keyCodesSet.intersection(keyMap())]);
      onCleanup(() => {
        holdSubscribers.delete(subscriber);
        setKeyDown([]);
      });

      return keyDown;
    },
  };
};
