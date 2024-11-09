import {Application} from "../src/engine/tags/Application.tsx";
import {FpsCounter} from "./example-1/FpsCounter.tsx";
import {Game} from "./ui-test/Game.tsx";

export const Main = () => {
    return (
        <Application
            width={600}
            height={800}
            backgroundColor={"pink"}
            // resolution={window.devicePixelRatio}
            antialias={true}
        >
            <>
                <FpsCounter/>
                <Game/>
            </>
        </Application>
    )
    // return <Game />
}
