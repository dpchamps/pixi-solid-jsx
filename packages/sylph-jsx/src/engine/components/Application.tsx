import { JSX } from "../../pixi-jsx/jsx/jsx-runtime.js";
import {
  createContext,
  createSignal,
  useContext,
  createResource,
  Show,
} from "../../pixi-jsx/solidjs-universal-renderer/index.js";
import { Application as PixiApplication, Ticker } from "pixi.js";
import { invariant, Maybe } from "../../utility-types.js";
import { ApplicationNode } from "../../pixi-jsx/proxy-dom/index.js";
import { createTimer } from "../core/time.js";
import { GameLoopContextProvider } from "./GameLoopContextProvider.jsx";
import { initDevtools } from "@pixi/devtools";
/**
 * Application state provided to all child components via ApplicationContext.
 * Contains the initialized PixiJS Application instance.
 */
export type ApplicationState = {
  application: PixiApplication;
};

const ApplicationContext = createContext<ApplicationState>();

/**
 * Hook to access the PixiJS Application instance from any child component.
 *
 * @returns {ApplicationState} Object containing the PixiJS Application instance
 * @throws {Error} If called outside of an Application component tree
 *
 * @example
 * const ChildComponent = () => {
 *   const { application } = useApplicationState();
 *   // Access PixiJS app directly
 *   console.log(application.renderer.width);
 *   return <sprite />;
 * };
 */
export const useApplicationState = () => {
  const applicationState = useContext(ApplicationContext);
  invariant(applicationState, "app state undefined");
  return applicationState;
};

/**
 * Root component that initializes a PixiJS Application and integrates it with SolidJS's reactive system.
 *
 * **Core Responsibilities:**
 * - Initializes PixiJS Application with custom ticker integration
 * - Synchronizes SolidJS reactive graph with PixiJS rendering loop
 * - Provides ApplicationContext and GameLoopContext to all child components
 * - Manages async initialization with loading states
 * - Enables PixiJS devtools integration
 *
 * **Context Providers:**
 * - `ApplicationContext`: Provides access to PixiJS Application instance via {@link useApplicationState}
 * - `GameLoopContext`: Provides frame-synchronized effects and frame counting
 *
 * **Key Props:**
 * - `createTicker`: Optional factory function to provide custom ticker (primarily for testing)
 * - `appInitialize`: Optional async callback invoked after PixiJS app initialization
 * - `loadingState`: Optional JSX to display during async initialization (defaults to "Loading..." text)
 * - All standard PixiJS Application options (width, height, background, etc.)
 *
 * **Initialization Flow:**
 * 1. Component mounts and creates ApplicationNode
 * 2. Custom ticker is assigned before initialization (critical for performance)
 * 3. PixiJS Application initializes asynchronously
 * 4. Optional `appInitialize` callback executes
 * 5. Ticker starts and children render
 *
 * @example
 * // Basic usage
 * const Game = () => (
 *   <Application width={800} height={600} background={0x1099bb}>
 *     <sprite x={100} y={100} />
 *   </Application>
 * );
 *
 * @example
 * // With initialization callback
 * const Game = () => (
 *   <Application
 *     width={800}
 *     height={600}
 *     appInitialize={async (app) => {
 *       await Assets.load('spritesheet.json');
 *       console.log('Assets loaded, app ready');
 *     }}
 *     loadingState={<text>Loading assets...</text>}
 *   >
 *     <sprite texture="loaded-texture" />
 *   </Application>
 * );
 *
 * @example
 * // With custom ticker (testing)
 * const TestGame = () => (
 *   <Application createTicker={() => new FakeTicker()}>
 *     <sprite />
 *   </Application>
 * );
 */
export const Application = (props: JSX.IntrinsicElements["application"]) => {
  const [application, setApplication] = createSignal<ApplicationNode>();
  const scheduledEffects = new Map<string, (ticker: Ticker) => void>();
  const timer = createTimer({
    nextFrameFns: scheduledEffects,
    createTicker: props.createTicker,
  });
  const applicationState = {
    application: null as Maybe<ApplicationState["application"]>,
  };

  const [applicationReady] = createResource(application, async (app) => {
    if(import.meta.env.DEV){
      await initDevtools({ app: app.container });
    }
    /**
     * @warn
     * You must assign the ticker prior to initialization.
     * Otherwise, another ticker will start and can cause (to the best of my knowledge)
     * two stage renders simultaneously.
     *
     * This will cause FPS degradation and frame drop stuttering.
     */
    app.container.ticker = timer.ticker;
    await app.initialize();
    await props.appInitialize?.(app.container);
    timer.ticker.start();
    applicationState.application = app.container;
    return true;
  });

  const fallback = props.loadingState ?? <text>Loading...</text>;

  return (
    <application {...props} ref={setApplication}>
      <container>
        <GameLoopContextProvider
          gameLoopContext={{ frameCount: timer.frameCount, scheduledEffects }}
        >
          <ApplicationContext.Provider
            value={applicationState as ApplicationState}
          >
            <Show when={applicationReady()} fallback={fallback}>
              {props.children}
            </Show>
          </ApplicationContext.Provider>
        </GameLoopContextProvider>
      </container>
    </application>
  );
};
