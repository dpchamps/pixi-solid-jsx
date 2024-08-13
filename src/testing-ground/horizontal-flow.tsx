import {JSX} from "jsx-runtime/jsx-runtime.ts";
import {intoArray} from "../utility-types.ts";


type HorizontalFlowProps = JSX.PixieNodeProps<{
    padding: number
}>;

export const HorizontalFlow = (props: HorizontalFlowProps) => {
    let height = 0;
    return (
        <>
            {intoArray(props.children).map((child) => {
                child.y = height
                height += child.height + props.padding
                console.log(child.x, child.height)
                return child
            })}
        </>
    );
}