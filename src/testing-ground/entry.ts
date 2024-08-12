import {TestComponent} from "./test.tsx";
import {renderRoot} from "../runtime/pixis-jsx-runtime.ts";

const main = async () => {
    console.log(TestComponent);
    console.log("it works!")
    await renderRoot(TestComponent, document.body);
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});