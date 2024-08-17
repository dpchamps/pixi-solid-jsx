import {TextIntrinsicProps} from "jsx-runtime/intrinsic-nodes.ts";
import {Accessor, createEffect, onCleanup, createSignal, onMount} from "solid-js";
import {BuildableContainerNode, BuildableTextNode} from "jsx-runtime/jsx-node.ts";
import {invariant} from "../utility-types.ts";
import {Container, Graphics} from "pixi.js";

type MarqueeProps = {
    scrollSpeed: Accessor<number>
}

export const Marquee = (props: TextIntrinsicProps & MarqueeProps) => {
    const [textNode, setTextNode] = createSignal<BuildableTextNode>();
    const [containerNode, setContainerNode] = createSignal<BuildableContainerNode>();

    onMount(() => {
        const text = textNode();
        const containerWidth = containerNode()?.container.width;
        invariant(text);
        invariant(containerWidth);
        const interval = setInterval(() => {
            text.container.x -= 10
            if(text.container.x < -text.container.width){
                text.container.x = containerWidth+text.container.width
            }
        }, props.scrollSpeed())

        onCleanup(() => clearInterval(interval));
    })

    return (
        <container ref={setContainerNode}>
            <text {...props} ref={setTextNode}>
                {props.children}
            </text>
        </container>
    )
}