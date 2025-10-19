import { createController } from "../example-1/createController.ts";
import {
  createEffect,
  createSignal,
  For,
} from "solid-custom-renderer/patched-types.ts";
import { Menu } from "./menu.tsx";
import { FlexBox } from "../../src/engine/tags/FlexBox/FlexBox.tsx";
import { createMouse } from "../../src/engine/effects/createMouse.ts";
import { Box } from "./BackgroundContainer.tsx";
import { createControllerDirection } from "../example-1/createControllerDirection.ts";
import { clamp } from "../../src/utility-numbers.ts";
import { createWindowDimensions } from "../../src/engine/effects/createWindow.ts";
import { onNextFrame } from "../../src/engine/tags/Application.tsx";

export const Stage = () => {
  const [containerList, setContainerList] = createSignal<string[]>([]);
  const mouse = createMouse(document);
  const keyboard = createController();
  const direction = createControllerDirection(keyboard);
  const [containerX, setContainerX] = createSignal(100);
  const [containerY, setContainerY] = createSignal(100);
  createEffect(() => {
    if (mouse.click() === "Main") {
      setContainerList((prev) => [...prev, `Next: ${Math.random()}`]);
    }
  });

  const onScroll = () => {
    const dy = clamp(-1, 1, mouse.wheel()?.deltaY || 0);
    const dx = clamp(-1, 1, mouse.wheel()?.deltaX || 0);

    return { x: dx * 10, y: dy * 10 };
  };

  createEffect(() => {
    const dX = direction.x();
    const dY = direction.y();
    setContainerX((v) => v + dX * 10);
    setContainerY((v) => v + dY * 10);
  });

  return (
    <>
      {/*<Box*/}
      {/*    type={'fixed'}*/}
      {/*    x={containerX()}*/}
      {/*    y={containerY()}*/}
      {/*    backgroundColor={"red"}*/}
      {/*    borderColor={"black"}*/}
      {/*    padding={10}*/}
      {/*    onScroll={onScroll}*/}
      {/*    width={300}*/}
      {/*    height={200}*/}
      {/*    margin={15}*/}
      {/*    observe={containerList}*/}
      {/*>*/}
      {/*    <FlexBox>*/}
      {/*        <text>Hello</text>*/}
      {/*        <text>World</text>*/}
      {/*        <For each={containerList()}>*/}
      {/*            {(t) => <text zIndex={1000}>{t}</text>}*/}
      {/*        </For>*/}
      {/*    </FlexBox>*/}
      {/*</Box>*/}
      <Box
        type={"dynamic"}
        x={100}
        y={100}
        backgroundColor={"red"}
        borderColor={"0xFFFFFF00"}
      >
        <text>This is the game</text>
      </Box>
    </>
  );
};

export const Game = () => {
  const controller = createController();
  const menuToggleButton = controller.onKeyPress("Escape");
  const [showMenu, setShowMenu] = createSignal(false);
  // const windowDimensions = createWindowDimensions(window);
  //
  // onNextFrame({
  //     query: (applicationState) => {
  //         return {application: applicationState.application, windowDimensions: windowDimensions()}
  //     },
  //     tick: ({application, windowDimensions}) => {
  //         application.renderer.resize(windowDimensions.innerWidth, windowDimensions.outerWidth)
  //     }
  // })

  createEffect(() => {
    if (menuToggleButton().includes("Escape")) {
      setShowMenu((x) => !x);
    }
  });
  return (
    <>
      {showMenu() ? <Menu visible={true} /> : <></>}
      <Stage />
    </>
  );
};
