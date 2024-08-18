import {createAsset} from "../../src/core-effects/createAsset.ts";
import {Texture} from "pixi.js";
import {SpriteIntrinsicProps} from "jsx-runtime/intrinsic-nodes.ts";

export type EntityProps = {
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
    texture: string,
    scale?: number,
    zIndex?: number,
    tint?: string
    spriteProps?: Partial<SpriteIntrinsicProps>
}

export const Entity = (entityProps: EntityProps) => {
    const texture = createAsset<Texture>(entityProps.texture);

    return (
        <container zIndex={entityProps.zIndex || 1}>
            <sprite eventMode={'static'} texture={texture()} scale={entityProps.scale || 1}  x={entityProps.x} y={entityProps.y} tint={entityProps.tint || "white"} {...entityProps.spriteProps}/>
        </container>
    )
}