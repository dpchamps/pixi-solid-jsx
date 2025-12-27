// Useful utility types
export type UnknownRecord = Record<string, unknown>;
export type Maybe<T> = T | undefined | null;

export function invariant<T>(x: Maybe<T>, message?: string): asserts x {
  if (!isDefined(x)) {
    throw new Error(message || `invariant`);
  }
}

export function invariantUseContext<T>(
  x: Maybe<T>,
  contextType: string,
): asserts x {
  invariant(
    x,
    `Expected ${contextType}, but was undefined. Did you remember to use the provider?`,
  );
}

export const unimplemented = (..._: unknown[]): never => {
  throw new Error("unimplemented");
};

export function assert(
  condition: boolean,
  message: string = "truthy condition",
): asserts condition {
  if (!condition) {
    throw new Error(`Expected: ${message}`);
  }
}

type StringOfType<T> = T extends Function
  ? "function"
  : T extends bigint
    ? "bigint"
    : T extends symbol
      ? "symbol"
      : T extends boolean
        ? "boolean"
        : T extends number
          ? "number"
          : T extends undefined
            ? "undefined"
            : T extends string
              ? "string"
              : "object";

type TypeOfString = {
  function: Function;
  bigint: bigint;
  symbol: symbol;
  boolean: boolean;
  number: number;
  undefined: undefined;
  string: string;
  object: {};
};

export const unreachable = (_: never) => {
  throw new Error("unreachable");
};

export const is = <T, ExtractType extends StringOfType<T>>(
  input: T,
  type: ExtractType,
): input is Extract<T, TypeOfString[ExtractType]> => {
  return typeof input === type;
};

export const isSome = <T, ExtractType extends StringOfType<T>>(
  input: T,
  ...types: ExtractType[]
): input is Extract<T, TypeOfString[ExtractType]> => {
  return types.some((type) => typeof input === type);
};

export const isDefined = <T>(input: Maybe<T>): input is T => {
  return !(is(input, "undefined" as any) || input === null);
};

export const intoArray = <T>(maybeEls: Maybe<T | T[]>) =>
  Array.isArray(maybeEls) ? maybeEls : isDefined(maybeEls) ? [maybeEls] : [];
