import { APPROVAL, composedClosest, composedParent } from '../adapters/dsh';

const INTERACTIVE = 'button,a[href],input,textarea,select,summary,[contenteditable="true"],[role="button"],[role="textbox"],[role="slider"],[role="menuitem"]';

export function sharesBranch(a: Element, b: Element): boolean {
  for (let node: Element | null = b; node; node = composedParent(node)) if (node === a) return true;
  for (let node: Element | null = a; node; node = composedParent(node)) if (node === b) return true;
  return false;
}

/** All listeners are read-only and never preventDefault or stop host propagation. */
export class InteractionGuard {
  private listeners: (() => void)[] = [];
  private timed = new Map<Element, number>();
  private hover: Element | null = null;
  private pointerPosition?: { x: number; y: number };
  private composition: Element | null = null;
  private dragging: Element | null = null;
  private selected: Element | null = null;
  private approval = new Set<Element>();
  constructor(private document: Document, private now: () => number, private changed: () => void) {}
  start(): void {
    const on = (type: string, listener: (event: Event) => void) => {
      this.document.addEventListener(type, listener, { capture: true, passive: true });
      this.listeners.push(() => this.document.removeEventListener(type, listener, true));
    };
    const element = (event: Event): Element | null => event.composedPath().find(node =>
      node instanceof this.document.defaultView!.Element) as Element | undefined ?? null;
    on('focusin', () => this.changed());
    on('focusout', event => {
      const target = element(event);
      if (target) this.timed.set(target, this.now() + 180);
      this.changed();
    });
    const pointerHover = (event: Event, force = false) => {
      const pointer = event as PointerEvent;
      if (!force && this.pointerPosition?.x === pointer.clientX && this.pointerPosition.y === pointer.clientY) return;
      this.pointerPosition = { x: pointer.clientX, y: pointer.clientY };
      const target = element(event);
      const next = target ? composedClosest(target, INTERACTIVE) : null;
      if (this.hover !== next) { this.hover = next; this.changed(); }
    };
    const clearHover = () => {
      this.pointerPosition = undefined;
      if (this.hover) { this.hover = null; this.changed(); }
    };
    // Scaling a control can move its boundary across a stationary pointer.
    // Only pointer movement/down changes hover protection, so our animation
    // cannot repeatedly trigger pointerover/out and stop its own branch.
    on('pointermove', event => pointerHover(event));
    on('pointerout', event => {
      if ((event as PointerEvent).relatedTarget === null) clearHover();
    });
    on('pointerdown', event => {
      pointerHover(event, true);
      const target = element(event);
      if (target) this.timed.set(target, this.now() + 350);
      this.changed();
    });
    on('compositionstart', event => { this.composition = element(event); this.changed(); });
    on('compositionend', () => {
      if (this.composition) this.timed.set(this.composition, this.now() + 350);
      this.composition = null;
      this.changed();
    });
    on('scroll', event => {
      const target = element(event) ?? this.document.documentElement;
      this.timed.set(target, this.now() + 180);
      this.changed();
    });
    on('dragstart', event => { this.dragging = element(event); this.changed(); });
    const dragEnd = () => { this.dragging = null; this.changed(); };
    on('dragend', dragEnd);
    on('drop', dragEnd);
    on('pointercancel', () => { clearHover(); dragEnd(); });
    const blur = () => clearHover();
    this.document.defaultView!.addEventListener('blur', blur, { passive: true });
    this.listeners.push(() => this.document.defaultView!.removeEventListener('blur', blur));
    on('selectionchange', () => {
      const selection = this.document.getSelection();
      const node = selection && !selection.isCollapsed && selection.rangeCount ? selection.getRangeAt(0).commonAncestorContainer : null;
      this.selected = node?.nodeType === 1 ? node as Element : node?.parentElement ?? null;
      this.changed();
    });
  }
  registerApproval(element: Element): void {
    if (element.matches(APPROVAL)) this.approval.add(element);
  }
  anchors(): Element[] {
    const now = this.now();
    for (const [element, end] of this.timed) if (end < now || !element.isConnected) this.timed.delete(element);
    for (const element of this.approval) if (!element.isConnected || !element.matches(APPROVAL)) this.approval.delete(element);
    let focus = this.document.activeElement;
    while (focus?.shadowRoot?.activeElement) focus = focus.shadowRoot.activeElement;
    return [focus && focus !== this.document.body && focus !== this.document.documentElement ? focus : null,
      this.hover, this.composition, this.dragging, this.selected, ...this.timed.keys(),
      ...[...this.approval].filter(element => !composedClosest(element, '[hidden],[aria-hidden="true"]')),
    ].filter((element): element is Element => Boolean(element?.isConnected));
  }
  protected(element: Element, anchors: Element[]): boolean {
    return Boolean(composedClosest(element, APPROVAL)) || anchors.some(anchor => sharesBranch(element, anchor));
  }
  stop(): void {
    this.listeners.splice(0).forEach(remove => remove());
    this.timed.clear(); this.approval.clear();
    this.hover = this.composition = this.dragging = this.selected = null;
    this.pointerPosition = undefined;
  }
}
