# Assets, Audio, and Loading

Sylph.jsx apps are Pixi apps. Load textures, fonts, and sounds intentionally, and keep loading concerns close to the root application.

## Simple texture loading

For simple scenes, use `createAsset<T>()` inside components.

```tsx
import { createAsset } from "sylph-jsx";
import { Texture } from "pixi.js";

const Logo = () => {
  const texture = createAsset<Texture>("sylph-logo.png");

  return <sprite texture={texture()} anchor={0.5} />;
};
```

`createAsset` returns an accessor. The value is initially undefined until Pixi loads the asset.

Guard when constructing imperative Pixi objects from assets:

```ts
createSynchronizedEffect(texture, (tex) => {
  if (!tex) return;
  // Safe to create Pixi object using tex.
});
```

## Preloading at app startup

For real games, prefer a preload function passed through `appInitialize`. This keeps gameplay screens from lazily popping in critical textures and sounds.

```tsx
import { Application, createSignal } from "sylph-jsx";
import { Assets } from "pixi.js";

const MANIFEST = [
  "images/player.webp",
  "images/card-border.webp",
  { alias: "click", src: "sounds/click.wav" },
];

const createPreloadAssets = (setProgress: (progress: number) => void) => () =>
  Assets.load(MANIFEST, setProgress);

export const AppRoot = () => {
  const [progress, setProgress] = createSignal(0);
  const preloadAssets = createPreloadAssets(setProgress);

  return (
    <Application
      appInitialize={async () => {
        await preloadAssets();
      }}
      loadingState={() => <LoadingState progress={progress()} />}
    >
      <Game />
    </Application>
  );
};
```

## Loading state

`loadingState` can be a JSX node or a function returning JSX. Use it for a lightweight loading screen.

```tsx
<Application loadingState={() => <text>Loading...</text>}>
  <Game />
</Application>
```

For large apps, keep loading UI independent from assets that are still loading.

## Asset paths

In Vite apps, files under `public/` are served from the site root.

```ts
createAsset<Texture>("sylph-logo.png");
createAsset<Texture>("optimized/cards/card-border.webp");
```

If the app is packaged with `base: "./"`, verify built asset URLs and copied public files.

## Fonts

Pixi text may need fonts loaded before first render to avoid layout shifts. Use Pixi `Assets` and/or `getFontCss` during preload.

```ts
import { Assets, getFontCss } from "pixi.js";

const preload = () =>
  Promise.all([
    Assets.load([
      {
        src: "fonts/CinzelDecorative-Regular.ttf",
        alias: "font",
        data: { family: "Cinzel Decorative", weights: ["normal"] },
      },
    ]),
    getFontCss(["Cinzel Decorative"]),
  ]);
```

When using `<link rel="preload">` in `index.html`, match the actual font type. A `.ttf` should not be labeled as `font/woff2`.

## Audio

Sylph does not prescribe an audio system. A good pattern is an audio context around `@pixi/sound`.

Typical context capabilities:

- `play(alias)` for sound effects,
- `queueBgMusic(track)` for looped background music,
- volume signals,
- localStorage-backed settings.

```tsx
import { createContext, createSignal, useContext, invariant } from "sylph-jsx";
import { sound } from "@pixi/sound";

type AudioContextValue = {
  play: (alias: string) => void;
  volume: () => number;
  setVolume: (volume: number) => void;
};

const AudioContext = createContext<AudioContextValue>();

export const useAudio = () => {
  const value = useContext(AudioContext);
  invariant(value);
  return value;
};

export const AudioProvider = (props: { children?: unknown }) => {
  const [volume, setVolume] = createSignal(0.5);

  return (
    <AudioContext.Provider
      value={{
        play: (alias) => sound.play(alias, { volume: volume() }),
        volume,
        setVolume,
      }}
    >
      {props.children}
    </AudioContext.Provider>
  );
};
```

Preload sounds with aliases:

```ts
Assets.load([
  { alias: "button-click", src: "optimized/sounds/card-slap.wav" },
]);
```

Then play by alias:

```ts
sound.play("button-click");
```

## Prevent browser scroll on game canvas

Games commonly need wheel/pointer gestures without the page scrolling.

```ts
const preventBrowserScroll = (app: PixiApplication) => {
  app.canvas.addEventListener("wheel", (event) => event.preventDefault(), {
    passive: false,
  });
};
```

Attach this in `appInitialize`. If you add listeners, clean them up if the application can unmount/remount.

## Production asset advice

- Use compressed images such as WebP where practical.
- Keep source art separate from optimized runtime assets.
- Preload all gameplay-critical assets.
- Avoid creating textures every frame.
- Destroy generated textures when they are no longer needed and are not managed by `Assets`.
- For itch/static bundles, ensure Vite `base` and copied public directories match deployment needs.
