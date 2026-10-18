/** A single seconds clock; changing the visual preset never resets its position. */
export class BeatClock {
  private anchor = 0;
  private elapsed = 0;
  private running = false;
  constructor(private readonly now = () => performance.now() / 1000) {}
  get time(): number { return this.elapsed + (this.running ? this.now() - this.anchor : 0); }
  start(): void { if (!this.running) { this.anchor = this.now(); this.running = true; } }
  pause(): void { this.elapsed = this.time; this.running = false; }
  reset(): void { this.running = false; this.elapsed = 0; this.anchor = this.now(); }
}
export function tapBpm(taps: number[]): number | undefined {
  if (taps.length < 3) return;
  const intervals = taps.slice(1).map((tap, i) => tap - taps[i]).filter(n => n > 200 && n < 2000).sort((a,b) => a-b);
  if (intervals.length < 2) return;
  return Math.max(60, Math.min(200, Math.round(60000 / intervals[Math.floor(intervals.length / 2)])));
}
