import { GameLoopContext } from "../core/game-loop-context.ts";
import { JSX } from "jsx-runtime/jsx-runtime.ts";

type GameLoopContextProviderProps = JSX.PixieNodeProps<{
  gameLoopContext: GameLoopContext;
}>;

export const GameLoopContextProvider = (
  props: GameLoopContextProviderProps,
) => {
  return (
    <GameLoopContext.Provider value={props.gameLoopContext}>
      {props.children}
    </GameLoopContext.Provider>
  );
};
