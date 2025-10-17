import {Application} from "../../src/engine/tags/Application.tsx";
import {Scene1} from "./Scene1.tsx";
import {Controller, createController} from "./createController.ts";
import {invariant} from "../../src/utility-types.ts";
import {Show, createContext, useContext, createEffect, createMemo} from "../../src/pixi-jsx/solidjs-universal-renderer";
import {BasicTest} from "../BasicTest.tsx";

export type GameState = {
    controller: Controller
}

const GameContext = createContext<GameState>();

export const useGameState = () => {
    const gameState = useContext(GameContext);
    invariant(gameState, "gameState not defined");

    return gameState;
}

const MainStage = () => {
    const controller = createController();
    const gameState = {
        controller
    }
    const enterKey = controller.onKeyPress("Enter");

    const sceneToggle = createMemo<boolean>((prev) => {
        if(enterKey().includes("Enter")){
            return !prev
        }
        return prev
    }, true);

    createEffect(() => {
        console.log("Game Render", gameState)
    })

    return (<GameContext.Provider value={gameState}>
            <Show when={sceneToggle()} fallback={<text>Scene 2</text>}>
                <Scene1/>
            </Show>
    </GameContext.Provider>)
}

export const Game = () => {
    return (
        <Application background={'#ecdddd'} width={window.innerWidth} height={window.innerHeight}>
            <MainStage/>
        </Application>
    )
}