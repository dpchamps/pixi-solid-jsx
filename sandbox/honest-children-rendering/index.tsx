import {PixiNodeProps} from "jsx-runtime/jsx-node.ts";
import {children} from "solid-custom-renderer/patched-types.ts";
import {Application} from "../../src/engine/tags/Application.tsx";
import {createCoroutine, stop, waitFrames, waitMs} from "../../src/engine/effects/coroutines.ts";

export const RendersWithChildren = (props: PixiNodeProps) => {
    const res = children(() => props.children);

    createCoroutine(function*(){
        let x = 0;
        while(true){
            console.log(++x);
            if(x === 4){
                console.log("Stopped coroutine")
                return
            }
            console.log("waiting 500ms")
            yield waitMs(500);
            console.log("waiting 50 frames");
            yield waitFrames(50);
        }
    });

    console.log(res, props.children);

    debugger

    return (
        <>
            {props.children}
        </>
    )
}


export const Parent = () => {
    return (
        <Application backgroundColor={"white"}>
            <RendersWithChildren>
                <container>
                    <text>Hello!</text>
                    {() => <text y={50}>Hello</text>}
                </container>
            </RendersWithChildren>
        </Application>
    )
}