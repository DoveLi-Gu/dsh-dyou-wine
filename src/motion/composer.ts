import type { Category, Preset, WineSettings } from '../settings';

// A single smooth stretch/squash cycle, without flights or secondary rebounds.
// Sampling the same analytic curve keeps every region on the same beat and
// gives linear WAAPI interpolation enough poses for a smooth, repeating shape.
const samples = 32;
const presets: Record<Preset, { stretch: number; squash: number }> = {
  tipsy: { stretch: 0.20, squash: 0.25 },
  party: { stretch: 0.45, squash: 0.55 },
  wild: { stretch: 0.55, squash: 0.70 },
};
const weights: Record<Category, number> = {
  messages: 1, text: 0.85, input: 0.55, sidebar: 0.65,
  controls: 0.45, tools: 0.75, dialogs: 0.38,
};

/** The geometric series is < 1, even with arbitrarily deep animated ancestors. */
export function amplitudeBudget(category: Category, animatedAncestors: number): number {
  return 0.62 * weights[category] * 0.32 ** Math.max(0, animatedAncestors);
}

export function beatPosition(seconds: number, bpm: number, offsetMs = 0, delayMs = 0): number {
  const duration = 60 / Math.max(60, Math.min(200, bpm));
  const time = seconds - (offsetMs + delayMs) / 1000;
  return ((time % duration) + duration) % duration * 1000;
}

/** Legacy four-beat helper; the visual engine uses a fixed amplitude every beat. */
export function beatAccent(seconds: number, bpm: number, offsetMs = 0): number {
  const beat = Math.floor((seconds * 1000 - offsetMs) * Math.max(60, Math.min(200, bpm)) / 60000);
  const accent = ((beat % 4) + 4) % 4;
  return [1, 0.78, 0.88, 0.78][accent];
}

export function composeFrames(settings: WineSettings, category: Category, depth: number,
  _degradation = 0, gain = 1, anchorBottom = true): Keyframe[] {
  // Keep the legacy argument for consumers of the pure composer. Performance
  // protection limits the number of roots; it never changes a retained wave.
  const preset = presets[settings.preset];
  const amplitude = amplitudeBudget(category, depth) * settings.intensity / 100
    * Math.max(0, Math.min(1, gain));
  return Array.from({ length: samples + 1 }, (_, index) => {
    const offset = index / samples;
    // Exact neutral poses avoid tiny floating-point transforms at the seam.
    const sine = index % (samples / 2) === 0 ? 0 : Math.sin(offset * Math.PI * 2);
    const deformation = (preset.stretch + preset.squash) / 2 * sine
      + (preset.stretch - preset.squash) / 2 * sine * sine;
    const scaleY = 1 + deformation * amplitude;
    return {
      offset, easing: 'linear',
      // This origin belongs to our cancellable WAAPI effect, never element.style.
      // Preserve the host's geometry when its transform needs its original origin.
      ...(anchorBottom && amplitude > 0 ? { transformOrigin: '50% 100%' } : {}),
      // Softer inverse compensation follows the reference's opposing axes
      // without making wide text expand as much as strict area conservation.
      scale: `${scaleY ** -0.5} ${scaleY}`,
      rotate: '0deg',
      translate: '0 0px',
    };
  });
}

/** Reserve one visible target per category, then distribute the remaining budget fairly. */
export function selectWithinBudget<T extends { category: Category }>(items: T[], limit: number): T[] {
  const groups = new Map<Category, T[]>();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  const selected: T[] = [];
  const queues = [...groups.values()];
  for (let index = 0; selected.length < Math.max(0, limit); index++) {
    let found = false;
    for (const queue of queues) {
      if (queue[index] && selected.length < limit) {
        selected.push(queue[index]);
        found = true;
      }
    }
    if (!found) break;
  }
  return selected;
}
