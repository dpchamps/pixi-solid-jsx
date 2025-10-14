import {TextIntrinsicProps} from "jsx-runtime/jsx-node.ts";
import {createSignal} from "solid-custom-renderer/patched-types.ts";
import {onEveryFrame} from "../../src/engine/core/query-fns.ts";

export const FpsCounter = (props?: TextIntrinsicProps) => {
    const [fps, setFps] = createSignal(0);

    onEveryFrame((ticker) => {
        setFps(ticker.FPS)
    })
    return (
        <text {...props}>FPS: {Math.round(fps())}</text>
    )
}