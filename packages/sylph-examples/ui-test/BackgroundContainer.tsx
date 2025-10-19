import {
  children,
  createComputed,
  createEffect,
  createSignal,
  createStore,
  onMount,
} from "solid-custom-renderer/patched-types.ts";
import { ContainerNode } from "../../src/pixi-jsx/proxy-dom";
import { invariant, Maybe } from "../../src/utility-types.ts";
import { JSX } from "jsx-runtime/jsx-runtime.ts";
import { Accessor, Setter } from "solid-js";
import { FillInput, Graphics } from "pixi.js";
import { ProxyNode } from "../../src/pixi-jsx/proxy-dom/nodes/Node.ts";
import { createRect } from "../../src/engine/effects/createGraphics.ts";
import { clamp } from "../../src/utility-numbers.ts";
import { FlexBoxProps } from "../../src/engine/tags/FlexBox/types.ts";

type BackgroundContainerPropsBase = {
  padding?: number;
  background: Graphics;
  x?: number;
  y?: number;
  onScroll?: (() => { x: number; y: number }) | undefined;
  observe?: Accessor<unknown> | undefined;
  lockScrollToBounds?: boolean | undefined;
  noScroll?: boolean | undefined;
};

type FixedBackgroundContainerProps = {
  width: number;
  height: number;
} & BackgroundContainerPropsBase;

const FixedBackgroundContainer = (
  props: JSX.PixieNodeProps<FixedBackgroundContainerProps>,
) => {
  const [containerRef, setContainerRef] = createSignal<ContainerNode>();
  const background = props.background;

  onMount(() => {
    const container = containerRef();
    invariant(container);
    container.addChildProxyUntracked(background);
    background.zIndex = -1;
    background.height = props.height;
    background.width = props.width;
  });

  return (
    <container
      x={props.x || 0}
      y={props.y || 0}
      ref={setContainerRef}
      sortableChildren={true}
    >
      <container x={props.padding || 0} y={props.padding || 0}>
        {props.children}
      </container>
    </container>
  );
};

type DynamicBackgroundContainerProps = {
  onUpdate?: Setter<boolean>;
  minWidth?: number;
  minHeight?: number;
} & BackgroundContainerPropsBase;

const DynamicBackgroundContainer = (
  props: JSX.PixieNodeProps<DynamicBackgroundContainerProps>,
) => {
  const [containerRef, setContainerRef] = createSignal<ContainerNode>();
  const [scroll, setScroll] = createStore({
    x: props.noScroll ? props.x || 0 : 0,
    y: props.noScroll ? props.y || 0 : 0,
  });
  const background = props.background;
  const childrenSignal = children(() => props.children);

  onMount(() => {
    const container = containerRef();
    invariant(container);
    container.addChildProxyUntracked(background);
    background.zIndex = -1;
  });

  createEffect(() => {
    observe(props.observe);
    const container = containerRef();
    invariant(container);
    const { height, width } = childrenSignal.toArray().reduce(
      (acc, el) => {
        if (!(el instanceof ProxyNode)) return acc;
        el.syncUntracked();
        const { height, width } = el.container.getBounds(false);
        return {
          height: acc.height + height,
          width: acc.width + width,
        };
      },
      { height: 0, width: 0 },
    );
    background.getBounds(false);
    background.height =
      Math.max(height, props.minHeight || 0) + (props.padding || 0) * 2;
    background.width =
      Math.max(width, props.minWidth || 0) + (props.padding || 0) * 2;

    props.onUpdate?.(true);
  });

  createEffect(() => {
    if (props.onScroll) {
      const { x, y } = props.onScroll();
      setScroll((prevScroll) => {
        if (props.noScroll === true) return prevScroll;
        const minWidth = props.minWidth || 0;
        const diffX = minWidth + (props.padding || 0) * 2 - background.width;
        const nextScrollX = clamp(diffX, 0, prevScroll.x - x);

        const minHeight = props.minHeight || 0;
        const diffY = minHeight + (props.padding || 0) * 2 - background.height;
        const nextScrollY = clamp(diffY, 0, prevScroll.y - y);

        return {
          x: nextScrollX,
          y: nextScrollY,
        };
      });
    }
  });

  return (
    <container
      x={scroll.x}
      y={scroll.y}
      ref={setContainerRef}
      sortableChildren={true}
    >
      <container x={props.padding || 0} y={props.padding || 0}>
        {props.children}
      </container>
    </container>
  );
};

const observe = (...args: Array<Maybe<Accessor<unknown>>>) =>
  args.map((x) => x?.());

type BackgroundContainerProps =
  | ({ type: "fixed" } & FixedBackgroundContainerProps)
  | ({ type: "dynamic" } & DynamicBackgroundContainerProps);

export const BackgroundContainer = (
  props: JSX.PixieNodeProps<BackgroundContainerProps>,
) => {
  return props.type === "fixed" ? (
    <FixedBackgroundContainer {...props} />
  ) : (
    <DynamicBackgroundContainer {...props} />
  );
};

type BoxProps = {
  margin?: number;
  padding?: number;
  backgroundColor: FillInput;
  borderColor: FillInput;
  orientation?: FlexBoxProps["orientation"] | undefined;
};

type PropsWithoutBackground<
  T extends BackgroundContainerProps = BackgroundContainerProps,
> = T extends any ? Omit<T, "background"> : never;

export const Box = (
  props: JSX.PixieNodeProps<BoxProps & PropsWithoutBackground>,
) => {
  const background = createRect({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    fill: props.backgroundColor,
  });
  const border = createRect({
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    fill: props.borderColor,
  });
  const [childUpdate, setChildUpdate] = createSignal(true, { equals: false });
  const [mask, setMask] = createSignal<Graphics | null>(null);
  const [innerMask, setInnerMask] = createSignal<Graphics | null>(null);
  createComputed(() => {
    setMask(
      props.type === "fixed"
        ? createRect({
            x: props.x || 0,
            y: props.y || 0,
            width: props.width + (props.padding || 0),
            height: props.height + (props.padding || 0),
            fill: "white",
          })
        : null,
    );

    setInnerMask(
      props.type === "fixed"
        ? createRect({
            x: (props.x || 0) + (props.margin || 0),
            y: (props.y || 0) + (props.margin || 0),
            width:
              (props.width || 0) +
              (props.padding || 0) -
              (props.margin || 0) * 2,
            height:
              (props.height || 0) +
              (props.padding || 0) -
              (props.margin || 0) * 2,
            fill: "white",
          })
        : null,
    );
  });

  const Inner = () => (
    <DynamicBackgroundContainer
      onScroll={props.onScroll}
      padding={Math.max(props.padding || 0, 0)}
      observe={props.observe}
      background={background}
      onUpdate={setChildUpdate}
      minHeight={Math.max(
        props.type === "fixed"
          ? props.height - (props.padding || 0) - (props.margin || 0) * 2
          : 0,
        0,
      )}
      minWidth={Math.max(
        props.type === "fixed"
          ? props.width - (props.padding || 0) - (props.margin || 0) * 2
          : 0,
        0,
      )}
      noScroll={props.type === "dynamic" ? true : props.noScroll}
    >
      {props.children}
    </DynamicBackgroundContainer>
  );
  return (
    <container mask={mask()}>
      <BackgroundContainer
        type={props.type}
        x={props.x || 0}
        y={props.y || 0}
        padding={Math.max(props.margin || 0, 0)}
        background={border}
        observe={childUpdate}
        height={Math.max(
          props.type === "fixed" ? props.height + (props.padding || 0) : 0,
          0,
        )}
        width={Math.max(
          props.type === "fixed" ? props.width + (props.padding || 0) : 0,
          0,
        )}
        noScroll={true}
      >
        {innerMask() ? (
          <container mask={innerMask()}>
            <Inner />
          </container>
        ) : (
          <Inner />
        )}
      </BackgroundContainer>
    </container>
  );
};
