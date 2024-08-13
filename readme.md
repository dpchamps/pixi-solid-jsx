# Pixi JSX

A SolidJS Universal Renderer, Targeting Canvas with PixiJs Nodes.

Declarative, fine-grained reactivity with PixiJs.

## Examples

```typescript
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


```typescript
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