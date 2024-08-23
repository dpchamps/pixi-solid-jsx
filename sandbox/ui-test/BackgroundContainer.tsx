import {
    batch,
    children,
    createComputed,
    createEffect,
    createSignal, createStore,
    onMount,
    untrack
} from "solid-custom-renderer/patched-types.ts";
import {ContainerNode} from "../../src/pixi-jsx/proxy-dom";
import {intoArray, invariant, Maybe} from "../../src/utility-types.ts";
import {JSX} from "jsx-runtime/jsx-runtime.ts";
import {Accessor, Setter} from "solid-js";
import {FillInput, Graphics} from "pixi.js";
import {AnyProxyNode} from "../../src/engine/tags/FlexBox/types.ts";
import {ProxyNode} from "../../src/pixi-jsx/proxy-dom/nodes/Node.ts";
import {createGraphics, createRect} from "../../src/engine/effects/createGraphics.ts";
import {Graphics as GraphicsThing} from "./Graphics.tsx";
import {createMouse} from "../../src/engine/effects/createMouse.ts";
type BackgroundContainerProps = {
    observe?: Accessor<unknown> | undefined
    padding?: number
    background: Graphics,
    x?: number,
    y?: number
    onUpdate?: Setter<boolean>
}

const observe = (...args: Array<Maybe<Accessor<unknown>>>) => args.map((x) => x?.());


export const BackgroundContainer = (props: JSX.PixieNodeProps<BackgroundContainerProps>) => {
    const [containerRef, setContainerRef] = createSignal<ContainerNode>();
    const background = props.background;
    const childrenSignal = children(() => props.children);

    onMount(() => {
        const container = containerRef();
        invariant(container);
        container.addChildProxyUntracked(background);
        background.zIndex = -1;
    })
    createEffect(() => {
        observe(props.observe);
        const container = containerRef();
        invariant(container);
        const {height, width} = childrenSignal.toArray().reduce(
            (acc, el) => {
                if(!(el instanceof ProxyNode)) return acc;
                el.syncUntracked();
                const {height, width} = el.container.getBounds(false);
                return {
                    height: acc.height+height,
                    width: acc.width+width
                }
            },
            {height: 0, width: 0}
        )
        background.getBounds(false);
        background.height = height+(props.padding||0)*2;
        background.width = width+(props.padding||0)*2;

        props.onUpdate?.(true);
    })

    return (
        <container x={props.x||0} y={props.y||0} ref={setContainerRef} sortableChildren={true}>
            <container x={props.padding||0} y={props.padding||0}>
                {props.children}
            </container>
        </container>
    )
}

type BoxProps = {
    margin?: number
    padding?: number,
    backgroundColor: FillInput,
    borderColor: FillInput
}
export const Box = (props: JSX.PixieNodeProps<BoxProps & Omit<BackgroundContainerProps, "background">>) => {
    const background = createRect({x: 0, y: 0, width: 1, height: 1, fill: props.backgroundColor});
    const border = createRect({x: 0, y: 0, width: 1, height: 1, fill: props.borderColor});
    const [childUpdate, setChildUpdate] = createSignal(true, {equals: false});

    return (
            <BackgroundContainer
                x={(props.x || 0)}
                y={(props.y || 0)}
                padding={props.margin || 0}
                background={border}
                observe={childUpdate}
            >
                <BackgroundContainer
                    padding={props.padding || 0}
                    observe={props.observe}
                    background={background}
                    onUpdate={setChildUpdate}
                >
                    {props.children}
                </BackgroundContainer>
            </BackgroundContainer>

    )
}