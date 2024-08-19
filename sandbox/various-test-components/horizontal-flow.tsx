import {JSX} from "../../src/pixi-jsx/jsx/jsx-runtime.ts";
import {intoArray} from "../../src/utility-types.ts";
import {children, Index} from "solid-custom-renderer/index.ts";


type HorizontalFlowProps = JSX.PixieNodeProps<{
    padding: number
}>;

export const HorizontalFlow = (props: HorizontalFlowProps) => {
    let height = 0;
    const res = children(() => props.children);
    return (
        <>
           <Index each={res()}>
               {(x) => <> </>}
           </Index>
        </>
    );
}