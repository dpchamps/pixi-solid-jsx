import {createAsset, createWindowDimensions} from "../src";
import {createSignal, onMount} from "solid-js";
import {onEveryFrame} from "../src/engine/core/query-fns.ts";
import {Texture} from "pixi.js";
export const BasicTest = () => {
    const [rotation, setRotation] = createSignal(0);
    const [rotationRaw, setRotationRaw] = createSignal(0);
    const windowDimensions = createWindowDimensions(window);
    const texture = createAsset<Texture>('fire.png');
    let startTime = 0;

    onMount(() => {
        startTime = performance.now();
    });
    onEveryFrame((time) => {
        setRotation((last) => last-(0.05*time.deltaTime))
        // const elapsed = (performance.now() - startTime) / 1000;
        // setRotationRaw(elapsed * 2);
    });

    return (
        <container>
            <render-layer>
                <sprite
                    texture={texture()!}
                    scale={1}
                    x={windowDimensions().innerWidth/2+200}
                    y={windowDimensions().innerHeight/2}
                    tint={"white"}
                    rotation={rotation()}
                    pivot={{x: (texture!()?.width || 0)/2, y:(texture!()?.width || 0)/2}}
                />
            </render-layer>

            <sprite
                texture={texture()!}
                scale={1}
                x={windowDimensions().innerWidth/2 - 300}
                y={windowDimensions().innerHeight/2 }
                tint={"white"}
                rotation={rotationRaw()}
                pivot={{x: (texture!()?.width || 0)/2, y:(texture!()?.width || 0)/2}}
            />
        </container>
        )
}