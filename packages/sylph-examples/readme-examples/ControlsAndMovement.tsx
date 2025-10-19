import { createSignal, Show } from "solid-custom-renderer/index.ts";
import {
  createAsset,
  createWindowDimensions,
  euclideanDistance,
} from "sylph-jsx";
import { Texture } from "pixi.js";
import {
  createSynchronizedEffect,
  onEveryFrame,
} from "sylph-jsx/src/engine/core/query-fns.ts";
import { PixiNodeProps } from "jsx-runtime/jsx-node.ts";
import { createControllerDirection } from "../example-1/createControllerDirection.ts";
import { createController } from "../example-1/createController.ts";
import { Accessor } from "solid-js";

const createWASDController = () => {
  const controller = createController();
  return createControllerDirection(controller);
};

const ExampleSprite = (props: PixiNodeProps<{ x: number; y: number }>) => {
  const texture = createAsset<Texture>("fire.png");

  return (
    <sprite
      texture={texture()}
      scale={1}
      x={props.x}
      y={props.y}
      tint={"white"}
      pivot={{ x: 0.5, y: 0.5 }}
    />
  );
};

const PLAYER_SPEED = 5;
const DESTINATION = { x: 500, y: 500 };

export const ControlsAndMovement = () => {
  const wasdController = createWASDController();
  const [playerPosition, setPlayerPosition] = createSignal({ x: 0, y: 0 });
  const winCondition = () =>
    euclideanDistance(playerPosition(), DESTINATION) < 20;

  createSynchronizedEffect(wasdController, ({ x, y }, time) => {
    setPlayerPosition((last) => ({
      x: last.x + x * PLAYER_SPEED * time.deltaTime,
      y: last.y + y * PLAYER_SPEED * time.deltaTime,
    }));
  });

  return (
    <Show when={!winCondition()} fallback={<text>You Won!</text>}>
      <ExampleSprite x={playerPosition().x} y={playerPosition().y} />
      <ExampleSprite x={DESTINATION.x} y={DESTINATION.y} />
    </Show>
  );
};
