import {
  circularIn,
  createWindowDimensions,
  easeIn,
  easeInOut,
  easeOut,
  EasingFunction,
  elasticIn,
  flip,
  invariant,
  linear,
} from "sylph-jsx";
import { Texture } from "pixi.js";
import { CoroutineContainer } from "sylph-jsx/src/engine/tags/extensions/CoroutineContainer.tsx";
import { For, createSignal } from "sylph-jsx/src/pixi-jsx";
import { PixiNodeProps } from "jsx-runtime/jsx-node.ts";

const easingFns = [
  linear,
  easeIn,
  easeOut,
  easeInOut,
  flip,
  circularIn,
  elasticIn,
];
const getEasingFn = (n: number) => {
  const easingFn = easingFns[n % easingFns.length];
  invariant(easingFn);
  return easingFn;
};

const Menu = (
  props: PixiNodeProps<{ setEasingFn: (easingFn: EasingFunction) => void }>,
) => {
  const [currentSelection, setCurrentSelection] = createSignal(0);
  const onClick = (index: number) => {
    const nextEasing = getEasingFn(index);
    setCurrentSelection(index);
    props.setEasingFn(nextEasing);
  };

  return (
    <render-layer zIndex={100}>
      <container x={10} zIndex={1000}>
        <For each={easingFns}>
          {(easingFunction, index) => {
            return (
              <text
                interactive={true}
                x={10}
                y={index() * 30}
                onclick={() => onClick(index())}
                style={{
                  fontWeight:
                    currentSelection() === index() ? "bold" : "normal",
                }}
              >
                {easingFunction.name}
              </text>
            );
          }}
        </For>
      </container>
    </render-layer>
  );
};

export const BasicCoroutineExample = () => {
  const [easingFn, setEasingFn] = createSignal<EasingFunction>(easeIn);
  const windowDimensions = createWindowDimensions(window);

  return (
    <>
      <Menu setEasingFn={(nextEasingFn) => setEasingFn(() => nextEasingFn)} />
      <CoroutineContainer
        from={0}
        to={Math.max(
          windowDimensions().innerWidth,
          windowDimensions().innerHeight,
        )}
        duration={2_000}
        replay={true}
        delay={500}
        easingFn={easingFn()}
      >
        {(currentStep) => {
          return (
            <sprite
              height={Math.max(20, currentStep())}
              width={Math.max(20, currentStep())}
              pivot={{ x: 0.5, y: 0.5 }}
              x={windowDimensions().innerWidth / 2}
              y={windowDimensions().innerHeight / 2}
              interactive={true}
              tint={"lightblue"}
              texture={Texture.WHITE}
            />
          );
        }}
      </CoroutineContainer>
    </>
  );
};
