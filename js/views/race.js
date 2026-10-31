// Het racescherm: kies slang, slak of trein, tel af ("Op je plaatsen… klaar… af!"),
// en kijk hoeveel er over is als je klaar bent.
import { h, s, holdable, confetti, taskPicture, sleep } from '../ui.js';
import { store } from '../store.js';
import { findTask, targetMs, recordResult, shapeById, SHAPES, formatClock, formatMs, formatSeconds, unitsPhrase } from '../logic.js';
import { speak, stopSpeaking, Listener, recognitionSupported } from '../speech.js';
import { startStage, isStopCommand } from '../match.js';
import { sfx, buzz } from '../sound.js';
import { Viz } from '../viz.js';
import { nav } from '../nav.js';
import { stickerEl } from './stickers.js';

const NOUN = { slang: 'de slang', slak: 'de slak', trein: 'de trein' };
const STAGE_WORDS = ['', 'Op je plaatsen…', 'Klaar…', 'AF!'];
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function raceView(root, { id }) {
  const state = store.state;
  const task = findTask(state, id);
  if (!task) {
    setTimeout(() => nav.home());
    return {};
  }
  const hold = task.mode === 'hold';
  const name = state.childName.trim();
  const withName = (text) => (name ? text.replace('{naam}', `, ${name}`) : text.replace('{naam}', ''));
  const target = targetMs(state, task);

  let shape = shapeById(state.settings.shape).id;
  let phase = 'ready'; // ready → countdown → running → check → done
  let startAt = 0;
  let frozen = 0;
  let stage = 0;
  let raf = 0;
  let listener = null;
  let micStatus = recognitionSupported ? 'off' : 'unsupported';
  let wakeLock = null;
  let countdownRun = 0;
  let nextCheer = 0;
  let cheerTimer = 0;
  let layer = null;
  let destroyed = false;

  // ---------- opbouw
  const svg = s('svg', { class: 'viz', role: 'img', 'aria-label': 'Hoeveel tijd er nog over is' });
  const viz = new Viz(svg);
  viz.shape = shape;
  viz.onUnitGone = () => phase === 'running' && sfx.blip();

  const bigWord = h('div', { class: 'big-word', hidden: true, 'aria-live': 'assertive' });
  const cheerText = h('span', { class: 'cheer-text' });
  const cheerFace = h('span', { class: 'cheer-face', 'aria-hidden': 'true' });
  const cheer = h('div', { class: 'cheer', hidden: true, 'aria-live': 'polite' }, cheerFace, cheerText);
  const vizBox = h('div', { class: `viz-box scene-${shape}` }, svg, bigWord, cheer);

  const clock = h('div', { class: 'clock', title: 'Tijd (voor ouders)' }, `0:00 / ${formatClock(target)}`);
  const homeBtn = h('button', { class: 'icon-btn', 'aria-label': 'Terug naar het begin', onclick: () => nav.home() }, h('span', { 'aria-hidden': 'true' }, '🏠'));
  const stopBtn = holdable(
    h('button', { class: 'icon-btn hold-ring', 'aria-label': 'Race stoppen: ingedrukt houden', hidden: true }, h('span', { 'aria-hidden': 'true' }, '✖')),
    1200,
    () => cancelRace(),
  );
  const top = h('header', { class: 'race-top' }, homeBtn, stopBtn,
    h('div', { class: 'race-task' }, taskPicture(task, 'race-pic'), h('span', { class: 'race-name' }, task.name)),
    clock);
  const controls = h('section', { class: 'race-controls', 'aria-label': 'Bediening' });
  const view = h('main', { class: `race${hold ? ' is-hold' : ''}` }, top, vizBox, controls);
  root.append(view);

  const ro = new ResizeObserver(() => {
    const r = vizBox.getBoundingClientRect();
    viz.resize(r.width, r.height);
  });
  ro.observe(vizBox);

  // ---------- spraak
  function hint() {
    if (phase === 'ready' || phase === 'countdown') {
      if (micStatus === 'listening') return [h('span', { class: 'mic-dot', 'aria-hidden': 'true' }), ' Zeg “Klaar… af!” of tik op de lampen'];
      if (micStatus === 'denied') return 'Microfoon staat uit. Tik op de lampen om te starten.';
      if (micStatus === 'offline') return 'Spraak werkt nu niet (geen internet). Tik op de lampen.';
      return 'Tik op de lampen om te starten';
    }
    if (phase === 'running' && !hold && micStatus === 'listening') return [h('span', { class: 'mic-dot', 'aria-hidden': 'true' }), ' Roep “KLAAR!” of druk op de knop'];
    return '';
  }
  const micHint = h('p', { class: 'mic-hint', 'aria-live': 'polite' });
  const setHint = () => micHint.replaceChildren(...[hint()].flat());

  function listenForStart() {
    if (!state.settings.listenStart || !recognitionSupported || phase !== 'ready' || destroyed) return setHint();
    listener?.stop();
    listener = new Listener(({ all }) => {
      if (phase !== 'ready') return;
      const next = startStage(all);
      if (next > stage) {
        stage = next;
        showStage(stage);
        if (stage === 3) go();
      }
    }, onMicStatus);
    listener.start();
  }

  function listenForStop() {
    if (!state.settings.listenStop || !recognitionSupported || hold || phase !== 'running' || destroyed) return setHint();
    listener?.stop();
    listener = new Listener(({ latest }) => {
      if (phase === 'running' && isStopCommand(latest)) pressDone();
    }, onMicStatus);
    listener.start();
  }

  function onMicStatus(status) {
    micStatus = status;
    setHint();
  }

  function stopListening() {
    listener?.stop();
    listener = null;
  }

  /** Voorlezen zonder dat de app zichzelf hoort; daarna weer luisteren. */
  async function say(text) {
    const was = phase;
    const resume = listener ? (was === 'ready' ? listenForStart : was === 'running' ? listenForStop : null) : null;
    stopListening();
    await speak(text);
    if (resume && !destroyed && phase === was) resume();
  }

  // ---------- fases
  function lamp(color) {
    return h('span', { class: `lamp lamp-${color}`, 'aria-hidden': 'true' });
  }

  let lights = null;
  function renderReady() {
    const shapeBtns = SHAPES.map((sh) =>
      h('button', { class: 'shape-btn', 'aria-pressed': String(sh.id === shape), onclick: () => chooseShape(sh.id) },
        h('span', { class: 'shape-emoji', 'aria-hidden': 'true' }, sh.emoji),
        h('span', { class: 'shape-name' }, sh.name)));
    lights = h('button', { class: 'start-lights', 'aria-label': 'Starten: tik om af te tellen', onclick: () => appCountdown() },
      lamp('red'), lamp('amber'), lamp('green'));
    controls.replaceChildren(
      h('div', { class: 'shape-pick', role: 'group', 'aria-label': 'Kies wie er meedoet' }, shapeBtns),
      lights,
      micHint);
    setHint();
  }

  function renderRunning() {
    if (hold) {
      controls.replaceChildren(
        h('div', { class: 'hold-msg' },
          h('span', { class: 'hold-big' }, 'Hou vol!'),
          h('span', { class: 'hold-sub' }, capitalize(shapeById(shape).until))),
        micHint);
    } else {
      controls.replaceChildren(
        h('button', { class: 'done-btn', onclick: () => pressDone() },
          h('span', { class: 'done-star', 'aria-hidden': 'true' }, '⭐'),
          h('span', {}, 'KLAAR!')),
        micHint);
    }
    setHint();
  }

  function renderCheck() {
    const ok = holdable(
      h('button', { class: 'big-btn ok' },
        h('span', { class: 'big-btn-icon', 'aria-hidden': 'true' }, '👍'),
        h('span', {}, 'Helemaal goed'),
        h('small', {}, 'houd vast')),
      800,
      () => finish(frozen, true),
    );
    const notYet = h('button', { class: 'big-btn soft', onclick: () => resume() },
      h('span', { class: 'big-btn-icon', 'aria-hidden': 'true' }, '↩️'),
      h('span', {}, 'Nog even'),
      h('small', {}, 'tijd loopt door'));
    controls.replaceChildren(
      h('div', { class: 'check' },
        h('h2', {}, 'Even checken!'),
        h('p', { class: 'check-q' }, 'Ouder: is alles echt goed gedaan?'),
        h('div', { class: 'check-btns' }, ok, notYet)));
  }

  function showStage(st) {
    if (lights) lights.className = `start-lights stage-${st}`;
    bigWord.hidden = false;
    bigWord.className = `big-word s${st} pop`;
    bigWord.textContent = STAGE_WORDS[st];
    if (st < 3) sfx.light();
  }

  function chooseShape(id) {
    if (phase !== 'ready' || id === shape) return;
    shape = id;
    sfx.tap();
    store.update((st) => {
      st.settings.shape = id;
    });
    vizBox.className = `viz-box scene-${shape}`;
    viz.setShape(shape);
    renderReady();
    say(hold ? `Hou vol ${shapeById(shape).until}!` : shapeById(shape).race);
  }

  async function enterReady() {
    phase = 'ready';
    stage = 0;
    nav.locked = false;
    homeBtn.hidden = false;
    stopBtn.hidden = true;
    bigWord.hidden = true;
    cheer.hidden = true;
    vizBox.classList.remove('overtime');
    viz.dancing = false;
    viz.setProgress(0);
    clock.classList.remove('over');
    clock.textContent = `0:00 / ${formatClock(target)}`;
    renderReady();
    const sh = shapeById(shape);
    await speak(`${task.say} ${hold ? `Hou vol ${sh.until}!` : sh.race}`);
    if (phase === 'ready' && !destroyed) listenForStart();
  }

  async function appCountdown() {
    if (phase !== 'ready') return;
    phase = 'countdown';
    stopListening();
    setHint();
    controls.querySelectorAll('.shape-btn').forEach((b) => (b.disabled = true));
    const run = ++countdownRun;
    for (const st of [1, 2]) {
      if (run !== countdownRun || destroyed) return;
      stage = st;
      showStage(st);
      await Promise.all([speak(STAGE_WORDS[st].replace('…', '')), sleep(1000)]);
    }
    if (run !== countdownRun || destroyed) return;
    speak('Af!');
    go();
  }

  function go() {
    if (phase === 'running' || destroyed) return;
    phase = 'running';
    stopListening();
    stage = 3;
    showStage(3);
    sfx.go();
    buzz(70);
    setTimeout(() => {
      if (phase === 'running') bigWord.hidden = true;
    }, 1100);
    startAt = performance.now();
    nextCheer = 0;
    homeBtn.hidden = true;
    stopBtn.hidden = false;
    nav.locked = true;
    requestWakeLock();
    renderRunning();
    // Even wachten, zodat het "af!" van de ouder niet als "klaar" wordt gehoord.
    setTimeout(() => phase === 'running' && listenForStop(), 900);
  }

  function pressDone() {
    if (phase !== 'running' || hold) return;
    const elapsed = performance.now() - startAt;
    stopListening();
    sfx.tap();
    buzz(40);
    if (elapsed < target) {
      phase = 'check';
      frozen = elapsed;
      viz.setProgress(elapsed / target);
      clock.textContent = `${formatClock(elapsed)} / ${formatClock(target)}`;
      renderCheck();
      speak('Even checken!');
    } else {
      finish(elapsed, false);
    }
  }

  function resume() {
    if (phase !== 'check') return;
    phase = 'running';
    startAt = performance.now() - frozen;
    renderRunning();
    say('Nog even doorgaan!').then(() => phase === 'running' && listenForStop());
  }

  function cancelRace() {
    if (phase !== 'running' && phase !== 'check') return;
    stopListening();
    stopSpeaking();
    releaseWakeLock();
    enterReady();
  }

  async function cheerUp(first) {
    if (first) {
      sfx.chime();
      vizBox.classList.add('overtime');
    }
    const lines = first
      ? [withName('Jij kan het{naam}! Nog even!')]
      : ['Goed bezig! Doorgaan!', withName('Zet hem op{naam}!'), 'Jij kan het! Nog even!'];
    const line = lines[Math.floor(Math.random() * lines.length)];
    cheerFace.textContent = shapeById(shape).emoji;
    cheerText.textContent = line;
    cheer.hidden = false;
    cheer.classList.remove('pop');
    void cheer.offsetWidth;
    cheer.classList.add('pop');
    clearTimeout(cheerTimer);
    cheerTimer = setTimeout(() => (cheer.hidden = true), 5500);
    await say(line);
  }

  function finish(ms, beat) {
    if (phase === 'done') return;
    phase = 'done';
    stopListening();
    releaseWakeLock();
    nav.locked = false;
    stopBtn.hidden = true;
    homeBtn.hidden = false;
    cheer.hidden = true;
    clearTimeout(cheerTimer);
    controls.replaceChildren();
    const left = hold ? 0 : viz.unitsLeft(ms / target);
    let result = { newRecord: false, sticker: null };
    store.update((st) => {
      result = recordResult(st, task, { ms, beat, shape });
    });
    if (beat) {
      viz.dancing = true;
      confetti();
      sfx.fanfare();
      buzz([60, 50, 60]);
      if (shape === 'trein') setTimeout(sfx.toot, 800);
      showResult(ms, beat, left, result);
      let praise;
      if (hold) praise = withName('Goed volgehouden{naam}!');
      else {
        praise = withName(`Super{naam}! Je was sneller dan ${NOUN[shape]}!`);
        praise += left > 0 ? ` Je had nog ${unitsPhrase(shape, left)} over.` : ' Net op tijd!';
        if (result.newRecord) praise += ' Nieuw record!';
      }
      speak(`${praise} Je krijgt een sticker!`);
    } else {
      showResult(ms, beat, 0, result);
      speak(withName(`Goed gedaan{naam}! Het is gelukt. Volgende keer sneller dan ${NOUN[shape]}?`));
    }
  }

  function showResult(ms, beat, left, { newRecord, sticker }) {
    const parentInfo = hold
      ? `Volgehouden: ${formatSeconds(Math.round(ms / 1000))}`
      : `Tijd ${formatMs(ms)} · doel ${formatSeconds(Math.round(target / 1000))}${newRecord ? ' · record!' : ''}`;
    const again = h('button', { class: 'big-btn soft', onclick: () => { layer?.remove(); layer = null; enterReady(); } },
      h('span', { class: 'big-btn-icon', 'aria-hidden': 'true' }, '🔁'), h('span', {}, 'Nog een keer'));
    const book = h('button', { class: 'big-btn soft', onclick: () => nav.go('stickers', {}, { replace: true }) },
      h('span', { class: 'big-btn-icon', 'aria-hidden': 'true' }, '📒'), h('span', {}, 'Stickers'));
    const home = h('button', { class: 'big-btn soft', onclick: () => nav.home() },
      h('span', { class: 'big-btn-icon', 'aria-hidden': 'true' }, '🏠'), h('span', {}, 'Terug'));

    let card;
    if (beat) {
      const title = newRecord ? 'Nieuw record!' : hold ? 'Goed volgehouden!' : 'Gelukt!';
      card = h('div', { class: 'result-card' },
        stickerEl(sticker, { big: true }),
        h('h2', {}, title),
        !hold ? h('p', { class: 'left' }, left > 0 ? `Nog ${unitsPhrase(shape, left)} over!` : 'Net op tijd!') : null,
        h('p', { class: 'result-sub' }, 'Je krijgt een sticker!'),
        h('p', { class: 'parent-info' }, parentInfo),
        h('div', { class: 'result-btns' }, again, book, home));
    } else {
      card = h('div', { class: 'result-card' },
        h('div', { class: 'result-face', 'aria-hidden': 'true' }, '🙌'),
        h('h2', {}, 'Goed gedaan!'),
        h('p', { class: 'result-sub' }, `Volgende keer sneller dan ${NOUN[shape]}?`),
        h('p', { class: 'parent-info' }, parentInfo),
        h('div', { class: 'result-btns' }, again, home));
    }
    layer = h('div', { class: 'result-layer' }, card);
    view.append(layer);
  }

  // ---------- klok
  function frame(now) {
    if (destroyed) return;
    if (phase === 'running') {
      const elapsed = now - startAt;
      const p = elapsed / target;
      viz.setProgress(p);
      if (p < 1) clock.textContent = `${formatClock(elapsed)} / ${formatClock(target)}`;
      else {
        clock.textContent = `+${formatClock(elapsed - target)}`;
        clock.classList.add('over');
        if (hold) finish(target, true);
        else if (now >= nextCheer) {
          cheerUp(nextCheer === 0);
          nextCheer = now + 35000;
        }
      }
    }
    viz.render(now);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  // ---------- scherm aan houden
  async function requestWakeLock() {
    try {
      wakeLock = (await navigator.wakeLock?.request('screen')) || null;
    } catch {
      wakeLock = null;
    }
  }
  function releaseWakeLock() {
    try {
      wakeLock?.release();
    } catch {
      // al vrijgegeven
    }
    wakeLock = null;
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible' && phase === 'running') requestWakeLock();
  };
  document.addEventListener('visibilitychange', onVisible);

  enterReady();

  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      clearTimeout(cheerTimer);
      stopListening();
      stopSpeaking();
      releaseWakeLock();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
      nav.locked = false;
      layer?.remove();
    },
  };
}

