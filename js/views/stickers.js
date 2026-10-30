// Stickerboek: elke keer dat je sneller bent dan de slang, komt er een sticker bij.
import { h } from '../ui.js';
import { store } from '../store.js';
import { findTask } from '../logic.js';
import { nav } from '../nav.js';
import { speak } from '../speech.js';
import { sfx } from '../sound.js';

function hueOf(id) {
  let x = 0;
  for (const ch of String(id)) x = (x * 31 + ch.charCodeAt(0)) % 360;
  return x;
}

export function stickerEl(sticker, { big = false, tag = 'div' } = {}) {
  return h(tag, {
    class: `sticker${big ? ' big' : ''}${sticker.gold ? ' gold' : ''}`,
    style: `--hue: ${hueOf(sticker.id)}`,
    'aria-label': sticker.gold ? 'Gouden record-sticker' : 'Sticker',
  },
  h('span', { class: 'sticker-emoji', 'aria-hidden': 'true' }, sticker.emoji),
  sticker.gold ? h('span', { class: 'sticker-crown', 'aria-hidden': 'true' }, '👑') : null);
}

export function stickersView(root) {
  const list = [...store.state.stickers].reverse();
  const gold = list.filter((st) => st.gold).length;

  const grid = list.length
    ? h('div', { class: 'sticker-grid' }, list.map((st, i) => {
        const el = stickerEl(st, { tag: 'button' });
        el.style.setProperty('--tilt', `${((i * 37) % 17) - 8}deg`);
        el.addEventListener('click', () => {
          sfx.sticker();
          el.classList.remove('wiggle');
          void el.offsetWidth;
          el.classList.add('wiggle');
          const task = findTask(store.state, st.taskId);
          speak(task ? `Deze kreeg je voor: ${task.name}!` : 'Super!');
        });
        return el;
      }))
    : h('div', { class: 'empty' },
        h('p', { class: 'empty-big' }, 'Nog geen stickers'),
        h('p', {}, 'Ben jij sneller dan de slang? Dan krijg je een sticker!'));

  root.append(h('main', { class: 'stickers' },
    h('header', { class: 'page-top' },
      h('button', { class: 'icon-btn', 'aria-label': 'Terug naar het begin', onclick: () => nav.home() }, h('span', { 'aria-hidden': 'true' }, '🏠')),
      h('h1', {}, 'Mijn stickers'),
      h('span', { class: 'count-pill' }, `${list.length} ⭐`, gold ? ` · ${gold} 👑` : '')),
    grid));
}
