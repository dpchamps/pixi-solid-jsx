import {JSX} from "../../pixi-jsx/jsx/jsx-runtime.ts";
import {
    Accessor, batch,
    createComputed,
    createContext,
    createSignal,
    onCleanup,
    onMount,
    useContext,
    createResource
} from 'solid-custom-renderer/index.ts';
import {Ticker, Application as PixiApplication} from "pixi.js";
import {invariant} from "../../utility-types.ts";
import {ApplicationNode} from "../../pixi-jsx/proxy-dom";

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
    const [application, setApplication] = createSignal<ApplicationNode>();
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
            batch(() => {
                setDeltaTime(ticker.deltaTime);
                setFps(ticker.FPS);
                applicationState.onNextTick.forEach(Reflect.apply);
            });
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
            <container>
                <ApplicationContext.Provider value={applicationState}>
                    {applicationReady() ? props.children : []}
                </ApplicationContext.Provider>
            </container>
        </application>
    )
}