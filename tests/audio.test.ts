import { describe, expect, it } from 'vitest';
import { BeatClock, tapBpm } from '../src/audio/clock';
import { sanitizeSettings } from '../src/settings';

describe('unified clock', () => {
  it('pauses without drift, resumes and resets', () => {
    let now = 10; const clock = new BeatClock(() => now);
    clock.start(); now = 12.5; expect(clock.time).toBe(2.5);
    clock.pause(); now = 100; expect(clock.time).toBe(2.5);
    clock.start(); now = 101; expect(clock.time).toBe(3.5);
    clock.reset(); expect(clock.time).toBe(0);
  });
  it('uses median taps, ignores bounce and bounds tempo', () => {
    expect(tapBpm([0,500,1000,1500])).toBe(120);
    expect(tapBpm([0,10])).toBeUndefined();
    expect(tapBpm([0,300,600,900])).toBe(200);
    expect(tapBpm([0,1500,3000])).toBe(60);
  });
});
describe('settings loaded from untrusted local storage', () => {
  it('clamps settings, handles partial data and keeps all ranges', () => {
    const settings = sanitizeSettings({ bpm: 900, intensity: -1, offsetMs: NaN, ranges: {text:false}, shortcut:'Delete' });
    expect(settings.bpm).toBe(200); expect(settings.intensity).toBe(0);
    expect(settings.offsetMs).toBe(0); expect(settings.shortcut).toBe('Escape');
    expect(settings.ranges.text).toBe(false); expect(settings.ranges.input).toBe(true);
  });
});
