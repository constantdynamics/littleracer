// Foto's van eigen taken: verkleind tot JPEG en bewaard in IndexedDB.
// Bij het opstarten laden we ze in het geheugen, zodat ze meteen te tonen zijn.

const DB_NAME = 'littleracer';
const STORE = 'photos';
const cache = new Map();
let dbPromise = null;

function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).catch(() => null);
  }
  return dbPromise;
}

function tx(mode, run) {
  return db().then(
    (d) =>
      d &&
      new Promise((resolve) => {
        const t = d.transaction(STORE, mode);
        const result = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(result.result ?? true);
        t.onerror = () => resolve(null);
      }),
  ).catch(() => null);
}

export async function loadPhotos() {
  try {
    const d = await db();
    if (!d) return;
    await new Promise((resolve) => {
      const req = d.transaction(STORE).objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cur = req.result;
        if (!cur) return resolve();
        cache.set(cur.key, cur.value);
        cur.continue();
      };
      req.onerror = () => resolve();
    });
  } catch {
    // Geen IndexedDB: foto's blijven alleen deze sessie bewaard.
  }
}

export const photoFor = (id) => cache.get(id) || null;

export async function savePhoto(id, dataUrl) {
  cache.set(id, dataUrl);
  await tx('readwrite', (s) => s.put(dataUrl, id));
}

export async function deletePhoto(id) {
  cache.delete(id);
  await tx('readwrite', (s) => s.delete(id));
}

/** Maakt van een gekozen bestand een vierkante JPEG van maximaal 480 px. */
export async function shrinkImage(file, size = 480) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Deze foto kan niet worden geopend.'));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const out = Math.min(size, side);
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
