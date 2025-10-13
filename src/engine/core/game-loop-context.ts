import {Accessor, createContext, useContext} from "solid-custom-renderer/index.ts";
import {invariantUseContext} from "../../utility-types.ts";

export type GameLoopContext = {
    time: {
        deltaTime: Accessor<number>;
        fps: Accessor<number>;
        elapsedMsSinceLastFrame: Accessor<number>;
    };
    onNextTick: Set<() => void>;
};

export const GameLoopContext = createContext<GameLoopContext>();

export const useGameLoopContext = () => {
    const gameLoopContext = useContext(GameLoopContext);
    invariantUseContext(gameLoopContext, "GameLoopContext");
    return gameLoopContext;
};

