import {createController} from "../example-1/createController.ts";
import {createEffect, createSignal} from "solid-custom-renderer/patched-types.ts";
import {Menu} from "./menu.tsx";

export const Stage = () => {
    return (
        <>
            <text >This is the Game</text>
        </>
    )
}

export const Game = () => {
    const controller = createController();
    const menuToggleButton = controller.onKeyPress("Escape");
    const [showMenu, setShowMenu] = createSignal(false);
    createEffect(() => {
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