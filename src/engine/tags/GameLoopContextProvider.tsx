import { GameLoopContext } from "../core/game-loop-context.ts";
import { JSX } from "jsx-runtime/jsx-runtime.ts";

/**
 * Props for GameLoopContextProvider component.
 */
type GameLoopContextProviderProps = JSX.PixieNodeProps<{
  gameLoopContext: GameLoopContext;
}>;

/**
 * Low-level provider component that makes game loop state available to all child components.
 *
 * **Critical Infrastructure:**
 * This is a foundational component required for Sylph to function. All frame-synchronized
 * reactive effects depend on this context being available. Without this provider,
 * {@link createSynchronizedEffect} will not work, and the entire reactive game loop system
 * will fail.
 *
 * **Context Provided:**
 * - `frameCount`: Reactive accessor for current frame number
 * - `scheduledEffects`: Internal scheduling map for frame-synchronized effects
 *
 * **Usage:**
 * This component is used internally by {@link Application} and should not be used directly.
 * The Application component automatically wraps all children with this provider, ensuring
 * that {@link createSynchronizedEffect} works throughout the component tree.
 *
 * **Access Context:**
 * Child components can access the context via {@link useGameLoopContext} or use
 * {@link createSynchronizedEffect} for frame-synchronized reactive effects (preferred).
 *
 * @example
 * // Internal usage by Application component
 * <GameLoopContextProvider
 *   gameLoopContext={{ frameCount: timer.frameCount, scheduledEffects }}
 * >
 *   <ApplicationContext.Provider value={applicationState}>
 *     {children}
 *   </ApplicationContext.Provider>
 * </GameLoopContextProvider>
 */
export const GameLoopContextProvider = (
  props: GameLoopContextProviderProps,
) => {
  return (
    <GameLoopContext.Provider value={props.gameLoopContext}>
      {props.children}
    </GameLoopContext.Provider>
  );
};
