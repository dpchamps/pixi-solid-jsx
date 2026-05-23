# Layout and UI

Sylph.jsx UI is Pixi UI, not DOM UI. Treat layout as part of your scene graph and make dimensions reactive.

## Responsive canvas

For apps that fill the window, pass dimensions and `resizeTo` to `<Application>`.

```tsx
<Application
  width={layout.canvasSize.width}
  height={layout.canvasSize.height}
  resizeTo={window}
  resolution={window.devicePixelRatio}
  autoDensity
>
  <Game />
</Application>
```

Use a layout helper that reads window dimensions through Sylph's reactive window utilities.

```ts
import { createMemo, createWindowDimensions } from "sylph-jsx";

export const createLayout = () => {
  const windowSize = createWindowDimensions(window);

  const canvasSize = createMemo(() => ({
    width: windowSize().innerWidth,
    height: windowSize().innerHeight,
  }));

  return {
    get canvasSize() {
      return canvasSize();
    },
    centerX: (width: number) => (canvasSize().width - width) / 2,
    centerY: (height: number) => (canvasSize().height - height) / 2,
  };
};
```

## Layout helpers

Keep pure layout math separate from reactive hooks. This makes it easier to test and reuse.

```ts
export const calculateCenterX = (canvasWidth: number, elementWidth: number) =>
  (canvasWidth - elementWidth) / 2;

export const calculateFontSizes = (width: number, height: number) => {
  const scale = Math.min(1, width / 800, height / 700);

  return {
    SM: Math.round(20 * scale),
    MD: Math.round(24 * scale),
    LG: Math.round(32 * scale),
  };
};
```

Then wrap with reactive `createLayout()` for components.

## Containers as layout primitives

Use `<container>` for grouping, transforms, local coordinate systems, and local sorting.

```tsx
<container x={layout.centerX(panelWidth)} y={40} sortableChildren>
  <graphics zIndex={0} />
  <text zIndex={1}>Settings</text>
</container>
```

Use `zIndex` only among siblings under a container with `sortableChildren` enabled.

## Hit areas and input

For interactive containers, define an explicit hit area.

```tsx
import { Rectangle } from "pixi.js";

<container
  eventMode="static"
  cursor="pointer"
  hitArea={new Rectangle(0, 0, width, height)}
  onpointertap={(event) => {
    event.stopPropagation();
    props.onClick();
  }}
>
  {props.children}
</container>
```

For full-screen click catchers:

```tsx
<container
  eventMode="static"
  hitArea={new Rectangle(0, 0, layout.canvasSize.width, layout.canvasSize.height)}
  onpointertap={() => closeMenus()}
/>
```

## Buttons

A typical Pixi button is a container with:

- `eventMode="dynamic"` or `"static"`,
- `cursor="pointer"`,
- `hitArea`,
- a graphics background,
- a text label,
- optional sound effect.

Draw the background with a graphics ref and a reactive effect.

```tsx
const Button = (props: ButtonProps) => {
  const [gfx, setGfx] = createSignal<Ref<GraphicsIntrinsicProps>>();

  createEffect(() => {
    const node = gfx();
    if (!node) return;
    const g = node.container;
    g.clear();
    g.roundRect(0, 0, props.width, props.height, 6);
    g.fill(props.disabled ? 0x333333 : 0x0f3460);
  });

  return (
    <container
      x={props.x}
      y={props.y}
      eventMode="dynamic"
      cursor={props.disabled ? "not-allowed" : "pointer"}
      hitArea={new Rectangle(0, 0, props.width, props.height)}
      onpointertap={(event) => {
        event.stopPropagation();
        if (!props.disabled) props.onClick();
      }}
    >
      <graphics ref={setGfx} />
      <text anchor={0.5} x={props.width / 2} y={props.height / 2}>
        {props.label}
      </text>
    </container>
  );
};
```

## Text wrappers

Create a local `Text` component to centralize default styles.

```tsx
import type { TextIntrinsicProps } from "sylph-jsx";

export const Text = (props: TextIntrinsicProps) => (
  <text
    {...props}
    style={{
      fill: 0xffffff,
      fontFamily: "system-ui, sans-serif",
      fontWeight: "bold",
      ...props.style,
    }}
  >
    {props.children}
  </text>
);
```

If you merge style reactively, avoid unnecessary effects unless the style object must be memoized or mutated.

## Dialogs and modals

Dialogs usually belong in a top-level UI render layer.

```tsx
<render-layer zIndex={2000} sortableChildren>
  <Show when={dialogOpen()}>
    <Dialog />
  </Show>
</render-layer>
```

A dialog should include:

- full-screen overlay hit area,
- dialog container centered in layout,
- graphics background/frame,
- close button,
- explicit z-index ordering if needed.

## Pixi UI widgets

For `@pixi/ui` widgets, create the widget imperatively and expose it through `PixiExternalContainer`.

```tsx
const [slider, setSlider] = createSignal<PixiSlider>();

createEffect(() => {
  const instance = new PixiSlider(options);
  instance.onUpdate.connect(props.onChange);
  setSlider(instance);

  onCleanup(() => instance.onUpdate.disconnectAll());
});

return <PixiExternalContainer container={slider()} />;
```

Keep widget creation effects keyed to the props that actually require reconstruction. For ordinary value changes, prefer updating the existing instance if the widget API supports it.

## Avoid DOM assumptions

Do not use CSS layout for Pixi nodes. CSS only affects the page, canvas, and optional HTML overlays. Pixi layout must be expressed through Pixi positions, sizes, anchors, scales, and containers.
