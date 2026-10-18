import { categories, type Category, type WineSettings } from '../settings';
import { composedParent } from '../adapters/dsh';
import { InteractionGuard } from '../guards/interaction';
import { type MotionTarget, TargetRegistry } from '../targets/registry';
import { composeFrames, selectWithinBudget } from './composer';
import { PerformanceGovernor } from './governor';
import type { SharedBeatTimeline } from '../audio/timeline';

export interface EngineSnapshot {
  total: number;
  active: number;
  protected: number;
  categories: Record<Category, number>;
  warnings: string[];
  degraded: boolean;
  frameP95: number;
  callbackP95: number;
}

const OWN_ANIMATION = 'dsh-dyou-wine:';
export class WineEngine {
  private settings!: WineSettings;
  private registry?: TargetRegistry;
  private guard?: InteractionGuard;
  private governor = new PerformanceGovernor();
  private running = false;
  private frame = 0;
  private lastFrame = 0;
  private lastRefresh = 0;
  private dirty = true;
  private selected: MotionTarget[] = [];
  private bottomAnchored = new WeakMap<Element, boolean>();
  private warnings = new Set<string>();
  private protectedCount = 0;
  private removeVisibility?: () => void;
  private removeResize?: () => void;
  private clockAnchor?: { seconds: number; performance: number; timeline: number };
  private timelineOrigin = 0;
  private cycleDuration = 0;
  private pendingStarts = new WeakMap<MotionTarget, number>();
  constructor(private document: Document, private getTime: () => number,
    private onError: (error: Error) => void, private sharedTimeline?: SharedBeatTimeline) {}

  start(settings: WineSettings): void {
    this.settings = settings;
    try {
      const win = this.document.defaultView;
      if (!win || typeof win.Element.prototype.animate !== 'function'
        || !win.CSS?.supports('scale', '1 1')) throw new Error('unsupportedBrowser');
      if (!this.registry) {
        this.governor = new PerformanceGovernor();
        const changed = () => { this.dirty = true; };
        this.guard = new InteractionGuard(this.document, () => win.performance.now(), changed);
        this.guard.start();
        this.registry = new TargetRegistry(this.document, changed,
          element => this.guard!.registerApproval(element), target => this.release(target));
        this.registry.start();
        const visibility = () => {
          if (this.document.hidden) { this.cancelFrame(); this.clearAnimations(); }
          else if (this.running) { this.lastFrame = 0; this.dirty = true; this.schedule(); }
        };
        this.document.addEventListener('visibilitychange', visibility);
        this.removeVisibility = () => this.document.removeEventListener('visibilitychange', visibility);
        const resize = () => { this.dirty = true; };
        win.addEventListener('resize', resize, { passive: true });
        this.removeResize = () => win.removeEventListener('resize', resize);
      }
      this.running = true; this.dirty = true; this.lastFrame = 0;
      this.schedule();
    } catch (error) { this.fail(error); }
  }

  update(settings: WineSettings): void {
    this.settings = settings;
    this.dirty = true;
  }

  pause(): void {
    this.running = false; this.cancelFrame(); this.clearAnimations(); this.selected = []; this.protectedCount = 0;
    this.clockAnchor = undefined;
    this.pendingStarts = new WeakMap();
  }

  stop(): void {
    this.pause();
    this.registry?.stop(); this.registry = undefined;
    this.guard?.stop(); this.guard = undefined;
    this.removeVisibility?.(); this.removeVisibility = undefined;
    this.removeResize?.(); this.removeResize = undefined;
    this.warnings.clear(); this.protectedCount = 0;
    this.governor = new PerformanceGovernor();
  }

  snapshot(): EngineSnapshot {
    const coverage = Object.fromEntries(categories.map(category => [category, 0])) as Record<Category, number>;
    const activeRoots = new Set(this.selected.filter(target => target.animation).map(target => target.element));
    // Coverage includes enabled descendants inheriting a root's geometry. This
    // uses the registry's visibility/safety cache without reading computed style.
    if (activeRoots.size) for (const target of this.registry?.targets.values() ?? []) {
      if (!this.settings.ranges[target.category] || !this.registry!.eligible(target)) continue;
      for (let element: Element | null = target.element; element; element = composedParent(element)) {
        if (activeRoots.has(element)) { coverage[target.category]++; break; }
      }
    }
    return { total: this.registry?.targets.size ?? 0, active: activeRoots.size, protected: this.protectedCount,
      categories: coverage, warnings: [...new Set([...this.warnings, ...(this.registry?.warnings ?? [])])],
      degraded: this.governor.level > 0,
      frameP95: Math.round(this.governor.frameP95 * 100) / 100,
      callbackP95: Math.round(this.governor.callbackP95 * 100) / 100 };
  }

  private schedule(): void {
    if (!this.frame && this.running && !this.document.hidden) this.frame = this.document.defaultView!.requestAnimationFrame(this.render);
  }
  private cancelFrame(): void {
    if (this.frame) this.document.defaultView!.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
  private release(target: MotionTarget): void {
    if (target.animation) { target.animation.cancel(); target.animation = undefined; }
    target.signature = undefined;
  }
  private clearAnimations(): void {
    for (const target of this.registry?.targets.values() ?? []) this.release(target);
  }
  private fail(error: unknown): void {
    this.stop();
    this.onError(error instanceof Error ? error : new Error(String(error)));
  }

  private hasHostConflict(target: MotionTarget): boolean {
    return target.element.getAnimations().some(animation => {
      if (animation === target.animation || animation.id.startsWith(OWN_ANIMATION)) return false;
      const effect = animation.effect;
      return effect instanceof this.document.defaultView!.KeyframeEffect && effect.getKeyframes().some(frame =>
        'scale' in frame || 'rotate' in frame || 'translate' in frame || 'transformOrigin' in frame);
    });
  }

  private canAnchorBottom(target: MotionTarget): boolean {
    const win = this.document.defaultView!;
    if (win.getComputedStyle(target.element).transform !== 'none') return false;
    return !target.element.getAnimations().some(animation => {
      if (animation === target.animation || animation.id.startsWith(OWN_ANIMATION)) return false;
      const effect = animation.effect;
      return effect instanceof win.KeyframeEffect && effect.getKeyframes().some(frame => 'transform' in frame);
    });
  }

  private reconcile(now: number): void {
    this.registry!.refresh();
    const candidates = [...this.registry!.targets.values()].filter(target =>
      this.settings.ranges[target.category] && this.registry!.eligible(target));
    const candidateElements = new Set(candidates.map(target => target.element));
    // Animate each semantic branch once. Descendants inherit their root's
    // geometry, rather than multiplying independently animated scales/origins.
    const roots = candidates.filter(target => {
      for (let parent = composedParent(target.element); parent; parent = composedParent(parent)) {
        if (candidateElements.has(parent)) return false;
      }
      return true;
    });
    const selected = selectWithinBudget(roots, this.governor.budget);
    // Finish host-style reads for the entire bounded selection before cancelling
    // old effects or creating their native timeline effects.
    for (const target of selected) {
      target.hostConflict = this.hasHostConflict(target);
      this.bottomAnchored.set(target.element, this.canAnchorBottom(target));
    }
    const keep = new Set(selected);
    for (const target of this.selected) if (!keep.has(target)) this.release(target);
    this.selected = selected;
    this.lastRefresh = now; this.dirty = false;
    if (roots.length > this.governor.budget) this.warnings.add('warningBudget');
    else this.warnings.delete('warningBudget');
  }

  private render = (now: number): void => {
    this.frame = 0;
    if (!this.running || this.document.hidden) return;
    const win = this.document.defaultView!;
    const begin = win.performance.now();
    try {
      // Read the clock before any bounded style/layout work. rAF's timestamp
      // and DocumentTimeline share an origin, but a preceding callback may
      // have blocked this callback; account for that elapsed wall time once.
      const seconds = this.getTime();
      if (!Number.isFinite(seconds)) throw new Error('invalidClock');
      const sampledAt = win.performance.now();
      const sampledTimeline = this.document.timeline.currentTime;
      if (typeof sampledTimeline !== 'number') throw new Error('unsupportedBrowser');
      const timelineNow = sampledTimeline + (sampledAt - now);
      const timingChanged = this.alignClock(seconds, sampledAt, timelineNow);
      const reconcile = this.dirty || now - this.lastRefresh > 250;
      if (reconcile) this.reconcile(now);
      const anchors = this.guard!.anchors();
      const duration = this.cycleDuration;
      this.protectedCount = 0;
      for (const target of this.selected) {
        const protectedNow = this.guard!.protected(target.element, anchors);
        if (protectedNow) {
          this.protectedCount++; target.wasProtected = true; this.release(target); continue;
        }
        if (target.hostConflict) {
          this.release(target);
          this.warnings.add('warningConflict');
          continue;
        }
        const pendingStart = this.pendingStarts.get(target);
        const needsNeutralJoin = target.wasProtected || pendingStart !== undefined && timelineNow < pendingStart;
        if (pendingStart !== undefined && timelineNow >= pendingStart) this.pendingStarts.delete(target);
        const anchorBottom = this.bottomAnchored.get(target.element) ?? false;
        const signature = `${this.settings.preset}:${this.settings.intensity}:${target.category}:${anchorBottom}`;
        let created = false;
        if (!target.animation) {
          target.animation = target.element.animate(composeFrames(this.settings, target.category, 0, 0, 1, anchorBottom),
            { duration, iterations: Infinity, fill: 'none' });
          target.animation.id = `${OWN_ANIMATION}${target.order}`;
          target.animation.finished.catch(() => {});
          created = true;
        } else if (target.signature !== signature) {
          (target.animation.effect as KeyframeEffect).setKeyframes(composeFrames(this.settings, target.category, 0, 0, 1, anchorBottom));
        }
        target.signature = signature;
        if (created || timingChanged) {
          target.animation.effect!.updateTiming({ duration });
          // A future start time holds the host's neutral geometry (fill:none),
          // then lets the browser join precisely at a shared whole-cycle seam.
          // No rAF callback has to hit that instant, and no gain ramp is needed.
          // Normal roots with a positive offset still start immediately: shift
          // their origin back whole cycles, preserving the same modulo phase.
          const cycleIndex = Math.floor((timelineNow - this.timelineOrigin) / duration);
          const startTime = this.timelineOrigin + (needsNeutralJoin ? cycleIndex + 1 : Math.min(0, cycleIndex)) * duration;
          target.animation.startTime = startTime;
          if (needsNeutralJoin) this.pendingStarts.set(target, startTime);
          target.wasProtected = false;
        }
      }
      const elapsed = win.performance.now() - begin;
      if (this.governor.record(this.lastFrame ? now - this.lastFrame : 0, elapsed)) this.dirty = true;
      this.lastFrame = now;
      this.schedule();
    } catch (error) { this.fail(error); }
  };

  private alignClock(seconds: number, performanceNow: number, timelineNow: number): boolean {
    const anchor = this.clockAnchor;
    // A media seek/loop is a source-clock discontinuity. Ordinary main-thread
    // stalls advance performance.now and the source equally and never reset
    // the origin. Ignore small media-clock corrections to avoid micro-seeks.
    if (!anchor || Math.abs(seconds - anchor.seconds - (performanceNow - anchor.performance) / 1000) > 0.12) {
      this.clockAnchor = { seconds, performance: performanceNow, timeline: timelineNow };
    }
    const current = this.clockAnchor!;
    const origin = this.sharedTimeline?.align(seconds, performanceNow, timelineNow, this.settings.offsetMs)
      ?? current.timeline - current.seconds * 1000 + this.settings.offsetMs;
    const duration = 60000 / this.settings.bpm;
    const changed = origin !== this.timelineOrigin || duration !== this.cycleDuration;
    this.timelineOrigin = origin;
    this.cycleDuration = duration;
    return changed;
  }
}
