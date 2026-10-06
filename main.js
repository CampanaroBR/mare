import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/* =========================================================
   MARÉ — concept product site
   Photography for the product, WebGL for the engineering,
   everything choreographed by one scroll value.
   ========================================================= */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const ramp = (v, a, b) => smooth(clamp((v - a) / (b - a)));
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverDevice = matchMedia('(hover: hover)').matches;
let isMobile = innerWidth <= 760;

/* =========================================================
   1. WebGL blueprint of the headphones (Inside section)
   ========================================================= */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0.2, 8.2);
camera.lookAt(0, 0, 0);

const INK = new THREE.Color('#efe9de'), ACC = new THREE.Color('#dcc59b');
const MAT = {
  fill: new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: .035, depthWrite: false, side: THREE.DoubleSide }),
  core: new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide }),
  line: new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: .42, depthWrite: false, blending: THREE.AdditiveBlending }),
  lineCore: new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: .95, depthWrite: false, blending: THREE.AdditiveBlending }),
};

const model = new THREE.Group(); scene.add(model);
const rig = new THREE.Group(); rig.position.y = -0.56; model.add(rig);
const v2 = a => a.map(([x, y]) => new THREE.Vector2(x, y));
const explodeParts = [];
const anchors = {};
const slots = [];
const markCore = o => o.traverse(c => c.userData.core = true);

function makeCup(side) {
  const slot = new THREE.Group(); slot.position.x = side * 1.0; rig.add(slot); slots.push(slot);
  const axis = new THREE.Group(); axis.rotation.z = -side * Math.PI / 2; slot.add(axis);
  const oval = new THREE.Group(); oval.scale.set(1.13, 1, 0.92); axis.add(oval);
  const add = (obj, t0, amt) => { obj.position.y = t0; oval.add(obj); explodeParts.push({ obj, t0, amt }); return obj; };
  const M = new THREE.MeshBasicMaterial();

  add(new THREE.Mesh(new THREE.LatheGeometry(v2([[.40, 0], [.452, .012], [.483, .06], [.496, .15], [.493, .25], [.476, .318], [.452, .352]]), 48), M), 0, 1.08);
  const capG = new THREE.Group();
  capG.add(new THREE.Mesh(new THREE.LatheGeometry(v2([[0, 0], [.43, 0], [.447, .012], [.452, .03], [.44, .048], [.33, .058], [0, .061]]), 48), M));
  const pts = []; for (let i = 0; i <= 48; i++) { const x = -.13 + .26 * i / 48; pts.push(new THREE.Vector3(x, .064, Math.sin(x * 24.2) * .024)); }
  capG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), MAT.lineCore));
  add(capG, .345, 1.42);
  const ringG = new THREE.Group(); const ring = new THREE.Mesh(new THREE.TorusGeometry(.451, .0085, 6, 64), M); ring.rotation.x = Math.PI / 2; ringG.add(ring); add(ringG, .35, 1.25);
  const cushG = new THREE.Group(); const cush = new THREE.Mesh(new THREE.TorusGeometry(.33, .112, 10, 48), M); cush.rotation.x = Math.PI / 2; cush.scale.z = .78; cushG.add(cush); add(cushG, -.045, -.46);
  const grG = new THREE.Group(); const gr = new THREE.Mesh(new THREE.CircleGeometry(.31, 48), M); gr.rotation.x = Math.PI / 2; grG.add(gr); add(grG, 0, -.24);
  const drv = new THREE.Group();
  drv.add(new THREE.Mesh(new THREE.LatheGeometry(v2([[.07, .045], [.25, .004], [.272, .006], [.272, .02], [.25, .022], [.07, .058]]), 40), M));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.075, 20, 6, 0, Math.PI * 2, 0, Math.PI / 2), M); dome.position.y = .03; dome.scale.y = .55; drv.add(dome);
  markCore(drv); add(drv, .08, .2);
  const mag = new THREE.Group(); mag.add(new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .07, 32), M)); markCore(mag); add(mag, .16, .44);
  const pcb = new THREE.Group(); pcb.add(new THREE.Mesh(new THREE.CylinderGeometry(.31, .31, .012, 48), M));
  [[-.1, .05, .09, .07], [.09, -.06, .07, .07], [.12, .1, .05, .04], [-.06, -.14, .1, .04]].forEach(([x, z, w, d]) => { const c = new THREE.Mesh(new THREE.BoxGeometry(w, .02, d), M); c.position.set(x, .014, z); pcb.add(c); });
  markCore(pcb); add(pcb, .215, .66);
  const bat = new THREE.Group(); bat.add(new THREE.Mesh(new RoundedBoxGeometry(.4, .055, .26, 2, .02), M)); markCore(bat); add(bat, .27, .88);

  const fork = new THREE.Mesh(new THREE.TorusGeometry(.6, .03, 6, 48, Math.PI), M); fork.rotation.y = Math.PI / 2; fork.scale.y = 1.06; slot.add(fork);
  [-1, 1].forEach(z => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .16, 16), M); p.rotation.x = Math.PI / 2; p.position.z = z * .53; slot.add(p); });
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, 1, 12), M); slot.add(rod); slot.userData.rod = rod;

  if (side === 1) {
    const a = (obj, x, y, z, name) => { const o = new THREE.Object3D(); o.position.set(x, y, z); obj.add(o); anchors[name] = o; };
    a(capG, -.26, .064, .05, 'cap'); a(bat, -.11, .03, .06, 'battery'); a(drv, -.21, .03, .04, 'driver'); a(cushG, -.37, 0, .04, 'cushion');
  }
}
makeCup(1); makeCup(-1);

const bandCurve = new THREE.CatmullRomCurve3(
  [[-1, .79], [-.975, 1.16], [-.8, 1.48], [-.44, 1.69], [0, 1.755], [.44, 1.69], [.8, 1.48], [.975, 1.16], [1, .79]].map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
function rrect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
const bandG = new THREE.Group(); rig.add(bandG);
bandG.add(new THREE.Mesh(new THREE.ExtrudeGeometry(rrect(.07, .3, .032), { steps: 60, bevelEnabled: false, extrudePath: bandCurve, curveSegments: 3 }), new THREE.MeshBasicMaterial()));
[-1, 1].forEach(sd => { const blk = new THREE.Mesh(new RoundedBoxGeometry(.1, .16, .3, 2, .035), new THREE.MeshBasicMaterial()); blk.position.set(sd, .79, 0); bandG.add(blk); });

// turn every mesh into an x-ray drawing: faint fill + crisp edges
model.traverse(o => {
  if (!o.isMesh) return;
  const core = !!o.userData.core;
  o.material = core ? MAT.core : MAT.fill;
  o.add(new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 24), core ? MAT.lineCore : MAT.line));
});

// concentric floor rings under the model
const floor = new THREE.Group(); scene.add(floor);
for (let i = 1; i <= 4; i++) {
  const c = new THREE.EllipseCurve(0, 0, .6 * i, .6 * i, 0, Math.PI * 2).getPoints(96);
  floor.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(c.map(p => new THREE.Vector3(p.x, 0, p.y))),
    new THREE.LineBasicMaterial({ color: ACC, transparent: true, opacity: .22 / i, depthWrite: false })));
}
floor.position.y = -1.35;

/* ---------------- callouts ---------------- */
const LABELS = [
  { a: 'cap', n: '01', t: 'Aluminum cap', d: 'Cut from a single block' },
  { a: 'battery', n: '02', t: '30-hour cell', d: 'Five minutes buys three hours' },
  { a: 'driver', n: '03', t: '40 mm driver', d: 'Beryllium-coated dome' },
  { a: 'cushion', n: '04', t: 'Memory foam', d: 'Wrapped in breathable knit' },
];
const leaders = $('#leaders'), SVGNS = 'http://www.w3.org/2000/svg';
LABELS.forEach(L => {
  L.el = document.createElement('div'); L.el.className = 'label';
  L.el.innerHTML = `<span class="n">${L.n}</span><b>${L.t}</b>${L.d}`; $('#labels').appendChild(L.el);
  L.line = document.createElementNS(SVGNS, 'polyline'); leaders.appendChild(L.line);
  L.dot = document.createElementNS(SVGNS, 'circle'); L.dot.setAttribute('r', 2.5); leaders.appendChild(L.dot);
});
const tmpV = new THREE.Vector3();
function updateLabels(vis) {
  const W = innerWidth, H = innerHeight, pad = clamp(W * .036, 20, 56), colX = W - pad - 200;
  LABELS.forEach(L => { anchors[L.a].getWorldPosition(tmpV).project(camera); L.sx = (tmpV.x * .5 + .5) * W; L.sy = (-tmpV.y * .5 + .5) * H; });
  [...LABELS].sort((p, q) => p.sy - q.sy).forEach((L, i) => {
    const v = clamp(vis * 1.7 - .45 - i * .12);
    if (v <= .001 || isMobile) { L.el.style.opacity = 0; L.line.style.opacity = 0; L.dot.style.opacity = 0; return; }
    const x = L.sx, y = L.sy, e = smooth(v), rowY = H * .27 + i * H * .145;
    const kx = lerp(x, Math.max(x + 40, colX - 70), e), ey = lerp(y, rowY, e);
    L.line.setAttribute('points', `${x},${y} ${kx},${ey} ${lerp(kx, colX - 18, e)},${ey}`);
    L.dot.setAttribute('cx', x); L.dot.setAttribute('cy', y);
    L.line.style.opacity = e; L.dot.style.opacity = e; L.el.style.opacity = e;
    L.el.style.transform = `translate(${colX + (1 - e) * 16}px, ${rowY - 26}px)`;
  });
}

/* =========================================================
   2. Sections, reveals and measurements
   ========================================================= */
const SEC = {};
function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map(w => `<span class="wl"><span class="w">${w}</span></span>`).join(' ');
  return [...el.querySelectorAll('.w')];
}
const shows = $$('[data-show]').map(el => {
  const [a, b, c, d] = el.dataset.show.split(',').map(Number);
  return { el, sec: el.closest('section'), a, b, c, d, words: el.hasAttribute('data-split') ? splitWords(el) : null, last: -1 };
});
function measure() {
  ['hero', 'detail', 'inside', 'silence', 'colors', 'specs', 'final'].forEach(id => {
    const el = document.getElementById(id);
    SEC[id] = { el, top: el.offsetTop / innerHeight, h: el.offsetHeight / innerHeight };
  });
  shows.forEach(it => { it.top = it.sec.offsetTop / innerHeight; it.last = -1; });
}
function updateShows(s) {
  for (const it of shows) {
    const vin = clamp((s - (it.top + it.a)) / (it.b - it.a));
    const vout = isNaN(it.c) ? 0 : clamp((s - (it.top + it.c)) / (it.d - it.c));
    const key = Math.round(vin * 400) * 1000 + Math.round(vout * 400);
    if (key === it.last) continue; it.last = key;
    const vis = vin * (1 - vout);
    if (it.words) {
      const n = it.words.length;
      it.words.forEach((w, k) => {
        const pi = smooth(clamp(vin * (1 + n * .09) - k * .09));
        const po = smooth(clamp(vout * (1 + n * .05) - k * .05));
        w.style.transform = `translate3d(0,${po > 0 ? -po * 110 : (1 - pi) * 110}%,0)`;
      });
      it.el.style.visibility = vin > 0 && vout < 1 ? 'visible' : 'hidden';
    } else {
      const e = smooth(vis);
      it.el.style.opacity = e;
      it.el.style.transform = `translate3d(0,${vout > 0 ? -vout * 20 : (1 - vin) * 26}px,0)`;
      it.el.style.visibility = e > .001 ? 'visible' : 'hidden';
    }
  }
}

/* =========================================================
   3. Colors: circular reveal from the swatch you press
   ========================================================= */
const ACCENTS = { sand: '#dcc59b', ocean: '#8fc3cf', night: '#c3c6d4' };
const NAMES = { sand: 'Sand', ocean: 'Ocean', night: 'Night' };
let current = 'sand', zTop = 3;
function setVariant(name, btn) {
  if (name === current) return;
  current = name;
  const img = $(`.shot[data-color="${name}"]`), stage = $('#shots').getBoundingClientRect();
  let x = 50, y = 50;
  if (btn) { const r = btn.querySelector('i').getBoundingClientRect(); x = (r.left + r.width / 2 - stage.left) / stage.width * 100; y = (r.top + r.height / 2 - stage.top) / stage.height * 100; }
  img.style.zIndex = ++zTop;
  gsap.fromTo(img, { clipPath: `circle(0% at ${x}% ${y}%)` }, { clipPath: `circle(150% at ${x}% ${y}%)`, duration: 1.35, ease: 'expo.inOut', onComplete: () => $$('.shot').forEach(s => s.classList.toggle('on', s === img)) });
  gsap.fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.8, ease: 'expo.out' });
  document.documentElement.style.setProperty('--accent', ACCENTS[name]);
  $$('.sw').forEach(b => { const on = b.dataset.color === name; b.classList.toggle('active', on); b.setAttribute('aria-checked', on); });
  const nameEl = $('#shotName span');
  gsap.timeline().to(nameEl, { yPercent: -110, duration: .45, ease: 'power3.in' }).add(() => nameEl.textContent = NAMES[name]).fromTo(nameEl, { yPercent: 110 }, { yPercent: 0, duration: .8, ease: 'expo.out' });
  audio.tick(name === 'sand' ? 660 : name === 'ocean' ? 520 : 440);
}
$$('.sw').forEach(b => b.addEventListener('click', () => setVariant(b.dataset.color, b)));

/* =========================================================
   4. Silence: noise waves that never reach her
   ========================================================= */
const wv = $('#waves'), wctx = wv.getContext('2d');
const LIFE = { u: .735, v: .42, iw: 2752, ih: 1536, px: .66 };
let accentNow = '#dcc59b';
function sizeWaves() {
  const d = Math.min(devicePixelRatio, 2); wv.width = innerWidth * d; wv.height = innerHeight * d; wctx.setTransform(d, 0, 0, d, 0, 0);
  LIFE.px = isMobile ? .72 : .66;
}
function focusPoint() {
  const W = innerWidth, H = innerHeight, s = Math.max(W / LIFE.iw, H / LIFE.ih);
  const iw = LIFE.iw * s, ih = LIFE.ih * s;
  return { x: (W - iw) * LIFE.px + LIFE.u * iw, y: (H - ih) * .5 + LIFE.v * ih };
}
function drawWaves(t, vis, chaos, imgScale, ox, oy) {
  const W = innerWidth, H = innerHeight;
  wctx.clearRect(0, 0, W, H);
  if (vis < .003) return;
  // the photo scales around its center; map the headphone point through the same transform
  const f0 = focusPoint(), cx = W / 2 + (f0.x - W / 2) * imgScale + ox, cy = H / 2 + (f0.y - H / 2) * imgScale + oy;
  const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.05;
  const N = 16, cut = (1 - chaos) * .42, speed = .035 + .05 * chaos;
  wctx.lineWidth = 1.5; wctx.strokeStyle = '#fff3df'; wctx.shadowColor = accentNow; wctx.shadowBlur = 8;
  for (let i = 0; i < N; i++) {
    let frac = (i / N - t * speed) % 1; if (frac < 0) frac += 1;
    const r = 46 + frac * R, amp = chaos * (3 + frac * 34);
    const a = Math.sin(Math.PI * frac) * (.34 + .5 * chaos) * vis * ramp(frac, cut, cut + .12);
    if (a < .004) continue;
    wctx.globalAlpha = a; wctx.beginPath();
    for (let k = 0; k <= 180; k++) {
      const th = k / 180 * Math.PI * 2;
      const rr = r + amp * (Math.sin(th * 6 + t * 2.1 + i) * .6 + Math.sin(th * 13 - t * 3.3 + i * 2.3) * .3 + Math.sin(th * 29 + t * 5 + i) * .15);
      const x = cx + Math.cos(th) * rr, y = cy + Math.sin(th) * rr * .82;
      k ? wctx.lineTo(x, y) : wctx.moveTo(x, y);
    }
    wctx.stroke();
  }
  wctx.globalAlpha = 1; wctx.shadowBlur = 0;
}

/* =========================================================
   5. Audio: procedural surf that the cancelling pulls away
   ========================================================= */
const audio = (() => {
  let ctx, master, noiseGain, filter, on = false;
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.2; } }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = .4;
    noiseGain = ctx.createGain(); noiseGain.gain.value = .5;
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = .11; lfoG.gain.value = .22;
    lfo.connect(lfoG); lfoG.connect(noiseGain.gain); lfo.start();
    src.connect(filter); filter.connect(noiseGain); noiseGain.connect(master); src.start();
  }
  return {
    toggle() { if (!ctx) init(); on = !on; if (ctx.state === 'suspended') ctx.resume(); master.gain.setTargetAtTime(on ? .55 : 0, ctx.currentTime, .4); return on; },
    update(level) { if (!ctx || !on) return; filter.frequency.setTargetAtTime(220 + 2600 * level, ctx.currentTime, .15); noiseGain.gain.setTargetAtTime(.03 + .6 * level, ctx.currentTime, .2); },
    tick(freq = 600) {
      if (!ctx || !on) return;
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.value = 0;
      g.gain.setTargetAtTime(.05, ctx.currentTime, .005); g.gain.setTargetAtTime(0, ctx.currentTime + .04, .05);
      o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + .4);
    },
  };
})();
function toggleSound() {
  const on = audio.toggle();
  $('#sound').setAttribute('aria-pressed', on); $('.sound-label').textContent = on ? 'Sound on' : 'Sound off';
  $('#soundHint').classList.toggle('off', on);
}
$('#sound').addEventListener('click', toggleSound);
$('#soundHint').addEventListener('click', toggleSound);

/* =========================================================
   6. Pointer: parallax, spotlight, drag, cursor, magnets
   ========================================================= */
const mouse = { x: 0, y: 0, sx: 0, sy: 0, px: innerWidth / 2, py: innerHeight / 2 };
let drag = null, dragRY = 0, dragVel = 0;
addEventListener('pointermove', e => {
  mouse.px = e.clientX; mouse.py = e.clientY;
  mouse.x = e.clientX / innerWidth * 2 - 1; mouse.y = e.clientY / innerHeight * 2 - 1;
  if (drag) { const dx = e.clientX - drag.x; drag.x = e.clientX; dragVel = dx * .009; dragRY += dragVel; }
}, { passive: true });
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX }; dragVel = 0; canvas.setPointerCapture(e.pointerId); });
const endDrag = () => { drag = null; };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);

const cursor = $('.cursor'), cDot = $('.c-dot'), cRing = $('.c-ring');
const ringPos = { x: mouse.px, y: mouse.py };
document.addEventListener('pointerover', e => cursor.classList.toggle('hover', !!e.target.closest('[data-hover]')));

function magnets() {
  $$('[data-magnet]').forEach(el => {
    const inner = el.firstElementChild;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * .28, y: dy * .38, duration: .5, ease: 'power3.out' });
      gsap.to(inner, { x: dx * .12, y: dy * .14, duration: .5, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to([el, inner], { x: 0, y: 0, duration: .9, ease: 'elastic.out(1,.4)' }));
    el.addEventListener('pointerenter', () => audio.tick(780));
  });
}
$$('.card').forEach(el => el.addEventListener('pointermove', e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
}));

/* ---------------- grain ---------------- */
{
  const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d'), d = g.createImageData(180, 180);
  for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255 | 0; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); $('#grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

/* ---------------- resize ---------------- */
function resize() {
  isMobile = innerWidth <= 760;
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.fov = camera.aspect < 1 ? 46 : 30; camera.updateProjectionMatrix();
  leaders.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
  sizeWaves(); measure();
}
addEventListener('resize', resize);
resize();

/* =========================================================
   7. The loop
   ========================================================= */
const st = { ex: 0, ry: -.8, gl: 0, chaos: 1 };
const intro = { photo: 1 };
let lenis = null, last = performance.now(), time = 0;
const heroImg = $('.hero-photo img'), heroType = $('.hero-type h1'), spot = $('.spot');
const macro = $('.macro'), macroImg = $('.macro img'), macroShade = $('.macro-shade');
const lifeImg = $('.life img'), shots = $('#shots'), finalImg = $('.final-photo img');
const dbEl = $('#db'), dbBar = $('#dbbar'), progEl = $('#progress');
const navLinks = $$('.links a'), navIds = ['detail', 'inside', 'silence', 'colors', 'specs'];

function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 20); last = now; time += dt;
  if (lenis) lenis.raf(now);
  const s = scrollY / innerHeight;
  const maxS = (document.documentElement.scrollHeight - innerHeight) / innerHeight;
  mouse.sx = damp(mouse.sx, mouse.x, 3.2, dt); mouse.sy = damp(mouse.sy, mouse.y, 3.2, dt);
  const mx = mouse.sx, my = mouse.sy;
  accentNow = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || accentNow;

  /* hero: the product breathes toward you as you leave */
  {
    const r = s - SEC.hero.top, e = ramp(r, 0, 1);
    const sc = (1 + .28 * e) * (1 + .18 * intro.photo);
    heroImg.style.transform = `translate3d(${-mx * 14}px,${-my * 10}px,0) translateY(${-e * 6}%) scale(${sc})`;
    heroImg.style.filter = intro.photo > .01 ? `blur(${intro.photo * 18}px)` : 'none';
    heroImg.style.opacity = (1 - ramp(r, .6, 1)) * (1 - intro.photo * .9);
    heroType.style.transform = `translate3d(${mx * 10}px,${-e * 16}vh,0) scale(${1 + e * .12})`;
    heroType.style.opacity = 1 - ramp(r, .1, .7);
    spot.style.setProperty('--sx', `${mouse.px}px`); spot.style.setProperty('--sy', `${mouse.py}px`);
  }

  /* craft: the macro opens from a window to full bleed */
  {
    const r = s - SEC.detail.top, p = ramp(r, -.35, .75);
    const iy = lerp(30, 0, p), ix = lerp(isMobile ? 12 : 30, 0, p), rad = lerp(28, 0, p);
    macro.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${rad}px)`;
    macroImg.style.transform = `translate3d(${-mx * 10}px,${-my * 8}px,0) scale(${lerp(1.45, 1.04, p) + ramp(r, .75, 1.6) * .06})`;
    macroShade.style.opacity = ramp(r, .4, .8);
  }

  /* inside: the x-ray drawing */
  {
    const r = s - SEC.inside.top;
    const vis = ramp(r, -.35, .1) * (1 - ramp(r, 1.7, 2.0));
    st.gl = damp(st.gl, vis, 8, dt);
    canvas.style.opacity = st.gl;
    canvas.classList.toggle('live', st.gl > .5);
    st.ex = damp(st.ex, ramp(r, .45, 1.3), 5, dt);
    st.ry = damp(st.ry, lerp(-.7, -1.4, clamp(r / 1.8)), 5, dt);
    if (!drag) { dragVel *= Math.pow(.02, dt); dragRY += dragVel; dragRY = damp(dragRY, 0, .6, dt); }
    if (st.gl > .003) {
      const e = st.ex;
      model.position.set(isMobile ? 0 : .55, (isMobile ? .6 : -.05) + Math.sin(time * .9) * .03, 0);
      model.rotation.set(.2 + my * .06, st.ry + mx * .14 + dragRY, Math.sin(time * .5) * .015);
      model.scale.setScalar(isMobile ? .66 : .76);
      explodeParts.forEach(p => p.obj.position.y = p.t0 + p.amt * e * .95);
      slots.forEach((sl, i) => {
        const side = i === 0 ? 1 : -1; sl.position.x = side * (1 + .2 * e);
        const rod = sl.userData.rod, top = .9 + .32 * e, bottom = .62; rod.scale.y = top - bottom; rod.position.y = (top + bottom) / 2;
      });
      bandG.position.y = .32 * e;
      floor.position.x = model.position.x; floor.scale.setScalar(model.scale.x * (1 + e * .4));
      renderer.render(scene, camera);
      updateLabels(e * st.gl);
    } else updateLabels(0);
  }

  /* silence: noise waves, then calm */
  {
    const r = s - SEC.silence.top;
    const vis = ramp(r, -.4, .2) * (1 - ramp(r, 1.75, 2.1));
    st.chaos = damp(st.chaos, 1 - ramp(r, .45, 1.4), 6, dt);
    const shake = st.chaos * vis * (reduceMotion ? 0 : 1);
    const imgScale = lerp(1.0, 1.1, st.chaos) + ramp(r, -1, 2) * .04;
    const ox = -mx * 12 + Math.sin(time * 17) * shake * 1.5, oy = -my * 8 + Math.cos(time * 13) * shake * 1.2;
    lifeImg.style.transform = `translate3d(${ox}px,${oy}px,0) scale(${imgScale})`;
    lifeImg.style.filter = `saturate(${lerp(1.05, .7, st.chaos)}) contrast(${lerp(1, 1.08, st.chaos)})`;
    drawWaves(time, vis, st.chaos, imgScale, ox, oy);
    const db = Math.round(38 * (1 - st.chaos));
    dbEl.textContent = db === 0 ? '0' : '−' + db;
    dbBar.style.transform = `scaleX(${1 - st.chaos})`;
    audio.update(lerp(.42, st.chaos, vis));
  }

  /* colors: a slow 3D tilt that follows the hand */
  {
    const r = s - SEC.colors.top;
    shots.style.transform = `rotateY(${mx * 2.5}deg) rotateX(${-my * 1.8}deg) scale(${1.03 + ramp(r, -.5, 1.4) * .05})`;
  }
  /* final */
  {
    const r = s - SEC.final.top;
    finalImg.style.transform = isMobile ? `translate3d(0,${r * 30}px,0)` : `translate3d(${-mx * 10}px,${r * 40}px,0) translateY(-20%) scale(${.6 + ramp(r, -1, 0) * .04})`;
  }

  updateShows(s);
  progEl.style.transform = `scaleX(${clamp(s / maxS)})`;
  navLinks.forEach((a, i) => { const S = SEC[navIds[i]]; a.classList.toggle('on', s >= S.top - .5 && s < S.top + S.h - .5); });

  if (hoverDevice) {
    ringPos.x = damp(ringPos.x, mouse.px, 14, dt); ringPos.y = damp(ringPos.y, mouse.py, 14, dt);
    cDot.style.transform = `translate3d(${mouse.px}px,${mouse.py}px,0)`;
    cRing.style.transform = `translate3d(${ringPos.x}px,${ringPos.y}px,0)`;
    cursor.classList.toggle('drag', !!drag || (st.gl > .5 && document.elementFromPoint(mouse.px, mouse.py) === canvas));
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* =========================================================
   8. Boot
   ========================================================= */
function onReady(fn) { if (window.gsap) fn(); else addEventListener('load', fn); }
onReady(async () => {
  history.scrollRestoration = 'manual'; scrollTo(0, 0);
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: .085, smoothWheel: true, wheelMultiplier: .9 });
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', ev => {
      ev.preventDefault();
      const id = a.getAttribute('href').slice(1), S = SEC[id];
      const extra = { detail: .8, inside: .9, silence: .5, colors: .6, specs: -.1 }[id] || 0;
      lenis.scrollTo((S.top + extra) * innerHeight, { duration: 2.2, easing: x => 1 - Math.pow(1 - x, 4) });
    }));
  }
  magnets();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => el.textContent = o.v.toFixed(dec) });
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => io.observe(el));

  // loader: real progress from fonts and the first two photographs
  const cnt = { v: 0 }, countEl = $('#count'), bar = $('#loadbar');
  const setC = () => { countEl.textContent = cnt.v | 0; bar.style.width = cnt.v + '%'; };
  const jobs = [document.fonts.ready, heroImg.decode().catch(() => {}), new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = innerWidth > 1600 ? 'img/macro-2560.webp' : 'img/macro-1440.webp'; })];
  let done = 0; jobs.forEach(j => j.then(() => { done++; gsap.to(cnt, { v: done / jobs.length * 96, duration: .6, ease: 'power2.out', onUpdate: setC, overwrite: true }); }));
  await Promise.all([...jobs, new Promise(r => setTimeout(r, reduceMotion ? 200 : 1300))]);
  measure();
  await new Promise(r => gsap.to(cnt, { v: 100, duration: .35, onUpdate: setC, onComplete: r, overwrite: true }));

  gsap.timeline({ delay: .25 })
    .to('#loader', { yPercent: -100, duration: 1.1, ease: 'expo.inOut' })
    .add(() => document.body.classList.remove('loading'), '-=.6')
    .to('.hero-type .ch>span', { y: '0%', duration: 1.3, ease: 'expo.out', stagger: .07 }, '-=.55')
    .to(intro, { photo: 0, duration: 2.0, ease: 'expo.out' }, '<.15')
    .from('.nav > *', { y: -20, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08 }, '<.3')
    .from('.hero-foot > *', { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, clearProps: 'all' }, '<.15');
});

window.__mare = { scene, camera, renderer, st, SEC, setVariant, go: v => lenis ? lenis.scrollTo(v * innerHeight, { immediate: true }) : scrollTo(0, v * innerHeight) };
