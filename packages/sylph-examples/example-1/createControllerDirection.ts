import { Controller } from "./createController.ts";
import { createSignal } from "solid-js";
import { createSynchronizedEffect } from "sylph-jsx/src/engine/core/query-fns.ts";

export type ControllerDirection = ReturnType<typeof createControllerDirection>;
export const createControllerDirection = (controller: Controller) => {
  const [x, setDirectionX] = createSignal(0, { equals: false });
  const [y, setDirectionY] = createSignal(0, { equals: false });
  const onHoldDirectionKey = controller.onKeyHold(
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
  );

  createSynchronizedEffect(onHoldDirectionKey, (directions) => {
    setDirectionY(
      directions.includes("KeyW") ? -1 : directions.includes("KeyS") ? 1 : 0,
    );

    setDirectionX(
      directions.includes("KeyD") ? 1 : directions.includes("KeyA") ? -1 : 0,
    );
  });

  return () => ({ x: x(), y: y() });
};
