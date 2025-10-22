import {
  createAsset,
  createWindowDimensions,
  onEveryFrame,
  createSignal,
} from "sylph-jsx";
import { Texture } from "pixi.js";

export const BasicExample = () => {
  const [rotation, setRotation] = createSignal(0);
  const windowDimensions = createWindowDimensions(window);
  const texture = createAsset<Texture>("fire.png");

  onEveryFrame((time) => {
    setRotation((last) => last - 0.05 * time.deltaTime);
  });

  return (
    <>
      <sprite
        texture={texture()}
        scale={1}
        x={windowDimensions().innerWidth / 2 + 200}
        y={windowDimensions().innerHeight / 2}
        tint={"white"}
        rotation={rotation()}
        pivot={{ x: 0.5, y: 0.5 }}
      />

      <sprite
        texture={texture()}
        scale={1}
        x={windowDimensions().innerWidth / 2 - 300}
        y={windowDimensions().innerHeight / 2}
        tint={"white"}
        rotation={-rotation()}
        pivot={{ x: 0.5, y: 0.5 }}
      />
    </>
  );
};
