/** One native-timeline origin shared by independently enabled visual effects. */
export class SharedBeatTimeline {
  private anchor?: { seconds: number; performance: number; timeline: number };

  reset(): void { this.anchor = undefined; }

  align(seconds: number, performanceNow: number, timelineNow: number, offsetMs: number): number {
    const anchor = this.anchor;
    // A seek or non-whole-beat media loop realigns both consumers. Ordinary
    // delayed callbacks advance source and performance clocks equally.
    if (!anchor || Math.abs(seconds - anchor.seconds - (performanceNow - anchor.performance) / 1000) > 0.12) {
      this.anchor = { seconds, performance: performanceNow, timeline: timelineNow };
    }
    return this.anchor!.timeline - this.anchor!.seconds * 1000 + offsetMs;
  }
}
