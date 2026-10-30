// Herkent startwoorden ("Op je plaatsen… klaar… af!") en het stopwoord ("Klaar!")
// in tekst uit de spraakherkenning. Puur: geen DOM, zodat het te testen is.

export function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Spraakherkenning schrijft "klaar" soms anders op, zeker bij kinderstemmen.
const KLAAR = new Set(['klaar', 'klaaar', 'klaa', 'klar', 'claar', 'clair', 'klaren']);
// Na "klaar" telt een kort woordje als het startschot: "af" wordt vaak als "of" of "haf" verstaan.
const GO_AFTER_KLAAR = new Set(['af', 'aff', 'haf', 'of', 'ah', 'ga', 'go', 'gaan', 'start', 'nu']);
// Deze woorden starten ook zonder "klaar" ervoor.
const GO_ALONE = new Set(['start', 'starten', 'go', 'klaaraf', 'klaarof']);

/**
 * Stand van het startlicht na wat er gehoord is:
 * 0 = niets, 1 = "op je plaatsen" (rood), 2 = "klaar" (oranje), 3 = "af" (groen, start!).
 */
export function startStage(text) {
  const words = normalize(text).split(' ').filter(Boolean);
  let stage = 0;
  let klaarAt = -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (GO_ALONE.has(w)) return 3;
    if (KLAAR.has(w)) {
      if (klaarAt < 0) klaarAt = i;
      stage = Math.max(stage, 2);
    } else if (klaarAt >= 0 && i > klaarAt && GO_AFTER_KLAAR.has(w)) {
      return 3;
    } else if (w.startsWith('plaats')) {
      stage = Math.max(stage, 1);
    }
  }
  return stage;
}

// Zinnen met "klaar" die juist níet betekenen dat het kind klaar is.
const NOT_DONE = [
  /\bnog niet\b/, /\bniet klaar\b/, /\bbijna klaar\b/, /\bben je\b/, /\bbent u\b/,
  /\bklaar voor\b/, /\bklaarleggen\b/, /\bklaarzetten\b/,
];
const STOP_WORDS = new Set([...KLAAR, 'gedaan', 'stop', 'stoppen', 'finish', 'klaaraf']);

/** True als het kind (of de ouder) roept dat de taak klaar is. */
export function isStopCommand(text) {
  const n = normalize(text);
  if (!n) return false;
  if (NOT_DONE.some((re) => re.test(n))) return false;
  return n.split(' ').some((w) => STOP_WORDS.has(w));
}
