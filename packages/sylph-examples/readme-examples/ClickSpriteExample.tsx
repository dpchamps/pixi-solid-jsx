import { createSignal } from "solid-custom-renderer/patched-types.ts";
import { createAsset } from "sylph-jsx";
import { Texture } from "pixi.js";

export const ClickSpriteExample = () => {
  const texture = createAsset<Texture>("fire.png");
  const [scale, setScale] = createSignal(0.4);
  const onClick = (event: MouseEvent) => {
    setScale(scale() + 0.1 * (event.altKey ? -1 : 1));
  };

  return (
    <sprite
      x={500}
      y={500}
      pivot={{
        x: (texture()?.width || 0) / 2,
        y: (texture()?.height || 0) / 2,
      }}
      interactive={true}
      texture={texture()}
      onclick={onClick}
      scale={scale()}
    />
  );
};
