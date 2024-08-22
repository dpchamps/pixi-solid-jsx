import {renderRoot} from "../src/pixi-jsx";
import {Main} from "./Main.tsx";
const main = async () => {
    console.log("it works!")
    // renderRoot(Game, document.body)
    renderRoot(Main, document.body)
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});