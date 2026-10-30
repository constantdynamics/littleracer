// Ouder-modus: taken kiezen en doeltijden instellen, eigen taken met foto,
// records bekijken en wissen, en geluid, stem en spraakbesturing instellen.
import { h, modal, taskPicture, toast } from '../ui.js';
import { store } from '../store.js';
import { CATEGORIES, CUSTOM_EMOJI } from '../tasks.js';
import { allTasks, baseSeconds, nextTarget, formatSeconds, formatMs, DIFFICULTY } from '../logic.js';
import { normalize, startStage, isStopCommand } from '../match.js';
import { speak, dutchVoices, Listener, recognitionSupported, speechAvailable } from '../speech.js';
import { photoFor, savePhoto, deletePhoto, shrinkImage } from '../photos.js';
import { applyTheme, canInstall, install, isInstalled, embedded } from '../env.js';
import { nav } from '../nav.js';

const TABS = [
  { id: 'taken', label: 'Taken', render: tasksTab },
  { id: 'records', label: 'Records', render: recordsTab },
  { id: 'geluid', label: 'Geluid & stem', render: soundTab },
  { id: 'algemeen', label: 'Algemeen', render: generalTab },
];

export function parentView(root, { tab = 'taken' } = {}) {
  let active = TABS.some((t) => t.id === tab) ? tab : 'taken';
  let cleanup = null;
  const body = h('div', { class: 'parent-body', role: 'tabpanel' });
  const tabBtns = TABS.map((t) =>
    h('button', { role: 'tab', class: 'tab', type: 'button', id: `tab-${t.id}`, 'aria-selected': String(t.id === active), onclick: () => select(t.id) }, t.label));

  root.append(h('main', { class: 'parent' },
    h('header', { class: 'parent-top' },
      h('div', {}, h('p', { class: 'brand' }, 'Little Racer'), h('h1', {}, 'Instellingen')),
      h('button', { class: 'btn primary', type: 'button', onclick: () => nav.home() }, 'Klaar')),
    h('nav', { class: 'tabs', role: 'tablist', 'aria-label': 'Onderdelen' }, tabBtns),
    body));

  function select(id) {
    active = id;
    tabBtns.forEach((b, i) => b.setAttribute('aria-selected', String(TABS[i].id === id)));
    render();
  }
  function render() {
    cleanup?.();
    body.replaceChildren();
    body.scrollTop = 0;
    body.setAttribute('aria-labelledby', `tab-${active}`);
    cleanup = TABS.find((t) => t.id === active).render(body) || null;
  }
  render();
  return { destroy: () => cleanup?.() };
}

// ---------- bouwstenen

function switchInput(id, checked, label, onChange) {
  return h('input', { type: 'checkbox', role: 'switch', class: 'switch', id, checked, 'aria-label': label, onchange: (e) => onChange(e.target.checked) });
}

function settingRow(title, desc, control, forId) {
  return h('div', { class: 'setting' },
    h('label', { class: 'setting-text', for: forId }, h('strong', {}, title), desc ? h('span', {}, desc) : null),
    control);
}

function field(label, control, id) {
  return h('div', { class: 'field' }, h('label', { class: 'field-label', for: id }, label), control);
}

function stepper(sec, def, onChange, label = 'Doeltijd') {
  let value = sec;
  const out = h('output', { class: `step-val${value !== def ? ' changed' : ''}` }, formatSeconds(value));
  const set = (next) => {
    value = next;
    out.textContent = formatSeconds(value);
    out.classList.toggle('changed', value !== def);
    onChange(value);
  };
  return h('div', { class: 'stepper', role: 'group', 'aria-label': label },
    h('button', { class: 'step', type: 'button', 'aria-label': 'Minder tijd', onclick: () => set(nextTarget(value, -1)) }, '−'),
    out,
    h('button', { class: 'step', type: 'button', 'aria-label': 'Meer tijd', onclick: () => set(nextTarget(value, 1)) }, '+'));
}

function segmented(name, options, value, onChange) {
  return h('div', { class: 'segmented', role: 'radiogroup' }, options.map(([val, label, sub]) => {
    const id = `${name}-${val}`;
    return h('label', { class: 'seg', for: id },
      h('input', { type: 'radio', name, id, value: val, checked: val === value, onchange: () => onChange(val) }),
      h('span', { class: 'seg-label' }, label, sub ? h('small', {}, sub) : null));
  }));
}

/** Knop die eerst vraagt of je het zeker weet (de app kan geen confirm() gebruiken). */
function confirmButton(label, yesLabel, onYes) {
  const wrap = h('div', { class: 'confirm' });
  const ask = () =>
    wrap.replaceChildren(
      h('span', { class: 'confirm-q' }, 'Zeker weten?'),
      h('button', { class: 'btn danger', type: 'button', onclick: onYes }, yesLabel),
      h('button', { class: 'btn', type: 'button', onclick: reset }, 'Nee'));
  const reset = () => wrap.replaceChildren(h('button', { class: 'btn danger-soft', type: 'button', onclick: ask }, label));
  reset();
  return wrap;
}

function setTarget(task, sec) {
  store.update((s) => {
    if (sec === task.sec) delete s.targets[task.id];
    else s.targets[task.id] = sec;
  });
}

// ---------- tab: taken

function tasksTab(body) {
  let filter = 'alle';
  let query = '';
  let rows = [];
  const count = h('p', { class: 'tab-lead' });
  const list = h('div', { class: 'task-list' });
  const empty = h('p', { class: 'muted', hidden: true }, 'Geen taken gevonden.');
  const chipDefs = [['alle', 'Alle'], ['aan', 'Op het startscherm'], ...CATEGORIES.map((c) => [c.id, c.name])];
  const chips = chipDefs.map(([id, label]) =>
    h('button', { class: 'chip', type: 'button', 'aria-pressed': String(id === filter), onclick: () => {
      filter = id;
      chips.forEach((c, i) => c.setAttribute('aria-pressed', String(chipDefs[i][0] === id)));
      apply();
    } }, label));
  const search = h('input', { type: 'search', id: 'task-search', placeholder: 'Zoek een taak', 'aria-label': 'Zoek een taak', autocomplete: 'off', oninput: (e) => {
    query = normalize(e.target.value);
    apply();
  } });

  const updateCount = () => {
    const n = store.state.enabled.length;
    count.textContent = `${n} ${n === 1 ? 'taakje staat' : 'taakjes staan'} op het startscherm`;
  };

  body.append(
    h('div', { class: 'tab-head' }, count, h('button', { class: 'btn primary', type: 'button', onclick: () => editCustom(null, rebuild) }, '+ Eigen taak')),
    h('p', { class: 'muted small' }, 'Zet een taakje aan om het op het startscherm te zetten. Met − en + kies je de doeltijd: zo lang is de slang.'),
    search,
    h('div', { class: 'chips' }, chips),
    list,
    empty);

  function rebuild() {
    list.replaceChildren();
    rows = [];
    for (const cat of CATEGORIES) {
      const tasks = allTasks(store.state).filter((t) => t.cat === cat.id);
      if (!tasks.length) continue;
      const section = h('section', { class: 'cat-section', style: `--cat: var(--cat-${cat.id})` },
        h('h3', { class: 'cat-title' }, h('span', { class: 'cat-dot', 'aria-hidden': 'true' }), cat.name, h('span', { class: 'cat-count' }, String(tasks.length))));
      for (const task of tasks) {
        const row = taskRow(task, updateCount, () => editCustom(task, rebuild));
        rows.push({ task, row, section });
        section.append(row);
      }
      list.append(section);
    }
    updateCount();
    apply();
  }

  function apply() {
    const on = new Set(store.state.enabled);
    const shown = new Set();
    for (const { task, row, section } of rows) {
      const inFilter = filter === 'alle' || (filter === 'aan' ? on.has(task.id) : task.cat === filter);
      const visible = inFilter && (!query || normalize(task.name).includes(query));
      row.hidden = !visible;
      if (visible) shown.add(section);
    }
    list.querySelectorAll('.cat-section').forEach((sec) => (sec.hidden = !shown.has(sec)));
    empty.hidden = shown.size > 0;
  }

  rebuild();
}

function taskRow(task, onToggle, onEdit) {
  const st = store.state;
  const toggle = switchInput(`on-${task.id}`, st.enabled.includes(task.id), `${task.name} op het startscherm`, (checked) => {
    store.update((s) => {
      const set = new Set(s.enabled);
      if (checked) set.add(task.id);
      else set.delete(task.id);
      s.enabled = [...set];
    });
    onToggle();
  });
  return h('div', { class: 'task-row' },
    taskPicture(task, 'row-pic'),
    h('div', { class: 'row-info' },
      h('span', { class: 'row-name' }, task.name),
      h('span', { class: 'row-meta' }, task.mode === 'hold' ? 'Volhouden' : 'Zo snel mogelijk', task.custom ? ' · eigen taak' : '')),
    stepper(baseSeconds(st, task), task.sec, (sec) => setTarget(task, sec), `Doeltijd voor ${task.name}`),
    toggle,
    task.custom ? h('button', { class: 'icon-btn small row-edit', type: 'button', 'aria-label': `${task.name} bewerken`, onclick: onEdit }, '✏️') : null);
}

function editCustom(task, onSaved) {
  const isNew = !task;
  const draft = task
    ? { ...task, sec: baseSeconds(store.state, task) }
    : { id: `eigen-${Date.now().toString(36)}`, cat: 'eigen', emoji: '⭐', name: '', say: '', sec: 60, mode: 'race', custom: true, photo: false };
  let photo = draft.photo ? photoFor(draft.id) : null;

  const error = h('p', { class: 'form-error', hidden: true, role: 'alert' });
  const preview = h('div', { class: 'pic-preview', 'aria-hidden': 'true' });
  const showPreview = () => preview.replaceChildren(photo ? h('img', { src: photo, alt: '' }) : h('span', {}, draft.emoji));
  showPreview();

  const usePhoto = async (file) => {
    if (!file) return;
    try {
      photo = await shrinkImage(file);
      error.hidden = true;
      showPreview();
      removePhoto.hidden = false;
      emojiGrid.querySelectorAll('.emoji-pick').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    } catch (e) {
      error.textContent = e.message;
      error.hidden = false;
    }
  };
  const camera = h('input', { type: 'file', accept: 'image/*', capture: 'environment', hidden: true, onchange: (e) => usePhoto(e.target.files[0]) });
  const gallery = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: (e) => usePhoto(e.target.files[0]) });
  const removePhoto = h('button', { class: 'btn', type: 'button', hidden: !photo, onclick: () => {
    photo = null;
    removePhoto.hidden = true;
    showPreview();
  } }, 'Foto weghalen');

  const emojiGrid = h('div', { class: 'emoji-grid', role: 'group', 'aria-label': 'Kies een plaatje' }, CUSTOM_EMOJI.map((em) =>
    h('button', { type: 'button', class: 'emoji-pick', 'aria-pressed': String(!photo && em === draft.emoji), onclick: (e) => {
      draft.emoji = em;
      photo = null;
      removePhoto.hidden = true;
      showPreview();
      emojiGrid.querySelectorAll('.emoji-pick').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
    } }, em)));

  const nameIn = h('input', { type: 'text', id: 'ct-name', maxlength: '40', value: draft.name, placeholder: 'Bijvoorbeeld: Tas naar de auto brengen', autocomplete: 'off' });
  const sayIn = h('input', { type: 'text', id: 'ct-say', maxlength: '80', value: draft.say, placeholder: 'Bijvoorbeeld: Breng je tas naar de auto!', autocomplete: 'off' });
  const catSelect = h('select', { id: 'ct-cat' }, CATEGORIES.map((c) => h('option', { value: c.id, selected: c.id === draft.cat }, c.name)));

  const save = async () => {
    const name = nameIn.value.trim();
    if (!name) {
      error.textContent = 'Geef de taak een naam.';
      error.hidden = false;
      nameIn.focus();
      return;
    }
    const saved = { ...draft, name, say: sayIn.value.trim() || `${name}!`, cat: catSelect.value, photo: !!photo, custom: true };
    store.update((s) => {
      const i = s.custom.findIndex((t) => t.id === saved.id);
      if (i >= 0) s.custom[i] = saved;
      else s.custom.unshift(saved);
      delete s.targets[saved.id];
      if (isNew && !s.enabled.includes(saved.id)) s.enabled.push(saved.id);
    });
    if (photo) await savePhoto(saved.id, photo);
    else await deletePhoto(saved.id);
    close();
    toast(isNew ? 'Taak gemaakt en op het startscherm gezet' : 'Taak bewaard');
    onSaved();
  };

  const remove = async () => {
    store.update((s) => {
      s.custom = s.custom.filter((t) => t.id !== draft.id);
      s.enabled = s.enabled.filter((x) => x !== draft.id);
      delete s.targets[draft.id];
      delete s.results[draft.id];
      delete s.best[draft.id];
    });
    await deletePhoto(draft.id);
    close();
    toast('Taak verwijderd');
    onSaved();
  };

  const close = modal(
    h('form', { class: 'editor', onsubmit: (e) => {
      e.preventDefault();
      save();
    } },
      h('h2', {}, isNew ? 'Eigen taak maken' : 'Taak bewerken'),
      h('div', { class: 'pic-row' },
        preview,
        h('div', { class: 'pic-actions' },
          h('button', { class: 'btn', type: 'button', onclick: () => camera.click() }, '📷 Foto maken'),
          h('button', { class: 'btn', type: 'button', onclick: () => gallery.click() }, '🖼️ Foto kiezen'),
          removePhoto, camera, gallery)),
      h('p', { class: 'muted small' }, 'Of kies een plaatje:'),
      emojiGrid,
      field('Naam (voor jou)', nameIn, 'ct-name'),
      field('Wat zegt de app bij de start?', sayIn, 'ct-say'),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Soort taak'),
        segmented('ct-mode', [['race', 'Zo snel mogelijk', 'klaar voor de slang op is'], ['hold', 'Volhouden', 'doorgaan tot de slang op is']], draft.mode, (v) => (draft.mode = v))),
      h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Doeltijd'), stepper(draft.sec, draft.sec, (v) => (draft.sec = v))),
      field('Groep', catSelect, 'ct-cat'),
      error,
      h('div', { class: 'editor-actions' },
        isNew ? h('span') : confirmButton('Verwijderen', 'Ja, verwijderen', remove),
        h('div', { class: 'editor-main' },
          h('button', { class: 'btn', type: 'button', onclick: () => close() }, 'Annuleren'),
          h('button', { class: 'btn primary', type: 'submit' }, 'Bewaren')))),
    { label: isNew ? 'Eigen taak maken' : 'Taak bewerken', backdropClose: false },
  );
  if (isNew) setTimeout(() => nameIn.focus(), 50);
}

// ---------- tab: records

function recordsTab(body) {
  const render = () => {
    body.replaceChildren();
    const st = store.state;
    const lastAt = (task) => st.results[task.id]?.at(-1)?.at || 0;
    const played = allTasks(st).filter((t) => st.results[t.id]?.length).sort((a, b) => lastAt(b) - lastAt(a));
    body.append(h('p', { class: 'tab-lead' }, played.length
      ? 'Per taakje: het record (snelste tijd), de doeltijd en de laatste keren.'
      : 'Nog geen tijden. Speel eerst een taakje, dan zie je hier de resultaten.'));
    for (const task of played) body.append(recordCard(task, render));
    body.append(h('section', { class: 'card' },
      h('h3', {}, 'Opnieuw beginnen'),
      settingRow('Stickerboek leegmaken', `${st.stickers.length} ${st.stickers.length === 1 ? 'sticker' : 'stickers'}`,
        confirmButton('Leegmaken', 'Ja, leegmaken', () => {
          store.update((s) => (s.stickers = []));
          toast('Het stickerboek is leeg');
          render();
        })),
      settingRow('Alle tijden en records wissen', 'De doeltijden blijven staan',
        confirmButton('Wissen', 'Ja, wissen', () => {
          store.update((s) => {
            s.results = {};
            s.best = {};
          });
          toast('Alle tijden zijn gewist');
          render();
        }))));
  };
  render();
}

function recordCard(task, rerender) {
  const st = store.state;
  const list = st.results[task.id] || [];
  const best = st.best[task.id];
  const hold = task.mode === 'hold';
  const beat = list.filter((r) => r.beat).length;
  const stat = (label, value) => h('div', { class: 'stat' }, h('dt', {}, label), h('dd', {}, value));

  return h('article', { class: 'card record-card' },
    h('header', { class: 'record-head' },
      taskPicture(task, 'row-pic'),
      h('div', {}, h('h3', {}, task.name), h('p', { class: 'muted small' }, hold ? 'Volhoud-taak' : 'Zo snel mogelijk'))),
    h('dl', { class: 'stats' },
      stat(hold ? 'Volgehouden' : 'Record', hold ? `${beat}×` : Number.isFinite(best) ? formatMs(best) : '—'),
      stat('Gespeeld', `${list.length}×`),
      stat(hold ? 'Gelukt' : 'Gehaald', `${beat}×`)),
    h('ol', { class: 'recent', 'aria-label': 'Laatste keren' }, list.slice(-5).reverse().map((r) =>
      h('li', {},
        h('span', { class: `badge ${r.beat ? 'ok' : 'over'}` }, r.beat ? 'gehaald' : 'te laat'),
        h('span', { class: 'when' }, formatWhen(r.at)),
        h('span', { class: 'time' }, formatMs(r.ms))))),
    h('div', { class: 'record-actions' },
      h('div', { class: 'field inline' }, h('span', { class: 'field-label' }, 'Doeltijd'),
        stepper(baseSeconds(st, task), task.sec, (sec) => setTarget(task, sec), `Doeltijd voor ${task.name}`)),
      !hold && Number.isFinite(best)
        ? h('button', { class: 'btn', type: 'button', onclick: () => {
            const sec = Math.max(5, Math.ceil(best / 1000));
            setTarget(task, sec);
            toast(`Doeltijd is nu ${formatSeconds(sec)}`);
            rerender();
          } }, 'Record als doeltijd')
        : null,
      confirmButton('Tijden wissen', 'Ja, wissen', () => {
        store.update((s) => {
          delete s.results[task.id];
          delete s.best[task.id];
        });
        toast('Tijden gewist');
        rerender();
      })));
}

function formatWhen(ts) {
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `vandaag ${time}`;
  if (new Date(now.getTime() - 86400000).toDateString() === d.toDateString()) return `gisteren ${time}`;
  return `${d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} ${time}`;
}

// ---------- tab: geluid & stem

const MIC_STATUS = {
  listening: 'Luistert…',
  off: '',
  denied: 'Geen toestemming voor de microfoon. Tik op het slotje naast het webadres en sta de microfoon toe.',
  nomic: 'Geen microfoon gevonden.',
  offline: 'Spraakherkenning werkt nu niet. Controleer de internetverbinding.',
  unsupported: 'Deze browser kan niet luisteren.',
};

function soundTab(body) {
  const st = store.state;
  const set = (fn) => store.update((s) => fn(s.settings));

  const noVoice = h('p', { class: 'note', hidden: true }, 'Geen Nederlandse stem gevonden. Op Android: Instellingen → Systeem → Talen → Tekst-naar-spraak, en installeer daar Nederlands.');
  const voiceSelect = h('select', { id: 'voice', onchange: (e) => set((x) => (x.voiceURI = e.target.value)) });
  const fillVoices = () => {
    const nl = dutchVoices();
    voiceSelect.replaceChildren(
      h('option', { value: '' }, 'Automatisch'),
      ...nl.map((v) => h('option', { value: v.voiceURI, selected: v.voiceURI === store.state.settings.voiceURI }, v.name)));
    noVoice.hidden = !speechAvailable || nl.length > 0;
  };
  fillVoices();
  const synth = window.speechSynthesis;
  synth?.addEventListener?.('voiceschanged', fillVoices);

  const rate = h('input', { type: 'range', id: 'rate', min: '0.7', max: '1.3', step: '0.05', value: String(st.settings.rate), oninput: (e) => set((x) => (x.rate = Number(e.target.value))) });

  let tester = null;
  const micStatus = h('p', { class: 'muted small', 'aria-live': 'polite' });
  const micOut = h('div', { class: 'mic-out' }, h('p', { class: 'muted' }, 'Druk op de knop en zeg “Op je plaatsen… klaar… af!” of “Klaar!”.'));
  const micBtn = h('button', { class: 'btn', type: 'button', onclick: () => {
    if (tester) {
      tester.stop();
      tester = null;
      micBtn.textContent = '🎤 Test de microfoon';
      return;
    }
    tester = new Listener(({ all, latest }) => {
      const heard = latest.split(' | ')[0];
      const stage = startStage(all);
      let meaning = 'geen startwoord of stopwoord';
      if (isStopCommand(latest)) meaning = 'dit stopt de tijd (“Klaar!”)';
      if (stage === 1) meaning = 'rood licht (“Op je plaatsen”)';
      if (stage === 2) meaning = 'oranje licht (“Klaar”)';
      if (stage === 3) meaning = 'groen licht: de race start (“Af!”)';
      micOut.replaceChildren(h('p', {}, `Gehoord: “${heard}”`), h('p', { class: 'muted small' }, `Betekent: ${meaning}`));
    }, (status) => (micStatus.textContent = MIC_STATUS[status] ?? ''));
    tester.start();
    micBtn.textContent = '⏹ Stop de test';
  } }, '🎤 Test de microfoon');

  const name = st.childName.trim();
  body.append(
    h('section', { class: 'card' },
      h('h3', {}, 'Geluid'),
      settingRow('Geluidjes', 'Piepjes bij het aftellen, plopjes en een feestdeuntje', switchInput('s-sound', st.settings.sound, 'Geluidjes', (v) => set((x) => (x.sound = v))), 's-sound')),
    h('section', { class: 'card' },
      h('h3', {}, 'Voorlezen'),
      settingRow('Voorlezen', 'De app zegt de taak, telt af en geeft complimentjes', switchInput('s-voice', st.settings.voice, 'Voorlezen', (v) => set((x) => (x.voice = v))), 's-voice'),
      !speechAvailable ? h('p', { class: 'note' }, 'Deze browser kan niet voorlezen.') : null,
      field('Stem', voiceSelect, 'voice'),
      noVoice,
      field('Spreeksnelheid', rate, 'rate'),
      h('button', { class: 'btn', type: 'button', onclick: () => speak(`Hoi${name ? ' ' + name : ''}! Ben je sneller dan de slang?`, { force: true }) }, '▶ Stem testen')),
    h('section', { class: 'card' },
      h('h3', {}, 'Spraakbesturing'),
      !recognitionSupported ? h('p', { class: 'note' }, 'Deze browser kan niet luisteren. Gebruik Chrome op Android. Tikken op de lampen en de KLAAR-knop werkt altijd.') : null,
      settingRow('Starten met je stem', 'Zeg “Op je plaatsen… klaar… af!” en bij “af” begint de race', switchInput('s-start', st.settings.listenStart, 'Starten met je stem', (v) => set((x) => (x.listenStart = v))), 's-start'),
      settingRow('Stoppen met je stem', 'Je kind roept “Klaar!” en de tijd stopt', switchInput('s-stop', st.settings.listenStop, 'Stoppen met je stem', (v) => set((x) => (x.listenStop = v))), 's-stop'),
      recognitionSupported ? h('div', { class: 'mic-test' }, micBtn, micStatus, micOut) : null,
      h('p', { class: 'muted small' }, 'Hoor je steeds een piepje als de microfoon aangaat? Zet dan “Stoppen met je stem” uit; de grote KLAAR-knop werkt altijd.')));

  return () => {
    tester?.stop();
    synth?.removeEventListener?.('voiceschanged', fillVoices);
  };
}

// ---------- tab: algemeen

function generalTab(body) {
  const st = store.state;
  const nameIn = h('input', { type: 'text', id: 'child-name', maxlength: '24', value: st.childName, placeholder: 'Naam', autocomplete: 'off', oninput: (e) => store.update((s) => (s.childName = e.target.value)) });
  body.append(
    h('section', { class: 'card' },
      h('h3', {}, 'Je kind'),
      field('Naam van je kind', nameIn, 'child-name'),
      h('p', { class: 'muted small' }, 'De app gebruikt de naam bij complimentjes, zoals “Super, Noor!”.')),
    h('section', { class: 'card' },
      h('h3', {}, 'Moeilijkheid'),
      h('p', { class: 'muted small' }, 'Geldt voor alle taakjes, bovenop de doeltijd die je per taakje kiest.'),
      segmented('difficulty', Object.entries(DIFFICULTY).map(([k, d]) => [k, d.label, d.hint]), st.settings.difficulty, (v) => store.update((s) => (s.settings.difficulty = v)))),
    h('section', { class: 'card' },
      h('h3', {}, 'Kleuren'),
      segmented('theme', [['auto', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']], st.settings.theme, (v) => {
        store.update((s) => (s.settings.theme = v));
        applyTheme(v);
      })),
    installCard(),
    h('section', { class: 'card' },
      h('h3', {}, 'Over Little Racer'),
      h('p', {}, '100 taakjes, drie racers (slang, slak en trein) en een stickerboek.'),
      h('p', { class: 'muted small' }, 'Alles wordt alleen op dit apparaat bewaard. Voor spraakherkenning gebruikt Chrome de spraakdienst van Google.'),
      h('p', { class: 'muted small' }, 'Versie 1.0')));
}

function installCard() {
  if (embedded) return null;
  if (isInstalled()) return h('section', { class: 'card' }, h('h3', {}, 'App'), h('p', {}, 'Little Racer staat als app op dit apparaat.'));
  const button = canInstall()
    ? h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        if (await install()) toast('Little Racer staat nu op je startscherm');
      } }, 'Zet op het startscherm')
    : h('p', { class: 'muted small' }, 'In Chrome: open het menu (⋮) en kies “App installeren” of “Toevoegen aan startscherm”.');
  return h('section', { class: 'card' },
    h('h3', {}, 'Als app op je tablet'),
    h('p', {}, 'Zet Little Racer op het startscherm. Dan opent hij als een echte app, schermvullend en ook zonder internet.'),
    button);
}
