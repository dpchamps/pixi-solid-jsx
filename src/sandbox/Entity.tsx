import {createAsset} from "../core-effects/createAsset.ts";
import {Texture} from "pixi.js";

export type EntityProps = {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    texture: string
}

export const Entity = (entityProps: EntityProps) => {
    const texture = createAsset<Texture>(entityProps.texture);

    return (
        <container>
            <sprite eventMode={'static'} texture={texture()} scale={0.2} x={entityProps.x} y={entityProps.y}/>
        </container>
    )
}