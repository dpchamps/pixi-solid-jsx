import { JSX } from "../../pixi-jsx/jsx/jsx-runtime.ts";
import {
  createContext,
  createSignal,
  onMount,
  useContext,
  createResource,
  Show,
} from "solid-custom-renderer/index.ts";
import { Application as PixiApplication, Ticker } from "pixi.js";
import { invariant, Maybe } from "../../utility-types.ts";
import { ApplicationNode } from "../../pixi-jsx/proxy-dom";
import { createTimer } from "../core/time.ts";
import { GameLoopContextProvider } from "./GameLoopContextProvider.tsx";
import { initDevtools } from "@pixi/devtools";
export type ApplicationState = {
  application: PixiApplication;
};

const ApplicationContext = createContext<ApplicationState>();

export const useApplicationState = () => {
  const applicationState = useContext(ApplicationContext);
  invariant(applicationState, "app state undefined");
  return applicationState;
};

/**
 * @deprecated Use {@link createSynchronizedEffect} from "engine/core/query-fns" instead.
 */
export type OnNextFrameQuery<QueryResult> = {
  query: (applicationState: ApplicationState) => QueryResult;
  tick: (queryResult: QueryResult) => void;
};

/**
 * @deprecated Use {@link createSynchronizedEffect} from "engine/core/query-fns" instead.
 */
export function onNextFrame<QueryResult>(_args: OnNextFrameQuery<QueryResult>) {
  throw new Error("On Next Frame is deprecated");
}

export const Application = (props: JSX.IntrinsicElements["application"]) => {
  const [application, setApplication] = createSignal<ApplicationNode>();
  const [mount, setOnMount] = createSignal(false);
  const scheduledEffects = new Map<string, (ticker: Ticker) => void>();
  const timer = createTimer({
    nextFrameFns: scheduledEffects,
    createTicker: props.createTicker,
  });
  const applicationState = {
    application: null as Maybe<ApplicationState["application"]>,
  };

  const [applicationReady] = createResource(mount, async () => {
    const app = application();
    invariant(app);
    await initDevtools({ app: app.container });
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

  onMount(() => {
    setOnMount(true);
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
