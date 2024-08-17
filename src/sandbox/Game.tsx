import {Application} from "../core-tags/Application.tsx";
import {Scene1} from "./Scene1.tsx";
import {Controller, createController} from "./createController.ts";
import {createContext, createEffect, createMemo, createSignal, useContext} from "solid-js";
import {invariant} from "../utility-types.ts";

type GameState = {
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

    return (
        <Application background={'#ecdddd'} width={500} height={500}>
            <GameContext.Provider value={gameState}>
                {sceneToggle() ? <Scene1/> : <text>Scene 2</text> }
            </GameContext.Provider>
        </Application>
    )
}