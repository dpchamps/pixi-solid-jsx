import {renderRoot} from "../src/pixi-jsx";
import {Main} from "./Main.tsx";


const main = async () => {
    const start = performance.now();
    console.log("rendering...")
    // renderRoot(Game, document.body)
    renderRoot(Main, document.body)
    console.log(`rendered ${performance.now()-start}`)
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});