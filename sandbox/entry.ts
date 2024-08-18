import {TestComponent, M} from "./various-test-components/test.tsx";
import {render} from "solid-custom-renderer/index.ts";
import {RuntimeHTMLElementNode} from "jsx-runtime/jsx-node.ts";
import {ClickSpriteExample} from "./various-test-components/example1.tsx";
import {Game} from "./example-1/Game.tsx";
import {renderRoot} from "../src";

const main = async () => {
    console.log("it works!")
    renderRoot(Game, document.body)
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});