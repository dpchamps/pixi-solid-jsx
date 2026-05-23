import { describe, expect, test } from "vitest";
import {
  createSignal,
  Show,
} from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import {
  Container,
  Texture,
  TilingSprite as PixiTilingSprite,
} from "pixi.js";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import { TilingSprite } from "../../../components/extensions/TilingSprite.jsx";

const getSceneRoot = (stage: Container) => stage.children[0] as Container;
const getWrapper = (stage: Container) => getSceneRoot(stage).children[0] as Container;

const getRenderedTilingSprite = (stage: Container) => {
  const wrapper = getWrapper(stage);
  const sprite = wrapper.children[0];

  expect(sprite).toBeInstanceOf(PixiTilingSprite);
  return sprite as PixiTilingSprite;
};

describe("TilingSprite", () => {
  test("renders an empty wrapper until a texture is available", async () => {
    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TilingSprite texture={undefined} width={100} height={50} />,
    );

    const wrapper = getWrapper(stage);
    expect(wrapper.children.length).toBe(0);

    await ticker.tickFrames(1);
    expect(wrapper.children.length).toBe(0);

    dispose();
  });

  test("creates an external Pixi TilingSprite from texture and initial props", async () => {
    const texture = Texture.EMPTY;

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => (
        <TilingSprite
          texture={texture}
          width={320}
          height={180}
          x={12}
          y={34}
          alpha={0.75}
          tilePosition={{ x: 5, y: 6 }}
          tileScale={{ x: 2, y: 3 }}
          tileRotation={0.5}
          anchor={0.5}
          zIndex={42}
        />
      ),
    );

    const wrapper = getWrapper(stage);
    expect(wrapper.children.length).toBe(0);

    await ticker.tickFrames(1);

    const sprite = getRenderedTilingSprite(stage);
    expect(wrapper.zIndex).toBe(42);
    expect(sprite.texture).toBe(texture);
    expect(sprite.width).toBe(320);
    expect(sprite.height).toBe(180);
    expect(sprite.x).toBe(12);
    expect(sprite.y).toBe(34);
    expect(sprite.alpha).toBe(0.75);
    expect(sprite.tilePosition.x).toBe(5);
    expect(sprite.tilePosition.y).toBe(6);
    expect(sprite.tileScale.x).toBe(2);
    expect(sprite.tileScale.y).toBe(3);
    expect(sprite.tileRotation).toBe(0.5);
    expect(sprite.anchor.x).toBe(0.5);
    expect(sprite.anchor.y).toBe(0.5);

    dispose();
  });

  test("reactively updates size, position, zIndex, and tiling props", async () => {
    const [width, setWidth] = createSignal(100);
    const [height, setHeight] = createSignal(50);
    const [x, setX] = createSignal(1);
    const [y, setY] = createSignal(2);
    const [zIndex, setZIndex] = createSignal(3);
    const [tilePosition, setTilePosition] = createSignal({ x: 0, y: 0 });
    const [tileScale, setTileScale] = createSignal({ x: 1, y: 1 });

    const TestComponent = () => (
      <TilingSprite
        texture={Texture.EMPTY}
        width={width()}
        height={height()}
        x={x()}
        y={y()}
        zIndex={zIndex()}
        tilePosition={tilePosition()}
        tileScale={tileScale()}
      />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(2);
    const wrapper = getWrapper(stage);
    const sprite = getRenderedTilingSprite(stage);

    expect(sprite.width).toBe(100);
    expect(sprite.height).toBe(50);
    expect(sprite.x).toBe(1);
    expect(sprite.y).toBe(2);
    expect(wrapper.zIndex).toBe(3);

    setWidth(200);
    setHeight(80);
    setX(15);
    setY(25);
    setZIndex(30);
    setTilePosition({ x: 7, y: 8 });
    setTileScale({ x: 4, y: 5 });
    await ticker.tickFrames(1);

    expect(sprite.width).toBe(200);
    expect(sprite.height).toBe(80);
    expect(sprite.x).toBe(15);
    expect(sprite.y).toBe(25);
    expect(wrapper.zIndex).toBe(30);
    expect(sprite.tilePosition.x).toBe(7);
    expect(sprite.tilePosition.y).toBe(8);
    expect(sprite.tileScale.x).toBe(4);
    expect(sprite.tileScale.y).toBe(5);

    dispose();
  });

  test("swaps and destroys the external TilingSprite when texture changes", async () => {
    const [texture, setTexture] = createSignal(Texture.EMPTY);

    const TestComponent = () => (
      <TilingSprite texture={texture()} width={100} height={100} />
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );

    await ticker.tickFrames(1);
    const wrapper = getWrapper(stage);
    const firstSprite = getRenderedTilingSprite(stage);

    setTexture(Texture.WHITE);
    await ticker.tickFrames(1);

    expect(wrapper.children.length).toBe(1);
    const secondSprite = getRenderedTilingSprite(stage);
    expect(secondSprite).not.toBe(firstSprite);
    expect(secondSprite.texture).toBe(Texture.WHITE);
    expect(firstSprite.destroyed).toBe(true);

    dispose();
  });

  test("removed TilingSprite nodes leave the Pixi scene graph", async () => {
    const [visible, setVisible] = createSignal(true);

    const TestComponent = () => (
      <Show when={visible()}>
        <TilingSprite texture={Texture.EMPTY} width={100} height={50} />
      </Show>
    );

    const { stage, ticker, dispose } = await renderApplicationWithFakeTicker(
      () => <TestComponent />,
    );
    const root = getSceneRoot(stage);

    await ticker.tickFrames(1);
    expect(root.children.length).toBe(1);
    expect(getWrapper(stage).children.length).toBe(1);

    setVisible(false);
    await ticker.tickFrames(1);

    expect(root.children.length).toBe(0);

    dispose();
  });
});
