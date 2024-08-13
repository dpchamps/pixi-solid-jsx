import {Assets, Texture} from "pixi.js";
import {Accessor, createSignal, createResource} from "solid-js";

export const createTexture = (url: Accessor<string> | string) => {
    const [texture] = createResource(url, async (texture) => {
        const result = await Assets.load(texture);
        return result as Texture;
    });

    return texture
}