import {Controller} from "./createController.ts";
import {createComputed, createSignal} from "solid-js";

export type ControllerDirection = ReturnType<typeof createControllerDirection>;
export const createControllerDirection = (controller: Controller) => {
    const [x, setDirectionX] = createSignal(0, {equals: false});
    const [y, setDirectionY] = createSignal(0, {equals: false});
    const onPressDirectionKey = controller.onKeyDown("KeyW", "KeyA", "KeyS", "KeyD");
    createComputed(() => {
        const directions = onPressDirectionKey();
        setDirectionY(
            directions.includes('KeyW') ? -1 : directions.includes("KeyS") ? 1 : 0,
        );

        setDirectionX(
            directions.includes('KeyD') ? 1 : directions.includes("KeyA") ? -1 : 0
        )
    });

    return {x, y};
}