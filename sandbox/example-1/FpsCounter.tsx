import {useApplicationState} from "../../src/engine/tags/Application.tsx";
import {TextIntrinsicProps} from "jsx-runtime/jsx-node.ts";

export const FpsCounter = (props?: TextIntrinsicProps) => {
    const applicationState = useApplicationState();
    return (
        <text {...props}>FPS: {Math.floor(applicationState.time.fps())}</text>
    )
}