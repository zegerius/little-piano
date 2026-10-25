// Little Piano Songbook — a single-file Cloudflare Worker.
// No build step, bindings, assets, or dependencies are required.

export default {
  async fetch(request) {
    const path = new URL(request.url).pathname;

    // Diagnostics from the page (only sent in debug mode); they show up in
    // the wrangler dev / wrangler tail output.
    if (path === '/log' && request.method === 'POST') {
      const text = (await request.text()).slice(0, 65536);
      for (const line of text.split('\n')) console.log('[page] ' + line);
      return new Response(null, { status: 204 });
    }

    if (path === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    const asset = ASSETS[path];
    if (asset && request.method === 'GET') {
      return new Response(asset.body(), {
        headers: {
          'Content-Type': asset.type,
          'Cache-Control': asset.cache || 'public, max-age=86400',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    }

    if (path !== '/' && path !== '/index.html') {
      return new Response('Not found', { status: 404 });
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, HEAD' }
      });
    }

    return new Response(request.method === 'HEAD' ? null : HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Permissions-Policy': 'microphone=(self)'
      }
    });
  }
};

const CSS = String.raw`
:root {
  --ink: #2a2140;
  --ink-soft: #6b5f7a;
  --paper: #fffdf8;
  --blanket: #ffe6d4;
  --toy: #e3262e;
  --toy-dark: #b51b23;
  --wood: #f3dfbb;
  --wood-edge: #d8b987;
  --font: ui-rounded, "Fredoka", "Nunito", system-ui, sans-serif;
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}

* { box-sizing: border-box; }
[hidden] { display: none !important; }

html, body {
  height: 100%;
  margin: 0;
  overscroll-behavior: none;
}

body {
  color: var(--ink);
  font-family: var(--font);
  background-color: var(--blanket);
  background-image: repeating-linear-gradient(98deg,
    transparent 0 14px, rgba(255, 150, 105, .26) 14px 19px,
    transparent 19px 33px, rgba(236, 110, 165, .16) 33px 35px);
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}

button, select { font: inherit; color: inherit; }
button { cursor: pointer; touch-action: manipulation; }
button:focus-visible, select:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
svg { display: block; }

.screen {
  position: fixed;
  inset: 0;
  max-width: 1000px;
  margin-inline: auto;
}

/* ---------- Shared controls ---------- */

.round {
  flex: none;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .94);
  color: var(--ink);
  display: grid;
  place-items: center;
  box-shadow: 0 3px 0 rgba(42, 33, 64, .18);
}

.btn {
  border: 0;
  border-radius: 999px;
  padding: 0 20px;
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #fff;
  color: var(--ink);
  font-weight: 750;
  font-size: 1.05rem;
  box-shadow: 0 4px 0 rgba(42, 33, 64, .2);
  transition: transform .08s, box-shadow .08s;
}

.btn:active, .round:active { transform: translateY(3px); box-shadow: 0 1px 0 rgba(42, 33, 64, .2); }
.btn.primary { background: var(--ink); color: #fff; }
.btn svg { width: 22px; height: 22px; }
.btn.icon { padding: 0; width: 50px; }

.micpick {
  display: flex;
  align-items: center;
  gap: 8px;
}

.micpick select {
  min-width: 0;
  flex: 1;
  height: 44px;
  padding: 0 12px;
  border: 2px solid #e6dcea;
  border-radius: 12px;
  background: #fff;
}

.micpick svg { width: 20px; height: 20px; flex: none; }

/* ---------- Home: the card shelf ---------- */

#home {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: var(--sat) var(--sar) var(--sab) var(--sal);
}

.home-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 6px;
}

.home-head h1 {
  margin: 0;
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -.01em;
  line-height: 1;
}

.tune-btn {
  position: relative;
  min-height: 44px;
  padding: 0 16px 0 12px;
  font-size: .98rem;
}

.tune-btn .dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--toy);
  border: 3px solid var(--blanket);
}

.shelf {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(158px, 1fr));
  gap: 20px 16px;
  padding: 14px 18px 36px;
}

.card {
  position: relative;
  aspect-ratio: 4 / 3.5;
  padding: 0;
  border: 4px solid #231c33;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  display: grid;
  grid-template-rows: 44% 56%;
  text-align: left;
  transform: rotate(var(--tilt, 0deg));
  box-shadow: 0 6px 0 rgba(42, 33, 64, .16), 0 12px 24px rgba(42, 33, 64, .14);
  transition: transform .15s;
}

.card { cursor: pointer; }
.card:active:not(:has(.peek:active)) { transform: rotate(0deg) scale(.96); }
.card:focus-visible { outline: 3px solid var(--ink); outline-offset: 4px; }

/* Preview: plays the notes shown on the card, lighting each dot in turn. */
.peek {
  position: absolute;
  right: 8px;
  bottom: 8px;
  z-index: 2;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1.5px solid rgba(255, 255, 255, .55);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(24, 16, 44, .32);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  transition: transform .12s, background .2s, color .2s;
}

.peek::before { content: ''; position: absolute; inset: -8px; }
.peek svg { width: 14px; height: 14px; }
.peek:active { transform: scale(.9); }
.card.playing .peek { background: #fff; color: var(--ink); }
.card-staff circle { transform-box: fill-box; transform-origin: center; transition: transform .2s cubic-bezier(.3, 1.6, .5, 1); }
.card-staff circle.lit { transform: scale(1.6); }

/* While previewing, the card lifts, glows in the colour of the sounding key
   and the staff rolls through the whole song. */
.card { transition: transform .25s cubic-bezier(.3, 1.4, .5, 1), box-shadow .18s; }
.card.playing {
  z-index: 1;
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 0 0 4px var(--glow, transparent), 0 10px 0 rgba(42, 33, 64, .14), 0 18px 30px rgba(42, 33, 64, .2);
}
.card-staff .roll { transition: transform var(--step, .25s) cubic-bezier(.4, 0, .2, 1); }
.card .prog {
  position: absolute;
  z-index: 1;
  left: 0;
  right: 0;
  top: 0;
  height: 4px;
  background: var(--glow, var(--toy));
  transform-origin: left;
  transition: background .18s;
}
.card .floaty {
  position: absolute;
  z-index: 1;
  bottom: 30%;
  color: #fff;
  font: 26px/1 "Noto Music", var(--font);
  text-shadow: 0 1px 4px rgba(20, 14, 40, .6);
  pointer-events: none;
  animation: floaty 1.3s ease-out forwards;
}
@keyframes floaty {
  from { transform: translate(0, 8px) scale(.6); opacity: 0; }
  15%, 60% { opacity: 1; }
  to { transform: translate(var(--dx), -70px) scale(1.1) rotate(var(--r)); opacity: 0; }
}
.card-staff, .card-scene { position: relative; min-height: 0; }
.card-staff svg, .card-scene svg, .banner-art svg { position: absolute; inset: 0; width: 100%; height: 100%; }

.card-scene::after {
  content: '';
  position: absolute;
  inset: 45% 0 0;
  background: linear-gradient(180deg, transparent, rgba(20, 14, 40, .55));
}

.card-title {
  z-index: 1;
  position: absolute;
  left: 10px;
  right: 48px;
  bottom: 8px;
  color: #fff;
  font-weight: 750;
  font-size: 1rem;
  line-height: 1.12;
  text-shadow: 0 1px 3px rgba(0, 0, 0, .5);
}

.hole {
  position: absolute;
  top: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e2dce6;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, .3);
}

.hole.l { left: 8px; }
.hole.r { right: 8px; }

/* ---------- Song: banner, book, actions, piano ---------- */

#song {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto minmax(0, 1fr) auto;
}

.banner {
  grid-area: 1 / 1 / 2 / -1;
  position: relative;
  color: #fff;
  padding: calc(var(--sat) + 10px) calc(var(--sar) + 14px) 12px calc(var(--sal) + 14px);
  overflow: hidden;
  border-radius: 0 0 24px 24px;
  view-transition-name: banner;
}

.banner-art { position: absolute; inset: 0; }

.banner-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(20, 14, 40, .05), rgba(20, 14, 40, .38));
}

.banner-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Glass buttons over the illustration. */
.banner .round {
  background: rgba(24, 16, 44, .28);
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, .5);
  box-shadow: none;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.banner .round:active { transform: scale(.94); box-shadow: none; }

.banner h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.1;
  text-shadow: 0 1px 4px rgba(0, 0, 0, .45);
  flex: 1;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pop {
  position: fixed;
  z-index: 15;
  width: min(290px, calc(100vw - 24px));
  padding: 14px;
  border-radius: 22px;
  background: var(--paper);
  box-shadow: 0 16px 40px rgba(42, 33, 64, .28);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  transform-origin: top right;
  animation: popIn .18s cubic-bezier(.3, 1.4, .5, 1);
}

@keyframes popIn { from { transform: scale(.85); opacity: 0; } }

.pop-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-weight: 750;
}

.pop .seg { background: #f1eaf4; }
.pop .seg button { color: var(--ink); }
.pop .seg button[aria-pressed="true"] { background: var(--ink); color: #fff; }
.pop .btn { min-height: 44px; font-size: .98rem; width: 100%; }
.pop .micpick select { width: 100%; text-overflow: ellipsis; }
.pop .btn svg { width: 20px; height: 20px; }
.pop hr { width: 100%; margin: 2px 0; border: 0; border-top: 1.5px solid #efe7f2; }

.seg {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .24);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.seg button {
  width: 40px;
  height: 36px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #fff;
  font-size: 1.15rem;
  display: grid;
  place-items: center;
  transition: background .15s;
}

.seg button svg { width: 24px; height: 24px; }
.seg button[aria-pressed="true"] { background: #fff; color: var(--ink); }

.bookwrap {
  grid-area: 2 / 1 / 3 / -1;
  min-height: 0;
  display: flex;
  padding: 16px calc(var(--sar) + 16px) 8px calc(var(--sal) + 20px);
}

.book {
  position: relative;
  flex: 1;
  perspective: 1800px;
  view-transition-name: book;
}

.page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: 26px 14px 24px 18px;
  background: var(--paper);
  border-radius: 14px;
  box-shadow: 0 -3px 0 #efe6dc, 0 -6px 0 #e4d8ca, 0 12px 26px rgba(42, 33, 64, .18);
  transform-origin: 50% 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

/* Ring binding along the top edge, like the punched song cards. */
.page::before {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  top: 7px;
  height: 10px;
  background: radial-gradient(circle, #ddd3e2 3.4px, transparent 4px) 0 0 / 24px 10px repeat-x;
}

.sheet {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* Lines glide in and out softly instead of being cropped. */
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 8px, #000 calc(100% - 26px), transparent);
  mask-image: linear-gradient(180deg, transparent 0, #000 8px, #000 calc(100% - 26px), transparent);
}

/* All lines of the song on one strip that glides up as you play. */
.strip {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  transition: transform .7s cubic-bezier(.45, 0, .2, 1);
}

.strip.instant { transition: none; }
.line { position: absolute; left: 0; right: 0; }
.line svg { position: absolute; left: 0; overflow: visible; }

/* Listening light in the toy's red body, like the real piano's button:
   five dots that light up with what the microphone hears. */
.mic-light {
  position: absolute;
  left: 50%;
  bottom: 6px;
  width: 74px;
  height: 18px;
  padding: 0 8px;
  border: 0;
  border-radius: 99px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #1c6fd1;
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, .35), 0 1px 0 rgba(255, 255, 255, .3);
}

.mic-light::before {
  content: '';
  position: absolute;
  inset: -14px -18px;
}

.mic-light i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, .28);
  transition: background .08s, box-shadow .08s;
}

.mic-light i.lit { background: #eaf6ff; box-shadow: 0 0 6px 1px #8fd0ff; }
.mic-light.off { background: #8d1d23; animation: wake 1.6s ease-in-out infinite; }
.mic-light.off i { background: rgba(255, 255, 255, .22); }

@keyframes wake {
  0%, 100% { box-shadow: inset 0 2px 3px rgba(0, 0, 0, .35), 0 0 0 0 rgba(255, 255, 255, .0); }
  50% { box-shadow: inset 0 2px 3px rgba(0, 0, 0, .35), 0 0 0 4px rgba(255, 255, 255, .35); }
}

/* Staff and notes */
.staff, .ledger { stroke: #3d3352; stroke-opacity: .5; }
.barline { stroke: #3d3352; stroke-opacity: .4; }
.clef { fill: var(--ink); font-family: "Noto Music", "Apple Symbols", "Segoe UI Symbol", serif; }
.n { cursor: pointer; }
.n .b, .n .hd { transform-box: fill-box; transform-origin: center; }
.n .hd { transition: opacity .35s, transform .25s; }
.n.done .hd { opacity: .28; }
.n.cur .b { animation: bob 1.1s ease-in-out infinite; }
.rest { fill: #3d3352; stroke: #3d3352; fill-opacity: .62; stroke-opacity: .62; }
.tsig { font-family: var(--font); font-weight: 800; fill: var(--ink); text-anchor: middle; }
.n.nudge .hd { animation: shake .4s; }
.num { font-family: var(--font); font-weight: 800; fill: #231c33; text-anchor: middle; }
.num.l { fill: #fff; }
.halo { fill: none; stroke-width: 3; opacity: 0; transform-box: fill-box; transform-origin: center; }
.n.cur .halo { animation: halo 1.4s ease-out infinite; }
.spark { pointer-events: none; transform-box: fill-box; transform-origin: center; animation: spark .6s ease-out forwards; }

@keyframes bob {
  0%, 100% { transform: translateY(0) scale(1.14); }
  50% { transform: translateY(-16%) scale(1.14); }
}

@keyframes halo {
  0% { transform: scale(1); opacity: .9; }
  100% { transform: scale(1.9); opacity: 0; }
}

@keyframes spark {
  0% { transform: scale(.4); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-12%); }
  75% { transform: translateX(12%); }
}

/* The toy: red body, wooden board, colourful keys */
.toy {
  grid-area: 3 / 1 / 4 / -1;
  margin: 6px calc(var(--sar) + 10px) calc(var(--sab) + 8px) calc(var(--sal) + 10px);
  position: relative;
  padding: 10px 10px 30px;
  background: var(--toy);
  border-radius: 26px 26px 32px 32px;
  box-shadow: inset 0 -7px 0 var(--toy-dark), inset 0 3px 0 rgba(255, 255, 255, .25), 0 10px 22px rgba(42, 33, 64, .22);
}

.board {
  padding: 12px 10px;
  border-radius: 16px;
  background:
    repeating-linear-gradient(176deg, rgba(160, 110, 50, .06) 0 2px, transparent 2px 9px),
    linear-gradient(180deg, #f8e7c8, var(--wood));
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, .7), inset 0 -4px 0 var(--wood-edge);
}

.keys {
  position: relative;
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 6px;
  height: clamp(100px, 19.5vh, 170px);
}

.key {
  position: relative;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  touch-action: none;
  border: 0;
  padding: 0 0 12%;
  background: var(--c);
  border-radius: 9px 9px 40px 40px / 9px 9px 30px 30px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-shadow: inset 0 -7px 0 rgba(0, 0, 0, .15), 0 3px 0 rgba(90, 60, 20, .25);
  transition: transform .08s, box-shadow .08s, filter .08s;
}

.key .num {
  pointer-events: none;
  width: 1.75em;
  height: 1.75em;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, .88);
  color: var(--ink);
  font-size: clamp(1.05rem, 4.6vw, 1.6rem);
  font-weight: 800;
}

.key.down, .key.heard {
  transform: translateY(4px);
  box-shadow: inset 0 -2px 0 rgba(0, 0, 0, .15), 0 0 0 rgba(0, 0, 0, 0);
  filter: brightness(1.1) saturate(1.1);
}

.key.heard::after {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: inherit;
  box-shadow: 0 0 0 3px #fff, 0 0 20px 6px var(--c);
}

.key.next .num { background: #fff; box-shadow: 0 0 0 4px var(--ink); animation: nudgeUp 1s ease-in-out infinite; }
.key.wrong { animation: shake .35s; }

@keyframes nudgeUp {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}

.black {
  position: absolute;
  top: -2px;
  width: 7.5%;
  height: 44%;
  background: #231c33;
  border-radius: 6px 6px 12px 12px;
  transform: translateX(-50%);
  box-shadow: inset 0 -5px 0 #000, inset 0 2px 0 rgba(255, 255, 255, .12);
  pointer-events: none;
}

.keys.mini { height: 70px; gap: 4px; }
.keys.mini .key { padding-bottom: 8%; border-radius: 6px 6px 20px 20px / 6px 6px 16px 16px; }
.keys.mini .num { font-size: .82rem; }
.keys.mini .black { height: 40%; }
.keys.mini .key.aim { box-shadow: 0 0 0 3px var(--ink); }

.hzrow {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 4px;
  margin-top: 6px;
  font-size: .72rem;
  font-weight: 700;
  text-align: center;
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}

.hzrow .got { color: var(--ink); }

/* ---------- Tuning wizard ---------- */

#tune {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.tune-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(var(--sat) + 12px) calc(var(--sar) + 16px) 8px calc(var(--sal) + 16px);
}

.tune-head h2 { margin: 0; font-size: 1.35rem; font-weight: 800; white-space: nowrap; }
#tune.listening .tune-head h2 { display: none; }

.tdots { margin-left: auto; display: flex; gap: 6px; }

.tdots i {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: 3px solid var(--c);
  transition: transform .2s, background .2s;
}

.tdots i.got { background: var(--c); }
.tdots i.at { transform: scale(1.4); }

.tview {
  min-height: 0;
  overflow-y: auto;
  padding: 8px calc(var(--sar) + 16px) calc(var(--sab) + 18px) calc(var(--sal) + 16px);
}

.intro { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center; }
.intro p { margin: 0; font-size: 1.1rem; font-weight: 650; max-width: 22em; }
.voices { display: flex; gap: 14px; }

.vbig {
  width: 136px;
  padding: 16px 10px 14px;
  border: 3px solid transparent;
  border-radius: 22px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-weight: 750;
  box-shadow: 0 4px 0 rgba(42, 33, 64, .14);
}

.vbig[aria-pressed="true"] { border-color: var(--ink); }

.badge {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
}

.badge svg { width: 38px; height: 38px; }
.badge.piano { background: #84ca2b; }
.badge.xylo { background: #17a5b1; }

.linkish {
  border: 0;
  background: none;
  color: var(--ink-soft);
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 3px;
  padding: 8px;
}

.live-view {
  display: grid;
  gap: 14px;
  align-content: start;
}

.tmain { display: flex; flex-direction: column; align-items: center; gap: 6px; }

.target {
  position: relative;
  width: 148px;
  height: 148px;
  display: grid;
  place-items: center;
}

.target > svg { position: absolute; inset: 0; transform: rotate(-90deg); }
.target .track { stroke: rgba(42, 33, 64, .1); }
.target .ring { stroke: var(--c); transition: stroke-dashoffset .08s linear; }

.tdot {
  width: 106px;
  height: 106px;
  border-radius: 50%;
  background: var(--c);
  display: grid;
  place-items: center;
  font-size: 3.2rem;
  font-weight: 800;
  color: #231c33;
  box-shadow: inset 0 -7px 0 rgba(0, 0, 0, .15);
}

.tdot.l { color: #fff; }
.target.got .tdot { animation: pop .5s; }

.target .check {
  position: absolute;
  right: 4px;
  bottom: 8px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #269b61;
  color: #fff;
  display: grid;
  place-items: center;
  transform: scale(0);
  transition: transform .25s cubic-bezier(.3, 1.6, .5, 1);
}

.target.got .check { transform: scale(1); }

@keyframes pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.18); }
  100% { transform: scale(1); }
}

.prompt { margin: 0; font-size: 1.6rem; font-weight: 800; text-align: center; }
.msg { margin: 0; min-height: 1.4em; font-weight: 700; color: var(--toy-dark); text-align: center; }
.tmain .keys.mini, .tmain .hzrow { width: 100%; max-width: 420px; }

.live {
  background: #fff;
  border-radius: 20px;
  padding: 10px;
  box-shadow: 0 4px 0 rgba(42, 33, 64, .1);
}

#trace {
  width: 100%;
  height: 150px;
  display: block;
  border-radius: 12px;
  background: #faf6fd;
}

.readout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.chip {
  padding: 5px 12px;
  border-radius: 999px;
  background: var(--c, #efe8f3);
  color: #231c33;
  min-width: 4.5em;
  text-align: center;
}

.chip.l { color: #fff; }

.meter {
  height: 9px;
  margin-top: 8px;
  border-radius: 99px;
  background: #efe8f3;
  overflow: hidden;
}

.meter i {
  display: block;
  height: 100%;
  width: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #84ca2b, #ffd11e 70%, #ed1747);
}

.tnav { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

/* ---------- Overlays ---------- */

.sheet-bg {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(42, 33, 64, .35);
  animation: fade .2s;
}

.sheet-card {
  width: min(340px, 100%);
  padding: 24px 20px 20px;
  border-radius: 26px;
  background: var(--paper);
  text-align: center;
  box-shadow: 0 20px 50px rgba(42, 33, 64, .3);
  animation: rise .3s cubic-bezier(.3, 1.4, .5, 1);
}

.sheet-card p { margin: 0 0 18px; font-size: 1.2rem; font-weight: 750; }
.sheet-card .big { font-size: 3.4rem; line-height: 1; margin-bottom: 10px; }
.sheet-card .row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

.next-card {
  width: 100%;
  margin-bottom: 14px;
  padding: 0;
  border: 3px solid #231c33;
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 96px 1fr auto;
  align-items: center;
  gap: 12px;
  background: #fff;
  text-align: left;
  font-weight: 750;
  box-shadow: 0 4px 0 rgba(42, 33, 64, .18);
}

.next-card .art { position: relative; height: 64px; }
.next-card .art svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.next-card .go { width: 36px; height: 36px; margin-right: 12px; border-radius: 50%; background: var(--ink); color: #fff; display: grid; place-items: center; }
.next-card .go svg { width: 18px; height: 18px; }

@keyframes fade { from { opacity: 0; } }
@keyframes rise { from { transform: translateY(30px) scale(.9); opacity: 0; } }

.toast {
  position: fixed;
  left: 50%;
  bottom: calc(var(--sab) + 24px);
  z-index: 30;
  max-width: calc(100% - 32px);
  padding: 12px 18px;
  border-radius: 16px;
  background: var(--ink);
  color: #fff;
  font-weight: 650;
  transform: translateX(-50%);
  animation: rise .25s;
}

.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 25; overflow: hidden; }

.confetti i {
  position: absolute;
  top: -20px;
  left: var(--x);
  width: 10px;
  height: 15px;
  border-radius: 3px;
  background: var(--c);
  animation: fall var(--d) cubic-bezier(.3, .2, .6, 1) var(--w) forwards;
}

@keyframes fall { to { transform: translate(var(--dx), 110vh) rotate(var(--r)); } }

::view-transition-group(*) { animation-duration: .42s; animation-timing-function: cubic-bezier(.3, .1, .3, 1); }

/* ---------- Landscape phones ---------- */

@media (orientation: landscape) and (max-height: 540px) {

  .banner {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 8px calc(var(--sar) + 14px) 8px calc(var(--sal) + 14px);
    border-radius: 0 0 20px 20px;
  }

  .banner-row { flex: 1; min-width: 0; }
  .banner h2 { font-size: 1.2rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .seg button { width: 36px; height: 32px; }
  .round { width: 38px; height: 38px; }

  .bookwrap { grid-area: 2 / 1 / 3 / -1; padding: 12px calc(var(--sar) + 16px) 6px calc(var(--sal) + 16px); }
  .page { padding: 22px 14px 18px 16px; }
  .toy { grid-area: 3 / 1 / 4 / -1; padding: 7px 8px 26px; border-radius: 20px 20px 24px 24px; }
  .mic-light { bottom: 4px; }
  .board { padding: 8px; }
  .keys { height: clamp(72px, 24vh, 112px); }
  .key .num { font-size: 1.15rem; }

  .live-view { grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); align-items: start; }
  .target { width: 112px; height: 112px; }
  .tdot { width: 80px; height: 80px; font-size: 2.4rem; }
  .prompt { font-size: 1.3rem; }
  #trace { height: 112px; }
  .tune-head { padding-top: 8px; }
  .home-head { padding-top: 12px; }
  .shelf { grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); }
}

/* ---------- Print: four A6 song cards on each A4 sheet ---------- */

.home-foot {
  display: flex;
  justify-content: center;
  padding: 4px 18px 34px;
}

.sheet-card.pick {
  width: min(400px, 100%);
  max-height: min(680px, calc(100dvh - 40px - var(--sat) - var(--sab)));
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 16px 16px;
}

.pick-head { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; }
.pick-head p { margin: 0; }

.chip {
  min-height: 34px;
  padding: 0 14px;
  border: 2px solid #e6dcea;
  border-radius: 999px;
  background: #fff;
  font-weight: 700;
  font-size: .9rem;
}

.pick-list {
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: grid;
  gap: 8px;
  padding: 2px;
  text-align: left;
}

.pick-row {
  position: relative;
  display: grid;
  grid-template-columns: 64px 1fr 28px;
  align-items: center;
  gap: 12px;
  padding: 6px 10px 6px 6px;
  border: 2.5px solid #eee4ef;
  border-radius: 16px;
  background: #fff;
  font-weight: 700;
  line-height: 1.15;
  cursor: pointer;
  transition: border-color .15s;
}

.pick-row input { position: absolute; opacity: 0; pointer-events: none; }
.pick-row .art { position: relative; height: 42px; border-radius: 10px; overflow: hidden; }
.pick-row .art svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pick-row .tick {
  width: 28px;
  height: 28px;
  border: 2.5px solid #d9cfe0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  transition: background .15s, border-color .15s, transform .2s cubic-bezier(.3, 1.6, .5, 1);
}
.pick-row .tick svg { width: 16px; height: 16px; opacity: 0; }
.pick-row:has(input:checked) { border-color: var(--ink); }
.pick-row input:checked ~ .tick { background: var(--ink); border-color: var(--ink); transform: scale(1.08); }
.pick-row input:checked ~ .tick svg { opacity: 1; }
.pick-row:has(input:focus-visible) { outline: 3px solid var(--ink); outline-offset: 2px; }

.pick-info { color: #6b6080; font-weight: 600; }
#pickGo:disabled { opacity: .4; }

#printArea { display: none; }

.pp {
  position: relative;
  width: 100%;
  height: min(297mm, 100vh);
  overflow: hidden;
  display: grid;
  grid-template: repeat(2, minmax(0, 1fr)) / repeat(2, minmax(0, 1fr));
  break-inside: avoid;
  break-after: page;
  page-break-after: always;
}
.pp:last-child { break-after: auto; page-break-after: auto; }
/* Cut lines */
.pp::before, .pp::after { content: ''; position: absolute; border: 0 dashed #c9c0d3; }
.pp::before { left: 50%; top: 0; bottom: 0; border-left-width: .3mm; }
.pp::after { top: 50%; left: 0; right: 0; border-top-width: .3mm; }

.pc {
  min-width: 0;
  min-height: 0;
  padding: 6.5mm;
  display: flex;
  flex-direction: column;
  gap: 3.5mm;
}

.pc-art {
  position: relative;
  flex: none;
  height: 38mm;
  border: .8mm solid #231c33;
  border-radius: 4mm;
  overflow: hidden;
}
.pc-art svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.pc-art::after { content: ''; position: absolute; inset: 45% 0 0; background: linear-gradient(180deg, transparent, rgba(20, 14, 40, .55)); }
.pc-art span {
  position: absolute;
  z-index: 1;
  left: 3mm;
  right: 3mm;
  bottom: 2.4mm;
  color: #fff;
  font-weight: 750;
  font-size: 15pt;
  line-height: 1.1;
  text-shadow: 0 .3mm 1mm rgba(0, 0, 0, .5);
}

.pc-music { position: relative; flex: 1; min-height: 0; }
.pc-music > svg { position: absolute; inset: 0; width: 100%; height: 100%; }

.pc-keys { flex: none; display: grid; grid-template-columns: repeat(8, 1fr); gap: 1.2mm; }
.pc-keys i {
  height: 6.5mm;
  border-radius: 1.5mm;
  display: grid;
  place-items: center;
  font-style: normal;
  font-weight: 800;
  font-size: 9pt;
}

@page { size: A4 portrait; margin: 0; }

@media print {
  html, body { height: auto; background: #fff; }
  body > :not(#printArea) { display: none !important; }
  #printArea { display: block; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

const BODY = String.raw`
<section id="home" class="screen">
  <header class="home-head">
    <h1>Little Piano</h1>
    <button id="tuneBtn" class="btn tune-btn">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 3v7a3 3 0 0 0 6 0V3M12 13v8M9 21h6"/></svg>
      Tune
      <span class="dot" hidden></span>
    </button>
  </header>
  <div id="shelf" class="shelf"></div>
  <div class="home-foot"><button id="printBtn" class="btn"></button></div>
</section>

<section id="song" class="screen" hidden>
  <header class="banner">
    <div id="bannerArt" class="banner-art"></div>
    <div class="banner-row">
      <button id="back" class="round" aria-label="All songs">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <h2 id="songTitle"></h2>
      <button id="restart" class="round" aria-label="Start over">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg>
      </button>
      <button id="gear" class="round" aria-label="Settings" aria-expanded="false">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.4"/><circle cx="9" cy="17" r="2.4"/></svg>
      </button>
    </div>
  </header>

  <div id="pop" class="pop" hidden>
    <div class="pop-row">
      <span>Sound</span>
      <div class="seg" role="group" aria-label="Piano sound">
        <button data-voice="piano" aria-label="Piano sound"></button>
        <button data-voice="xylo" aria-label="Xylophone sound"></button>
      </div>
    </div>
    <div class="pop-row">
      <span>Speed</span>
      <div class="seg" role="group" aria-label="Speed">
        <button data-tempo="60" aria-label="Slow">🐢</button>
        <button data-tempo="88" aria-label="Medium">🐥</button>
        <button data-tempo="120" aria-label="Fast">🐇</button>
      </div>
    </div>
    <label class="micpick" hidden></label>
    <hr>
    <button id="listen" class="btn"></button>
    <button id="popTune" class="btn">Tune to your piano</button>
  </div>

  <div class="bookwrap">
    <div id="book" class="book">
      <div id="page" class="page">
        <div id="sheet" class="sheet"><div id="strip" class="strip"></div></div>
      </div>
    </div>
  </div>

  <div class="toy">
    <div class="board"><div id="keys" class="keys"></div></div>
    <button id="along" class="mic-light off" aria-label="Play along"><i></i><i></i><i></i><i></i><i></i></button>
  </div>
</section>

<section id="tune" class="screen" hidden>
  <header class="tune-head">
    <button id="tuneClose" class="round" aria-label="Close">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <h2>Tune to your piano</h2>
    <div id="tdots" class="tdots"></div>
  </header>

  <div id="tuneIntro" class="tview intro">
    <p>Pick the sound on your piano, then let the app listen to each key.</p>
    <div class="voices">
      <button class="vbig" data-tvoice="piano"><span class="badge piano"></span>Piano</button>
      <button class="vbig" data-tvoice="xylo"><span class="badge xylo"></span>Xylophone</button>
    </div>
    <button id="tuneStart" class="btn primary">Start listening</button>
    <button id="tuneReset" class="linkish" hidden>Forget this tuning</button>
  </div>

  <div id="tuneLive" class="tview live-view" hidden>
    <div class="tmain">
      <div id="target" class="target">
        <svg viewBox="0 0 148 148"><circle class="track" cx="74" cy="74" r="66" fill="none" stroke-width="10"/><circle id="ring" class="ring" cx="74" cy="74" r="66" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="414.7" stroke-dashoffset="414.7"/></svg>
        <div id="tdot" class="tdot"></div>
        <div class="check"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      </div>
      <p id="prompt" class="prompt"></p>
      <p id="tmsg" class="msg"></p>
      <div id="miniKeys" class="keys mini"></div>
      <div id="hzRow" class="hzrow"></div>
    </div>
    <div class="tside">
      <div class="live">
        <canvas id="trace"></canvas>
        <div class="readout"><span id="hzOut">Listening…</span><span id="keyOut" class="chip">–</span></div>
        <div class="meter"><i id="meter"></i></div>
      </div>
      <label class="micpick" hidden style="margin-top:12px"></label>
      <div id="tnav" class="tnav" style="margin-top:14px"></div>
    </div>
  </div>
</section>

<div id="ask" class="sheet-bg" hidden>
  <div class="sheet-card">
    <p>Tune the app to your piano first?</p>
    <div class="row">
      <button id="askTune" class="btn primary">Tune now</button>
      <button id="askSkip" class="btn">Not now</button>
    </div>
  </div>
</div>

<div id="yay" class="sheet-bg" hidden>
  <div class="sheet-card">
    <div class="big">🎉</div>
    <p>Well played!</p>
    <button id="nextSong" class="next-card"></button>
    <div class="row">
      <button id="again" class="btn">Play again</button>
      <button id="yayClose" class="btn">All songs</button>
    </div>
  </div>
</div>

<div id="printPick" class="sheet-bg" hidden>
  <div class="sheet-card pick">
    <div class="pick-head">
      <p>Print song cards</p>
      <button id="pickAll" class="chip"></button>
    </div>
    <div id="pickList" class="pick-list"></div>
    <small id="pickInfo" class="pick-info"></small>
    <div class="row">
      <button id="pickClose" class="btn">Close</button>
      <button id="pickGo" class="btn primary"></button>
    </div>
  </div>
</div>

<div id="printArea" aria-hidden="true"></div>
`;

// Runs in the browser. It is serialised with Function#toString, never executed by the Worker.
function client() {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const cents = (a, b) => 1200 * Math.log2(a / b);
  const median = list => list.slice().sort((a, b) => a - b)[list.length >> 1];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Debug mode sends analysis frames to the Worker log: on test tunnels or with ?debug.
  const DEBUG = /trycloudflare\.com$/.test(location.hostname) || /[?&]debug\b/.test(location.search);
  const logQueue = [];
  let logTimer = 0;
  function dlog(line) {
    if (!DEBUG) return;
    logQueue.push((performance.now() / 1000).toFixed(2) + ' ' + line);
    if (!logTimer) logTimer = setTimeout(flushLog, 500);
  }
  function flushLog() {
    logTimer = 0;
    if (!logQueue.length) return;
    fetch('/log', { method: 'POST', body: logQueue.splice(0).join('\n'), keepalive: true }).catch(() => {});
  }

  const COLORS = ['#ed1747', '#ff8819', '#ffd11e', '#84ca2b', '#17a5b1', '#1974c5', '#ef82b2', '#e60057'];
  const LIGHT = [true, false, false, false, false, true, false, true];
  const DEFAULT = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25];
  const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const CLEF = '\u{1D11E}';

  const ICONS = {
    piano: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v14M12 5v14M16 5v14"/><path d="M6.5 5h3v7h-3zM14.5 5h3v7h-3z" fill="currentColor"/></svg>',
    xylo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7v10M8 6v12M12 5v14M16 6v12M20 7v10"/><path d="M15 3l4 4M9 3L5 7" stroke-width="1.8"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    stop: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h4l5 4v-13l-5 4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
    printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M7 8V3.5h10V8"/><rect x="3" y="8" width="18" height="9" rx="2.5"/><rect x="7" y="13.5" width="10" height="7" rx="1" fill="#fff"/><circle cx="17.5" cy="11" r="1" fill="currentColor" stroke="none"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  // ---------- Storage (must never block the app) ----------

  const store = {
    get(key, fallback) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
      } catch (_) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  const validFreqs = list => Array.isArray(list) && list.length === 8 &&
    list.every(n => Number.isFinite(n) && n >= 80 && n <= 2500);

  const prefs = Object.assign({ voice: 'piano', tempo: 88, mic: '' }, store.get('lp-prefs', {}));
  const cal = Object.assign({ piano: null, xylo: null }, store.get('lp-cal-v3', {}));

  if (!['piano', 'xylo'].includes(prefs.voice)) prefs.voice = 'piano';
  if (!validFreqs(cal.piano)) cal.piano = null;
  if (!validFreqs(cal.xylo)) cal.xylo = null;

  if (!cal.piano) {
    const legacy = store.get('little-piano-calibration-v2', null);
    if (validFreqs(legacy)) cal.piano = legacy;
  }

  const savePrefs = () => store.set('lp-prefs', prefs);
  const saveCal = () => store.set('lp-cal-v3', cal);
  const freqsFor = voice => cal[voice] || cal.piano || DEFAULT;

  // ---------- Songs ----------
  // Format: key:beats. A missing duration means one beat. | is a barline.

  const SONGS = [
    { id: 'scales', title: 'Rainbow Scales', time: '3/4', notes: '1 2 3 | 4 5 6 | 7 8:2 | 8 7 6 | 5 4 3 | 2 1:2' },
    { id: 'bouncy', title: 'Bouncy Ball', time: '4/4', notes: '1:1.5 5:.5 1:1.5 5:.5 | 2:1.5 6:.5 2:1.5 6:.5 | 3:1.5 7:.5 3:1.5 7:.5 | 4 8 4 r | 8 4 7 3 | 6 2 5 1 | 3 5 3 2 | 1:2 r:2' },
    { id: 'rain', title: 'Raindrops', time: '4/4', notes: '8 8 7 7 | 6 6 5 r | 5 5 4 4 | 3 3 2 r | 1 3 5 8 | 7:1.5 5:.5 6 r | 5 4 3 2 | 1:3 r' },
    { id: 'buns', title: 'Hot Cross Buns', time: '4/4', notes: '3 2 1:2 | 3 2 1:2 | 1:.5 1:.5 1:.5 1:.5 2:.5 2:.5 2:.5 2:.5 | 3 2 1:2' },
    { id: 'lamb', title: 'Mary Had a Little Lamb', time: '4/4', notes: '3 2 1 2 | 3 3 3:2 | 2 2 2:2 | 3 5 5:2 | 3 2 1 2 | 3 3 3 3 | 2 2 3 2 | 1:4' },
    { id: 'twinkle', title: 'Twinkle Twinkle', time: '4/4', notes: '1 1 5 5 | 6 6 5:2 | 4 4 3 3 | 2 2 1:2 | 5 5 4 4 | 3 3 2:2 | 5 5 4 4 | 3 3 2:2 | 1 1 5 5 | 6 6 5:2 | 4 4 3 3 | 2 2 1:2' },
    { id: 'ducks', title: 'Alle eendjes', time: '4/4', notes: '4 4 5 5 | 8:.5 8:.5 8:.5 6:.5 6 5 | 4:.5 5:.5 4:.5 3:.5 2 1 | 4:.5 5:.5 4:.5 3:.5 2 1 | 4 4 5 5 | 8:.5 8:.5 8:.5 6:.5 6 5 | 2:2 3:2 | 4:.5 6:.5 8:.5 6:.5 4:2' },
    { id: 'jacob', title: 'Vader Jacob', time: '4/4', notes: '1 2 3 1 | 1 2 3 1 | 3 4 5:2 | 3 4 5:2 | 5:.5 6:.5 5:.5 4:.5 3 1 | 5:.5 6:.5 5:.5 4:.5 3 1 | 1 5 1:2 | 1 5 1:2' },
    { id: 'maneschijn', title: 'In de maneschijn', time: '4/4', notes: '4 4 4 5 | 6:2 5:2 | 4 6 5 5 | 4:4 | 4 4 4 5 | 6:2 5:2 | 4 6 5 5 | 4:4 | 5 5 5 5 | 2:2 2:2 | 5 4 3 2 | 1:4 | 4 4 4 5 | 6:2 5:2 | 4 6 5 5 | 4:4' },
    { id: 'lightly', title: 'Lightly Row', time: '4/4', notes: '5 3 3:2 | 4 2 2:2 | 1 2 3 4 | 5 5 5:2 | 5 3 3:2 | 4 2 2:2 | 1 3 5 5 | 1:2 r:2 | 2 2 2 2 | 2 3 4:2 | 3 3 3 3 | 3 4 5:2 | 5 3 3:2 | 4 2 2:2 | 1 3 5 5 | 1:4' },
    { id: 'farm', title: 'Old MacDonald', time: '4/4', notes: '4 4 4 1 | 2 2 1:2 | 6 6 5 5 | 4:3 1 | 4 4 4 1 | 2 2 1:2 | 6 6 5 5 | 4:3 1:.5 1:.5 | 4 4 4 1:.5 1:.5 | 4 4 4:2 | 4:.5 4:.5 4 4:.5 4:.5 4 | 4:.5 4:.5 4:.5 4:.5 4 4 | 4 4 4 1 | 2 2 1:2 | 6 6 5 5 | 4:4' },
    { id: 'oldman', title: 'This Old Man', time: '4/4', notes: '5 3 5:2 | 5 3 5:2 | 6 5 4 3 | 2 3 4 3:.5 4:.5 | 5 1 1:.5 1:.5 1 | 1:.5 2:.5 3:.5 4:.5 5:2 | 5 2 2 4 | 3 2 1:2' },
    { id: 'wheels', title: 'Wheels on the Bus', time: '4/4', notes: '1 | 4 4:.5 4:.5 4 6 | 8 6 4:2 | 5 3 1:2 | 8 6 4 1 | 4 4:.5 4:.5 4 6 | 8 6 4:2 | 5:2 1 1 | 4:2 r' },
    { id: 'bridge', title: 'London Bridge', time: '4/4', notes: '5:1.5 6:.5 5 4 | 3 4 5:2 | 2 3 4:2 | 3 4 5:2 | 5:1.5 6:.5 5 4 | 3 4 5:2 | 2:2 5:2 | 3 1:3' },
    { id: 'boat', title: 'Row Your Boat', time: '6/8', notes: '1:1.5 1:1.5 | 1 2:.5 3:1.5 | 3 2:.5 3 4:.5 | 5:3 | 8:.5 8:.5 8:.5 5:.5 5:.5 5:.5 | 3:.5 3:.5 3:.5 1:.5 1:.5 1:.5 | 5 4:.5 3 2:.5 | 1:3' },
    { id: 'kumbaya', title: 'Kumbaya', time: '4/4', notes: 'r:2 1 3 | 5:1.5 5:.5 5:2 | r:2 6 6 | 5:4 | r:2 1 3 | 5:1.5 5:.5 5:2 | r:2 4 3 | 2:4 | r:2 1 3 | 5:1.5 5:.5 5:2 | r:2 6 6 | 5:4 | r:2 4:2 | 3 1:3 | r:2 2 2 | 1:4' },
    { id: 'michael', title: 'Michael, Row the Boat Ashore', time: '4/4', notes: '1 3 | 5:1.5 3:.5 5 6 | 5:2 3 5 | 6:4 | 5:2 3 5 | 5:1.5 3:.5 4 3 | 2:2 1 2 | 3:2 2:2 | 1:2' },
    { id: 'saints', title: 'When the Saints', time: '4/4', notes: 'r 1 3 4 | 5:4 | r 1 3 4 | 5:4 | r 1 3 4 | 5:2 3:2 | 1:2 3:2 | 2:4 | r 3 3 2 | 1:3 1 | 3:2 5:2 | 5 4:3 | r:2 3 4 | 5:2 3:2 | 1:2 2:2 | 1:4' },
    { id: 'jingle', title: 'Jingle Bells', time: '4/4', notes: '3 3 3:2 | 3 3 3:2 | 3 5 1:1.5 2:.5 | 3:4 | 4 4 4:1.5 4:.5 | 4 3 3 3:.5 3:.5 | 3 2 2 3 | 2:2 5:2 | 3 3 3:2 | 3 3 3:2 | 3 5 1:1.5 2:.5 | 3:4 | 4 4 4:1.5 4:.5 | 4 3 3 3:.5 3:.5 | 5 5 4 2 | 1:4' },
    { id: 'joy', title: 'Joy to the World', time: '4/4', notes: '8:2 7:1.5 6:.5 | 5:3 4 | 3:2 2:2 | 1:3 5 | 6:3 6 | 7:3 7 | 8:4 | r:3 8 | 8 7 6 5 | 5:1.5 4:.5 3 8 | 8 7 6 5 | 5:1.5 4:.5 3 3 | 3 3 3 3:.5 4:.5 | 5:3 4:.5 3:.5 | 2 2 2 2:.5 3:.5 | 4:3 3:.5 2:.5 | 1 8:2 6 | 5:1.5 4:.5 3 4 | 3:2 2:2 | 1:4' },
    { id: 'ode', title: 'Ode to Joy', time: '4/4', notes: '3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3:1.5 2:.5 2:2 | 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2:1.5 1:.5 1:2 | 2 2 3 1 | 2 3:.5 4:.5 3 1 | 2 3:.5 4:.5 3 2 | 1 2 5:2 | 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2:1.5 1:.5 1:2 | 2 2 3 1 | 2 3:.5 4:.5 3 1 | 2 3:.5 4:.5 3 2 | 1 2 5:2 | 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2:1.5 1:.5 1:2' },
    { id: 'lullaby', title: 'Brahms’ Lullaby', time: '3/4', notes: '3:.5 3:.5 | 5:1.5 3:.5 3 | 5 r 3:.5 5:.5 | 8 7:1.5 6:.5 | 6 5 2:.5 3:.5 | 4 2 2:.5 3:.5 | 4 r 2:.5 4:.5 | 7:.5 6:.5 5 7 | 8 r 1:.5 1:.5 | 8:2 6:.5 4:.5 | 5:2 3:.5 1:.5 | 4 5 6 | 5:2 1:.5 1:.5 | 8:2 6:.5 4:.5 | 5:2 3:.5 1:.5 | 4 3 2 | 1:2' },
    { id: 'moon', title: 'Sleepy Moon', time: '4/4', notes: '5:2 4 3 | 2:2 3:2 | 4:2 3 2 | 1:3 r | 3:2 4 5 | 6:2 5:2 | 4:2 3 2 | 1:3 r | 5:1.5 6:.5 5:2 | 4:2 3:2 | 2:2 3 4 | 3:3 r | 5:2 4 3 | 2:2 3:2 | 2:2 1:2 | 1:3 r' },
    { id: 'walk', title: 'Morning Walk', time: '4/4', notes: '1 2 3 5 | 4 3 2 r | 3 4 5 6 | 5 3 4 r | 5 6 7 8 | 7 6 5 r | 4:1.5 5:.5 3 2 | 1:3 r | 1:1.5 3:.5 5:1.5 3:.5 | 2 4 6 r | 5 4 3 2 | 3 2 1 r' }
  ];

  // 'key:beats' in quarter-note beats ('r' is a rest), '|' between bars.
  // song.flat holds only the notes to play; bars keep the rests too.
  SONGS.forEach(song => {
    song.time = song.time || '4/4';
    song.meter = { '2/4': 2, '3/4': 3, '6/8': 3 }[song.time] || 4;
    song.flat = [];
    song.bars = song.notes.split('|').map((bar, barIndex) => {
      let at = 0;
      return bar.trim().split(/\s+/).map(token => {
        const [key, beats = '1'] = token.split(':');
        const note = { key: key === 'r' ? 0 : Number(key), beats: Number(beats), bar: barIndex, at };
        at += note.beats;
        if (note.key) {
          note.i = song.flat.length;
          song.flat.push(note);
        }
        return note;
      });
    });
    // A pickup bar ends on the downbeat, so shift its beat positions.
    const pickup = song.bars[0].reduce((sum, n) => sum + n.beats, 0);
    if (pickup < song.meter) song.bars[0].forEach(n => { n.at += song.meter - pickup; });
  });

  // How hard each note is played: the first beat of a bar leans in a little,
  // off-beats are lighter, like a person playing.
  function accent(sg, n) {
    if (n.at === 0) return 1;
    const strong = sg.time === '6/8' ? n.at === 1.5 : Number.isInteger(n.at);
    return strong ? .84 : .72;
  }

  // Start time and length (seconds) of every note from the song start,
  // counting rests, slowing down gently into the last note. Repeated keys
  // are let go a bit earlier so they sound as separate notes.
  function timeline(sg, beat) {
    const at = [];
    const last = sg.flat.length - 1;
    let t = 0;
    sg.bars.flat().forEach(n => {
      const slow = n.key && n.i >= last - 1 ? (n.i === last ? 1.3 : 1.12) : 1;
      const len = n.beats * beat * slow;
      if (n.key) {
        const next = sg.flat[n.i + 1];
        const legato = next && next.key === n.key ? .78 : .94;
        at[n.i] = { t, dur: len * legato, vel: accent(sg, n) };
      }
      t += len;
    });
    return { at, end: t };
  }

  // ---------- Card illustrations (300 × 150) ----------

  const bg = c => `<rect width="300" height="150" fill="${c}"/>`;

  const cloud = (x, y, k = 1) =>
    `<g fill="#fff" transform="translate(${x} ${y}) scale(${k})"><circle cx="-14" cy="0" r="10"/><circle cx="0" cy="-6" r="13"/><circle cx="15" cy="0" r="10"/><rect x="-24" y="0" width="48" height="10" rx="5"/></g>`;

  const star = (x, y, r, fill = '#ffd11e') => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 5 * i - Math.PI / 2;
      const rr = i % 2 ? r * .46 : r;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1);
    }
    return `<path d="${d}Z" fill="${fill}" stroke="${fill}" stroke-width="${(r * .22).toFixed(1)}" stroke-linejoin="round"/>`;
  };

  const sun = (x, y, r) => {
    let rays = '';
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 5 * i;
      rays += `M${(x + Math.cos(a) * r * 1.3).toFixed(1)} ${(y + Math.sin(a) * r * 1.3).toFixed(1)}L${(x + Math.cos(a) * r * 1.65).toFixed(1)} ${(y + Math.sin(a) * r * 1.65).toFixed(1)}`;
    }
    return `<path d="${rays}" stroke="#ffd11e" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd11e"/>`;
  };

  const sleepyFace = (x, y, k = 1) =>
    `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="#2a2140" stroke-width="3" stroke-linecap="round"><path d="M-14 -2q5 5 10 0M4 -2q5 5 10 0M-5 9q5 4 10 0"/><circle cx="-18" cy="6" r="4" fill="#ef82b2" stroke="none" opacity=".5"/><circle cx="18" cy="6" r="4" fill="#ef82b2" stroke="none" opacity=".5"/></g>`;

  const tree = (x, y, k = 1, c = '#5fae2e') =>
    `<rect x="${x - 3 * k}" y="${y}" width="${6 * k}" height="${22 * k}" rx="${2 * k}" fill="#8a5a33"/><circle cx="${x}" cy="${y - 4 * k}" r="${18 * k}" fill="${c}"/>`;

  const pine = (x, y, k = 1) =>
    `<path d="M${x} ${y - 42 * k}L${x + 17 * k} ${y - 12 * k}H${x - 17 * k}ZM${x} ${y - 28 * k}L${x + 23 * k} ${y + 6 * k}H${x - 23 * k}Z" fill="#2f8f4e"/><path d="M${x} ${y - 42 * k}L${x + 7 * k} ${y - 30 * k}H${x - 7 * k}Z" fill="#fff"/><rect x="${x - 3 * k}" y="${y + 6 * k}" width="${6 * k}" height="${8 * k}" fill="#7a4b2a"/>`;

  const flowers = list => list.map(([x, y, c]) =>
    `<g fill="${c}"><circle cx="${x - 3}" cy="${y}" r="3"/><circle cx="${x + 3}" cy="${y}" r="3"/><circle cx="${x}" cy="${y - 3}" r="3"/><circle cx="${x}" cy="${y + 3}" r="3"/></g><circle cx="${x}" cy="${y}" r="2" fill="#fff6c2"/>`
  ).join('');

  const duck = (x, y, k) =>
    `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-24 0Q-26-14-12-12L10-12Q24-12 24 0Q20 14 0 14Q-20 14-24 0Z" fill="#ffd11e"/><path d="M-23-2L-32-13L-19-8Z" fill="#ffd11e"/><circle cx="14" cy="-20" r="10" fill="#ffd11e"/><path d="M22-22L33-18L22-15Z" fill="#ff8819"/><circle cx="17" cy="-23" r="2" fill="#2a2140"/><path d="M-12-2Q0 6 10-2" stroke="#e8b400" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;

  const bell = (x, y, rot) =>
    `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-15 8Q-15-15 0-17Q15-15 15 8L19 13H-19Z" fill="#ffd11e"/><circle cy="16" r="4.5" fill="#e8b400"/><path d="M-8-6q2-6 7-7" stroke="#fff3a6" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;

  const burst = (x, y, r, c) => {
    let d = '';
    let dots = '';
    for (let i = 0; i < 12; i++) {
      const a = Math.PI / 6 * i;
      d += `M${(x + Math.cos(a) * r * .35).toFixed(1)} ${(y + Math.sin(a) * r * .35).toFixed(1)}L${(x + Math.cos(a) * r * .85).toFixed(1)} ${(y + Math.sin(a) * r * .85).toFixed(1)}`;
      dots += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="2.4"/>`;
    }
    return `<path d="${d}" stroke="${c}" stroke-width="3" stroke-linecap="round"/><g fill="${c}">${dots}</g>`;
  };

  const sprinkle = (n, seed, maxY, fill, rMax) => {
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = (i * 53 + seed * 17) % 300;
      const y = (i * 37 + seed * 11) % maxY + 4;
      out += `<circle cx="${x}" cy="${y}" r="${1.2 + (i % 3) * rMax / 3}" fill="${fill}"/>`;
    }
    return out;
  };

  const SCENES = {
    scales: () => bg('#bfe6ff') +
      COLORS.map((c, i) => {
        const r = 124 - i * 10;
        return `<path d="M${150 - r} 152A${r} ${r} 0 0 1 ${150 + r} 152" fill="none" stroke="${c}" stroke-width="10.5"/>`;
      }).join('') + cloud(46, 140, 1.35) + cloud(254, 140, 1.35),

    buns: () => bg('#ffc27a') +
      '<rect y="112" width="300" height="38" fill="#c46f35"/><ellipse cx="150" cy="114" rx="118" ry="15" fill="#fff"/><ellipse cx="150" cy="112" rx="98" ry="9" fill="#f3ece6"/>' +
      [95, 150, 205].map(x =>
        `<path d="M${x - 6} 66q-6-8 0-16t0-16M${x + 8} 68q-6-8 0-16" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="${x}" cy="96" rx="28" ry="21" fill="#d98738"/><ellipse cx="${x - 9}" cy="87" rx="9" ry="4.5" fill="#f2b56d"/><path d="M${x - 19} 93Q${x} 87 ${x + 19} 93M${x} 77Q${x + 4} 96 ${x} 115" stroke="#fff6e6" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
      ).join(''),

    lamb: () => bg('#a8dcff') + sun(256, 32, 15) + cloud(70, 34, .9) +
      '<ellipse cx="60" cy="172" rx="190" ry="64" fill="#84ca2b"/><ellipse cx="272" cy="176" rx="140" ry="58" fill="#69b52c"/>' +
      flowers([[34, 128, '#ef82b2'], [66, 140, '#ffd11e'], [236, 134, '#fff'], [266, 142, '#ef82b2']]) +
      '<g transform="translate(140 100)"><g fill="#3a3046"><rect x="-20" y="10" width="6" height="20" rx="3"/><rect x="-8" y="12" width="6" height="18" rx="3"/><rect x="8" y="12" width="6" height="18" rx="3"/><rect x="18" y="10" width="6" height="20" rx="3"/></g><g fill="#fff"><circle cx="-22" cy="0" r="14"/><circle cx="-8" cy="-10" r="15"/><circle cx="10" cy="-10" r="15"/><circle cx="24" cy="0" r="14"/><circle cx="0" cy="6" r="18"/><circle cx="-14" cy="10" r="12"/><circle cx="14" cy="10" r="12"/></g><ellipse cx="38" cy="-10" rx="11" ry="13" fill="#3a3046"/><ellipse cx="29" cy="-17" rx="7" ry="3.6" fill="#3a3046" transform="rotate(-30 29 -17)"/><circle cx="41" cy="-12" r="2.4" fill="#fff"/><circle cx="35" cy="-22" r="7" fill="#fff"/></g>',

    twinkle: () => bg('#1f2c6e') +
      [[30, 30, 6], [62, 112, 5], [184, 28, 7], [208, 96, 5], [276, 92, 6], [164, 124, 4], [34, 76, 4], [232, 60, 4]]
        .map(([x, y, r]) => star(x, y, r, '#fff3a6')).join('') +
      '<circle cx="252" cy="36" r="22" fill="#ffe28a"/><circle cx="263" cy="29" r="20" fill="#1f2c6e"/>' +
      '<ellipse cx="150" cy="188" rx="230" ry="52" fill="#16205a"/>' +
      star(112, 72, 36) +
      '<g fill="#2a2140"><circle cx="103" cy="70" r="3"/><circle cx="121" cy="70" r="3"/></g><path d="M105 80q7 7 14 0" stroke="#2a2140" stroke-width="3" fill="none" stroke-linecap="round"/>',

    ducks: () => bg('#bfeaff') + cloud(70, 36) + cloud(222, 28, .8) +
      '<path d="M0 96Q150 84 300 96V150H0Z" fill="#17a5b1"/>' +
      '<g stroke="#5fc6cf" stroke-width="3" fill="none" stroke-linecap="round"><path d="M60 126h56M150 132h44M210 136h40M30 140h30"/></g>' +
      '<g stroke="#4c9a2a" stroke-width="4" stroke-linecap="round"><path d="M272 100V62M282 100V70M262 100V74"/></g><g fill="#7a4b2a"><rect x="268" y="56" width="8" height="18" rx="4"/><rect x="278" y="64" width="8" height="16" rx="4"/></g>' +
      duck(92, 108, 1.25) + duck(170, 117, .95) + duck(230, 122, .75),

    jacob: () => bg('#ffe7a8') + sun(62, 46, 20) +
      '<rect y="128" width="300" height="22" fill="#84ca2b"/>' +
      '<rect x="178" y="44" width="72" height="90" fill="#fbf3e6"/><path d="M168 46L214 10L260 46Z" fill="#ed1747"/><path d="M194 112V80a20 20 0 0 1 40 0V112Z" fill="#5b4636"/>' +
      '<path d="M202 104Q202 81 214 79Q226 81 226 104Z" fill="#ffd11e"/><circle cx="214" cy="108" r="4" fill="#ffd11e"/><rect x="199" y="102" width="30" height="4" rx="2" fill="#e8b400"/>' +
      '<path d="M204 134v-12a10 10 0 0 1 20 0v12Z" fill="#c9a27e"/>' +
      '<path d="M162 72q-9 13 0 26M151 64q-15 21 0 42M266 72q9 13 0 26M277 64q15 21 0 42" stroke="#ff8819" stroke-width="4" fill="none" stroke-linecap="round"/>',

    lightly: () => bg('#c9f0ff') + sun(250, 34, 16) + cloud(70, 40) +
      '<rect y="104" width="300" height="46" fill="#1974c5"/><g stroke="#4f9be0" stroke-width="3" stroke-linecap="round"><path d="M20 120h40M200 130h50M90 138h40M240 116h30"/></g>' +
      '<path d="M108 106H196L184 124H120Z" fill="#ed1747"/><rect x="150" y="38" width="4" height="68" fill="#7a4b2a"/><path d="M156 42V100H198Z" fill="#fff"/><path d="M148 52V100H114Z" fill="#ffd11e"/><path d="M154 38l13 4-13 4z" fill="#84ca2b"/>',

    farm: () => bg('#b9e3ff') + sun(46, 34, 16) + cloud(240, 34, .9) +
      '<path d="M0 112Q150 96 300 112V150H0Z" fill="#84ca2b"/>' +
      '<g fill="#fff"><rect x="8" y="104" width="5" height="22"/><rect x="38" y="102" width="5" height="22"/><rect x="68" y="101" width="5" height="22"/><rect x="232" y="101" width="5" height="22"/><rect x="262" y="102" width="5" height="22"/><rect x="292" y="104" width="5" height="22"/><rect x="0" y="108" width="80" height="4"/><rect x="226" y="108" width="74" height="4"/></g>' +
      '<rect x="122" y="70" width="76" height="52" fill="#ed1747"/><path d="M114 72L160 40L206 72Z" fill="#b5122f"/><rect x="146" y="94" width="28" height="28" fill="#fff"/><path d="M146 94L174 122M174 94L146 122" stroke="#ed1747" stroke-width="3"/><rect x="152" y="54" width="16" height="12" rx="2" fill="#fff"/>' +
      flowers([[100, 132, '#ffd11e'], [222, 136, '#ef82b2']]),

    bridge: () => bg('#ffd6e4') + cloud(56, 30, .9) + cloud(250, 46, .7) +
      '<rect y="118" width="300" height="32" fill="#17a5b1"/>' +
      '<rect x="88" y="36" width="24" height="52" fill="#b9a3c9"/><path d="M84 38L100 16L116 38Z" fill="#1974c5"/><rect x="188" y="36" width="24" height="52" fill="#b9a3c9"/><path d="M184 38L200 16L216 38Z" fill="#1974c5"/>' +
      '<rect x="95" y="48" width="10" height="14" rx="5" fill="#8c78a6"/><rect x="195" y="48" width="10" height="14" rx="5" fill="#8c78a6"/>' +
      '<rect y="84" width="300" height="12" fill="#8c78a6"/><rect y="96" width="300" height="26" fill="#b9a3c9"/>' +
      [50, 150, 250].map(x => `<path d="M${x - 34} 122V114a34 18 0 0 1 68 0V122Z" fill="#7fcbd6"/>`).join('') +
      '<g stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"><path d="M30 134h30M130 140h40M230 132h30"/></g>',

    boat: () => bg('#8fd3ff') + sun(58, 36, 18) + cloud(222, 30) +
      '<path d="M0 104q18-10 36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0V150H0Z" fill="#1974c5"/>' +
      '<path d="M120 90L84 126" stroke="#8a4a22" stroke-width="4" stroke-linecap="round"/>' +
      '<rect x="146" y="70" width="16" height="22" rx="7" fill="#ed1747"/><circle cx="154" cy="62" r="10" fill="#ffcf9e"/><path d="M144 60a10 10 0 0 1 20 0Z" fill="#ffd11e"/>' +
      '<path d="M98 96H206Q196 120 152 120Q110 120 98 96Z" fill="#c46f35"/><rect x="98" y="92" width="108" height="6" rx="3" fill="#8a4a22"/>' +
      '<path d="M0 126q18-8 36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0t36 0V150H0Z" fill="#17a5b1"/>',

    jingle: () => bg('#24357a') + sprinkle(28, 3, 118, '#fff', 2.4) +
      '<ellipse cx="80" cy="162" rx="170" ry="46" fill="#fff"/><ellipse cx="262" cy="170" rx="130" ry="46" fill="#e6efff"/>' +
      pine(46, 114, 1) + pine(240, 118, .9) + pine(276, 124, .7) +
      bell(134, 74, -16) + bell(168, 74, 16) +
      '<path d="M151 50l-15-9v18zM151 50l15-9v18z" fill="#ed1747"/><circle cx="151" cy="50" r="4.5" fill="#ed1747"/>',

    ode: () => bg('#2d1b5c') +
      burst(80, 52, 30, '#ffd11e') + burst(198, 40, 24, '#ef82b2') + burst(248, 88, 20, '#84ca2b') + burst(128, 96, 16, '#17a5b1') +
      '<path d="M0 150V122H24V108H46V126H70V114H92V130H118V104H140V124H170V112H196V128H220V100H244V120H268V110H300V150Z" fill="#1a0f3a"/>' +
      '<g fill="#ffd11e" opacity=".8"><rect x="30" y="114" width="4" height="5"/><rect x="124" y="112" width="4" height="5"/><rect x="132" y="120" width="4" height="5"/><rect x="226" y="108" width="4" height="5"/><rect x="274" y="118" width="4" height="5"/></g>',

    lullaby: () => bg('#c4b3f2') + sprinkle(14, 7, 60, '#fff', 1.8) +
      '<g transform="translate(150 94)"><g fill="#fff"><circle cx="-46" cy="8" r="26"/><circle cx="-14" cy="-14" r="36"/><circle cx="26" cy="-8" r="32"/><circle cx="56" cy="12" r="22"/><rect x="-72" y="8" width="150" height="30" rx="15"/></g></g>' +
      sleepyFace(150, 92, 1.3) +
      '<g fill="#fff" font-family="ui-rounded, sans-serif" font-weight="800"><text x="214" y="58" font-size="14">z</text><text x="226" y="44" font-size="19">z</text><text x="242" y="28" font-size="25">z</text></g>',

    moon: () => bg('#16225a') + [[30, 26, 5], [96, 20, 4], [216, 22, 5], [270, 52, 6], [40, 70, 4], [250, 100, 4]].map(([x, y, r]) => star(x, y, r, '#fff3a6')).join('') +
      '<circle cx="150" cy="66" r="38" fill="#ffe9a8"/><circle cx="132" cy="52" r="5" fill="#f6d985"/><circle cx="170" cy="82" r="4" fill="#f6d985"/>' +
      sleepyFace(150, 66, 1.25) +
      '<path d="M0 150V110q20-32 40 0q16-26 34 4V150Z" fill="#0d1640"/><path d="M300 150V104q-22-30-42 2q-14-22-30 6V150Z" fill="#0d1640"/>' +
      '<path d="M66 132Q150 156 234 132" stroke="#ef82b2" stroke-width="4" fill="none"/><path d="M80 134Q150 150 220 134" stroke="#ffd11e" stroke-width="3" fill="none"/>',

    bouncy: () => bg('#fff1d6') + '<rect y="122" width="300" height="28" fill="#f6c98f"/>' +
      '<g fill="none" stroke="#2a2140" stroke-opacity=".18" stroke-width="2.5" stroke-dasharray="3 7" stroke-linecap="round"><path d="M20 120Q55 20 90 112Q120 50 150 108"/><path d="M160 116Q200 40 236 104Q262 60 286 110"/></g>' +
      [[90, 100, 14, 0], [150, 96, 12, 2], [236, 92, 13, 5], [52, 60, 9, 3], [200, 58, 10, 6], [286, 98, 11, 7]].map(([x, y, r, c]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${COLORS[c]}"/><path d="M${x - r * .5} ${y - r * .3}a${r * .6} ${r * .6} 0 0 1 ${r * .5} -${r * .4}" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" fill="none" stroke-linecap="round"/>`).join('') +
      '<ellipse cx="90" cy="124" rx="12" ry="3" fill="#2a2140" opacity=".12"/><ellipse cx="236" cy="124" rx="11" ry="3" fill="#2a2140" opacity=".12"/>',

    rain: () => bg('#cfe8ff') +
      '<g fill="#fff"><circle cx="110" cy="44" r="26"/><circle cx="146" cy="32" r="32"/><circle cx="186" cy="44" r="24"/><rect x="88" y="44" width="120" height="22" rx="11"/></g>' +
      [[100, 84], [128, 100], [160, 82], [190, 98], [214, 80], [116, 124], [176, 122]].map(([x, y]) =>
        `<path d="M${x} ${y - 9}q7 9 0 14q-7-5 0-14Z" fill="#1974c5"/>`).join('') +
      '<path d="M40 120a34 34 0 0 1 68 0q-5.7-6-11.3 0q-5.7-6-11.3 0q-5.7-6-11.3 0q-5.7-6-11.3 0q-5.7-6-11.3 0q-5.7-6-11.5 0Z" fill="#ed1747"/><path d="M74 120V142q0 6 6 6" stroke="#2a2140" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="236" cy="140" rx="44" ry="7" fill="#7fb6e6"/>',

    maneschijn: () => bg('#3b2c7a') + sprinkle(16, 9, 70, '#fff', 1.6) +
      '<circle cx="206" cy="52" r="34" fill="#fff2b3"/><circle cx="194" cy="44" r="5" fill="#f3dd8c"/><circle cx="218" cy="64" r="4" fill="#f3dd8c"/>' +
      '<path d="M0 150V118Q80 96 160 116T300 110V150Z" fill="#241a52"/>' +
      '<rect x="70" y="92" width="44" height="30" fill="#efe2c6"/><path d="M64 94L92 70L120 94Z" fill="#ed1747"/><rect x="84" y="100" width="14" height="12" fill="#ffd11e"/><rect x="104" y="72" width="7" height="14" fill="#8a5a33"/>',

    oldman: () => bg('#ffe1b5') + '<rect y="122" width="300" height="28" fill="#84ca2b"/>' + sun(254, 34, 15) +
      '<g transform="translate(140 102)"><path d="M-36 4q-14-8-18-20" stroke="#a86b35" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="0" cy="4" rx="38" ry="22" fill="#c98a4b"/>' +
      '<rect x="-28" y="14" width="10" height="20" rx="5" fill="#c98a4b"/><rect x="18" y="14" width="10" height="20" rx="5" fill="#c98a4b"/>' +
      '<circle cx="40" cy="-22" r="22" fill="#c98a4b"/><ellipse cx="28" cy="-24" rx="9" ry="16" fill="#7a4b26" transform="rotate(20 28 -24)"/>' +
      '<ellipse cx="58" cy="-14" rx="12" ry="9" fill="#e7b880"/><circle cx="68" cy="-17" r="4" fill="#2a2140"/><circle cx="46" cy="-28" r="3" fill="#2a2140"/></g>' +
      '<g transform="translate(222 110) rotate(-18)"><rect x="-16" y="-4" width="32" height="8" rx="4" fill="#fff"/><circle cx="-16" cy="-5" r="5.5" fill="#fff"/><circle cx="-16" cy="5" r="5.5" fill="#fff"/><circle cx="16" cy="-5" r="5.5" fill="#fff"/><circle cx="16" cy="5" r="5.5" fill="#fff"/></g>',

    wheels: () => bg('#bfe6ff') + sun(52, 34, 15) + cloud(236, 32, .9) +
      '<rect y="116" width="300" height="34" fill="#5b5566"/><path d="M0 134H300" stroke="#fff" stroke-width="3" stroke-dasharray="16 12"/>' +
      '<rect x="74" y="56" width="152" height="58" rx="12" fill="#ffd11e"/><rect x="74" y="98" width="152" height="8" fill="#ff8819"/>' +
      [86, 116, 146, 176].map(x => `<rect x="${x}" y="66" width="24" height="20" rx="4" fill="#bfe6ff"/>`).join('') +
      '<rect x="204" y="66" width="16" height="40" rx="3" fill="#8fd3ff"/><circle cx="222" cy="100" r="4" fill="#fff6c2"/>' +
      [108, 192].map(x => `<circle cx="${x}" cy="114" r="14" fill="#2a2140"/><circle cx="${x}" cy="114" r="5" fill="#c9c2d6"/>`).join(''),

    kumbaya: () => bg('#1d2a6b') + sprinkle(22, 4, 80, '#fff3a6', 1.8) +
      '<path d="M0 150V118Q150 100 300 118V150Z" fill="#15204f"/>' +
      '<circle cx="150" cy="112" r="40" fill="#ff8819" opacity=".18"/>' +
      '<path d="M122 128L178 112M122 112L178 128" stroke="#8a5a33" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M150 66Q170 92 164 108Q160 118 150 120Q140 118 136 108Q130 92 150 66Z" fill="#ff8819"/><path d="M150 86Q160 102 156 110Q150 118 144 110Q140 102 150 86Z" fill="#ffd11e"/>',

    michael: () => bg('#9fdcff') + cloud(74, 34) + sun(246, 30, 13) +
      '<rect y="108" width="300" height="42" fill="#1974c5"/><g stroke="#5fb0ea" stroke-width="3" stroke-linecap="round"><path d="M30 124h34M110 136h44M210 128h40"/></g>' +
      '<path d="M200 112Q214 96 238 100Q262 104 270 112Z" fill="#6b5f7a"/>' +
      '<path d="M222 104L228 40H244L250 104Z" fill="#fff"/><path d="M225.5 76H246.6L247.9 90H224.2ZM227.2 52H244.8L245.7 64H226.3Z" fill="#ed1747"/>' +
      '<rect x="226" y="30" width="20" height="12" rx="3" fill="#ffd11e"/><path d="M226 30L236 22L246 30Z" fill="#ed1747"/>' +
      '<path d="M226 36L170 22M226 36L170 50" stroke="#fff6c2" stroke-width="5" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M70 104H124L116 116H78Z" fill="#c46f35"/><path d="M96 104L120 82" stroke="#8a4a22" stroke-width="3" stroke-linecap="round"/>',

    saints: () => bg('#ffd6a8') + '<rect y="126" width="300" height="24" fill="#e9a861"/>' +
      '<ellipse cx="104" cy="122" rx="38" ry="10" fill="#c41239"/><rect x="66" y="76" width="76" height="46" fill="#ed1747"/>' +
      '<path d="M66 82L85 116L104 82L123 116L142 82" stroke="#fff" stroke-width="4" fill="none" stroke-linejoin="round"/><ellipse cx="104" cy="76" rx="38" ry="10" fill="#f3e6d0"/>' +
      '<path d="M84 72L62 40M124 72L146 40" stroke="#8a5a33" stroke-width="5" stroke-linecap="round"/><circle cx="62" cy="40" r="6" fill="#fff"/><circle cx="146" cy="40" r="6" fill="#fff"/>' +
      '<g transform="translate(206 70) rotate(-14)"><rect x="-34" y="-5" width="54" height="10" rx="5" fill="#ffd11e"/><path d="M18 -6L44 -22V22L18 6Z" fill="#ffd11e"/><rect x="-14" y="-14" width="5" height="10" fill="#e8b400"/><rect x="-4" y="-14" width="5" height="10" fill="#e8b400"/><rect x="6" y="-14" width="5" height="10" fill="#e8b400"/></g>' +
      '<g fill="#2a2140" font-family="serif" font-size="22"><text x="180" y="122">♪</text><text x="262" y="44">♫</text><text x="40" y="112">♪</text></g>',

    joy: () => bg('#24357a') + sprinkle(26, 6, 120, '#fff', 2.2) +
      '<ellipse cx="150" cy="160" rx="200" ry="34" fill="#fff"/>' +
      '<path d="M150 30L184 74H166L196 108H174L206 134H94L126 108H104L134 74H116Z" fill="#2f8f4e"/><rect x="142" y="134" width="16" height="12" fill="#7a4b2a"/>' +
      star(150, 28, 13) +
      [[136, 66, 0], [160, 84, 2], [130, 100, 5], [172, 112, 6], [146, 120, 3], [118, 124, 7], [184, 126, 4]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${COLORS[c]}"/>`).join('') +
      '<rect x="206" y="118" width="26" height="22" fill="#ed1747"/><rect x="217" y="118" width="4" height="22" fill="#ffd11e"/><rect x="66" y="122" width="22" height="18" fill="#17a5b1"/><rect x="75" y="122" width="4" height="18" fill="#fff"/>',

    walk: () => bg('#ffe1b5') + '<circle cx="150" cy="100" r="44" fill="#ffb31e"/><circle cx="150" cy="100" r="54" fill="#ffb31e" opacity=".25"/>' +
      cloud(58, 34, .9) +
      '<path d="M0 98Q75 80 150 98T300 94V150H0Z" fill="#84ca2b"/>' +
      '<path d="M128 150Q150 120 146 100Q148 97 154 98Q160 120 180 150Z" fill="#fbe3b0"/>' +
      tree(54, 96, 1, '#5fae2e') + tree(246, 100, .9, '#4c9a2a') +
      flowers([[96, 124, '#ef82b2'], [206, 128, '#fff'], [30, 136, '#ffd11e'], [270, 138, '#ef82b2']])
  };

  const sceneSvg = id =>
    `<svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCENES[id]()}</svg>`;

  // ---------- Staff geometry ----------
  // Key 1 = C4 (ledger line) … key 8 = C5, like the song cards.
  // Steps are counted in half line-gaps above the bottom line (E4).

  const stepOf = key => key - 3;

  // Each device draws the 𝄞 symbol with a different font and size. Measure
  // its real ink box and fit it to 1.35 line-gaps above and below the staff,
  // so it can never spill outside its line.
  let clefInk = null;
  function clefSvg(x, top, s) {
    if (!clefInk) {
      const g = document.createElement('canvas').getContext('2d');
      g.font = '100px "Noto Music", "Apple Symbols", "Segoe UI Symbol", serif';
      const m = g.measureText(CLEF);
      const asc = m.actualBoundingBoxAscent;
      const desc = m.actualBoundingBoxDescent;
      clefInk = asc + desc > 20
        ? { asc: asc / 100, desc: desc / 100, left: (m.actualBoundingBoxLeft || 0) / 100 }
        : { asc: .72, desc: .28, left: 0 };
    }
    const height = 6.7 * s;
    const size = height / (clefInk.asc + clefInk.desc);
    const baseline = top - 1.35 * s + clefInk.asc * size;
    return `<text class="clef" x="${(x + clefInk.left * size).toFixed(1)}" y="${baseline.toFixed(1)}" font-size="${size.toFixed(1)}">${CLEF}</text>`;
  }

  // The card's staff: the first notes, or (roll) the whole song on a strip
  // that slides past the clef while the preview plays.
  const ROLL_DX = 19;

  function miniStaff(song, roll = false) {
    const s = 10;
    const top = 14;
    const bottom = top + 4 * s;
    const notes = roll ? song.flat : song.flat.slice(0, 9);
    const x0 = 50;
    const dx = roll ? ROLL_DX : Math.min(ROLL_DX, (190 - x0) / Math.max(1, notes.length - 1));
    let out = `<svg viewBox="0 0 200 76" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`;
    if (roll) {
      out += `<defs><linearGradient id="roll-${song.id}-g" gradientUnits="userSpaceOnUse" x1="0" x2="200">` +
        '<stop offset=".17" stop-color="#fff" stop-opacity="0"/><stop offset=".21" stop-color="#fff"/>' +
        '<stop offset=".9" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
        `<mask id="roll-${song.id}"><rect width="200" height="76" fill="url(#roll-${song.id}-g)"/></mask></defs>`;
    }
    for (let i = 0; i < 5; i++) out += `<path class="staff" d="M6 ${top + i * s}H196" stroke-width="1.2"/>`;
    out += clefSvg(9, top, s);
    if (roll) out += `<g mask="url(#roll-${song.id})"><g class="roll">`;
    notes.forEach((n, i) => {
      const x = x0 + i * dx;
      const y = bottom - stepOf(n.key) * s / 2;
      if (n.key === 1) out += `<path class="ledger" d="M${x - 9} ${y}H${x + 9}" stroke-width="1.4"/>`;
      out += `<circle cx="${x}" cy="${y}" r="5.4" fill="${COLORS[n.key - 1]}"/>`;
    });
    if (roll) out += '</g></g>';
    return out + '</svg>';
  }

  // ---------- Audio output ----------

  let actx = null;
  let master = null;

  // iOS: "playback" ignores the silent switch and keeps the loudspeaker route.
  function setSession(type) {
    try {
      if (navigator.audioSession) navigator.audioSession.type = type;
    } catch (_) {
      // Older browsers: nothing to do.
    }
  }

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    if (!actx || actx.state === 'closed') {
      if (!mic.on) setSession('playback');
      actx = new AC({ latencyHint: 'interactive' });

      const comp = actx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.knee.value = 8;
      comp.ratio.value = 10;
      comp.attack.value = .002;
      comp.release.value = .15;

      master = actx.createGain();
      master.gain.value = 1;
      master.connect(comp).connect(actx.destination);
    }

    if (actx.state !== 'running') actx.resume().catch(() => {});
    return actx;
  }

  // Partials: [frequency multiple, amplitude, decay share]. Overtones carry
  // the pitch on tiny phone speakers, which barely reproduce a 260 Hz sine.
  // ring: how long a held note keeps sounding (decay time constant, s);
  // rel: how fast it stops once let go. The piano has dampers; xylophone
  // bars just ring out, longer for longer notes.
  const VOICES = {
    piano: { atk: .004, ring: () => 1.15, rel: .07, parts: [[1, 1, 1], [2, .55, .55], [3, .32, .4], [4, .18, .3], [6, .08, .2]] },
    xylo: { atk: .002, ring: dur => clamp(dur * .45, .2, .75), rel: .22, parts: [[1, 1, 1], [3, .42, .28], [6.1, .14, .12]] }
  };

  // Plays a key from `when` for `dur` seconds. Returns a handle whose
  // release() lets go early (on-screen keys sound while held).
  function tone(key, when, dur, out, vel = 1) {
    if (!actx) return null;
    const f = freqsFor(prefs.voice)[key - 1];
    const v = VOICES[prefs.voice];
    const ring = v.ring(dur);
    const bus = actx.createGain();
    bus.connect(out || master);
    const oscs = [];
    let end = when + Math.max(.1, dur);

    bus.gain.setValueAtTime(1, end);
    bus.gain.setTargetAtTime(0, end, v.rel);

    v.parts.forEach(([mult, amp, share], i) => {
      if (f * mult > 14000) return;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.frequency.value = f * mult;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(amp * .36 * vel, when + v.atk);
      g.gain.setTargetAtTime(0, when + v.atk, ring * share);
      o.connect(g).connect(bus);
      o.start(when);
      o.stop(end + v.rel * 7);
      if (i === 0) o.onended = () => bus.disconnect();
      oscs.push(o);
    });

    return {
      release() {
        const now = actx.currentTime;
        if (prefs.voice === 'xylo' || now >= end) return;
        end = Math.max(now, when + .08);
        bus.gain.cancelScheduledValues(now);
        bus.gain.setValueAtTime(1, end);
        bus.gain.setTargetAtTime(0, end, v.rel);
        oscs.forEach(o => { try { o.stop(end + v.rel * 7); } catch (_) {} });
      }
    };
  }

  // ---------- Microphone + pitch ----------

  const mic = {
    on: false,
    starting: null,
    ctx: null,
    stream: null,
    an: null,
    buf: null,
    raf: 0,
    devices: [],
    deviceId: '',
    noise: .002,
    ignoreUntil: 0,
    lastT: 0
  };

  let yinBuf = null;
  let yinMax = 0;
  let yinD = 1;
  let matchCands = [];

  // YIN pitch estimate, limited to 110–2200 Hz.
  function yin(buf, rate) {
    const tauMin = Math.floor(rate / 2200);
    const tauMax = Math.min(Math.floor(rate / 110), buf.length >> 1);
    const w = buf.length - tauMax;
    if (!yinBuf || yinBuf.length < tauMax + 2) yinBuf = new Float32Array(tauMax + 2);
    const d = yinBuf;
    yinMax = tauMax;
    d[0] = 1;
    yinD = 1;
    let running = 0;

    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0;
      for (let i = 0; i < w; i++) {
        const x = buf[i] - buf[i + tau];
        sum += x * x;
      }
      running += sum;
      d[tau] = running ? sum * tau / running : 1;
    }

    let tau = -1;
    for (let t = tauMin; t <= tauMax; t++) {
      if (d[t] < .12) {
        while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
        tau = t;
        break;
      }
    }

    if (tau < 0) {
      let best = tauMin;
      for (let t = tauMin; t <= tauMax; t++) if (d[t] < d[best]) best = t;
      yinD = d[best];
      if (d[best] > .3) return 0;
      tau = best;
    }

    const a = d[tau - 1];
    const b = d[tau];
    yinD = b;
    const c = tau + 1 <= tauMax ? d[tau + 1] : b;
    const den = a - 2 * b + c;
    const shift = den ? clamp(.5 * (a - c) / den, -1, 1) : 0;
    return rate / (tau + shift);
  }

  // Each key accepts pitches up to halfway to its nearest neighbour.
  function classify(hz, freqs) {
    if (!hz) return 0;
    let best = -1;
    let err = Infinity;
    freqs.forEach((f, i) => {
      const e = Math.abs(cents(hz, f));
      if (e < err) { err = e; best = i; }
    });
    let gap = Infinity;
    freqs.forEach((f, i) => {
      if (i !== best) gap = Math.min(gap, Math.abs(cents(f, freqs[best])));
    });
    return err <= Math.min(85, gap / 2 + 12) ? best + 1 : 0;
  }

  // Which known key sounds now, read from the YIN curve of the last yin() call.
  // A free pitch estimate fails when the previous note still rings: the two
  // notes together repeat at a much lower "chord" period. Checking only the
  // eight known periods finds the new, loud note instead.
  function matchKey(freqs, rate, prev = 0) {
    const d = yinBuf;
    if (!d) return 0;
    const cands = freqs.map((f, i) => {
      const t0 = rate / f;
      const span = Math.max(1, Math.ceil(t0 * .022));
      let m = 1;
      for (let t = Math.floor(t0 - span); t <= Math.ceil(t0 + span); t++) {
        if (t >= 2 && t <= yinMax) m = Math.min(m, d[t]);
      }
      return { key: i + 1, tau: t0, d: m };
    });
    matchCands = cands;
    let pick = cands.reduce((a, b) => (b.d < a.d ? b : a));
    if (pick.d > .3) return 0;
    // A note also repeats at twice its period, so key 8 looks like key 1 too.
    // When the octave above fits about as well, it is the one that sounds.
    // Striking key 8 while key 1 still rings also repeats at key 1's period,
    // so right after key 1 a plausible octave above wins.
    const up = cands.find(c => Math.abs(cents(pick.tau / 2, c.tau)) < 50);
    if (up && up.d < .3 && (up.d < pick.d + .08 || pick.key === prev)) pick = up;
    return pick.key;
  }

  function noteName(hz) {
    const midi = 69 + 12 * Math.log2(hz / 440);
    const r = Math.round(midi);
    const c = Math.round((midi - r) * 100);
    return NOTE_NAMES[(r % 12 + 12) % 12] + (Math.floor(r / 12) - 1) + (c ? (c > 0 ? ' +' : ' −') + Math.abs(c) + '¢' : '');
  }

  async function refreshDevices() {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      mic.devices = list.filter(d => d.kind === 'audioinput' && d.deviceId);
    } catch (_) {
      mic.devices = [];
    }
    syncMicPickers();
  }

  function syncMicPickers() {
    const show = mic.devices.length > 1;
    $$('.micpick').forEach(label => {
      label.hidden = !show;
      if (!show) return;
      label.innerHTML = ICONS.mic + '<select aria-label="Microphone">' +
        mic.devices.map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || 'Microphone ' + (i + 1))}</option>`).join('') +
        '</select>';
      const select = label.querySelector('select');
      const current = mic.deviceId || prefs.mic;
      select.value = mic.devices.some(d => d.deviceId === current) ? current : mic.devices[0].deviceId;
      select.onchange = async () => {
        prefs.mic = select.value;
        savePrefs();
        if (!mic.on) return;
        micStop();
        await micStart();
      };
    });
  }

  function micStart() {
    if (mic.on) return Promise.resolve(true);
    if (mic.starting) return mic.starting;

    mic.starting = (async () => {
      const AC = window.AudioContext || window.webkitAudioContext;
      try {
        if (!navigator.mediaDevices?.getUserMedia || !AC) {
          throw new Error('The microphone needs the https:// version of this page.');
        }

        stopListen();
        setSession('play-and-record');

        // Created before the await so it counts as part of the tap.
        const ctx = new AC();
        ctx.resume().catch(() => {});
        mic.ctx = ctx;

        const base = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: prefs.mic ? { ...base, deviceId: { exact: prefs.mic } } : base
          });
        } catch (error) {
          if (!prefs.mic || !['OverconstrainedError', 'NotFoundError'].includes(error.name)) throw error;
          prefs.mic = '';
          savePrefs();
          stream = await navigator.mediaDevices.getUserMedia({ audio: base });
        }

        if (mic.ctx !== ctx) {
          stream.getTracks().forEach(t => t.stop());
          return false;
        }

        mic.stream = stream;
        const track = stream.getAudioTracks()[0];
        mic.deviceId = track?.getSettings?.().deviceId || '';
        dlog('MIC start rate=' + ctx.sampleRate + ' settings=' + JSON.stringify(track?.getSettings?.() || {}) + ' ua=' + navigator.userAgent);
        track?.addEventListener('ended', () => {
          micStop();
          toast('The microphone stopped.');
        });

        const source = ctx.createMediaStreamSource(stream);
        mic.an = ctx.createAnalyser();
        mic.an.fftSize = 2048;
        mic.an.smoothingTimeConstant = 0;
        mic.buf = new Float32Array(mic.an.fftSize);
        // Keep the toy's range (and its first overtones); drop room rumble and hiss.
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 180;
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 2500;
        const mute = ctx.createGain();
        mute.gain.value = 0;
        // Some browsers only run an analyser that reaches the output. It stays silent.
        source.connect(highpass).connect(lowpass).connect(mic.an).connect(mute).connect(ctx.destination);
        // Started without a tap (e.g. after Listen), the context may stay
        // suspended; then the badge simply waits for a tap.
        if (ctx.state !== 'running') await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 1000))]);
        if (ctx.state !== 'running') {
          stream.getTracks().forEach(t => t.stop());
          micStop();
          return false;
        }

        mic.on = true;
        mic.noise = .001;
        resetDetector();
        mic.raf = requestAnimationFrame(micFrame);
        refreshDevices();
        return true;
      } catch (error) {
        micStop();
        const denied = error && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
        toast(denied
          ? 'Microphone blocked. Allow it in your browser settings for this site.'
          : 'Microphone: ' + (error.message || error.name));
        return false;
      } finally {
        mic.starting = null;
      }
    })();

    return mic.starting;
  }

  function micStop() {
    cancelAnimationFrame(mic.raf);
    mic.stream?.getTracks().forEach(t => t.stop());
    mic.ctx?.close().catch(() => {});
    mic.stream = null;
    mic.ctx = null;
    mic.an = null;
    mic.on = false;

    // Closing the playback context resets iOS back to the loud speaker route.
    if (actx) {
      actx.close().catch(() => {});
      actx = null;
    }
    setSession('playback');
    setHeard(0);
    syncMicPickers();
  }

  function micFrame(t) {
    if (!mic.on) return;
    mic.raf = requestAnimationFrame(micFrame);
    // Fixed ~60 Hz analysis: detector timings are in frames, and 120 Hz
    // screens would otherwise halve them (and double the CPU work).
    if (t - mic.lastT < 15) return;
    mic.lastT = t;

    const buf = mic.buf;
    mic.an.getFloatTimeDomainData(buf);
    let energy = 0;
    for (let i = 0; i < buf.length; i++) energy += buf[i] * buf[i];
    const rms = Math.sqrt(energy / buf.length);

    // Gate just above the room's noise; pitch confidence rejects the rest.
    // Some keys reach the phone far quieter than others, so no fixed level.
    const gate = Math.max(.0004, mic.noise * 2);
    const rate = mic.ctx.sampleRate;
    const voiced = rms > gate && performance.now() > mic.ignoreUntil;
    const hz = voiced ? yin(buf, rate) : 0;
    if (!voiced) matchCands = [];
    // Noise floor: follows quiet moments quickly and rises slowly, and only
    // on unpitched sound; a ringing note is signal, not noise.
    if (rms < mic.noise) mic.noise = mic.noise * .8 + rms * .2;
    else if (!hz) mic.noise = mic.noise * .995 + Math.min(rms, mic.noise * 3) * .005;
    const keyIn = (freqs, prev) => (voiced ? matchKey(freqs, rate, prev) : 0);

    const alongKey = along.on ? keyIn(freqsFor(prefs.voice), det.last) : 0;
    const tuneKey = tune.live ? keyIn(tune.freqs) : 0;
    if (DEBUG && rms > gate * .6) {
      dlog(`F ${along.on ? 'along' : 'tune'} rms=${rms.toFixed(4)} gate=${gate.toFixed(4)} hz=${hz ? hz.toFixed(1) : '-'} d=${yinD.toFixed(2)} key=${along.on ? alongKey : tuneKey}` +
        (tune.live ? ` step=${tune.mode === 'step' ? tune.step + 1 : 'test'} n=${tune.count || 0}${tune.skip ? ' skip' : ''}` : ''));
    }

    if (along.on) alongFrame(alongKey, rms, t);
    if (tune.live) tuneFrame(hz, rms, t, tuneKey);
  }

  // ---------- Song view ----------

  let song = null;
  let pos = 0;
  let layout = null;
  const along = { on: false };
  let listenRun = null;

  const det = { peak: 0, valley: 0, onset: -1e9, armed: false, cand: 0, n: 0, last: 0, lastAt: -1e9, sk: 0, sn: 0, played: {} };

  function resetDetector() {
    Object.assign(det, { peak: 0, valley: 0, onset: -1e9, armed: false, cand: 0, n: 0, last: 0, lastAt: -1e9, sk: 0, sn: 0, played: {} });
  }

  function buildKeys(box, mini) {
    box.innerHTML = '';
    COLORS.forEach((c, i) => {
      const key = document.createElement(mini ? 'div' : 'button');
      key.className = 'key';
      key.style.setProperty('--c', c);
      key.innerHTML = `<span class="num">${i + 1}</span>`;
      if (!mini) {
        key.setAttribute('aria-label', 'Key ' + (i + 1));
        key.addEventListener('pointerdown', e => {
          e.preventDefault();
          pressKey(i + 1, key);
        });
        const up = () => {
          if (key._tone) key._tone.release();
          key._tone = null;
        };
        key.addEventListener('pointerup', up);
        key.addEventListener('pointercancel', up);
        key.addEventListener('pointerleave', up);
      }
      box.append(key);
    });
    // Decorative black keys, placed between keys like on the toy.
    [1, 2, 4, 5, 6].forEach(gap => {
      const black = document.createElement('i');
      black.className = 'black';
      black.style.left = `calc(${gap} * (100% + 6px) / 8 - 3px)`;
      box.append(black);
    });
  }

  function flash(el, ms = 180) {
    el.classList.add('down');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('down'), ms);
  }

  function pressKey(key, el) {
    if (!ensureAudio()) return;
    if (el._tone) el._tone.release();
    el._tone = tone(key, actx.currentTime + .005, 4);
    flash(el);
    if (mic.on) mic.ignoreUntil = performance.now() + 500;
  }

  let heardKey = 0;
  function setHeard(key) {
    if (key === heardKey) return;
    heardKey = key;
    $$('#keys .key').forEach((el, i) => el.classList.toggle('heard', key === i + 1));
  }

  const unit = beats => beats < 1 ? 1.95 : 2.25 + .75 * Math.min(beats - 1, 3);
  const barUnits = bar => bar.reduce((sum, n) => sum + unit(n.beats), 0) + 1;
  const CLEF_U = 3.4;
  const TSIG_U = 1.9;
  const ROW_U = 7.9;
  const lead = (sg, b) => CLEF_U + (b === 0 ? TSIG_U : 0);

  // Bars are laid out like printed music: the same number of bars on every
  // line (a pickup bar rides along on the first), every line full width.
  const barBeats = bar => bar.reduce((sum, n) => sum + n.beats, 0);

  function chunk(sg, k) {
    const pick = sg.bars.length > 1 && barBeats(sg.bars[0]) < sg.meter ? 1 : 0;
    const rest = sg.bars.length - pick;
    const count = Math.max(1, Math.ceil(rest / k));
    const lines = [];
    let b = pick;
    for (let i = 0; i < count; i++) {
      const take = Math.round(rest * (i + 1) / count) - Math.round(rest * i / count);
      const line = [];
      for (let j = 0; j < take; j++) line.push(b++);
      lines.push(line);
    }
    if (pick) lines[0].unshift(0);
    return { lines, even: rest % k === 0 };
  }

  const lineUnits = (sg, line) => lead(sg, line[0]) + line.reduce((sum, b) => sum + barUnits(sg.bars[b]), 0);

  // Tries every bars-per-line count; `judge` scores each option (or null).
  function bestLayout(sg, W, judge) {
    let best = null;
    for (let k = 1; k <= sg.bars.length; k++) {
      const { lines, even } = chunk(sg, k);
      const s = W / Math.max(...lines.map(line => lineUnits(sg, line)));
      const option = judge({ k, lines, even, s });
      if (option && (!best || option.score > best.score)) best = option;
    }
    return best;
  }

  function computeLayout() {
    const sheet = $('#sheet');
    const W = sheet.clientWidth;
    const H = sheet.clientHeight;
    if (!W || !H) return null;
    const total = song.flat.length;

    // Biggest notes that still show a useful chunk of the song at once:
    // about 20 notes over several lines, or 12 when only one line fits.
    const best = bestLayout(song, W, o => {
      const s = Math.min(26, o.s, (H - 12) / ROW_U);
      const rows = Math.max(1, Math.floor((H - 12) / (ROW_U * s)));
      const shown = Math.min(total, total / o.lines.length * Math.min(rows, o.lines.length));
      const want = Math.min(total, rows > 1 ? 20 : 12);
      const ok = shown >= want - .5;
      // Prefer: enough notes, then an even split, then big notes.
      return { ...o, s, rows, score: (ok ? 1000 : shown) + (ok ? s * (o.even ? 1 : .85) : 0) };
    });

    const { s, rows, lines } = best;
    const lineH = (H - 12) / rows;
    const lineOfBar = [];
    lines.forEach((line, i) => line.forEach(b => { lineOfBar[b] = i; }));
    return { s, W, H, rows, lineH, lines, lineOfBar };
  }

  // Rest signs, drawn in staff spaces (s) from the top line.
  function restSvg(cx, top, s, beats) {
    const P = (x, y) => `${(cx + x * s).toFixed(1)} ${(top + y * s).toFixed(1)}`;
    const dotted = beats === 1.5 || beats === 3 || beats === .75;
    const base = dotted ? beats / 1.5 : beats;
    let g;
    if (base >= 4) {
      g = `<rect x="${(cx - .6 * s).toFixed(1)}" y="${(top + s).toFixed(1)}" width="${(1.2 * s).toFixed(1)}" height="${(.5 * s).toFixed(1)}" rx="${(.08 * s).toFixed(1)}"/>`;
    } else if (base >= 2) {
      g = `<rect x="${(cx - .6 * s).toFixed(1)}" y="${(top + 1.5 * s).toFixed(1)}" width="${(1.2 * s).toFixed(1)}" height="${(.5 * s).toFixed(1)}" rx="${(.08 * s).toFixed(1)}"/>`;
    } else if (base >= 1) {
      g = `<path d="M${P(-.2, .55)}L${P(.32, 1.2)}Q${P(-.1, 1.55)} ${P(-.05, 1.9)}L${P(.35, 2.45)}Q${P(-.5, 2.25)} ${P(-.05, 3.25)}" fill="none" stroke-width="${(.3 * s).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else {
      g = `<circle cx="${(cx - .3 * s).toFixed(1)}" cy="${(top + 1.55 * s).toFixed(1)}" r="${(.27 * s).toFixed(1)}" stroke="none"/>` +
        `<path d="M${P(-.4, 1.65)}Q${P(0, 1.95)} ${P(.4, 1.3)}L${P(-.05, 3.05)}" fill="none" stroke-width="${(.2 * s).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (dotted) g += `<circle cx="${(cx + .75 * s).toFixed(1)}" cy="${(top + 1.5 * s).toFixed(1)}" r="${(.16 * s).toFixed(1)}" stroke="none"/>`;
    return `<g class="rest">${g}</g>`;
  }

  function lineSvg(barIdxs, s, W, isLast, sg = song, justify = false) {
    const head = lead(sg, barIdxs[0]);
    const natural = (head + barIdxs.reduce((sum, b) => sum + barUnits(sg.bars[b]), 0)) * s;
    // Justified (printed cards): the notes take up the slack so every full
    // line ends at the right edge.
    const fixed = (head + barIdxs.length) * s;
    const stretch = justify ? clamp((W - fixed - 1) / (natural - fixed), 1, 1.9) : clamp(W / natural, 1, 1.4);
    const H = ROW_U * s;
    const top = 1.75 * s;
    const bottom = top + 4 * s;
    let x = CLEF_U * s;
    let body = '';

    if (barIdxs[0] === 0) {
      const [up, down] = sg.time.split('/');
      const fs = 2.55 * s;
      body += `<text class="tsig" x="${(x + .8 * s).toFixed(1)}" y="${(top + 1.95 * s).toFixed(1)}" font-size="${fs.toFixed(1)}">${up}</text>` +
        `<text class="tsig" x="${(x + .8 * s).toFixed(1)}" y="${(top + 3.95 * s).toFixed(1)}" font-size="${fs.toFixed(1)}">${down}</text>`;
      x += TSIG_U * s;
    }

    barIdxs.forEach((b, bi) => {
      x += .35 * s;
      sg.bars[b].forEach(n => {
        const w = unit(n.beats) * s * stretch;
        const cx = x + s;
        if (!n.key) {
          body += restSvg(cx, top, s, n.beats);
          x += w;
          return;
        }
        const cy = bottom - stepOf(n.key) * s / 2;
        const c = COLORS[n.key - 1];
        const r = (n.beats < 1 ? .74 : .86) * s;
        let g = `<g class="n" data-i="${n.i}" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">`;
        if (n.key === 1) g += `<path class="ledger" d="M${-1.35 * s} 0H${1.35 * s}" stroke-width="${Math.max(1.2, s * .08)}"/>`;
        g += `<g class="b"><circle class="halo" r="${r}" stroke="${c}"/><g class="hd">`;
        if (n.beats > 1) {
          g += `<rect x="0" y="${-.3 * s}" width="${(w - 1.25 * s).toFixed(1)}" height="${.6 * s}" rx="${.3 * s}" fill="${c}" opacity=".42"/>`;
        }
        g += `<circle r="${r}" fill="${c}"/><text class="num${LIGHT[n.key - 1] ? ' l' : ''}" font-size="${(n.beats < 1 ? .9 : 1.05) * s}" dy=".36em">${n.key}</text></g></g></g>`;
        body += g;
        x += w;
      });
      x += .65 * s;
      const end = isLast && bi === barIdxs.length - 1;
      body += `<path class="barline" d="M${x.toFixed(1)} ${top}V${bottom}" stroke-width="${end ? s * .14 : Math.max(1.2, s * .07)}"/>`;
      if (end) body += `<path class="barline" d="M${(x - s * .35).toFixed(1)} ${top}V${bottom}" stroke-width="${Math.max(1.2, s * .07)}"/>`;
    });

    let staff = '';
    for (let i = 0; i < 5; i++) staff += `M0 ${top + i * s}H${x.toFixed(1)}`;

    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">` +
      `<path class="staff" d="${staff}" stroke-width="${Math.max(1, s * .07)}"/>` +
      clefSvg(.25 * s, top, s) +
      body + '</svg>';
  }

  function relayout() {
    if (!song || $('#song').hidden) return;
    layout = computeLayout();
    if (!layout) return;
    const { s, W, lineH, lines } = layout;
    const lastBar = song.bars.length - 1;
    const strip = $('#strip');
    strip.innerHTML = lines.map((line, i) =>
      `<div class="line" style="top:${(i * lineH + 6).toFixed(1)}px;height:${lineH.toFixed(1)}px">` +
      lineSvg(line, s, W, line.includes(lastBar), song, true).replace('<svg ', `<svg style="top:${((lineH - ROW_U * s) / 2).toFixed(1)}px" `) +
      '</div>'
    ).join('');
    strip.style.height = lines.length * lineH + 12 + 'px';
    scrollStrip(true);
    markNotes();
  }

  // Keep the current line on top; stop once the last line is in view.
  function scrollStrip(instant) {
    if (!layout) return;
    const note = song.flat[Math.min(pos, song.flat.length - 1)];
    const { lineH, lines, H } = layout;
    const shift = clamp(layout.lineOfBar[note.bar] * lineH, 0, Math.max(0, lines.length * lineH + 12 - H));
    const strip = $('#strip');
    strip.classList.toggle('instant', !!instant);
    strip.style.transform = `translateY(${-shift.toFixed(1)}px)`;
    if (instant) void strip.offsetHeight;
  }

  function markNotes() {
    $$('#sheet .n').forEach(el => {
      const i = Number(el.dataset.i);
      el.classList.toggle('cur', i === pos);
      el.classList.toggle('done', i < pos);
    });
  }

  function update() {
    if (!song) return;
    const total = song.flat.length;
    markNotes();
    scrollStrip(false);

    const expected = pos < total ? song.flat[pos].key : 0;
    $$('#keys .key').forEach((el, i) => el.classList.toggle('next', i + 1 === expected && !listenRun));

    $('#listen').innerHTML = listenRun ? ICONS.stop + 'Stop the melody' : ICONS.speaker + 'Play the melody';
    $('#along').classList.toggle('off', !along.on);
    $('#along').setAttribute('aria-label', along.on ? 'Listening. Tap to pause' : 'Tap to play along');
    $$('[data-voice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.voice === prefs.voice)));
    $$('[data-tempo]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.tempo) === prefs.tempo)));
  }

  function sparkle(i) {
    const el = $(`#sheet .n[data-i="${i}"]`);
    if (!el || reducedMotion) return;
    const s = layout.s;
    const c = COLORS[song.flat[i].key - 1];
    let d = '';
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 4 * k;
      d += `M${(Math.cos(a) * s * 1.1).toFixed(1)} ${(Math.sin(a) * s * 1.1).toFixed(1)}L${(Math.cos(a) * s * 1.7).toFixed(1)} ${(Math.sin(a) * s * 1.7).toFixed(1)}`;
    }
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', c);
    path.setAttribute('stroke-width', String(s * .18));
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('class', 'spark');
    el.append(path);
    setTimeout(() => path.remove(), 700);
  }

  // ---------- Card preview ----------

  let preview = null;

  function stopPreview() {
    if (!preview) return;
    const { bus, timers, card, song: s } = preview;
    timers.forEach(clearTimeout);
    if (actx && actx.state !== 'closed') {
      bus.gain.setTargetAtTime(0, actx.currentTime, .02);
      setTimeout(() => bus.disconnect(), 250);
    }
    card.classList.remove('playing');
    card.style.removeProperty('--glow');
    card.querySelectorAll('.prog, .floaty').forEach(el => el.remove());
    card.querySelector('.card-staff').innerHTML = miniStaff(s);
    card.querySelector('.peek').innerHTML = ICONS.play;
    preview = null;
  }

  // One beat on the card: the picture bounces and a note floats up.
  function bop(card, key) {
    if (reducedMotion) return;
    const scene = card.querySelector('.card-scene');
    scene.querySelector('svg').animate(
      [{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: 'cubic-bezier(.3, 1.5, .5, 1)' }
    );
    const note = document.createElement('span');
    note.className = 'floaty';
    note.textContent = key % 3 ? '\u266A' : '\u266B';
    note.style.left = 8 + Math.random() * 62 + '%';
    note.style.setProperty('--dx', (Math.random() * 36 - 18).toFixed(0) + 'px');
    note.style.setProperty('--r', (Math.random() * 40 - 20).toFixed(0) + 'deg');
    scene.append(note);
    setTimeout(() => note.remove(), 1400);
  }

  function togglePreview(s, card) {
    const same = preview && preview.card === card;
    stopPreview();
    if (same || !ensureAudio()) return;

    const bus = actx.createGain();
    bus.connect(master);
    const beat = 60 / prefs.tempo;
    const start = actx.currentTime + .08;
    const staff = card.querySelector('.card-staff');
    staff.innerHTML = miniStaff(s, true);
    const roll = staff.querySelector('.roll');
    const dots = roll.querySelectorAll('circle');
    const timers = [];
    let t = start;
    card.style.setProperty('--step', Math.min(.3, beat * .6).toFixed(2) + 's');

    const line = timeline(s, beat);
    s.flat.forEach((n, i) => {
      const { t: at, dur, vel } = line.at[i];
      t = start + at - line.at[0].t;
      tone(n.key, t, dur, bus, vel);
      timers.push(setTimeout(() => {
        roll.style.transform = `translateX(${-i * ROLL_DX}px)`;
        if (i) dots[i - 1].classList.remove('lit');
        dots[i].classList.add('lit');
        card.style.setProperty('--glow', COLORS[n.key - 1]);
        bop(card, n.key);
      }, (t - actx.currentTime) * 1000));
    });
    t = start + line.end - line.at[0].t;
    const end = (t - actx.currentTime) * 1000;
    timers.push(setTimeout(stopPreview, end + 250));

    const bar = document.createElement('i');
    bar.className = 'prog';
    card.querySelector('.card-scene').append(bar);
    bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
      { duration: end, delay: 0, easing: 'linear', fill: 'forwards' });

    preview = { bus, timers, card, song: s };
    card.classList.add('playing');
    card.querySelector('.peek').innerHTML = ICONS.stop;
  }

  function openSong(id) {
    stopPreview();
    const next = SONGS.find(s => s.id === id);
    if (!next) return openHome();
    if (song !== next) {
      stopListen();
      stopAlong();
      song = next;
      pos = 0;
      const recent = store.get('lp-recent', []).filter(id => id !== song.id);
      store.set('lp-recent', recent.concat(song.id).slice(-6));
    }
    $('#songTitle').textContent = song.title;
    $('#bannerArt').innerHTML = sceneSvg(song.id);
    showScreen('song');
    relayout();
    update();
    // Playing along is the point; start listening straight away.
    if (!along.on && !listenRun && $('#yay').hidden) autoAlong();
  }

  function autoAlong() {
    if (!cal[prefs.voice] && !cal.piano && !askedThisSession) {
      $('#ask').hidden = false;
      return;
    }
    startAlong();
  }

  // ---------- Listen (the app plays the melody) ----------

  function startListen() {
    stopAlong();
    if (!ensureAudio()) return;
    if (pos >= song.flat.length) pos = 0;

    const beat = 60 / prefs.tempo;
    const busGain = actx.createGain();
    busGain.connect(master);
    const from = pos;
    const line = timeline(song, beat);
    const t0 = actx.currentTime + .12 - line.at[from].t;
    const times = [];

    for (let i = from; i < song.flat.length; i++) {
      const { t, dur, vel } = line.at[i];
      times.push(t0 + t);
      tone(song.flat[i].key, t0 + t, dur, busGain, vel);
    }

    listenRun = { from, times, end: t0 + line.end, bus: busGain, raf: 0, shown: -1 };
    const step = () => {
      if (!listenRun) return;
      const now = actx.currentTime;
      if (now >= listenRun.end) {
        stopListen();
        pos = 0;
        update();
        startAlong();
        return;
      }
      let i = 0;
      while (i + 1 < times.length && times[i + 1] <= now) i++;
      if (now >= times[0] && i !== listenRun.shown) {
        listenRun.shown = i;
        pos = from + i;
        const keyEl = $$('#keys .key')[song.flat[pos].key - 1];
        flash(keyEl, Math.min(400, song.flat[pos].beats * beat * 600));
        update();
      }
      listenRun.raf = requestAnimationFrame(step);
    };
    listenRun.raf = requestAnimationFrame(step);
    update();
  }

  function stopListen() {
    if (!listenRun) return;
    cancelAnimationFrame(listenRun.raf);
    const bus = listenRun.bus;
    if (actx && actx.state !== 'closed') {
      bus.gain.setTargetAtTime(0, actx.currentTime, .02);
      setTimeout(() => bus.disconnect(), 250);
    }
    listenRun = null;
    update();
  }

  // ---------- Play along (the app follows the real piano) ----------

  let askedThisSession = false;

  async function startAlong() {
    stopListen();
    if (!await micStart()) return;
    if (pos >= song.flat.length) pos = 0;
    along.on = true;
    resetDetector();
    syncMicPickers();
    update();
  }

  function stopAlong() {
    if (!along.on) return;
    along.on = false;
    setLight(0);
    micStop();
    update();
  }

  // A note counts once per strike, then one key must hold steady. A strike is
  // a rise out of silence, or a rise after the level has dipped below its
  // peak. The toy's notes swell in over up to ~150 ms; without a dip that
  // swell is still the same note.
  function alongFrame(key, rms, t) {
    setHeard(key);
    setLight(rms > mic.noise * 2 ? Math.round(clamp(20 * Math.log10(rms / (mic.noise * 2)) / 6, 0, 5)) : 0);

    const quiet = rms < mic.noise * 2;
    const dipped = det.valley < det.peak * .85 || det.peak < mic.noise * 4;
    const strike = !quiet && dipped && rms > det.valley * 1.5 &&
      rms > Math.max(.0006, mic.noise * 3) && t - det.onset > 150;

    if (quiet || rms > det.peak) {
      det.peak = rms;
      det.valley = rms;
    } else {
      det.valley = Math.min(det.valley, rms);
    }

    if (strike) {
      dlog('ONSET rms=' + rms.toFixed(4) + ' valley=' + det.valley.toFixed(4) + ' peak=' + det.peak.toFixed(4));
      det.onset = t;
      det.peak = rms;
      det.valley = rms;
      det.armed = true;
      det.cand = 0;
      det.n = 0;
    }

    // A different key that holds steady is a new note even without a level
    // jump: a quiet key (6–8 on the toy) over a loud ringing one never jumps.
    det.sn = key && key === det.sk ? det.sn + 1 : 1;
    det.sk = key;
    // Keys 1 and 8 are an octave apart and blur together while ringing, so
    // that change still needs a real strike.
    // A key played moments ago may resurface when a quieter key stops
    // (the toy's keys 6–8 are short and quiet); it must be struck again.
    const octave = Math.abs(key - det.last) === 7;
    const ringing = t - (det.played[key] || -1e9) < 1500;
    if (!det.armed && key && key !== det.last && !octave && !ringing && det.sn >= 3 && t - det.onset > 120) {
      det.onset = t;
      det.peak = rms;
      det.valley = rms;
      det.last = key;
      det.lastAt = t;
      det.played[key] = t;
      dlog('CHANGE key=' + key);
      heardNote(key);
      return;
    }

    if (!det.armed) return;
    if (t - det.onset > 320) {
      det.armed = false;
      return;
    }

    det.n = key && key === det.cand ? det.n + 1 : 1;
    det.cand = key;
    if (key && det.n >= 2) {
      det.armed = false;
      // The same key again this soon is the tail end of one press.
      if (key === det.last && t - det.lastAt < 350) return;
      det.last = key;
      det.lastAt = t;
      det.played[key] = t;
      heardNote(key);
    }
  }

  let lit = -1;
  function setLight(n) {
    if (n === lit) return;
    lit = n;
    $$('#along i').forEach((dot, i) => dot.classList.toggle('lit', i < n));
  }

  function heardNote(key) {
    const expected = song.flat[pos]?.key;
    dlog('NOTE heard=' + key + ' expected=' + expected);
    if (!expected) return;

    if (key === expected) {
      sparkle(pos);
      pos++;
      if (pos >= song.flat.length) {
        stopAlong();
        celebrate();
      }
      update();
      return;
    }

    const keyEl = $$('#keys .key')[key - 1];
    keyEl.classList.remove('wrong');
    void keyEl.offsetWidth;
    keyEl.classList.add('wrong');
    const noteEl = $(`#sheet .n[data-i="${pos}"]`);
    if (noteEl) {
      noteEl.classList.remove('nudge');
      void noteEl.getBoundingClientRect();
      noteEl.classList.add('nudge');
      setTimeout(() => noteEl.classList.remove('nudge'), 450);
    }
  }

  // Anything but this song and the three before it, at random.
  function suggestSong() {
    const skip = store.get('lp-recent', []).slice(-4);
    const pool = SONGS.filter(s => s !== song && !skip.includes(s.id));
    const pick = (pool.length ? pool : SONGS.filter(s => s !== song));
    return pick[Math.floor(Math.random() * pick.length)];
  }

  function celebrate() {
    const next = suggestSong();
    const card = $('#nextSong');
    card.dataset.id = next.id;
    card.innerHTML = `<span class="art">${sceneSvg(next.id)}</span><span>${esc(next.title)}</span><span class="go">${ICONS.play}</span>`;
    card.setAttribute('aria-label', 'Next song: ' + next.title);
    $('#yay').hidden = false;
    if (reducedMotion) return;
    const box = document.createElement('div');
    box.className = 'confetti';
    for (let i = 0; i < 70; i++) {
      const piece = document.createElement('i');
      piece.style.setProperty('--x', Math.random() * 100 + '%');
      piece.style.setProperty('--c', COLORS[i % 8]);
      piece.style.setProperty('--d', (1.6 + Math.random() * 1.4).toFixed(2) + 's');
      piece.style.setProperty('--w', (Math.random() * .5).toFixed(2) + 's');
      piece.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
      piece.style.setProperty('--r', (Math.random() * 900 - 450).toFixed(0) + 'deg');
      box.append(piece);
    }
    document.body.append(box);
    setTimeout(() => box.remove(), 3600);
  }

  // ---------- Tuning wizard ----------

  const tune = {
    live: false,
    voice: prefs.voice,
    mode: 'step',
    step: 0,
    freqs: DEFAULT.slice(),
    got: [],
    run: [],
    count: 0,
    busy: false,
    returnTo: '',
    hist: [],
    heard: 0,
    lastKey: -1,
    lastAt: 0
  };
  const NEED = 8;
  const WINDOW = 700;

  function openTune() {
    stopPreview();
    stopListen();
    stopAlong();
    if (mic.on || mic.starting) micStop();
    tune.live = false;
    tune.voice = prefs.voice;
    showScreen('tune');
    renderTuneIntro();
  }

  function renderTuneIntro() {
    $('#tuneIntro').hidden = false;
    $('#tuneLive').hidden = true;
    $('#tune').classList.remove('listening');
    $('#tdots').innerHTML = '';
    $$('[data-tvoice]').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.tvoice === tune.voice));
      b.querySelector('.badge').innerHTML = ICONS[b.dataset.tvoice];
    });
    $('#tuneReset').hidden = !cal[tune.voice];
  }

  async function tuneStart() {
    prefs.voice = tune.voice;
    savePrefs();
    if (!await micStart()) return;
    tune.freqs = freqsFor(tune.voice).slice();
    tune.got = Array(8).fill(false);
    tune.step = 0;
    tune.mode = 'step';
    tune.run = [];
    tune.hist = [];
    tune.live = true;
    $('#tuneIntro').hidden = true;
    $('#tuneLive').hidden = false;
    $('#tune').classList.add('listening');
    buildKeys($('#miniKeys'), true);
    sizeCanvas();
    renderTuneStep();
  }

  function renderTuneStep() {
    const i = tune.step;
    const testing = tune.mode === 'test';
    $('#tdots').innerHTML = COLORS.map((c, k) =>
      `<i style="--c:${c}" class="${tune.got[k] ? 'got' : ''} ${!testing && k === i ? 'at' : ''}"></i>`
    ).join('');

    const target = $('#target');
    target.hidden = testing;
    target.classList.remove('got');
    target.style.setProperty('--c', COLORS[i] || COLORS[0]);
    $('#tdot').textContent = testing ? '' : i + 1;
    $('#tdot').className = 'tdot' + (LIGHT[i] ? ' l' : '');
    setRing(0);

    $('#prompt').textContent = testing ? 'Press any key to test' : 'Press key ' + (i + 1);
    $('#tmsg').textContent = '';
    $$('#miniKeys .key').forEach((el, k) => el.classList.toggle('aim', !testing && k === i));
    renderHzRow();

    $('#tnav').innerHTML = testing
      ? '<button class="btn" data-t="redo">Tune again</button><button class="btn primary" data-t="done">Done</button>'
      : '<button class="btn" data-t="back"' + (i === 0 ? ' disabled' : '') + '>Back</button><button class="btn" data-t="skip">Skip</button>';
  }

  function renderHzRow() {
    $('#hzRow').innerHTML = tune.freqs.map((f, k) =>
      `<span class="${tune.got[k] ? 'got' : ''}">${Math.round(f)}</span>`
    ).join('');
  }

  function setRing(p) {
    $('#ring').style.strokeDashoffset = String(414.7 * (1 - p));
  }

  function tuneFrame(hz, rms, t, key) {
    tune.hist.push(hz);
    if (tune.hist.length > 240) tune.hist.shift();

    if (key !== tune.heard) {
      tune.heard = key;
      $$('#miniKeys .key').forEach((el, k) => el.classList.toggle('heard', key === k + 1));
    }

    // Decibel scale: the quietest keys still visibly move the meter.
    $('#meter').style.width = clamp(20 * Math.log10(rms / .0003) * 2, 0, 100).toFixed(1) + '%';
    $('#hzOut').textContent = hz ? hz.toFixed(1) + ' Hz · ' + noteName(hz) : (rms > mic.noise * 3 ? 'Hearing sound…' : 'Listening…');
    const chip = $('#keyOut');
    chip.textContent = key ? 'Key ' + key : '–';
    chip.style.setProperty('--c', key ? COLORS[key - 1] : '#efe8f3');
    chip.classList.toggle('l', !!key && LIGHT[key - 1]);
    drawTrace();

    if (tune.mode !== 'step' || tune.busy) return;

    // Detections from the last ~0.7 s, so dropouts, a short note or a second
    // press all add up instead of starting over.
    tune.skip = hz && !fitsBetween(hz);
    if (hz && !tune.skip) tune.run.push({ t, hz });
    tune.run = tune.run.filter(r => t - r.t < WINDOW);
    const best = steadyPitch(tune.run.map(r => r.hz));
    tune.count = best.count;

    setRing(Math.min(1, best.count / NEED));
    if (best.count >= NEED) capture(best.hz);
  }

  // Keys rise from left to right, so key N must sound above the tuned keys to
  // its left and below those to its right. This drops the still-ringing
  // previous key, and the low "chord" pitch it makes together with the new one.
  function fitsBetween(hz) {
    const margin = 2 ** (35 / 1200);
    let lo = 0;
    let hi = Infinity;
    tune.got.forEach((got, k) => {
      if (!got) return;
      if (k < tune.step) lo = Math.max(lo, tune.freqs[k]);
      if (k > tune.step) hi = Math.min(hi, tune.freqs[k]);
    });
    return hz > lo * margin && hz < hi / margin;
  }

  // Largest group of detections within ±40 cents of each other. Octave slips
  // count toward the group; the answer uses the octave most of them agree on.
  function steadyPitch(list) {
    let top = { count: 0, hz: 0 };
    list.forEach(anchor => {
      const members = [];
      list.forEach(hz => {
        const c = cents(hz, anchor);
        const oct = Math.round(c / 1200);
        if (Math.abs(c - oct * 1200) < 40) members.push({ hz, oct });
      });
      if (members.length <= top.count) return;
      const votes = {};
      members.forEach(m => { votes[m.oct] = (votes[m.oct] || 0) + 1; });
      const oct = Number(Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0]);
      top = { count: members.length, hz: median(members.map(m => m.hz / 2 ** m.oct)) * 2 ** oct };
    });
    return top;
  }

  function capture(f) {
    const i = tune.step;
    tune.run = [];
    dlog('CAPTURE? key=' + (i + 1) + ' hz=' + f.toFixed(1));

    const clash = tune.got.findIndex((got, k) => got && k !== i && Math.abs(cents(f, tune.freqs[k])) < 50);
    // The key captured a moment ago may still be ringing; that is no mistake.
    if (clash >= 0 && clash === tune.lastKey && performance.now() - tune.lastAt < 2500) {
      dlog('IGNORE still ringing key=' + (clash + 1));
      setRing(0);
      return;
    }
    if (clash >= 0) {
      dlog('REJECT sounds like key=' + (clash + 1));
      $('#tmsg').textContent = 'That sounded like key ' + (clash + 1) + '. Try key ' + (i + 1) + '.';
      setRing(0);
      return;
    }

    tune.freqs[i] = Math.round(f * 10) / 10;
    tune.got[i] = true;
    tune.lastKey = i;
    tune.lastAt = performance.now();
    cal[tune.voice] = tune.freqs.slice();
    saveCal();
    renderHzRow();
    $('#tmsg').textContent = '';
    $('#target').classList.add('got');
    tune.busy = true;

    setTimeout(() => {
      tune.busy = false;
      if (!tune.live) return;
      if (i >= 7) tune.mode = 'test';
      else tune.step = i + 1;
      renderTuneStep();
    }, 750);
  }

  function sizeCanvas() {
    const canvas = $('#trace');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  }

  function drawTrace() {
    const canvas = $('#trace');
    const g = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    if (!w || !h) return;
    const dpr = window.devicePixelRatio || 1;
    const lo = Math.log2(Math.min(...tune.freqs) / 1.3);
    const hi = Math.log2(Math.max(...tune.freqs) * 1.3);
    const y = hz => h - (Math.log2(hz) - lo) / (hi - lo) * h;

    g.clearRect(0, 0, w, h);
    g.lineWidth = 2 * dpr;
    tune.freqs.forEach((f, k) => {
      g.strokeStyle = COLORS[k];
      g.globalAlpha = tune.got[k] ? .9 : .4;
      g.setLineDash(tune.got[k] ? [] : [5 * dpr, 5 * dpr]);
      const lx = (k % 2 ? 30 : 12) * dpr;
      g.beginPath();
      g.moveTo(lx + 10 * dpr, y(f));
      g.lineTo(w, y(f));
      g.stroke();
      g.globalAlpha = 1;
      g.fillStyle = COLORS[k];
      g.beginPath();
      g.arc(lx, y(f), 8 * dpr, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = LIGHT[k] ? '#fff' : '#231c33';
      g.font = `800 ${10 * dpr}px ui-rounded, system-ui, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(k + 1), lx, y(f) + .5 * dpr);
    });
    g.setLineDash([]);

    const n = tune.hist.length;
    const step = (w - 46 * dpr) / 240;
    for (let i = 0; i < n; i++) {
      const hz = tune.hist[i];
      if (!hz) continue;
      const k = classify(hz, tune.freqs);
      g.fillStyle = k ? COLORS[k - 1] : '#9a8fa8';
      const r = (i === n - 1 ? 5 : 2.6) * dpr;
      g.beginPath();
      g.arc(46 * dpr + i * step, clamp(y(hz), r, h - r), r, 0, Math.PI * 2);
      g.fill();
    }
  }

  function closeTune() {
    tune.live = false;
    micStop();
    const back = tune.returnTo;
    tune.returnTo = '';
    if (back.startsWith('#song/')) micStart(); // still inside the tap
    location.hash = back;
  }

  // ---------- Screens & routing ----------

  let homeScroll = 0;
  let prevRoute = null;

  function showScreen(id) {
    if (!$('#home').hidden) homeScroll = $('#home').scrollTop;
    ['home', 'song', 'tune'].forEach(s => { $('#' + s).hidden = s !== id; });
    $('#pop').hidden = true;
    if (id === 'home') $('#home').scrollTop = homeScroll;
  }

  function openHome() {
    stopListen();
    stopAlong();
    tune.live = false;
    if (mic.on) micStop();
    $('.tune-btn .dot').hidden = !!(cal.piano || cal.xylo);
    showScreen('home');
  }

  // Keep the screen on while playing: hands are on the toy, not the phone.
  let wake = null;
  let wanting = false;
  async function keepAwake(on) {
    wanting = on;
    try {
      if (on && !wake && navigator.wakeLock && document.visibilityState === 'visible') {
        wake = 'pending';
        const lock = await navigator.wakeLock.request('screen');
        lock.addEventListener('release', () => { if (wake === lock) wake = null; });
        wake = lock;
        if (!wanting) keepAwake(false);
      } else if (!on && wake && wake !== 'pending') {
        const lock = wake;
        wake = null;
        await lock.release();
      }
    } catch (_) {
      wake = null;
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && wanting) keepAwake(true);
  });

  function route(animate = true) {
    const hash = location.hash;
    keepAwake(/^#(song\/|tune)/.test(hash));
    const match = hash.match(/^#song\/(\w+)/);
    const cardId = match ? match[1] : (song && /^#song\//.test(prevRoute || '') && !hash ? song.id : null);
    prevRoute = hash;

    const apply = () => {
      if (match) openSong(match[1]);
      else if (hash === '#tune') openTune();
      else openHome();
    };

    const card = cardId && document.querySelector(`.card[data-id="${cardId}"]`);
    if (!animate || !document.startViewTransition || reducedMotion || !card) {
      apply();
      return;
    }

    const name = on => {
      card.querySelector('.card-staff').style.viewTransitionName = on ? 'book' : '';
      card.querySelector('.card-scene').style.viewTransitionName = on ? 'banner' : '';
    };
    name(true);
    const vt = document.startViewTransition(() => {
      apply();
      // The card is hidden while the song is open; only one element may own each name.
      if (match) name(false);
    });
    vt.finished.finally(() => name(false));
  }

  function toast(text) {
    $$('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = text;
    document.body.append(t);
    setTimeout(() => t.remove(), 3800);
  }

  // ---------- Wire up ----------

  SONGS.forEach((s, i) => {
    // A div, not a button: it holds the preview button.
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = s.id;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.style.setProperty('--tilt', (((i * 37) % 7) - 3) * .45 + 'deg');
    card.setAttribute('aria-label', s.title);
    card.innerHTML =
      `<div class="card-staff">${miniStaff(s)}</div>` +
      `<div class="card-scene">${sceneSvg(s.id)}<span class="card-title">${esc(s.title)}</span></div>` +
      '<i class="hole l"></i><i class="hole r"></i>' +
      `<button class="peek" aria-label="Preview ${esc(s.title)}">${ICONS.play}</button>`;
    const open = () => {
      stopPreview();
      micStart(); // inside the tap, so iOS lets the microphone's audio run
      location.hash = '#song/' + s.id;
    };
    card.onclick = open;
    card.onkeydown = e => {
      if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open();
      }
    };
    card.querySelector('.peek').onclick = e => {
      e.stopPropagation();
      togglePreview(s, card);
    };
    $('#shelf').append(card);
  });

  buildKeys($('#keys'), false);
  $('#keys').addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  $$('[data-voice]').forEach(b => { b.innerHTML = ICONS[b.dataset.voice]; });

  $('#back').onclick = () => {
    if (prevRouteBeforeSong === '') history.back();
    else location.hash = '';
  };

  let prevRouteBeforeSong = null;
  window.addEventListener('hashchange', () => {
    if (/^#song\//.test(location.hash) && !/^#song\//.test(prevRoute || '')) {
      prevRouteBeforeSong = prevRoute === null ? null : prevRoute.replace('#', '');
    }
    route(true);
  });

  $('#sheet').addEventListener('click', e => {
    const n = e.target.closest('.n');
    if (!n) return;
    stopListen();
    pos = Number(n.dataset.i);
    resetDetector();
    update();
    if (!along.on && ensureAudio()) tone(song.flat[pos].key, actx.currentTime + .005, .45);
  });

  const setPop = open => {
    const pop = $('#pop');
    const gear = $('#gear');
    if (open) {
      const r = gear.getBoundingClientRect();
      pop.style.top = r.bottom + 10 + 'px';
      pop.style.right = Math.max(12, innerWidth - r.right) + 'px';
      refreshDevices();
    }
    pop.hidden = !open;
    gear.setAttribute('aria-expanded', String(open));
  };

  $('#gear').onclick = e => {
    e.stopPropagation();
    setPop($('#pop').hidden);
  };

  document.addEventListener('pointerdown', e => {
    if (!$('#pop').hidden && !e.target.closest('#pop, #gear')) setPop(false);
  });

  $('#popTune').onclick = () => {
    setPop(false);
    tune.returnTo = location.hash;
    location.hash = '#tune';
  };

  $('#listen').onclick = () => {
    setPop(false);
    if (listenRun) stopListen();
    else startListen();
  };

  $('#along').onclick = () => (along.on ? stopAlong() : autoAlong());

  $('#restart').onclick = () => {
    stopListen();
    pos = 0;
    resetDetector();
    update();
  };

  $$('[data-voice]').forEach(b => {
    b.onclick = () => {
      prefs.voice = b.dataset.voice;
      savePrefs();
      resetDetector();
      update();
      if (ensureAudio()) tone(song.flat[Math.min(pos, song.flat.length - 1)].key, actx.currentTime + .005, .4);
    };
  });

  $$('[data-tempo]').forEach(b => {
    b.onclick = () => {
      prefs.tempo = Number(b.dataset.tempo);
      savePrefs();
      if (listenRun) {
        stopListen();
        startListen();
      }
      update();
    };
  });

  $('#askTune').onclick = () => {
    $('#ask').hidden = true;
    tune.returnTo = location.hash;
    location.hash = '#tune';
  };

  $('#askSkip').onclick = () => {
    $('#ask').hidden = true;
    askedThisSession = true;
    startAlong();
  };

  $('#again').onclick = () => {
    $('#yay').hidden = true;
    pos = 0;
    update();
    startAlong();
  };

  $('#nextSong').onclick = () => {
    $('#yay').hidden = true;
    micStart(); // inside the tap, so iOS lets the microphone's audio run
    // Replace the finished song, so back still leads to the overview.
    location.replace('#song/' + $('#nextSong').dataset.id);
  };

  $('#yayClose').onclick = () => {
    $('#yay').hidden = true;
    pos = 0;
    location.hash = '';
  };

  $('#tuneBtn').onclick = () => {
    tune.returnTo = '';
    location.hash = '#tune';
  };

  // ---------- Print: song cards, four A6 on each A4 ----------

  const printPick = new Set([].concat(store.get('lp-print', SONGS.map(x => x.id))).filter(id => SONGS.some(x => x.id === id)));

  function renderPick() {
    const n = SONGS.filter(x => printPick.has(x.id)).length;
    const sheets = Math.ceil(n / 4);
    $('#pickAll').textContent = n === SONGS.length ? 'None' : 'All';
    $('#pickInfo').textContent = n ? `${sheets} A4 ${sheets === 1 ? 'sheet' : 'sheets'}, cut on the dashed lines` : 'Pick the songs to print';
    $('#pickGo').innerHTML = `${ICONS.printer}<span>Print ${n || ''} ${n === 1 ? 'card' : 'cards'}</span>`;
    $('#pickGo').disabled = !n;
    store.set('lp-print', [...printPick]);
  }

  function openPick() {
    stopPreview();
    $('#pickList').innerHTML = SONGS.map(x =>
      `<label class="pick-row"><input type="checkbox" value="${x.id}"${printPick.has(x.id) ? ' checked' : ''}>` +
      `<span class="art">${sceneSvg(x.id)}</span><span>${esc(x.title)}</span><i class="tick">${ICONS.check}</i></label>`
    ).join('');
    renderPick();
    $('#printPick').hidden = false;
  }

  function printCard(sg) {
    // Music area of an A6 card in CSS px (1px = 0.26mm when printed).
    const W = 344;
    const H = 312;
    const lay = bestLayout(sg, W, o => {
      const s = Math.min(14, o.s, H / (o.lines.length * ROW_U));
      return { ...o, s, score: s * (o.even ? 1 : .85) };
    });
    const s = lay.s;
    const last = sg.bars.length - 1;
    // One drawing for all lines, so it shrinks to fit if the page is smaller.
    const rowH = ROW_U * s;
    const music = `<svg viewBox="0 0 ${W} ${(lay.lines.length * rowH).toFixed(1)}" preserveAspectRatio="xMidYMid meet">` +
      lay.lines.map((line, i) => lineSvg(line, s, W, line.includes(last), sg, true)
        .replace('<svg ', `<svg y="${(i * rowH).toFixed(1)}" `)).join('') + '</svg>';
    const keys = COLORS.map((c, i) => `<i style="background:${c};color:${LIGHT[i] ? '#fff' : '#231c33'}">${i + 1}</i>`).join('');
    return `<div class="pc"><div class="pc-art">${sceneSvg(sg.id)}<span>${esc(sg.title)}</span></div>` +
      `<div class="pc-music">${music}</div><div class="pc-keys">${keys}</div></div>`;
  }

  function printCards() {
    const picked = SONGS.filter(x => printPick.has(x.id));
    let html = '';
    for (let i = 0; i < picked.length; i += 4) {
      html += `<div class="pp">${picked.slice(i, i + 4).map(printCard).join('')}</div>`;
    }
    $('#printArea').innerHTML = html;
    $('#printPick').hidden = true;
    const go = () => window.print();
    if (document.fonts) document.fonts.ready.then(go, go);
    else go();
  }

  $('#printBtn').innerHTML = `${ICONS.printer}<span>Print song cards</span>`;
  $('#printBtn').onclick = openPick;
  $('#pickList').onchange = e => {
    printPick[e.target.checked ? 'add' : 'delete'](e.target.value);
    renderPick();
  };
  $('#pickAll').onclick = () => {
    const all = printPick.size !== SONGS.length;
    printPick.clear();
    if (all) SONGS.forEach(x => printPick.add(x.id));
    $$('#pickList input').forEach(box => { box.checked = all; });
    renderPick();
  };
  $('#pickClose').onclick = () => { $('#printPick').hidden = true; };
  $('#printPick').onclick = e => { if (e.target === e.currentTarget) $('#printPick').hidden = true; };
  $('#pickGo').onclick = printCards;

  $('#tuneClose').onclick = closeTune;
  $('#tuneStart').onclick = tuneStart;

  $$('[data-tvoice]').forEach(b => {
    b.onclick = () => {
      tune.voice = b.dataset.tvoice;
      renderTuneIntro();
    };
  });

  $('#tuneReset').onclick = () => {
    cal[tune.voice] = null;
    saveCal();
    renderTuneIntro();
    toast('Back to the standard pitches.');
  };

  $('#tnav').addEventListener('click', e => {
    const action = e.target.closest('[data-t]')?.dataset.t;
    if (!action) return;
    tune.run = [];
    tune.busy = false;
    if (action === 'back') tune.step = Math.max(0, tune.step - 1);
    if (action === 'skip') {
      if (tune.step >= 7) tune.mode = 'test';
      else tune.step++;
    }
    if (action === 'redo') {
      tune.mode = 'step';
      tune.step = 0;
      tune.got = Array(8).fill(false);
    }
    if (action === 'done') return closeTune();
    renderTuneStep();
  });

  // iOS unlocks audio on touchend/click, not on the first pointerdown.
  const unlock = () => {
    const ctx = ensureAudio();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('touchend', unlock, true);
      window.removeEventListener('click', unlock, true);
    }
  };
  window.addEventListener('touchend', unlock, true);
  window.addEventListener('click', unlock, true);

  let resizeQueued = false;
  new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      relayout();
      if (tune.live) sizeCanvas();
    });
  }).observe($('#book'));

  window.addEventListener('resize', () => { if (tune.live) sizeCanvas(); });

  const sleep = () => {
    stopPreview();
    stopListen();
    stopAlong();
    if (tune.live) {
      tune.live = false;
      micStop();
      renderTuneIntro();
    }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) sleep(); });
  window.addEventListener('pagehide', sleep);

  // Once the music font is in, re-measure the clef and redraw.
  const redrawClefs = () => {
    clefInk = null;
    $$('.card').forEach(card => {
      if (preview && preview.card === card) return;
      card.querySelector('.card-staff').innerHTML = miniStaff(SONGS.find(x => x.id === card.dataset.id));
    });
    relayout();
  };
  if (document.fonts) {
    document.fonts.load('100px "Noto Music"', CLEF).then(redrawClefs, () => {});
    document.fonts.ready.then(redrawClefs);
  }

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

  route(false);
}

const HTML = '<!doctype html>\n<html lang="en">\n<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="theme-color" content="#ffe6d4">\n' +
  '<meta name="mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n' +
  '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
  '<meta name="apple-mobile-web-app-title" content="Little Piano">\n' +
  '<title>Little Piano</title>\n' +
  '<link rel="manifest" href="/manifest.webmanifest">\n' +
  '<link rel="icon" href="/icon.svg" type="image/svg+xml">\n' +
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n' +
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Noto+Music&display=swap">\n' +
  '<style>' + CSS + '</style>\n</head>\n<body>\n' +
  '<noscript><p style="padding:20px">This songbook needs JavaScript.</p></noscript>\n' +
  BODY +
  '\n<script>(' + client.toString() + ')();</script>\n</body>\n</html>';

// Home-screen install: manifest, icons and an offline-capable service worker.
const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f03a40"/><stop offset="1" stop-color="#d11f27"/></linearGradient><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8e7c8"/><stop offset="1" stop-color="#f3dfbb"/></linearGradient></defs><rect width="512" height="512" fill="url(#r)"/><g fill="#fffdf8"><ellipse cx="200" cy="196" rx="34" ry="25" transform="rotate(-22 200 196)"/><ellipse cx="318" cy="174" rx="34" ry="25" transform="rotate(-22 318 174)"/><rect x="221" y="76" width="13" height="122" rx="4"/><rect x="339" y="54" width="13" height="122" rx="4"/><path d="M221 76 L352 54 L352 92 L221 114 Z"/></g><rect x="52" y="262" width="408" height="198" rx="30" fill="#b51b23"/><rect x="52" y="256" width="408" height="194" rx="30" fill="url(#w)"/><g><rect x="72" y="274" width="39" height="158" rx="11" fill="#ed1747"/><rect x="118" y="274" width="39" height="158" rx="11" fill="#ff8819"/><rect x="164" y="274" width="39" height="158" rx="11" fill="#ffd11e"/><rect x="210" y="274" width="39" height="158" rx="11" fill="#84ca2b"/><rect x="256" y="274" width="39" height="158" rx="11" fill="#17a5b1"/><rect x="302" y="274" width="39" height="158" rx="11" fill="#1974c5"/><rect x="348" y="274" width="39" height="158" rx="11" fill="#ef82b2"/><rect x="394" y="274" width="39" height="158" rx="11" fill="#e60057"/></g><g fill="#000" opacity=".16"><rect x="72" y="416" width="39" height="16" rx="8"/><rect x="118" y="416" width="39" height="16" rx="8"/><rect x="164" y="416" width="39" height="16" rx="8"/><rect x="210" y="416" width="39" height="16" rx="8"/><rect x="256" y="416" width="39" height="16" rx="8"/><rect x="302" y="416" width="39" height="16" rx="8"/><rect x="348" y="416" width="39" height="16" rx="8"/><rect x="394" y="416" width="39" height="16" rx="8"/></g><g fill="#fff" opacity=".35"><rect x="80" y="282" width="8" height="60" rx="4"/><rect x="126" y="282" width="8" height="60" rx="4"/><rect x="172" y="282" width="8" height="60" rx="4"/><rect x="218" y="282" width="8" height="60" rx="4"/><rect x="264" y="282" width="8" height="60" rx="4"/><rect x="310" y="282" width="8" height="60" rx="4"/><rect x="356" y="282" width="8" height="60" rx="4"/><rect x="402" y="282" width="8" height="60" rx="4"/></g></svg>';

const png = b64 => () => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

const MANIFEST = JSON.stringify({
  name: 'Little Piano',
  short_name: 'Little Piano',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'any',
  background_color: '#ffe6d4',
  theme_color: '#ffe6d4',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }
  ]
});

// Network first so a new deploy shows up on the next launch; the cache only
// answers when offline (or after 4 s on a bad connection). Fonts are cached
// on first use.
const SW = String.raw`
const CACHE = 'little-piano-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const put = (req, res) => caches.open(CACHE).then(c => c.put(req, res));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    const key = req.mode === 'navigate' ? '/' : url.pathname;
    const net = fetch(req).then(res => {
      if (res.ok) put(key, res.clone());
      return res;
    });
    const late = new Promise(r => setTimeout(r, 4000)).then(() => caches.match(key)).then(r => r || net);
    e.respondWith(Promise.race([net, late]).catch(() => caches.match(key).then(r => r || Response.error())));
  } else if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      put(req, res.clone());
      return res;
    })));
  }
});
`;

const ASSETS = {
  '/manifest.webmanifest': { type: 'application/manifest+json', body: () => MANIFEST, cache: 'no-cache' },
  '/sw.js': { type: 'text/javascript; charset=utf-8', body: () => SW, cache: 'no-cache' },
  '/icon.svg': { type: 'image/svg+xml', body: () => ICON_SVG },
  '/apple-touch-icon.png': { type: 'image/png', body: png('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') },
  '/icon-192.png': { type: 'image/png', body: png('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') },
  '/icon-512.png': { type: 'image/png', body: png('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') }
};
