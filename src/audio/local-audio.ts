/** Files stay in the browser. No fetch, uploads, persistence, or remote URLs. */
export class LocalAudio {
  element: HTMLAudioElement;
  private url?: string;
  private context?: AudioContext;
  private source?: MediaElementAudioSourceNode;
  private anchorContext = 0;
  private anchorMedia = 0;
  private needsFreshElement = false;
  private generation = 0;
  fileName = '';
  constructor(doc: Document, private readonly onEnded: () => void) {
    this.element = this.createElement(doc);
  }
  private createElement(doc: Document): HTMLAudioElement {
    const element = doc.createElement('audio');
    element.preload = 'metadata';
    element.addEventListener('ended', this.onEnded);
    element.addEventListener('playing', this.reanchor);
    element.addEventListener('seeked', this.reanchor);
    element.addEventListener('ratechange', this.reanchor);
    element.addEventListener('timeupdate', this.correctDrift);
    return element;
  }
  private removeListeners(): void {
    this.element.removeEventListener('ended', this.onEnded);
    this.element.removeEventListener('playing', this.reanchor);
    this.element.removeEventListener('seeked', this.reanchor);
    this.element.removeEventListener('ratechange', this.reanchor);
    this.element.removeEventListener('timeupdate', this.correctDrift);
  }
  get loaded(): boolean { return !!this.url; }
  get duration(): number { return Number.isFinite(this.element.duration) ? this.element.duration : 0; }
  get time(): number {
    if (!this.context || this.context.state !== 'running' || this.element.paused || this.element.seeking) return this.element.currentTime;
    const estimate = this.anchorMedia + (this.context.currentTime - this.anchorContext) * this.element.playbackRate;
    return this.element.loop && this.duration ? estimate % this.duration : Math.min(this.duration || Infinity, estimate);
  }
  private reanchor = () => {
    this.anchorContext = this.context?.currentTime ?? 0;
    this.anchorMedia = this.element.currentTime;
  };
  private correctDrift = () => { if (Math.abs(this.time - this.element.currentTime) > 0.07) this.reanchor(); };
  select(file: File): void {
    if (file.size > 200 * 1024 * 1024) throw new Error('audioTooLarge');
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
  async play(): Promise<void> {
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
    if (this.context?.state === 'suspended') await this.context.resume();
    if (generation !== this.generation || element !== this.element || !this.loaded) return;
    await element.play();
    if (generation !== this.generation || element !== this.element) { element.pause(); return; }
    this.reanchor();
  }
  pause(): void { this.element.pause(); this.reanchor(); }
  seek(seconds: number): void { this.element.currentTime = Math.max(0, Math.min(this.duration, seconds)); this.reanchor(); }
  configure(volume: number, loop: boolean): void { this.element.volume = volume; this.element.loop = loop; }
  release(): void {
    ++this.generation;
    this.pause();
    this.element.removeAttribute('src');
    this.element.load();
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = undefined;
    this.fileName = '';
    if (this.context) {
      this.needsFreshElement = true;
      this.source?.disconnect();
      this.source = undefined;
      void this.context.close().catch(() => {});
      this.context = undefined;
    }
  }
  dispose(): void {
    this.release();
    this.removeListeners();
  }
}
