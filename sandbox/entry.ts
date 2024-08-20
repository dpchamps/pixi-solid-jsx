import {Game} from "./example-1/Game.tsx";
import {renderRoot} from "../src/pixi-jsx";
import {Parent} from "./honest-children-rendering";

const main = async () => {
    console.log("it works!")
    // renderRoot(Game, document.body)
    renderRoot(Parent, document.body)
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});