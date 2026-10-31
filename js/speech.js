// Voorlezen (text-to-speech) en luisteren (spraakherkenning) in het Nederlands.
import { store } from './store.js';
import { embedded } from './env.js';

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
let voices = [];

function refreshVoices() {
  try {
    voices = synth ? synth.getVoices() : [];
  } catch {
    voices = [];
  }
}
if (synth) {
  refreshVoices();
  synth.addEventListener?.('voiceschanged', refreshVoices);
}

const isDutch = (v) => /^nl([-_]|$)/i.test(v.lang || '');

export function dutchVoices() {
  refreshVoices();
  return voices.filter(isDutch);
}

function pickVoice() {
  const nl = dutchVoices();
  const chosen = nl.find((v) => v.voiceURI === store.state.settings.voiceURI);
  return chosen || nl.find((v) => /nl[-_]nl/i.test(v.lang)) || nl[0] || null;
}

export const speechAvailable = !!synth;

/** Leest tekst voor. De promise wordt altijd vervuld, ook als het apparaat niets zegt. */
export function speak(text, { force = false } = {}) {
  return new Promise((resolve) => {
    if (!synth || !text || (!store.state.settings.voice && !force)) return resolve(false);
    let done = false;
    let timer = 0;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    try {
      if (synth.speaking || synth.pending) synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice();
      if (voice) u.voice = voice;
      u.lang = voice?.lang || 'nl-NL';
      u.rate = store.state.settings.rate || 1;
      u.pitch = 1.08;
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      // Sommige toestellen melden het einde niet: dan na een redelijke tijd verder.
      const words = text.split(/\s+/).length;
      timer = setTimeout(() => finish(false), 1200 + (words * 520) / u.rate);
      // Een heel korte pauze na cancel() voorkomt dat Chrome de zin overslaat.
      setTimeout(() => {
        try {
          synth.resume?.();
          synth.speak(u);
        } catch {
          finish(false);
        }
      }, 40);
    } catch {
      finish(false);
    }
  });
}

export function stopSpeaking() {
  try {
    synth?.cancel();
  } catch {
    // niets te stoppen
  }
}

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
// In een ingesloten voorbeeldweergave mag de pagina niet bij de microfoon: dan alleen tikken.
export const recognitionSupported = !!Recognition && !embedded;

/**
 * Blijft luisteren tot stop() wordt aangeroepen. Herstart vanzelf als de browser
 * na een stilte stopt. onText krijgt { all, latest }: alles wat sinds start() is
 * gehoord, en alleen de laatste zin (met alternatieven).
 * onStatus krijgt 'listening', 'off', 'denied', 'nomic', 'offline' of 'unsupported'.
 */
export class Listener {
  constructor(onText, onStatus = () => {}) {
    this.onText = onText;
    this.onStatus = onStatus;
    this.active = false;
    this.rec = null;
    this.heard = '';
    this.failures = 0;
    this.quickEnds = 0;
    this.restartTimer = 0;
  }

  start() {
    if (!Recognition) {
      this.onStatus('unsupported');
      return;
    }
    if (this.active) return;
    this.active = true;
    this.heard = '';
    this.failures = 0;
    this.quickEnds = 0;
    this.spawn();
  }

  stop() {
    this.active = false;
    clearTimeout(this.restartTimer);
    const rec = this.rec;
    this.rec = null;
    try {
      rec?.abort();
    } catch {
      // al gestopt
    }
    this.onStatus('off');
  }

  spawn() {
    let rec;
    try {
      rec = new Recognition();
    } catch {
      this.active = false;
      this.onStatus('unsupported');
      return;
    }
    rec.lang = 'nl-NL';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    let session = '';
    const startedAt = Date.now();

    rec.onstart = () => {
      if (this.rec === rec) this.onStatus('listening');
    };
    rec.onresult = (e) => {
      if (this.rec !== rec) return;
      this.failures = 0;
      const parts = [];
      for (let i = 0; i < e.results.length; i++) parts.push(e.results[i][0]?.transcript || '');
      session = parts.join(' ');
      const last = e.results[e.results.length - 1];
      const alts = [];
      for (let j = 0; j < (last?.length || 0); j++) alts.push(last[j].transcript);
      this.onText({ all: `${this.heard} ${session}`.trim(), latest: alts.join(' | ') });
    };
    rec.onerror = (e) => {
      if (this.rec !== rec) return;
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.active = false;
        this.onStatus('denied');
      } else if (e.error === 'audio-capture') {
        this.active = false;
        this.onStatus('nomic');
      } else if (e.error === 'network') {
        this.failures++;
        if (this.failures > 2) {
          this.active = false;
          this.onStatus('offline');
        }
      }
    };
    rec.onend = () => {
      if (this.rec !== rec) return;
      this.heard = `${this.heard} ${session}`.trim().slice(-240);
      if (!this.active) return;
      // Stopt de herkenning steeds meteen zonder iets te horen, wacht dan steeds langer.
      this.quickEnds = !session && Date.now() - startedAt < 1500 ? this.quickEnds + 1 : 0;
      if (this.quickEnds > 6) {
        this.active = false;
        this.onStatus('offline');
        return;
      }
      const delay = Math.min(4000, 300 * 2 ** this.quickEnds);
      this.restartTimer = setTimeout(() => this.active && this.spawn(), delay);
    };

    this.rec = rec;
    try {
      rec.start();
    } catch {
      this.failures++;
      if (this.failures > 2) {
        this.active = false;
        this.onStatus('unsupported');
        return;
      }
      this.restartTimer = setTimeout(() => this.active && this.spawn(), 1000);
    }
  }
}
