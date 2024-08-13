import {JSX} from "jsx-runtime/jsx-runtime.ts";
import { createEffect, createSignal } from 'solid-js';
import {BuildableApplicationNode} from "jsx-runtime/jsx-node.ts";

export const Application = (props: JSX.IntrinsicElements['application']) => {
    const [application, setApplication] = createSignal<BuildableApplicationNode|null>(null);

    createEffect(async () => {
        const appValue = application();
        if(appValue){
            await appValue.initialize();
        }
    }, [application]);

    return (
        <application {...props} ref={setApplication}>
            {props.children}
        </application>
    )
}