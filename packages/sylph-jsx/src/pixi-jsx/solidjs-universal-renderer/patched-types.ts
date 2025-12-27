export {
  Suspense,
  SuspenseList,
  ErrorBoundary,
  createEffect,
  createMemo,
  createResource,
  type ResourceReturn,
  createSignal,
  onMount,
  onCleanup,
  createComputed,
  batch,
  from,
  getOwner,
  runWithOwner,
  untrack,
  type Accessor,
  type Setter,
  createRoot,
  type Resource,
  createUniqueId,
} from "solid-js";

export {
  createStore,
  unwrap,
  produce,
  type SetStoreFunction,
} from "solid-js/store";

/***
 * Patching JSX Element types for downstream
 */
import { JSX } from "../jsx/jsx-runtime.js";

export type FlowProps<P = {}, C = JSX.Element> = P & {
  children: C;
};
type FlowComponent<P = {}, C = JSX.Element> = Component<FlowProps<P, C>>;

type Component<P = {}> = (props: P) => JSX.Element;
type RequiredParameter<T> = T extends () => unknown ? never : T;

import {
  Index as SolidIndex,
  Show as SolidShow,
  For as SolidFor,
  Accessor as SolidAccessor,
  createContext as solidCreateContext,
  useContext as solidUseContext,
  children as solidChildren,
  EffectOptions,
  lazy as solidLazy,
  Match as SolidMatch,
  Switch as SolidSwitch,
} from "solid-js";

/// Index
declare function IndexType<
  T extends readonly any[],
  U extends JSX.Element,
>(props: {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  children: (item: SolidAccessor<T[number]>, index: number) => U;
}): JSX.Element;
export const Index = SolidIndex as unknown as typeof IndexType;

/// For
declare function ForType<
  T extends readonly any[],
  U extends JSX.Element,
>(props: {
  each: T | undefined | null | false;
  fallback?: JSX.Element;
  children: (item: T[number], index: SolidAccessor<number>) => U;
}): JSX.Element;
export const For = SolidFor as unknown as typeof ForType;

/// Show
export declare function ShowType<
  T,
  TRenderFunction extends (item: SolidAccessor<NonNullable<T>>) => JSX.Element,
>(props: {
  when: T | undefined | null | false;
  keyed?: false;
  fallback?: JSX.Element;
  children: JSX.Element | RequiredParameter<TRenderFunction>;
}): JSX.Element;

export declare function ShowType<
  T,
  TRenderFunction extends (item: NonNullable<T>) => JSX.Element,
>(props: {
  when: T | undefined | null | false;
  keyed: true;
  fallback?: JSX.Element;
  children: JSX.Element | RequiredParameter<TRenderFunction>;
}): JSX.Element;

export const Show = SolidShow as unknown as typeof ShowType;

/// createContext
export type ContextProviderComponent<T> = FlowComponent<{
  value: T;
}>;
export interface Context<T> {
  id: symbol;
  Provider: ContextProviderComponent<T>;
  defaultValue: T;
}
declare function createContextType<T>(
  defaultValue?: undefined,
  options?: EffectOptions,
): Context<T | undefined>;
declare function createContextType<T>(
  defaultValue: T,
  options?: EffectOptions,
): Context<T>;

export const createContext =
  solidCreateContext as unknown as typeof createContextType;

/// useContext

export declare function useContextType<T>(context: Context<T>): T;

export const useContext = solidUseContext as unknown as typeof useContextType;

/// children
export type ResolvedChildren = JSX.Element | JSX.Element[];
export type ChildrenReturn = SolidAccessor<ResolvedChildren> & {
  toArray: () => JSX.Element[];
};
export declare function childrenType(
  fn: SolidAccessor<JSX.Element>,
): ChildrenReturn;

export const children = solidChildren as unknown as typeof childrenType;

/// lazy
export declare function lazyType<T extends Component<any>>(
  fn: () => Promise<{
    default: T;
  }>,
): T & {
  preload: () => Promise<{ default: T }>;
};

export const lazy = solidLazy as unknown as typeof lazyType;

/// Switch

export declare function SwitchType(props: {
  fallback?: JSX.Element;
  children: JSX.Element;
}): JSX.Element;

export const Switch = SolidSwitch as unknown as typeof SwitchType;

/// Match

export declare function MatchType<
  T,
  TRenderFunction extends (item: SolidAccessor<NonNullable<T>>) => JSX.Element,
>(props: {
  when: T | undefined | null | false;
  keyed?: false;
  children: JSX.Element | RequiredParameter<TRenderFunction>;
}): JSX.Element;

export declare function MatchType<
  T,
  TRenderFunction extends (item: NonNullable<T>) => JSX.Element,
>(props: {
  when: T | undefined | null | false;
  keyed: true;
  children: JSX.Element | RequiredParameter<TRenderFunction>;
}): JSX.Element;

export const Match = SolidMatch as unknown as typeof MatchType;
