/* Academy: 3D-Motiv. Drei Bildwände auf spiegelndem Leiterbahn-Boden.
   Bewegt sich nur mit der Maus (Gegenrichtung); Klick auf ein Seitenbild holt es in die Mitte. */
import * as THREE from './three.module.min.js';
import { Reflector } from './Reflector.js';

const host = document.querySelector('.ac-hero');
const canvas = document.querySelector('.ac-3d');
if (host && canvas) init();

function init(){
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return; }
  const LOW = matchMedia('(pointer:coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOW ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);
  scene.fog = new THREE.Fog(0x02040a, 10, 24);
  const camera = new THREE.PerspectiveCamera(37, 16/9, 0.1, 60);
  const BASE = new THREE.Vector3(0.8, 1.65, 8.4), TARGET = new THREE.Vector3(0.8, 1.55, 0);

  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  function tex(url){ const t = loader.load(url, () => request()); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t; }

  // weicher Leuchtschein hinter einer Bildwand
  function glowTexture(){
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const grd = g.createRadialGradient(128,128,40,128,128,128); grd.addColorStop(0,'rgba(255,255,255,1)'); grd.addColorStop(.55,'rgba(255,255,255,.35)'); grd.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0,0,256,256); const t = new THREE.CanvasTexture(c); return t;
  }
  const GLOW = glowTexture();

  const slots = [
    { x: 0.15, z: 0,     ry: 0,                     h: 2.55 }, // Mitte
    { x: -3.05, z: -0.95, ry: THREE.MathUtils.degToRad(28),  h: 1.55 }, // links
    { x: 3.35, z: -0.95, ry: THREE.MathUtils.degToRad(-28), h: 1.55 }  // rechts
  ];
  const defs = [
    { url: 'assets/acad-team.jpg',  ar: 2048/1536, col: 0x4f8cff, slot: 0, name: 'Team' },
    { url: 'assets/acad-set.jpg',   ar: 2048/1140, col: 0x00e5ff, slot: 1, name: 'Filmset' },
    { url: 'assets/acad-level.jpg', ar: 2048/1172, col: 0xff3dcb, slot: 2, name: 'LEVEL' }
  ];

  const panels = defs.map(d => {
    const g = new THREE.Group();
    const img = new THREE.Mesh(new THREE.PlaneGeometry(d.ar, 1), new THREE.MeshBasicMaterial({ map: tex(d.url), toneMapped: false }));
    img.position.z = 0.03; g.add(img);
    const back = new THREE.Mesh(new THREE.BoxGeometry(d.ar + 0.04, 1.04, 0.03), new THREE.MeshBasicMaterial({ color: 0x05070d }));
    g.add(back);
    const em = new THREE.MeshBasicMaterial({ color: d.col, toneMapped: false });
    const t = 0.012, w = d.ar + 0.05, hh = 1.05;
    [[w, t, 0, hh/2], [w, t, 0, -hh/2], [t, hh, w/2, 0], [t, hh, -w/2, 0]].forEach(([sx, sy, x, y]) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, 0.02), em); s.position.set(x, y, 0.03); g.add(s);
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(d.ar * 1.35, 1.45), new THREE.MeshBasicMaterial({ map: GLOW, color: d.col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    glow.position.z = -0.03; g.add(glow);
    img.userData.panel = g; g.userData = { def: d, slot: d.slot, from: null, to: null };
    place(g, slots[d.slot]); scene.add(g); return g;
  });
  function place(g, s){ g.position.set(s.x, s.h/2 + 0.08, s.z); g.rotation.y = s.ry; g.scale.setScalar(s.h); }

  // Boden: Spiegel + dunkle Schicht + Leiterbahnen
  const mirror = new Reflector(new THREE.PlaneGeometry(60, 60), { textureWidth: 1024, textureHeight: 1024, color: 0x8a8f9c });
  mirror.rotation.x = -Math.PI/2; scene.add(mirror);
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x03050c, transparent: true, opacity: 0.62, depthWrite: false }));
  veil.rotation.x = -Math.PI/2; veil.position.y = 0.002; scene.add(veil);
  const ct = tex('assets/acad-circuit.jpg'); ct.wrapS = ct.wrapT = THREE.RepeatWrapping; ct.repeat.set(9, 9); ct.colorSpace = THREE.SRGBColorSpace;
  const circuit = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  circuit.rotation.x = -Math.PI/2; circuit.position.y = 0.004; scene.add(circuit);

  // Größe
  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    const a = w / h; camera.aspect = a;
    const hfov = a >= 1.4 ? 62 : 46 + (62 - 46) * Math.max(0, (a - 0.8) / 0.6);
    if (a >= 1.2) { BASE.set(0.8, 1.65, 8.4); TARGET.set(0.8, 1.55, 0); }
    else { BASE.set(0.15, 1.35, 6.6); TARGET.set(0.15, 0.95, 0); }
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(hfov) / 2) / a));
    camera.updateProjectionMatrix(); request();
  }
  new ResizeObserver(resize).observe(canvas);

  // Maus: Kamera folgt, Szene wandert in die Gegenrichtung
  const aim = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  if (!reduce) host.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = host.getBoundingClientRect();
    aim.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    aim.y = 1 - ((e.clientY - r.top) / r.height) * 2;
    request();
  });

  // Klick: Seitenbild tauscht mit der Mitte
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const imgs = panels.map(p => p.children[0]);
  function hit(e){
    const r = canvas.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera); const h = ray.intersectObjects(imgs)[0]; return h ? h.object.userData.panel : null;
  }
  let anim = null;
  canvas.addEventListener('click', e => {
    const p = hit(e); if (!p || anim || p.userData.slot === 0) return;
    const c = panels.find(q => q.userData.slot === 0), s = p.userData.slot;
    anim = { t0: performance.now(), dur: reduce ? 1 : 900, moves: [[p, slots[s], slots[0]], [c, slots[0], slots[s]]] };
    p.userData.slot = 0; c.userData.slot = s; request();
  });
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; const p = hit(e); canvas.style.cursor = p && p.userData.slot !== 0 ? 'pointer' : ''; });

  const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  let raf = 0;
  function request(){ if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now){
    raf = 0; let more = false;
    cur.x += (aim.x - cur.x) * 0.08; cur.y += (aim.y - cur.y) * 0.08;
    if (Math.abs(aim.x - cur.x) > 0.0005 || Math.abs(aim.y - cur.y) > 0.0005) more = true;
    camera.position.set(BASE.x + cur.x * 0.9, BASE.y + cur.y * 0.55, BASE.z);
    camera.lookAt(TARGET);
    if (anim){
      const k = Math.min(1, (now - anim.t0) / anim.dur), e = ease(k);
      anim.moves.forEach(([g, a, b]) => {
        const lift = Math.sin(Math.PI * e) * 0.6; // auf dem Weg leicht nach vorn
        g.position.set(a.x + (b.x - a.x) * e, 0, a.z + (b.z - a.z) * e + lift * (b === slots[0] ? 1 : -0.4));
        const h = a.h + (b.h - a.h) * e; g.scale.setScalar(h); g.position.y = h/2 + 0.08;
        g.rotation.y = a.ry + (b.ry - a.ry) * e;
      });
      if (k < 1) more = true; else anim = null;
    }
    renderer.render(scene, camera);
    host.classList.add('ac-3d-on');
    if (more) request();
  }
  resize(); request();
}
