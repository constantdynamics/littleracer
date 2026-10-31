// Alles wat met het apparaat te maken heeft: thema, installeren als app, ingesloten weergave.

export const embedded = (() => {
  try {
    return window.top !== window.self;
  } catch {
    return true;
  }
})();

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.setAttribute('data-theme', mode);
  else root.removeAttribute('data-theme');
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#d8efff');
}

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
});

export const canInstall = () => !!deferredInstall;

export async function install() {
  if (!deferredInstall) return false;
  deferredInstall.prompt();
  const choice = await deferredInstall.userChoice.catch(() => null);
  deferredInstall = null;
  return choice?.outcome === 'accepted';
}

export const isInstalled = () => matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;

export function registerServiceWorker() {
  if (embedded || !('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

export function keepDataSafe() {
  try {
    navigator.storage?.persist?.();
  } catch {
    // niet ondersteund
  }
}
