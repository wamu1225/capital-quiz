export const BASE = '/capital-quiz';

export function getCurrentPath(): string {
  const p = window.location.pathname;
  if (p.startsWith(BASE)) {
    const rest = p.slice(BASE.length);
    return rest === '' ? '/' : rest;
  }
  return '/';
}

/** 同じ path への再ナビゲーション（例：復習の結果画面から再度「復習する」）でも
 * 呼び出し元が remount できるよう、history.state に単調増加の nonce を積む。
 * pathname が変わらないと pushState は履歴を積まないため replaceState を使う。 */
export function navigate(path: string) {
  const full = BASE + path;
  const samePath = window.location.pathname === full;
  const prevNonce = (window.history.state && window.history.state.nonce) || 0;
  const nonce = samePath ? prevNonce + 1 : 0;
  if (samePath) {
    window.history.replaceState({ nonce }, '', full);
  } else {
    window.history.pushState({ nonce }, '', full);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function getRouteNonce(): number {
  return (window.history.state && window.history.state.nonce) || 0;
}

export function href(path: string): string {
  return BASE + path;
}
