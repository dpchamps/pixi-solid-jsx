import {Accessor, createSignal, onCleanup, runWithOwner} from "solid-js";
import {JSX} from "../../../pixi-jsx/jsx/jsx-runtime.ts";
import {createEasingCoroutine, startCoroutine} from "../../effects/coroutines.ts";
import {getOwner} from "solid-custom-renderer/patched-types.ts";
import {createSynchronizedEffect} from "../../core/query-fns.ts";
import {isDefined} from "../../../utility-types.ts";
import {createTimeout} from "../../effects/createTimers.ts";

type CoroutineContainerProps<T extends JSX.Element> = {
    duration: number,
    easingFn: (n: number) => number,
    from: number,
    to: number,
    delay?: number,
    shouldStart?: boolean
    replay?: boolean
    children: (value: Accessor<number>, done: Accessor<boolean>) => T;
}

export const CoroutineContainer = <T extends JSX.Element>(props: CoroutineContainerProps<T>) => {
    const [coroutine, setCoroutine] = createSignal<ReturnType<typeof startCoroutine>>();
    const [getNext, setNext] = createSignal(props.from);
    const owner = getOwner();


    createSynchronizedEffect(() => ({shouldStart: props.shouldStart, shouldReplay: props.replay, stopped: coroutine()?.stopped()}), ({shouldStart, shouldReplay, stopped}) => {
        const currentCoroutine = coroutine();
        if(currentCoroutine && !(stopped && shouldReplay)) return;
        const ready = isDefined(shouldStart) ? shouldStart : true;

        if(ready){
            createTimeout(() => {
                runWithOwner(owner, () => {
                    const coroutineFn = createEasingCoroutine(
                        (fn) => setNext(fn(props.from, props.to)),
                        props.easingFn,
                        props.duration
                    );
                    setCoroutine(startCoroutine(coroutineFn));
                });
            }, props.delay ?? 0);
        }
    });

    onCleanup(() => {
        coroutine()?.dispose();
    });

    return () => props.children(getNext, coroutine()?.stopped || (() => false))
}