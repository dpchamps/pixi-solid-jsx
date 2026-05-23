import {
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "../../../pixi-jsx/solidjs-universal-renderer/index.js";
import type { PixiNodeProps } from "../../../pixi-jsx/jsx/jsx-runtime.js";
import { invariantUseContext } from "../../../utility-types.js";
import { createLocalStorage } from "./createLocalStorage.js";
import { sound, type PlayOptions, type SoundLibrary } from "@pixi/sound";

/**
 * Local-storage key used by {@link AudioContextProvider} for persisted settings.
 */
export const AUDIO_SETTINGS_KEY = "audio-settings";

/**
 * Named audio bucket used to apply a per-category volume multiplier.
 *
 * Games can define any buckets they need, such as `music`, `sfx`, `voice`,
 * `ambience`, `ui`, or level-specific channels.
 */
export type AudioBucket = string;

/**
 * Named queue slot for long-running or mutually-exclusive audio.
 *
 * Queues are independent from buckets: a `combat` queue may use the `music`
 * bucket, while an `outside-rain` queue may use an `ambience` bucket.
 */
export type AudioQueueChannel = string;

/**
 * User-adjustable audio settings persisted by {@link AudioContextProvider}.
 */
export type AudioSettings = {
  /** Global volume multiplier applied by `@pixi/sound` to all output. */
  globalVolume: number;
  /** Per-bucket volume multipliers keyed by arbitrary game-defined names. */
  volumes: Record<AudioBucket, number>;
};

/**
 * Default audio settings used when no persisted settings are available.
 */
export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  globalVolume: 1,
  volumes: {},
};

/**
 * Pitch randomization controls accepted by {@link AudioContextValue.play} and
 * {@link AudioContextValue.queue}.
 */
export type PitchVariationOptions = {
  /** Whether to randomize playback speed for this sound. Defaults to `true`. */
  varyPitch?: boolean;
  /** Symmetric random range around `1`, e.g. `0.1` means `0.9..1.1`. */
  pitchVariance?: number;
};

/**
 * Play options accepted by {@link AudioContextValue.play}.
 */
export type BucketedPlayOptions = PlayOptions &
  PitchVariationOptions & {
    /** Optional game-defined bucket whose volume should apply to this play call. */
    bucket?: AudioBucket;
  };

/**
 * Queue options accepted by {@link AudioContextValue.queue}.
 */
export type QueueAudioOptions = BucketedPlayOptions & {
  /** Queue slot to replace. Defaults to `"default"`. */
  channel?: AudioQueueChannel;
  /** Whether to stop the previous alias in this queue slot. Defaults to `true`. */
  stopPrevious?: boolean;
};

/**
 * Result returned by `@pixi/sound` when playing an alias.
 */
export type AudioPlayResult = ReturnType<SoundLibrary["play"]>;

/**
 * Metadata tracked for an alias currently controlled by {@link AudioContextValue.queue}.
 */
export type QueuedAudio = {
  /** Sound alias currently playing in the channel. */
  alias: string;
  /** Bucket used for volume updates, if any. */
  bucket?: AudioBucket;
  /** Per-play volume before bucket/global multipliers. */
  baseVolume: number;
};

/**
 * Public API exposed by {@link AudioContextProvider}.
 */
export type AudioContextValue = {
  /**
   * Plays a one-shot or unmanaged sound by alias.
   *
   * The provider applies the selected bucket volume and optional pitch variation
   * before forwarding to `@pixi/sound`. Global volume is handled by
   * `sound.volumeAll`.
   */
  play: (alias: string, options?: BucketedPlayOptions) => AudioPlayResult;
  /**
   * Plays an alias in a named queue slot, replacing the previous alias in that slot.
   *
   * Use this for music, ambience loops, voice lines, or any other long-running
   * audio where a game wants explicit replacement behavior.
   */
  queue: (
    alias: string,
    options?: QueueAudioOptions,
  ) => AudioPlayResult | undefined;
  /** Stops and clears a queued channel. */
  stopQueue: (channel?: AudioQueueChannel) => void;
  /** Stops and clears all queued channels managed by the provider. */
  stopAllQueues: () => void;
  /** Sets the global volume multiplier for all audio. */
  setGlobalVolume: (volume: number) => void;
  /** Sets the volume multiplier for any game-defined bucket. */
  setVolume: (bucket: AudioBucket, volume: number) => void;
  /** Reactive accessor for the global volume multiplier. */
  globalVolume: () => number;
  /** Reads the current volume multiplier for a bucket, defaulting to `1`. */
  volume: (bucket?: AudioBucket) => number;
  /** Reactive accessor for all explicitly configured bucket volumes. */
  volumes: () => Readonly<Record<AudioBucket, number>>;
  /** Reads queue metadata for a channel, defaulting to the `"default"` channel. */
  queued: (channel?: AudioQueueChannel) => QueuedAudio | undefined;
  /** Reactive accessor for all queued channels. */
  queues: () => Readonly<Record<AudioQueueChannel, QueuedAudio>>;
};

/**
 * Props for {@link AudioContextProvider}.
 */
export type AudioContextProviderProps = PixiNodeProps & {
  /** Optional localStorage key for games that want separate audio profiles. */
  settingsKey?: string;
  /** Optional default settings merged with {@link DEFAULT_AUDIO_SETTINGS}. */
  defaultSettings?: Partial<AudioSettings>;
};

const DEFAULT_QUEUE_CHANNEL = "default";

const AudioContext = createContext<AudioContextValue>();

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const mergeSettings = (
  defaults: AudioSettings,
  saved: AudioSettings | undefined,
): AudioSettings => ({
  globalVolume: saved?.globalVolume ?? defaults.globalVolume,
  volumes: {
    ...defaults.volumes,
    ...saved?.volumes,
  },
});

const resolveBucketVolume = (
  bucket: AudioBucket | undefined,
  volumes: Readonly<Record<AudioBucket, number>>,
) => (bucket ? (volumes[bucket] ?? 1) : 1);

/**
 * Reads the current audio context.
 *
 * @returns The nearest {@link AudioContextProvider} value.
 * @throws {Error} If called outside an `AudioContextProvider`.
 */
export const useAudioContext = () => {
  const audioContext = useContext(AudioContext);
  invariantUseContext(audioContext, "AudioContext");
  return audioContext;
};

/**
 * Provides a flexible, game-oriented audio API built on top of `@pixi/sound`.
 *
 * The provider centralizes common audio concerns without hard-coding game-specific
 * categories:
 * - persistent global and per-bucket volume settings;
 * - arbitrary buckets such as `music`, `sfx`, `voice`, `ambience`, or `ui`;
 * - arbitrary queue channels for replaceable long-running audio;
 * - optional pitch variation for repeated one-shot effects.
 *
 * @param props - Provider configuration and children.
 * @returns A Solid context provider wrapping `props.children`.
 *
 * @example
 * ```tsx
 * <AudioContextProvider
 *   defaultSettings={{ volumes: { music: 0.35, sfx: 0.8, ambience: 0.5 } }}
 * >
 *   <Game />
 * </AudioContextProvider>
 * ```
 *
 * @example
 * ```tsx
 * const audio = useAudioContext();
 * audio.queue("main-theme", { channel: "music", bucket: "music", loop: true });
 * audio.queue("rain-loop", { channel: "ambience", bucket: "ambience", loop: true });
 * audio.play("button-click", { bucket: "sfx", pitchVariance: 0.05 });
 * ```
 */
export const AudioContextProvider = (props: AudioContextProviderProps) => {
  const storage = createLocalStorage();
  const settingsKey = props.settingsKey ?? AUDIO_SETTINGS_KEY;
  const defaultSettings = mergeSettings(DEFAULT_AUDIO_SETTINGS, {
    ...DEFAULT_AUDIO_SETTINGS,
    ...props.defaultSettings,
    volumes: {
      ...DEFAULT_AUDIO_SETTINGS.volumes,
      ...props.defaultSettings?.volumes,
    },
  });
  const savedSettings = storage.get<AudioSettings>(settingsKey);
  const initialSettings = mergeSettings(defaultSettings, savedSettings);

  const [globalVolume, setGlobalVolume] = createSignal(
    initialSettings.globalVolume,
  );
  const [volumes, setVolumes] = createSignal<Record<AudioBucket, number>>({
    ...initialSettings.volumes,
  });
  const [queues, setQueues] = createSignal<
    Record<AudioQueueChannel, QueuedAudio>
  >({});

  const volume = (bucket?: AudioBucket) => resolveBucketVolume(bucket, volumes());

  const stopQueue = (channel = DEFAULT_QUEUE_CHANNEL) => {
    setQueues((currentQueues) => {
      const queued = currentQueues[channel];
      if (!queued) return currentQueues;

      sound.stop(queued.alias);
      const nextQueues = { ...currentQueues };
      delete nextQueues[channel];
      return nextQueues;
    });
  };

  const stopAllQueues = () => {
    setQueues((currentQueues) => {
      for (const queued of Object.values(currentQueues)) {
        sound.stop(queued.alias);
      }
      return {};
    });
  };

  const withBucketAndPitch = (options?: BucketedPlayOptions): PlayOptions => {
    const {
      bucket,
      varyPitch = true,
      pitchVariance = 0.1,
      ...playOptions
    } = options ?? {};
    const speed = varyPitch
      ? (playOptions.speed ?? 1) * randomInRange(1 - pitchVariance, 1 + pitchVariance)
      : playOptions.speed;

    return {
      ...playOptions,
      ...(speed === undefined ? {} : { speed }),
      volume: (playOptions.volume ?? 1) * volume(bucket),
    };
  };

  createEffect(() => {
    storage.upsert<AudioSettings>(settingsKey, {
      globalVolume: globalVolume(),
      volumes: volumes(),
    });
  });

  createEffect(() => {
    sound.volumeAll = globalVolume();
  });

  createEffect(() => {
    const currentQueues = queues();
    const currentVolumes = volumes();

    for (const queued of Object.values(currentQueues)) {
      sound.volume(
        queued.alias,
        queued.baseVolume * resolveBucketVolume(queued.bucket, currentVolumes),
      );
    }
  });

  onCleanup(stopAllQueues);

  const audioContext: AudioContextValue = {
    play: (alias, options) => sound.play(alias, withBucketAndPitch(options)),
    queue: (alias, options) => {
      const {
        channel = DEFAULT_QUEUE_CHANNEL,
        stopPrevious = true,
        bucket,
        ...playOptions
      } = options ?? {};
      const previous = queues()[channel];
      if (previous?.alias === alias) return undefined;

      const resolvedOptions = withBucketAndPitch({
        ...playOptions,
        bucket,
        loop: playOptions.loop ?? true,
      });
      const baseVolume = playOptions.volume ?? 1;
      const result = sound.play(alias, resolvedOptions);

      setQueues((currentQueues) => {
        const previous = currentQueues[channel];
        if (previous?.alias === alias) return currentQueues;
        if (previous && stopPrevious) sound.stop(previous.alias);

        return {
          ...currentQueues,
          [channel]: {
            alias,
            bucket,
            baseVolume,
          },
        };
      });

      return result;
    },
    stopQueue,
    stopAllQueues,
    setGlobalVolume,
    setVolume: (bucket, nextVolume) => {
      setVolumes((currentVolumes) => ({
        ...currentVolumes,
        [bucket]: nextVolume,
      }));
    },
    globalVolume,
    volume,
    volumes,
    queued: (channel = DEFAULT_QUEUE_CHANNEL) => queues()[channel],
    queues,
  };

  return (
    <AudioContext.Provider value={audioContext}>
      {props.children}
    </AudioContext.Provider>
  );
};
