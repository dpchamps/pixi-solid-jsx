import {JSX} from "jsx-runtime/jsx-runtime.ts";
import {
    Accessor,
    createComputed,
    createContext,
    createEffect,
    createSignal,
    onCleanup,
    onMount,
    useContext
} from 'solid-js';
import {BuildableApplicationNode} from "jsx-runtime/jsx-node.ts";
import {Ticker, Application as PixiApplication} from "pixi.js";
import {invariant} from "../utility-types.ts";
import {Suspense, createResource} from "solid-js";

export type ApplicationState = {
    time: {
        deltaTime: Accessor<number>,
        fps: Accessor<number>
    },
    onNextTick: Set<() => void>,
    application: PixiApplication
};

const ApplicationContext = createContext<ApplicationState>();

export const useApplicationState = () => {
    const applicationState = useContext(ApplicationContext);
    invariant(applicationState, "app state undefined");
    return applicationState;
}

export type OnNextFrameQuery<QueryResult> = {
    query: (applicationState: ApplicationState) => QueryResult,
    tick: (queryResult: QueryResult) => void
}

export function onNextFrame<QueryResult>(args: OnNextFrameQuery<QueryResult>): void;
export function onNextFrame<QueryResult>(args: OnNextFrameQuery<QueryResult>) {
    const appState = useApplicationState();

    createComputed(() => {
        const queryResult = args.query(appState);
        const execution = () => {
            args.tick(queryResult);
            appState.onNextTick.delete(execution)
        }
        appState.onNextTick.add(execution);
        onCleanup(() => {
            appState.onNextTick.delete(execution)
        });
    });
}

export const Application = (props: JSX.IntrinsicElements['application']) => {
    const [application, setApplication] = createSignal<BuildableApplicationNode|null>(null);
    const [mount, setOnMount] = createSignal(false);
    const [deltaTime, setDeltaTime] = createSignal(1);
    const [fps, setFps] = createSignal(0);
    const applicationState: ApplicationState = {
        time: {
            deltaTime,
            fps
        },
        onNextTick: new Set<() => void>(),
    } as ApplicationState

    const [applicationReady] = createResource(mount, async () => {
        const app = application();
        invariant(app);
        await app.initialize();
        app.container.ticker.maxFPS = 60;
        app.container.ticker.start();
        const tickerFn = (ticker: Ticker) => {
            setDeltaTime(ticker.deltaTime);
            setFps(ticker.FPS);
            applicationState.onNextTick.forEach(Reflect.apply);
        }
        app.container.ticker.add(tickerFn);
        applicationState.application = app.container;
        onCleanup(() => app.container.ticker.remove(tickerFn));
        return true;
    });

    onMount(() => {
        setOnMount(true)
    });

    return (
        <application {...props} ref={setApplication}>
            {/*@ts-ignore */}
            <ApplicationContext.Provider value={applicationState}>
                <Suspense fallback={<text>Loading...</text>}>
                    {applicationReady() ? props.children : []}
                </Suspense>
            </ApplicationContext.Provider>
        </application>
    )
}