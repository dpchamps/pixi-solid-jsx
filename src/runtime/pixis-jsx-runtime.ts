import {RuntimeNode} from "jsx-runtime/jsx-core-runtime.ts";
import {assertTruthy} from "../utility-types.ts";
import {Application, Container} from "pixi.js";


const hooks = [];

export const useState = () => {};
export const useEffect = () => {};

export const renderRoot = async <T extends Container|Application = Container>(node: () => RuntimeNode<T>, rootDOM: HTMLElement) => {
    const application = node();

    assertTruthy("init" in application, "Application Root Node");

    await application.init(application.initializationProps);

    rootDOM.appendChild(application.canvas);
}
export const render = (node: () => RuntimeNode) => {};