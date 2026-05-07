/* ════════════════════════════════════════════════════════════
   effects.js — Particles, screen shake, floating emojis,
               rain, background starfield
   Exports: fxInit, fxUpdate, fxDraw, fxSpawnHit,
            fxSpawnHeart, fxShake, fxFloatEmoji,
            fxSetRain, fxGetShake, fxBgDraw, fxBgUpdate
   ════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────── canvas refs ──
let _cw = 400, _ch = 400;
let _floatLayer;        // DOM element for emoji floaters
let _bgCtx;             // background canvas context

// ─────────────────────────────────────── screen shake ──
let _shakeX = 0, _shakeY = 0;
let _shakeDuration = 0, _shakeTimer = 0;
let _shakeIntensity = 0;

// ─────────────────────────────────────── particles ──
const _particles = [];

// ──────────────────────────────────── background stars ──
const _stars = [];
let _starsInit = false;

// ──────────────────────────────────────── rain ──
const _rainDrops = [];
let _rainActive = false;
let _rainCanvas, _rainCtx;

// ──────────────────────────────────────── utils ──
const rand  = (mn, mx) => mn + Math.random() * (mx - mn);
const randI = (mn, mx) => Math.floor(rand(mn, mx));
const lerp  = (a, b, t) => a + (b-a)*t;

// ══════════════════════════════════════════════════════════
//  Particle class
// ══════════════════════════════════════════════════════════
class Particle {
  constructor(x, y, type, extra = {}) {
    this.x = x; this.y = y;
    this.type = type;
    this.life = 1;

    switch (type) {
      case 'hit':
        this.vx   = rand(-5, 5);
        this.vy   = rand(-9, -2);
        this.grav = 0.35;
        this.size = rand(4, 11);
        this.decay = rand(0.018, 0.04);
        this.rot  = rand(0, Math.PI*2);
        this.rotV = rand(-0.18, 0.18);
        const hitColors = ['#FF6B9D','#FF4757','#FFD93D','#6C63FF','#74B9FF'];
        this.color = hitColors[randI(0, hitColors.length)];
        break;

      case 'heart':
        this.vx   = rand(-1.5, 1.5);
        this.vy   = rand(-4, -1.5);
        this.grav = -0.06;
        this.size = rand(12, 22);
        this.decay = rand(0.008, 0.016);
        this.emoji = ['💕','💖','💗','💝','❤️'][randI(0,5)];
        break;

      case 'star':
        this.vx   = rand(-3.5, 3.5);
        this.vy   = rand(-6, -1);
        this.grav = 0.22;
        this.size = rand(5, 13);
        this.decay = rand(0.022, 0.05);
        this.rot  = rand(0, Math.PI*2);
        this.rotV = rand(-0.22, 0.22);
        const starColors = ['#FFD93D','#FFBE0B','#FF6B9D','#74B9FF','#55EFC4'];
        this.color = starColors[randI(0, starColors.length)];
        break;

      case 'spark':
        this.vx   = rand(-6, 6);
        this.vy   = rand(-7, -1);
        this.grav = 0.28;
        this.size = rand(2, 6);
        this.decay = rand(0.03, 0.06);
        this.color = extra.color || '#FFD93D';
        break;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.grav) this.vy += this.grav;
    if (this.rotV) this.rot += this.rotV;
    this.life -= this.decay;
    this.vx *= 0.97;
  }

  get dead() { return this.life <= 0; }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);

    if (this.type === 'heart') {
      ctx.font = `${this.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.emoji, this.x, this.y);
    } else {
      ctx.translate(this.x, this.y);
      if (this.rot !== undefined) ctx.rotate(this.rot);

      if (this.type === 'hit') {
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size*0.6, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size*0.6, 0);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
      } else if (this.type === 'star') {
        _drawStar5(ctx, 0, 0, this.size, this.size*0.42, this.color);
      } else if (this.type === 'spark') {
        ctx.beginPath();
        ctx.rect(-this.size/2, -this.size/4, this.size, this.size/2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function _drawStar5(ctx, x, y, outerR, innerR, color) {
  const points = 5;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI/2;
    if (i === 0) ctx.moveTo(x + r*Math.cos(angle), y + r*Math.sin(angle));
    else ctx.lineTo(x + r*Math.cos(angle), y + r*Math.sin(angle));
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ══════════════════════════════════════════════════════════
//  Background starfield
// ══════════════════════════════════════════════════════════
function _initStars() {
  _stars.length = 0;
  const count = Math.floor((_cw * _ch) / 3200);
  for (let i = 0; i < count; i++) {
    _stars.push({
      x: rand(0, _cw), y: rand(0, _ch),
      r: rand(0.5, 2.2),
      alpha: rand(0.15, 0.7),
      twinklePhase: rand(0, Math.PI*2),
      twinkleSpeed: rand(0.0008, 0.003),
    });
  }
  _starsInit = true;
}

// ══════════════════════════════════════════════════════════
//  Rain
// ══════════════════════════════════════════════════════════
function _initRain() {
  _rainDrops.length = 0;
  const count = Math.floor(_cw / 5);
  for (let i = 0; i < count; i++) {
    _rainDrops.push(_newRainDrop(true));
  }
}

function _newRainDrop(randomY = false) {
  return {
    x: rand(-20, _cw + 20),
    y: randomY ? rand(-_ch, _ch) : rand(-50, -10),
    vy: rand(8, 15),
    vx: rand(0.5, 2),
    len: rand(12, 28),
    alpha: rand(0.2, 0.55),
  };
}

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════

export function fxInit(bgCanvas, floatLayerEl, w, h) {
  _cw = w; _ch = h;
  _floatLayer = floatLayerEl;
  if (bgCanvas) {
    _bgCtx = bgCanvas.getContext('2d');
    bgCanvas.width  = w;
    bgCanvas.height = h;
  }
  _initStars();
}

export function fxResize(w, h) {
  _cw = w; _ch = h;
  if (_bgCtx) {
    _bgCtx.canvas.width  = w;
    _bgCtx.canvas.height = h;
  }
  if (_rainCtx) {
    _rainCtx.canvas.width  = w;
    _rainCtx.canvas.height = h;
  }
  _initStars();
}

export function fxSetRainCanvas(canvas) {
  _rainCanvas = canvas;
  _rainCtx    = canvas.getContext('2d');
}

/** dt in ms */
export function fxUpdate(dt) {
  // Screen shake
  if (_shakeTimer > 0) {
    _shakeTimer -= dt;
    const t = _shakeTimer / _shakeDuration;
    const mag = _shakeIntensity * t;
    _shakeX = (Math.random()*2-1) * mag;
    _shakeY = (Math.random()*2-1) * mag;
    if (_shakeTimer <= 0) { _shakeX = 0; _shakeY = 0; }
  }

  // Particles
  for (let i = _particles.length - 1; i >= 0; i--) {
    _particles[i].update();
    if (_particles[i].dead) _particles.splice(i, 1);
  }

  // Rain
  if (_rainActive) {
    for (const d of _rainDrops) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y > _ch + 20) {
        d.x = rand(-20, _cw + 20);
        d.y = rand(-50, -10);
      }
    }
  }

  // Twinkling stars
  for (const s of _stars) {
    s.twinklePhase += s.twinkleSpeed * dt;
  }
}

export function fxBgDraw() {
  if (!_bgCtx) return;
  if (!_starsInit) _initStars();
  const ctx = _bgCtx;
  ctx.clearRect(0, 0, _cw, _ch);

  for (const s of _stars) {
    const a = s.alpha * (0.6 + 0.4 * Math.sin(s.twinklePhase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    ctx.fill();
  }
}

/** Draw particles onto the game canvas ctx */
export function fxDraw(ctx) {
  for (const p of _particles) p.draw(ctx);
}

export function fxDrawRain() {
  if (!_rainActive || !_rainCtx) return;
  const ctx = _rainCtx;
  ctx.clearRect(0, 0, _cw, _ch);
  ctx.strokeStyle = 'rgba(174,214,241,0.55)';
  ctx.lineWidth = 1;
  for (const d of _rainDrops) {
    ctx.globalAlpha = d.alpha;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.vx, d.y - d.len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// ── Spawn helpers ──────────────────────────────────────────

export function fxSpawnHit(x, y, intensity = 1) {
  const count = 6 + intensity * 4;
  for (let i = 0; i < count; i++) _particles.push(new Particle(x, y, 'hit'));
  for (let i = 0; i < 3; i++)     _particles.push(new Particle(x, y, 'spark', { color:'#FFD93D' }));
}

export function fxSpawnHeart(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    const p = new Particle(x + rand(-20,20), y + rand(-10,10), 'heart');
    _particles.push(p);
  }
}

export function fxSpawnStar(x, y, count = 8) {
  for (let i = 0; i < count; i++) _particles.push(new Particle(x, y, 'star'));
}

export function fxShake(intensity = 5, duration = 400) {
  _shakeIntensity = intensity;
  _shakeDuration  = duration;
  _shakeTimer     = duration;
}

export function fxGetShake() { return { x: _shakeX, y: _shakeY }; }

export function fxSetRain(active) {
  _rainActive = active;
  if (active && _rainDrops.length === 0) _initRain();
  if (_rainCanvas) {
    _rainCanvas.closest('#rain-overlay').classList.toggle('hidden', !active);
  }
}

/** Spawn a floating emoji DOM element at canvas coordinates */
export function fxFloatEmoji(x, y, emoji, options = {}) {
  if (!_floatLayer) return;
  const el = document.createElement('div');
  el.className = 'float-emoji';
  el.textContent = emoji;
  el.style.left = `${x}px`;
  el.style.top  = `${y}px`;
  const dur = options.dur || (0.9 + Math.random() * 0.6);
  el.style.setProperty('--dur', `${dur}s`);
  el.style.fontSize = `${options.size || 1.4}rem`;
  _floatLayer.appendChild(el);
  setTimeout(() => el.remove(), dur * 1000 + 100);
}

/** Burst many hearts during forgiveness mode */
export function fxHeartBurst(cx, cy, count = 18) {
  fxSpawnHeart(cx, cy, count);
  const emojis = ['💕','💖','💗','💝','✨','🥰'];
  for (let i = 0; i < 8; i++) {
    const angle = (i/8)*Math.PI*2;
    const r = 30 + Math.random()*50;
    fxFloatEmoji(
      cx + Math.cos(angle)*r,
      cy + Math.sin(angle)*r,
      emojis[i % emojis.length],
      { size: 1.6 + Math.random() }
    );
  }
}
