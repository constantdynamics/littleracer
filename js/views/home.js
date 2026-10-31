// Startscherm: de taakjes die de ouder heeft klaargezet, als grote plaatjes.
import { h, holdable, modal, taskPicture } from '../ui.js';
import { store } from '../store.js';
import { enabledTasks, makeSum } from '../logic.js';
import { nav } from '../nav.js';
import { sfx } from '../sound.js';

export function homeView(root) {
  const state = store.state;
  const tasks = enabledTasks(state);
  const name = state.childName.trim();

  const gear = holdable(
    h('button', { class: 'icon-btn hold-ring', 'aria-label': 'Instellingen voor ouders: 3 seconden vasthouden' }, h('span', { 'aria-hidden': 'true' }, '⚙️')),
    3000,
    () => openGate(),
  );

  const stickerBtn = h('button', { class: 'sticker-btn', 'aria-label': `Stickerboek, ${state.stickers.length} stickers`, onclick: () => nav.go('stickers') },
    h('span', { class: 'sticker-btn-icon', 'aria-hidden': 'true' }, '📒'),
    h('span', { class: 'sticker-btn-count' }, String(state.stickers.length)));

  const grid = tasks.length
    ? h('div', { class: 'task-grid' }, tasks.map((task) =>
        h('button', { class: 'task-card', style: `--cat: var(--cat-${task.cat})`, onclick: () => { sfx.tap(); nav.go('race', { id: task.id }); } },
          taskPicture(task),
          h('span', { class: 'task-name' }, task.name),
          task.mode === 'hold' ? h('span', { class: 'mode-badge', title: 'Volhoud-taak' }, 'volhouden') : null)))
    : h('div', { class: 'empty' },
        h('p', { class: 'empty-big' }, 'Nog geen taakjes klaargezet'),
        h('p', {}, 'Houd het tandwiel rechtsboven 3 tellen vast en kies taakjes uit de bibliotheek.'));

  root.append(h('main', { class: 'home' },
    h('header', { class: 'home-top' },
      h('div', { class: 'hello' },
        h('p', { class: 'brand' }, 'Little Racer'),
        h('h1', {}, name ? `Hoi ${name}!` : 'Hoi!')),
      stickerBtn,
      gear),
    grid,
    h('p', { class: 'parent-hint' }, 'Ouders: houd ⚙️ 3 tellen vast voor de instellingen.')));
}

/** Rekensommetje zodat alleen een volwassene in de instellingen komt. */
function openGate() {
  let sum = makeSum();
  let typed = '';
  const question = h('p', { class: 'gate-q' }, `Hoeveel is ${sum.question}?`);
  const out = h('output', { class: 'gate-out', 'aria-live': 'polite' }, '');
  const press = (k) => {
    if (k === '⌫') typed = typed.slice(0, -1);
    else if (k === 'OK') {
      if (Number(typed) === sum.answer) {
        close();
        nav.go('ouder');
        return;
      }
      sfx.wrong();
      out.classList.remove('shake');
      void out.offsetWidth;
      out.classList.add('shake');
      typed = '';
      sum = makeSum();
      question.textContent = `Hoeveel is ${sum.question}?`;
    } else if (typed.length < 3) typed += k;
    out.textContent = typed;
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'].map((k) =>
    h('button', { class: `key${k === 'OK' ? ' key-ok' : ''}`, 'aria-label': k === '⌫' ? 'Wissen' : k, onclick: () => press(k) }, k));
  const close = modal(
    h('div', { class: 'gate' },
      h('h2', {}, 'Alleen voor ouders'),
      question,
      out,
      h('div', { class: 'keypad' }, keys),
      h('button', { class: 'link-btn', onclick: () => close() }, 'Annuleren')),
    { label: 'Ouder-check' },
  );
}
