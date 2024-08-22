import {createController} from "../example-1/createController.ts";
import {createEffect, createSignal, For} from "solid-custom-renderer/patched-types.ts";
import {Menu} from "./menu.tsx";
import {FlexBox} from "../../src/engine/tags/FlexBox/FlexBox.tsx";
import {createMouse} from "../../src/engine/effects/createMouse.ts";
import {createAsset} from "../../src/engine/effects/createAsset.ts";
import {Texture} from "pixi.js";
import {BackgroundContainer} from "./BackgroundContainer.tsx";
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

    createEffect(() => {
        if(mouse.click() === "Main"){
            setContainerList((prev) => [...prev, `Next: ${Math.random()}`]);
        }
    })

    return (
        <>
            {/*<FlexBox*/}
            {/*    x={100}*/}
            {/*    y={100}*/}
            {/*    margin={50}*/}
            {/*    orientation={"vertical"}*/}
            {/*    width={100}*/}
            {/*>*/}
            {/*    <text>Blah</text>*/}
            {/*    <text>Another Blah</text>*/}
            {/*</FlexBox>*/}

            <BackgroundContainer x={100} y={100} observe={containerList} background={RedBackground} padding={50}>
                <FlexBox margin={50} orientation={'vertical'}>
                    <For each={containerList()}>
                        {(t) => <text zIndex={1000}>{t}</text>}
                    </For>
                </FlexBox>
            </BackgroundContainer>
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