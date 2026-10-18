import { describe, expect, it } from 'vitest';
import { fitPetSize, PET_ENVELOPE, reflectAxis, resizeFlight, stepFlight, type FlightState } from '../src/pet/physics';
import { defaults, sanitizeSettings } from '../src/settings';
import { composePetFrames } from '../src/pet/engine';

const flight = (patch: Partial<FlightState> = {}): FlightState => ({
  x: 10, y: 20, vx: 100, vy: 80, width: 50, height: 50, collisions: 0, ...patch,
});

describe('pet settings and fixed squash/stretch', () => {
  it('migrates legacy modes and sanitizes finite size/speed boundaries', () => {
    expect(sanitizeSettings({ mode: 'pet', petSize: 10, petSpeed: 1000 })).toMatchObject({ pageEnabled: false, petEnabled: true, petSize: 80, petSpeed: 600 });
    expect(sanitizeSettings({ mode: 'page', petSize: 1000, petSpeed: 1 })).toMatchObject({ pageEnabled: true, petEnabled: false, petSize: 320, petSpeed: 40 });
    for (const bad of [null, undefined, NaN, Infinity, -Infinity, '200', {}]) {
      expect(sanitizeSettings({ mode: bad, petSize: bad, petSpeed: bad })).toMatchObject({ pageEnabled: true, petEnabled: false, petSize: 180, petSpeed: 180 });
    }
    expect(sanitizeSettings(null)).toEqual(defaults);
    expect(sanitizeSettings({ mode: 'pet' })).not.toHaveProperty('mode');
  });

  it('preserves independent booleans, including both enabled or disabled', () => {
    expect(sanitizeSettings({ pageEnabled: true, petEnabled: true })).toMatchObject({ pageEnabled: true, petEnabled: true });
    expect(sanitizeSettings({ pageEnabled: false, petEnabled: false })).toMatchObject({ pageEnabled: false, petEnabled: false });
    expect(sanitizeSettings({ mode: 'pet', pageEnabled: true, petEnabled: false })).toMatchObject({ pageEnabled: true, petEnabled: false });
    expect(sanitizeSettings({ mode: 'page', pageEnabled: false, petEnabled: true })).toMatchObject({ pageEnabled: false, petEnabled: true });
    expect(sanitizeSettings({ mode: 'pet', pageEnabled: true })).toMatchObject({ pageEnabled: true, petEnabled: true });
    expect(sanitizeSettings({ mode: 'page', petEnabled: true })).toMatchObject({ pageEnabled: true, petEnabled: true });
  });

  it('uses one unchanging opposite-axis wave and keeps every pose inside the collision envelope', () => {
    const size = 180;
    for (const preset of ['tipsy', 'party', 'wild'] as const) {
      const frames = composePetFrames({ ...defaults, preset, intensity: 100 }, size);
      const scales: number[] = [];
      for (const frame of frames) {
        const hop = Number.parseFloat(String(frame.translate).split(' ')[1]);
        const [sx, sy] = String(frame.scale).split(' ').map(Number);
        expect((sx - 1) * (sy - 1)).toBeLessThanOrEqual(0);
        expect(sx * size).toBeLessThanOrEqual(size * PET_ENVELOPE);
        expect(Math.abs(hop) + sy * size / 2).toBeLessThanOrEqual(size * PET_ENVELOPE / 2);
        scales.push(sy);
      }
      const reversals = scales.slice(1).map((value, index) => Math.sign(value - scales[index])).filter(Boolean);
      expect(reversals.slice(1).filter((sign, index) => sign !== reversals[index])).toHaveLength(2);
      expect(frames[0].scale).toBe(frames.at(-1)!.scale);
      expect(frames[0].translate).toBe(frames.at(-1)!.translate);
      expect(composePetFrames({ ...defaults, preset, intensity: 100 }, size)).toEqual(frames);
    }
  });
});

describe('constant-speed reflected pet flight', () => {
  it('reflects every wall crossed by a large delayed frame', () => {
    expect(reflectAxis(20, 100, 100, 5.5)).toEqual({ position: 30, velocity: -100, collisions: 5 });
    expect(reflectAxis(20, -100, 100, 5.5)).toEqual({ position: 70, velocity: -100, collisions: 6 });
  });
  it('reflects correctly at exact boundaries, including an outward start', () => {
    expect(reflectAxis(20, 80, 100, 1)).toEqual({ position: 100, velocity: -80, collisions: 1 });
    expect(reflectAxis(20, -20, 100, 1)).toEqual({ position: 0, velocity: 20, collisions: 1 });
    expect(reflectAxis(100, 20, 100, 1)).toEqual({ position: 80, velocity: -20, collisions: 1 });
    expect(reflectAxis(0, -20, 100, 1)).toEqual({ position: 20, velocity: 20, collisions: 1 });
  });
  it('gives the same path and speed at 30/60/144 Hz and across a visible stall', () => {
    const original = flight({ x: 71, y: 37, vx: -172, vy: 113 });
    const single = stepFlight(original, 800, 600, 17.25);
    for (const hz of [30, 60, 144]) {
      let current = original;
      const frames = hz * 17;
      for (let i = 0; i < frames; i++) current = stepFlight(current, 800, 600, 1 / hz);
      current = stepFlight(current, 800, 600, 0.25);
      expect(current.x).toBeCloseTo(single.x, 7);
      expect(current.y).toBeCloseTo(single.y, 7);
      expect(current.vx).toBe(single.vx); expect(current.vy).toBe(single.vy);
      expect(current.collisions).toBe(single.collisions);
      expect(Math.hypot(current.vx, current.vy)).toBe(Math.hypot(original.vx, original.vy));
    }
  });
  it('reflects both axes at a corner without gravity or random direction changes', () => {
    const next = stepFlight(flight({ x: 240, y: 140, vx: 10, vy: 10 }), 300, 200, 1);
    expect(next).toMatchObject({ x: 250, y: 150, vx: -10, vy: -10, collisions: 2 });
  });
  it('fits the full deformation envelope and clamps on resize without losing velocity', () => {
    const size = fitPetSize(320, 110, 80);
    expect(size * PET_ENVELOPE).toBeCloseTo(80);
    const next = resizeFlight(flight({ x: 500, y: 500 }), size, 110, 80);
    expect(next.x).toBeCloseTo(30); expect(next.y).toBeCloseTo(0);
    expect(next.vx).toBe(100); expect(next.vy).toBe(80);
    expect(fitPetSize(180, 1920, 1080)).toBe(180);
    expect(stepFlight(next, 0, 0, 10)).toMatchObject({ x: 0, y: 0, vx: 100, vy: 80 });
  });
});
