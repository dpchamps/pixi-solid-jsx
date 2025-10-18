import { createSignal, Index } from "solid-custom-renderer/patched-types.ts";
import {
  circularIn,
  createAsset,
  easeIn,
  easeInOut,
  easeOut, EasingFunction,
  elasticIn,
  flip, invariant,
  linear, Maybe,
} from "../../src";
import { Texture } from "pixi.js";
import { CoroutineContainer } from "../../src/engine/tags/extensions/CoroutineContainer.ts";
import { FpsCounter } from "../example-1/FpsCounter.tsx";
import { onEveryFrame } from "../../src/engine/core/query-fns.ts";
import {PixiNodeProps} from "jsx-runtime/jsx-node.ts";

const SPRITE_MAX = 3000;
const easingFns = [linear, easeIn, easeOut, easeInOut, flip, circularIn, elasticIn];
const getEasingFn = (n: number) => {
  const easingFn = easingFns[n%easingFns.length];
  invariant(easingFn);
  return easingFn;
}


const DemoText = (props: PixiNodeProps<{activeCount: number}>) => {
  return (
      <render-layer zIndex={1} sortableChildren={true}>
        <container>
          <container>
            <text zIndex={1} x={1000} style={{ wordWrap: true, wordWrapWidth: 500 }}>
              This demo shows {props.activeCount} individual sprites being rendered and updated in real
              time using basic solid primitives and a coroutine to animate scale with different
              easing functions.
            </text>
            <sprite x={1000} width={500} height={300} texture={Texture.WHITE} />
          </container>
        </container>
        <FpsCounter />
      </render-layer>
  )
}

type SpriteTransitionProps = PixiNodeProps<{
  easingFn: EasingFunction,
  index: number,
  numberSpritesActive: number
  noise: number;
  spriteTexture: Maybe<Texture>
}>
const SpriteTransition = (props: SpriteTransitionProps) => {
  const isVisible = () => props.index <= props.numberSpritesActive;
  const xPosition = () => props.noise + 500 + (props.index % 500);
  const yPosition = () => 500 + props.noise + Math.floor(props.index/ 500) * 5;

  return (
      <CoroutineContainer
          from={0.1}
          to={1}
          easingFn={props.easingFn}
          duration={10_000}
          replay={true}
          delay={10}
          shouldStart={isVisible()}
      >
        {(scale) => (
            <sprite
                visible={isVisible()}
                x={xPosition()*scale()}
                y={yPosition()}
                texture={props.spriteTexture || Texture.WHITE}
                scale={scale()}
                rotation={scale()*2*Math.PI}
            />
        )}
      </CoroutineContainer>
  )
}

export const BasicReactivityLoadTest = () => {
  const texture = createAsset<Texture>("fire.png");
  const [activeCount, setActiveCount] = createSignal(0);
  const entityList = Array.from({length: SPRITE_MAX}, (_, i) => Math.floor(Math.random()*100));

  onEveryFrame(() => {
    setActiveCount((current) => {
      if (current >= SPRITE_MAX) return current;
      return current + 1;
    });
  });

  return (
    <>
      <DemoText activeCount={activeCount()}/>

      <Index each={entityList}>
        {(state, index) => {
          const noise = state();
          return <SpriteTransition
              index={index}
              noise={noise}
              numberSpritesActive={activeCount()}
              easingFn={getEasingFn(index)}
              spriteTexture={texture()}
          />;
        }}
      </Index>
    </>
  );
};
