import type { Category } from '../settings';
import { APPROVAL, CANDIDATES, OWNED, classifyTarget, composedClosest, composedParent, styleCanAnimate } from '../adapters/dsh';

export interface MotionTarget {
  element: Element;
  category: Category;
  visible: boolean;
  safe: boolean;
  order: number;
  animation?: Animation;
  signature?: string;
  resumeAt: number;
  wasProtected: boolean;
  hostConflict?: boolean;
}

/** Discovery is once per added subtree; text token mutations do not trigger a scan. */
export class TargetRegistry {
  readonly targets = new Map<Element, MotionTarget>();
  readonly warnings = new Set<string>();
  private observers = new Map<Document | ShadowRoot, MutationObserver>();
  private roots = new Set<Document | ShadowRoot>();
  private intersections?: IntersectionObserver;
  private fixed = new Map<Element, Element[]>();
  private fixedAncestors = new Map<Element, number>();
  private additions = new Set<Element>();
  private invalidated = new Set<Element>();
  private pending = false;
  private order = 0;
  constructor(private document: Document, private changed: () => void,
    private approval: (element: Element) => void, private release: (target: MotionTarget) => void) {}

  start(): void {
    const win = this.document.defaultView!;
    if (win.IntersectionObserver) this.intersections = new win.IntersectionObserver(entries => {
      for (const entry of entries) {
        const target = this.targets.get(entry.target);
        if (target) target.visible = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
      }
      this.changed();
    });
    else this.warnings.add('warningIntersection');
    this.observe(this.document);
    this.scan(this.document.documentElement);
    if (!this.document.querySelector('[data-chat-flow],[data-chat-flow-kind]')) {
      this.warnings.add('warningAnchor');
    }
  }

  private observe(root: Document | ShadowRoot): void {
    if (this.roots.has(root)) return;
    this.roots.add(root);
    const observer = new this.document.defaultView!.MutationObserver(records => {
      let relevant = false;
      for (const record of records) {
        if (record.target.nodeType === 1 && composedClosest(record.target as Element, OWNED)) continue;
        if (record.type === 'childList') {
          for (const added of record.addedNodes) if (added.nodeType === 1) {
            if (composedClosest(added as Element, OWNED)) continue;
            this.additions.add(added as Element); relevant = true;
          }
          // A previously empty div can become a title/status text unit without
          // adding an element. Discover that one subtree once; registered
          // streaming paragraphs keep their existing native animation intact.
          if (record.target.nodeType === 1 && !this.targets.has(record.target as Element)
            && classifyTarget(record.target as Element)) {
            this.additions.add(record.target as Element); relevant = true;
          }
          if ([...record.removedNodes].some(node => node.nodeType === 1)) relevant = true;
        } else if (record.target.nodeType === 1) {
          this.invalidated.add(record.target as Element); relevant = true;
        }
      }
      if (relevant && !this.pending) {
        this.pending = true;
        // Batch streaming structure changes without observing characterData or our WAAPI effects.
        this.document.defaultView!.queueMicrotask(() => {
          this.pending = false;
          if (!this.roots.size) return;
          for (const added of this.additions) if (added.isConnected) this.scan(added);
          this.additions.clear();
          this.prune();
          this.changed();
        });
      }
    });
    observer.observe(root, { subtree: true, childList: true, attributes: true,
      attributeFilter: ['hidden', 'inert', 'aria-hidden', 'open', 'style', 'class',
        'data-chat-flow-kind', 'data-streaming', 'data-approval-key', 'data-wine-approval'] });
    this.observers.set(root, observer);
  }

  private setFixed(element: Element, isFixed: boolean): void {
    const previous = this.fixed.get(element);
    if (previous) {
      for (const parent of previous) {
        const count = (this.fixedAncestors.get(parent) ?? 1) - 1;
        if (count) this.fixedAncestors.set(parent, count); else this.fixedAncestors.delete(parent);
      }
      this.fixed.delete(element);
    }
    if (isFixed) {
      const parents: Element[] = [];
      for (let parent = composedParent(element); parent; parent = composedParent(parent)) {
        parents.push(parent);
        this.fixedAncestors.set(parent, (this.fixedAncestors.get(parent) ?? 0) + 1);
      }
      this.fixed.set(element, parents);
    }
  }

  private scan(root: Element): void {
    if (composedClosest(root, OWNED)) return;
    const win = this.document.defaultView!;
    // A single discovery pass also finds open shadow roots and CSS-positioned fixed descendants.
    for (const element of [root, ...root.querySelectorAll('*')]) {
      if (!element.isConnected) continue;
      if (composedClosest(element, OWNED)) continue;
      if (element.matches('[data-chat-flow],[data-chat-flow-kind]')) this.warnings.delete('warningAnchor');
      const style = win.getComputedStyle(element);
      this.setFixed(element, style.position === 'fixed');
      if (element.matches(APPROVAL)) this.approval(element);
      if (element.matches('iframe')) this.warnings.add('warningFrame');
      if (element.matches('canvas')) this.warnings.add('warningCanvas');
      if (element.shadowRoot) {
        this.observe(element.shadowRoot);
        for (const child of element.shadowRoot.children) this.scan(child);
      }
      if (!element.matches(CANDIDATES)) continue;
      const category = classifyTarget(element);
      if (!category) continue;
      if (['scale', 'rotate', 'translate'].some(property => {
        const value = style.getPropertyValue(property);
        return value && value !== 'none';
      })) this.warnings.add('warningConflict');
      const previous = this.targets.get(element);
      if (previous) { previous.category = category; continue; }
      const target: MotionTarget = { element, category, visible: this.isVisible(element),
        safe: styleCanAnimate(element, style), order: this.order++, resumeAt: 0, wasProtected: false };
      this.targets.set(element, target);
      this.intersections?.observe(element);
    }
  }

  private isVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const win = this.document.defaultView!;
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
      && rect.top < win.innerHeight && rect.left < win.innerWidth;
  }

  refresh(): void {
    const win = this.document.defaultView!;
    for (const changed of this.invalidated) {
      if (!changed.isConnected) continue;
      this.setFixed(changed, win.getComputedStyle(changed).position === 'fixed');
      if (changed.matches(APPROVAL)) this.approval(changed);
      // A state/class change can reveal existing descendants, but never requires rediscovery of the document.
      for (const target of this.targets.values()) if (changed === target.element || changed.contains(target.element)) {
        this.release(target);
        const category = classifyTarget(target.element);
        target.safe = Boolean(category) && styleCanAnimate(target.element, win.getComputedStyle(target.element));
        if (category) target.category = category;
        target.visible = this.isVisible(target.element);
      }
      // Hidden subtrees were intentionally not classified; discover them when a state reveals them.
      this.scan(changed);
    }
    this.invalidated.clear();
    if (!this.intersections) for (const target of this.targets.values()) target.visible = this.isVisible(target.element);
    this.prune();
  }

  eligible(target: MotionTarget): boolean {
    return target.safe && target.visible && target.element.isConnected && !this.fixedAncestors.has(target.element);
  }

  private prune(): void {
    for (const [element, target] of this.targets) if (!element.isConnected) {
      this.release(target); this.intersections?.unobserve(element); this.targets.delete(element);
    }
    for (const element of this.fixed.keys()) if (!element.isConnected) this.setFixed(element, false);
    for (const root of this.roots) if (root.nodeType === 11 && !(root as ShadowRoot).host.isConnected) {
      this.observers.get(root)?.disconnect(); this.observers.delete(root); this.roots.delete(root);
    }
  }

  stop(): void {
    this.observers.forEach(observer => observer.disconnect()); this.observers.clear();
    this.intersections?.disconnect(); this.intersections = undefined;
    for (const target of this.targets.values()) this.release(target);
    this.targets.clear(); this.roots.clear(); this.fixed.clear(); this.fixedAncestors.clear();
    this.additions.clear(); this.invalidated.clear(); this.warnings.clear();
  }
}
