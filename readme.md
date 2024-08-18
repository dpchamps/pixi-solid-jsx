# Pixi JSX

A SolidJS Universal Renderer, Targeting Canvas with PixiJs Nodes.

Declarative, fine-grained reactivity with PixiJs.

## Intrinsics


### `<application/>`

Renders To PixiJs Application. 
Takes PixiJs `ApplicationOptions` as props. Needs to be initialized. [See `Application` element](src/engine/tags/Application.tsx)

### `<container/>`

Renders To PixiJs Container. Takes PixiJs `ContainerOptions` as props

```tsx
<container x={100} y={100}>
</container>
```


### `<text/>`

Renders To PixiJs Text. Takes PixiJs `TextOptions` as props.

```tsx
<text eventMode={'static'} style={{fontSize: fontSize()}} onclick={onClick}>
    I'm The Coolest Text Node You've Ever Seen
</text>
```

### `<sprite/>`

Renders To PixiJs Sprite. Takes PixiJs `SpriteOptions` as props.

```tsx
<sprite x={50} y={100} width={100} height={500} texture={createTexture("something.png")}/>
```
## Examples

```tsx
export const ClickSpriteExample = () => {
    const texture = createTexture("fire.png");
    const [scale, setScale] = createSignal(0.4);
    const [spriteRef, setSpriteRef] = createSignal<BuildableSpriteNode>();
    const onClick = () => setScale(scale() + 0.1);
  
    return (
        <Application background={'#ecdddd'} width={500} height={500}>
            <container>
                <sprite eventMode={'static'} texture={texture()} onclick={onClick} scale={scale()}/>
            </container>
         </Application>
    )
}
```

Refs work as expected:


```tsx
export const ClickSpriteExample = () => {
    const texture = createTexture("fire.png");
    const [scale, setScale] = createSignal(0.4);
    const [spriteRef, setSpriteRef] = createSignal<BuildableSpriteNode>();
    const onClick = () => setScale(scale() + 0.1);
    createEffect(() => {
        const sprite = spriteRef();
        console.log(scale(), sprite?.container.width)
    })
    return (
        <Application background={'#ecdddd'} width={500} height={500}>
            <container>
                <sprite eventMode={'static'} texture={texture()} onclick={onClick} scale={scale()} ref={setSpriteRef}/>
            </container>
        </Application>
    )
}
```

etc etc etc