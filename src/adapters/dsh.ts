import type { Category } from '../settings';

// Stable HTML/ARIA and rc.2 data attributes. Never use CSS-module hashes.
export const OWNED = '[data-wine-owned],[data-dyou-wine],[data-wine-exclude]';
export const APPROVAL = '[data-approval-key],[data-approval-scroll],[data-wine-approval]';
export const INPUT = '[data-composer-card],[data-composer-input],textarea,input:not([type="hidden"]),[contenteditable="true"],[role="textbox"]';
export const SIDEBAR = '[data-slot="sidebar"],[data-slot^="sidebar."],aside,nav,[role="navigation"],[data-wine-sidebar]';
export const MESSAGES = '[data-chat-flow-kind],[data-chat-flow-key]:not([data-chat-group-key]),[data-wine-message]';
export const DIALOGS = '[role="dialog"],[role="menu"],[role="listbox"],dialog,[data-trigger-menu]';
// rc.2 Markdown's <pre> scrolls; animate its semantic card root instead of that scroller.
export const TOOLS = '[data-tool],[data-chat-call-id],pre,table,canvas,:has(> [data-code-block-content])';
const BLOCK = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,dt,dd,figcaption,legend,summary,label,output';
const TEXT_CONTAINERS = 'div,span,strong,em,small,b,i,time,abbr,mark,header,footer';
const PHRASING = 'span,strong,em,small,b,i,time,abbr,mark,code,kbd,samp,s,sub,sup,br,wbr,img,svg';
export const CANDIDATES = [MESSAGES, INPUT, DIALOGS, TOOLS, BLOCK,
  TEXT_CONTAINERS,
  'button,[role="button"],a[href],img,svg,[role="listitem"]',
].join(',');
export const SCROLL_ROOT = '[data-conversation-scroll],[data-chat-flow],[data-input-scroll],[data-code-block-content],[data-shell-overlay],[data-slot="shell.overlay"],html,body';

export function composedParent(element: Element): Element | null {
  return element.parentElement ?? ((element.getRootNode() as ShadowRoot).host || null);
}

export function composedClosest(element: Element, selector: string): Element | null {
  let current: Element | null = element;
  while (current) {
    const match = current.closest(selector);
    if (match) return match;
    current = (current.getRootNode() as ShadowRoot).host || null;
  }
  return null;
}

/** Text in DSH's labels, empty states and headers often uses div/span rather
 * than paragraphs. Only take a content unit, never a generic layout shell. */
function isTextUnit(element: Element): boolean {
  if (element.matches(BLOCK)) return true;
  if (!element.matches(TEXT_CONTAINERS)) return false;
  if ([...element.childNodes].some(node => node.nodeType === 3 && Boolean(node.textContent?.trim()))) return true;
  const children = [...element.children];
  return children.length > 0 && children.every(child => child.matches(PHRASING))
    && children.some(child => Boolean(child.textContent?.trim()));
}

export function classifyTarget(element: Element): Category | null {
  if (composedClosest(element, OWNED) || composedClosest(element, '[hidden],[inert],[aria-hidden="true"]')) return null;
  if (element.matches(INPUT)) return 'input';
  if (element.matches(TOOLS)) return 'tools';
  if (element.matches(MESSAGES)) return 'messages';
  if (composedClosest(element, SIDEBAR) && (isTextUnit(element)
    || element.matches('button,a,[role="listitem"],[role="button"],img,svg'))) return 'sidebar';
  if (element.matches(DIALOGS)) return 'dialogs';
  if (isTextUnit(element)) {
    // Code/list internals follow their semantic visual container.
    if (composedClosest(element, 'pre,table') || element.parentElement?.closest('li,blockquote')) return null;
    if (composedClosest(element, DIALOGS)) return 'dialogs';
    return 'text';
  }
  if (composedClosest(element, DIALOGS) && element.matches('button,p,h1,h2,h3,[role="button"]')) return 'dialogs';
  // Keep icons as fallback candidates when their control is not transformable.
  // The engine chooses one root per branch, so a normal button still moves once.
  if (element.matches('button,[role="button"],a[href],img,svg')) return 'controls';
  return null;
}

export function styleCanAnimate(element: Element, style: CSSStyleDeclaration): boolean {
  if (element.matches(SCROLL_ROOT) || ['fixed', 'sticky'].includes(style.position)) return false;
  if (/(auto|scroll)/.test(`${style.overflowX} ${style.overflowY}`)) return false;
  if (['none', 'contents', 'table-column', 'table-column-group'].includes(style.display)) return false;
  // Inline text boxes cannot be transformed without rewriting host layout;
  // replaced media and the outer SVG viewport are transformable while inline.
  if (style.display === 'inline' && !element.matches('img,svg,canvas,video,object,embed,iframe')) return false;
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
  // Host transform is intentionally allowed; independent properties require exclusive ownership.
  return ['scale', 'rotate', 'translate'].every(property => {
    const value = style.getPropertyValue(property);
    return !value || value === 'none';
  });
}
