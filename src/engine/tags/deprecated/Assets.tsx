import { Texture, Assets } from "pixi.js";
import { JSX } from "../../../pixi-jsx/jsx/jsx-runtime.ts";
import {
  createContext,
  createStore,
  createResource,
} from "solid-custom-renderer/index.ts";

type Asset = {
  url: string;
  id: string;
};

type AssetProviderProps = {
  assets: Asset[];
};

type AssetCache = {
  textures: Readonly<Record<string, Texture>>;
  data: Readonly<Record<string, Record<string, any> | Array<any>>>;
};

type LoadingState = "Loading" | "Success" | "Error";

type LoadingStatus = {
  totalAssets: number;
  assetsLoaded: string[];
  assetsFailed: string[];
};

export type AssetState = {
  loadingState: LoadingState;
  assetCache: AssetCache;
  status: LoadingStatus;
};

export const AssetsContext = createContext<AssetState>();

export const AssetsProvider = (
  props: JSX.PixieNodeProps<AssetProviderProps>,
) => {
  const [assetContext, setAssetContext] = createStore<AssetState>({
    assetCache: {
      textures: {},
      data: {},
    },
    status: {
      totalAssets: 0,
      assetsFailed: [],
      assetsLoaded: [],
    },
    loadingState: "Loading" as const,
  });

  const [_resource] = createResource(async () => {
    try {
      for (const asset of props.assets) {
        console.log("loading asset", asset);
        const result = await Assets.load(asset.url);
        if (result instanceof Texture) {
          setAssetContext("assetCache", {
            textures: {
              [asset.id]: result,
            },
          });
        }
      }
    } catch (e) {
      console.log(`error`, e);
    }
  });

  return (
    <AssetsContext.Provider value={assetContext}>
      {props.children}
    </AssetsContext.Provider>
  );
};
