import { JSX } from "jsx-runtime/jsx-runtime.ts";
import { mergeProps } from "solid-js";
import { children, createEffect } from "solid-custom-renderer/patched-types.ts";
import { unreachable } from "../../../../utility-types.ts";
import { ProxyNode } from "../../../../pixi-jsx/proxy-dom/nodes/Node.ts";
import {
  AnyProxyNode,
  BoxModel,
  FlexBoxOrientation,
  FlexBoxProps,
  SpacingFnState,
} from "./types.ts";
import { childWithHorizontalSpacing } from "./horizontal-spacing.ts";
import { childWithVerticalSpacing } from "./vertical-spacing.ts";

const DEFAULT_PROPS = {
  x: 0,
  y: 0,
  margin: 0,
  padding: 0,
  width: 0,
  orientation: "horizontal",
} satisfies FlexBoxProps;

const childWithSpacing = (
  orientation: FlexBoxOrientation,
  i: number,
  parentBoxModel: BoxModel,
  el: AnyProxyNode,
  acc: SpacingFnState,
) => {
  switch (orientation) {
    case "horizontal":
      return childWithHorizontalSpacing(el, i, parentBoxModel, acc);
    case "vertical":
      return childWithVerticalSpacing(el, i, parentBoxModel, acc);
    default:
      return unreachable(orientation);
  }
};

export const FlexBox = (props: JSX.PixieNodeProps<FlexBoxProps>) => {
  const propsWithDefaults = mergeProps(DEFAULT_PROPS, props);
  const childrenSignal = children(() => props.children);

  createEffect(() => {
    childrenSignal.toArray().reduce(
      (acc, el, i) => {
        if (!(el instanceof ProxyNode)) return acc;
        const { node, ...next } = childWithSpacing(
          propsWithDefaults.orientation,
          i,
          {
            margin: propsWithDefaults.margin,
            padding: propsWithDefaults.padding,
            width: propsWithDefaults.width,
          },
          el,
          acc,
        );

        return {
          elements: [...acc.elements, node],
          ...next,
        };
      },
      {
        elements: [] as AnyProxyNode[],
        maxX: 0,
        maxY: 0,
        row: 0,
        col: 0,
        width: 0,
        height: 0,
      },
    );
  });

  return (
    <container x={propsWithDefaults.x} y={propsWithDefaults.y}>
      {childrenSignal()}
    </container>
  );
};
