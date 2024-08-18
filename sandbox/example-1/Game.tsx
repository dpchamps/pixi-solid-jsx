import {Application} from "../../src/engine/tags/Application.tsx";
import {Scene1} from "./Scene1.tsx";
import {Controller, createController} from "./createController.ts";
import {createContext, createEffect, createMemo, useContext} from "solid-js";
import {invariant} from "../../src/utility-types.ts";
import {Show} from "solid-custom-renderer/index.ts";

export type GameState = {
    controller: Controller
}

const GameContext = createContext<GameState>();

export const useGameState = () => {
    const gameState = useContext(GameContext);
    invariant(gameState, "gameState not defined");

    return gameState;
}

export const Game = () => {
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

    return (
        <Application background={'#ecdddd'} width={window.innerWidth} height={window.innerHeight}>
            <GameContext.Provider value={gameState}>
                <container>
                    <Show when={sceneToggle()} fallback={<text>Scene 2</text>}>
                        <Scene1/>
                    </Show>
                </container>

            </GameContext.Provider>
        </Application>
    )
}