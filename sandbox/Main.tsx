import {Application} from "../src/engine/tags/Application.tsx";
import {BasicExample} from "./readme-examples/BasicExample.tsx";
import {createWindowDimensions} from "../src";
import {ClickSpriteExample} from "./readme-examples/ClickSpriteExample.tsx";
import {BasicCoroutineExample} from "./readme-examples/BasicCoroutineExample.tsx";

export const Main = () => {
    const windowDimensions = createWindowDimensions(window)

    return (
        <Application
            backgroundColor={"pink"}
            width={windowDimensions().outerWidth}
            height={windowDimensions().outerHeight}
            antialias={true}
        >
            {/*<BasicTest/>*/}
            <BasicCoroutineExample/>
        </Application>
    )
}
