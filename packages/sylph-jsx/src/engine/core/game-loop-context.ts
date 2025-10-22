import {
  Accessor,
  createContext,
  useContext,
} from "../../pixi-jsx/solidjs-universal-renderer/index.js";
import { invariantUseContext } from "../../utility-types.js";
import { Ticker } from "pixi.js";

/**
 * Context providing frame-synchronized game loop state and scheduling capabilities.
 *
 * **Provides:**
 * - `frameCount`: Reactive accessor tracking the current frame number since ticker started
 * - `scheduledEffects`: Internal map of effects scheduled for next frame execution
 *
 * **Usage:**
 * Access via {@link useGameLoopContext} hook from any component within an Application tree.
 * Used internally by {@link createSynchronizedEffect} for frame-synchronized reactive effects.
 */
export type GameLoopContext = {
  frameCount: Accessor<number>;
  scheduledEffects: Map<string, (ticker: Ticker) => void>;
};

debugger;
export const GameLoopContext = createContext<GameLoopContext>();
/**
 * Hook to access the game loop context from any child component.
 *
 * Provides access to frame counting and effect scheduling for frame-synchronized operations.
 * Most users should prefer {@link createSynchronizedEffect} from "engine/core/query-fns" instead
 * of using this hook directly.
 *
 * @returns {GameLoopContext} Object containing frameCount accessor and scheduledEffects map
 * @throws {Error} If called outside of a GameLoopContextProvider/Application tree
 *
 *
 */
export const useGameLoopContext = () => {
  const gameLoopContext = useContext(GameLoopContext);
  invariantUseContext(gameLoopContext, "GameLoopContext");
  return gameLoopContext;
};
