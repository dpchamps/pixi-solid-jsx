import { createAsset } from "sylph-jsx/src/engine/effects/createAsset.ts";
import { Texture } from "pixi.js";
import { SpriteIntrinsicProps } from "jsx-runtime/jsx-node.ts";

export type EntityProps = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  texture: string;
  scale?: number;
  zIndex?: number;
  tint?: string;
  spriteProps?: Partial<SpriteIntrinsicProps>;
  rotation?: number;
};

export const Entity = (entityProps: EntityProps) => {
  const texture = createAsset<Texture>(entityProps.texture);

  return (
    <container zIndex={entityProps.zIndex || 1}>
      <sprite
        texture={texture()!}
        scale={entityProps.scale || 1}
        x={entityProps.x}
        y={entityProps.y}
        tint={entityProps.tint || "white"}
        rotation={entityProps.rotation || 0}
        pivot={{ x: entityProps.width / 2, y: entityProps.height / 2 }}
        // anchor={{x: entityProps.width/2, y: entityProps.height/2}}
        {...entityProps.spriteProps}
      />
    </container>
  );
};
