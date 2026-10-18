import whaleGirl from '../assets/whale-girl.png';
import type { WineSettings } from '../settings';
import type { SharedBeatTimeline } from '../audio/timeline';
import { fitPetSize, PET_ENVELOPE, resizeFlight, stepFlight, type FlightState } from './physics';

export interface PetSnapshot extends FlightState { active: boolean }

/** One stretch and one squash per cycle; no collision-dependent extra beats. */
export function composePetFrames(settings: WineSettings, spriteSize: number): Keyframe[] {
  const strength = { tipsy: 0.18, party: 0.28, wild: 0.30 }[settings.preset]
    * settings.intensity / 100;
  return Array.from({ length: 49 }, (_, index) => {
    const offset = index / 48;
    const sine = index % 24 === 0 ? 0 : Math.sin(offset * Math.PI * 2);
    const sy = 1 + strength * (sine - 0.15 * sine * sine);
    const sx = sy ** -0.5;
    const hop = -spriteSize * 0.04 * settings.intensity / 100 * Math.max(0, sine);
    return { offset, easing: 'linear', translate: `0 ${hop}px`, scale: `${sx} ${sy}` };
  });
}

/** The DOM is only a click-through decoration: host content is never scanned or transformed. */
export class PetEngine {
  private settings!: WineSettings;
  private root?: HTMLDivElement;
  private body?: HTMLDivElement;
  private animation?: Animation;
  private state: FlightState = { x: 0, y: 0, vx: 0, vy: 0, width: 0, height: 0, collisions: 0 };
  private spriteSize = 0;
  private running = false;
  private frame = 0;
  private lastFrame?: number;
  private removeListeners?: () => void;
  private clockAnchor?: { seconds: number; performance: number; timeline: number };
  private timelineOrigin?: number;
  private duration = 0;
  private signature = '';

  constructor(private document: Document, private getTime: () => number,
    private onError: (error: Error) => void, private sharedTimeline?: SharedBeatTimeline) {}

  start(settings: WineSettings): void {
    this.settings = settings;
    try {
      const win = this.document.defaultView;
      if (!win || typeof win.Element.prototype.animate !== 'function'
        || !win.CSS?.supports('scale', '1 1')) throw new Error('unsupportedBrowser');
      if (!this.root) this.mount();
      this.running = true;
      this.lastFrame = undefined;
      this.clockAnchor = undefined;
      this.resize();
      this.setSpeed();
      this.refreshFrames();
      if (!this.document.hidden) {
        this.animation!.play();
        this.synchronize(win.performance.now());
        this.schedule();
      } else this.animation!.pause();
    } catch (error) { this.fail(error); }
  }

  update(settings: WineSettings): void {
    this.settings = settings;
    if (!this.root) return;
    try {
      this.resize();
      this.setSpeed();
      this.refreshFrames();
      if (this.running && !this.document.hidden) this.synchronize(this.document.defaultView!.performance.now());
    } catch (error) { this.fail(error); }
  }

  pause(): void {
    this.running = false;
    this.cancelFrame();
    this.animation?.pause();
    this.lastFrame = undefined;
    this.clockAnchor = undefined;
  }

  stop(): void {
    this.pause();
    this.animation?.cancel(); this.animation = undefined;
    this.root?.remove(); this.root = undefined; this.body = undefined;
    this.removeListeners?.(); this.removeListeners = undefined;
    this.state = { x: 0, y: 0, vx: 0, vy: 0, width: 0, height: 0, collisions: 0 };
    this.signature = ''; this.timelineOrigin = undefined; this.duration = 0;
  }

  snapshot(): PetSnapshot { return { ...this.state, active: this.running && !this.document.hidden }; }

  private mount(): void {
    const win = this.document.defaultView!;
    const root = this.document.createElement('div');
    root.dataset.dyouWine = 'pet'; root.dataset.wineOwned = ''; root.dataset.winePet = '';
    root.setAttribute('aria-hidden', 'true');
    root.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:9;contain:layout style;will-change:transform;user-select:none;';
    const body = this.document.createElement('div');
    body.dataset.winePetBody = '';
    body.style.cssText = 'position:absolute;pointer-events:none;transform-origin:50% 50%;will-change:scale,translate;';
    const sprite = this.document.createElement('img');
    sprite.src = whaleGirl; sprite.alt = '大肥鱼娘'; sprite.draggable = false;
    sprite.dataset.winePetSprite = '';
    sprite.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;';
    const imageError = () => this.fail(new Error('petAssetError'));
    sprite.addEventListener('error', imageError);
    body.append(sprite); root.append(body);
    this.root = root; this.body = body;
    this.document.body.append(root);
    // A stable initial diagonal is chosen once. Bounces only reflect components.
    const angle = (30 + Math.random() * 30) * Math.PI / 180;
    this.state.vx = Math.cos(angle) * this.settings.petSpeed * (Math.random() < 0.5 ? -1 : 1);
    this.state.vy = Math.sin(angle) * this.settings.petSpeed * (Math.random() < 0.5 ? -1 : 1);
    this.resize();
    this.state.x = Math.max(0, win.innerWidth - this.state.width) * (0.2 + Math.random() * 0.6);
    this.state.y = Math.max(0, win.innerHeight - this.state.height) * (0.2 + Math.random() * 0.6);
    this.draw();
    const resize = () => { try { this.resize(); this.refreshFrames(); } catch (error) { this.fail(error); } };
    const visibility = () => {
      this.lastFrame = undefined; this.clockAnchor = undefined;
      if (this.document.hidden) { this.cancelFrame(); this.animation?.pause(); }
      else if (this.running) {
        try { this.animation?.play(); this.synchronize(win.performance.now()); this.schedule(); }
        catch (error) { this.fail(error); }
      }
    };
    win.addEventListener('resize', resize, { passive: true });
    this.document.addEventListener('visibilitychange', visibility);
    this.removeListeners = () => {
      win.removeEventListener('resize', resize);
      this.document.removeEventListener('visibilitychange', visibility);
      sprite.removeEventListener('error', imageError);
    };
  }

  private resize(): void {
    const win = this.document.defaultView!;
    this.spriteSize = fitPetSize(this.settings.petSize, win.innerWidth, win.innerHeight);
    this.state = resizeFlight(this.state, this.spriteSize, win.innerWidth, win.innerHeight);
    if (!this.root || !this.body) return;
    this.root.style.width = `${this.state.width}px`; this.root.style.height = `${this.state.height}px`;
    this.body.style.width = `${this.spriteSize}px`; this.body.style.height = `${this.spriteSize}px`;
    const inset = this.spriteSize * (PET_ENVELOPE - 1) / 2;
    this.body.style.left = `${inset}px`; this.body.style.top = `${inset}px`;
    this.draw();
  }

  private setSpeed(): void {
    const speed = Math.hypot(this.state.vx, this.state.vy);
    if (speed > 0) {
      this.state.vx = this.state.vx / speed * this.settings.petSpeed;
      this.state.vy = this.state.vy / speed * this.settings.petSpeed;
    }
  }

  private refreshFrames(): void {
    if (!this.body) return;
    const signature = `${this.settings.preset}:${this.settings.intensity}:${this.spriteSize}`;
    if (!this.animation) {
      this.animation = this.body.animate(composePetFrames(this.settings, this.spriteSize), {
        duration: 60000 / this.settings.bpm, iterations: Infinity, fill: 'both',
      });
      this.animation.id = 'dsh-dyou-wine:pet:q';
      this.animation.finished.catch(() => {});
      if (!this.running || this.document.hidden) this.animation.pause();
    } else if (signature !== this.signature) {
      (this.animation.effect as KeyframeEffect).setKeyframes(composePetFrames(this.settings, this.spriteSize));
    }
    this.signature = signature;
  }

  private synchronize(performanceNow: number): void {
    const seconds = this.getTime();
    const timelineNow = this.document.timeline.currentTime;
    if (!Number.isFinite(seconds)) throw new Error('invalidClock');
    if (typeof timelineNow !== 'number') throw new Error('unsupportedBrowser');
    const anchor = this.clockAnchor;
    if (!anchor || Math.abs(seconds - anchor.seconds - (performanceNow - anchor.performance) / 1000) > 0.12) {
      this.clockAnchor = { seconds, performance: performanceNow, timeline: timelineNow };
    }
    const current = this.clockAnchor!;
    const origin = this.sharedTimeline?.align(seconds, performanceNow, timelineNow, this.settings.offsetMs)
      ?? current.timeline - current.seconds * 1000 + this.settings.offsetMs;
    const duration = 60000 / this.settings.bpm;
    if (origin !== this.timelineOrigin || duration !== this.duration) {
      this.animation!.effect!.updateTiming({ duration });
      // Only clock discontinuities/settings/resume realign the native timeline.
      // Collisions never touch this clock or write Animation.currentTime.
      const cycle = Math.floor((timelineNow - origin) / duration);
      this.animation!.startTime = origin + Math.min(0, cycle) * duration;
      this.timelineOrigin = origin; this.duration = duration;
    }
  }

  private draw(): void { if (this.root) this.root.style.transform = `translate3d(${this.state.x}px, ${this.state.y}px, 0)`; }
  private schedule(): void {
    if (!this.frame && this.running && !this.document.hidden) this.frame = this.document.defaultView!.requestAnimationFrame(this.render);
  }
  private cancelFrame(): void {
    if (this.frame) this.document.defaultView!.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
  private render = (now: number): void => {
    this.frame = 0;
    if (!this.running || this.document.hidden) return;
    try {
      const win = this.document.defaultView!;
      if (this.lastFrame !== undefined) {
        this.state = stepFlight(this.state, win.innerWidth, win.innerHeight, Math.max(0, now - this.lastFrame) / 1000);
        this.draw();
      }
      this.lastFrame = now;
      this.synchronize(win.performance.now());
      this.schedule();
    } catch (error) { this.fail(error); }
  };
  private fail(error: unknown): void {
    this.stop();
    this.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
