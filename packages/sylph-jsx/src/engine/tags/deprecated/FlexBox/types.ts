import { ProxyNode } from "../../../../pixi-jsx/proxy-dom/nodes/Node.ts";

export type FlexBoxOrientation = "vertical" | "horizontal";

export type BoxModel = {
  margin: number;
  padding: number;
  width: number;
};

export type FlexBoxProps = Partial<
  {
    x: number;
    y: number;
    orientation: FlexBoxOrientation | undefined;
  } & BoxModel
>;

export type AnyProxyNode = ProxyNode<any, any, any>;

export type FlexBoxChildrenState = {
  elements: AnyProxyNode[];
  maxX: number;
  maxY: number;
  row: number;
  col: number;
  width: number;
  height: number;
};

export type SpacingFnState = Pick<
  FlexBoxChildrenState,
  "maxX" | "maxY" | "row" | "col" | "width" | "height"
>;

export type SpacingFn = (
  el: AnyProxyNode,
  index: number,
  parentBoxModel: BoxModel,
  acc: SpacingFnState,
) => { node: AnyProxyNode } & SpacingFnState;
