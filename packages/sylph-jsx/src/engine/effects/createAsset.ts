import { Assets } from "pixi.js";
import { Accessor, createResource } from "solid-js";

export const createAsset = <T>(
  url: Accessor<string | string[]> | string[] | string,
) => {
  const [asset] = createResource(url, async (texture) =>
    Assets.load<T>(texture),
  );

  return asset;
};
