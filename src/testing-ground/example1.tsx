import {createTexture} from "../core-hooks/createTexture.ts";
import {createEffect, createSignal} from "solid-js";
import {Application} from "../core-tags/Application.tsx";
import {BuildableSpriteNode} from "jsx-runtime/jsx-node.ts";

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