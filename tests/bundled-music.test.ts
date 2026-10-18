import { afterEach, describe, expect, it, vi } from 'vitest';
import { BundledMusic } from '../src/audio/bundled-music';

// The browser tests cover actual decoding and playback. These controlled native
// play promises exercise cancellations that are hard to reproduce reliably with
// a fully buffered recording.
class MockAudio extends EventTarget {
  preload = '';
  src = '';
  currentTime = 0;
  duration = 188;
  paused = true;
  loop = false;
  volume = 1;
  hidden = false;
  dataset: Record<string, string> = {};
  error: MediaError | null = null;
  private listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  constructor(readonly ownerDocument: Document) { super(); }
  override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    if (callback) {
      const group = this.listeners.get(type) ?? new Set();
      group.add(callback); this.listeners.set(type, group);
    }
    super.addEventListener(type, callback, options);
  }
  override removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    if (callback) this.listeners.get(type)?.delete(callback);
    super.removeEventListener(type, callback, options);
  }
  listenerCount(): number { return [...this.listeners.values()].reduce((total, group) => total + group.size, 0); }
  play = vi.fn(async () => { this.paused = false; });
  pause = vi.fn(() => { this.paused = true; });
  load = vi.fn();
  remove = vi.fn();
  setAttribute = vi.fn((name: string, value: string) => { if (name === 'src') this.src = value; });
  removeAttribute = vi.fn((name: string) => { if (name === 'src') this.src = ''; });
}

function harness() {
  const elements: MockAudio[] = [];
  const doc = {
    body: { append: vi.fn() },
    createElement: vi.fn((tag: string) => {
      if (tag !== 'audio') throw new Error(`Unexpected ${tag} element`);
      const audio = new MockAudio(doc as unknown as Document);
      elements.push(audio); return audio;
    }),
  };
  const onError = vi.fn();
  const music = new BundledMusic(doc as unknown as Document, onError);
  return { elements, music, onError };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('bundled recording playback lifetime', () => {
  it('loads only on demand, reuses its native element and preserves position when paused', async () => {
    const h = harness();
    expect(h.elements).toHaveLength(0);
    await h.music.play();
    expect(h.elements).toHaveLength(1);
    const element = h.elements[0];
    expect(element.src).not.toBe('');
    expect(element.loop).toBe(true);
    expect(element.volume).toBe(0.5);
    element.currentTime = 27.25;
    h.music.pause();
    expect(element.paused).toBe(true);
    expect(element.currentTime).toBe(27.25);
    await h.music.play();
    expect(h.elements).toHaveLength(1);
    expect(element.currentTime).toBe(27.25);
    expect(element.paused).toBe(false);
    h.music.stop();
    expect(element.currentTime).toBe(0);
    expect(element.paused).toBe(true);
    h.music.dispose();
  });

  it('a late play completion cannot resume after pause or reset a paused position', async () => {
    const h = harness();
    // Create once so that the subsequent native play can be controlled.
    await h.music.play();
    h.music.pause();
    const element = h.elements[0];
    element.currentTime = 13;
    let complete!: () => void;
    element.play.mockImplementationOnce(() => new Promise<void>(resolve => {
      complete = () => { element.paused = false; resolve(); };
    }));
    const pending = h.music.play();
    h.music.pause();
    complete();
    await pending;
    expect(element.paused).toBe(true);
    expect(element.currentTime).toBe(13);
    expect(h.onError).not.toHaveBeenCalled();
    h.music.dispose();
  });

  it('a late play completion cannot undo Sober up or restart a disposed recording', async () => {
    for (const dispose of [false, true]) {
      const h = harness();
      await h.music.play();
      h.music.pause();
      const element = h.elements[0];
      element.currentTime = 31;
      let complete!: () => void;
      element.play.mockImplementationOnce(() => new Promise<void>(resolve => {
        complete = () => { element.paused = false; resolve(); };
      }));
      const pending = h.music.play();
      if (dispose) h.music.dispose(); else h.music.stop();
      complete();
      await pending;
      expect(element.paused).toBe(true);
      expect(element.currentTime).toBe(0);
      if (dispose) {
        expect(element.src).toBe('');
        expect(element.listenerCount()).toBe(0);
        const calls = element.play.mock.calls.length;
        await h.music.play();
        expect(element.play).toHaveBeenCalledTimes(calls);
        expect(h.elements).toHaveLength(1);
      }
      expect(h.onError).not.toHaveBeenCalled();
      h.music.dispose();
    }
  });

  it('ignores a cancelled play rejection and leaves no error handlers after dispose', async () => {
    const h = harness();
    await h.music.play();
    h.music.pause();
    const element = h.elements[0];
    let reject!: (error: Error) => void;
    element.play.mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const pending = h.music.play();
    h.music.stop();
    reject(new DOMException('Cancelled by native pause', 'AbortError'));
    await pending;
    expect(h.onError).not.toHaveBeenCalled();
    h.music.dispose();
    h.music.dispose();
    expect(element.src).toBe('');
    expect(element.listenerCount()).toBe(0);
    element.dispatchEvent(new Event('error'));
    expect(h.onError).not.toHaveBeenCalled();
  });

  it('an obsolete play completion does not pause a newer successful resume', async () => {
    const h = harness();
    await h.music.play();
    h.music.pause();
    const element = h.elements[0];
    let complete!: () => void;
    element.play.mockImplementationOnce(() => new Promise<void>(resolve => {
      complete = () => { element.paused = false; resolve(); };
    }));
    const obsolete = h.music.play();
    h.music.pause();
    await h.music.play();
    expect(element.paused).toBe(false);
    complete();
    await obsolete;
    expect(element.paused).toBe(false);
    expect(h.onError).not.toHaveBeenCalled();
    h.music.dispose();
  });
});
