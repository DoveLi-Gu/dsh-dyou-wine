export function percentile(values: readonly number[], fraction = 0.95): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

/** Bounded rolling telemetry; protection changes coverage, never the native wave. */
export class PerformanceGovernor {
  level = 0;
  private frames: number[] = [];
  private callbacks: number[] = [];
  private ticks = 0;
  private healthyWindows = 0;
  get frameP95(): number { return percentile(this.frames); }
  get callbackP95(): number { return percentile(this.callbacks); }
  get budget(): number { return [120, 80, 48, 28][this.level]; }
  // Retained as a compatibility accessor. Browser timelines render every frame.
  get sampleEvery(): number { return 1; }
  record(frameMs: number, callbackMs: number): boolean {
    if (frameMs > 0 && frameMs < 250) this.frames.push(frameMs);
    this.callbacks.push(Math.max(0, callbackMs));
    if (this.frames.length > 180) this.frames.shift();
    if (this.callbacks.length > 180) this.callbacks.shift();
    if (++this.ticks % 60 || this.frames.length < 90) return false;
    const previous = this.level;
    if (this.frameP95 > 22 || this.callbackP95 > 3) {
      this.level = Math.min(3, this.level + 1);
      this.healthyWindows = 0;
    } else if (this.frameP95 < 19 && this.callbackP95 < 1.8) {
      if (++this.healthyWindows >= 5) {
        this.level = Math.max(0, this.level - 1);
        this.healthyWindows = 0;
      }
    } else this.healthyWindows = 0;
    return previous !== this.level;
  }
}
