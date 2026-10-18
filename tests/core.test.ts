import { describe, expect, it } from 'vitest';
import { categories, defaults, type Category } from '../src/settings';
import { amplitudeBudget, beatPosition, composeFrames, selectWithinBudget } from '../src/motion/composer';
import { percentile, PerformanceGovernor } from '../src/motion/governor';

const verticalPosition = (frame: Keyframe) => Number.parseFloat(String(frame.translate).split(' ')[1]);
const verticalScale = (frame: Keyframe) => Number(String(frame.scale).split(' ')[1]);

describe('unified periodic squash and stretch', () => {
  it('keeps the same absolute phase over eight beats, looped audio and negative startup times', () => {
    for (const bpm of [60, 120, 200]) {
      const duration = 60 / bpm;
      for (let beat = 0; beat < 8; beat++) {
        for (const phase of [0, 0.125, 0.25, 0.5, 0.75, 0.875]) {
          const delta = Math.abs(beatPosition((beat + phase) * duration, bpm) - phase * duration * 1000);
          // Floating point modulo can represent phase zero as the final
          // nanosecond of the preceding cycle; both render the same neutral.
          expect(Math.min(delta, duration * 1000 - delta)).toBeLessThan(0.005);
        }
      }
    }
    expect(beatPosition(121.25, 120)).toBeCloseTo(250);
    expect(beatPosition(1.25, 120, 100)).toBeCloseTo(150);
    expect(beatPosition(0, 120, 250)).toBeCloseTo(250);
  });

  it('uses one smooth stretch and one smooth squash per cycle without rebound tails', () => {
    const frames = composeFrames(defaults, 'messages', 0);
    const scales = frames.map(verticalScale);
    const signs = scales.slice(1).map((scale, index) => Math.sign(scale - scales[index])).filter(Boolean);
    const reversals = signs.slice(1).filter((sign, index) => sign !== signs[index]).length;
    expect(reversals).toBe(2);
    expect(scales.filter((value, index) => index > 0 && index < scales.length - 1
      && value > scales[index - 1] && value > scales[index + 1])).toHaveLength(1);
    expect(scales.filter((value, index) => index > 0 && index < scales.length - 1
      && value < scales[index - 1] && value < scales[index + 1])).toHaveLength(1);
    expect(frames.find(frame => frame.offset === 0.25)).toBeDefined();
    expect(verticalScale(frames.find(frame => frame.offset === 0.25)!)).toBe(Math.max(...scales));
    expect(verticalScale(frames.find(frame => frame.offset === 0.75)!)).toBe(Math.min(...scales));
  });

  it('keeps the bottom grounded with opposite horizontal and vertical deformation', () => {
    for (const category of categories) {
      const frames = composeFrames(defaults, category, 0);
      for (const frame of frames) {
        const [sx, sy] = String(frame.scale).split(' ').map(Number);
        expect(sx).toBeGreaterThan(0);
        expect(sy).toBeGreaterThan(0);
        expect((sx - 1) * (sy - 1)).toBeLessThanOrEqual(0);
        expect(verticalPosition(frame)).toBe(0);
        expect(frame.rotate).toBe('0deg');
        expect(frame.transformOrigin).toBe('50% 100%');
        expect(frame).not.toHaveProperty('transform');
      }
      expect(frames[0]).toMatchObject({ offset: 0, scale: '1 1' });
      expect(frames.find(frame => frame.offset === 0.5)).toMatchObject({ scale: '1 1' });
      expect(frames.at(-1)).toMatchObject({ offset: 1, scale: '1 1' });
    }
  });

  it('shows a clear height change at the shipped party intensity without shifting vertically', () => {
    for (const category of ['messages', 'sidebar'] as const) {
      const frames = composeFrames(defaults, category, 0);
      expect(Math.min(...frames.map(verticalScale))).toBeLessThan(0.9);
      expect(Math.max(...frames.map(verticalScale))).toBeGreaterThan(1.1);
      expect(frames.every(frame => frame.translate === '0 0px' && frame.rotate === '0deg')).toBe(true);
    }
  });

  it('keeps identical deformation at every performance level', () => {
    const reference = composeFrames(defaults, 'messages', 0);
    for (const level of [1, 2, 3]) {
      expect(composeFrames(defaults, 'messages', 0, level)).toEqual(reference);
    }
  });

  it('keeps all presets reversible and leaves neutral or unsafe host origins untouched', () => {
    for (const preset of ['tipsy', 'party', 'wild'] as const) {
      for (const frame of composeFrames({ ...defaults, preset, intensity: 100 }, 'messages', 0)) {
        for (const scale of String(frame.scale).split(' ').map(Number)) expect(scale).toBeGreaterThan(0.5);
      }
    }
    const zeroIntensity = composeFrames({ ...defaults, intensity: 0 }, 'messages', 0);
    const zeroGain = composeFrames(defaults, 'messages', 0, 0, 0);
    const hostTransform = composeFrames(defaults, 'messages', 0, 0, 1, false);
    for (const frames of [zeroIntensity, zeroGain, hostTransform]) {
      expect(frames.every(frame => !('transformOrigin' in frame))).toBe(true);
    }
    for (const frames of [zeroIntensity, zeroGain]) {
      expect(frames.every(frame => frame.scale === '1 1' && verticalPosition(frame) === 0)).toBe(true);
    }
    expect(amplitudeBudget('controls', 0)).toBeLessThan(amplitudeBudget('messages', 0));
  });
});
describe('visible target budget', () => {
  it('reserves coverage across every enabled category in a long conversation', () => {
    const items = [
      ...Array.from({ length: 1000 }, (_, index) => ({ category: 'messages' as Category, index })),
      ...categories.filter(category => category !== 'messages').map(category => ({ category, index: 0 })),
    ];
    const chosen = selectWithinBudget(items, 120);
    expect(chosen).toHaveLength(120);
    expect(new Set(chosen.map(target => target.category)).size).toBe(categories.length);
    expect(new Set(chosen).size).toBe(chosen.length);
    expect(selectWithinBudget(items, 0)).toEqual([]);
    expect(selectWithinBudget(items.slice(0, 3), 120)).toHaveLength(3);
  });
});

describe('performance governor', () => {
  it('computes nearest rank p95 without mutating samples', () => {
    const samples = Array.from({ length: 100 }, (_, index) => 100 - index);
    expect(percentile(samples)).toBe(95);
    expect(samples[0]).toBe(100);
    expect(percentile([])).toBe(0);
  });

  it('degrades sustained slow frames and preserves a hard maximum target budget', () => {
    const governor = new PerformanceGovernor();
    expect(governor.budget).toBe(120);
    for (let i = 0; i < 120; i++) governor.record(30, 1);
    expect(governor.level).toBe(1);
    expect(governor.budget).toBe(80);
    for (let i = 0; i < 240; i++) governor.record(30, 1);
    expect(governor.level).toBe(3);
    expect(governor.budget).toBe(28);
    expect(governor.sampleEvery).toBe(1);
  });

  it('also degrades excessive callback costs and only recovers after stable windows', () => {
    const governor = new PerformanceGovernor();
    for (let i = 0; i < 120; i++) governor.record(16.7, 4);
    expect(governor.level).toBe(1);
    for (let i = 0; i < 180; i++) governor.record(16.7, 0.3);
    const degraded = governor.level;
    expect(degraded).toBeGreaterThan(0);
    for (let i = 0; i < 900; i++) governor.record(16.7, 0.3);
    expect(governor.level).toBeLessThan(degraded);
    expect(governor.frameP95).toBeCloseTo(16.7);
  });

  it('ignores a background tab resume gap as frame telemetry', () => {
    const governor = new PerformanceGovernor();
    for (let i = 0; i < 120; i++) governor.record(16.7, 0.2);
    governor.record(60_000, 0.2);
    expect(governor.level).toBe(0);
    expect(governor.frameP95).toBeCloseTo(16.7);
  });
});
