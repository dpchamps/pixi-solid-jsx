import {createController} from "../example-1/createController.ts";
import {createEffect, createSignal, For} from "solid-custom-renderer/patched-types.ts";
import {Menu} from "./menu.tsx";
import {FlexBox} from "../../src/engine/tags/FlexBox/FlexBox.tsx";
import {createMouse} from "../../src/engine/effects/createMouse.ts";
import {createAsset} from "../../src/engine/effects/createAsset.ts";
import {Texture} from "pixi.js";
import {BackgroundContainer, Box} from "./BackgroundContainer.tsx";
import {Graphics} from "./Graphics.tsx";
import {createRect} from "../../src/engine/effects/createGraphics.ts";

const RedBackground = createRect({
    x: 0,
    y: 0,
    height: 1,
    width: 1,
    fill: "red"
})
export const Stage = () => {
    const texture = createAsset<Texture>("fire.png");
    const [containerList, setContainerList] = createSignal<string[]>([]);
    const mouse = createMouse(document);

    const [margin, setMargin] = createSignal(0);
    createEffect(() => {
        if(mouse.click() === "Main"){
            setContainerList((prev) => [...prev, `Next: ${Math.random()}`]);
        }
    })

    createEffect(() => {
        const dy = mouse.wheel()?.deltaY || 0;
        setMargin((val) => val + (dy ? dy > 0 ? 1 : -1 : 0))
    })

    return (
        <>
            <Box
                x={200}
                y={100}
                backgroundColor={"red"}
                borderColor={"black"}
                observe={containerList}
                padding={margin()}
                margin={2}
            >
                <FlexBox>
                    <text>Hello</text>
                    <text>World</text>
                    <For each={containerList()}>
                        {(t) => <text zIndex={1000}>{t}</text>}
                    </For>
                </FlexBox>
            </Box>
        </>
    )
}

export const Game = () => {
    const controller = createController();
    const menuToggleButton = controller.onKeyPress("Escape");
    const [showMenu, setShowMenu] = createSignal(false);
    createEffect(() => {
        console.log("rendering game")
        if(menuToggleButton().includes("Escape")) {
            setShowMenu((x) => !x)
        }
    })
    return (
        <>
            {showMenu() ? <Menu visible={true}/> : <></>}
            <Stage/>
        </>
    )
}