import { BeatClock, tapBpm } from './audio/clock';
import { LocalAudio } from './audio/local-audio';
import { SharedBeatTimeline } from './audio/timeline';
import { BundledMusic } from './audio/bundled-music';
import { WineEngine } from './motion/engine';
import { PetEngine } from './pet/engine';
import { defaults, sanitizeSettings, type WineSettings } from './settings';

export type WineState = 'stopped' | 'running' | 'paused';
export class WineController {
  settings: WineSettings;
  state: WineState = 'stopped';
  error = '';
  readonly audio: LocalAudio;
  readonly music: BundledMusic;
  readonly engine: WineEngine;
  readonly pet: PetEngine;
  readonly reducedMotion: MediaQueryList;
  private readonly clock = new BeatClock();
  private readonly timeline = new SharedBeatTimeline();
  private taps: number[] = [];
  private resumeOnVisible = false;
  private disposed = false;
  private generation = 0;
  private readonly runningEffects = new Set<'pageEnabled' | 'petEnabled'>();
  private readonly listeners = new Set<() => void>();
  constructor(private readonly doc: Document) {
    let saved: unknown;
    try { saved = JSON.parse(doc.defaultView!.localStorage.getItem('dsh-dyou-wine.settings.v1') ?? 'null'); } catch { /* storage is optional */ }
    this.settings = sanitizeSettings(saved ?? defaults);
    // Retired controls must not leave invisible preferences that suppress
    // coverage, silence the motion or contradict the compact panel's beat.
    Object.assign(this.settings, {
      bpm: defaults.bpm, offsetMs: defaults.offsetMs, intensity: defaults.intensity,
      petSize: defaults.petSize, petSpeed: defaults.petSpeed,
      ranges: { ...defaults.ranges }, loop: true, hiddenAudio: false, shortcut: 'Escape',
    });
    this.audio = new LocalAudio(doc, () => this.pause());
    this.music = new BundledMusic(doc, () => {
      this.error = 'musicLoadError';
      this.emit();
    });
    this.engine = new WineEngine(doc, () => this.audio.loaded ? this.audio.time : this.clock.time, err => this.fail(err), this.timeline);
    this.pet = new PetEngine(doc, () => this.audio.loaded ? this.audio.time : this.clock.time, err => this.fail(err), this.timeline);
    this.reducedMotion = doc.defaultView!.matchMedia('(prefers-reduced-motion: reduce)');
    doc.addEventListener('keydown', this.keydown);
    doc.addEventListener('visibilitychange', this.visibility);
    this.reducedMotion.addEventListener('change', this.motionChange);
  }
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private emit(): void { for (const listener of this.listeners) listener(); }
  private motionChange = () => { if (this.reducedMotion.matches) this.pause(); this.emit(); };
  private keydown = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === this.settings.shortcut.toLowerCase()) this.stop();
    // No preventDefault/stopPropagation: preserve host keyboard handling, including Escape.
  };
  private visibility = () => {
    if (this.doc.hidden) {
      this.music.pause();
      this.resumeOnVisible = this.state === 'running';
      this.engine.pause();
      this.pet.pause();
      this.runningEffects.clear();
      this.timeline.reset();
      if (!this.settings.hiddenAudio) { this.audio.pause(); this.clock.pause(); }
    } else if (this.resumeOnVisible && this.state === 'running') {
      this.resumeOnVisible = false;
      void this.start();
    }
  };
  update(patch: Partial<WineSettings>): void {
    const previous = this.settings;
    this.settings = sanitizeSettings({ ...this.settings, ...patch });
    this.audio.configure(this.settings.volume, this.settings.loop);
    if (this.state !== 'stopped') this.syncEffects(previous);
    this.syncMusic();
    try { this.doc.defaultView!.localStorage.setItem('dsh-dyou-wine.settings.v1', JSON.stringify(this.settings)); } catch { /* optional */ }
    this.emit();
  }
  async start(): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.error = '';
    try {
      this.audio.configure(this.settings.volume, this.settings.loop);
      await this.audio.play();
      if (generation !== this.generation || this.disposed) { if (this.state !== 'running') this.audio.pause(); return; }
      this.clock.start();
      this.timeline.reset();
      this.state = 'running';
      if (this.doc.hidden) {
        this.resumeOnVisible = true;
        if (!this.settings.hiddenAudio) { this.audio.pause(); this.clock.pause(); }
      } else if (!this.syncEffects()) return;
      this.syncMusic();
      this.emit();
    } catch (error) { if (generation === this.generation) this.fail(error); }
  }
  pause(): void {
    ++this.generation;
    this.resumeOnVisible = false;
    this.audio.pause(); this.clock.pause(); this.engine.pause(); this.pet.pause();
    this.music.pause();
    this.runningEffects.clear();
    this.timeline.reset();
    if (this.state !== 'stopped') this.state = 'paused';
    this.emit();
  }
  stop(): void {
    ++this.generation;
    this.resumeOnVisible = false;
    this.audio.release(); this.clock.reset(); this.engine.stop(); this.pet.stop();
    this.music.stop();
    this.runningEffects.clear();
    this.timeline.reset();
    this.state = 'stopped'; this.error = ''; this.emit();
  }
  selectAudio(file: File): void {
    this.pause();
    try { this.audio.select(file); this.error = ''; } catch (error) { this.fail(error); }
    this.emit();
  }
  manual(): void { this.pause(); this.audio.release(); this.emit(); }
  seek(seconds: number): void { this.audio.seek(seconds); this.emit(); }
  tap(now = performance.now()): void {
    if (this.taps.length && now - this.taps[this.taps.length - 1] > 2000) this.taps = [];
    this.taps = [...this.taps.slice(-7), now];
    const bpm = tapBpm(this.taps); if (bpm) this.update({ bpm });
  }
  private fail(error: unknown): void {
    this.pause(); this.engine.stop(); this.pet.stop();
    this.error = error instanceof Error ? error.message : String(error);
    this.emit();
  }
  dispose(): void {
    this.disposed = true; this.stop(); this.audio.dispose(); this.music.dispose();
    this.doc.removeEventListener('keydown', this.keydown);
    this.doc.removeEventListener('visibilitychange', this.visibility);
    this.reducedMotion.removeEventListener('change', this.motionChange);
    this.listeners.clear();
  }
  private syncMusic(): void {
    if (this.settings.musicEnabled && this.state === 'running' && !this.doc.hidden && !this.disposed) {
      this.error = this.error === 'musicLoadError' ? '' : this.error;
      void this.music.play();
    } else {
      this.music.pause();
      if (this.error === 'musicLoadError') this.error = '';
    }
  }
  private syncEffects(previous?: WineSettings): boolean {
    const generation = this.generation;
    try {
      for (const [key, effect] of [['pageEnabled', this.engine], ['petEnabled', this.pet]] as const) {
        if (!this.settings[key]) {
          if (previous?.[key] || this.runningEffects.has(key)) effect.stop();
          this.runningEffects.delete(key);
        } else if (this.state === 'running' && !this.doc.hidden) {
          if (this.runningEffects.has(key)) effect.update(this.settings);
          else {
            // Mark before start: an engine may report a synchronous failure
            // through onError, whose cleanup must clear both effects.
            this.runningEffects.add(key);
            effect.start(this.settings);
          }
        } else effect.update(this.settings);
        // Engines report their own synchronous failures via fail(). Never
        // start the second effect after that callback stopped the first one.
        if (generation !== this.generation || this.disposed) return false;
      }
      return true;
    } catch (error) {
      if (generation === this.generation) this.fail(error);
      return false;
    }
  }
}
