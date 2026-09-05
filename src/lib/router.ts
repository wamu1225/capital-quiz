export const BASE = '/capital-quiz';

export function getCurrentPath(): string {
  const p = window.location.pathname;
  if (p.startsWith(BASE)) {
    const rest = p.slice(BASE.length);
    return rest === '' ? '/' : rest;
  }
  return '/';
}

export function navigate(path: string) {
  const full = BASE + path;
  if (window.location.pathname !== full) {
    window.history.pushState({}, '', full);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  window.scrollTo(0, 0);
}

export function href(path: string): string {
  return BASE + path;
}
