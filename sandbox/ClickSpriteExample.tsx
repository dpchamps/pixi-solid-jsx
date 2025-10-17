import {createSignal} from "solid-custom-renderer/patched-types.ts";
import {createAsset} from "../src";
import {Texture} from "pixi.js";

export const ClickSpriteExample = () => {
    const texture = createAsset<Texture>("fire.png");
    const [scale, setScale] = createSignal(0.4);
    const onClick = () => setScale(scale() + 0.1);

    return (
        <container>
            <sprite eventMode={'static'} texture={texture()} onclick={onClick} scale={scale()}/>
        </container>
    )
}