
export {
    For,
    Suspense,
    SuspenseList,
    Switch,
    Match,
    ErrorBoundary,
    createEffect,
    createMemo,
    createResource,
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
    type Setter
} from "solid-js";

export {createStore} from "solid-js/store";

/***
 * Patching JSX Element types for downstream
 */
import {JSX} from "jsx-runtime/jsx-runtime.ts";

export type FlowProps<P = {}, C = JSX.Element> = P & {
    children: C;
};
type FlowComponent<P = {}, C = JSX.Element> = Component<FlowProps<P, C>>;

type Component<P = {}> = (props: P) => JSX.Element;
type RequiredParameter<T> = T extends () => unknown ? never : T;

import {
    Index as SolidIndex,
    Show as SolidShow,
    Accessor as SolidAccessor,
    createContext as solidCreateContext,
    useContext as solidUseContext,
    children as solidChildren,
    EffectOptions,
    ChildrenReturn
} from "solid-js";

/// Index
declare function IndexType<T extends readonly any[], U extends JSX.Element>(props: {
    each: T | undefined | null | false;
    fallback?: JSX.Element;
    children: (item: SolidAccessor<T[number]>, index: number) => U;
}): JSX.Element;
export const Index = SolidIndex as unknown as typeof IndexType;


/// Show
export declare function ShowType<
    T,
    TRenderFunction extends (item: SolidAccessor<NonNullable<T>>) => JSX.Element
>(props: {
    when: T | undefined | null | false;
    keyed?: false;
    fallback?: JSX.Element;
    children: JSX.Element | RequiredParameter<TRenderFunction>;
}): JSX.Element;

export const Show = SolidShow as unknown as typeof ShowType;


/// createContext
export type ContextProviderComponent<T> = FlowComponent<{
    value: T;
}>;
interface Context<T> {
    id: symbol;
    Provider: ContextProviderComponent<T>;
    defaultValue: T;
}
declare function createContextType<T>(
    defaultValue?: undefined,
    options?: EffectOptions
): Context<T | undefined>;
declare function createContextType<T>(defaultValue: T, options?: EffectOptions): Context<T>;

export const createContext = solidCreateContext as unknown as typeof createContextType;


/// useContext

export declare function useContextType<T>(context: Context<T>): T;

export const useContext = solidUseContext as unknown as typeof useContextType;


/// children

export declare function childrenType(fn: SolidAccessor<JSX.Element>): ChildrenReturn;

export const children = solidChildren as unknown as typeof childrenType;




