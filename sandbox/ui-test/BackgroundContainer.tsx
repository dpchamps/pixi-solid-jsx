import {children, createEffect, createSignal, onMount} from "solid-custom-renderer/patched-types.ts";
import {ContainerNode} from "../../src/pixi-jsx/proxy-dom";
import {invariant, Maybe} from "../../src/utility-types.ts";
import {JSX} from "jsx-runtime/jsx-runtime.ts";
import {Accessor} from "solid-js";
import {Graphics} from "pixi.js";
import {AnyProxyNode} from "../../src/engine/tags/FlexBox/types.ts";
import {ProxyNode} from "../../src/pixi-jsx/proxy-dom/nodes/Node.ts";

type BackgroundContainerProps = {
    observe?: Accessor<unknown>
    padding?: number
    background: Graphics,
    x?: number,
    y?: number
}

const observe = (...args: Array<Maybe<Accessor<unknown>>>) => args.map((x) => x?.());

export const BackgroundContainer = (props: JSX.PixieNodeProps<BackgroundContainerProps>) => {
    const [containerRef, setContainerRef] = createSignal<ContainerNode>();
    const childrenSignal = children(() => props.children);
    const background = props.background;
    onMount(() => {
        const container = containerRef();
        invariant(container);

        container.container.addChild(background);
        background.zIndex = -1;
    })
    createEffect(() => {
        observe(childrenSignal, props.observe);
        const container = containerRef();
        invariant(container);
        const {height, width} = childrenSignal.toArray().reduce(
            (acc, el) => {
                if(!(el instanceof ProxyNode)) return acc;
                return {
                    height: acc.height+el.container.height,
                    width: acc.width+el.container.width
                }
            },
            {height: 0, width: 0}
        )
        background.height = height+(props.padding||0)*2;
        background.width = width+(props.padding||0)*2;
    })

    return (
        <container x={props.x||0} y={props.y||0} ref={setContainerRef} sortableChildren={true}>
            <container x={props.padding||0} y={props.padding||0}>
                {props.children}
            </container>
        </container>
    )
}