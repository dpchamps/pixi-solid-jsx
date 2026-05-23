# Testing and Debugging

Sylph.jsx apps can be tested at two levels: pure game/layout logic and Pixi/Sylph integration. Keep pure logic pure whenever possible.

## Prefer pure reducers for game rules

Model game state transitions as pure functions.

```ts
export type GameState =
  | { started: false }
  | { started: true; hp: number };

export type GameAction =
  | { type: "start" }
  | { type: "damage"; amount: number };

export const getNextGameState = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "start":
      return { started: true, hp: 20 };
    case "damage":
      return state.started
        ? { ...state, hp: Math.max(0, state.hp - action.amount) }
        : state;
  }
};
```

Pure reducers are easy to test without Pixi, canvas, or browser APIs.

## Keep layout math pure

Write functions like this:

```ts
export const calculateCardDimensions = (width: number, height: number) => {
  const scale = Math.min(1, width / 800, height / 700);
  return { width: 180 * scale, height: 270 * scale };
};
```

Then wrap them in reactive hooks separately. Test the pure functions directly.

## Type checking

Run from the template package:

```bash
npm run typecheck
```

Run a production build:

```bash
npm run build
```

These catch most integration mistakes around JSX props, asset imports, and Vite configuration.

## Debugging common JSX mistakes

### Nothing renders

Check:

- `renderRoot(AppRoot, document.body)` is called.
- `<Application>` is rendered at the root.
- Textures have loaded before sprite dimensions/texture-dependent code runs.
- The object is within the canvas bounds.
- `alpha`, `visible`, `scale`, and `tint` are expected.
- Parent containers are not positioned off-screen.

### zIndex does nothing

The parent container must have `sortableChildren`.

```tsx
<container sortableChildren>
  <sprite zIndex={1} />
  <text zIndex={2}>Above</text>
</container>
```

Do not immediately add `<render-layer>`. See `render-layers.md`.

### Clicks do not fire

Check:

- `eventMode` is set to `"static"` or `"dynamic"`.
- A useful `hitArea` exists for containers.
- The target is not behind another interactive object.
- You are using Pixi event names such as `onpointertap`.
- You call `stopPropagation()` only when intended.

```tsx
<container
  eventMode="static"
  hitArea={new Rectangle(0, 0, width, height)}
  onpointertap={() => doThing()}
/>
```

### Ref type is awkward

Use `Ref<IntrinsicProps>`:

```ts
type GraphicsRef = Ref<GraphicsIntrinsicProps>;
const [graphics, setGraphics] = createSignal<GraphicsRef>();
```

### Asset is undefined

`createAsset` is asynchronous. Guard the value:

```ts
const texture = createAsset<Texture>("image.webp");

createSynchronizedEffect(texture, (tex) => {
  if (!tex) return;
  // use tex
});
```

Or preload critical assets in `appInitialize`.

### Effects run too often

Remember that any signal read inside an effect tracks. Move unrelated reads into `untrack` when needed, or narrow the query passed to `createSynchronizedEffect`.

```ts
createSynchronizedEffect(
  () => props.id,
  (id) => {
    // Only reruns when props.id changes.
  },
);
```

### Components recreate expensive Pixi objects

Avoid constructing expensive objects directly in JSX props if it causes churn.

Risky:

```tsx
<sprite filters={[new BlurFilter({ strength: strength() })]} />
```

Prefer stable object plus reactive mutation:

```ts
const filter = new BlurFilter({ strength: 0 });

createEffect(() => {
  filter.strength = strength();
});

onCleanup(() => filter.destroy());
```

```tsx
<sprite filters={[filter]} />
```

## Devtools

Pixi devtools can help inspect the stage and display objects. The framework may initialize Pixi devtools from the root application component depending on package version.

Use browser devtools for:

- canvas size and CSS,
- network asset loading,
- localStorage settings,
- thrown errors from event handlers/effects.

## Performance checklist

- Prefer reactive prop binding over imperative per-frame mutation.
- Use `onEveryFrame` only where continuous work is required.
- Avoid creating textures, filters, graphics, arrays of display objects, or large objects every frame.
- Use `createSynchronizedEffect` for state-driven side effects.
- Keep render layers top-level and sparse.
- Reuse Pixi objects in external components when practical.
- Dispose long-lived imperative resources.
- Avoid unbounded particles or display children.

## Suggested test organization

For a real app, add tests around:

- game reducers,
- layout calculations,
- asset manifest construction,
- utility functions,
- UI state transitions.

Pixi rendering integration tests are useful but heavier. Keep as much logic as possible testable without rendering.
