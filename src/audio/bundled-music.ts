import recording from '../assets/BV1hXbN6VEKV.mp3';

export const musicSource = 'https://www.bilibili.com/video/BV1hXbN6VEKV/';

/** The recording is bundled separately from the code's MIT license. */
export class BundledMusic {
  private media?: HTMLAudioElement;
  private generation = 0;
  private desiredPlaying = false;
  private disposed = false;
  private pending?: Promise<void>;
  private resetPosition = false;

  constructor(private readonly doc: Document, private readonly onError: (error: Error) => void) {}

  get element(): HTMLAudioElement | undefined { return this.media; }

  private load(): HTMLAudioElement {
    if (this.media) return this.media;
    const media = this.doc.createElement('audio');
    media.preload = 'metadata';
    media.loop = true;
    media.volume = 0.5;
    media.hidden = true;
    media.dataset.wineOwned = '';
    media.dataset.wineAudio = '';
    media.addEventListener('error', this.failed);
    media.src = recording;
    this.doc.body.append(media);
    this.media = media;
    return media;
  }

  private failed = () => {
    if (!this.desiredPlaying || this.disposed) return;
    this.pause();
    this.onError(new Error('musicLoadError'));
  };

  async play(): Promise<void> {
    if (this.disposed) return;
    if (this.desiredPlaying) return this.pending;
    const media = this.load();
    this.desiredPlaying = true;
    this.resetPosition = false;
    const generation = ++this.generation;
    const task = (async () => {
      try {
        await media.play();
        // A stale completion must not stop a newer successful resume.
        if (!this.desiredPlaying || this.disposed) {
          media.pause();
          if (this.resetPosition) this.rewind(media);
        }
      } catch {
        if (generation === this.generation && this.desiredPlaying && !this.disposed) {
          this.pause();
          this.onError(new Error('musicLoadError'));
        }
      }
    })();
    this.pending = task;
    await task;
    if (this.pending === task) this.pending = undefined;
  }

  pause(): void {
    ++this.generation;
    this.desiredPlaying = false;
    this.media?.pause();
    this.pending = undefined;
  }

  private rewind(media: HTMLAudioElement): void {
    try { media.currentTime = 0; } catch { /* metadata may not be available yet */ }
  }

  stop(): void {
    this.pause();
    this.resetPosition = true;
    if (this.media) this.rewind(this.media);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    if (this.media) {
      this.media.removeEventListener('error', this.failed);
      this.media.removeAttribute('src');
      this.media.load();
      this.media.remove();
    }
  }
}
