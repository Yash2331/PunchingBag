/* ════════════════════════════════════════════════════════════
   character.js — Procedural animated chibi character
   All drawing via Canvas 2D API — zero external assets.
   Exports: charInit, charUpdate, charDraw, charReact,
            charIsHit, charReset, charSetPupilTarget
   ════════════════════════════════════════════════════════════ */

// ─────────────────────────────────────────── dimensions ──
let _cw = 400, _ch = 400;
let _cx = 200, _cy = 220;  // character anchor (chest area)
let _u  = 150;             // charUnit — base scale unit

// ─────────────────────────────────────────── core state ──
const S = {
  // physical offsets (shake, fall)
  ox: 0, oy: 0, rot: 0,
  scx: 1, scy: 1,          // squish/stretch scale
  fallY: 0, fallRot: 0, falling: false,

  // expression (current, lerped)
  eyeOpen:    1,   // 0=closed, 1=open, >1=wide
  browAngle:  0,   // -1=raised/happy, 0=neutral, 1=furrowed/angry
  smile:      0.5, // 0=frown, 0.5=neutral, 1=big grin
  mouthOpen:  0,   // 0=closed, 1=wide-O
  blush:      0.2, // 0-1
  tear:       0,   // 0-1
  heartEye:   false,
  starEye:    false,

  // targets for lerp
  t_eyeOpen:   1,
  t_browAngle: 0,
  t_smile:     0.5,
  t_mouthOpen: 0,
  t_blush:     0.2,
  t_tear:      0,
  t_heartEye:  false,
  t_starEye:   false,
};

// ────────────────────────────────────── idle animations ──
let _breathPhase  = 0;   // 0–2π
let _swayPhase    = 0;
let _blinkTimer   = 0;
let _nextBlink    = 3000;
let _blinking     = false;
let _blinkOpen    = 1;   // 1=open, lerps to 0 and back

// ─────────────────────────────────── reaction / state ──
let _state = 'idle';     // idle | poke | slap | throw | cry | happy | love | shock | apologize | falling
let _stateTimer = 0;     // ms remaining in state
let _hitFlash   = 0;     // 0-1 white flash on hit

// ───────────────────────────────────────── eye tracking ──
let _pupilTX = 0, _pupilTY = 0;
let _pupilX  = 0, _pupilY  = 0;

// ─────────────────────────────────────────────── utils ──
const lerp  = (a,b,t) => a + (b-a)*t;
const clamp = (v,mn,mx) => Math.max(mn, Math.min(mx, v));
const ease  = t => 1 - Math.pow(1-t, 3);

// ══════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════

export function charInit(logicalW, logicalH) {
  _charResize(logicalW, logicalH);
}

export function charResize(w, h) {
  _charResize(w, h);
}

function _charResize(w, h) {
  _cw = w; _ch = h;
  _cx = w / 2;
  _cy = h * 0.56;
  _u  = Math.min(w, h) * 0.44;
}

/** Call every frame. dt = ms since last frame. */
export function charUpdate(dt, pointerX, pointerY) {
  // Pupil tracking (pointer in canvas coords)
  const hx = _cx, hy = _cy - _u*0.10;
  const hr = _u * 0.35;
  const dx = pointerX - hx, dy = pointerY - hy;
  const dist = Math.sqrt(dx*dx+dy*dy);
  const maxPupilDrift = hr * 0.22;
  if (dist > 0) {
    _pupilTX = (dx/dist) * Math.min(dist/hr, 1) * maxPupilDrift;
    _pupilTY = (dy/dist) * Math.min(dist/hr, 1) * maxPupilDrift;
  }
  _pupilX = lerp(_pupilX, _pupilTX, 0.08);
  _pupilY = lerp(_pupilY, _pupilTY, 0.08);

  // Idle animations
  _breathPhase += dt * 0.0015;
  _swayPhase   += dt * 0.0008;

  // Blink
  _blinkTimer += dt;
  if (!_blinking && _blinkTimer > _nextBlink) {
    _blinking   = true;
    _blinkTimer = 0;
    _nextBlink  = 2500 + Math.random() * 3000;
  }
  if (_blinking) {
    const bProgress = _blinkTimer / 180;
    if (bProgress < 0.5) _blinkOpen = lerp(1, 0, ease(bProgress * 2));
    else                 _blinkOpen = lerp(0, 1, ease((bProgress-0.5)*2));
    if (bProgress >= 1)  { _blinking = false; _blinkOpen = 1; }
  }

  // Decay special state timer
  if (_stateTimer > 0) {
    _stateTimer -= dt;
    if (_stateTimer <= 0) {
      _stateTimer = 0;
      if (_state !== 'cry' && _state !== 'love' && _state !== 'apologize') {
        _setTargets('idle');
        _state = 'idle';
      }
    }
  }

  // Hit flash decay
  _hitFlash = Math.max(0, _hitFlash - dt * 0.008);

  // Physical recovery
  S.ox  = lerp(S.ox,  0, 0.18);
  S.oy  = lerp(S.oy,  0, 0.18);
  S.rot = lerp(S.rot, 0, 0.14);
  S.scx = lerp(S.scx, 1, 0.16);
  S.scy = lerp(S.scy, 1, 0.16);

  // Expression lerp
  const lspd = 0.10;
  S.eyeOpen   = lerp(S.eyeOpen,   S.t_eyeOpen,   lspd);
  S.browAngle = lerp(S.browAngle, S.t_browAngle,  lspd);
  S.smile     = lerp(S.smile,     S.t_smile,      lspd);
  S.mouthOpen = lerp(S.mouthOpen, S.t_mouthOpen,  lspd);
  S.blush     = lerp(S.blush,     S.t_blush,      lspd);
  S.tear      = lerp(S.tear,      S.t_tear,       lspd);
  S.heartEye  = S.t_heartEye;
  S.starEye   = S.t_starEye;

  // Fall animation
  if (S.falling) {
    S.fallY   += dt * 0.8;
    S.fallRot += dt * 0.004;
    if (S.fallY > _u * 0.6) {
      // bounce back
      S.falling  = false;
      S.fallY    = 0;
      S.fallRot  = 0;
      _setTargets('apologize');
      _state     = 'apologize';
      _stateTimer = 3000;
    }
  }
}

/** Draw character into ctx at current animation state.
 *  shakeOffsetX/Y from effects module. */
export function charDraw(ctx, shakeX = 0, shakeY = 0) {
  ctx.save();

  // Apply screen shake + character position + fall
  const bX   = _cx + shakeX + S.ox;
  const bY   = _cy + shakeY + S.oy + S.fallY;
  const rot  = S.rot + (S.falling ? S.fallRot : 0);
  const idle_breathScale = 1 + Math.sin(_breathPhase) * 0.012;
  const idle_sway = Math.sin(_swayPhase) * 0.015;

  ctx.translate(bX, bY);
  ctx.rotate(rot + idle_sway);
  ctx.scale(S.scx, S.scy * idle_breathScale);

  // Character shadow
  _drawShadow(ctx);

  // Body
  _drawBody(ctx);

  // Neck
  _drawNeck(ctx);

  // Head
  const hx = 0, hy = -_u * 0.10;
  const hr = _u * 0.35;
  _drawHead(ctx, hx, hy, hr);

  // Hair back (behind ears)
  _drawHairBack(ctx, hx, hy, hr);

  // Face features
  _drawFace(ctx, hx, hy, hr);

  // Hair front (over forehead)
  _drawHairFront(ctx, hx, hy, hr);

  // Hit flash overlay
  if (_hitFlash > 0) {
    ctx.globalAlpha = _hitFlash * 0.4;
    ctx.beginPath();
    ctx.arc(hx, hy, hr * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/** Trigger a reaction. action = 'poke'|'slap'|'throw'|'hug'|'apologize'
 *  intensity = 1-5 */
export function charReact(action, intensity = 1) {
  _hitFlash = 0.7 + intensity * 0.05;

  switch (action) {
    case 'poke':
      S.ox  =  (Math.random() < 0.5 ? -1 : 1) * _u * 0.04;
      S.oy  = -_u * 0.02;
      S.scx = 0.92; S.scy = 1.10;
      _setTargets('poke', intensity);
      _state = 'poke'; _stateTimer = 1000;
      break;

    case 'slap':
      S.ox  = (Math.random() < 0.5 ? -1 : 1) * _u * (0.08 + intensity * 0.03);
      S.oy  = -_u * 0.03;
      S.rot = (Math.random() < 0.5 ? -1 : 1) * (0.08 + intensity * 0.04);
      S.scx = 0.85 + Math.random() * 0.1;
      S.scy = 1.15 + Math.random() * 0.05;
      _setTargets('slap', intensity);
      _state = 'slap'; _stateTimer = 1400;
      break;

    case 'throw':
      S.ox  = (Math.random() < 0.5 ? -1 : 1) * _u * (0.06 + intensity * 0.04);
      S.oy  = _u * (0.02 + intensity * 0.01);
      S.rot = (Math.random() < 0.5 ? -1 : 1) * (0.06 + intensity * 0.03);
      S.scx = 1.10; S.scy = 0.88;
      _setTargets('shock', intensity);
      _state = 'shock'; _stateTimer = 1600;
      break;

    case 'dramatic': // triggered at high combo / rage
      S.falling   = true;
      S.fallY     = 0;
      S.fallRot   = 0;
      S.ox        = (Math.random() < 0.5 ? -1 : 1) * _u * 0.05;
      _setTargets('cry');
      _state = 'falling';
      break;

    case 'cry':
      _setTargets('cry');
      _state = 'cry'; _stateTimer = 4000;
      break;

    case 'apologize':
      _setTargets('apologize');
      _state = 'apologize'; _stateTimer = 3000;
      break;

    case 'hug':
      _setTargets('love');
      _state = 'love'; _stateTimer = 5000;
      break;

    case 'forgiven':
      _setTargets('happy');
      _state = 'happy'; _stateTimer = 6000;
      break;
  }
}

/** Check if canvas point (x,y) hits the character's interactive zone */
export function charIsHit(x, y) {
  const hx = _cx + S.ox;
  const hy = _cy - _u * 0.10 + S.oy;
  const hr = _u * 0.35;
  // head circle + body rect hitbox
  const headHit = Math.hypot(x - hx, y - hy) < hr * 1.05;
  const bodyLeft   = _cx - _u * 0.28;
  const bodyRight  = _cx + _u * 0.28;
  const bodyTop    = _cy - _u * 0.02;
  const bodyBottom = _cy + _u * 0.36;
  const bodyHit = x > bodyLeft && x < bodyRight && y > bodyTop && y < bodyBottom;
  return headHit || bodyHit;
}

export function charReset() {
  _state = 'idle';
  _stateTimer = 0;
  S.falling = false; S.fallY = 0; S.fallRot = 0;
  S.ox = 0; S.oy = 0; S.rot = 0; S.scx = 1; S.scy = 1;
  _setTargets('idle');
  Object.assign(S, {
    eyeOpen:1, browAngle:0, smile:0.5, mouthOpen:0, blush:0.2, tear:0,
    heartEye:false, starEye:false,
  });
}

export function charSetPupilTarget(x, y) {
  _pupilTX = x; _pupilTY = y;
}

// ══════════════════════════════════════════════════════════
//  EXPRESSION TARGET SETTER
// ══════════════════════════════════════════════════════════
function _setTargets(expr, intensity = 1) {
  S.t_heartEye = false;
  S.t_starEye  = false;
  switch (expr) {
    case 'idle':
      S.t_eyeOpen=1; S.t_browAngle=0; S.t_smile=0.55;
      S.t_mouthOpen=0; S.t_blush=0.2; S.t_tear=0; break;

    case 'happy':
      S.t_eyeOpen=0.75; S.t_browAngle=-0.25; S.t_smile=1;
      S.t_mouthOpen=0.3; S.t_blush=0.65; S.t_tear=0;
      S.t_starEye = intensity > 3; break;

    case 'poke':
      S.t_eyeOpen=1.15; S.t_browAngle=0.2; S.t_smile=0.3;
      S.t_mouthOpen=0.15; S.t_blush=0.1; S.t_tear=0; break;

    case 'slap':
      const si = Math.min(intensity, 5);
      S.t_eyeOpen = 1 + si * 0.12;
      S.t_browAngle = 0.3 + si * 0.1;
      S.t_smile = 0.2 - si * 0.03;
      S.t_mouthOpen = 0.2 + si * 0.08;
      S.t_blush=0; S.t_tear = si > 3 ? 0.3 : 0; break;

    case 'shock':
      S.t_eyeOpen=1.5; S.t_browAngle=-0.5; S.t_smile=0.5;
      S.t_mouthOpen=0.85; S.t_blush=0; S.t_tear=0; break;

    case 'cry':
      S.t_eyeOpen=0.4; S.t_browAngle=-0.7; S.t_smile=0;
      S.t_mouthOpen=0.25; S.t_blush=0.3; S.t_tear=1; break;

    case 'love':
      S.t_eyeOpen=0.8; S.t_browAngle=-0.3; S.t_smile=1;
      S.t_mouthOpen=0.1; S.t_blush=0.9; S.t_tear=0;
      S.t_heartEye=true; break;

    case 'apologize':
      S.t_eyeOpen=0.65; S.t_browAngle=-0.55; S.t_smile=0.15;
      S.t_mouthOpen=0.1; S.t_blush=0.25; S.t_tear=0.4; break;
  }
}

// ══════════════════════════════════════════════════════════
//  DRAWING HELPERS
// ══════════════════════════════════════════════════════════

function _drawShadow(ctx) {
  const bw = _u * 0.48;
  const by = _u * 0.36;
  const g = ctx.createRadialGradient(0, by, 0, 0, by, bw*0.6);
  g.addColorStop(0, 'rgba(0,0,0,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.ellipse(0, by + _u*0.06, bw*0.6, _u*0.06, 0, 0, Math.PI*2);
  ctx.fillStyle = g;
  ctx.fill();
}

function _drawBody(ctx) {
  const bw = _u * 0.52, bh = _u * 0.38;
  const by = _u * 0.04;
  const r  = _u * 0.10;

  // Shirt gradient
  const g = ctx.createLinearGradient(-bw/2, by, bw/2, by+bh);
  g.addColorStop(0, '#7B72FF');
  g.addColorStop(1, '#4E45C0');
  ctx.beginPath();
  _roundRect(ctx, -bw/2, by, bw, bh, r);
  ctx.fillStyle = g;
  ctx.fill();

  // Shirt highlight
  ctx.beginPath();
  _roundRect(ctx, -bw/2+2, by+2, bw*0.42, bh*0.35, r*0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fill();

  // Shirt logo (tiny heart)
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = `${_u*0.11}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('♡', 0, by + bh*0.42);

  // Arms
  _drawArms(ctx, bw, bh, by);
}

function _drawArms(ctx, bw, bh, by) {
  const aw = _u * 0.135, ah = _u * 0.28;
  const armR = _u * 0.065;
  const aSwing = Math.sin(_breathPhase * 1.3) * 0.03;

  for (const side of [-1, 1]) {
    ctx.save();
    const ax = side * (bw/2 + aw*0.3);
    const ay = by + bh*0.08;
    ctx.translate(ax, ay);
    ctx.rotate(side * aSwing);

    // Arm sleeve (shirt color)
    const g = ctx.createLinearGradient(0, 0, 0, ah);
    g.addColorStop(0, '#7B72FF');
    g.addColorStop(1, '#4E45C0');
    ctx.beginPath();
    _roundRect(ctx, -aw/2, 0, aw, ah*0.55, armR);
    ctx.fillStyle = g;
    ctx.fill();

    // Forearm (skin)
    const sg = ctx.createLinearGradient(0, ah*0.5, 0, ah);
    sg.addColorStop(0, '#FFD5A8');
    sg.addColorStop(1, '#FFBA91');
    ctx.beginPath();
    _roundRect(ctx, -aw/2+1, ah*0.5, aw-2, ah*0.52, armR);
    ctx.fillStyle = sg;
    ctx.fill();

    ctx.restore();
  }
}

function _drawNeck(ctx) {
  const nw = _u * 0.13, nh = _u * 0.09;
  const ny = -_u * 0.06;
  const g = ctx.createLinearGradient(-nw/2, ny, nw/2, ny+nh);
  g.addColorStop(0, '#FFD5A8');
  g.addColorStop(1, '#FFBA91');
  ctx.beginPath();
  _roundRect(ctx, -nw/2, ny, nw, nh, _u*0.03);
  ctx.fillStyle = g;
  ctx.fill();
}

function _drawHead(ctx, hx, hy, hr) {
  // Face base gradient
  const g = ctx.createRadialGradient(hx-hr*0.18, hy-hr*0.25, hr*0.08, hx, hy, hr);
  g.addColorStop(0, '#FFE3C0');
  g.addColorStop(0.7, '#FFD0A0');
  g.addColorStop(1, '#FFBA80');
  ctx.beginPath();
  ctx.arc(hx, hy, hr, 0, Math.PI*2);
  ctx.fillStyle = g;
  ctx.fill();

  // Subtle chin shadow
  ctx.beginPath();
  ctx.ellipse(hx, hy+hr*0.65, hr*0.65, hr*0.22, 0, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(210,140,90,0.14)';
  ctx.fill();

  // Cheek blush
  if (S.blush > 0) {
    ctx.save();
    ctx.globalAlpha = S.blush * 0.5;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(hx + side*hr*0.44, hy+hr*0.18, hr*0.22, hr*0.13, side*0.15, 0, Math.PI*2);
      ctx.fillStyle = '#FF9EB5';
      ctx.fill();
    }
    ctx.restore();
  }
}

function _drawHairBack(ctx, hx, hy, hr) {
  ctx.save();
  const g = ctx.createRadialGradient(hx, hy-hr*0.2, hr*0.3, hx, hy, hr*1.1);
  g.addColorStop(0, '#5C3D24');
  g.addColorStop(1, '#3D2B1F');
  ctx.fillStyle = g;

  // Main hair mass (back)
  ctx.beginPath();
  ctx.arc(hx, hy, hr*1.02, Math.PI*0.82, Math.PI*2.18);
  ctx.lineTo(hx + hr*0.3, hy + hr*0.6);
  ctx.arc(hx, hy + hr*0.55, hr*0.3, 0, Math.PI);
  ctx.lineTo(hx - hr*0.3, hy + hr*0.6);
  ctx.closePath();
  ctx.fill();

  // Side hair tufts
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(hx + side*hr*0.85, hy - hr*0.05);
    ctx.quadraticCurveTo(hx + side*hr*1.25, hy, hx + side*hr*1.1, hy + hr*0.35);
    ctx.quadraticCurveTo(hx + side*hr*0.9, hy + hr*0.3, hx + side*hr*0.78, hy + hr*0.15);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function _drawHairFront(ctx, hx, hy, hr) {
  const g = ctx.createLinearGradient(hx, hy-hr, hx, hy-hr*0.1);
  g.addColorStop(0, '#5C3D24');
  g.addColorStop(1, '#3D2B1F');
  ctx.fillStyle = g;

  // Top hair mass
  ctx.beginPath();
  ctx.moveTo(hx - hr*0.96, hy - hr*0.2);
  ctx.quadraticCurveTo(hx - hr*0.75, hy - hr*1.25, hx, hy - hr*1.22);
  ctx.quadraticCurveTo(hx + hr*0.75, hy - hr*1.25, hx + hr*0.96, hy - hr*0.2);
  ctx.quadraticCurveTo(hx + hr*0.7, hy - hr*0.65, hx, hy - hr*0.7);
  ctx.quadraticCurveTo(hx - hr*0.7, hy - hr*0.65, hx - hr*0.96, hy - hr*0.2);
  ctx.closePath();
  ctx.fill();

  // Front bangs
  const bangData = [
    // [startX, cpX, cpY, endX, endY]
    [-0.45, -0.6, -0.5, -0.3, -0.15],
    [-0.1,  -0.15, -0.4,  0.1, -0.12],
    [ 0.2,   0.28, -0.42, 0.42, -0.18],
  ];
  for (const [sx, cpx, cpy, ex, ey] of bangData) {
    ctx.beginPath();
    ctx.moveTo(hx + sx*hr, hy + (-0.62)*hr);
    ctx.quadraticCurveTo(hx + cpx*hr, hy + cpy*hr, hx + ex*hr, hy + ey*hr);
    ctx.lineWidth = hr * 0.18;
    ctx.strokeStyle = g;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Hair highlight streak
  ctx.beginPath();
  ctx.moveTo(hx - hr*0.15, hy - hr*1.15);
  ctx.quadraticCurveTo(hx + hr*0.05, hy - hr*0.9, hx + hr*0.2, hy - hr*0.75);
  ctx.strokeStyle = 'rgba(255,255,255,0.13)';
  ctx.lineWidth = hr*0.07;
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
  const eyeSpX = hr * 0.36;
  const eyeY   = hy - hr * 0.06;
  const eyeR   = hr * 0.20;
  const openness = clamp(S.eyeOpen * _blinkOpen, 0.05, 1.6);

  for (const side of [-1, 1]) {
    const ex = hx + side * eyeSpX;
    const ey = eyeY;

    ctx.save();

    // Clipping ellipse for eye white
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeR + 1, (eyeR + 1) * openness, 0, 0, Math.PI*2);
    ctx.clip();

    // Eye white
    ctx.beginPath();
    ctx.ellipse(ex, ey, eyeR, eyeR * openness, 0, 0, Math.PI*2);
    ctx.fillStyle = '#FAFAFF';
    ctx.fill();

    if (S.heartEye) {
      ctx.font = `${eyeR*1.3}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤️', ex, ey + eyeR*0.05);
    } else if (S.starEye) {
      ctx.font = `${eyeR*1.2}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', ex, ey + eyeR*0.05);
    } else {
      // Iris gradient
      const irisR = eyeR * 0.76;
      const ig = ctx.createRadialGradient(ex+irisR*0.18, ey-irisR*0.18, irisR*0.08, ex, ey, irisR);
      ig.addColorStop(0, '#9B8FE8');
      ig.addColorStop(0.5, '#6C63FF');
      ig.addColorStop(1, '#3D35A8');
      ctx.beginPath();
      ctx.arc(ex, ey, irisR, 0, Math.PI*2);
      ctx.fillStyle = ig;
      ctx.fill();

      // Pupil
      const px = ex + _pupilX * 0.55;
      const py = ey + _pupilY * 0.55;
      ctx.beginPath();
      ctx.arc(px, py, irisR*0.54, 0, Math.PI*2);
      ctx.fillStyle = '#12101E';
      ctx.fill();

      // Main highlight
      ctx.beginPath();
      ctx.arc(ex - eyeR*0.27, ey - eyeR*0.22, eyeR*0.23, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fill();

      // Small secondary highlight
      ctx.beginPath();
      ctx.arc(ex + eyeR*0.18, ey + eyeR*0.05, eyeR*0.10, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.50)';
      ctx.fill();
    }

    ctx.restore();

    // Eyelashes (top)
    ctx.strokeStyle = '#2D1B0E';
    ctx.lineWidth = hr * 0.022;
    ctx.lineCap = 'round';
    const topEyeY = ey - eyeR * openness;
    for (let i = -2; i <= 2; i++) {
      const lx = ex + i * eyeR * 0.35;
      const angle = (i / 3) * 0.4 - 0.1;
      ctx.beginPath();
      ctx.moveTo(lx, topEyeY + eyeR*0.02);
      ctx.lineTo(lx + Math.sin(angle)*eyeR*0.22, topEyeY - eyeR*0.28);
      ctx.stroke();
    }

    // Eyebrow
    const browY = ey - eyeR * (1.35 + S.eyeOpen * 0.15);
    const ba = side === -1 ? -S.browAngle : S.browAngle; // mirror for right brow
    ctx.strokeStyle = '#3D2B1F';
    ctx.lineWidth = hr * 0.055;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ex - eyeR*0.78, browY + ba * eyeR * 0.55);
    ctx.quadraticCurveTo(ex, browY - ba * eyeR * 0.20, ex + eyeR*0.78, browY - ba * eyeR * 0.18 * side);
    ctx.stroke();
  }
}

function _drawNose(ctx, hx, hy, hr) {
  const ny = hy + hr * 0.16;
  ctx.strokeStyle = 'rgba(180,100,60,0.45)';
  ctx.lineWidth = hr * 0.038;
  ctx.lineCap = 'round';
  // Small cute dot-nose (two tiny curves)
  ctx.beginPath();
  ctx.arc(hx - hr*0.07, ny, hr*0.045, 0, Math.PI*2);
  ctx.arc(hx + hr*0.07, ny, hr*0.045, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(180,100,60,0.28)';
  ctx.fill();
}

function _drawMouth(ctx, hx, hy, hr) {
  const my = hy + hr * 0.30;
  const mw = hr * (0.28 + S.mouthOpen * 0.14);
  const smile = S.smile * 2 - 1; // -1 to 1

  ctx.strokeStyle = '#C0714A';
  ctx.lineWidth = hr * 0.048;
  ctx.lineCap = 'round';

  if (S.mouthOpen > 0.5) {
    // Open mouth (O shape)
    const oh = hr * S.mouthOpen * 0.22;
    ctx.beginPath();
    ctx.ellipse(hx, my, mw * 0.6, oh, 0, 0, Math.PI*2);
    ctx.fillStyle = '#8B3A2A';
    ctx.fill();
    ctx.strokeStyle = '#C0714A';
    ctx.stroke();
    // Teeth
    ctx.beginPath();
    ctx.rect(hx - mw*0.55, my - oh*0.7, mw*1.1, oh*0.5);
    ctx.fillStyle = '#FFFFF0';
    ctx.fill();
  } else {
    // Closed smile/frown
    const curveY = hr * smile * 0.18;
    ctx.beginPath();
    ctx.moveTo(hx - mw, my);
    ctx.quadraticCurveTo(hx, my + curveY, hx + mw, my);
    ctx.stroke();
    // Mouth corners (dimples)
    if (smile > 0.4) {
      for (const s of [-1,1]) {
        ctx.beginPath();
        ctx.arc(hx + s*mw, my, hr*0.025, 0, Math.PI*2);
        ctx.fillStyle = '#D08060';
        ctx.fill();
      }
    }
  }
}

function _drawTears(ctx, hx, hy, hr) {
  ctx.save();
  ctx.globalAlpha = S.tear;
  const tearColor = '#74C0FC';
  for (const side of [-1, 1]) {
    const tx = hx + side * hr * 0.36;
    const ty = hy + hr * 0.06;
    // Tear drop path
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.bezierCurveTo(
      tx + side*hr*0.04, ty + hr*0.12,
      tx + side*hr*0.06, ty + hr*0.22,
      tx, ty + hr*0.28
    );
    ctx.bezierCurveTo(
      tx - side*hr*0.06, ty + hr*0.22,
      tx - side*hr*0.04, ty + hr*0.12,
      tx, ty
    );
    ctx.fillStyle = tearColor;
    ctx.fill();

    // Tear shine
    ctx.beginPath();
    ctx.arc(tx - side*hr*0.01, ty + hr*0.10, hr*0.018, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fill();
  }
  ctx.restore();
}

// ── Canvas helper: rounded rectangle ──────────────────────
function _roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
