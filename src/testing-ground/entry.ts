import {TestComponent} from "./test.tsx";

const main = async () => {
    console.log(TestComponent);
    console.log("it works!")
    const x = TestComponent();
    debugger
}


main().catch((error) => {
    console.error(``);
    console.error(error);
    debugger
});