import { afterEach, describe, expect, it, vi } from 'vitest';
import { WineController } from '../src/controller';

const engineCallbacks = vi.hoisted(() => ({
  pageError: undefined as ((error: Error) => void) | undefined,
  petError: undefined as ((error: Error) => void) | undefined,
}));

vi.mock('../src/motion/engine', () => ({
  WineEngine: class {
    constructor(_doc: Document, _time: () => number, onError: (error: Error) => void) { engineCallbacks.pageError = onError; }
    start = vi.fn(); update = vi.fn(); pause = vi.fn(); stop = vi.fn();
  },
}));
vi.mock('../src/pet/engine', () => ({
  PetEngine: class {
    constructor(_doc: Document, _time: () => number, onError: (error: Error) => void) { engineCallbacks.petError = onError; }
    start = vi.fn(); update = vi.fn(); pause = vi.fn(); stop = vi.fn();
  },
}));
vi.mock('../src/audio/local-audio', () => ({
  LocalAudio: class {
    loaded = false; time = 0;
    configure = vi.fn(); play = vi.fn(async () => {}); pause = vi.fn();
    release = vi.fn(); dispose = vi.fn(); select = vi.fn(); seek = vi.fn();
  },
}));

function harness(saved: unknown = null) {
  const reducedMotion = Object.assign(new EventTarget(), { matches: false });
  const storage = { getItem: vi.fn(() => JSON.stringify(saved)), setItem: vi.fn() };
  const doc = Object.assign(new EventTarget(), {
    hidden: false,
    defaultView: { localStorage: storage, matchMedia: vi.fn(() => reducedMotion) },
  });
  const controller = new WineController(doc as unknown as Document);
  return { controller, doc, reducedMotion, storage };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('independent page and pet effects', () => {
  it('starts both enabled effects and updates their shared rhythm without restarting either', async () => {
    const { controller, storage } = harness({ pageEnabled: true, petEnabled: true });
    await controller.start();
    expect(controller.state).toBe('running');
    expect(controller.engine.start).toHaveBeenCalledExactlyOnceWith(controller.settings);
    expect(controller.pet.start).toHaveBeenCalledExactlyOnceWith(controller.settings);
    controller.update({ bpm: 150, intensity: 80, offsetMs: 25 });
    expect(controller.engine.update).toHaveBeenCalledExactlyOnceWith(controller.settings);
    expect(controller.pet.update).toHaveBeenCalledExactlyOnceWith(controller.settings);
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).toHaveBeenCalledTimes(1);
    expect(controller.engine.stop).not.toHaveBeenCalled();
    expect(controller.pet.stop).not.toHaveBeenCalled();
    const persisted = JSON.parse(storage.setItem.mock.calls.at(-1)![1]);
    expect(persisted).toMatchObject({ pageEnabled: true, petEnabled: true, bpm: 150 });
    expect(persisted).not.toHaveProperty('mode');
    controller.dispose();
  });

  it('toggles only the selected effect without restarting audio or the other effect', async () => {
    const { controller } = harness();
    await controller.start();
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).not.toHaveBeenCalled();
    controller.update({ petEnabled: true });
    expect(controller.pet.start).toHaveBeenCalledTimes(1);
    expect(controller.engine.update).toHaveBeenCalledTimes(1);
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    expect(controller.engine.stop).not.toHaveBeenCalled();
    controller.update({ petEnabled: false });
    expect(controller.pet.stop).toHaveBeenCalledTimes(1);
    controller.update({ petEnabled: true });
    expect(controller.pet.start).toHaveBeenCalledTimes(2);
    controller.update({ pageEnabled: false });
    expect(controller.engine.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).toHaveBeenCalledTimes(2);
    expect(controller.pet.stop).toHaveBeenCalledTimes(1);
    expect(controller.audio.play).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('accepts both effects disabled and can enable either later', async () => {
    const { controller } = harness({ pageEnabled: false, petEnabled: false });
    await controller.start();
    expect(controller.state).toBe('running');
    expect(controller.error).toBe('');
    expect(controller.engine.start).not.toHaveBeenCalled();
    expect(controller.pet.start).not.toHaveBeenCalled();
    controller.update({ pageEnabled: true, petEnabled: true });
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).toHaveBeenCalledTimes(1);
    controller.update({ pageEnabled: false, petEnabled: false });
    expect(controller.engine.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.stop).toHaveBeenCalledTimes(1);
    expect(controller.state).toBe('running');
    expect(controller.error).toBe('');
    controller.dispose();
  });

  it('does not start effects when settings change while stopped or paused', async () => {
    const { controller } = harness();
    controller.update({ petEnabled: true });
    expect(controller.engine.start).not.toHaveBeenCalled();
    expect(controller.pet.start).not.toHaveBeenCalled();
    await controller.start();
    controller.pause();
    controller.update({ pageEnabled: false, petSpeed: 300, bpm: 90 });
    expect(controller.state).toBe('paused');
    expect(controller.engine.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).toHaveBeenCalledTimes(1);
    expect(controller.pet.update).toHaveBeenCalledExactlyOnceWith(controller.settings);
    await controller.start();
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).toHaveBeenCalledTimes(2);
    controller.dispose();
  });

  it('keeps hidden updates dormant and resumes only enabled effects on return', async () => {
    const { controller, doc } = harness({ pageEnabled: true, petEnabled: true });
    await controller.start();
    doc.hidden = true;
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(controller.engine.pause).toHaveBeenCalledTimes(1);
    expect(controller.pet.pause).toHaveBeenCalledTimes(1);
    controller.update({ pageEnabled: false, petSpeed: 300 });
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).toHaveBeenCalledTimes(1);
    doc.hidden = false;
    doc.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(controller.pet.start).toHaveBeenCalledTimes(2));
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('pauses both for reduced motion, never resumes from a settings update, and stops both on Escape', async () => {
    const { controller, doc, reducedMotion } = harness({ pageEnabled: true, petEnabled: true });
    await controller.start();
    reducedMotion.matches = true;
    reducedMotion.dispatchEvent(new Event('change'));
    expect(controller.state).toBe('paused');
    expect(controller.engine.pause).toHaveBeenCalledTimes(1);
    expect(controller.pet.pause).toHaveBeenCalledTimes(1);
    controller.update({ intensity: 75 });
    expect(controller.engine.start).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).toHaveBeenCalledTimes(1);
    doc.dispatchEvent(Object.assign(new Event('keydown'), { key: 'Escape' }));
    expect(controller.state).toBe('stopped');
    expect(controller.engine.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.stop).toHaveBeenCalledTimes(1);
    controller.dispose();
  });

  it('cleans up both when the first start reports an error and never starts the second', async () => {
    const { controller } = harness({ pageEnabled: true, petEnabled: true });
    vi.mocked(controller.engine.start).mockImplementationOnce(() => engineCallbacks.pageError!(new Error('page failed')));
    await controller.start();
    expect(controller.state).toBe('paused');
    expect(controller.error).toBe('page failed');
    expect(controller.engine.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('does not start a newly enabled pet after the running page effect fails its update', async () => {
    const { controller } = harness();
    await controller.start();
    vi.mocked(controller.engine.update).mockImplementationOnce(() => engineCallbacks.pageError!(new Error('page update failed')));
    controller.update({ petEnabled: true });
    expect(controller.state).toBe('paused');
    expect(controller.error).toBe('page update failed');
    expect(controller.engine.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.stop).toHaveBeenCalledTimes(1);
    expect(controller.pet.start).not.toHaveBeenCalled();
    controller.dispose();
  });

  it('cleans up the first effect if the second start throws or reports an error', async () => {
    for (const callbackFailure of [false, true]) {
      const { controller } = harness({ pageEnabled: true, petEnabled: true });
      vi.mocked(controller.pet.start).mockImplementationOnce(() => {
        const error = new Error('pet failed');
        if (callbackFailure) engineCallbacks.petError!(error);
        else throw error;
      });
      await controller.start();
      expect(controller.state).toBe('paused');
      expect(controller.error).toBe('pet failed');
      expect(controller.engine.stop).toHaveBeenCalledTimes(1);
      expect(controller.pet.stop).toHaveBeenCalledTimes(1);
      controller.dispose();
    }
  });
});
