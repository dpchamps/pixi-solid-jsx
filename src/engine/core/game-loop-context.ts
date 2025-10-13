import {
  Accessor,
  createContext,
  useContext,
} from "solid-custom-renderer/index.ts";
import { invariantUseContext } from "../../utility-types.ts";
import {Ticker} from "pixi.js";

export type GameLoopContext = {
  frameCount: Accessor<number>;
  onNextTick: Set<(ticker: Ticker) => void>;
};

export const GameLoopContext = createContext<GameLoopContext>();

export const useGameLoopContext = () => {
  const gameLoopContext = useContext(GameLoopContext);
  invariantUseContext(gameLoopContext, "GameLoopContext");
  return gameLoopContext;
};
