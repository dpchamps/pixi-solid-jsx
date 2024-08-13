import {TestComponent} from "./test.tsx";
import {render} from "solid-custom-renderer/index.ts";
import {RuntimeHTMLElementNode} from "jsx-runtime/jsx-node.ts";
import {ClickSpriteExample} from "./example1.tsx";

const main = async () => {
    console.log("it works!")
    render(ClickSpriteExample, RuntimeHTMLElementNode(document.body))
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});