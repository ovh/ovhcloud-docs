/**
 * hero-fx — moteur d'effet génératif des heros OVHcloud Labs / Docs / Developer.
 * Canvas 2D, sans dépendance. Extrait du prototype validé (15 oct. 2026),
 * copié tel quel depuis proto/effects/hero-fx.js : ne pas le modifier ici,
 * le chargement et le cycle de vie sont gérés par ./index.tsx.
 *
 *   import { createHeroFx, PALETTE_KEYS } from './hero-fx.js';
 *   const fx = createHeroFx(canvasElement, presetDeLaPage, { onBackground: c => host.style.setProperty('--hero-bg', c) });
 *   fx.set({ palette: 'lagon' });   fx.pause();   fx.resume();   fx.destroy();
 *   const [alpha, beta] = fx.stageColors();   // couleurs de statut dérivées de la palette
 *
 * Le canvas doit être positionné en absolu dans son conteneur (le hero) ; le moteur suit sa taille.
 * Débordement sous le hero, fondu bas et masque de lisibilité sont gérés en CSS (voir SPEC.md).
 */
const PALETTE_KEYS = ['ovh','abysse','glacier','aurore','signal','graphite','cobalt','lagon','menthe','lilas','crepuscule','braise'];
export { PALETTE_KEYS };
export function createHeroFx(canvas, config = {}, opts = {}){
  // ───────────────────────── Réglages ─────────────────────────
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = {
    mode: 'mesh', theme: 'dark', palette: 'aurore', layout: 'band', waveY: 0.68, bandWidth: 1, shape: 'wave', ripple: true,
    speed: reduceMotion ? 0.2 : 1, amplitude: 1, density: 1, glow: 0.55,
    haloIntensity: 0.55, haloSize: 0.85, haloX: 0.62, haloY: 0.74,
    bg: '', halo: '', bg2: '', bgMode: 'solid', bgAngle: 180,
    wordCount: 0
  };
  Object.assign(P, config);


  // Chaque palette a une déclinaison sombre et claire
  const PALETTES = {
    ovh:      { name:'OVHcloud', dark:{ stops:['#4fd8ff','#1f66ff','#3a2cd6'], bg:'#06070c', halo:'#14347a' },
                                 light:{ stops:['#00b8e6','#1257ff','#4a1fe0'], bg:'#f6f9fe', halo:'#cfe0ff' } },
    abysse:   { name:'Abysse',   dark:{ stops:['#6c98ff','#2a4fd0','#1b2c90'], bg:'#04050a', halo:'#0f2160' },
                                 light:{ stops:['#3d7bff','#1f45e0','#2a1aa8'], bg:'#f3f6fc', halo:'#c9d8ff' } },
    glacier:  { name:'Glacier',  dark:{ stops:['#e2f1ff','#8fb2ff','#4560d0'], bg:'#07090e', halo:'#1d2d50' },
                                 light:{ stops:['#38bdf8','#5b7cff','#3b4fd8'], bg:'#f7fafd', halo:'#d6e9ff' } },
    aurore:   { name:'Aurore',   dark:{ stops:['#5cf2c4','#239bff','#864bff'], bg:'#05080b', halo:'#0c3648' },
                                 light:{ stops:['#14d98c','#00b4e6','#2f4dff'], bg:'#f7fcfc', halo:'#c8f3ea' } },
    signal:   { name:'Signal',   dark:{ stops:['#38e8ff','#7a6bff','#e04bd8'], bg:'#07060d', halo:'#2c1656' },
                                 light:{ stops:['#00c2ea','#6a4dff','#e0329f'], bg:'#faf8fd', halo:'#ead9ff' } },
    graphite: { name:'Graphite', dark:{ stops:['#eef1f7','#a3abbe','#5d6579'], bg:'#08090b', halo:'#262a33' },
                                 light:{ stops:['#6b7385','#3a4152','#1a1f2b'], bg:'#f4f5f7', halo:'#e2e6ee' } },
    cobalt:   { name:'Cobalt',   dark:{ stops:['#00d1ff','#0050d7','#000e9c'], bg:'#03050d', halo:'#06206e' },
                                 light:{ stops:['#00a8d6','#0050d7','#000e9c'], bg:'#f4f7fd', halo:'#cddcff' } },
    lagon:    { name:'Lagon',    dark:{ stops:['#2dd4bf','#22d3ee','#3b82f6'], bg:'#04090b', halo:'#0b3a3f' },
                                 light:{ stops:['#0fb5a0','#06a6d6','#2563eb'], bg:'#f5fbfb', halo:'#c9f0ec' } },
    menthe:   { name:'Menthe',   dark:{ stops:['#d9f99d','#4ade80','#0d9488'], bg:'#050a07', halo:'#123a24' },
                                 light:{ stops:['#65a30d','#16a34a','#0f766e'], bg:'#f6fbf6', halo:'#d6f5dd' } },
    lilas:    { name:'Lilas',    dark:{ stops:['#e9d5ff','#a78bfa','#6d28d9'], bg:'#08060d', halo:'#2a1a4a' },
                                 light:{ stops:['#a855f7','#7c3aed','#4c1d95'], bg:'#faf7fe', halo:'#eadcff' } },
    crepuscule:{ name:'Crépuscule', dark:{ stops:['#fde68a','#f472b6','#3b82f6'], bg:'#08070c', halo:'#2b1838' },
                                 light:{ stops:['#eab308','#db2777','#2563eb'], bg:'#fbf9fb', halo:'#f7dcea' } },
    braise:   { name:'Braise',   dark:{ stops:['#ffb86b','#ff5e7a','#8b5cf6'], bg:'#0b0709', halo:'#3a1424' },
                                 light:{ stops:['#f08a24','#e8365d','#7c3aed'], bg:'#fdf8f6', halo:'#ffe1d6' } }
  };
  const TH = () => PALETTES[P.palette][P.theme];
  // Couleurs des statuts tirées directement des couleurs de la palette (celles que l'animation affiche) :
  // on prend les deux teintes les plus éloignées du dégradé, beta = début, alpha = fin,
  // puis on les éclaircit (sombre) ou les fonce (clair) juste assez pour rester lisibles sur le fond.
  const relLum = h => hex(h).map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v + 0.055)/1.055, 2.4); })
                            .reduce((a, v, i) => a + v*[0.2126, 0.7152, 0.0722][i], 0);
  const contrast = (a, b) => { const x = relLum(a), y = relLum(b); return (Math.max(x, y) + 0.05)/(Math.min(x, y) + 0.05); };
  const hueOf = h => { const [r, g, b] = hex(h).map(v => v/255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    if (!d) return 0; const hh = mx === r ? ((g - b)/d) % 6 : mx === g ? (b - r)/d + 2 : (r - g)/d + 4; return (hh*60 + 360) % 360; };
  function legible(c, bg, dark){
    for (let k = 0; k <= 1; k += 0.05){ const m = mixHex(c, dark ? '#ffffff' : '#000000', k); if (contrast(m, bg) >= 4.5) return m; }
    return dark ? '#ffffff' : '#000000';
  }
  function stageColorsFor(key, theme, bgOverride){
    const th = PALETTES[key][theme], st = th.stops, bg = bgOverride || th.bg, dark = theme === 'dark';
    // Priorité aux deux premières couleurs : ce sont elles qui dominent l'effet et le mot coloré du titre.
    // La 3e couleur n'est utilisée que si les deux premières sont trop proches pour distinguer Alpha de Beta.
    const hd = (a, b) => { const d = Math.abs(hueOf(st[a]) - hueOf(st[b])); return Math.min(d, 360 - d); };
    let best = [0, 1], bd = hd(0, 1);
    if (bd < 35) for (const [a, b] of [[0, 2], [1, 2]]){ const d = hd(a, b); if (d > bd){ bd = d; best = [a, b]; } }
    return [legible(st[best[1]], bg, dark), legible(st[best[0]], bg, dark)];   // [alpha, beta]
  }
  const stageColors = () => stageColorsFor(P.palette, P.theme, P.bg);
  const mixHex = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v)*k).toString(16).padStart(2, '0')).join(''); };
  // second ton du dégradé par défaut : le fond teinté par la couleur profonde de la palette
  const bg2Color = () => P.bg2 || mixHex(P.bg || TH().bg, TH().stops[2], P.theme === 'dark' ? 0.28 : 0.16);
  const isDark = () => P.theme === 'dark';
  const hex = h => { h = h.replace('#',''); if (h.length === 3) h = [...h].map(c => c+c).join('');
    const n = parseInt(h,16); return [n>>16&255, n>>8&255, n&255]; };
  const toHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2,'0')).join('');

  // ───────────────────────── Canvas ─────────────────────────
  // opts.transparent : en clair, le canevas ne peint pas de fond (la page porte la couleur) ; aucune fusion CSS n'est alors nécessaire
  const ctx = canvas.getContext('2d', { alpha: !!opts.transparent });
  const half = document.createElement('canvas'), hctx = half.getContext('2d');
  const glow = document.createElement('canvas'), gctx = glow.getContext('2d');
  const bgC = document.createElement('canvas'), bgx = bgC.getContext('2d');

  let CAM_H = 3, Z_NEAR = 1.6, Z_FAR = 72, ZPOW = 1.7, OCCL = true;
  // Cadrage : 'band' = ruban qui traverse l'écran, 'terrain' = paysage jusqu'en bas
  function setGeo(){
    if (P.layout === 'band'){ CAM_H = 1.2; Z_NEAR = Math.max(6, 22 - 12*P.bandWidth); Z_FAR = 22 + 12*P.bandWidth; ZPOW = 1; OCCL = false; HOR = H * (P.waveY - 0.08); }
    else { CAM_H = 3; Z_NEAR = 1.6; Z_FAR = 72; ZPOW = 1.7; OCCL = true; HOR = H * (P.waveY - 0.1); }
  }
  let W = 1, H = 1, DPR = 1, F = 1, HOR = 0;
  let img, px32, R, G, B, A, touched, mark, hb, bg32, bgBytes, stamp = 1, bgDirty = true;

  // Couleurs pré-calculées
  let STOPS = [], BASE = [0,0,0];
  const LUT = new Float32Array(256*3);      // couleur 0..1 par position x
  const LUTP = new Float32Array(256*3);     // émission (sombre) ou absorption (clair)
  let STY = [], MIX = [];
  // La 3e couleur de la palette est atteinte à 70 % de la largeur puis tenue jusqu'au bord :
  // elle occupe une vraie zone de l'animation, au lieu de n'apparaître que sur le dernier pixel.
  // C'est elle qui colore la pastille LABS_ et le statut Alpha : elle doit donc se voir dans l'effet.
  const STOP_END = 0.7;
  function stopAt(s){
    s = Math.min(1, Math.max(0, s)/(P.stopEnd || STOP_END)) * (STOPS.length - 1);   // P.stopEnd : où finit la palette (0,7 par défaut)
    const k = Math.min(STOPS.length - 2, Math.floor(s)), f = s - k;
    return STOPS[k].map((v,c) => v + (STOPS[k+1][c] - v) * f);
  }
  function buildPalette(){
    const th = TH();
    STOPS = th.stops.map(hex);
    BASE = hex(P.bg || th.bg);
    for (let i = 0; i < 256; i++){
      const c = stopAt(i/255);
      for (let k = 0; k < 3; k++){
        LUT[i*3+k] = c[k]/255;
        LUTP[i*3+k] = c[k]/255;
      }
    }
    STY = []; MIX = [];
    for (let xb = 0; xb < 32; xb++){
      const c = stopAt(xb/31).map(Math.round);
      for (let ab = 0; ab < 8; ab++) STY.push(`rgba(${c[0]},${c[1]},${c[2]},${(isDark() ? 0.3 + 0.7*ab/7 : 0.5 + 0.5*ab/7).toFixed(2)})`);
      for (let lv = 0; lv < 32; lv++){
        const k = lv/31;
        MIX.push(`rgb(${c.map((v,i) => Math.round(BASE[i] + (v - BASE[i]) * k)).join(',')})`);
      }
    }
  }

  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, opts.maxDpr || 1.25);   // opts.maxDpr : plafond de netteté (1,25 par défaut, 2 pour un rendu Retina net)
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width * DPR));
    H = Math.max(1, Math.round(r.height * DPR));
    canvas.width = W; canvas.height = H;
    F = H * 0.95; setGeo();
    img = ctx.createImageData(W, H);
    px32 = new Uint32Array(img.data.buffer);
    R = new Float32Array(W*H); G = new Float32Array(W*H); B = new Float32Array(W*H); A = new Float32Array(W*H);
    touched = new Int32Array(W*H); mark = new Uint32Array(W*H);
    hb = new Float32Array(W);
    half.width = Math.max(1, W >> 1); half.height = Math.max(1, H >> 1);
    glow.width = Math.max(1, W >> 2);  glow.height = Math.max(1, H >> 2);
    bgDirty = true;
  }

  // Fond : couleur + halo elliptique + léger tramage anti-banding
  const dotPitch = () => Math.max(5, Math.round(10 * DPR / Math.sqrt(P.density)));
  function bakeBg(){
    buildPalette();
    const th = TH();
    bgC.width = W; bgC.height = H;
    const c1 = P.bg || th.bg;
    if (P.bgMode === 'gradient'){
      // angle façon CSS : 0° = vers le haut, 180° = vers le bas
      const ang = P.bgAngle*Math.PI/180, dx = Math.sin(ang), dy = -Math.cos(ang);
      const hl = Math.abs(W/2*dx) + Math.abs(H/2*dy);
      const lg = bgx.createLinearGradient(W/2 - dx*hl, H/2 - dy*hl, W/2 + dx*hl, H/2 + dy*hl);
      lg.addColorStop(0, c1); lg.addColorStop(1, bg2Color());
      bgx.fillStyle = lg;
    } else bgx.fillStyle = c1;
    bgx.fillRect(0, 0, W, H);
    const [hr,hg,hbv] = hex(P.halo || th.halo), a = P.haloIntensity;
    const cx = P.haloX * W, cy = P.haloY * H, rad = P.haloSize * Math.max(W, H) * 0.75, sq = 0.55;
    bgx.setTransform(1, 0, 0, sq, 0, cy * (1 - sq));
    const g = bgx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0,   `rgba(${hr},${hg},${hbv},${a})`);
    g.addColorStop(0.4, `rgba(${hr},${hg},${hbv},${a*0.42})`);
    g.addColorStop(1,   `rgba(${hr},${hg},${hbv},0)`);
    bgx.fillStyle = g; bgx.fillRect(0, -H*2, W, H*5);
    bgx.setTransform(1, 0, 0, 1, 0, 0);
    if (P.mode === 'dots'){                       // LEDs éteintes
      const p = dotPitch(), c = STOPS[1];
      bgx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${isDark() ? 0.07 : 0.09})`;
      bgx.beginPath();
      for (let y = p/2; y < H; y += p) for (let x = p/2; x < W; x += p){ bgx.moveTo(x + p*0.16, y); bgx.arc(x, y, p*0.16, 0, 6.2832); }
      bgx.fill();
    }
    const d = bgx.getImageData(0, 0, W, H), px = d.data;
    for (let i = 0; i < px.length; i += 4){
      const n = (Math.random() - 0.5) * 1.6;
      px[i] += n; px[i+1] += n; px[i+2] += n;
    }
    bgx.putImageData(d, 0, 0);
    bgBytes = new Uint8ClampedArray(px);
    bg32 = new Uint32Array(bgBytes.buffer);
    if (opts.onBackground) opts.onBackground(P.bg || th.bg);
    bgDirty = false;
  }

  // ───────────────────────── Ondulation au survol ─────────────────────────
  const RIP = []; let clock = 0, lastRip = { x: -1e9, y: -1e9, t: -1 };
  function ripY(x, y){
    if (!RIP.length) return 0;
    const wl = 46*DPR, sp = 260*DPR, amp = 3.5*DPR, sig = wl*0.7;
    let d = 0;
    for (let i = 0; i < RIP.length; i++){
      const r = RIP[i], age = clock - r.t, k = Math.hypot(x - r.x, y - r.y) - age*sp;
      if (k > sig*3 || k < -sig*3) continue;
      d += amp * Math.sin(k/wl*6.2832) * Math.exp(-k*k/(2*sig*sig)) * Math.exp(-age*2.2);
    }
    return d;
  }

  // ───────────────────────── Surface ─────────────────────────
  function height(x, z, t){
    const h = 1.7  * Math.sin(x*0.09  + z*0.05 + t*0.16)
            + 1.0  * Math.sin(x*0.045 - z*0.11 - t*0.11 + 1.3)
            + 0.4  * Math.sin(x*0.27  + z*0.19 + t*0.31 + 2.1)
            + 0.15 * Math.sin(x*0.8   - z*0.6  + t*0.55);
    return h * P.amplitude * (0.35 + z * 0.045);
  }
  const KX = () => (W/2) * 1.08 / F;       // demi-largeur monde visible par unité de z

  let gx = new Float32Array(0), gy = new Float32Array(0);
  function computeGrid(nx, nz, t){
    if (gx.length < nx*nz){ gx = new Float32Array(nx*nz); gy = new Float32Array(nx*nz); }
    const hw = W/2, kx = KX();
    for (let i = 0; i < nz; i++){
      const z = Z_NEAR + (Z_FAR - Z_NEAR) * Math.pow(i/(nz-1), ZPOW);
      const s = F/z, xr = kx*z;
      for (let j = 0; j < nx; j++){
        const u = j/(nx-1)*2 - 1;
        gx[i*nx+j] = hw + u*hw*1.08;
        const sy = HOR + (CAM_H - height(u*xr, z, t)) * s;
        gy[i*nx+j] = sy + ripY(gx[i*nx+j], sy);
      }
    }
  }
  const rowW = (i, nz) => fadeV(i/(nz-1));
  function fadeV(v){
    if (!OCCL) return Math.pow(Math.sin(Math.PI*v), 0.7) * (1 - 0.45*v);
    const att = (!isDark() && P.farKeep) ? 0.88 * (1 - P.farKeep) : 0.88;   // P.farKeep (clair) : part du fond gardée, pour que la crête lointaine se lise
    return Math.min(1, v/0.05) * (1 - att * Math.pow(v, 1.15));
  }
  function rasterRow(i, nx){
    const base = i*nx;
    for (let c = 0; c < nx-1; c++){
      const x0 = gx[base+c], y0 = gy[base+c], x1 = gx[base+c+1], y1 = gy[base+c+1];
      const a = Math.max(0, Math.ceil(x0)), b = Math.min(W-1, Math.floor(x1)), k = (y1-y0)/(x1-x0);
      for (let px = a; px <= b; px++){ const y = y0 + (px-x0)*k; if (y < hb[px]) hb[px] = y; }
    }
  }

  // Particules fixes sur la surface
  const MAXP = 400000;
  const ru = new Float32Array(MAXP), rf = new Float32Array(MAXP), rw = new Float32Array(MAXP);
  let seedA = 1337;
  const rnd = () => { seedA |= 0; seedA = seedA + 0x6D2B79F5 | 0; let t = Math.imul(seedA ^ seedA >>> 15, 1 | seedA);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = 0; i < MAXP; i++){ ru[i] = rnd(); rf[i] = rnd(); rw[i] = 0.35 + 0.65 * rnd() * rnd(); }
  const NOISE = new Float32Array(65536); for (let i = 0; i < 65536; i++) NOISE[i] = rnd();
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  const PNX = 220, PNZ = 180;
  function scatterWave(t, count, emit){
    computeGrid(PNX, PNZ, t);
    hb.fill(1e9);
    const perBand = Math.max(1, Math.floor(count/(PNZ-1)));
    for (let i = 0; i < PNZ-1; i++){
      if (OCCL) rasterRow(i, PNX);
      const w0 = rowW(i, PNZ);
      if (w0 < 0.003) continue;
      const a = i*PNX, b = a + PNX;
      for (let k = 0; k < perBand; k++){
        const id = (i*perBand + k) % MAXP;
        const cx = ru[id]*(PNX-1), c = cx|0, fx = cx - c, f = rf[id];
        const ya = gy[a+c] + (gy[a+c+1] - gy[a+c]) * fx;
        const yb = gy[b+c] + (gy[b+c+1] - gy[b+c]) * fx;
        const sy = ya + (yb - ya) * f;
        const sx = gx[a+c] + (gx[a+c+1] - gx[a+c]) * fx;
        if (sy < 0 || sy >= H || sx < 0 || sx >= W) continue;
        if (sy > hb[sx|0] + 0.5) continue;
        emit(sx, sy, w0 * rw[id]);
      }
    }
  }
  // ───────────── Réseau : nœuds reliés, paquets de données en transit ─────────────
  let NET = null, NX_ = new Float32Array(0), NY_ = NX_, NF = NX_;
  function ensureNet(){
    const n = Math.max(60, Math.min(600, Math.round(220*P.density)));
    if (NET && NET.n === n) return;
    const u = new Float32Array(n), v = new Float32Array(n), w = new Float32Array(n), ph = new Float32Array(n);
    for (let i = 0; i < n; i++){ u[i] = hash(i,1)*2.2 - 1.1; v[i] = hash(i,2); w[i] = hash(i,3)*2 - 1; ph[i] = hash(i,4)*6.2832; }
    // topologie stable : k plus proches voisins, calculés une seule fois
    const knn = k => {
      const seen = new Set(), out = [];
      for (let i = 0; i < n; i++){
        const d = [];
        for (let j = 0; j < n; j++) if (j !== i){
          const du = (u[i]-u[j])*1.4, dv = v[i]-v[j], dw = (w[i]-w[j])*0.3;
          d.push([du*du + dv*dv + dw*dw, j]);
        }
        d.sort((a, b) => a[0] - b[0]);
        for (let q = 0; q < k; q++){
          const j = d[q][1], a = Math.min(i, j), b = Math.max(i, j), key = a*4096 + b;
          if (!seen.has(key)){ seen.add(key); out.push(a, b); }
        }
      }
      return Int32Array.from(out);
    };
    const e3 = knn(3), e6 = knn(6);
    const deg = new Uint8Array(n); for (let e = 0; e < e3.length; e++) deg[e3[e]]++;
    const m = e3.length/2, pk = new Float32Array(m), pp = new Float32Array(m);
    for (let e = 0; e < m; e++){
      pk[e] = hash(e, 9) < 0.4 ? (0.12 + 0.3*hash(e, 10)) * (hash(e, 11) < 0.5 ? -1 : 1) : 0;
      pp[e] = hash(e, 12);
    }
    NET = { n, u, v, w, ph, e3, e6, deg, pk, pp };
    NX_ = new Float32Array(n); NY_ = new Float32Array(n); NF = new Float32Array(n);
  }
  function netPositions(t){
    const N = NET, kx = KX(), thick = OCCL ? 0.8 : 0.6 + 1.6*P.bandWidth;
    for (let i = 0; i < N.n; i++){
      const z = Z_NEAR + (Z_FAR - Z_NEAR)*N.v[i];
      const x = N.u[i]*kx*z + 0.6*Math.sin(t*0.3 + N.ph[i]);
      const y = 0.45*height(x, z, t) + N.w[i]*thick + 0.25*Math.sin(t*0.5 + N.ph[i]*1.7);
      NX_[i] = PX(x, z); NY_[i] = PY(y, z) + ripY(NX_[i], PY(y, z)); NF[i] = fadeV(N.v[i]);
    }
  }
  const frac = x => x - Math.floor(x);
  const packetPos = (e, t) => NET.pk[e] ? frac(t*NET.pk[e] + NET.pp[e]) : -1;

  // Le réseau alimente les mêmes rendus que la vague (particules, ASCII, code, dot matrix)
  function scatterNet(t, count, emit){
    ensureNet(); netPositions(t);
    const E = NET.e3, put = (x, y, w) => { if (x >= 0 && x < W && y >= 0 && y < H) emit(x, y, w); };
    let total = 0;
    for (let e = 0; e < E.length; e += 2) total += Math.hypot(NX_[E[e+1]] - NX_[E[e]], NY_[E[e+1]] - NY_[E[e]]);
    const step = Math.max(0.5, total / Math.max(1, count*0.7));
    for (let e = 0; e < E.length; e += 2){
      const a = E[e], b = E[e+1], x0 = NX_[a], y0 = NY_[a], x1 = NX_[b], y1 = NY_[b];
      if (Math.max(x0, x1) < 0 || Math.min(x0, x1) > W || Math.max(y0, y1) < 0 || Math.min(y0, y1) > H) continue;
      const fa = NF[a], fb = NF[b], n = Math.min(3000, Math.ceil(Math.hypot(x1 - x0, y1 - y0)/step));
      for (let s = 0; s < n; s++){ const f = (s + 0.5)/n; put(x0 + (x1 - x0)*f, y0 + (y1 - y0)*f, (fa + (fb - fa)*f)*0.5); }
      const f = packetPos(e >> 1, t);
      if (f >= 0){
        const px = x0 + (x1 - x0)*f, py = y0 + (y1 - y0)*f, pw = (fa + (fb - fa)*f)*1.6;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) put(px + dx*DPR, py + dy*DPR, pw);
      }
    }
    for (let i = 0; i < NET.n; i++){
      const r = (1 + NET.deg[i]*0.4)*DPR;
      for (let s = 0; s < 12; s++){
        const ang = s*0.5236 + i;
        put(NX_[i] + Math.cos(ang)*r*hash(i, s + 20), NY_[i] + Math.sin(ang)*r*hash(i, s + 40), NF[i]*0.8);
      }
    }
  }
  function scatter(t, count, emit){
    if (SHAPEFN[P.shape]) return scatterSegs(t, count, emit);
    return P.shape === 'network' ? scatterNet(t, count, emit) : scatterWave(t, count, emit);
  }

  // Rendu filaire du réseau (Maillage : liens + paquets, Facettes : maillage dense)
  function renderNetLines(t, dense){
    ensureNet(); netPositions(t); paintBg();
    const dark = isDark(), E = dense ? NET.e6 : NET.e3, xbOf = x => Math.max(0, Math.min(31, (x/W*31)|0));
    ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply';
    ctx.lineWidth = Math.max(0.6, DPR*(dense ? 0.55 : 0.8));
    for (let e = 0; e < E.length; e += 2){
      const a = E[e], b = E[e+1], al = Math.min(NF[a], NF[b]) * (dense ? 0.4 : 0.6);
      if (al < 0.01) continue;
      ctx.globalAlpha = al; ctx.strokeStyle = STY[xbOf((NX_[a] + NX_[b])/2)*8 + 7];
      ctx.beginPath(); ctx.moveTo(NX_[a], NY_[a]); ctx.lineTo(NX_[b], NY_[b]); ctx.stroke();
    }
    for (let i = 0; i < NET.n; i++){
      if (NF[i] < 0.02) continue;
      ctx.globalAlpha = Math.min(1, NF[i]); ctx.fillStyle = STY[xbOf(NX_[i])*8 + 7];
      ctx.beginPath(); ctx.arc(NX_[i], NY_[i], (0.9 + NET.deg[i]*0.35)*DPR, 0, 6.2832); ctx.fill();
    }
    const E3 = NET.e3; ctx.fillStyle = `rgb(${STOPS[0].join(',')})`;
    for (let e = 0; e < E3.length; e += 2){
      const f = packetPos(e >> 1, t); if (f < 0) continue;
      const a = E3[e], b = E3[e+1], al = Math.min(NF[a], NF[b]); if (al < 0.03) continue;
      const x = NX_[a] + (NX_[b] - NX_[a])*f, y = NY_[a] + (NY_[b] - NY_[a])*f;
      ctx.globalAlpha = al*0.25; ctx.beginPath(); ctx.arc(x, y, 5*DPR, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = al;      ctx.beginPath(); ctx.arc(x, y, 1.6*DPR, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ───────────── Formes « tracés » : chaque forme produit des segments et des points lumineux à l'écran ─────────────
  // Un seul pipeline pour toutes : Maillage et Facettes tracent les segments, les autres rendus les échantillonnent.
  const SG = { d: new Float32Array(6*20000), n: 0, hot: [] };
  function segPush(x1, y1, x2, y2, a, c){
    if (a < 0.01) return;
    if ((SG.n + 1)*6 > SG.d.length){ const nd = new Float32Array(SG.d.length*2); nd.set(SG.d); SG.d = nd; }
    const d = SG.d, o = SG.n*6;
    d[o] = x1; d[o+1] = y1; d[o+2] = x2; d[o+3] = y2; d[o+4] = a; d[o+5] = c; SG.n++;
  }
  const smooth = x => x <= 0 ? 0 : x >= 1 ? 1 : x*x*(3 - 2*x);
  const bandBox = () => P.layout === 'band' ? [H*P.waveY, H*0.17*P.bandWidth] : [H*0.64, H*0.3];
  const PTR = { x: -1e9, y: -1e9, t: -1e9, inside: false };

  // 1 · Convergence : beaucoup de filaments partent, la plupart s'éteignent, quelques-uns forment le flux principal
  function shapeFlow(t, dense){
    const [cy, bh] = bandBox(), n = Math.round((dense ? 120 : 75)*P.density), NPT = 110, amp = P.amplitude;
    for (let i = 0; i < n; i++){
      const surv = hash(i, 2) < (dense ? 0.12 : 0.15);
      const y0 = cy + (hash(i, 1)*2 - 1)*bh*1.3, yE = cy + (hash(i, 3) - 0.5)*bh*0.12;
      const die = surv ? 9 : 0.12 + 0.55*hash(i, 4) + 0.07*Math.sin(t*0.3 + i*1.7);
      const ph = hash(i, 5)*6.2832, fr = 0.5 + hash(i, 6)*1.3, base = surv ? 1 : 0.5;
      const pos = u => {
        const conv = Math.pow(smooth(u*1.05), 1.4), x = -W*0.02 + u*W*1.04;
        const y = y0 + (yE - y0)*conv + Math.sin(u*6.2832*fr + ph - t*0.5)*bh*0.22*amp*(1 - conv*0.92);
        return [x, y + ripY(x, y)];
      };
      let px = 0, py = 0, pa = 0;
      for (let k = 0; k < NPT; k++){
        const u = k/(NPT - 1);
        if (u > die + 0.1) break;
        const [x, y] = pos(u);
        const a = base*Math.min(1, u/0.05)*(surv ? 1 : smooth((die + 0.1 - u)/0.18));
        if (k) segPush(px, py, x, y, (pa + a)*0.5, -1);
        px = x; py = y; pa = a;
      }
      if (surv) for (let q = 0; q < 2; q++){
        const u = frac(t*0.05*(1 + hash(i, 7 + q)) + hash(i, 9 + q)), [x, y] = pos(u);
        SG.hot.push({ x, y, r: 1.6*DPR, a: Math.min(1, u/0.05), c: -1, glow: true });
      }
    }
  }

  // 2 · Grille : structure ordonnée que le curseur casse ; elle se recompose (ressorts). Sans curseur, perturbation automatique
  let GR = null;
  function shapeGrid(t, dense){
    const [cy, bh] = bandBox(), sp = Math.max(10, 24*DPR/Math.sqrt(P.density));
    const cols = Math.ceil(W/sp) + 2, rows = Math.max(3, Math.round(bh*2.2/sp)), N = cols*rows;
    if (!GR || GR.cols !== cols || GR.rows !== rows){
      const f = () => new Float32Array(N);
      GR = { cols, rows, dx: f(), dy: f(), vx: f(), vy: f(), X: f(), Y: f(), A: f() };
    }
    let ax = 0, ay = 0, on = true;
    if (PTR.inside && clock - PTR.t < 3){ ax = PTR.x; ay = PTR.y; }
    else if (clock - PTR.t > 2.5){ ax = W*(0.5 + 0.42*Math.sin(clock*0.21)); ay = cy + bh*0.7*Math.sin(clock*0.37); }
    else on = false;
    const R = 150*DPR, Fo = 40*DPR*P.amplitude, top = cy - (rows - 1)*sp/2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
      const i = r*cols + c, bx = (c - 1)*sp;
      const by = top + r*sp + Math.sin(bx*0.005 + t*0.6)*sp*0.3*P.amplitude;
      let tx = 0, ty = 0;
      if (on){
        const ex = bx - ax, ey = by - ay, d = Math.hypot(ex, ey) + 1e-3;
        if (d < R){ const k = (1 - d/R)**2; tx = ex/d*k*Fo + (hash(c, r) - 0.5)*k*Fo*1.2; ty = ey/d*k*Fo + (hash(r + 31, c) - 0.5)*k*Fo*1.2; }
      }
      GR.vx[i] = (GR.vx[i] + (tx - GR.dx[i])*0.16)*0.8; GR.dx[i] += GR.vx[i];
      GR.vy[i] = (GR.vy[i] + (ty - GR.dy[i])*0.16)*0.8; GR.dy[i] += GR.vy[i];
      const x = bx + GR.dx[i], y0 = by + GR.dy[i], y = y0 + ripY(x, y0);
      GR.X[i] = x; GR.Y[i] = y;
      const disp = Math.hypot(GR.dx[i], GR.dy[i]);
      GR.A[i] = Math.pow(Math.sin(Math.PI*(r + 0.5)/rows), 0.7)*(0.55 + Math.min(0.6, disp/sp*0.5));
      if (disp > sp*0.35) SG.hot.push({ x, y, r: 1.1*DPR, a: GR.A[i], c: -1 });
    }
    const link = (i, j) => {
      const L = Math.hypot(GR.X[j] - GR.X[i], GR.Y[j] - GR.Y[i])/sp;
      if (L > 1.6) return;                                   // trop étiré : le lien casse
      segPush(GR.X[i], GR.Y[i], GR.X[j], GR.Y[j], (GR.A[i] + GR.A[j])*0.5*Math.max(0.2, Math.min(1, 1 - (L - 1)*1.6)), -1);
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
      const i = r*cols + c;
      if (c < cols - 1) link(i, i + 1);
      if (r < rows - 1) link(i, i + cols);
      if (dense && c < cols - 1 && r < rows - 1) link(i, i + cols + 1);
    }
  }

  // 3 · Relief : courbes de niveau d'un champ qui évolue lentement (marching squares), une courbe maîtresse sur quatre
  let CF = new Float32Array(0);
  function shapeContours(t, dense){
    const [cy, bh] = bandBox(), cs = Math.max(6, Math.round(11*DPR/Math.sqrt(P.density)));
    const y0 = cy - bh*1.3, cols = Math.ceil(W/cs) + 1, rows = Math.ceil(bh*2.6/cs) + 1;
    if (CF.length < cols*rows) CF = new Float32Array(cols*rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
      const u = c*cs/W*7, v = (y0 + r*cs - cy)/bh*1.6;
      CF[r*cols + c] = (Math.sin(u*0.9 + t*0.12)*Math.cos(v*1.2 - t*0.09) + 0.6*Math.sin(u*1.7 - v*1.1 + t*0.18)
                      + 0.3*Math.sin(u*3.3 + v*2.4 - t*0.27))*P.amplitude;
    }
    const st = dense ? 0.12 : 0.2, L0 = -2.4, NL = Math.ceil(4.8/st);
    const P2 = (x, y) => [x, y + ripY(x, y)];
    for (let r = 0; r < rows - 1; r++){
      const y = y0 + r*cs, m = smooth(1 - Math.abs(y + cs/2 - cy)/(bh*1.3));
      if (m < 0.02) continue;
      for (let c = 0; c < cols - 1; c++){
        const x = c*cs, a = CF[r*cols + c], b = CF[r*cols + c + 1], cc = CF[(r + 1)*cols + c + 1], d = CF[(r + 1)*cols + c];
        const mn = Math.min(a, b, cc, d), mx = Math.max(a, b, cc, d);
        for (let li = Math.max(0, Math.ceil((mn - L0)/st)); li < NL; li++){
          const L = L0 + li*st; if (L > mx) break;
          const e = [];
          if ((a > L) !== (b > L)) e.push(P2(x + (L - a)/(b - a)*cs, y));
          if ((b > L) !== (cc > L)) e.push(P2(x + cs, y + (L - b)/(cc - b)*cs));
          if ((d > L) !== (cc > L)) e.push(P2(x + (L - d)/(cc - d)*cs, y + cs));
          if ((a > L) !== (d > L)) e.push(P2(x, y + (L - a)/(d - a)*cs));
          const al = (li % 4 === 0 ? 0.95 : 0.42)*m;
          if (e.length >= 2) segPush(e[0][0], e[0][1], e[1][0], e[1][1], al, -1);
          if (e.length === 4) segPush(e[2][0], e[2][1], e[3][0], e[3][1], al, -1);
        }
      }
    }
  }

  // 5 · Ordre : le chaos s'organise en treillis régulier (front de gauche à droite), tient, puis se défait
  let OR_ = null;
  function shapeOrder(t, dense){
    const [cy, bh] = bandBox(), sp = Math.max(12, 28*DPR/Math.sqrt(P.density));
    const cols = Math.ceil(W/sp) + 1, rows = Math.max(3, Math.round(bh*2/sp)), N = cols*rows, top = cy - (rows - 1)*sp/2;
    if (!OR_ || OR_.length !== N*3) OR_ = new Float32Array(N*3);
    const ph = frac(t/16), org = (ph - 0.12)/0.33, dis = (ph - 0.68)/0.22;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
      const i = r*cols + c, u = c/(cols - 1);
      const o = ph < 0.12 ? 0 : ph < 0.68 ? smooth((org*1.4 - u)/0.4) : 1 - smooth((dis*1.4 - u)/0.4);
      const h1 = hash(c, r), h2 = hash(r + 50, c), h3 = hash(c + 90, r + 3);
      const qx = c*sp + Math.sin(t*0.6 + h1*40)*sp*2 + (h2 - 0.5)*sp*6;
      const qy = cy + (h3*2 - 1)*bh*1.2 + Math.cos(t*0.5 + h2*30)*sp*1.5;
      const x = qx + (c*sp - qx)*o, y0 = qy + (top + r*sp - qy)*o, y = y0 + ripY(x, y0);
      const rf = Math.pow(Math.sin(Math.PI*(r + 0.5)/rows), 0.5);
      OR_[i*3] = x; OR_[i*3 + 1] = y; OR_[i*3 + 2] = o*rf;
      SG.hot.push({ x, y, r: (0.8 + 0.7*o)*DPR, a: (0.45 + 0.5*o)*(0.5 + 0.5*rf), c: -1 });
    }
    const link = (i, j) => {
      const a = Math.min(OR_[i*3 + 2], OR_[j*3 + 2]);
      // ordonné : treillis net ; en désordre : un enchevêtrement ténu entre voisins encore proches
      const L = Math.hypot(OR_[j*3] - OR_[i*3], OR_[j*3 + 1] - OR_[i*3 + 1]);
      const al = Math.max(a*a*0.85, L < sp*5 ? (1 - a)*0.16 : 0);
      segPush(OR_[i*3], OR_[i*3 + 1], OR_[j*3], OR_[j*3 + 1], al, -1);
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
      const i = r*cols + c;
      if (c < cols - 1) link(i, i + 1);
      if (r < rows - 1) link(i, i + cols);
      if (dense && c < cols - 1 && r < rows - 1) link(i, i + cols + 1);
    }
  }

  // Réseau alternatif · Métro : un plan de lignes à 0° et 45°, une couleur par ligne, des rames qui circulent,
  // des stations qui s'allument au passage. Chaque ligne, c'est un service qui fait son trajet jusqu'à la production.
  let METRO = null;
  function buildMetro(){
    const [cy, bh] = bandBox(), track = 13*DPR, nL = Math.max(4, Math.round(7*Math.min(1.5, P.density)));
    const key = [W, H, cy, bh, nL].join();
    if (METRO && METRO.key === key) return METRO;
    const snap = y => cy + Math.round((y - cy)/track)*track;
    const lines = [];
    for (let li = 0; li < nL; li++){
      let x = -60*DPR, y = snap(cy + (hash(li, 1)*2 - 1)*bh*0.9), k = 0;
      const pts = [x, y];
      while (x < W + 60*DPR && k < 80){
        x += (70 + 200*hash(li, k*2 + 3))*DPR; pts.push(x, y);
        const ty = snap(cy + (hash(li, k*2 + 4)*2 - 1)*bh*0.95), dy = ty - y;
        if (Math.abs(dy) > 1){ x += Math.abs(dy); y = ty; pts.push(x, y); }
        k++;
      }
      const cum = [0];
      for (let v = 2; v < pts.length; v += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[v] - pts[v - 2], pts[v + 1] - pts[v - 1]));
      const stations = [];
      for (let v = 1; v < pts.length/2 - 1; v++) if (hash(li, v + 200) < 0.7) stations.push(v);
      const nt = 2 + (hash(li, 300) < 0.5 ? 1 : 0), trains = [];
      for (let q = 0; q < nt; q++) trains.push({ sp: (40 + 50*hash(li, 310 + q))*DPR/cum[cum.length - 1], ph: hash(li, 320 + q) });
      lines.push({ pts, cum, total: cum[cum.length - 1], c: nL > 1 ? li/(nL - 1) : 0.5, stations, trains });
    }
    return METRO = { key, lines };
  }
  function lineAt(L, s){
    const { pts, cum } = L;
    let v = 1; while (v < cum.length - 1 && cum[v] < s) v++;
    const f = (s - cum[v - 1])/((cum[v] - cum[v - 1]) || 1), i = (v - 1)*2;
    return [pts[i] + (pts[i + 2] - pts[i])*f, pts[i + 1] + (pts[i + 3] - pts[i + 1])*f];
  }
  function shapeMetro(t, dense){
    const M = buildMetro(), rp = (x, y) => y + ripY(x, y);
    for (const L of M.lines){
      const p = L.pts;
      for (let i = 0; i < p.length - 2; i += 2){
        const x1 = p[i], y1 = rp(p[i], p[i + 1]), x2 = p[i + 2], y2 = rp(p[i + 2], p[i + 3]);
        if (dense){                                       // Facettes : double voie
          const len = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1)/len*1.8*DPR, ny = (x2 - x1)/len*1.8*DPR;
          segPush(x1 + nx, y1 + ny, x2 + nx, y2 + ny, 0.75, L.c); segPush(x1 - nx, y1 - ny, x2 - nx, y2 - ny, 0.75, L.c);
        } else segPush(x1, y1, x2, y2, 0.8, L.c);
      }
      const tr = L.trains.map(T => {
        const s = frac(t*T.sp + T.ph)*L.total, [x, y] = lineAt(L, s), [bx, by] = lineAt(L, Math.max(0, s - 30*DPR));
        segPush(bx, rp(bx, by), x, rp(x, y), 1, L.c);
        SG.hot.push({ x, y: rp(x, y), r: 2.4*DPR, a: 1, c: L.c, glow: true });
        return [x, y];
      });
      for (const v of L.stations){
        const x = p[v*2], y = p[v*2 + 1];
        let near = 0; for (const [tx, ty] of tr) near = Math.max(near, Math.exp(-Math.hypot(tx - x, ty - y)/(40*DPR)));
        SG.hot.push({ x, y: rp(x, y), r: 3.2*DPR, a: 0.55 + 0.45*near, c: L.c, ring: true });
      }
    }
  }

  const SHAPEFN = { flow: shapeFlow, grid: shapeGrid, contours: shapeContours, order: shapeOrder, metro: shapeMetro };
  function buildSegs(t, dense){ SG.n = 0; SG.hot.length = 0; SHAPEFN[P.shape](t, dense); }

  // Rendu filaire : tri des segments par couleur et intensité, un tracé par groupe
  const NBX = 12, NBA = 6;
  let segBin = new Uint8Array(0), segOrd = new Int32Array(0);
  const colorAt = p => `rgb(${stopAt(p).map(Math.round).join(',')})`;
  function renderSegs(t, dense){
    buildSegs(t, dense); paintBg();
    const dark = isDark(), d = SG.d, n = SG.n, NB = NBX*NBA;
    if (segBin.length < n){ segBin = new Uint8Array(n*2); segOrd = new Int32Array(n*2); }
    const start = new Int32Array(NB + 1);
    for (let i = 0; i < n; i++){
      const o = i*6, ab = Math.min(NBA - 1, (Math.min(1, d[o + 4])*NBA)|0);
      const cp = d[o + 5] >= 0 ? d[o + 5] : (d[o] + d[o + 2])*0.5/W;
      const b = Math.max(0, Math.min(NBX - 1, (cp*NBX)|0))*NBA + ab;
      segBin[i] = b; start[b + 1]++;
    }
    for (let b = 0; b < NB; b++) start[b + 1] += start[b];
    const fill = start.slice();
    for (let i = 0; i < n; i++) segOrd[fill[segBin[i]]++] = i;
    ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply';
    ctx.lineWidth = Math.max(0.6, DPR*(dense ? 0.6 : 0.9)); ctx.lineCap = 'round';
    for (let b = 0; b < NB; b++){
      if (start[b] === start[b + 1]) continue;
      ctx.globalAlpha = ((b % NBA) + 0.6)/NBA; ctx.strokeStyle = colorAt(((b/NBA)|0)/(NBX - 1));
      ctx.beginPath();
      for (let k = start[b]; k < start[b + 1]; k++){ const o = segOrd[k]*6; ctx.moveTo(d[o], d[o + 1]); ctx.lineTo(d[o + 2], d[o + 3]); }
      ctx.stroke();
    }
    const bgFill = `rgb(${BASE.join(',')})`;
    for (const h of SG.hot){
      const col = colorAt(h.c >= 0 ? h.c : h.x/W);
      if (h.ring){
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = bgFill;
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 6.2832); ctx.fill();
        ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply';
        ctx.globalAlpha = Math.min(1, h.a); ctx.strokeStyle = col; ctx.lineWidth = 1.5*DPR; ctx.stroke();
        continue;
      }
      ctx.fillStyle = col;
      if (h.glow){ ctx.globalAlpha = Math.min(1, h.a)*0.22; ctx.beginPath(); ctx.arc(h.x, h.y, h.r*3, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = Math.min(1, h.a); ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }
  // Échantillonnage des segments pour Particules, ASCII, Code et Dot matrix
  function scatterSegs(t, count, emit){
    buildSegs(t, false);
    const d = SG.d, n = SG.n, put = (x, y, w) => { if (x >= 0 && x < W && y >= 0 && y < H) emit(x, y, w); };
    let total = 0;
    for (let i = 0; i < n; i++){ const o = i*6; total += Math.hypot(d[o + 2] - d[o], d[o + 3] - d[o + 1]); }
    const step = Math.max(0.5, total/Math.max(1, count*0.7));
    for (let i = 0; i < n; i++){
      const o = i*6, len = Math.hypot(d[o + 2] - d[o], d[o + 3] - d[o + 1]), m = Math.max(1, Math.ceil(len/step)), w = d[o + 4]*0.6;
      for (let s = 0; s < m; s++){ const f = (s + 0.5)/m; put(d[o] + (d[o + 2] - d[o])*f, d[o + 1] + (d[o + 3] - d[o + 1])*f, w); }
    }
    for (const h of SG.hot){
      put(h.x, h.y, h.a*1.4);
      for (let k = 0; k < 8; k++){ const an = k*0.785; put(h.x + Math.cos(an)*h.r, h.y + Math.sin(an)*h.r, h.a*0.7); }
    }
  }

  const particleCount = () =>
    Math.min(MAXP, Math.round(130000 * P.density * Math.max(0.35, (W*H)/(2400*1250))));

  // Densité échantillonnée par cellule (ASCII, code, dot matrix)
  let D = new Float32Array(0);
  function cellPass(t, cw, ch){
    const cols = Math.ceil(W/cw), rows = Math.ceil(H/ch);
    if (D.length < cols*rows) D = new Float32Array(cols*rows); else D.fill(0, 0, cols*rows);
    const count = particleCount();
    scatter(t, count, (sx, sy, w) => { D[((sy/ch)|0)*cols + ((sx/cw)|0)] += w; });
    let sum = 0, nz = 0;
    for (let i = 0; i < cols*rows; i++) if (D[i] > 0){ sum += D[i]; nz++; }
    return { cols, rows, k: 0.7 / Math.max(1e-6, nz ? sum/nz : 1) };
  }
  const paintBg = () => { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; if (opts.transparent && !isDark()) ctx.clearRect(0, 0, W, H); else ctx.drawImage(bgC, 0, 0); };
  const monoFont = px => `${px}px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace`;

  // ───────────────────────── Rendus ─────────────────────────
  function renderParticles(t){
    let n = 0; stamp++;
    scatter(t, particleCount(), (sx, sy, w) => {
      const X = sx|0, p = (sy|0)*W + X, li = ((X/W)*255|0)*3;
      if (mark[p] !== stamp){ mark[p] = stamp; touched[n++] = p; R[p] = G[p] = B[p] = A[p] = 0; }
      R[p] += LUTP[li]*w; G[p] += LUTP[li+1]*w; B[p] += LUTP[li+2]*w; A[p] += w;
    });
    px32.set(bg32);
    const dark = isDark(), gain = dark ? 1.7 : 1.8;
    for (let k = 0; k < n; k++){
      const p = touched[k], q = p*4;
      const br = bgBytes[q], bgg = bgBytes[q+1], bb = bgBytes[q+2];
      let r, g, b;
      if (dark){
        r = br  + (255 - br)  * (1 - Math.exp(-R[p]*gain));
        g = bgg + (255 - bgg) * (1 - Math.exp(-G[p]*gain));
        b = bb  + (255 - bb)  * (1 - Math.exp(-B[p]*gain));
      } else {
        // mode clair : on recouvre le fond avec la couleur pure, sans l'assombrir
        const a = A[p], cov = 1 - Math.exp(-a*gain);
        r = br + (R[p]/a*255 - br)*cov; g = bgg + (G[p]/a*255 - bgg)*cov; b = bb + (B[p]/a*255 - bb)*cov;
      }
      px32[p] = (255 << 24) | ((b|0) << 16) | ((g|0) << 8) | (r|0);
    }
    ctx.putImageData(img, 0, 0);
  }

  function renderMesh(t){
    if (SHAPEFN[P.shape]) return renderSegs(t, false);
    if (P.shape === 'network') return renderNetLines(t, false);
    const nx = Math.round(150*P.density) + 20, nz = Math.round(90*P.density) + 20;
    computeGrid(nx, nz, t);
    paintBg();
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    STOPS.forEach((c, i) => grad.addColorStop(i/(STOPS.length-1)*(P.stopEnd || STOP_END), `rgb(${c.join(',')})`));
    grad.addColorStop(1, `rgb(${STOPS[STOPS.length - 1].join(',')})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(0.6, DPR*0.7);
    ctx.globalCompositeOperation = isDark() ? 'lighter' : 'multiply';
    const k = isDark() ? 1 : (P.lightInk || 1);   // P.lightInk : encrage du maillage en clair (1 par défaut), pour qu'il tienne sur un fond coloré
    for (let i = 0; i < nz; i++){
      const a = Math.min(1, rowW(i, nz) * 0.6 * k);
      if (a < 0.01) continue;
      ctx.globalAlpha = a; ctx.beginPath();
      const base = i*nx; ctx.moveTo(gx[base], gy[base]);
      for (let j = 1; j < nx; j++) ctx.lineTo(gx[base+j], gy[base+j]);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.18 * k;
    const i0 = OCCL ? Math.ceil(nz*0.03) : 0;
    for (let j = 0; j < nx; j++){
      ctx.beginPath(); ctx.moveTo(gx[i0*nx+j], gy[i0*nx+j]);
      for (let i = i0+1; i < nz; i++) ctx.lineTo(gx[i*nx+j], gy[i*nx+j]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ASCII + mot caché
  const RAMP = ' .-~:<>t1l(){}[]', WORD = 'OVHcloud';
  let slots = [], wordMark = new Uint32Array(0), wordChar = new Uint8Array(0);
  function renderAscii(t, now){
    const cw = Math.max(6, Math.round(8*DPR)), ch = Math.max(9, Math.round(13*DPR));
    const { cols, rows, k } = cellPass(t, cw, ch);
    const vAt = i => 1 - Math.exp(-D[i]*k);
    if (wordMark.length < cols*rows){ wordMark = new Uint32Array(cols*rows); wordChar = new Uint8Array(cols*rows); }
    stamp++;
    slots.length = Math.min(slots.length, P.wordCount);
    while (slots.length < P.wordCount) slots.push({ x:-1, y:0, until:0 });
    for (const s of slots){
      if (now > s.until || s.x + WORD.length > cols || s.y >= rows){
        s.x = -1; s.until = now + 400;
        for (let tries = 0; tries < 40; tries++){
          const x = (Math.random()*(cols - WORD.length))|0, y = (Math.random()*rows)|0;
          let ok = true;
          for (let L = 0; L < WORD.length && ok; L++) ok = vAt(y*cols + x + L) > 0.3;
          if (ok){ s.x = x; s.y = y; s.until = now + 3500 + Math.random()*6000; break; }
        }
      }
      if (s.x >= 0) for (let L = 0; L < WORD.length; L++){ const i = s.y*cols + s.x + L; wordMark[i] = stamp; wordChar[i] = L; }
    }
    paintBg();
    ctx.font = monoFont(Math.round(11*DPR)); ctx.textBaseline = 'top';
    let last = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++){
      const i = y*cols + x;
      if (D[i] === 0) continue;
      const v = vAt(i);
      const isWord = wordMark[i] === stamp && v > 0.12;
      const ci = Math.min(RAMP.length-1, (v*RAMP.length)|0);
      if (ci === 0 && !isWord) continue;
      const ab = Math.min(7, ((v*8)|0) + (isWord ? 1 : 0));
      const s = STY[(((x/cols)*31)|0)*8 + ab];
      if (s !== last){ ctx.fillStyle = s; last = s; }
      ctx.fillText(isWord ? WORD[wordChar[i]] : RAMP[ci], x*cw, y*ch);
    }
  }

  // Code lisible masqué par la vague
  const CODE = `resource "ovh_cloud_project_kube" "labs" {
  service_name = var.project_id
  name         = "labs-cluster"
  region       = "GRA9"
  version      = "1.31"
}

resource "ovh_cloud_project_kube_nodepool" "pool" {
  kube_id       = ovh_cloud_project_kube.labs.id
  flavor_name   = "b3-8"
  desired_nodes = 3
  autoscale     = true
}

# list running instances
import ovh
client = ovh.Client(endpoint="ovh-eu")

def running(project_id):
    for inst in client.get(f"/cloud/project/{project_id}/instance"):
        if inst["status"] == "ACTIVE":
            yield inst["name"], inst["region"]

// ship the preview build
async function deploy(app) {
  const bucket = await storage.create({ region: "SBG", tier: "standard" });
  await app.push({ target: bucket, replicas: 2 });
  if (!app.healthy) throw new Error("rollback");
  return { url: app.endpoint, status: "ready" };
}

apiVersion: apps/v1
kind: Deployment
metadata:
  name: labs-preview
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: api
          image: registry.labs/api:beta
          ports:
            - containerPort: 8080
`.split('\n');
  function renderCode(t){
    const cw = Math.max(6, Math.round(8*DPR)), ch = Math.max(10, Math.round(14*DPR));
    const { cols, rows, k } = cellPass(t, cw, ch);
    paintBg();
    ctx.font = monoFont(Math.round(11*DPR)); ctx.textBaseline = 'top';
    const L = CODE.length, BW = 62, so = Math.floor(t * 0.9);
    let last = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++){
      const i = y*cols + x;
      if (D[i] === 0) continue;
      const v = 1 - Math.exp(-D[i]*k);
      if (v < 0.08) continue;
      const b = (x/BW)|0, line = CODE[(((y + so + b*17) % L) + L) % L];
      const c = line[x - b*BW];
      let chr, ab;
      if (v < 0.28 || !c || c === ' '){
        // trame : les bords et les espaces restent visibles, la forme et son mouvement se lisent
        chr = v < 0.18 ? '.' : v < 0.4 ? ':' : '·'; ab = Math.min(3, (v*6)|0);
      } else {
        const lead = line.trimStart();
        const dim = lead.startsWith('#') || lead.startsWith('//') ? 2 : 0;
        chr = c; ab = Math.max(1, Math.min(7, 2 + ((v*7)|0) - dim));
      }
      const s = STY[(((x/cols)*31)|0)*8 + ab];
      if (s !== last){ ctx.fillStyle = s; last = s; }
      ctx.fillText(chr, x*cw, y*ch);
    }
  }

  // ───────────── Texte : comme l'ASCII, mais avec des mots entiers et lisibles ─────────────
  // Des lignes de titres de guides défilent lentement (une ligne sur deux dans l'autre sens).
  // Un mot n'est affiché que si la forme est assez dense sur toute sa longueur, et toujours en entier :
  // la silhouette vient des mots présents ou absents, jamais de lettres coupées.
  const DOC_TEXT = ['How to get started with a dedicated server', 'Configuring the vRack on your dedicated servers',
    'Getting started with a VPS', 'How to secure a VPS', 'Creating your first OVHcloud Public Cloud project',
    'How to create a Public Cloud instance and connect to it', 'Object Storage - Getting started',
    'Object Storage - Hosting a static website in an Object Storage bucket', 'Creating a cluster',
    'Deploying an application', 'Configuring kubectl on an OVHcloud Managed Kubernetes cluster',
    'Persistent Volumes on OVHcloud Managed Kubernetes Service', 'Getting started with Load Balancer on Public Cloud',
    'Creating a private network with Gateway', 'How to configure IPv6 on a VPS', 'Using Terraform with OVHcloud',
    'First steps with the OVHcloud APIs', 'Getting Started with OVHcloud CLI', 'How to use snapshots on a VPS',
    'Manage Software RAID on Dedicated Servers', 'Enabling and configuring the Edge Network Firewall',
    'How to install Docker and Docker Compose on a VPS', 'Setting up Veeam Backup & Replication',
    'Public VCF as-a-Service - Network concepts and best practices', 'Getting started with your Nutanix cluster',
    'Object Storage - Smart Storage Management with Lifecycle Rules', 'How to extend a private OVHcloud network across Public Cloud regions',
    'Deploying a GPU instance', 'Choosing the Right Block Storage Class', 'Getting started with OVHcloud Shell',
    'How to migrate a website from a VPS to a Dedicated Server', 'Configuring Additional IPs in bridge mode on your virtual machines',
    'Tutorial - Getting started with WordPress', 'Dynamically resizing a cluster with the cluster autoscaler'];
  const PRODUCTS = new Set(['VPS', 'Kubernetes', 'Terraform', 'Docker', 'IPv6', 'vRack', 'Nutanix', 'Veeam', 'WordPress', 'GPU', 'CLI', 'APIs', 'RAID', 'Gateway']);
  const textW = new Map(); let textFont = '';
  document.fonts && document.fonts.ready.then(() => textW.clear());
  function renderText(t){
    const cw = Math.max(5, Math.round(6*DPR)), lh = Math.max(14, Math.round(21*DPR));
    const { cols, rows, k } = cellPass(t, cw, lh);
    paintBg();
    const font = `500 ${Math.round(13*DPR)}px "Source Sans 3", "Source Sans Pro", system-ui, sans-serif`;
    if (font !== textFont){ textW.clear(); textFont = font; }
    ctx.font = font; ctx.textBaseline = 'middle';
    const wOf = s => { let w = textW.get(s); if (w === undefined){ w = ctx.measureText(s).width; textW.set(s, w); } return w; };
    const space = wOf(' '), dark = isDark(), N = DOC_TEXT.length;
    let last = '';
    for (let r = 0; r < rows; r++){
      // ligne vide ? on évite de mesurer et de dessiner pour rien
      let any = false; for (let c = 0; c < cols && !any; c++) any = D[r*cols + c] > 0;
      if (!any) continue;
      const tokens = [];
      for (let q = 0; q < 4; q++){ tokens.push(...DOC_TEXT[(r*5 + q*11) % N].split(' '), '\u00b7'); }
      const total = tokens.reduce((a, s) => a + wOf(s) + space, 0);
      const sp = (r & 1 ? 1 : -1)*(7 + (r % 3)*3)*DPR;
      let x = -(((t*sp) % total) + total) % total, i = 0;
      const y = r*lh + lh/2;
      while (x < W){
        const s = tokens[i % tokens.length], w = wOf(s);
        if (x + w > 0){
          const c0 = Math.max(0, Math.floor(x/cw)), c1 = Math.min(cols - 1, Math.floor((x + w)/cw));
          let sum = 0, mn = 1e9;
          for (let c = c0; c <= c1; c++){ const d = D[r*cols + c]; sum += d; if (d < mn) mn = d; }
          const v = 1 - Math.exp(-(sum/(c1 - c0 + 1))*k);
          if (v > 0.1 && mn > 0){
            const strong = PRODUCTS.has(s) ? 1 : 0;
            const ab = Math.min(7, (dark ? 1 : 2) + ((v*7)|0) + strong);
            const st = STY[Math.max(0, Math.min(31, ((x + w/2)/W*31)|0))*8 + ab];
            if (st !== last){ ctx.fillStyle = st; last = st; }
            ctx.fillText(s, x, y);
          }
        }
        x += w + space; i++;
      }
    }
  }

  function renderDots(t){
    const p = dotPitch();
    const { cols, rows, k } = cellPass(t, p, p);
    paintBg();
    const NB = 16, paths = Array.from({ length: NB }, () => new Path2D());
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++){
      const i = y*cols + x;
      if (D[i] === 0) continue;
      const v = 1 - Math.exp(-D[i]*k*1.2);
      if (v < 0.06) continue;
      const r = p * 0.44 * Math.sqrt(v), cx = x*p + p/2, cy = y*p + p/2;
      const path = paths[Math.min(NB-1, ((x/cols)*NB)|0)];
      path.moveTo(cx + r, cy); path.arc(cx, cy, r, 0, 6.2832);
    }
    for (let b = 0; b < NB; b++){
      const c = stopAt(b/(NB-1)).map(Math.round);
      ctx.fillStyle = `rgb(${c.join(',')})`; ctx.fill(paths[b]);
    }
  }

  // Projection monde → écran
  const PX = (x, z) => W/2 + x*F/z;
  const PY = (y, z) => HOR + (CAM_H - y)*F/z;

  let fx = new Float32Array(0), fy = fx, wx = fx, wy = fx, wz = fx;
  function renderFacets(t){
    if (SHAPEFN[P.shape]) return renderSegs(t, true);
    if (P.shape === 'network') return renderNetLines(t, true);
    paintBg();
    const cell = (OCCL ? 1.9 : 1.3)/Math.sqrt(P.density), zMin = OCCL ? 2.2 : Z_NEAR, zMax = OCCL ? 58 : Z_FAR;
    const nz = Math.ceil((zMax - zMin)/cell) + 1;
    const X = KX()*zMax + cell*2, nx = Math.ceil(2*X/cell) + 1, N = nx*nz;
    if (fx.length < N){ fx = new Float32Array(N); fy = new Float32Array(N); wx = new Float32Array(N); wy = new Float32Array(N); wz = new Float32Array(N); }
    for (let i = 0; i < nz; i++) for (let j = 0; j < nx; j++){
      const id = i*nx + j;
      const x = -X + j*cell + (hash(i, j) - 0.5)*0.6*cell;
      const z = zMin + i*cell + (i ? (hash(j + 91, i + 17) - 0.5)*0.6*cell : 0);
      const y = height(x, z, t);
      wx[id] = x; wy[id] = y; wz[id] = z; fx[id] = PX(x, z); fy[id] = PY(y, z) + ripY(fx[id], PY(y, z));
    }
    const dark = isDark();
    const Lx = -0.45, Ly = 0.75, Lz = -0.5, Ll = Math.hypot(Lx, Ly, Lz);
    ctx.lineWidth = Math.max(0.5, DPR*0.6); ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply';
    const tri = (a, b, c, fade) => {
      const minx = Math.min(fx[a], fx[b], fx[c]), maxx = Math.max(fx[a], fx[b], fx[c]);
      if (maxx < 0 || minx > W || Math.min(fy[a], fy[b], fy[c]) > H) return;
      const ux = wx[b]-wx[a], uy = wy[b]-wy[a], uz = wz[b]-wz[a];
      const vx = wx[c]-wx[a], vy = wy[c]-wy[a], vz = wz[c]-wz[a];
      let nx_ = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz_ = ux*vy - uy*vx;
      if (ny < 0){ nx_ = -nx_; ny = -ny; nz_ = -nz_; }
      const shade = Math.max(0, (nx_*Lx + ny*Ly + nz_*Lz) / (Math.hypot(nx_, ny, nz_) * Ll));
      const xb = Math.max(0, Math.min(31, (((minx + maxx)/2)/W*31)|0));
      // filaire seul : l'orientation de la facette module l'intensité du trait
      const al = fade * (0.2 + 0.8*shade);
      if (al < 0.02) return;
      ctx.globalAlpha = Math.min(1, al);
      ctx.beginPath(); ctx.moveTo(fx[a], fy[a]); ctx.lineTo(fx[b], fy[b]); ctx.lineTo(fx[c], fy[c]); ctx.closePath();
      ctx.strokeStyle = STY[xb*8 + 7]; ctx.stroke();
    };
    for (let i = nz - 2; i >= 0; i--){
      const v = i/(nz - 2);
      const fade = OCCL ? 1 - 0.92*Math.pow(v, 1.1) : Math.pow(Math.sin(Math.PI*v), 0.6)*(1 - 0.4*v);
      for (let j = 0; j < nx - 1; j++){
        const a = i*nx + j, b = a + 1, c = a + nx, d = c + 1;
        if ((i + j) & 1){ tri(a, d, c, fade); tri(a, b, d, fade); }
        else { tri(b, d, c, fade); tri(a, b, c, fade); }
      }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function glowPass(){
    if (P.glow <= 0) return;
    hctx.globalCompositeOperation = 'copy'; hctx.drawImage(canvas, 0, 0, half.width, half.height);
    gctx.globalCompositeOperation = 'copy'; gctx.drawImage(half, 0, 0, glow.width, glow.height);
    ctx.globalCompositeOperation = isDark() ? 'lighter' : 'multiply';
    ctx.globalAlpha = Math.min(1, P.glow*(isDark() ? 0.75 : 0.45));
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(glow, 0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  const RENDER = { mesh: renderMesh, facets: renderFacets, particles: renderParticles,
                   dots: renderDots, ascii: renderAscii, code: renderCode, text: renderText };


  // ───────────────────────── Boucle ─────────────────────────
  let t = 0, last = performance.now(), paused = false, onScreen = true, raf = 0, alive = true;
  function frame(now){
    if (!alive) return;
    const dt = Math.min(0.05, (now - last)/1000); last = now;
    clock = now/1000;
    while (RIP.length && clock - RIP[0].t > 2.8) RIP.shift();
    if (onScreen){
      try {
        setGeo(); if (bgDirty) bakeBg();
        if (!paused) t += dt*P.speed;
        RENDER[P.mode](t, now);
        glowPass();
      } catch (err){ console.error(err); }
    }
    raf = requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver(es => { onScreen = es[0].isIntersecting; });
  io.observe(canvas);
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  // ───────────────────────── Pointeur : grille cassable et ondulation ─────────────────────────
  const host = opts.pointerTarget || canvas.parentElement || canvas;
  const onMove = e => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left)*DPR, y = (e.clientY - r.top)*DPR;
    PTR.x = x; PTR.y = y; PTR.t = clock; PTR.inside = true;
    if (!P.ripple) return;
    if (Math.hypot(x - lastRip.x, y - lastRip.y) < 34*DPR && clock - lastRip.t < 0.25) return;
    RIP.push({ x, y, t: clock }); if (RIP.length > 12) RIP.shift();
    lastRip = { x, y, t: clock };
  };
  const onLeave = () => { PTR.inside = false; };
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerleave', onLeave);

  resize();
  raf = requestAnimationFrame(frame);

  return {
    /** Modifie un ou plusieurs réglages à chaud. */
    set(o){ Object.assign(P, o); bgDirty = true; GR = null; METRO = null; NET = null; },
    get settings(){ return { ...P }; },
    pause(){ paused = true; }, resume(){ paused = false; },
    /** [alpha, beta] : couleurs de statut lisibles (contraste 4,5:1) dérivées de la palette courante. */
    stageColors: () => stageColors(),
    /** Couleur (hex) de la palette à une position 0..1, comme dans l'animation. */
    colorAt: p => '#' + stopAt(p).map(v => Math.round(v).toString(16).padStart(2, '0')).join(''),
    palettes: PALETTES,
    destroy(){ alive = false; cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); }
  };
}
