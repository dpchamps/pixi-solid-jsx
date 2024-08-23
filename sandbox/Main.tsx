import {Application} from "../src/engine/tags/Application.tsx";
import {FpsCounter} from "./example-1/FpsCounter.tsx";
import {Game} from "./ui-test/Game.tsx";

export const Main = () => {
    return (
        <Application
            width={1000}
            height={800}
            backgroundColor={"white"}
            // resolution={window.devicePixelRatio}
            // antialias={true}
        >
            <>
                <FpsCounter/>
                <Game/>
            </>
        </Application>
    )
    // return <Game />
}
