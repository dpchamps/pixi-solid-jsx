import { beforeEach, describe, expect, test } from "vitest";
import { createLocalStorage } from "../../../components/extensions/createLocalStorage.js";

const STORAGE_KEYS = [
  "missing",
  "settings",
  "false-value",
  "zero-value",
  "null-value",
  "shared",
  "invalid-json",
];

describe("createLocalStorage", () => {
  beforeEach(() => {
    STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  });

  test("returns undefined for missing keys without defaults", () => {
    const storage = createLocalStorage();

    expect(storage.get("missing")).toBeUndefined();
  });

  test("returns the provided default value for missing keys", () => {
    const storage = createLocalStorage();
    const fallback = { music: true, volume: 0.5 };

    expect(storage.get("missing", fallback)).toBe(fallback);
  });

  test("serializes values with JSON when upserting", () => {
    const storage = createLocalStorage();
    const settings = { music: true, sfx: 0.75, mode: "classic" };

    storage.upsert("settings", settings);

    expect(window.localStorage.getItem("settings")).toBe(
      JSON.stringify(settings),
    );
  });

  test("deserializes stored JSON values", () => {
    const storage = createLocalStorage();
    const settings = { music: false, sfx: 0.25, mode: "easy" };

    window.localStorage.setItem("settings", JSON.stringify(settings));

    expect(storage.get<typeof settings>("settings")).toEqual(settings);
  });

  test("round-trips falsy JSON values instead of falling back", () => {
    const storage = createLocalStorage();

    storage.upsert("false-value", false);
    storage.upsert("zero-value", 0);
    storage.upsert("null-value", null);

    expect(storage.get("false-value", true)).toBe(false);
    expect(storage.get("zero-value", 10)).toBe(0);
    expect(storage.get("null-value", "fallback")).toBeNull();
  });

  test("multiple helpers share browser localStorage persistence", () => {
    const first = createLocalStorage();
    const second = createLocalStorage();

    first.upsert("shared", ["card", "potion", "monster"]);

    expect(second.get<string[]>("shared")).toEqual([
      "card",
      "potion",
      "monster",
    ]);
  });

  test("surfaces invalid JSON errors from localStorage", () => {
    const storage = createLocalStorage();

    window.localStorage.setItem("invalid-json", "{not-json");

    expect(() => storage.get("invalid-json")).toThrow(SyntaxError);
  });
});
