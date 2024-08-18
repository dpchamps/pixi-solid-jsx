import {TestComponent, M} from "./test.tsx";
import {render} from "solid-custom-renderer/index.ts";
import {RuntimeHTMLElementNode} from "jsx-runtime/jsx-node.ts";
import {ClickSpriteExample} from "./example1.tsx";
import {Game} from "../sandbox/Game.tsx";
import {renderRoot} from "../index.ts";

const main = async () => {
    console.log("it works!")
    renderRoot(Game, document.body)
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});