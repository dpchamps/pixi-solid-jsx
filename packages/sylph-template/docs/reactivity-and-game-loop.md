# Reactivity and Game Loop

Sylph.jsx uses SolidJS fine-grained reactivity and schedules game-facing side effects on the Pixi ticker. This gives predictable frame-aligned updates without a virtual DOM.

## Signals are state

Use signals for mutable game state.

```tsx
import { createSignal } from "sylph-jsx";

const [player, setPlayer] = createSignal({ x: 100, y: 100, hp: 20 });

<sprite x={player().x} y={player().y} />;
```

Use functional setters when deriving next state from previous state.

```ts
setPlayer((last) => ({ ...last, hp: Math.max(0, last.hp - damage) }));
```

## Memos are derived state

Use `createMemo` for derived values that are read in multiple places or expensive enough to avoid recomputing.

```ts
const healthRatio = createMemo(() => player().hp / 20);
const isLowHealth = createMemo(() => healthRatio() < 0.25);
```

## JSX prop updates

Passing signal values to JSX props is the most direct way to update Pixi objects.

```tsx
<sprite
  x={player().x}
  y={player().y}
  tint={isLowHealth() ? 0xff7777 : 0xffffff}
/>
```

Use this by default. Do not write imperative mutation when a reactive prop is enough.

## `createEffect`

Use `createEffect` for ordinary reactive effects that do not need ticker synchronization, such as saving settings to localStorage or redrawing a `Graphics` object in response to props.

```ts
createEffect(() => {
  localStorage.setItem("settings", JSON.stringify(settings()));
});
```

For Pixi mutations that should be frame-aligned, prefer `createSynchronizedEffect`.

## `createSynchronizedEffect`

Use `createSynchronizedEffect(query, effect)` for side effects driven by reactive values but executed on the Sylph/Pixi ticker.

```ts
createSynchronizedEffect(
  () => props.health,
  (health, ticker) => {
    setDisplayedHealth(health);
  },
);
```

The query function tracks dependencies. When the query changes, Sylph schedules the effect to run on a frame. The effect receives the query result and the Pixi ticker.

This is ideal for:

- updating state in response to input signals,
- starting or stopping coroutines based on state,
- syncing imperative Pixi objects to reactive state,
- frame-aligned game logic transitions.

Example from the template style:

```ts
createSynchronizedEffect(mousePosition.currentMousePosition, (pos) => {
  if (!pos) return;
  setTargetPos(getMousePositionOffset(pos));
});
```

## `onEveryFrame`

Use `onEveryFrame` only for work that truly runs every frame.

```ts
onEveryFrame((ticker) => {
  setLogoPos(({ x, y }) => ({
    x: x + (target().x - x) * 0.05 * ticker.deltaTime,
    y: y + (target().y - y) * 0.05 * ticker.deltaTime,
  }));
});
```

Good uses:

- movement interpolation,
- physics steps,
- particles,
- camera smoothing,
- timers that must be based on frame time.

Avoid:

- asset loading,
- allocating large objects every frame,
- scanning large arrays every frame when a signal-driven effect would do,
- calling `startCoroutine` every frame without guards.

## Coroutines

Use coroutines for sequential frame-based behavior.

```ts
import {
  startCoroutine,
  createEasingCoroutine,
  easeOut,
  waitMs,
  onCleanup,
} from "sylph-jsx";

let current: ReturnType<typeof startCoroutine> | undefined;

createSynchronizedEffect(
  () => props.active,
  (active) => {
    current?.dispose();
    if (!active) return;

    current = startCoroutine(function* () {
      yield waitMs(100);
      yield* createEasingCoroutine(
        (lerp) => setAlpha(lerp(0, 1)),
        easeOut,
        300,
      )();
    });
  },
);

onCleanup(() => current?.dispose());
```

Use coroutines instead of manually managing many timer signals when the behavior is naturally sequential.

## Avoid stale or runaway scheduled work

Always dispose coroutines and external subscriptions.

```ts
let animation: ReturnType<typeof startCoroutine> | undefined;

onCleanup(() => animation?.dispose());
```

When an effect starts a new coroutine in response to state, dispose the previous one first.

## Batching and cascading

Sylph's ticker processes scheduled effects in a cascade within a frame budget. This reduces multi-frame latency for chains like:

input -> state A -> derived state B -> Pixi props

Do not rely on immediate synchronous execution of `createSynchronizedEffect`. It is intentionally frame-synchronized.

## Choosing the right primitive

| Need | Use |
| --- | --- |
| Store mutable game/app state | `createSignal` |
| Compute derived value | `createMemo` |
| Save settings / redraw local graphics | `createEffect` |
| React to state on the Pixi frame | `createSynchronizedEffect` |
| Do something continuously every frame | `onEveryFrame` |
| Express timed sequence | `startCoroutine` |
| Render conditional scene | `Show` / `Switch` |
| Render array | `For` / `Index` |
