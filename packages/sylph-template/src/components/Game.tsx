import {
  type Accessor,
  createAsset,
  createMouse,
  createSignal,
  createSynchronizedEffect,
  euclideanDistance,
  onEveryFrame,
  type PixiNodeProps,
  type Point,
  type TextIntrinsicProps,
  useApplicationState,
} from "sylph-jsx";
import { Texture, BlurFilter } from "pixi.js";

const getApplicationBounds = () => {
  const app = useApplicationState();
  return app.application.canvas.getBoundingClientRect();
};

const getMousePositionOffset = (pos: Point) => {
  const bounds = getApplicationBounds();

  return {
    x: Math.min(Math.max(0, pos.x - bounds.x), bounds.right),
    y: Math.min(Math.max(0, pos.y - bounds.y), bounds.bottom),
  };
};

const createIsCloseTo = (pos: Accessor<Point>, targetPos: Accessor<Point>) => {
  const [closeness, setCloseness] = createSignal(false);
  const positions = () => ({
    position: pos(),
    targetPosition: targetPos(),
  });
  createSynchronizedEffect(positions, ({ position, targetPosition }) => {
    setCloseness(euclideanDistance(position, targetPosition) < 20);
  });

  return closeness;
};

const Text = (props: TextIntrinsicProps) => (
  <text
    scale={0.5}
    style={{ fill: "lightblue", fontFamily: "sans-serif", fontSize: 70 }}
    {...props}
  >
    {props.children}
  </text>
);

const Overlay = () => (
  <render-layer sortableChildren={true} zIndex={100}>
    <Text>Sylph.JSX</Text>
    <Text y={50}>(use scroll wheel)</Text>
  </render-layer>
);

type MainSpriteProps = PixiNodeProps<{
  position: { x: number; y: number };
  tint: string;
  blur: BlurFilter;
}>;

const MainSprite = (props: MainSpriteProps) => {
  const texture = createAsset<Texture>("sylph-logo.png");

  return (
    <sprite
      texture={texture()}
      tint={props.tint}
      pivot={{
        x: (texture()?.width || 0) / 2,
        y: (texture()?.height || 0) / 2,
      }}
      scale={0.3}
      x={props.position.x}
      y={props.position.y}
      filters={[props.blur]}
    />
  );
};

export const Game = () => {
  const mousePosition = createMouse(window);
  const [logoPos, setLogoPos] = createSignal({ x: 0, y: 0 });
  const [targetPos, setTargetPos] = createSignal({ x: 0, y: 0 });
  const [tint, setTint] = createSignal("white");
  const [blurFilter, setBlurFilter] = createSignal(
    new BlurFilter({ strength: 10 }),
    { equals: false },
  );
  const isCloseTo = createIsCloseTo(logoPos, targetPos);

  createSynchronizedEffect(mousePosition.currentMousePosition, (pos) => {
    if (!pos) return;
    setTargetPos(getMousePositionOffset(pos));
  });

  createSynchronizedEffect(mousePosition.wheel, (deltas) => {
    const delta = Math.min(Math.max(deltas?.deltaY || 0, -1), 1);
    if (delta === 0) return;
    setBlurFilter((last) => {
      last.strength = Math.max(0, last.strength - delta * 2);
      return last;
    });
  });

  createSynchronizedEffect(isCloseTo, (close) => {
    setTint(close ? "white" : "grey");
  });

  onEveryFrame((ticker) => {
    if (euclideanDistance(logoPos(), targetPos()) <= 0.1) return;
    const { x: targetX, y: targetY } = targetPos();

    setLogoPos(({ x, y }) => {
      const distX = -(x - targetX) / 100;
      const distY = -(y - targetY) / 100;
      return {
        x: x + distX * 5 * ticker.deltaTime,
        y: y + distY * 5 * ticker.deltaTime,
      };
    });
  });

  return (
    <>
      <Overlay />
      <MainSprite position={logoPos()} tint={tint()} blur={blurFilter()} />
    </>
  );
};
