import {Application, onNextFrame, useApplicationState} from "../../src/engine/tags/Application.tsx";
import {createAsset} from "../../src/engine/effects/createAsset.ts";
import {Texture} from "pixi.js";
import {
    createComputed, createSignal,
    createStore,
    onCleanup, untrack,
} from "solid-custom-renderer/patched-types.ts";
import {circularIn, easeIn, easeInOut} from "../../src/engine/libs/Easing.ts";
import {FpsCounter} from "../example-1/FpsCounter.tsx";
import {lerp} from "../../src/engine/libs/Math.ts";
import {createMousePosition} from "./createMousePosition.ts";
import {deepTrack, trackDeep} from "@solid-primitives/deep";
import {createEasingCoroutine, startCoroutine} from "../../src/engine/effects/coroutines.ts";
import {unwrap} from "solid-js/store";
import {createMouse} from "../../src/engine/effects/createMouse.ts";
import {Point, equal} from "../../src/engine/libs/Point.ts";

const MOVE_DURATION = 1000;
const TARGET = 500;
const roundToPlace = (n: number, p: number) => Math.round(n * (p)) / (p);

const Easing = () => {
    const application = useApplicationState();
    const texture = createAsset<Texture>("fire.png");
    const [position, setPosition] = createStore({
        x: 200,
        y: 200
    });
    const [duration, setDuration] = createSignal(1000);
    const [elapsed, setElapsed] = createSignal(0);
    const mouse = createMouse(application.application.canvas);
    const [lastMouseMove, setLastMouseMove] = createSignal<Point>();

    createComputed(() => {
        if(mouse.click()){
            console.log(mouse.click())
        }
    })

    // createComputed(() => {
    //     const {deltaY} = mouse.wheel() || {};
    //     if(!deltaY) return;
    //     console.log(deltaY)
    //     const dYNormal = deltaY > 0 ? 1 : -1;
    //     setDuration((d) => d+(dYNormal*10))
    // });


    // onNextFrame({
    //     query: (appState) => {
    //         return {pos: mouse.currentMousePosition(), ms: appState.time.deltaTime(), duration: duration()}
    //     },
    //     tick: ({pos, ms, duration}) => {
    //         const percentage = duration/10000;
    //         console.log({percentage})
    //         if(!pos) return;
    //         setPosition({
    //             x: lerp(position.x, pos.x, percentage),
    //             y: lerp(position.y, pos.y, percentage)
    //         })
    //     }
    // });

    // onNextFrame({
    //     query: () => mouse.currentMousePosition(),
    //     tick: () => {
    //         console.log("setting")
    //         setElapsed((v) => v > 0 ? 0 : v)
    //     }
    // })

    return (
        <>
            <sprite texture={texture()} x={position.x} y={position.y}/>
        </>
    )
}







export const Main = () => {
    return (
        <Application
            width={window.innerWidth}
            height={window.innerHeight}
            backgroundColor={"white"}
            resolution={window.devicePixelRatio}
            antialias={true}
        >
            <>
                <FpsCounter/>
                <Easing/>
            </>
        </Application>
    )
}
