import {Container} from "pixi.js";

import {invariant, Maybe} from "../utility-types.ts";

export type CoreRuntime = {

}

type MaybeRuntimeNode<T extends Container = Container> = T & {runtime?: Maybe<CoreRuntime>};
export type RuntimeNode<T extends Container = Container> = T & {runtime: CoreRuntime};

function assertRuntimeNode<T extends Container>(input: MaybeRuntimeNode<T>): asserts input is RuntimeNode<T> {
    invariant(input.runtime);
}

export const withRuntime = <T extends Container>(containerLike: MaybeRuntimeNode<T>): RuntimeNode<T> => {
    containerLike.runtime = {};
    assertRuntimeNode(containerLike);

    return containerLike;
}

