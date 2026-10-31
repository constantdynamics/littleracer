// Eenvoudige navigatie tussen de schermen, met de terugknop van Android.
// Tijdens een race is terug-vegen geblokkeerd (nav.locked), zodat een kind
// niet per ongeluk de race afbreekt.

const views = {};
let root = null;
let current = null;
let route = null;
let shown = 0;

function show(next) {
  shown++;
  current?.destroy?.();
  root.replaceChildren();
  route = next;
  current = (views[next.name] || views.home)(root, next.params || {}) || {};
  root.scrollTop = 0;
}

function onPop(e) {
  if (nav.locked) {
    try {
      history.pushState({ route }, '');
    } catch {
      // geschiedenis niet beschikbaar
    }
    return;
  }
  show(e.state?.route || { name: 'home', params: {}, depth: 0 });
}

export const nav = {
  locked: false,

  init(el, map) {
    root = el;
    Object.assign(views, map);
    window.addEventListener('popstate', onPop);
    const start = { name: 'home', params: {}, depth: 0 };
    try {
      history.replaceState({ route: start }, '');
    } catch {
      // geschiedenis niet beschikbaar
    }
    show(start);
  },

  go(name, params = {}, { replace = false } = {}) {
    const depth = replace ? route?.depth || 0 : (route?.depth || 0) + 1;
    const next = { name, params, depth };
    try {
      if (replace) history.replaceState({ route: next }, '');
      else history.pushState({ route: next }, '');
    } catch {
      // geschiedenis niet beschikbaar: gewoon tonen
    }
    show(next);
  },

  home() {
    if (!route || route.name === 'home') return;
    const depth = route.depth || 0;
    if (depth > 0) {
      try {
        const before = shown;
        history.go(-depth);
        // Valt de terugsprong weg (bijvoorbeeld in een ingesloten venster), dan direct tonen.
        setTimeout(() => shown === before && show({ name: 'home', params: {}, depth: 0 }), 400);
        return;
      } catch {
        // val terug op direct tonen
      }
    }
    show({ name: 'home', params: {}, depth: 0 });
  },

  get route() {
    return route;
  },
};
