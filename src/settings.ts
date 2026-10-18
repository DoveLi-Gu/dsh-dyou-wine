export const categories = ['messages', 'text', 'input', 'sidebar', 'controls', 'tools', 'dialogs'] as const;
export type Category = typeof categories[number];
export type Preset = 'tipsy' | 'party' | 'wild';
export interface WineSettings {
  pageEnabled: boolean;
  petEnabled: boolean;
  musicEnabled: boolean;
  petSize: number;
  petSpeed: number;
  preset: Preset;
  intensity: number;
  bpm: number;
  offsetMs: number;
  volume: number;
  loop: boolean;
  hiddenAudio: boolean;
  shortcut: string;
  ranges: Record<Category, boolean>;
}
export const defaults: WineSettings = {
  pageEnabled: true, petEnabled: false, musicEnabled: false, petSize: 180, petSpeed: 180,
  preset: 'party', intensity: 65, bpm: 120, offsetMs: 0, volume: 0.5,
  loop: true, hiddenAudio: false, shortcut: 'Escape',
  ranges: Object.fromEntries(categories.map(key => [key, true])) as Record<Category, boolean>,
};
const bounded = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export function sanitizeSettings(value: unknown): WineSettings {
  const v = value && typeof value === 'object' ? value as Partial<WineSettings> & { mode?: unknown } : {};
  const legacyPet = v.mode === 'pet';
  return {
    pageEnabled: typeof v.pageEnabled === 'boolean' ? v.pageEnabled : !legacyPet,
    petEnabled: typeof v.petEnabled === 'boolean' ? v.petEnabled : legacyPet,
    musicEnabled: v.musicEnabled === true,
    petSize: bounded(v.petSize, defaults.petSize, 80, 320),
    petSpeed: bounded(v.petSpeed, defaults.petSpeed, 40, 600),
    preset: ['tipsy', 'party', 'wild'].includes(v.preset ?? '') ? v.preset! : defaults.preset,
    intensity: bounded(v.intensity, defaults.intensity, 0, 100),
    bpm: bounded(v.bpm, defaults.bpm, 60, 200),
    offsetMs: bounded(v.offsetMs, 0, -250, 250),
    volume: bounded(v.volume, 0.5, 0, 1), loop: typeof v.loop === 'boolean' ? v.loop : true,
    hiddenAudio: v.hiddenAudio === true,
    shortcut: typeof v.shortcut === 'string' && /^(Escape|[A-Za-z]|F[2-9])$/.test(v.shortcut) ? v.shortcut : 'Escape',
    ranges: Object.fromEntries(categories.map(key => [key, typeof v.ranges?.[key] === 'boolean' ? v.ranges[key] : true])) as Record<Category, boolean>,
  };
}
