import {For} from "solid-custom-renderer/patched-types.ts";
import {circularIn, createAsset, easeIn, easeInOut, easeOut, elasticIn, flip, linear} from "../src";
import {Texture} from "pixi.js";
import {CoroutineContainer} from "../src/engine/tags/extensions/CoroutineContainer.ts";

export const CoroutineContainerTest = () => {
    const texture = createAsset<Texture>("fire.png");
    const easingFns = [linear, easeIn, easeOut, easeInOut, flip, circularIn, elasticIn]

    return (
        <For each={[0, 250, 500, 750, 1000, 1250, 1500]}>
            {(xPos, index) =>
                    <CoroutineContainer
                        from={0.1}
                        to={0.5}
                        easingFn={easingFns[index()]!}
                        duration={1000}
                        replay={true}
                        delay={500}
                    >
                        {(scale) => <sprite x={100+(xPos % 500)*2} y={Math.floor(xPos/500)*200} eventMode={'static'} texture={texture()} scale={scale()}/>}
                    </CoroutineContainer>
            }
        </For>
    )
}