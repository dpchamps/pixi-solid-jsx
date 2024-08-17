import {useApplicationState} from "../core-tags/Application.tsx";
import {TextIntrinsicProps} from "jsx-runtime/intrinsic-nodes.ts";

export const FpsCounter = (props?: TextIntrinsicProps) => {
    const applicationState = useApplicationState();
    return (
        <text {...props}>FPS: {Math.floor(applicationState.time.fps())}</text>
    )
}