import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalAudio } from '../src/audio/local-audio';
import { WineController } from '../src/controller';

// The controller cases exercise its async audio boundary without starting a
// DOM motion engine. Media and AudioContext remain independently observable.
vi.mock('../src/motion/engine', () => ({
  WineEngine: class {
    start = vi.fn();
    update = vi.fn();
    pause = vi.fn();
    stop = vi.fn();
  },
}));
vi.mock('../src/pet/engine', () => ({
  PetEngine: class {
    start = vi.fn();
    update = vi.fn();
    pause = vi.fn();
    stop = vi.fn();
  },
}));

class MockAudio extends EventTarget {
  preload = '';
  src = '';
  currentTime = 0;
  duration = 10;
  playbackRate = 1;
  paused = true;
  seeking = false;
  loop = false;
  volume = 1;
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();

  constructor(readonly ownerDocument: Document) { super(); }

  override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    if (callback) {
      const listeners = this.listeners.get(type) ?? new Set();
      listeners.add(callback);
      this.listeners.set(type, listeners);
    }
    super.addEventListener(type, callback, options);
  }

  override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    if (callback) this.listeners.get(type)?.delete(callback);
    super.removeEventListener(type, callback, options);
  }

  listenerCount(type?: string): number {
    return type ? this.listeners.get(type)?.size ?? 0 : [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.size, 0);
  }

  play = vi.fn(async () => {
    this.paused = false;
    this.dispatchEvent(new Event('playing'));
  });
  pause = vi.fn(() => { this.paused = true; });
  load = vi.fn();
  removeAttribute = vi.fn((name: string) => { if (name === 'src') this.src = ''; });
}

function harness(initialContextState: AudioContextState = 'running', resumeGate?: () => Promise<void>) {
  const elements: MockAudio[] = [];
  const contexts: MockContext[] = [];
  // Browsers reject connecting the same HTMLMediaElement to a second source,
  // even after the previous context has closed. Model that constraint here.
  const usedElements = new WeakSet<HTMLMediaElement>();
  class MockContext {
    state: AudioContextState = initialContextState;
    currentTime = 0;
    destination = {};
    source = {
      connected: false,
      connect: vi.fn(() => { this.source.connected = true; }),
      disconnect: vi.fn(() => { this.source.connected = false; }),
    };
    constructor() { contexts.push(this); }
    createMediaElementSource = vi.fn((element: HTMLMediaElement) => {
      if (usedElements.has(element)) throw new DOMException('Media element already has a source', 'InvalidStateError');
      usedElements.add(element);
      return this.source;
    });
    resume = vi.fn(async () => {
      if (resumeGate) await resumeGate();
      if (this.state !== 'closed') this.state = 'running';
    });
    close = vi.fn(async () => { this.state = 'closed'; });
  }
  const reducedMotion = Object.assign(new EventTarget(), { matches: false });
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    defaultView: {
      AudioContext: MockContext,
      localStorage: { getItem: vi.fn(() => null), setItem: vi.fn() },
      matchMedia: vi.fn(() => reducedMotion),
    },
    createElement: vi.fn((_tag: string) => {
      const element = new MockAudio(doc as unknown as Document);
      elements.push(element);
      return element;
    }),
  });
  let nextUrl = 0;
  const createUrl = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:wine-test-${++nextUrl}`);
  const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const file = (name = 'local-test.wav') => new File(['self-generated test audio'], name, { type: 'audio/wav' });
  return { doc, document: doc as unknown as Document, elements, contexts, createUrl, revokeUrl, file };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('local audio resource lifetime', () => {
  it('Sober up releases the URL, disconnects the source and closes the active context', async () => {
    const h = harness();
    const audio = new LocalAudio(h.document, vi.fn());
    audio.select(h.file());
    await audio.play();
    expect(h.contexts[0].source.connected).toBe(true);
    expect(h.elements[0].paused).toBe(false);

    audio.release();

    expect(audio.loaded).toBe(false);
    expect(audio.fileName).toBe('');
    expect(h.elements[0].paused).toBe(true);
    expect(h.elements[0].src).toBe('');
    expect(h.revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:wine-test-1');
    expect(h.contexts[0].source.disconnect).toHaveBeenCalledTimes(1);
    expect(h.contexts[0].source.connected).toBe(false);
    expect(h.contexts[0].close).toHaveBeenCalledTimes(1);
    expect(h.contexts[0].state).toBe('closed');
    audio.dispose();
  });

  it('a later file gets a fresh media source and no handlers remain on the retired element', async () => {
    const h = harness();
    const onEnded = vi.fn();
    const audio = new LocalAudio(h.document, onEnded);
    audio.select(h.file('first.wav'));
    await audio.play();
    audio.release();

    audio.select(h.file('second.wav'));
    expect(h.elements).toHaveLength(2);
    expect(audio.element).toBe(h.elements[1]);
    expect(h.elements[0].listenerCount()).toBe(0);
    expect(h.elements[1].listenerCount()).toBe(5);
    h.elements[0].dispatchEvent(new Event('ended'));
    expect(onEnded).not.toHaveBeenCalled();
    h.elements[1].dispatchEvent(new Event('ended'));
    expect(onEnded).toHaveBeenCalledTimes(1);

    await audio.play();
    audio.pause();
    await audio.play();
    expect(h.contexts).toHaveLength(2);
    expect(h.contexts[1].createMediaElementSource).toHaveBeenCalledExactlyOnceWith(h.elements[1]);
    expect(h.contexts[1].source.connect).toHaveBeenCalledTimes(1);
    expect(h.elements[1].listenerCount('ended')).toBe(1);
    audio.dispose();
  });

  it('dispose is idempotent and leaves no callbacks or connected audio resources', async () => {
    const h = harness();
    const onEnded = vi.fn();
    const audio = new LocalAudio(h.document, onEnded);
    audio.select(h.file());
    await audio.play();

    audio.dispose();
    audio.dispose();

    expect(h.revokeUrl).toHaveBeenCalledTimes(1);
    expect(h.contexts[0].close).toHaveBeenCalledTimes(1);
    expect(h.contexts[0].source.disconnect).toHaveBeenCalledTimes(1);
    expect(h.elements[0].listenerCount()).toBe(0);
    h.elements[0].dispatchEvent(new Event('ended'));
    expect(onEnded).not.toHaveBeenCalled();
  });
});

describe('controller pending playback', () => {
  it('an old context resume cannot play a newly selected file after Sober up', async () => {
    let finishResume!: () => void;
    const resuming = new Promise<void>(resolve => { finishResume = resolve; });
    const h = harness('suspended', () => resuming);
    const controller = new WineController(h.document);
    controller.update({ petEnabled: true });
    controller.selectAudio(h.file('first.wav'));
    const starting = controller.start();
    expect(h.contexts[0].resume).toHaveBeenCalledTimes(1);
    expect(h.elements[0].play).not.toHaveBeenCalled();

    controller.stop();
    controller.selectAudio(h.file('second.wav'));
    expect(h.elements).toHaveLength(2);
    expect(controller.audio.element).toBe(h.elements[1]);
    finishResume();
    await starting;

    expect(h.elements[0].play).not.toHaveBeenCalled();
    expect(h.elements[1].play).not.toHaveBeenCalled();
    expect(h.elements[1].paused).toBe(true);
    expect(controller.audio.loaded).toBe(true);
    expect(controller.audio.fileName).toBe('second.wav');
    expect(controller.state).toBe('stopped');
    expect(h.contexts[0].state).toBe('closed');
    expect(controller.engine.start).not.toHaveBeenCalled();
    expect(controller.pet.start).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('a completed old play request cannot restart after Sober up', async () => {
    const h = harness();
    const controller = new WineController(h.document);
    controller.update({ petEnabled: true });
    controller.selectAudio(h.file());
    let finishPlay!: () => void;
    h.elements[0].play.mockImplementationOnce(() => new Promise<void>(resolve => {
      finishPlay = () => { h.elements[0].paused = false; resolve(); };
    }));
    const starting = controller.start();
    controller.stop();
    finishPlay();
    await starting;

    expect(controller.state).toBe('stopped');
    expect(controller.audio.loaded).toBe(false);
    expect(h.elements[0].paused).toBe(true);
    expect(h.contexts[0].state).toBe('closed');
    expect(controller.engine.start).not.toHaveBeenCalled();
    expect(controller.pet.start).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('hiding during pending playback keeps audio paused and restarts visuals on return', async () => {
    const h = harness();
    const controller = new WineController(h.document);
    controller.update({ petEnabled: true });
    controller.selectAudio(h.file());
    let finishPlay!: () => void;
    h.elements[0].play.mockImplementationOnce(() => new Promise<void>(resolve => {
      finishPlay = () => { h.elements[0].paused = false; resolve(); };
    }));
    const starting = controller.start();
    h.doc.hidden = true;
    h.doc.dispatchEvent(new Event('visibilitychange'));
    finishPlay();
    await starting;

    expect(controller.state).toBe('running');
    expect(h.elements[0].paused).toBe(true);
    expect(controller.engine.start).not.toHaveBeenCalled();
    expect(controller.pet.start).not.toHaveBeenCalled();

    h.doc.hidden = false;
    h.doc.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(controller.engine.start).toHaveBeenCalledTimes(1));
    expect(controller.pet.start).toHaveBeenCalledTimes(1);
    expect(h.elements[0].paused).toBe(false);
    controller.dispose();
  });
});
