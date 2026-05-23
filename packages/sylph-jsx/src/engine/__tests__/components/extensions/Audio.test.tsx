import { beforeEach, describe, expect, test, vi } from "vitest";
import { setImmediate } from "node:timers/promises";
import { createRoot } from "../../../../pixi-jsx/solidjs-universal-renderer/index.js";
import { renderApplicationWithFakeTicker } from "../../../../__tests__/test-utils/test-utils.js";
import {
  AUDIO_SETTINGS_KEY,
  AudioContextProvider,
  DEFAULT_AUDIO_SETTINGS,
  useAudioContext,
  type AudioContextValue,
} from "../../../components/extensions/Audio.jsx";

const soundMock = vi.hoisted(() => {
  const state = {
    volumeAll: 1,
    volumeAllWrites: [] as number[],
  };

  const sound = {
    play: vi.fn((alias: string, options?: unknown) => ({ alias, options })),
    stop: vi.fn(),
    volume: vi.fn(),
    get volumeAll() {
      return state.volumeAll;
    },
    set volumeAll(value: number) {
      state.volumeAll = value;
      state.volumeAllWrites.push(value);
    },
  };

  return {
    state,
    sound,
    reset: () => {
      state.volumeAll = 1;
      state.volumeAllWrites.length = 0;
      sound.play.mockClear();
      sound.stop.mockClear();
      sound.volume.mockClear();
    },
  };
});

vi.mock("@pixi/sound", () => ({
  sound: soundMock.sound,
}));

const flushEffects = async () => {
  await setImmediate();
};

const renderAudioProvider = async (
  props: Parameters<typeof AudioContextProvider>[0] = {},
) => {
  let audioContext: AudioContextValue | undefined;

  const CaptureContext = () => {
    audioContext = useAudioContext();
    return <container />;
  };

  const renderResult = await renderApplicationWithFakeTicker(() => (
    <AudioContextProvider {...props}>
      <CaptureContext />
    </AudioContextProvider>
  ));

  expect(audioContext).toBeDefined();
  await flushEffects();

  return {
    ...renderResult,
    audioContext: audioContext!,
  };
};

describe("AudioContextProvider", () => {
  beforeEach(() => {
    soundMock.reset();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test("useAudioContext throws outside AudioContextProvider", () => {
    expect(() => {
      createRoot((dispose) => {
        try {
          useAudioContext();
        } finally {
          dispose();
        }
      });
    }).toThrow(/AudioContext/);
  });

  test("exposes context accessors with generic default settings", async () => {
    const { audioContext, dispose } = await renderAudioProvider();

    expect(audioContext.globalVolume()).toBe(DEFAULT_AUDIO_SETTINGS.globalVolume);
    expect(audioContext.volumes()).toEqual({});
    expect(audioContext.volume()).toBe(1);
    expect(audioContext.volume("missing-bucket")).toBe(1);
    expect(audioContext.queued()).toBeUndefined();
    expect(audioContext.queues()).toEqual({});
    expect(typeof audioContext.play).toBe("function");
    expect(typeof audioContext.queue).toBe("function");

    dispose();
  });

  test("loads saved global and arbitrary bucket volumes, then persists updates", async () => {
    window.localStorage.setItem(
      AUDIO_SETTINGS_KEY,
      JSON.stringify({
        globalVolume: 0.4,
        volumes: {
          music: 0.2,
          voice: 0.8,
        },
      }),
    );

    const { audioContext, dispose } = await renderAudioProvider();

    expect(audioContext.globalVolume()).toBe(0.4);
    expect(audioContext.volume("music")).toBe(0.2);
    expect(audioContext.volume("voice")).toBe(0.8);
    expect(soundMock.state.volumeAllWrites).toContain(0.4);

    audioContext.setGlobalVolume(0.75);
    audioContext.setVolume("music", 0.35);
    audioContext.setVolume("ambience", 0.6);
    await flushEffects();

    expect(JSON.parse(window.localStorage.getItem(AUDIO_SETTINGS_KEY)!)).toEqual({
      globalVolume: 0.75,
      volumes: {
        music: 0.35,
        voice: 0.8,
        ambience: 0.6,
      },
    });
    expect(soundMock.state.volumeAllWrites.at(-1)).toBe(0.75);

    dispose();
  });

  test("plays sounds with selected bucket volume and pitch variation", async () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.25);
    const { audioContext, dispose } = await renderAudioProvider({
      defaultSettings: {
        volumes: {
          sfx: 0.4,
          voice: 0.7,
        },
      },
    });

    const playResult = audioContext.play("hit", {
      bucket: "sfx",
      speed: 2,
      volume: 0.5,
      pitchVariance: 0.2,
      loop: false,
    });

    expect(playResult).toEqual({
      alias: "hit",
      options: expect.objectContaining({ speed: 1.8, volume: 0.2 }),
    });
    expect(soundMock.sound.play).toHaveBeenCalledWith("hit", {
      speed: 1.8,
      volume: 0.2,
      loop: false,
    });
    expect(randomSpy).toHaveBeenCalledTimes(1);

    audioContext.play("line", {
      bucket: "voice",
      speed: 3,
      varyPitch: false,
    });
    expect(soundMock.sound.play).toHaveBeenLastCalledWith("line", {
      speed: 3,
      volume: 0.7,
    });
    expect(randomSpy).toHaveBeenCalledTimes(1);

    dispose();
  });

  test("applies global volume changes to the sound library", async () => {
    const { audioContext, dispose } = await renderAudioProvider();

    audioContext.setGlobalVolume(0);
    await flushEffects();
    expect(soundMock.sound.volumeAll).toBe(0);

    audioContext.setGlobalVolume(0.5);
    await flushEffects();
    expect(soundMock.sound.volumeAll).toBe(0.5);

    dispose();
  });

  test("queues aliases in arbitrary channels and stops only replaced channel audio", async () => {
    const { audioContext, dispose } = await renderAudioProvider({
      defaultSettings: {
        volumes: {
          music: 0.25,
          ambience: 0.5,
        },
      },
    });

    const firstResult = audioContext.queue("track-a", {
      channel: "music",
      bucket: "music",
      volume: 0.8,
    });
    expect(firstResult).toEqual({
      alias: "track-a",
      options: expect.objectContaining({ loop: true, volume: 0.2 }),
    });
    expect(audioContext.queued("music")).toEqual({
      alias: "track-a",
      bucket: "music",
      baseVolume: 0.8,
    });

    audioContext.queue("rain", {
      channel: "ambience",
      bucket: "ambience",
      loop: true,
    });
    expect(soundMock.sound.stop).not.toHaveBeenCalled();
    expect(audioContext.queued("ambience")?.alias).toBe("rain");

    const duplicateResult = audioContext.queue("track-a", {
      channel: "music",
      bucket: "music",
    });
    expect(duplicateResult).toBeUndefined();
    expect(soundMock.sound.play).toHaveBeenCalledTimes(2);

    audioContext.queue("track-b", {
      channel: "music",
      bucket: "music",
    });
    expect(soundMock.sound.stop).toHaveBeenCalledWith("track-a");
    expect(soundMock.sound.stop).not.toHaveBeenCalledWith("rain");
    expect(audioContext.queued("music")?.alias).toBe("track-b");
    expect(audioContext.queued("ambience")?.alias).toBe("rain");

    dispose();
    expect(soundMock.sound.stop).toHaveBeenCalledWith("track-b");
    expect(soundMock.sound.stop).toHaveBeenCalledWith("rain");
  });

  test("updates queued channel volumes when arbitrary bucket volumes change", async () => {
    const { audioContext, dispose } = await renderAudioProvider({
      defaultSettings: {
        volumes: {
          music: 0.25,
          ambience: 0.5,
        },
      },
    });

    audioContext.queue("track-a", {
      channel: "music",
      bucket: "music",
      volume: 0.8,
    });
    audioContext.queue("rain", {
      channel: "ambience",
      bucket: "ambience",
      volume: 0.4,
    });

    audioContext.setVolume("music", 0.5);
    await flushEffects();
    expect(soundMock.sound.volume).toHaveBeenCalledWith("track-a", 0.4);
    expect(soundMock.sound.volume).toHaveBeenCalledWith("rain", 0.2);

    audioContext.setVolume("ambience", 0.25);
    await flushEffects();
    expect(soundMock.sound.volume).toHaveBeenCalledWith("track-a", 0.4);
    expect(soundMock.sound.volume).toHaveBeenLastCalledWith("rain", 0.1);

    dispose();
  });

  test("stops a single queue or all queues", async () => {
    const { audioContext, dispose } = await renderAudioProvider();

    audioContext.queue("track-a", { channel: "music" });
    audioContext.queue("rain", { channel: "ambience" });

    audioContext.stopQueue("music");
    expect(soundMock.sound.stop).toHaveBeenCalledWith("track-a");
    expect(audioContext.queued("music")).toBeUndefined();
    expect(audioContext.queued("ambience")?.alias).toBe("rain");

    audioContext.stopAllQueues();
    expect(soundMock.sound.stop).toHaveBeenCalledWith("rain");
    expect(audioContext.queues()).toEqual({});

    dispose();
  });

  test("supports custom settings keys and default bucket volumes", async () => {
    const { audioContext, dispose } = await renderAudioProvider({
      settingsKey: "menu-audio",
      defaultSettings: {
        globalVolume: 0.9,
        volumes: {
          ui: 0.8,
          music: 0.1,
        },
      },
    });

    expect(audioContext.globalVolume()).toBe(0.9);
    expect(audioContext.volume("ui")).toBe(0.8);
    expect(audioContext.volume("music")).toBe(0.1);
    expect(window.localStorage.getItem(AUDIO_SETTINGS_KEY)).toBeNull();
    expect(JSON.parse(window.localStorage.getItem("menu-audio")!)).toEqual({
      globalVolume: 0.9,
      volumes: {
        ui: 0.8,
        music: 0.1,
      },
    });

    dispose();
  });
});
