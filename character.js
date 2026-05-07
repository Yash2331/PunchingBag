/* ════════════════════════════════════════════════════════════
   character.js — Realistic-ish Indian boyfriend character
   South Asian skin tone, defined jaw, styled dark hair,
   stubble, broader shoulders. Canvas 2D only.
   ════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────── dimensions ──
let _cw = 400, _ch = 400;
let _cx = 200, _cy = 220;
let _u  = 150;

// ─────────────────────────────────────────── core state ──
const S = {
  ox: 0, oy: 0, rot: 0,
  scx: 1, scy: 1,
  fallY: 0, fallRot: 0, falling: false,

  // expression
  eyeOpen:    1,
  browAngle:  0,    // negative = worried/sad, positive = furrowed/angry
  smile:      0.5,
  mouthOpen:  0,
  blush:      0,
  tear:       0,
  heartEye:   false,
  starEye:    false,

  // targets
  t_eyeOpen:   1,
  t_browAngle: 0,
  t_smile:     0.5,
  t_mouthOpen: 0,
  t_blush:     0,
  t_tear:      0,
  t_heartEye:  false,
  t_starEye:   false,
};

// ──────────────────────────────────── idle animations ──
let _breathPhase  = 0;
let _swayPhase    = 0;
let _blinkTimer   = 0;
let _nextBlink    = 3500;
let _blinking     = false;
let _blinkOpen    = 1;

// ──────────────────────────────────── state machine ──
let _state      = 'idle';
let _stateTimer = 0;
let _hitFlash   = 0;

// ─────────────────────────────────── pupil tracking ──
let _pupilTX = 0, _pupilTY = 0;
let _pupilX  = 0, _pupilY  = 0;

const lerp  = (a,b,t) => a + (b-a)*t;
const clamp = (v,mn,mx) => Math.max(mn, Math.min(mx,v));
const ease  = t => 1 - Math.pow(1-t, 3);

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════

export function charInit(logicalW, logicalH) { _charResize(logicalW, logicalH); }
export function charResize(w, h)             { _charResize(w, h); }

function _charResize(w, h) {
  _cw = w; _ch = h;
  _cx = w / 2;
  _cy = h * 0.58;
  _u  = Math.min(w, h) * 0.42;
}

export function charUpdate(dt, pointerX, pointerY) {
  // Pupil tracking
  const hx = _cx, hy = _cy - _u * 0.12;
  const hr = _u * 0.30;
  const dx = pointerX - hx, dy = pointerY - hy;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const maxDrift = hr * 0.18;
  if (dist > 0) {
    _pupilTX = (dx/dist) * Math.min(dist/hr, 1) * maxDrift;
    _pupilTY = (dy/dist) * Math.min(dist/hr, 1) * maxDrift;
  }
  _pupilX = lerp(_pupilX, _pupilTX, 0.07);
  _pupilY = lerp(_pupilY, _pupilTY, 0.07);

  _breathPhase += dt * 0.0014;
  _swayPhase   += dt * 0.0007;

  // Blink
  _blinkTimer += dt;
  if (!_blinking && _blinkTimer > _nextBlink) {
    _blinking = true; _blinkTimer = 0;
    _nextBlink = 2800 + Math.random() * 3500;
  }
  if (_blinking) {
    const bp = _blinkTimer / 160;
    if (bp < 0.5) _blinkOpen = lerp(1, 0, ease(bp * 2));
    else          _blinkOpen = lerp(0, 1, ease((bp-0.5)*2));
    if (bp >= 1)  { _blinking = false; _blinkOpen = 1; }
  }

  // State timer
  if (_stateTimer > 0) {
    _stateTimer -= dt;
    if (_stateTimer <= 0) {
      _stateTimer = 0;
      if (_state !== 'cry' && _state !== 'love' && _state !== 'apologize') {
        _setTargets('idle'); _state = 'idle';
      }
    }
  }

  // Hit flash
  _hitFlash = Math.max(0, _hitFlash - dt * 0.007);

  // Physical recovery
  S.ox  = lerp(S.ox,  0, 0.16);
  S.oy  = lerp(S.oy,  0, 0.16);
  S.rot = lerp(S.rot, 0, 0.13);
  S.scx = lerp(S.scx, 1, 0.15);
  S.scy = lerp(S.scy, 1, 0.15);

  // Expression lerp
  const ls = 0.09;
  S.eyeOpen   = lerp(S.eyeOpen,   S.t_eyeOpen,   ls);
  S.browAngle = lerp(S.browAngle, S.t_browAngle,  ls);
  S.smile     = lerp(S.smile,     S.t_smile,      ls);
  S.mouthOpen = lerp(S.mouthOpen, S.t_mouthOpen,  ls);
  S.blush     = lerp(S.blush,     S.t_blush,      ls);
  S.tear      = lerp(S.tear,      S.t_tear,       ls);
  S.heartEye  = S.t_heartEye;
  S.starEye   = S.t_starEye;

  // Fall
  if (S.falling) {
    S.fallY   += dt * 0.75;
    S.fallRot += dt * 0.0035;
    if (S.fallY > _u * 0.65) {
      S.falling = false; S.fallY = 0; S.fallRot = 0;
      _setTargets('apologize'); _state = 'apologize'; _stateTimer = 3500;
    }
  }
}

export function charDraw(ctx, shakeX = 0, shakeY = 0) {
  ctx.save();

  const bX  = _cx + shakeX + S.ox;
  const bY  = _cy + shakeY + S.oy + S.fallY;
  const rot = S.rot + (S.falling ? S.fallRot : 0);
  const breathScale = 1 + Math.sin(_breathPhase) * 0.010;
  const sway = Math.sin(_swayPhase) * 0.012;

  ctx.translate(bX, bY);
  ctx.rotate(rot + sway);
  ctx.scale(S.scx, S.scy * breathScale);

  _drawShadow(ctx);
  _drawLegs(ctx);
  _drawBody(ctx);
  _drawNeck(ctx);

  const hx = 0, hy = -_u * 0.12;
  const hr = _u * 0.30;

  _drawEars(ctx, hx, hy, hr);
  _drawHairBack(ctx, hx, hy, hr);
  _drawHead(ctx, hx, hy, hr);
  _drawFace(ctx, hx, hy, hr);
  _drawHairFront(ctx, hx, hy, hr);

  // Hit flash
  if (_hitFlash > 0) {
    ctx.globalAlpha = _hitFlash * 0.35;
    ctx.beginPath();
    ctx.ellipse(hx, hy, hr * 1.15, hr * 1.3, 0, 0, Math.PI*2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function charReact(action, intensity = 1) {
  _hitFlash = 0.65 + intensity * 0.06;

  switch(action) {
    case 'poke':
      S.ox  = (Math.random()<0.5?-1:1) * _u*0.03;
      S.oy  = -_u*0.02;
      S.scx = 0.94; S.scy = 1.08;
      _setTargets('poke', intensity);
      _state = 'poke'; _stateTimer = 900; break;

    case 'slap':
      S.ox  = (Math.random()<0.5?-1:1) * _u*(0.07+intensity*0.03);
      S.oy  = -_u*0.025;
      S.rot = (Math.random()<0.5?-1:1) * (0.07+intensity*0.04);
      S.scx = 0.87; S.scy = 1.14;
      _setTargets('slap', intensity);
      _state = 'slap'; _stateTimer = 1300; break;

    case 'throw':
      S.ox  = (Math.random()<0.5?-1:1) * _u*(0.05+intensity*0.035);
      S.oy  = _u*0.025;
      S.rot = (Math.random()<0.5?-1:1) * (0.05+intensity*0.025);
      S.scx = 1.08; S.scy = 0.90;
      _setTargets('shock', intensity);
      _state = 'shock'; _stateTimer = 1500; break;

    case 'dramatic':
      S.falling = true; S.fallY = 0; S.fallRot = 0;
      S.ox = (Math.random()<0.5?-1:1) * _u*0.04;
      _setTargets('cry'); _state = 'falling'; break;

    case 'cry':
      _setTargets('cry'); _state = 'cry'; _stateTimer = 4500; break;

    case 'apologize':
      _setTargets('apologize'); _state = 'apologize'; _stateTimer = 3500; break;

    case 'hug':
      _setTargets('love'); _state = 'love'; _stateTimer = 5000; break;

    case 'forgiven':
      _setTargets('happy'); _state = 'happy'; _stateTimer = 6000; break;
  }
}

export function charIsHit(x, y) {
  const hx = _cx + S.ox, hy = _cy - _u*0.12 + S.oy;
  const hr = _u * 0.30;
  if (Math.hypot(x-hx, y-hy) < hr * 1.1) return true;
  const bL = _cx - _u*0.30, bR = _cx + _u*0.30;
  const bT = _cy - _u*0.02, bB = _cy + _u*0.40;
  return x > bL && x < bR && y > bT && y < bB;
}

export function charReset() {
  _state = 'idle'; _stateTimer = 0;
  S.falling = false; S.fallY = 0; S.fallRot = 0;
  S.ox = 0; S.oy = 0; S.rot = 0; S.scx = 1; S.scy = 1;
  _setTargets('idle');
  Object.assign(S, { eyeOpen:1, browAngle:0, smile:0.5, mouthOpen:0,
    blush:0, tear:0, heartEye:false, starEye:false });
}

// ══════════════════════════════════════════════════════════
//  EXPRESSION TARGETS
// ══════════════════════════════════════════════════════════
function _setTargets(expr, intensity = 1) {
  S.t_heartEye = false; S.t_starEye = false;
  switch(expr) {
    case 'idle':
      S.t_eyeOpen=1; S.t_browAngle=0; S.t_smile=0.5;
      S.t_mouthOpen=0; S.t_blush=0; S.t_tear=0; break;
    case 'happy':
      S.t_eyeOpen=0.7; S.t_browAngle=-0.2; S.t_smile=1;
      S.t_mouthOpen=0.25; S.t_blush=0.6; S.t_tear=0;
      S.t_starEye = intensity > 3; break;
    case 'poke':
      S.t_eyeOpen=1.1; S.t_browAngle=0.15; S.t_smile=0.3;
      S.t_mouthOpen=0.1; S.t_blush=0; S.t_tear=0; break;
    case 'slap':
      const si = Math.min(intensity,5);
      S.t_eyeOpen = 1 + si*0.10; S.t_browAngle = 0.25 + si*0.08;
      S.t_smile = 0.22 - si*0.03; S.t_mouthOpen = 0.18 + si*0.07;
      S.t_blush = 0; S.t_tear = si > 3 ? 0.25 : 0; break;
    case 'shock':
      S.t_eyeOpen=1.45; S.t_browAngle=-0.45; S.t_smile=0.5;
      S.t_mouthOpen=0.8; S.t_blush=0; S.t_tear=0; break;
    case 'cry':
      S.t_eyeOpen=0.38; S.t_browAngle=-0.7; S.t_smile=0;
      S.t_mouthOpen=0.2; S.t_blush=0.25; S.t_tear=1; break;
    case 'love':
      S.t_eyeOpen=0.75; S.t_browAngle=-0.25; S.t_smile=1;
      S.t_mouthOpen=0.08; S.t_blush=0.85; S.t_tear=0;
      S.t_heartEye=true; break;
    case 'apologize':
      S.t_eyeOpen=0.6; S.t_browAngle=-0.6; S.t_smile=0.15;
      S.t_mouthOpen=0.08; S.t_blush=0.2; S.t_tear=0.35; break;
  }
}

// ══════════════════════════════════════════════════════════
//  DRAWING — realistic South Asian boy
//  Skin palette: highlight #E8A87C  base #C47B4A  shadow #9E5C32
//  Hair: near-black #1A1208  highlight rgba(80,60,40,0.4)
// ══════════════════════════════════════════════════════════

function _skinGrad(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x-r*0.22, y-r*0.28, r*0.06, x, y, r);
  g.addColorStop(0, '#EDAB7E');
  g.addColorStop(0.55, '#C47B4A');
  g.addColorStop(1, '#9E5C32');
  return g;
}

function _drawShadow(ctx) {
  const bw = _u*0.52;
  const by = _u*0.42;
  const g = ctx.createRadialGradient(0, by, 0, 0, by, bw*0.55);
  g.addColorStop(0, 'rgba(0,0,0,0.25)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.ellipse(0, by+_u*0.05, bw*0.55, _u*0.055, 0, 0, Math.PI*2);
  ctx.fillStyle = g;
  ctx.fill();
}

function _drawLegs(ctx) {
  const bw = _u*0.54, bh = _u*0.42;
  const by = _u*0.04;
  const legW = _u*0.17, legH = _u*0.18;
  const legY = by + bh - _u*0.02;
  for (const s of [-1,1]) {
    const lx = s * (bw*0.28 - legW/2);
    // Jeans
    const g = ctx.createLinearGradient(lx, legY, lx, legY+legH);
    g.addColorStop(0, '#2C3E6B');
    g.addColorStop(1, '#1A2744');
    ctx.beginPath();
    _roundRect(ctx, lx-legW/2, legY, legW, legH, _u*0.04);
    ctx.fillStyle = g;
    ctx.fill();
    // Jean highlight
    ctx.beginPath();
    ctx.rect(lx-legW/2+2, legY+2, legW*0.3, legH*0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();
  }
}

function _drawBody(ctx) {
  const bw = _u*0.56, bh = _u*0.42;
  const by = _u*0.04;
  const r  = _u*0.08;

  // Hoodie / jacket body
  const g = ctx.createLinearGradient(-bw/2, by, bw/2, by+bh);
  g.addColorStop(0, '#2D2D3A');
  g.addColorStop(0.5, '#1E1E28');
  g.addColorStop(1, '#13131A');
  ctx.beginPath();
  _roundRect(ctx, -bw/2, by, bw, bh, r);
  ctx.fillStyle = g;
  ctx.fill();

  // Hoodie center seam
  ctx.beginPath();
  ctx.moveTo(0, by); ctx.lineTo(0, by+bh);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = _u*0.025;
  ctx.stroke();

  // Pocket
  ctx.beginPath();
  _roundRect(ctx, -bw*0.28, by+bh*0.52, bw*0.56, bh*0.28, _u*0.04);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = _u*0.018;
  ctx.stroke();

  // Chest highlight
  ctx.beginPath();
  _roundRect(ctx, -bw/2+3, by+2, bw*0.4, bh*0.32, r*0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  ctx.fill();

  // Arms
  _drawArms(ctx, bw, bh, by);
}

function _drawArms(ctx, bw, bh, by) {
  const aw = _u*0.155, ah = _u*0.36;
  const ar = _u*0.07;
  const aSwing = Math.sin(_breathPhase * 1.2) * 0.025;

  for (const s of [-1,1]) {
    ctx.save();
    ctx.translate(s*(bw/2 + aw*0.28), by+bh*0.06);
    ctx.rotate(s * aSwing);

    // Sleeve (hoodie)
    const sg = ctx.createLinearGradient(-aw/2, 0, aw/2, ah*0.55);
    sg.addColorStop(0, '#2D2D3A');
    sg.addColorStop(1, '#1E1E28');
    ctx.beginPath();
    _roundRect(ctx, -aw/2, 0, aw, ah*0.56, ar);
    ctx.fillStyle = sg;
    ctx.fill();

    // Forearm skin
    const fg = ctx.createLinearGradient(0, ah*0.52, 0, ah);
    fg.addColorStop(0, '#C47B4A');
    fg.addColorStop(1, '#A8623A');
    ctx.beginPath();
    _roundRect(ctx, -aw/2+1, ah*0.52, aw-2, ah*0.50, ar);
    ctx.fillStyle = fg;
    ctx.fill();

    // Wrist crease
    ctx.beginPath();
    ctx.moveTo(-aw/2+2, ah*0.82);
    ctx.lineTo(aw/2-2, ah*0.82);
    ctx.strokeStyle = 'rgba(120,60,20,0.3)';
    ctx.lineWidth = _u*0.012;
    ctx.stroke();

    ctx.restore();
  }
}

function _drawNeck(ctx) {
  const nw = _u*0.145, nh = _u*0.10;
  const ny = -_u*0.08;
  const g = ctx.createLinearGradient(-nw/2, ny, nw/2, ny+nh);
  g.addColorStop(0, '#D48A5A');
  g.addColorStop(1, '#B86C3E');
  ctx.beginPath();
  _roundRect(ctx, -nw/2, ny, nw, nh, _u*0.035);
  ctx.fillStyle = g;
  ctx.fill();
  // Neck shadow line
  ctx.beginPath();
  ctx.moveTo(-nw/2+2, ny+nh*0.5);
  ctx.lineTo(nw/2-2, ny+nh*0.5);
  ctx.strokeStyle = 'rgba(100,40,10,0.2)';
  ctx.lineWidth = _u*0.01;
  ctx.stroke();
}

function _drawEars(ctx, hx, hy, hr) {
  const earW = hr*0.28, earH = hr*0.42;
  for (const s of [-1,1]) {
    const ex = hx + s*(hr*0.94);
    const ey = hy + hr*0.12;
    ctx.beginPath();
    ctx.ellipse(ex, ey, earW, earH, 0, 0, Math.PI*2);
    ctx.fillStyle = '#C07040';
    ctx.fill();
    // Inner ear
    ctx.beginPath();
    ctx.ellipse(ex + s*earW*0.05, ey, earW*0.55, earH*0.65, 0, 0, Math.PI*2);
    ctx.fillStyle = '#A85830';
    ctx.fill();
  }
}

function _drawHead(ctx, hx, hy, hr) {
  ctx.save();
  ctx.beginPath();
  // Oval face with defined jaw — more masculine
  ctx.moveTo(hx - hr*0.82, hy - hr*0.22);
  ctx.bezierCurveTo(
    hx - hr*0.88, hy - hr*1.05,
    hx + hr*0.88, hy - hr*1.05,
    hx + hr*0.82, hy - hr*0.22
  );
  // Right cheek/jaw
  ctx.bezierCurveTo(
    hx + hr*1.0,  hy + hr*0.28,
    hx + hr*0.72, hy + hr*0.85,
    hx + hr*0.40, hy + hr*1.02
  );
  // Chin
  ctx.bezierCurveTo(
    hx + hr*0.18, hy + hr*1.10,
    hx - hr*0.18, hy + hr*1.10,
    hx - hr*0.40, hy + hr*1.02
  );
  // Left jaw/cheek
  ctx.bezierCurveTo(
    hx - hr*0.72, hy + hr*0.85,
    hx - hr*1.0,  hy + hr*0.28,
    hx - hr*0.82, hy - hr*0.22
  );
  ctx.closePath();

  const g = _skinGrad(ctx, hx, hy, hr);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  // Jaw shadow (directional)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(hx - hr*0.55, hy + hr*0.72);
  ctx.quadraticCurveTo(hx, hy + hr*1.12, hx + hr*0.55, hy + hr*0.72);
  ctx.strokeStyle = 'rgba(100,45,10,0.22)';
  ctx.lineWidth = _u*0.025;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Stubble — tiny dots on jaw
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#4A2010';
  const stubbleY = hy + hr*0.58;
  for (let i = 0; i < 28; i++) {
    const angle = Math.PI * 0.18 + (i/28) * Math.PI * 0.64;
    const r2 = hr * (0.80 + (i%3)*0.07);
    const sx = hx + Math.cos(angle) * r2 * 1.0;
    const sy = stubbleY + Math.sin(angle * 1.2) * hr * 0.25;
    ctx.beginPath();
    ctx.arc(sx, sy, _u*0.012, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  // Cheek blush
  if (S.blush > 0) {
    ctx.save();
    ctx.globalAlpha = S.blush * 0.35;
    for (const s of [-1,1]) {
      ctx.beginPath();
      ctx.ellipse(hx + s*hr*0.52, hy+hr*0.22, hr*0.24, hr*0.14, s*0.12, 0, Math.PI*2);
      ctx.fillStyle = '#FF8870';
      ctx.fill();
    }
    ctx.restore();
  }
}

function _drawHairBack(ctx, hx, hy, hr) {
  const g = ctx.createRadialGradient(hx, hy-hr*0.3, hr*0.1, hx, hy, hr*1.1);
  g.addColorStop(0, '#2C1F12');
  g.addColorStop(1, '#0E0A06');
  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.arc(hx, hy, hr*1.02, Math.PI*0.78, Math.PI*2.22);
  ctx.lineTo(hx + hr*0.35, hy + hr*0.75);
  ctx.arc(hx, hy + hr*0.65, hr*0.35, 0, Math.PI);
  ctx.lineTo(hx - hr*0.35, hy + hr*0.75);
  ctx.closePath();
  ctx.fill();

  // Side hair volume
  for (const s of [-1,1]) {
    ctx.beginPath();
    ctx.moveTo(hx + s*hr*0.80, hy - hr*0.15);
    ctx.quadraticCurveTo(hx + s*hr*1.22, hy + hr*0.05, hx + s*hr*1.08, hy + hr*0.45);
    ctx.quadraticCurveTo(hx + s*hr*0.88, hy + hr*0.42, hx + s*hr*0.78, hy + hr*0.20);
    ctx.closePath();
    ctx.fill();
  }
}

function _drawHairFront(ctx, hx, hy, hr) {
  const g = ctx.createLinearGradient(hx, hy-hr*1.05, hx, hy-hr*0.15);
  g.addColorStop(0, '#2C1F12');
  g.addColorStop(1, '#0E0A06');
  ctx.fillStyle = g;

  // Main top mass — side-parted style
  ctx.beginPath();
  ctx.moveTo(hx - hr*0.95, hy - hr*0.18);
  ctx.quadraticCurveTo(hx - hr*0.80, hy - hr*1.18, hx + hr*0.10, hy - hr*1.20);
  ctx.quadraticCurveTo(hx + hr*0.85, hy - hr*1.18, hx + hr*0.95, hy - hr*0.18);
  ctx.quadraticCurveTo(hx + hr*0.65, hy - hr*0.68, hx + hr*0.12, hy - hr*0.72);
  ctx.quadraticCurveTo(hx - hr*0.50, hy - hr*0.72, hx - hr*0.95, hy - hr*0.18);
  ctx.closePath();
  ctx.fill();

  // Side part and swooped bangs
  ctx.beginPath();
  ctx.moveTo(hx - hr*0.60, hy - hr*0.72);
  ctx.bezierCurveTo(hx - hr*0.20, hy - hr*0.55, hx + hr*0.25, hy - hr*0.48, hx + hr*0.55, hy - hr*0.25);
  ctx.lineWidth = hr*0.22;
  ctx.strokeStyle = g;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(hx - hr*0.82, hy - hr*0.55);
  ctx.bezierCurveTo(hx - hr*0.40, hy - hr*0.35, hx + hr*0.05, hy - hr*0.22, hx + hr*0.30, hy - hr*0.08);
  ctx.lineWidth = hr*0.18;
  ctx.stroke();

  // Hair highlight streak
  ctx.beginPath();
  ctx.moveTo(hx + hr*0.05, hy - hr*1.12);
  ctx.quadraticCurveTo(hx + hr*0.18, hy - hr*0.88, hx + hr*0.30, hy - hr*0.72);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = hr*0.06;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function _drawFace(ctx, hx, hy, hr) {
  _drawEyes(ctx, hx, hy, hr);
  _drawNose(ctx, hx, hy, hr);
  _drawMouth(ctx, hx, hy, hr);
  if (S.tear > 0) _drawTears(ctx, hx, hy, hr);
}

function _drawEyes(ctx, hx, hy, hr) {
  const eyeSpX = hr * 0.34;
  const eyeY   = hy - hr * 0.10;
  const eyeRX  = hr * 0.195;
  const eyeRY  = hr * 0.175;
  const openness = clamp(S.eyeOpen * _blinkOpen, 0.05, 1.55);

  for (const s of [-1,1]) {
    const ex = hx + s * eyeSpX;
    const ey = eyeY;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeRX+1, (eyeRY+1)*openness, 0, 0, Math.PI*2);
    ctx.clip();

    // Eye white (slight warm tint, more realistic)
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeRX, eyeRY*openness, 0, 0, Math.PI*2);
    ctx.fillStyle = '#F5F0EA';
    ctx.fill();

    if (S.heartEye) {
      ctx.font = `${eyeRX*1.25}px serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('❤️', ex, ey+eyeRX*0.05);
    } else if (S.starEye) {
      ctx.font = `${eyeRX*1.15}px serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⭐', ex, ey);
    } else {
      // Dark brown iris (Indian eyes)
      const irisR = eyeRX * 0.73;
      const ig = ctx.createRadialGradient(ex+irisR*0.15, ey-irisR*0.15, irisR*0.05, ex, ey, irisR);
      ig.addColorStop(0, '#6B4226');
      ig.addColorStop(0.4, '#3D2010');
      ig.addColorStop(1, '#1A0A05');
      ctx.beginPath();
      ctx.arc(ex, ey, irisR, 0, Math.PI*2);
      ctx.fillStyle = ig;
      ctx.fill();

      // Pupil
      const px = ex + _pupilX*0.5, py = ey + _pupilY*0.5;
      ctx.beginPath();
      ctx.arc(px, py, irisR*0.52, 0, Math.PI*2);
      ctx.fillStyle = '#0A0604';
      ctx.fill();

      // Main highlight
      ctx.beginPath();
      ctx.arc(ex - eyeRX*0.24, ey - eyeRY*0.25, eyeRX*0.21, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fill();
      // Small secondary
      ctx.beginPath();
      ctx.arc(ex + eyeRX*0.16, ey + eyeRY*0.04, eyeRX*0.09, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.44)';
      ctx.fill();
    }
    ctx.restore();

    // Eyelid fold line (upper)
    const topY = ey - eyeRY*openness;
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = _u*0.015;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(ex, topY + eyeRY*openness*0.15, eyeRX*0.85, eyeRY*openness*0.55, 0, Math.PI, 0);
    ctx.stroke();

    // Eyelashes — thicker, more defined
    ctx.strokeStyle = '#1A0A05';
    ctx.lineWidth = _u*0.020;
    for (let i=-3; i<=3; i++) {
      const lx = ex + i*eyeRX*0.26;
      const ang = (i/4)*0.35 - 0.05;
      ctx.beginPath();
      ctx.moveTo(lx, topY + eyeRY*0.06);
      ctx.lineTo(lx + Math.sin(ang)*eyeRX*0.28, topY - eyeRY*0.35);
      ctx.stroke();
    }

    // Eyebrow — thick, defined, masculine
    const browY  = ey - eyeRY*(1.55 + S.eyeOpen*0.12);
    const ba     = s === -1 ? -S.browAngle : S.browAngle;
    ctx.strokeStyle = '#1A0A05';
    ctx.lineWidth = hr*0.068;  // thicker brow
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - eyeRX*0.85, browY + ba*eyeRX*0.5);
    ctx.quadraticCurveTo(ex - eyeRX*0.1, browY - ba*eyeRX*0.15, ex + eyeRX*0.85, browY - ba*eyeRX*0.22*s);
    ctx.stroke();
    // Brow inner fill for thickness
    ctx.lineWidth = hr*0.035;
    ctx.strokeStyle = '#2A1208';
    ctx.beginPath();
    ctx.moveTo(ex - eyeRX*0.75, browY + ba*eyeRX*0.45 + hr*0.032);
    ctx.quadraticCurveTo(ex, browY - ba*eyeRX*0.10 + hr*0.032, ex + eyeRX*0.75, browY - ba*eyeRX*0.18*s + hr*0.032);
    ctx.stroke();
  }
}

function _drawNose(ctx, hx, hy, hr) {
  // More defined nose — bridge + tip + nostrils
  const nbX = hx, nbY = hy - hr*0.05;
  const ntY = hy + hr*0.24;

  // Nose bridge shadow
  ctx.strokeStyle = 'rgba(120,55,20,0.30)';
  ctx.lineWidth = _u*0.028;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx - hr*0.04, nbY);
  ctx.quadraticCurveTo(hx - hr*0.06, ntY - hr*0.08, hx - hr*0.04, ntY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx + hr*0.04, nbY);
  ctx.quadraticCurveTo(hx + hr*0.06, ntY - hr*0.08, hx + hr*0.04, ntY);
  ctx.stroke();

  // Nose tip
  ctx.beginPath();
  ctx.arc(hx, ntY, hr*0.072, 0, Math.PI*2);
  ctx.fillStyle = '#B87040';
  ctx.fill();

  // Nostrils
  for (const s of [-1,1]) {
    ctx.beginPath();
    ctx.ellipse(hx + s*hr*0.11, ntY + hr*0.01, hr*0.062, hr*0.042, s*0.3, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(90,35,10,0.42)';
    ctx.fill();
  }
}

function _drawMouth(ctx, hx, hy, hr) {
  const my = hy + hr * 0.48;
  const mw = hr * (0.26 + S.mouthOpen*0.12);
  const smile = S.smile * 2 - 1; // -1 to 1

  if (S.mouthOpen > 0.5) {
    const oh = hr * S.mouthOpen * 0.18;
    ctx.beginPath();
    ctx.ellipse(hx, my, mw*0.65, oh, 0, 0, Math.PI*2);
    ctx.fillStyle = '#5C2010';
    ctx.fill();
    ctx.strokeStyle = '#8B3A20';
    ctx.lineWidth = _u*0.016;
    ctx.stroke();
    // Teeth
    ctx.beginPath();
    ctx.rect(hx - mw*0.52, my - oh*0.72, mw*1.04, oh*0.52);
    ctx.fillStyle = '#F0EDE8';
    ctx.fill();
    // Upper lip
    ctx.beginPath();
    ctx.moveTo(hx - mw, my - oh*0.9);
    ctx.quadraticCurveTo(hx, my - oh*1.4, hx + mw, my - oh*0.9);
    ctx.strokeStyle = '#8B5530';
    ctx.lineWidth = _u*0.022;
    ctx.stroke();
  } else {
    const curveY = hr * smile * 0.16;
    // Lip lines (more realistic)
    ctx.strokeStyle = '#8B5530';
    ctx.lineWidth = _u*0.028;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx - mw, my);
    ctx.quadraticCurveTo(hx, my + curveY, hx + mw, my);
    ctx.stroke();
    // Upper lip M-shape hint
    ctx.strokeStyle = 'rgba(120,65,30,0.55)';
    ctx.lineWidth = _u*0.016;
    ctx.beginPath();
    ctx.moveTo(hx - mw*0.65, my - _u*0.012);
    ctx.quadraticCurveTo(hx - mw*0.2, my - _u*0.025, hx, my - _u*0.012);
    ctx.quadraticCurveTo(hx + mw*0.2, my - _u*0.025, hx + mw*0.65, my - _u*0.012);
    ctx.stroke();
    // Mouth corners
    if (smile > 0.3) {
      for (const s of [-1,1]) {
        ctx.beginPath();
        ctx.arc(hx + s*mw, my, hr*0.022, 0, Math.PI*2);
        ctx.fillStyle = '#A06040';
        ctx.fill();
      }
    }
  }
}

function _drawTears(ctx, hx, hy, hr) {
  ctx.save();
  ctx.globalAlpha = S.tear;
  for (const s of [-1,1]) {
    const tx = hx + s*hr*0.34;
    let ty = hy + hr*0.06;
    // Multiple tear droplets flowing down
    for (let d = 0; d < 2; d++) {
      const dropY = ty + d * hr * 0.28;
      ctx.beginPath();
      ctx.moveTo(tx, dropY);
      ctx.bezierCurveTo(
        tx + s*hr*0.038, dropY + hr*0.10,
        tx + s*hr*0.052, dropY + hr*0.20,
        tx, dropY + hr*0.26
      );
      ctx.bezierCurveTo(
        tx - s*hr*0.052, dropY + hr*0.20,
        tx - s*hr*0.038, dropY + hr*0.10,
        tx, dropY
      );
      ctx.fillStyle = '#A8D8F8';
      ctx.fill();
      // Tear shine
      ctx.beginPath();
      ctx.arc(tx - s*hr*0.010, dropY+hr*0.09, hr*0.016, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.70)';
      ctx.fill();
    }
  }
  ctx.restore();
}

function _roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
