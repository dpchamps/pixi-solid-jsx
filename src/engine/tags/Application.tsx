import { JSX } from "../../pixi-jsx/jsx/jsx-runtime.ts";
import {
  Accessor,
  createComputed,
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  createResource,
  Show,
  createRoot,
} from "solid-custom-renderer/index.ts";
import { Application as PixiApplication } from "pixi.js";
import { invariant, Maybe } from "../../utility-types.ts";
import { ApplicationNode } from "../../pixi-jsx/proxy-dom";
import { createTimer } from "../core/time.ts";
import { GameLoopContextProvider } from "./GameLoopContextProvider.tsx";

export type ApplicationState = {
  time: {
    deltaTime: Accessor<number>;
    fps: Accessor<number>;
    elapsedMsSinceLastFrame: Accessor<number>;
  };
  onNextTick: Set<() => void>;
  application: PixiApplication;
};

const ApplicationContext = createContext<ApplicationState>();

export const useApplicationState = () => {
  const applicationState = useContext(ApplicationContext);
  invariant(applicationState, "app state undefined");
  return applicationState;
};

export type OnNextFrameQuery<QueryResult> = {
  query: (applicationState: ApplicationState) => QueryResult;
  tick: (queryResult: QueryResult) => void;
};

/**
 * @deprecated Use {@link createSynchronizedEffect} from "engine/core/query-fns" instead.
 */
export function onNextFrame<QueryResult>(args: OnNextFrameQuery<QueryResult>) {
  const appState = useApplicationState();
  const [cancel, setCancel] = createSignal(false);
  let dispose = () => {};
  createRoot((__dispose) => {
    dispose = __dispose;
    createComputed(() => {
      const queryResult = args.query(appState);
      if (cancel()) return;
      const execution = () => {
        args.tick(queryResult);
        appState.onNextTick.delete(execution);
      };
      appState.onNextTick.add(execution);
      onCleanup(() => {
        appState.onNextTick.delete(execution);
      });
    });
  });

  onCleanup(() => {
    dispose();
  });

  return () => {
    dispose();
    setCancel(true);
  };
}

export const Application = (props: JSX.IntrinsicElements["application"]) => {
  const [application, setApplication] = createSignal<ApplicationNode>();
  const [mount, setOnMount] = createSignal(false);
  const nextFrameFns = new Set<() => void>();
  const timer = createTimer({
    nextFrameFns: nextFrameFns,
    createTicker: props.createTicker,
  });
  const applicationState = {
    time: timer.time,
    onNextTick: nextFrameFns,
    application: null as Maybe<ApplicationState["application"]>,
  } satisfies Omit<ApplicationState, "application"> & {
    application: Maybe<ApplicationState["application"]>;
  };

  const [applicationReady] = createResource(mount, async () => {
    const app = application();
    invariant(app);
    /**
     * @warn
     * You must assign the ticker prior to intialization.
     * Otherwise, another ticker will start and can cause (to the best of my knowledge)
     * two stage renders simultaneously.
     *
     * This will cause FPS degradation and frame drop stuttering.
     */
    app.container.ticker = timer.ticker;
    await app.initialize();
    await props.appInitialize?.(app.container);
    timer.start();
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
        <GameLoopContextProvider gameLoopContext={applicationState}>
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
