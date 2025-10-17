import {For} from "solid-custom-renderer/patched-types.ts";
import {circularIn, createAsset, easeIn, easeInOut, easeOut, elasticIn, flip, linear} from "../src";
import {Texture} from "pixi.js";
import {CoroutineContainer} from "../src/engine/tags/extensions/CoroutineContainer.ts";

export const CoroutineContainerTest = () => {
    const texture = createAsset<Texture>("fire.png");
    const easingFns = [linear, easeIn, easeOut, easeInOut, flip, circularIn, elasticIn]

    return (
        <For each={Array(25).fill(0).map((_, i) => i*250)}>
            {(xPos, index) =>
                    <CoroutineContainer
                        from={0.1}
                        to={0.5}
                        easingFn={easingFns[index()%easingFns.length]!}
                        duration={2000}
                        replay={true}
                        delay={500}
                    >
                        {(scale) => <sprite x={(xPos % 1000)} y={Math.floor(xPos/1000)*100} eventMode={'static'} texture={texture()} scale={scale()}/>}
                    </CoroutineContainer>
            }
        </For>
    )
}