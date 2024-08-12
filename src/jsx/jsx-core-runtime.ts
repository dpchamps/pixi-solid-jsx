import {Application, ApplicationOptions, Container} from "pixi.js";

import {invariant} from "../utility-types.ts";

export type JsxCoreRuntime = {

}

type RuntimeData  = {runtime: JsxCoreRuntime, initializationProps: Partial<ApplicationOptions>}

type MaybeRuntimeNode<T extends Container|Application> = T & Partial<RuntimeData>;
export type RuntimeNode<T extends Container|Application = Container|Application> = {
    onRender: () => T,
    runtime: JsxCoreRuntime,
    initializationProps: Partial<ApplicationOptions>
}
function assertRuntimeNode<T extends Container|Application>(input: MaybeRuntimeNode<T>): asserts input is RuntimeNode<T> {
    invariant(input.runtime);
}

export const withRuntime = <T extends Container|Application>(onRender: () => T, applicationOptions: Partial<ApplicationOptions> = {}): RuntimeNode => {


    return {
        onRender,
        runtime: {},
        initializationProps: applicationOptions
    }
}

