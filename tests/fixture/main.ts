import { mountPanel } from '../../src/ui/panel';
import { WineController } from '../../src/controller';
import type { WineSettings } from '../../src/settings';

const panel = document.querySelector<HTMLElement>('#wine-panel')!;
const controller = new WineController(document);
// Test-only API exercises retained engine/audio compatibility without exposing
// removed advanced controls or enabling a remote player in ordinary fixtures.
controller.update({ musicEnabled: false });
const unmount = mountPanel(panel, undefined, controller);
const chat = document.querySelector<HTMLElement>('[data-chat-flow]')!;
let appended = 0;

const fixture = {
  updateSettings(patch: Partial<WineSettings>) { controller.update(patch); },
  settings() { return structuredClone(controller.settings); },
  snapshot() { return controller.engine.snapshot(); },
  selectAudio(bytes: number[], name = 'self-generated-test-beat.wav', type = 'audio/wav') {
    controller.selectAudio(new File([new Uint8Array(bytes)], name, { type }));
  },
  seek(seconds: number) { controller.seek(seconds); },
  appendStream(text: string) {
    document.querySelector('#stream-text')!.append(document.createTextNode(text));
  },
  appendMessage(text = '新消息：流式追加保持宿主 DOM 结构。') {
    const article = document.createElement('article');
    article.dataset.chatFlowKey = `appended-${++appended}`;
    article.dataset.chatFlowKind = 'assistant';
    const p = document.createElement('p');
    p.textContent = text;
    article.append(p);
    chat.append(article);
    article.scrollIntoView({ block: 'center' });
    return article.dataset.chatFlowKey;
  },
  longHistory() {
    const fragment = document.createDocumentFragment();
    const text = '长对话性能测试内容，English code 123。'.repeat(15);
    for (let index = 0; index < 300; index++) {
      const article = document.createElement('article');
      article.dataset.chatFlowKey = `long-${index}`;
      article.dataset.chatFlowKind = index % 2 ? 'assistant' : 'user';
      const p = document.createElement('p');
      p.textContent = `${index + 1}. ${text}`;
      article.append(p);
      fragment.append(article);
    }
    chat.append(fragment);
    document.querySelector('#history')!.scrollTop = 0;
    return { messages: chat.querySelectorAll('article').length, characters: chat.textContent!.length };
  },
  showApproval() { document.querySelector<HTMLElement>('#approval')!.hidden = false; },
  hideApproval() { document.querySelector<HTMLElement>('#approval')!.hidden = true; },
  setHidden(hidden: boolean) {
    // This hook verifies visibility event handling. It does not claim OS tab-switch coverage.
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => hidden ? 'hidden' : 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  },
  unmount() { if (typeof unmount === 'function') unmount(); },
};

declare global {
  interface Window { __wineFixture: typeof fixture; }
}

Object.assign(window, { __wineFixture: fixture });
document.querySelector('form')!.addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector<HTMLTextAreaElement>('#composer')!;
  fixture.appendMessage(input.value);
  input.value = '';
});
document.querySelector('#host-action')!.addEventListener('click', () => {
  void navigator.clipboard?.writeText(document.querySelector('#assistant-text')!.textContent!);
});
