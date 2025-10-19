import { createSignal, onMount } from "solid-custom-renderer/patched-types.ts";
import { GraphicsNode } from "sylph-jsx/src/pixi-jsx/proxy-dom/nodes/Graphics.ts";
import { invariant } from "sylph-jsx/src/utility-types.ts";
import { JSX } from "jsx-runtime/jsx-runtime.ts";
import { Graphics as PixiGraphics } from "pixi.js";

type GraphicsProps = {
  build: (node: PixiGraphics) => void;
};
export const Graphics = (props: JSX.PixieNodeProps<GraphicsProps>) => {
  const [graphicsRef, setGraphicsRef] = createSignal<GraphicsNode>();

  onMount(() => {
    const graphics = graphicsRef();
    invariant(graphics);
    props.build(graphics.container);
  });

  return <graphics ref={setGraphicsRef} />;
};
