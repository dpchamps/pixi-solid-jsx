# Render Layers

`<render-layer>` is powerful, but it is also one of the easiest Sylph.jsx footguns. Use it sparingly.

## Short rule

Reserve `<render-layer>` for top-level UI/HUD/overlay ordering. Do not use it as a normal grouping component.

For ordinary grouping, use `<container>`.

## What render layers do

`<render-layer>` creates a Pixi `RenderLayer` and acts as a transparent wrapper in the JSX tree. Its descendants are still inserted into the parent display hierarchy, but they are also attached to the render layer for separate ordering/render behavior.

That transparency is useful for overlays. It is not free, and widespread use can make ordering and mental models harder.

## Good uses

Use render layers for broad, intentional scene strata:

- HUD over game world.
- Modal dialogs over HUD.
- Debug overlay over everything.
- A top-level special effect layer.

Example:

```tsx
<container sortableChildren>
  <GameWorld zIndex={0} />

  <render-layer zIndex={1000} sortableChildren>
    <HUD />
  </render-layer>

  <render-layer zIndex={2000} sortableChildren>
    <Show when={dialogOpen()}>
      <Dialog />
    </Show>
  </render-layer>
</container>
```

## Bad uses

Do not add a render layer inside every local component:

```tsx
<For each={cards()}>
  {(card) => (
    <render-layer>
      <Card card={card} />
    </render-layer>
  )}
</For>
```

Do not use render layers just because z-index is not working. First check whether the parent container has `sortableChildren` enabled.

```tsx
<container sortableChildren>
  <sprite zIndex={1} />
  <text zIndex={2}>Above sprite</text>
</container>
```

Do not use render layers for layout or transforms. Use `<container x={...} y={...}>`.

## Preferred local ordering pattern

For a composite UI piece like a card, button, health bar, or menu, use one container with `sortableChildren` and local `zIndex` values.

```tsx
const Card = () => (
  <container sortableChildren>
    <sprite texture={background()} zIndex={0} />
    <sprite texture={art()} zIndex={10} />
    <text zIndex={20}>7</text>
    <Show when={selected()}>
      <graphics zIndex={30} />
    </Show>
  </container>
);
```

This is usually simpler and cheaper than introducing render layers.

## Top-level UI recommendation

A good Sylph app often has this shape:

```tsx
<container sortableChildren>
  <container zIndex={0} sortableChildren>
    <World />
  </container>

  <render-layer zIndex={1000} sortableChildren>
    <HUD />
  </render-layer>

  <render-layer zIndex={2000} sortableChildren>
    <Dialogs />
    <Tooltips />
  </render-layer>
</container>
```

If the app is simple, one render layer for the UI is enough.

## Decision checklist

Before adding `<render-layer>`, ask:

1. Is this top-level UI, modal, HUD, or debug overlay?
2. Do I need a separate render layer, or only local sorting?
3. Would `<container sortableChildren>` with `zIndex` solve it?
4. Will descendants unexpectedly attach to a broader layer?
5. Will this layer be created many times in a list?

If the answer to 1 is no or the answer to 3 is yes, do not use a render layer.

## Interaction with Solid control flow

Render layers work with `Show`, `For`, and `Index`, but dynamic creation/removal can be harder to reason about than normal containers.

Prefer stable top-level layers:

```tsx
<render-layer zIndex={2000} sortableChildren>
  <Show when={dialog()}>
    <Dialog dialog={dialog()} />
  </Show>
</render-layer>
```

Instead of conditionally creating the layer itself:

```tsx
<Show when={dialog()}>
  <render-layer zIndex={2000}>
    <Dialog dialog={dialog()} />
  </render-layer>
</Show>
```

Both can work, but stable top-level layers reduce churn and surprises.

## Debugging ordering

If something renders behind or in front unexpectedly:

1. Verify the relevant parent has `sortableChildren={true}`.
2. Verify `zIndex` values are on siblings under the same sorting context.
3. Remove local render layers and test with containers.
4. Keep only top-level render layers and move ordering concerns there.
5. Check whether an ancestor render layer is propagating to descendants.

## Summary

- Use `<container>` for grouping.
- Use `sortableChildren` and `zIndex` for local ordering.
- Use `<render-layer>` only for intentional top-level overlays or render strata.
- Avoid render layers in lists or reusable low-level components.
