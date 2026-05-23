# Common Sylph.jsx Game Patterns

These patterns come from building real Sylph.jsx games. Use them as starting points when creating game screens, UI layers, input, cards, particles, audio, and settings.

## App shape

A typical game has this structure:

```tsx
<Application appInitialize={preload} loadingState={() => <LoadingState />}>
  <AudioProvider>
    <GameStateProvider>
      <container sortableChildren>
        <World />
        <render-layer zIndex={1000} sortableChildren>
          <HUD />
        </render-layer>
        <render-layer zIndex={2000} sortableChildren>
          <Dialogs />
        </render-layer>
      </container>
    </GameStateProvider>
  </AudioProvider>
</Application>
```

Keep render layers sparse and top-level.

## Reducer-driven game state

Use pure reducer functions for game rules.

```ts
type GameState =
  | { started: false; result?: "win" | "loss" }
  | { started: true; playerHealth: number; floor: Card[] };

type GameAction =
  | { type: "start" }
  | { type: "damage"; amount: number }
  | { type: "end"; result: "win" | "loss" };

export const getNextGameState = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case "start":
      return { started: true, playerHealth: 20, floor: [] };
    case "damage":
      return state.started
        ? { ...state, playerHealth: Math.max(0, state.playerHealth - action.amount) }
        : state;
    case "end":
      return { started: false, result: action.result };
  }
};
```

Then connect the reducer to a signal:

```ts
const [gameState, setGameState] = createSignal<GameState>({ started: false });

const performAction = (action: GameAction) => {
  setGameState((current) => getNextGameState(current, action));
};
```

## Screen switching

Use `Show`, `Switch`, and `Match` for top-level screens.

```tsx
<Show when={gameState().started} fallback={<IntroScreen start={startGame} />}>
  <GameScreen gameState={gameState() as Extract<GameState, { started: true }>} />
</Show>
```

For many screens, prefer a discriminated union and `Switch`.

## Selection pattern

For cards, tiles, inventory items, and menus, keep selected state in the parent.

```ts
const [selected, setSelected] = createSignal<number | undefined>();

const selectItem = (index: number) => {
  if (!canSelect()) return;
  setSelected(index);
};
```

```tsx
<For each={items()}>
  {(item, index) => (
    <ItemView
      item={item}
      selected={selected() === index()}
      onSelect={() => selectItem(index())}
    />
  )}
</For>
```

Clear selection on background clicks with a full-screen hit area.

```tsx
<container
  eventMode="static"
  hitArea={new Rectangle(0, 0, layout.canvasSize.width, layout.canvasSize.height)}
  onpointertap={() => setSelected(undefined)}
>
  <Items />
</container>
```

## Animated value pattern

Use a displayed signal plus coroutine for smooth UI values such as health bars, card movement, score counters, or alpha fades.

```ts
const [displayedHealth, setDisplayedHealth] = createSignal(props.health);
const [previousHealth, setPreviousHealth] = createSignal(props.health);
let animation: ReturnType<typeof startCoroutine> | undefined;

createSynchronizedEffect(
  () => props.health,
  (health) => {
    const previous = previousHealth();
    setPreviousHealth(health);
    if (health === previous) return;

    animation?.dispose();
    const start = displayedHealth();
    animation = startCoroutine(
      createEasingCoroutine(
        (lerp) => setDisplayedHealth(lerp(start, health)),
        easeOut,
        300,
      ),
    );
  },
);

onCleanup(() => animation?.dispose());
```

## Card or tile component pattern

A composite game object is usually a sorted container with background, art, labels, and optional overlay.

```tsx
const Card = (props: CardProps) => (
  <container x={props.x} y={props.y} sortableChildren zIndex={props.zIndex ?? 0}>
    <sprite texture={border()} zIndex={10} eventMode="static" onpointertap={props.onSelect} />
    <sprite texture={art()} zIndex={20} />
    <text zIndex={30} x={20} y={20}>{props.value}</text>
    <Show when={props.selected}>
      <graphics ref={setSelectionOverlay} zIndex={40} />
    </Show>
  </container>
);
```

Do not put each card in a render layer. Use local `sortableChildren` and `zIndex`.

## Modal dialog pattern

Dialogs belong in a top-level UI layer.

```tsx
<render-layer zIndex={2000} sortableChildren>
  <Show when={dialog().type !== "none"}>
    <Dialog dialog={dialog()} close={() => setDialog({ type: "none" })} />
  </Show>
</render-layer>
```

Inside the dialog:

- draw a full-screen semi-transparent overlay,
- center a panel using layout helpers,
- use an explicit hit area,
- stop propagation for panel clicks if needed.

## Audio context pattern

Use a context so components can play sounds without importing the sound library everywhere.

```ts
const AudioContext = createContext<{
  play: (alias: string) => void;
  queueMusic: (alias: string) => void;
}>();

export const useAudio = () => {
  const audio = useContext(AudioContext);
  invariant(audio);
  return audio;
};
```

Buttons can then play a default click sound before running the action.

## Persistent settings pattern

Wrap localStorage access so parsing and defaults are centralized.

```ts
export const createLocalStorage = () => ({
  get: <T,>(key: string, fallback: T): T => {
    const item = window.localStorage.getItem(key);
    return item === null ? fallback : (JSON.parse(item) as T);
  },
  upsert: <T,>(key: string, value: T) => {
    window.localStorage.setItem(key, JSON.stringify(value));
  },
});
```

Persist settings with an effect:

```ts
createEffect(() => {
  storage.upsert("settings", settings());
});
```

## Imperative particle pattern

For many particles, build an imperative Pixi container and update it every frame. Expose it through `PixiExternalContainer`.

```tsx
const container = new Container();
const particles = createParticles(container);

onEveryFrame((ticker) => {
  updateParticles(particles, ticker.deltaMS / 1000);
});

onCleanup(() => container.destroy({ children: true }));

return <PixiExternalContainer container={container} />;
```

This is a good use of imperative Pixi because per-particle JSX would be excessive.

## Top-level asset preload pattern

Preload all assets required for the first playable screen.

```ts
const createPreloadAssets = (setProgress: Setter<number>) => () =>
  Assets.load(
    [
      "optimized/background.webp",
      "optimized/cards/card-border.webp",
      { alias: "button-click", src: "optimized/sounds/click.wav" },
    ],
    setProgress,
  );
```

Pass this into `Application.appInitialize`.

## Difficulty/settings pattern

Game modes should change initial game-state construction, not scatter conditionals across UI components.

```ts
type GameMode = "Classic" | "Easy";

const createGame = (mode: GameMode): GameState => ({
  started: true,
  playerHealth: mode === "Easy" ? 30 : 20,
  floor: [],
});
```

UI should dispatch `setGameMode`; reducers and constructors should apply the actual rules.

## Checklist for new components

- Can this be expressed as JSX props? Prefer that.
- Does this need a ref? Use `Ref<IntrinsicProps>`.
- Does this need per-frame work? Use `onEveryFrame`, but only if truly continuous.
- Does this react to state on a frame? Use `createSynchronizedEffect`.
- Does this need a render layer? Only if top-level UI/overlay.
- Does this create external Pixi resources? Add cleanup.
