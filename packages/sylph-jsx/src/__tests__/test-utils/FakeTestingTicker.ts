import { Ticker } from "pixi.js";
import { setImmediate } from "node:timers/promises";

/**
 * This is a mock ticker that can be used for integration tests.
 * It explicitly opts out of requestAnimationFrame and exposes additional methods
 * to exhibit precise control over when update is called and with precise elapsed ms and delta times
 *
 * To read more about the public api of Pixi Ticker see: https://pixijs.com/8.x/guides/components/ticker
 * See API here: https://pixijs.download/release/docs/ticker.Ticker.html
 * See sourcecode here: https://github.com/pixijs/pixijs/blob/v8.14.0/src/ticker/Ticker.ts
 */
export class FakeTestingTicker extends Ticker {
  constructor() {
    super();
    this.autoStart = false;
    this.maxFPS = 0; // No FPS limiting in tests
    this.minFPS = 0; // No FPS floor in tests
  }

  /**
   * Override start() to prevent requestAnimationFrame from being used.
   * Simply sets started flag to true for test control.
   */
  override start() {
    if (this.started) return;
    this.started = true;
  }

  /**
   * Override stop() to prevent requestAnimationFrame cancellation.
   * Simply sets started flag to false.
   */
  override stop() {
    if (!this.started) return;
    this.started = false;
  }

  /**
   * Manually advance the ticker by a specific amount of time.
   * This triggers all registered listener callbacks with precise timing control.
   *
   * @param deltaMS - Milliseconds elapsed since last frame (default: 16.67ms ≈ 60fps)
   */
  tick(deltaMS: number = 16.67) {
    if (!this.started) return;

    // Initialize lastTime if this is the first tick
    if (this.lastTime === -1) {
      this.lastTime = performance.now();
    }

    const now = this.lastTime + deltaMS;

    // Call parent update() with the simulated timestamp
    // This will calculate deltaTime, invoke listeners, etc.
    this.update(now);
  }

  /**
   * Advance multiple frames at once with consistent timing.
   * Useful for fast-forwarding through animations in tests.
   *
   * @param frames - Number of frames to advance
   * @param msPerFrame - Milliseconds per frame (default: 16.67ms ≈ 60fps)
   */
  async tickFrames(frames: number, msPerFrame: number = 17) {
    for (let i = 0; i < frames; i++) {
      this.tick(msPerFrame);
      await setImmediate();
    }
  }

  /**
   * Reset ticker state for a fresh test.
   * Stops the ticker and resets the time tracking.
   */
  reset() {
    this.stop();
    this.lastTime = -1;
  }
}
