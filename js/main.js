import { nav } from './nav.js';
import { store } from './store.js';
import { loadPhotos } from './photos.js';
import { applyTheme, registerServiceWorker, keepDataSafe } from './env.js';
import { unlockAudio } from './sound.js';
import { homeView } from './views/home.js';
import { raceView } from './views/race.js';
import { stickersView } from './views/stickers.js';
import { parentView } from './views/parent.js';

applyTheme(store.state.settings.theme);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(store.state.settings.theme));

// Geluid mag pas na een aanraking; daarna blijft het aan.
document.addEventListener('pointerdown', unlockAudio, { capture: true });
// Lang drukken op plaatjes opent geen menu op de kinderschermen.
document.addEventListener('contextmenu', (e) => {
  if (!e.target.closest('input, textarea, select, .parent')) e.preventDefault();
});

await loadPhotos();
nav.init(document.getElementById('app'), {
  home: homeView,
  race: raceView,
  stickers: stickersView,
  ouder: parentView,
});

registerServiceWorker();
keepDataSafe();
