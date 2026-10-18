// DSH lazy browser module. React is supplied by the host.
window.__ModuleLoader__.load({
  id: "dsh-dyou-wine",
  factory(require) {
    const module = { exports: {} };
    const exports = module.exports;
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/entry.ts
var entry_exports = {};
__export(entry_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(entry_exports);
var React = __toESM(require("react"), 1);

// src/audio/clock.ts
var BeatClock = class {
  constructor(now = () => performance.now() / 1e3) {
    this.now = now;
  }
  anchor = 0;
  elapsed = 0;
  running = false;
  get time() {
    return this.elapsed + (this.running ? this.now() - this.anchor : 0);
  }
  start() {
    if (!this.running) {
      this.anchor = this.now();
      this.running = true;
    }
  }
  pause() {
    this.elapsed = this.time;
    this.running = false;
  }
  reset() {
    this.running = false;
    this.elapsed = 0;
    this.anchor = this.now();
  }
};
function tapBpm(taps) {
  if (taps.length < 3) return;
  const intervals = taps.slice(1).map((tap, i) => tap - taps[i]).filter((n) => n > 200 && n < 2e3).sort((a, b) => a - b);
  if (intervals.length < 2) return;
  return Math.max(60, Math.min(200, Math.round(6e4 / intervals[Math.floor(intervals.length / 2)])));
}

// src/audio/local-audio.ts
var LocalAudio = class {
  constructor(doc, onEnded) {
    this.onEnded = onEnded;
    this.element = this.createElement(doc);
  }
  element;
  url;
  context;
  source;
  anchorContext = 0;
  anchorMedia = 0;
  needsFreshElement = false;
  generation = 0;
  fileName = "";
  createElement(doc) {
    const element = doc.createElement("audio");
    element.preload = "metadata";
    element.addEventListener("ended", this.onEnded);
    element.addEventListener("playing", this.reanchor);
    element.addEventListener("seeked", this.reanchor);
    element.addEventListener("ratechange", this.reanchor);
    element.addEventListener("timeupdate", this.correctDrift);
    return element;
  }
  removeListeners() {
    this.element.removeEventListener("ended", this.onEnded);
    this.element.removeEventListener("playing", this.reanchor);
    this.element.removeEventListener("seeked", this.reanchor);
    this.element.removeEventListener("ratechange", this.reanchor);
    this.element.removeEventListener("timeupdate", this.correctDrift);
  }
  get loaded() {
    return !!this.url;
  }
  get duration() {
    return Number.isFinite(this.element.duration) ? this.element.duration : 0;
  }
  get time() {
    if (!this.context || this.context.state !== "running" || this.element.paused || this.element.seeking) return this.element.currentTime;
    const estimate = this.anchorMedia + (this.context.currentTime - this.anchorContext) * this.element.playbackRate;
    return this.element.loop && this.duration ? estimate % this.duration : Math.min(this.duration || Infinity, estimate);
  }
  reanchor = () => {
    this.anchorContext = this.context?.currentTime ?? 0;
    this.anchorMedia = this.element.currentTime;
  };
  correctDrift = () => {
    if (Math.abs(this.time - this.element.currentTime) > 0.07) this.reanchor();
  };
  select(file) {
    if (file.size > 200 * 1024 * 1024) throw new Error("audioTooLarge");
    this.release();
    if (this.needsFreshElement) {
      const doc = this.element.ownerDocument;
      this.removeListeners();
      this.element = this.createElement(doc);
      this.needsFreshElement = false;
    }
    this.fileName = file.name;
    this.url = URL.createObjectURL(file);
    this.element.src = this.url;
    this.element.load();
    this.reanchor();
  }
  async play() {
    if (!this.loaded) return;
    const generation = this.generation;
    const element = this.element;
    if (!this.context) {
      const AudioCtor = this.element.ownerDocument.defaultView?.AudioContext;
      if (AudioCtor) {
        this.context = new AudioCtor();
        this.source = this.context.createMediaElementSource(this.element);
        this.source.connect(this.context.destination);
      }
    }
    if (this.context?.state === "suspended") await this.context.resume();
    if (generation !== this.generation || element !== this.element || !this.loaded) return;
    await element.play();
    if (generation !== this.generation || element !== this.element) {
      element.pause();
      return;
    }
    this.reanchor();
  }
  pause() {
    this.element.pause();
    this.reanchor();
  }
  seek(seconds) {
    this.element.currentTime = Math.max(0, Math.min(this.duration, seconds));
    this.reanchor();
  }
  configure(volume, loop) {
    this.element.volume = volume;
    this.element.loop = loop;
  }
  release() {
    ++this.generation;
    this.pause();
    this.element.removeAttribute("src");
    this.element.load();
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = void 0;
    this.fileName = "";
    if (this.context) {
      this.needsFreshElement = true;
      this.source?.disconnect();
      this.source = void 0;
      void this.context.close().catch(() => {
      });
      this.context = void 0;
    }
  }
  dispose() {
    this.release();
    this.removeListeners();
  }
};

// src/audio/timeline.ts
var SharedBeatTimeline = class {
  anchor;
  reset() {
    this.anchor = void 0;
  }
  align(seconds, performanceNow, timelineNow, offsetMs) {
    const anchor = this.anchor;
    if (!anchor || Math.abs(seconds - anchor.seconds - (performanceNow - anchor.performance) / 1e3) > 0.12) {
      this.anchor = { seconds, performance: performanceNow, timeline: timelineNow };
    }
    return this.anchor.timeline - this.anchor.seconds * 1e3 + offsetMs;
  }
};

// src/assets/BV1hXbN6VEKV.mp3
var BV1hXbN6VEKV_default = "plugins/dsh-dyou-wine/assets/BV1hXbN6VEKV.mp3";

// src/audio/bundled-music.ts
var musicSource = "https://www.bilibili.com/video/BV1hXbN6VEKV/";
var BundledMusic = class {
  constructor(doc, onError) {
    this.doc = doc;
    this.onError = onError;
  }
  media;
  generation = 0;
  desiredPlaying = false;
  disposed = false;
  pending;
  resetPosition = false;
  get element() {
    return this.media;
  }
  load() {
    if (this.media) return this.media;
    const media = this.doc.createElement("audio");
    media.preload = "metadata";
    media.loop = true;
    media.volume = 0.5;
    media.hidden = true;
    media.dataset.wineOwned = "";
    media.dataset.wineAudio = "";
    media.addEventListener("error", this.failed);
    media.src = BV1hXbN6VEKV_default;
    this.doc.body.append(media);
    this.media = media;
    return media;
  }
  failed = () => {
    if (!this.desiredPlaying || this.disposed) return;
    this.pause();
    this.onError(new Error("musicLoadError"));
  };
  async play() {
    if (this.disposed) return;
    if (this.desiredPlaying) return this.pending;
    const media = this.load();
    this.desiredPlaying = true;
    this.resetPosition = false;
    const generation = ++this.generation;
    const task = (async () => {
      try {
        await media.play();
        if (!this.desiredPlaying || this.disposed) {
          media.pause();
          if (this.resetPosition) this.rewind(media);
        }
      } catch {
        if (generation === this.generation && this.desiredPlaying && !this.disposed) {
          this.pause();
          this.onError(new Error("musicLoadError"));
        }
      }
    })();
    this.pending = task;
    await task;
    if (this.pending === task) this.pending = void 0;
  }
  pause() {
    ++this.generation;
    this.desiredPlaying = false;
    this.media?.pause();
    this.pending = void 0;
  }
  rewind(media) {
    try {
      media.currentTime = 0;
    } catch {
    }
  }
  stop() {
    this.pause();
    this.resetPosition = true;
    if (this.media) this.rewind(this.media);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    if (this.media) {
      this.media.removeEventListener("error", this.failed);
      this.media.removeAttribute("src");
      this.media.load();
      this.media.remove();
    }
  }
};

// src/settings.ts
var categories = ["messages", "text", "input", "sidebar", "controls", "tools", "dialogs"];
var defaults = {
  pageEnabled: true,
  petEnabled: false,
  musicEnabled: false,
  petSize: 180,
  petSpeed: 180,
  preset: "party",
  intensity: 65,
  bpm: 120,
  offsetMs: 0,
  volume: 0.5,
  loop: true,
  hiddenAudio: false,
  shortcut: "Escape",
  ranges: Object.fromEntries(categories.map((key) => [key, true]))
};
var bounded = (value, fallback, min, max) => typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
function sanitizeSettings(value) {
  const v = value && typeof value === "object" ? value : {};
  const legacyPet = v.mode === "pet";
  return {
    pageEnabled: typeof v.pageEnabled === "boolean" ? v.pageEnabled : !legacyPet,
    petEnabled: typeof v.petEnabled === "boolean" ? v.petEnabled : legacyPet,
    musicEnabled: v.musicEnabled === true,
    petSize: bounded(v.petSize, defaults.petSize, 80, 320),
    petSpeed: bounded(v.petSpeed, defaults.petSpeed, 40, 600),
    preset: ["tipsy", "party", "wild"].includes(v.preset ?? "") ? v.preset : defaults.preset,
    intensity: bounded(v.intensity, defaults.intensity, 0, 100),
    bpm: bounded(v.bpm, defaults.bpm, 60, 200),
    offsetMs: bounded(v.offsetMs, 0, -250, 250),
    volume: bounded(v.volume, 0.5, 0, 1),
    loop: typeof v.loop === "boolean" ? v.loop : true,
    hiddenAudio: v.hiddenAudio === true,
    shortcut: typeof v.shortcut === "string" && /^(Escape|[A-Za-z]|F[2-9])$/.test(v.shortcut) ? v.shortcut : "Escape",
    ranges: Object.fromEntries(categories.map((key) => [key, typeof v.ranges?.[key] === "boolean" ? v.ranges[key] : true]))
  };
}

// src/adapters/dsh.ts
var OWNED = "[data-wine-owned],[data-dyou-wine],[data-wine-exclude]";
var APPROVAL = "[data-approval-key],[data-approval-scroll],[data-wine-approval]";
var INPUT = '[data-composer-card],[data-composer-input],textarea,input:not([type="hidden"]),[contenteditable="true"],[role="textbox"]';
var SIDEBAR = '[data-slot="sidebar"],[data-slot^="sidebar."],aside,nav,[role="navigation"],[data-wine-sidebar]';
var MESSAGES = "[data-chat-flow-kind],[data-chat-flow-key]:not([data-chat-group-key]),[data-wine-message]";
var DIALOGS = '[role="dialog"],[role="menu"],[role="listbox"],dialog,[data-trigger-menu]';
var TOOLS = "[data-tool],[data-chat-call-id],pre,table,canvas,:has(> [data-code-block-content])";
var BLOCK = "p,h1,h2,h3,h4,h5,h6,li,blockquote,dt,dd,figcaption,legend,summary,label,output";
var TEXT_CONTAINERS = "div,span,strong,em,small,b,i,time,abbr,mark,header,footer";
var PHRASING = "span,strong,em,small,b,i,time,abbr,mark,code,kbd,samp,s,sub,sup,br,wbr,img,svg";
var CANDIDATES = [
  MESSAGES,
  INPUT,
  DIALOGS,
  TOOLS,
  BLOCK,
  TEXT_CONTAINERS,
  'button,[role="button"],a[href],img,svg,[role="listitem"]'
].join(",");
var SCROLL_ROOT = '[data-conversation-scroll],[data-chat-flow],[data-input-scroll],[data-code-block-content],[data-shell-overlay],[data-slot="shell.overlay"],html,body';
function composedParent(element) {
  return element.parentElement ?? (element.getRootNode().host || null);
}
function composedClosest(element, selector) {
  let current = element;
  while (current) {
    const match = current.closest(selector);
    if (match) return match;
    current = current.getRootNode().host || null;
  }
  return null;
}
function isTextUnit(element) {
  if (element.matches(BLOCK)) return true;
  if (!element.matches(TEXT_CONTAINERS)) return false;
  if ([...element.childNodes].some((node) => node.nodeType === 3 && Boolean(node.textContent?.trim()))) return true;
  const children = [...element.children];
  return children.length > 0 && children.every((child) => child.matches(PHRASING)) && children.some((child) => Boolean(child.textContent?.trim()));
}
function classifyTarget(element) {
  if (composedClosest(element, OWNED) || composedClosest(element, '[hidden],[inert],[aria-hidden="true"]')) return null;
  if (element.matches(INPUT)) return "input";
  if (element.matches(TOOLS)) return "tools";
  if (element.matches(MESSAGES)) return "messages";
  if (composedClosest(element, SIDEBAR) && (isTextUnit(element) || element.matches('button,a,[role="listitem"],[role="button"],img,svg'))) return "sidebar";
  if (element.matches(DIALOGS)) return "dialogs";
  if (isTextUnit(element)) {
    if (composedClosest(element, "pre,table") || element.parentElement?.closest("li,blockquote")) return null;
    if (composedClosest(element, DIALOGS)) return "dialogs";
    return "text";
  }
  if (composedClosest(element, DIALOGS) && element.matches('button,p,h1,h2,h3,[role="button"]')) return "dialogs";
  if (element.matches('button,[role="button"],a[href],img,svg')) return "controls";
  return null;
}
function styleCanAnimate(element, style) {
  if (element.matches(SCROLL_ROOT) || ["fixed", "sticky"].includes(style.position)) return false;
  if (/(auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) return false;
  if (["none", "contents", "table-column", "table-column-group"].includes(style.display)) return false;
  if (style.display === "inline" && !element.matches("img,svg,canvas,video,object,embed,iframe")) return false;
  if (style.visibility === "hidden" || style.visibility === "collapse") return false;
  return ["scale", "rotate", "translate"].every((property) => {
    const value = style.getPropertyValue(property);
    return !value || value === "none";
  });
}

// src/guards/interaction.ts
var INTERACTIVE = 'button,a[href],input,textarea,select,summary,[contenteditable="true"],[role="button"],[role="textbox"],[role="slider"],[role="menuitem"]';
function sharesBranch(a, b) {
  for (let node = b; node; node = composedParent(node)) if (node === a) return true;
  for (let node = a; node; node = composedParent(node)) if (node === b) return true;
  return false;
}
var InteractionGuard = class {
  constructor(document, now, changed) {
    this.document = document;
    this.now = now;
    this.changed = changed;
  }
  listeners = [];
  timed = /* @__PURE__ */ new Map();
  hover = null;
  pointerPosition;
  composition = null;
  dragging = null;
  selected = null;
  approval = /* @__PURE__ */ new Set();
  start() {
    const on = (type, listener) => {
      this.document.addEventListener(type, listener, { capture: true, passive: true });
      this.listeners.push(() => this.document.removeEventListener(type, listener, true));
    };
    const element = (event) => event.composedPath().find((node) => node instanceof this.document.defaultView.Element) ?? null;
    on("focusin", () => this.changed());
    on("focusout", (event) => {
      const target = element(event);
      if (target) this.timed.set(target, this.now() + 180);
      this.changed();
    });
    const pointerHover = (event, force = false) => {
      const pointer = event;
      if (!force && this.pointerPosition?.x === pointer.clientX && this.pointerPosition.y === pointer.clientY) return;
      this.pointerPosition = { x: pointer.clientX, y: pointer.clientY };
      const target = element(event);
      const next = target ? composedClosest(target, INTERACTIVE) : null;
      if (this.hover !== next) {
        this.hover = next;
        this.changed();
      }
    };
    const clearHover = () => {
      this.pointerPosition = void 0;
      if (this.hover) {
        this.hover = null;
        this.changed();
      }
    };
    on("pointermove", (event) => pointerHover(event));
    on("pointerout", (event) => {
      if (event.relatedTarget === null) clearHover();
    });
    on("pointerdown", (event) => {
      pointerHover(event, true);
      const target = element(event);
      if (target) this.timed.set(target, this.now() + 350);
      this.changed();
    });
    on("compositionstart", (event) => {
      this.composition = element(event);
      this.changed();
    });
    on("compositionend", () => {
      if (this.composition) this.timed.set(this.composition, this.now() + 350);
      this.composition = null;
      this.changed();
    });
    on("scroll", (event) => {
      const target = element(event) ?? this.document.documentElement;
      this.timed.set(target, this.now() + 180);
      this.changed();
    });
    on("dragstart", (event) => {
      this.dragging = element(event);
      this.changed();
    });
    const dragEnd = () => {
      this.dragging = null;
      this.changed();
    };
    on("dragend", dragEnd);
    on("drop", dragEnd);
    on("pointercancel", () => {
      clearHover();
      dragEnd();
    });
    const blur = () => clearHover();
    this.document.defaultView.addEventListener("blur", blur, { passive: true });
    this.listeners.push(() => this.document.defaultView.removeEventListener("blur", blur));
    on("selectionchange", () => {
      const selection = this.document.getSelection();
      const node = selection && !selection.isCollapsed && selection.rangeCount ? selection.getRangeAt(0).commonAncestorContainer : null;
      this.selected = node?.nodeType === 1 ? node : node?.parentElement ?? null;
      this.changed();
    });
  }
  registerApproval(element) {
    if (element.matches(APPROVAL)) this.approval.add(element);
  }
  anchors() {
    const now = this.now();
    for (const [element, end] of this.timed) if (end < now || !element.isConnected) this.timed.delete(element);
    for (const element of this.approval) if (!element.isConnected || !element.matches(APPROVAL)) this.approval.delete(element);
    let focus = this.document.activeElement;
    while (focus?.shadowRoot?.activeElement) focus = focus.shadowRoot.activeElement;
    return [
      focus && focus !== this.document.body && focus !== this.document.documentElement ? focus : null,
      this.hover,
      this.composition,
      this.dragging,
      this.selected,
      ...this.timed.keys(),
      ...[...this.approval].filter((element) => !composedClosest(element, '[hidden],[aria-hidden="true"]'))
    ].filter((element) => Boolean(element?.isConnected));
  }
  protected(element, anchors) {
    return Boolean(composedClosest(element, APPROVAL)) || anchors.some((anchor) => sharesBranch(element, anchor));
  }
  stop() {
    this.listeners.splice(0).forEach((remove) => remove());
    this.timed.clear();
    this.approval.clear();
    this.hover = this.composition = this.dragging = this.selected = null;
    this.pointerPosition = void 0;
  }
};

// src/targets/registry.ts
var TargetRegistry = class {
  constructor(document, changed, approval, release) {
    this.document = document;
    this.changed = changed;
    this.approval = approval;
    this.release = release;
  }
  targets = /* @__PURE__ */ new Map();
  warnings = /* @__PURE__ */ new Set();
  observers = /* @__PURE__ */ new Map();
  roots = /* @__PURE__ */ new Set();
  intersections;
  fixed = /* @__PURE__ */ new Map();
  fixedAncestors = /* @__PURE__ */ new Map();
  additions = /* @__PURE__ */ new Set();
  invalidated = /* @__PURE__ */ new Set();
  pending = false;
  order = 0;
  start() {
    const win = this.document.defaultView;
    if (win.IntersectionObserver) this.intersections = new win.IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = this.targets.get(entry.target);
        if (target) target.visible = entry.isIntersecting && entry.intersectionRect.width > 0 && entry.intersectionRect.height > 0;
      }
      this.changed();
    });
    else this.warnings.add("warningIntersection");
    this.observe(this.document);
    this.scan(this.document.documentElement);
    if (!this.document.querySelector("[data-chat-flow],[data-chat-flow-kind]")) {
      this.warnings.add("warningAnchor");
    }
  }
  observe(root) {
    if (this.roots.has(root)) return;
    this.roots.add(root);
    const observer = new this.document.defaultView.MutationObserver((records) => {
      let relevant = false;
      for (const record of records) {
        if (record.target.nodeType === 1 && composedClosest(record.target, OWNED)) continue;
        if (record.type === "childList") {
          for (const added of record.addedNodes) if (added.nodeType === 1) {
            if (composedClosest(added, OWNED)) continue;
            this.additions.add(added);
            relevant = true;
          }
          if (record.target.nodeType === 1 && !this.targets.has(record.target) && classifyTarget(record.target)) {
            this.additions.add(record.target);
            relevant = true;
          }
          if ([...record.removedNodes].some((node) => node.nodeType === 1)) relevant = true;
        } else if (record.target.nodeType === 1) {
          this.invalidated.add(record.target);
          relevant = true;
        }
      }
      if (relevant && !this.pending) {
        this.pending = true;
        this.document.defaultView.queueMicrotask(() => {
          this.pending = false;
          if (!this.roots.size) return;
          for (const added of this.additions) if (added.isConnected) this.scan(added);
          this.additions.clear();
          this.prune();
          this.changed();
        });
      }
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "hidden",
        "inert",
        "aria-hidden",
        "open",
        "style",
        "class",
        "data-chat-flow-kind",
        "data-streaming",
        "data-approval-key",
        "data-wine-approval"
      ]
    });
    this.observers.set(root, observer);
  }
  setFixed(element, isFixed) {
    const previous = this.fixed.get(element);
    if (previous) {
      for (const parent of previous) {
        const count = (this.fixedAncestors.get(parent) ?? 1) - 1;
        if (count) this.fixedAncestors.set(parent, count);
        else this.fixedAncestors.delete(parent);
      }
      this.fixed.delete(element);
    }
    if (isFixed) {
      const parents = [];
      for (let parent = composedParent(element); parent; parent = composedParent(parent)) {
        parents.push(parent);
        this.fixedAncestors.set(parent, (this.fixedAncestors.get(parent) ?? 0) + 1);
      }
      this.fixed.set(element, parents);
    }
  }
  scan(root) {
    if (composedClosest(root, OWNED)) return;
    const win = this.document.defaultView;
    for (const element of [root, ...root.querySelectorAll("*")]) {
      if (!element.isConnected) continue;
      if (composedClosest(element, OWNED)) continue;
      if (element.matches("[data-chat-flow],[data-chat-flow-kind]")) this.warnings.delete("warningAnchor");
      const style = win.getComputedStyle(element);
      this.setFixed(element, style.position === "fixed");
      if (element.matches(APPROVAL)) this.approval(element);
      if (element.matches("iframe")) this.warnings.add("warningFrame");
      if (element.matches("canvas")) this.warnings.add("warningCanvas");
      if (element.shadowRoot) {
        this.observe(element.shadowRoot);
        for (const child of element.shadowRoot.children) this.scan(child);
      }
      if (!element.matches(CANDIDATES)) continue;
      const category = classifyTarget(element);
      if (!category) continue;
      if (["scale", "rotate", "translate"].some((property) => {
        const value = style.getPropertyValue(property);
        return value && value !== "none";
      })) this.warnings.add("warningConflict");
      const previous = this.targets.get(element);
      if (previous) {
        previous.category = category;
        continue;
      }
      const target = {
        element,
        category,
        visible: this.isVisible(element),
        safe: styleCanAnimate(element, style),
        order: this.order++,
        resumeAt: 0,
        wasProtected: false
      };
      this.targets.set(element, target);
      this.intersections?.observe(element);
    }
  }
  isVisible(element) {
    const rect = element.getBoundingClientRect();
    const win = this.document.defaultView;
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < win.innerHeight && rect.left < win.innerWidth;
  }
  refresh() {
    const win = this.document.defaultView;
    for (const changed of this.invalidated) {
      if (!changed.isConnected) continue;
      this.setFixed(changed, win.getComputedStyle(changed).position === "fixed");
      if (changed.matches(APPROVAL)) this.approval(changed);
      for (const target of this.targets.values()) if (changed === target.element || changed.contains(target.element)) {
        this.release(target);
        const category = classifyTarget(target.element);
        target.safe = Boolean(category) && styleCanAnimate(target.element, win.getComputedStyle(target.element));
        if (category) target.category = category;
        target.visible = this.isVisible(target.element);
      }
      this.scan(changed);
    }
    this.invalidated.clear();
    if (!this.intersections) for (const target of this.targets.values()) target.visible = this.isVisible(target.element);
    this.prune();
  }
  eligible(target) {
    return target.safe && target.visible && target.element.isConnected && !this.fixedAncestors.has(target.element);
  }
  prune() {
    for (const [element, target] of this.targets) if (!element.isConnected) {
      this.release(target);
      this.intersections?.unobserve(element);
      this.targets.delete(element);
    }
    for (const element of this.fixed.keys()) if (!element.isConnected) this.setFixed(element, false);
    for (const root of this.roots) if (root.nodeType === 11 && !root.host.isConnected) {
      this.observers.get(root)?.disconnect();
      this.observers.delete(root);
      this.roots.delete(root);
    }
  }
  stop() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.intersections?.disconnect();
    this.intersections = void 0;
    for (const target of this.targets.values()) this.release(target);
    this.targets.clear();
    this.roots.clear();
    this.fixed.clear();
    this.fixedAncestors.clear();
    this.additions.clear();
    this.invalidated.clear();
    this.warnings.clear();
  }
};

// src/motion/composer.ts
var samples = 32;
var presets = {
  tipsy: { stretch: 0.2, squash: 0.25 },
  party: { stretch: 0.45, squash: 0.55 },
  wild: { stretch: 0.55, squash: 0.7 }
};
var weights = {
  messages: 1,
  text: 0.85,
  input: 0.55,
  sidebar: 0.65,
  controls: 0.45,
  tools: 0.75,
  dialogs: 0.38
};
function amplitudeBudget(category, animatedAncestors) {
  return 0.62 * weights[category] * 0.32 ** Math.max(0, animatedAncestors);
}
function composeFrames(settings, category, depth, _degradation = 0, gain = 1, anchorBottom = true) {
  const preset = presets[settings.preset];
  const amplitude = amplitudeBudget(category, depth) * settings.intensity / 100 * Math.max(0, Math.min(1, gain));
  return Array.from({ length: samples + 1 }, (_, index) => {
    const offset = index / samples;
    const sine = index % (samples / 2) === 0 ? 0 : Math.sin(offset * Math.PI * 2);
    const deformation = (preset.stretch + preset.squash) / 2 * sine + (preset.stretch - preset.squash) / 2 * sine * sine;
    const scaleY = 1 + deformation * amplitude;
    return {
      offset,
      easing: "linear",
      // This origin belongs to our cancellable WAAPI effect, never element.style.
      // Preserve the host's geometry when its transform needs its original origin.
      ...anchorBottom && amplitude > 0 ? { transformOrigin: "50% 100%" } : {},
      // Softer inverse compensation follows the reference's opposing axes
      // without making wide text expand as much as strict area conservation.
      scale: `${scaleY ** -0.5} ${scaleY}`,
      rotate: "0deg",
      translate: "0 0px"
    };
  });
}
function selectWithinBudget(items, limit) {
  const groups = /* @__PURE__ */ new Map();
  for (const item of items) {
    const group = groups.get(item.category) ?? [];
    group.push(item);
    groups.set(item.category, group);
  }
  const selected = [];
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

// src/motion/governor.ts
function percentile(values, fraction = 0.95) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}
var PerformanceGovernor = class {
  level = 0;
  frames = [];
  callbacks = [];
  ticks = 0;
  healthyWindows = 0;
  get frameP95() {
    return percentile(this.frames);
  }
  get callbackP95() {
    return percentile(this.callbacks);
  }
  get budget() {
    return [120, 80, 48, 28][this.level];
  }
  // Retained as a compatibility accessor. Browser timelines render every frame.
  get sampleEvery() {
    return 1;
  }
  record(frameMs, callbackMs) {
    if (frameMs > 0 && frameMs < 250) this.frames.push(frameMs);
    this.callbacks.push(Math.max(0, callbackMs));
    if (this.frames.length > 180) this.frames.shift();
    if (this.callbacks.length > 180) this.callbacks.shift();
    if (++this.ticks % 60 || this.frames.length < 90) return false;
    const previous = this.level;
    if (this.frameP95 > 22 || this.callbackP95 > 3) {
      this.level = Math.min(3, this.level + 1);
      this.healthyWindows = 0;
    } else if (this.frameP95 < 19 && this.callbackP95 < 1.8) {
      if (++this.healthyWindows >= 5) {
        this.level = Math.max(0, this.level - 1);
        this.healthyWindows = 0;
      }
    } else this.healthyWindows = 0;
    return previous !== this.level;
  }
};

// src/motion/engine.ts
var OWN_ANIMATION = "dsh-dyou-wine:";
var WineEngine = class {
  constructor(document, getTime, onError, sharedTimeline) {
    this.document = document;
    this.getTime = getTime;
    this.onError = onError;
    this.sharedTimeline = sharedTimeline;
  }
  settings;
  registry;
  guard;
  governor = new PerformanceGovernor();
  running = false;
  frame = 0;
  lastFrame = 0;
  lastRefresh = 0;
  dirty = true;
  selected = [];
  bottomAnchored = /* @__PURE__ */ new WeakMap();
  warnings = /* @__PURE__ */ new Set();
  protectedCount = 0;
  removeVisibility;
  removeResize;
  clockAnchor;
  timelineOrigin = 0;
  cycleDuration = 0;
  pendingStarts = /* @__PURE__ */ new WeakMap();
  start(settings) {
    this.settings = settings;
    try {
      const win = this.document.defaultView;
      if (!win || typeof win.Element.prototype.animate !== "function" || !win.CSS?.supports("scale", "1 1")) throw new Error("unsupportedBrowser");
      if (!this.registry) {
        this.governor = new PerformanceGovernor();
        const changed = () => {
          this.dirty = true;
        };
        this.guard = new InteractionGuard(this.document, () => win.performance.now(), changed);
        this.guard.start();
        this.registry = new TargetRegistry(
          this.document,
          changed,
          (element) => this.guard.registerApproval(element),
          (target) => this.release(target)
        );
        this.registry.start();
        const visibility = () => {
          if (this.document.hidden) {
            this.cancelFrame();
            this.clearAnimations();
          } else if (this.running) {
            this.lastFrame = 0;
            this.dirty = true;
            this.schedule();
          }
        };
        this.document.addEventListener("visibilitychange", visibility);
        this.removeVisibility = () => this.document.removeEventListener("visibilitychange", visibility);
        const resize = () => {
          this.dirty = true;
        };
        win.addEventListener("resize", resize, { passive: true });
        this.removeResize = () => win.removeEventListener("resize", resize);
      }
      this.running = true;
      this.dirty = true;
      this.lastFrame = 0;
      this.schedule();
    } catch (error) {
      this.fail(error);
    }
  }
  update(settings) {
    this.settings = settings;
    this.dirty = true;
  }
  pause() {
    this.running = false;
    this.cancelFrame();
    this.clearAnimations();
    this.selected = [];
    this.protectedCount = 0;
    this.clockAnchor = void 0;
    this.pendingStarts = /* @__PURE__ */ new WeakMap();
  }
  stop() {
    this.pause();
    this.registry?.stop();
    this.registry = void 0;
    this.guard?.stop();
    this.guard = void 0;
    this.removeVisibility?.();
    this.removeVisibility = void 0;
    this.removeResize?.();
    this.removeResize = void 0;
    this.warnings.clear();
    this.protectedCount = 0;
    this.governor = new PerformanceGovernor();
  }
  snapshot() {
    const coverage = Object.fromEntries(categories.map((category) => [category, 0]));
    const activeRoots = new Set(this.selected.filter((target) => target.animation).map((target) => target.element));
    if (activeRoots.size) for (const target of this.registry?.targets.values() ?? []) {
      if (!this.settings.ranges[target.category] || !this.registry.eligible(target)) continue;
      for (let element = target.element; element; element = composedParent(element)) {
        if (activeRoots.has(element)) {
          coverage[target.category]++;
          break;
        }
      }
    }
    return {
      total: this.registry?.targets.size ?? 0,
      active: activeRoots.size,
      protected: this.protectedCount,
      categories: coverage,
      warnings: [.../* @__PURE__ */ new Set([...this.warnings, ...this.registry?.warnings ?? []])],
      degraded: this.governor.level > 0,
      frameP95: Math.round(this.governor.frameP95 * 100) / 100,
      callbackP95: Math.round(this.governor.callbackP95 * 100) / 100
    };
  }
  schedule() {
    if (!this.frame && this.running && !this.document.hidden) this.frame = this.document.defaultView.requestAnimationFrame(this.render);
  }
  cancelFrame() {
    if (this.frame) this.document.defaultView.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
  release(target) {
    if (target.animation) {
      target.animation.cancel();
      target.animation = void 0;
    }
    target.signature = void 0;
  }
  clearAnimations() {
    for (const target of this.registry?.targets.values() ?? []) this.release(target);
  }
  fail(error) {
    this.stop();
    this.onError(error instanceof Error ? error : new Error(String(error)));
  }
  hasHostConflict(target) {
    return target.element.getAnimations().some((animation) => {
      if (animation === target.animation || animation.id.startsWith(OWN_ANIMATION)) return false;
      const effect = animation.effect;
      return effect instanceof this.document.defaultView.KeyframeEffect && effect.getKeyframes().some((frame) => "scale" in frame || "rotate" in frame || "translate" in frame || "transformOrigin" in frame);
    });
  }
  canAnchorBottom(target) {
    const win = this.document.defaultView;
    if (win.getComputedStyle(target.element).transform !== "none") return false;
    return !target.element.getAnimations().some((animation) => {
      if (animation === target.animation || animation.id.startsWith(OWN_ANIMATION)) return false;
      const effect = animation.effect;
      return effect instanceof win.KeyframeEffect && effect.getKeyframes().some((frame) => "transform" in frame);
    });
  }
  reconcile(now) {
    this.registry.refresh();
    const candidates = [...this.registry.targets.values()].filter((target) => this.settings.ranges[target.category] && this.registry.eligible(target));
    const candidateElements = new Set(candidates.map((target) => target.element));
    const roots = candidates.filter((target) => {
      for (let parent = composedParent(target.element); parent; parent = composedParent(parent)) {
        if (candidateElements.has(parent)) return false;
      }
      return true;
    });
    const selected = selectWithinBudget(roots, this.governor.budget);
    for (const target of selected) {
      target.hostConflict = this.hasHostConflict(target);
      this.bottomAnchored.set(target.element, this.canAnchorBottom(target));
    }
    const keep = new Set(selected);
    for (const target of this.selected) if (!keep.has(target)) this.release(target);
    this.selected = selected;
    this.lastRefresh = now;
    this.dirty = false;
    if (roots.length > this.governor.budget) this.warnings.add("warningBudget");
    else this.warnings.delete("warningBudget");
  }
  render = (now) => {
    this.frame = 0;
    if (!this.running || this.document.hidden) return;
    const win = this.document.defaultView;
    const begin = win.performance.now();
    try {
      const seconds = this.getTime();
      if (!Number.isFinite(seconds)) throw new Error("invalidClock");
      const sampledAt = win.performance.now();
      const sampledTimeline = this.document.timeline.currentTime;
      if (typeof sampledTimeline !== "number") throw new Error("unsupportedBrowser");
      const timelineNow = sampledTimeline + (sampledAt - now);
      const timingChanged = this.alignClock(seconds, sampledAt, timelineNow);
      const reconcile = this.dirty || now - this.lastRefresh > 250;
      if (reconcile) this.reconcile(now);
      const anchors = this.guard.anchors();
      const duration = this.cycleDuration;
      this.protectedCount = 0;
      for (const target of this.selected) {
        const protectedNow = this.guard.protected(target.element, anchors);
        if (protectedNow) {
          this.protectedCount++;
          target.wasProtected = true;
          this.release(target);
          continue;
        }
        if (target.hostConflict) {
          this.release(target);
          this.warnings.add("warningConflict");
          continue;
        }
        const pendingStart = this.pendingStarts.get(target);
        const needsNeutralJoin = target.wasProtected || pendingStart !== void 0 && timelineNow < pendingStart;
        if (pendingStart !== void 0 && timelineNow >= pendingStart) this.pendingStarts.delete(target);
        const anchorBottom = this.bottomAnchored.get(target.element) ?? false;
        const signature = `${this.settings.preset}:${this.settings.intensity}:${target.category}:${anchorBottom}`;
        let created = false;
        if (!target.animation) {
          target.animation = target.element.animate(
            composeFrames(this.settings, target.category, 0, 0, 1, anchorBottom),
            { duration, iterations: Infinity, fill: "none" }
          );
          target.animation.id = `${OWN_ANIMATION}${target.order}`;
          target.animation.finished.catch(() => {
          });
          created = true;
        } else if (target.signature !== signature) {
          target.animation.effect.setKeyframes(composeFrames(this.settings, target.category, 0, 0, 1, anchorBottom));
        }
        target.signature = signature;
        if (created || timingChanged) {
          target.animation.effect.updateTiming({ duration });
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
    } catch (error) {
      this.fail(error);
    }
  };
  alignClock(seconds, performanceNow, timelineNow) {
    const anchor = this.clockAnchor;
    if (!anchor || Math.abs(seconds - anchor.seconds - (performanceNow - anchor.performance) / 1e3) > 0.12) {
      this.clockAnchor = { seconds, performance: performanceNow, timeline: timelineNow };
    }
    const current = this.clockAnchor;
    const origin = this.sharedTimeline?.align(seconds, performanceNow, timelineNow, this.settings.offsetMs) ?? current.timeline - current.seconds * 1e3 + this.settings.offsetMs;
    const duration = 6e4 / this.settings.bpm;
    const changed = origin !== this.timelineOrigin || duration !== this.cycleDuration;
    this.timelineOrigin = origin;
    this.cycleDuration = duration;
    return changed;
  }
};

// src/assets/whale-girl.png
var whale_girl_default = "plugins/dsh-dyou-wine/assets/whale-girl.png";

// src/pet/physics.ts
var PET_ENVELOPE = 1.35;
var clamp = (value, limit) => Math.max(0, Math.min(limit, value));
function reflectAxis(position, velocity, limit, seconds) {
  const bound = Math.max(0, limit);
  const start = clamp(position, bound);
  if (!bound || !velocity || !Number.isFinite(seconds) || seconds <= 0) {
    return { position: start, velocity, collisions: 0 };
  }
  const unfolded = start + velocity * seconds;
  const collisions = velocity > 0 ? Math.floor(unfolded / bound) - Math.floor(start / bound) + (start === bound ? 1 : 0) : Math.ceil(start / bound) - Math.ceil(unfolded / bound) + (start === 0 ? 1 : 0);
  const wrapped = (unfolded % (bound * 2) + bound * 2) % (bound * 2);
  return {
    position: wrapped <= bound ? wrapped : bound * 2 - wrapped,
    velocity: collisions % 2 ? -velocity : velocity,
    collisions
  };
}
function stepFlight(state, viewportWidth, viewportHeight, seconds) {
  const x = reflectAxis(state.x, state.vx, viewportWidth - state.width, seconds);
  const y = reflectAxis(state.y, state.vy, viewportHeight - state.height, seconds);
  return {
    ...state,
    x: x.position,
    y: y.position,
    vx: x.velocity,
    vy: y.velocity,
    collisions: state.collisions + x.collisions + y.collisions
  };
}
function fitPetSize(requested, viewportWidth, viewportHeight) {
  return Math.max(0, Math.min(requested, viewportWidth / PET_ENVELOPE, viewportHeight / PET_ENVELOPE));
}
function resizeFlight(state, spriteSize, viewportWidth, viewportHeight) {
  const extent = spriteSize * PET_ENVELOPE;
  return {
    ...state,
    width: extent,
    height: extent,
    x: clamp(state.x, Math.max(0, viewportWidth - extent)),
    y: clamp(state.y, Math.max(0, viewportHeight - extent))
  };
}

// src/pet/engine.ts
function composePetFrames(settings, spriteSize) {
  const strength = { tipsy: 0.18, party: 0.28, wild: 0.3 }[settings.preset] * settings.intensity / 100;
  return Array.from({ length: 49 }, (_, index) => {
    const offset = index / 48;
    const sine = index % 24 === 0 ? 0 : Math.sin(offset * Math.PI * 2);
    const sy = 1 + strength * (sine - 0.15 * sine * sine);
    const sx = sy ** -0.5;
    const hop = -spriteSize * 0.04 * settings.intensity / 100 * Math.max(0, sine);
    return { offset, easing: "linear", translate: `0 ${hop}px`, scale: `${sx} ${sy}` };
  });
}
var PetEngine = class {
  constructor(document, getTime, onError, sharedTimeline) {
    this.document = document;
    this.getTime = getTime;
    this.onError = onError;
    this.sharedTimeline = sharedTimeline;
  }
  settings;
  root;
  body;
  animation;
  state = { x: 0, y: 0, vx: 0, vy: 0, width: 0, height: 0, collisions: 0 };
  spriteSize = 0;
  running = false;
  frame = 0;
  lastFrame;
  removeListeners;
  clockAnchor;
  timelineOrigin;
  duration = 0;
  signature = "";
  start(settings) {
    this.settings = settings;
    try {
      const win = this.document.defaultView;
      if (!win || typeof win.Element.prototype.animate !== "function" || !win.CSS?.supports("scale", "1 1")) throw new Error("unsupportedBrowser");
      if (!this.root) this.mount();
      this.running = true;
      this.lastFrame = void 0;
      this.clockAnchor = void 0;
      this.resize();
      this.setSpeed();
      this.refreshFrames();
      if (!this.document.hidden) {
        this.animation.play();
        this.synchronize(win.performance.now());
        this.schedule();
      } else this.animation.pause();
    } catch (error) {
      this.fail(error);
    }
  }
  update(settings) {
    this.settings = settings;
    if (!this.root) return;
    try {
      this.resize();
      this.setSpeed();
      this.refreshFrames();
      if (this.running && !this.document.hidden) this.synchronize(this.document.defaultView.performance.now());
    } catch (error) {
      this.fail(error);
    }
  }
  pause() {
    this.running = false;
    this.cancelFrame();
    this.animation?.pause();
    this.lastFrame = void 0;
    this.clockAnchor = void 0;
  }
  stop() {
    this.pause();
    this.animation?.cancel();
    this.animation = void 0;
    this.root?.remove();
    this.root = void 0;
    this.body = void 0;
    this.removeListeners?.();
    this.removeListeners = void 0;
    this.state = { x: 0, y: 0, vx: 0, vy: 0, width: 0, height: 0, collisions: 0 };
    this.signature = "";
    this.timelineOrigin = void 0;
    this.duration = 0;
  }
  snapshot() {
    return { ...this.state, active: this.running && !this.document.hidden };
  }
  mount() {
    const win = this.document.defaultView;
    const root = this.document.createElement("div");
    root.dataset.dyouWine = "pet";
    root.dataset.wineOwned = "";
    root.dataset.winePet = "";
    root.setAttribute("aria-hidden", "true");
    root.style.cssText = "position:fixed;left:0;top:0;pointer-events:none;z-index:9;contain:layout style;will-change:transform;user-select:none;";
    const body = this.document.createElement("div");
    body.dataset.winePetBody = "";
    body.style.cssText = "position:absolute;pointer-events:none;transform-origin:50% 50%;will-change:scale,translate;";
    const sprite = this.document.createElement("img");
    sprite.src = whale_girl_default;
    sprite.alt = "\u5927\u80A5\u9C7C\u5A18";
    sprite.draggable = false;
    sprite.dataset.winePetSprite = "";
    sprite.style.cssText = "display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;";
    const imageError = () => this.fail(new Error("petAssetError"));
    sprite.addEventListener("error", imageError);
    body.append(sprite);
    root.append(body);
    this.root = root;
    this.body = body;
    this.document.body.append(root);
    const angle = (30 + Math.random() * 30) * Math.PI / 180;
    this.state.vx = Math.cos(angle) * this.settings.petSpeed * (Math.random() < 0.5 ? -1 : 1);
    this.state.vy = Math.sin(angle) * this.settings.petSpeed * (Math.random() < 0.5 ? -1 : 1);
    this.resize();
    this.state.x = Math.max(0, win.innerWidth - this.state.width) * (0.2 + Math.random() * 0.6);
    this.state.y = Math.max(0, win.innerHeight - this.state.height) * (0.2 + Math.random() * 0.6);
    this.draw();
    const resize = () => {
      try {
        this.resize();
        this.refreshFrames();
      } catch (error) {
        this.fail(error);
      }
    };
    const visibility = () => {
      this.lastFrame = void 0;
      this.clockAnchor = void 0;
      if (this.document.hidden) {
        this.cancelFrame();
        this.animation?.pause();
      } else if (this.running) {
        try {
          this.animation?.play();
          this.synchronize(win.performance.now());
          this.schedule();
        } catch (error) {
          this.fail(error);
        }
      }
    };
    win.addEventListener("resize", resize, { passive: true });
    this.document.addEventListener("visibilitychange", visibility);
    this.removeListeners = () => {
      win.removeEventListener("resize", resize);
      this.document.removeEventListener("visibilitychange", visibility);
      sprite.removeEventListener("error", imageError);
    };
  }
  resize() {
    const win = this.document.defaultView;
    this.spriteSize = fitPetSize(this.settings.petSize, win.innerWidth, win.innerHeight);
    this.state = resizeFlight(this.state, this.spriteSize, win.innerWidth, win.innerHeight);
    if (!this.root || !this.body) return;
    this.root.style.width = `${this.state.width}px`;
    this.root.style.height = `${this.state.height}px`;
    this.body.style.width = `${this.spriteSize}px`;
    this.body.style.height = `${this.spriteSize}px`;
    const inset = this.spriteSize * (PET_ENVELOPE - 1) / 2;
    this.body.style.left = `${inset}px`;
    this.body.style.top = `${inset}px`;
    this.draw();
  }
  setSpeed() {
    const speed = Math.hypot(this.state.vx, this.state.vy);
    if (speed > 0) {
      this.state.vx = this.state.vx / speed * this.settings.petSpeed;
      this.state.vy = this.state.vy / speed * this.settings.petSpeed;
    }
  }
  refreshFrames() {
    if (!this.body) return;
    const signature = `${this.settings.preset}:${this.settings.intensity}:${this.spriteSize}`;
    if (!this.animation) {
      this.animation = this.body.animate(composePetFrames(this.settings, this.spriteSize), {
        duration: 6e4 / this.settings.bpm,
        iterations: Infinity,
        fill: "both"
      });
      this.animation.id = "dsh-dyou-wine:pet:q";
      this.animation.finished.catch(() => {
      });
      if (!this.running || this.document.hidden) this.animation.pause();
    } else if (signature !== this.signature) {
      this.animation.effect.setKeyframes(composePetFrames(this.settings, this.spriteSize));
    }
    this.signature = signature;
  }
  synchronize(performanceNow) {
    const seconds = this.getTime();
    const timelineNow = this.document.timeline.currentTime;
    if (!Number.isFinite(seconds)) throw new Error("invalidClock");
    if (typeof timelineNow !== "number") throw new Error("unsupportedBrowser");
    const anchor = this.clockAnchor;
    if (!anchor || Math.abs(seconds - anchor.seconds - (performanceNow - anchor.performance) / 1e3) > 0.12) {
      this.clockAnchor = { seconds, performance: performanceNow, timeline: timelineNow };
    }
    const current = this.clockAnchor;
    const origin = this.sharedTimeline?.align(seconds, performanceNow, timelineNow, this.settings.offsetMs) ?? current.timeline - current.seconds * 1e3 + this.settings.offsetMs;
    const duration = 6e4 / this.settings.bpm;
    if (origin !== this.timelineOrigin || duration !== this.duration) {
      this.animation.effect.updateTiming({ duration });
      const cycle = Math.floor((timelineNow - origin) / duration);
      this.animation.startTime = origin + Math.min(0, cycle) * duration;
      this.timelineOrigin = origin;
      this.duration = duration;
    }
  }
  draw() {
    if (this.root) this.root.style.transform = `translate3d(${this.state.x}px, ${this.state.y}px, 0)`;
  }
  schedule() {
    if (!this.frame && this.running && !this.document.hidden) this.frame = this.document.defaultView.requestAnimationFrame(this.render);
  }
  cancelFrame() {
    if (this.frame) this.document.defaultView.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
  render = (now) => {
    this.frame = 0;
    if (!this.running || this.document.hidden) return;
    try {
      const win = this.document.defaultView;
      if (this.lastFrame !== void 0) {
        this.state = stepFlight(this.state, win.innerWidth, win.innerHeight, Math.max(0, now - this.lastFrame) / 1e3);
        this.draw();
      }
      this.lastFrame = now;
      this.synchronize(win.performance.now());
      this.schedule();
    } catch (error) {
      this.fail(error);
    }
  };
  fail(error) {
    this.stop();
    this.onError(error instanceof Error ? error : new Error(String(error)));
  }
};

// src/controller.ts
var WineController = class {
  constructor(doc) {
    this.doc = doc;
    let saved;
    try {
      saved = JSON.parse(doc.defaultView.localStorage.getItem("dsh-dyou-wine.settings.v1") ?? "null");
    } catch {
    }
    this.settings = sanitizeSettings(saved ?? defaults);
    Object.assign(this.settings, {
      bpm: defaults.bpm,
      offsetMs: defaults.offsetMs,
      intensity: defaults.intensity,
      petSize: defaults.petSize,
      petSpeed: defaults.petSpeed,
      ranges: { ...defaults.ranges },
      loop: true,
      hiddenAudio: false,
      shortcut: "Escape"
    });
    this.audio = new LocalAudio(doc, () => this.pause());
    this.music = new BundledMusic(doc, () => {
      this.error = "musicLoadError";
      this.emit();
    });
    this.engine = new WineEngine(doc, () => this.audio.loaded ? this.audio.time : this.clock.time, (err) => this.fail(err), this.timeline);
    this.pet = new PetEngine(doc, () => this.audio.loaded ? this.audio.time : this.clock.time, (err) => this.fail(err), this.timeline);
    this.reducedMotion = doc.defaultView.matchMedia("(prefers-reduced-motion: reduce)");
    doc.addEventListener("keydown", this.keydown);
    doc.addEventListener("visibilitychange", this.visibility);
    this.reducedMotion.addEventListener("change", this.motionChange);
  }
  settings;
  state = "stopped";
  error = "";
  audio;
  music;
  engine;
  pet;
  reducedMotion;
  clock = new BeatClock();
  timeline = new SharedBeatTimeline();
  taps = [];
  resumeOnVisible = false;
  disposed = false;
  generation = 0;
  runningEffects = /* @__PURE__ */ new Set();
  listeners = /* @__PURE__ */ new Set();
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  emit() {
    for (const listener of this.listeners) listener();
  }
  motionChange = () => {
    if (this.reducedMotion.matches) this.pause();
    this.emit();
  };
  keydown = (event) => {
    if (event.key.toLowerCase() === this.settings.shortcut.toLowerCase()) this.stop();
  };
  visibility = () => {
    if (this.doc.hidden) {
      this.music.pause();
      this.resumeOnVisible = this.state === "running";
      this.engine.pause();
      this.pet.pause();
      this.runningEffects.clear();
      this.timeline.reset();
      if (!this.settings.hiddenAudio) {
        this.audio.pause();
        this.clock.pause();
      }
    } else if (this.resumeOnVisible && this.state === "running") {
      this.resumeOnVisible = false;
      void this.start();
    }
  };
  update(patch) {
    const previous = this.settings;
    this.settings = sanitizeSettings({ ...this.settings, ...patch });
    this.audio.configure(this.settings.volume, this.settings.loop);
    if (this.state !== "stopped") this.syncEffects(previous);
    this.syncMusic();
    try {
      this.doc.defaultView.localStorage.setItem("dsh-dyou-wine.settings.v1", JSON.stringify(this.settings));
    } catch {
    }
    this.emit();
  }
  async start() {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.error = "";
    try {
      this.audio.configure(this.settings.volume, this.settings.loop);
      await this.audio.play();
      if (generation !== this.generation || this.disposed) {
        if (this.state !== "running") this.audio.pause();
        return;
      }
      this.clock.start();
      this.timeline.reset();
      this.state = "running";
      if (this.doc.hidden) {
        this.resumeOnVisible = true;
        if (!this.settings.hiddenAudio) {
          this.audio.pause();
          this.clock.pause();
        }
      } else if (!this.syncEffects()) return;
      this.syncMusic();
      this.emit();
    } catch (error) {
      if (generation === this.generation) this.fail(error);
    }
  }
  pause() {
    ++this.generation;
    this.resumeOnVisible = false;
    this.audio.pause();
    this.clock.pause();
    this.engine.pause();
    this.pet.pause();
    this.music.pause();
    this.runningEffects.clear();
    this.timeline.reset();
    if (this.state !== "stopped") this.state = "paused";
    this.emit();
  }
  stop() {
    ++this.generation;
    this.resumeOnVisible = false;
    this.audio.release();
    this.clock.reset();
    this.engine.stop();
    this.pet.stop();
    this.music.stop();
    this.runningEffects.clear();
    this.timeline.reset();
    this.state = "stopped";
    this.error = "";
    this.emit();
  }
  selectAudio(file) {
    this.pause();
    try {
      this.audio.select(file);
      this.error = "";
    } catch (error) {
      this.fail(error);
    }
    this.emit();
  }
  manual() {
    this.pause();
    this.audio.release();
    this.emit();
  }
  seek(seconds) {
    this.audio.seek(seconds);
    this.emit();
  }
  tap(now = performance.now()) {
    if (this.taps.length && now - this.taps[this.taps.length - 1] > 2e3) this.taps = [];
    this.taps = [...this.taps.slice(-7), now];
    const bpm = tapBpm(this.taps);
    if (bpm) this.update({ bpm });
  }
  fail(error) {
    this.pause();
    this.engine.stop();
    this.pet.stop();
    this.error = error instanceof Error ? error.message : String(error);
    this.emit();
  }
  dispose() {
    this.disposed = true;
    this.stop();
    this.audio.dispose();
    this.music.dispose();
    this.doc.removeEventListener("keydown", this.keydown);
    this.doc.removeEventListener("visibilitychange", this.visibility);
    this.reducedMotion.removeEventListener("change", this.motionChange);
    this.listeners.clear();
  }
  syncMusic() {
    if (this.settings.musicEnabled && this.state === "running" && !this.doc.hidden && !this.disposed) {
      this.error = this.error === "musicLoadError" ? "" : this.error;
      void this.music.play();
    } else {
      this.music.pause();
      if (this.error === "musicLoadError") this.error = "";
    }
  }
  syncEffects(previous) {
    const generation = this.generation;
    try {
      for (const [key, effect] of [["pageEnabled", this.engine], ["petEnabled", this.pet]]) {
        if (!this.settings[key]) {
          if (previous?.[key] || this.runningEffects.has(key)) effect.stop();
          this.runningEffects.delete(key);
        } else if (this.state === "running" && !this.doc.hidden) {
          if (this.runningEffects.has(key)) effect.update(this.settings);
          else {
            this.runningEffects.add(key);
            effect.start(this.settings);
          }
        } else effect.update(this.settings);
        if (generation !== this.generation || this.disposed) return false;
      }
      return true;
    } catch (error) {
      if (generation === this.generation) this.fail(error);
      return false;
    }
  }
};

// src/ui/messages.ts
var zhCN = {
  title: "D\u53CB\u306E\u9152",
  open: "\u5C55\u5F00\u8282\u62CD\u9762\u677F",
  close: "\u6536\u8D77\u9762\u677F",
  subtitle: "\u56FA\u5B9A\u8282\u594F\uFF0C\u4E00\u8D77\u8E66\u3002",
  effects: "\u6548\u679C",
  pageEffect: "\u754C\u9762\u5F8B\u52A8",
  petEffect: "\u98DE\u884C\u73A9\u5076",
  effectsHint: "\u53EF\u540C\u65F6\u5F00\u542F \xB7 \u56FA\u5B9A 120 BPM",
  music: "\u97F3\u4E50",
  musicEnabled: "\u539F\u6897 BGM",
  stopHint: "\u968F\u65F6\u9192\u9152",
  musicHint: "\u5185\u7F6E\u97F3\u9891 \xB7 \u5FAA\u73AF\u64AD\u653E\u3002\u6682\u505C\u540E\u7EE7\u7EED\uFF0C\u9192\u9152\u540E\u4ECE\u5934\u64AD\u653E\u3002",
  audioCredit: "\u97F3\u9891\uFF1A",
  musicUnavailable: "BGM \u6682\u4E0D\u53EF\u7528\uFF0C\u5173\u95ED\u97F3\u4E50\u540E\u53EF\u7EE7\u7EED\u5F8B\u52A8\u3002",
  musicLoadError: "BGM \u64AD\u653E\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u6216\u5173\u95ED\u97F3\u4E50\u3002",
  noEffects: "\u672A\u5F00\u542F\u6548\u679C",
  noEffectsHint: "\u52FE\u9009\u754C\u9762\u5F8B\u52A8\u6216\u98DE\u884C\u73A9\u5076\uFF0C\u518D\u70B9\u51FB\u5F00\u559D\u3002",
  petSize: "\u89D2\u8272\u5927\u5C0F (px)",
  petSpeed: "\u98DE\u884C\u901F\u5EA6 (px/s)",
  petHint: "\u5927\u80A5\u9C7C\u5A18 \xB7 \u5300\u901F\u98DE\u884C\u3001\u78B0\u5899\u53CD\u5F39\u3002\u8282\u62CD\u548C\u98DE\u884C\u72EC\u7ACB\uFF0C\u89D2\u8272\u4E0D\u4F1A\u6321\u4F4F\u70B9\u51FB\u3002",
  petBoundary: "\u98DE\u884C\u8303\u56F4\u4E3A DSH \u9875\u9762\u53EF\u89C6\u533A\uFF1B\u4E0D\u4F1A\u98DE\u51FA\u6D4F\u89C8\u5668\u3002",
  collisions: "\u78B0\u5899\u6B21\u6570",
  start: "\u5F00\u559D",
  resume: "\u7EE7\u7EED\u559D",
  pause: "\u6682\u505C",
  stop: "\u9192\u9152",
  stopped: "\u5C1A\u672A\u5F00\u559D",
  running: "\u6B63\u5728\u5F8B\u52A8",
  paused: "\u5DF2\u6682\u505C",
  strength: "\u5F3A\u5EA6",
  tipsy: "\u5FAE\u91BA",
  party: "\u4E0A\u5934",
  wild: "\u6574\u6D3B",
  intensity: "\u603B\u5F3A\u5EA6",
  rhythm: "\u8282\u62CD",
  bpm: "BPM",
  tap: "\u70B9\u51FB\u6D4B\u901F",
  offset: "\u76F8\u4F4D\u504F\u79FB",
  manual: "\u65E0\u97F3\u9891\u8282\u62CD",
  local: "\u9009\u62E9\u672C\u5730\u97F3\u9891",
  source: "\u8282\u594F\u6765\u6E90",
  volume: "\u97F3\u91CF",
  loop: "\u5FAA\u73AF\u64AD\u653E",
  seek: "\u64AD\u653E\u8FDB\u5EA6",
  hiddenAudio: "\u5207\u5230\u540E\u53F0\u65F6\u7EE7\u7EED\u64AD\u653E\u97F3\u9891",
  fileHint: "\u97F3\u9891\u53EA\u5728\u6D4F\u89C8\u5668\u5185\u64AD\u653E\uFF0C\u4E0D\u4F1A\u4E0A\u4F20\u3002\u9192\u9152\u540E\u91CA\u653E\u6587\u4EF6\u3002",
  ranges: "\u53C2\u4E0E\u533A\u57DF",
  messages: "\u6D88\u606F\u5757",
  text: "\u6B63\u6587\u6587\u5B57",
  input: "\u8F93\u5165\u533A",
  sidebar: "\u4FA7\u680F",
  controls: "\u6309\u94AE\u4E0E\u56FE\u6807",
  tools: "\u5DE5\u5177\u4E0E\u4EE3\u7801",
  dialogs: "\u83DC\u5355\u4E0E\u5F39\u7A97",
  safety: "\u4EA4\u4E92\u4E0E\u517C\u5BB9",
  shortcut: "\u9192\u9152\u5FEB\u6377\u952E",
  shortcutHint: "Escape\u3001\u5355\u4E2A\u5B57\u6BCD\u6216 F2\u2013F9\u3002\u9ED8\u8BA4 Escape\uFF0C\u540C\u65F6\u4FDD\u7559\u5BBF\u4E3B\u884C\u4E3A\u3002",
  reduced: "\u7CFB\u7EDF\u5DF2\u542F\u7528\u51CF\u5C11\u52A8\u6001\u6548\u679C\uFF1B\u70B9\u51FB\u300C\u5F00\u559D\u300D\u9884\u89C8\u3002",
  compatibility: "DSH 0.2.0-rc.2 Web \u9002\u914D\u5668\uFF1B\u5176\u4ED6\u7248\u672C\u8986\u76D6\u60C5\u51B5\u5F85\u786E\u8BA4\u3002",
  limits: "\u8DE8\u57DF iframe\u3001\u5C01\u95ED Shadow DOM \u4E0E Canvas \u5185\u90E8\u4E0D\u80FD\u72EC\u7ACB\u5F8B\u52A8\uFF1B\u6709\u51B2\u7A81\u7684\u533A\u57DF\u81EA\u52A8\u8DF3\u8FC7\u3002",
  active: "\u6D3B\u52A8",
  protected: "\u4FDD\u62A4",
  targets: "\u5DF2\u8BC6\u522B",
  degraded: "\u5DF2\u51CF\u5C11\u53C2\u4E0E\u6570\u91CF\uFF0C\u8282\u594F\u56FA\u5B9A",
  healthy: "\u6B63\u5E38\u9884\u7B97",
  coverage: "\u53EF\u89C1\u8986\u76D6",
  frame: "\u5E27\u95F4\u9694 p95",
  callback: "\u56DE\u8C03 p95",
  noTargets: "\u5C1A\u672A\u8BC6\u522B\u5230\u804A\u5929\u533A\u57DF\u3002\u8BF7\u6253\u5F00\u4E00\u4E2A\u4F1A\u8BDD\uFF1B\u672A\u77E5\u754C\u9762\u4F7F\u7528\u4FDD\u5B88\u8303\u56F4\u3002",
  guardHint: "\u8F93\u5165\u3001\u7EC4\u5408\u8F93\u5165\u3001\u9009\u533A\u548C\u5BA1\u6279\u533A\u57DF\u4F1A\u4FDD\u6301\u7A33\u5B9A\u3002",
  error: "\u65E0\u6CD5\u542F\u52A8\uFF0C\u8BF7\u91CD\u8BD5\uFF1B\u97F3\u4E50\u5F02\u5E38\u65F6\u53EF\u5173\u95ED BGM\u3002",
  audioTooLarge: "\u97F3\u9891\u8D85\u8FC7 200 MB\uFF0C\u8BF7\u9009\u62E9\u8F83\u5C0F\u7684\u6587\u4EF6\u3002",
  resetFile: "\u5207\u56DE\u65E0\u97F3\u9891",
  ms: "\u6BEB\u79D2",
  emptyFile: "\u672A\u9009\u62E9\u97F3\u9891",
  warningBudget: "\u53EF\u89C1\u76EE\u6807\u8D85\u8FC7\u9884\u7B97\uFF0C\u5DF2\u51CF\u5C11\u72EC\u7ACB\u76EE\u6807\u5E76\u4FDD\u7559\u5404\u7C7B\u533A\u57DF\u3002",
  warningConflict: "\u90E8\u5206\u533A\u57DF\u5DF2\u6709\u72EC\u7ACB\u53D8\u6362\u52A8\u753B\uFF0C\u5DF2\u8DF3\u8FC7\u4EE5\u907F\u514D\u51B2\u7A81\u3002",
  warningIntersection: "\u6D4F\u89C8\u5668\u7F3A\u5C11\u53EF\u89C1\u6027\u89C2\u5BDF\u5668\uFF0C\u6B63\u5728\u4F7F\u7528\u4F4E\u9891\u51E0\u4F55\u68C0\u6D4B\u3002",
  warningAnchor: "\u672A\u68C0\u6D4B\u5230 DSH \u5BF9\u8BDD\u951A\u70B9\uFF0C\u5F53\u524D\u4F7F\u7528\u4FDD\u5B88\u9002\u914D\uFF1B\u8BF7\u6253\u5F00\u4F1A\u8BDD\u540E\u67E5\u770B\u8986\u76D6\u3002",
  warningFrame: "iframe \u5185\u90E8\u548C\u5C01\u95ED Shadow DOM \u5C1A\u672A\u9002\u914D\u3002",
  warningCanvas: "Canvas \u4EC5\u6309\u6574\u4E2A\u753B\u5E03\u5904\u7406\uFF0C\u5185\u90E8\u6587\u5B57\u65E0\u6CD5\u5355\u72EC\u53C2\u4E0E\u3002",
  unsupportedBrowser: "\u6D4F\u89C8\u5668\u7F3A\u5C11 Web Animations API \u6216\u72EC\u7ACB\u53D8\u6362\u5C5E\u6027\uFF0C\u65E0\u6CD5\u5B89\u5168\u542F\u52A8\u3002",
  invalidClock: "\u8282\u594F\u65F6\u949F\u5F02\u5E38\uFF0C\u6548\u679C\u5DF2\u505C\u6B62\u3002",
  petAssetError: "\u73A9\u5076\u56FE\u7247\u672A\u80FD\u52A0\u8F7D\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u540E\u91CD\u8BD5\u3002"
};
var enUS = {
  title: "D\u53CB\u306E\u9152",
  open: "Open beat panel",
  close: "Collapse panel",
  subtitle: "One steady beat. Bounce together.",
  effects: "Effects",
  pageEffect: "Page motion",
  petEffect: "Flying pet",
  effectsHint: "Enable either or both \xB7 Fixed 120 BPM",
  music: "Music",
  musicEnabled: "Original meme BGM",
  stopHint: "to stop anytime",
  musicHint: "Bundled audio \xB7 Loops locally. Pause keeps your place; Sober up resets it.",
  audioCredit: "Audio: ",
  musicUnavailable: "BGM is unavailable. Turn music off to continue motion.",
  musicLoadError: "BGM could not play. Try again or turn music off.",
  noEffects: "No effects enabled",
  noEffectsHint: "Enable page motion or the flying pet, then start.",
  petSize: "Pet size (px)",
  petSpeed: "Flight speed (px/s)",
  petHint: "Whale girl \xB7 Constant-speed flight and wall reflections. A separate steady beat, with click-through artwork.",
  petBoundary: "The pet flies within the DSH viewport, inside your browser.",
  collisions: "Wall hits",
  start: "Start",
  resume: "Resume",
  pause: "Pause",
  stop: "Sober up",
  stopped: "Ready when you are",
  running: "Moving to the beat",
  paused: "Paused",
  strength: "Motion",
  tipsy: "Tipsy",
  party: "Party",
  wild: "Wild",
  intensity: "Intensity",
  rhythm: "Beat",
  bpm: "BPM",
  tap: "Tap tempo",
  offset: "Phase offset",
  manual: "Silent beat",
  local: "Choose local audio",
  source: "Beat source",
  volume: "Volume",
  loop: "Loop audio",
  seek: "Playback position",
  hiddenAudio: "Keep audio playing in the background",
  fileHint: "Audio stays in this browser. Sober up releases the file.",
  ranges: "Motion regions",
  messages: "Messages",
  text: "Body text",
  input: "Composer",
  sidebar: "Sidebar",
  controls: "Buttons & icons",
  tools: "Tools & code",
  dialogs: "Menus & dialogs",
  safety: "Interaction & compatibility",
  shortcut: "Stop shortcut",
  shortcutHint: "Escape, one letter, or F2\u2013F9. Host keyboard handling is preserved.",
  reduced: "Reduced motion is enabled. Choose Start to preview.",
  compatibility: "DSH 0.2.0-rc.2 Web adapter. Coverage on other versions is unconfirmed.",
  limits: "Cross-origin frames, closed shadow roots and canvas contents move only as a whole. Conflicting regions are skipped.",
  active: "Active",
  protected: "Protected",
  targets: "Discovered",
  degraded: "Fewer targets; rhythm unchanged",
  healthy: "Within target budget",
  coverage: "Visible coverage",
  frame: "Frame interval p95",
  callback: "Callback p95",
  noTargets: "No chat region found yet. Open a conversation. Unknown layouts use a conservative scope.",
  guardHint: "Typing, composition, selections and approvals stay steady.",
  error: "Could not start. Try again, or turn BGM off if audio cannot play.",
  audioTooLarge: "Audio exceeds 200 MB. Choose a smaller file.",
  resetFile: "Use silent beat",
  ms: "ms",
  emptyFile: "No audio selected",
  warningBudget: "Visible targets exceed the budget. Fewer independent targets preserve coverage across regions.",
  warningConflict: "Some regions already animate independent transforms and have been skipped.",
  warningIntersection: "IntersectionObserver is unavailable. Low-frequency geometry checks are active.",
  warningAnchor: "No DSH chat anchors found. A conservative adapter is active; open a conversation to check coverage.",
  warningFrame: "Frame contents and closed shadow roots are not adapted.",
  warningCanvas: "Canvas moves as a whole; its internal text cannot move independently.",
  unsupportedBrowser: "This browser lacks Web Animations or independent transforms. Motion cannot start safely.",
  invalidClock: "The beat clock returned an invalid time. Motion has stopped.",
  petAssetError: "The pet image could not load. Refresh the page and try again."
};

// src/ui/styles.ts
var styles = `
[data-dyou-ui] { --wine-bg:var(--dsw-alias-bg-layer-1, light-dark(oklch(99% 0 0), oklch(23% .008 270))); --wine-text:var(--dsw-alias-label-primary,light-dark(oklch(23% .01 270),oklch(94% .004 270))); --wine-muted:var(--dsw-alias-label-secondary,light-dark(oklch(43% .01 270),oklch(77% .008 270))); --wine-border:var(--dsw-alias-border-l2,light-dark(oklch(84% .004 270),oklch(41% .008 270))); --wine-accent:var(--dsw-alias-state-business-primary,light-dark(oklch(44% .16 12),oklch(77% .12 12))); position:fixed; inset:auto 18px 18px auto; z-index:10; pointer-events:auto; color:var(--wine-text); font:13px/1.5 system-ui,sans-serif; color-scheme:inherit; max-width:calc(100vw - 24px); }
[data-dyou-ui] * { box-sizing:border-box; }
[data-dyou-ui] [hidden] { display:none!important; }
[data-dyou-ui] button,[data-dyou-ui] input { font:inherit; accent-color:var(--wine-accent); }
[data-dyou-ui] button { border:1px solid var(--wine-border); border-radius:7px; background:var(--wine-bg); color:var(--wine-text); padding:7px 10px; min-height:36px; }
[data-dyou-ui] button { cursor:pointer; white-space:nowrap; }
[data-dyou-ui] button:hover { background:color-mix(in oklch,var(--wine-text) 7%,var(--wine-bg)); }
[data-dyou-ui] button:active { background:color-mix(in oklch,var(--wine-text) 12%,var(--wine-bg)); }
[data-dyou-ui] :focus-visible { outline:2px solid var(--wine-accent); outline-offset:3px; }
[data-dyou-ui] button:disabled { cursor:default; opacity:.45; }
[data-dyou-ui] .wine-primary { background:var(--wine-accent); color:var(--dsw-alias-label-primary-foreground,light-dark(white,oklch(20% .01 270))); border-color:var(--wine-accent); }
[data-dyou-ui] .wine-primary:hover { filter:brightness(.94); background:var(--wine-accent); }
[data-dyou-ui] .wine-dock { display:flex; align-items:center; justify-content:flex-end; gap:6px; pointer-events:auto; }
[data-dyou-ui] .wine-panel { width:320px; max-width:calc(100vw - 24px); max-height:calc(100dvh - 80px); overflow-y:auto; background:var(--wine-bg); border:1px solid var(--wine-border); border-radius:12px; padding:18px; margin-bottom:8px; pointer-events:auto; }
[data-dyou-ui] .wine-panel[hidden] { display:none; }
[data-dyou-ui] h2 { font-size:18px; font-weight:650; margin:0 0 3px; }
[data-dyou-ui] p { margin:0; color:var(--wine-muted); }
[data-dyou-ui] .wine-subtitle { margin-bottom:16px; }
[data-dyou-ui] fieldset { border:0; border-top:1px solid var(--wine-border); margin:16px 0 0; padding:10px 0 0; min-width:0; }
[data-dyou-ui] legend { padding:0 7px 0 0; font-weight:600; }
[data-dyou-ui] .wine-row { display:flex; align-items:center; gap:12px; margin:12px 0 0; }
[data-dyou-ui] .wine-row input[type=range] { flex:1; width:100%; min-width:0; margin:0; min-height:28px; }
[data-dyou-ui] .wine-row input:disabled { opacity:.45; }
[data-dyou-ui] .wine-actions { margin-top:20px; gap:8px; }
[data-dyou-ui] .wine-actions button { flex:1; }
[data-dyou-ui] .wine-presets { display:flex; gap:6px; }
[data-dyou-ui] .wine-presets button { flex:1; }
[data-dyou-ui] [aria-pressed=true] { border-color:var(--wine-accent); color:var(--wine-accent); background:color-mix(in oklch,var(--wine-accent) 10%,var(--wine-bg)); }
[data-dyou-ui] .wine-checks { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
[data-dyou-ui] .wine-checks label,[data-dyou-ui] .wine-check { display:flex; gap:7px; align-items:center; min-height:32px; cursor:pointer; }
[data-dyou-ui] input[type=checkbox] { margin:0; width:16px; height:16px; flex-shrink:0; }
[data-dyou-ui] .wine-note { font-size:12px; margin:7px 0; overflow-wrap:anywhere; }
[data-dyou-ui] .wine-note a { color:inherit; text-decoration:underline; text-underline-offset:2px; }
[data-dyou-ui] .wine-status { font-size:12px; color:var(--wine-muted); margin:10px 0; }
[data-dyou-ui] .wine-error { color:var(--dsw-alias-state-error-primary,light-dark(oklch(43% .18 25),oklch(80% .12 25))); }
[data-dyou-ui] .wine-footer { font-size:12px; margin-top:12px; }
[data-dyou-ui] kbd { font:11px/1.2 system-ui,sans-serif; border:1px solid var(--wine-border); border-radius:4px; padding:2px 4px; margin-right:3px; }
@media(max-width:480px) { [data-dyou-ui] { right:12px; bottom:12px; } }
@media(prefers-reduced-motion:reduce) { [data-dyou-ui] * { transition:none!important; } }
`;

// src/ui/panel.ts
function mountPanel(root, translate = (key) => zhCN[key] ?? key, controller = new WineController(root.ownerDocument)) {
  root.dataset.dyouUi = "";
  root.dataset.wineOwned = "";
  const doc = root.ownerDocument;
  let expanded = false;
  const escape = (value) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const t = (key) => escape(translate(key));
  const $ = (selector) => root.querySelector(selector);
  function render() {
    const s = controller.settings;
    root.innerHTML = `<style>${styles}</style>
      <section class="wine-panel" id="dyou-wine-panel" aria-label="${t("title")}" ${expanded ? "" : "hidden"}>
        <h2>${t("title")}</h2><p class="wine-subtitle">${t("subtitle")}</p>
        <p class="wine-note" data-reduced ${controller.reducedMotion.matches ? "" : "hidden"}>${t("reduced")}</p>
        <fieldset><legend>${t("effects")}</legend><div class="wine-checks"><label><input id="wine-page-enabled" type="checkbox" data-setting="pageEnabled" ${s.pageEnabled ? "checked" : ""}> ${t("pageEffect")}</label><label><input id="wine-pet-enabled" type="checkbox" data-setting="petEnabled" ${s.petEnabled ? "checked" : ""}> ${t("petEffect")}</label></div><p class="wine-note">${t("effectsHint")}</p></fieldset>
        <fieldset><legend>${t("strength")}</legend><div class="wine-presets">${["tipsy", "party", "wild"].map((p) => `<button data-preset="${p}" aria-pressed="${s.preset === p}">${t(p)}</button>`).join("")}</div></fieldset>
        <fieldset><legend>${t("music")}</legend><label class="wine-check"><input id="wine-music-enabled" type="checkbox" data-setting="musicEnabled" ${s.musicEnabled ? "checked" : ""}> ${t("musicEnabled")}</label>
        <p class="wine-note">${t("musicHint")}</p><p class="wine-note">${t("audioCredit")}<a data-wine-music-source href="${musicSource}" target="_blank" rel="noopener noreferrer">BV1hXbN6VEKV</a></p></fieldset>
        <div class="wine-row wine-actions"><button class="wine-primary" data-action="start">${t("start")}</button><button data-action="pause">${t("pause")}</button></div>
        <div class="wine-status" role="status" data-state></div><p class="wine-note wine-error" role="alert" data-error hidden></p>
        <p class="wine-note" data-warning hidden></p><p class="wine-footer"><kbd>${escape(s.shortcut)}</kbd> ${t("stopHint")}</p>
      </section><div class="wine-dock"><button data-action="toggle" aria-controls="dyou-wine-panel" aria-expanded="${expanded}" aria-label="${t(expanded ? "close" : "open")}">${t("title")} \u25B4</button><button data-action="stop">${t("stop")}</button></div>`;
    root.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
      switch (button.dataset.action) {
        case "toggle":
          expanded = !expanded;
          render();
          break;
        case "start":
          void controller.start();
          break;
        case "pause":
          controller.pause();
          break;
        case "stop":
          controller.stop();
          break;
      }
    }));
    root.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
      controller.update({ preset: button.dataset.preset });
      root.querySelectorAll("[data-preset]").forEach((el) => el.setAttribute("aria-pressed", String(el === button)));
    }));
    root.querySelectorAll("[data-setting]").forEach((input) => input.addEventListener("input", () => {
      const key = input.dataset.setting;
      const value = input.type === "checkbox" ? input.checked : Number(input.value);
      controller.update({ [key]: value });
    }));
    refresh();
  }
  function refresh() {
    $("#wine-music-enabled").checked = controller.settings.musicEnabled;
    const translateText = (key) => translate(key);
    const effects = [controller.settings.pageEnabled && translateText("pageEffect"), controller.settings.petEnabled && translateText("petEffect")].filter(Boolean).join(" + ") || translateText("noEffects");
    $("[data-state]").textContent = `${translateText(controller.state)} \xB7 ${effects}`;
    $('[data-action="start"]').textContent = translateText(controller.state === "paused" ? "resume" : "start");
    $('[data-action="pause"]').disabled = controller.state !== "running";
    const error = $("[data-error]");
    error.hidden = !controller.error;
    error.textContent = ["audioTooLarge", "unsupportedBrowser", "invalidClock", "petAssetError", "musicUnavailable", "musicLoadError"].includes(controller.error) ? translateText(controller.error) : translateText("error");
    const reduced = $("[data-reduced]");
    reduced.hidden = !controller.reducedMotion.matches;
    const snap = controller.engine.snapshot();
    const warning = !controller.settings.pageEnabled && !controller.settings.petEnabled ? translateText("noEffectsHint") : controller.settings.pageEnabled && controller.state === "running" && snap.total === 0 ? translateText("noTargets") : controller.settings.pageEnabled && snap.warnings.length ? translateText(zhCN[snap.warnings[0]] ? snap.warnings[0] : "limits") : "";
    $("[data-warning]").textContent = warning;
    $("[data-warning]").hidden = !warning;
  }
  render();
  const unsubscribe = controller.subscribe(refresh);
  const interval = doc.defaultView.setInterval(refresh, 500);
  const localeChange = () => render();
  root.addEventListener("dsh-wine-locale-change", localeChange);
  return () => {
    doc.defaultView.clearInterval(interval);
    unsubscribe();
    controller.dispose();
    root.removeEventListener("dsh-wine-locale-change", localeChange);
    root.replaceChildren();
    delete root.dataset.dyouUi;
    delete root.dataset.wineOwned;
  };
}

// src/client/entry.ts
var NAMESPACE = "dyou.wine";
var inject = ["slots", "locale"];
function WineOverlay({ t }) {
  const root = React.useRef(null);
  const translate = React.useRef(t);
  translate.current = t;
  React.useEffect(() => {
    if (!root.current) return;
    return mountPanel(root.current, (key) => translate.current(key));
  }, []);
  React.useEffect(() => {
    root.current?.dispatchEvent(new Event("dsh-wine-locale-change"));
  }, [t]);
  return React.createElement("div", {
    ref: root,
    "data-dyou-wine": "overlay",
    // shell.overlay's containing layer is click-through. Only plugin controls
    // opt into pointer events themselves, leaving the host UI usable.
    style: { pointerEvents: "none" }
  });
}
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NAMESPACE, { zh: zhCN, en: enUS }));
  ctx.slots.inject("shell.overlay", () => ctx.slots.register({
    name: "shell.overlay",
    id: "dsh-dyou-wine",
    order: 90,
    locale: NAMESPACE
  }, WineOverlay));
}

    return module.exports;
  },
});
