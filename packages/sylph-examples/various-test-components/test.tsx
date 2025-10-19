import { createSignal } from "solid-js";
import { Application } from "../../src/engine/tags/Application.tsx";
import { useContext } from "solid-js";
import {
  AssetsContext,
  AssetsProvider,
} from "../../src/engine/tags/Assets.tsx";
import { Marquee } from "./marquee.tsx";

const Child = () => {
  const assetStore = useContext(AssetsContext);
  const [width, setWidth] = createSignal(500);
  const [mult, setMult] = createSignal(1);

  setInterval(() => {
    if ((width() < 10 && mult() === -1) || (width() > 500 && mult() === 1)) {
      setMult(-mult());
    }
    setWidth(width() + 10 * mult());
  }, 100);

  return (
    <sprite
      x={100}
      y={100}
      width={width()}
      texture={assetStore?.assetCache.textures?.["fire"]}
    />
  );
};
export const TestComponent = () => {
  const [count, setCount] = createSignal(0);
  const [fontSize, setFontSize] = createSignal(10);
  const onClick = () => {
    setCount(count() + 1);
    setFontSize(fontSize() + 5);
  };

  return (
    <Application
      background={"#ecdddd"}
      width={500}
      height={500}
      eventMode={"static"}
    >
      <AssetsProvider assets={[{ url: "fire.png", id: "fire" }]}>
        <container>
          {count() % 2 === 0 ? (
            <text
              eventMode={"static"}
              style={{ fontSize: fontSize() }}
              onclick={onClick}
            >
              I'm Even
            </text>
          ) : (
            <text
              eventMode={"static"}
              style={{ fontSize: fontSize() }}
              onclick={onClick}
            >
              I'm Odd
            </text>
          )}
          <Child />

          {/*<text eventMode={'static'} onclick={(event) => console.log("hello", event)} style={{fontSize: 20, wordWrapWidth: 400, wordWrap: true}}>*/}
          {/*    This is a very long text that I'm typing. it's so damn long. I can't even believe how long it is*/}
          {/*    It just goes on and on. Like, literally forever. I could sit here all day and just talk*/}
          {/*    about how long this thing goes on. It's so much text, you wouldn't even believe.*/}
          {/*</text>*/}
        </container>
      </AssetsProvider>
    </Application>
  );
};

export const M = () => {
  const [scrollSpeed] = createSignal(100);
  return (
    <Application backgroundColor={"#FEFEFE"}>
      <Marquee scrollSpeed={scrollSpeed} style={{ fontSize: 25 }}>
        Helllllloooooo
      </Marquee>
    </Application>
  );
};
