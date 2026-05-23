/**
 * Reads and JSON-decodes a value from `window.localStorage`.
 *
 * @template T - Expected decoded value type.
 * @param key - Browser localStorage key to read.
 * @param defaultValue - Optional fallback returned when the key is absent.
 * @returns The parsed value, the fallback for missing keys, or `undefined` when no fallback is provided.
 * @throws {SyntaxError} Re-throws JSON parse errors for malformed stored values.
 */
function get<T>(key: string, defaultValue: T): T;
function get<T>(key: string): T | undefined;
function get<T>(key: string, defaultValue?: T): T | undefined {
  const item = window.localStorage.getItem(key);

  if (item === null) {
    return defaultValue;
  }

  return JSON.parse(item) as T;
}

/**
 * Creates a small JSON localStorage adapter for game settings and persistent UI state.
 *
 * Values are serialized with `JSON.stringify` and read with `JSON.parse`, so callers can
 * store structured data without duplicating parsing and fallback logic in components.
 *
 * @returns Helpers for reading (`get`) and writing (`upsert`) JSON values.
 *
 * @example
 * ```ts
 * const storage = createLocalStorage();
 * const settings = storage.get("settings", { volume: 0.5 });
 * storage.upsert("settings", { ...settings, volume: 0.25 });
 * ```
 */
export const createLocalStorage = () => {
  /**
   * JSON-encodes and writes a value to `window.localStorage`.
   *
   * @template T - Value type to encode.
   * @param key - Browser localStorage key to write.
   * @param value - JSON-serializable value to persist.
   */
  const upsert = <T>(key: string, value: T): void => {
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return { get, upsert };
};
