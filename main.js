/* ════════════════════════════════════════════════════════════
   main.js — Game orchestrator
   Imports all modules, runs game loop, handles input,
   manages state, save/load via localStorage.
   ════════════════════════════════════════════════════════════ */

import {
  sfxPoke, sfxSlap, sfxThrow, sfxCombo, sfxDramaticFall,
  sfxCry, sfxHug, sfxApologize, sfxAchievement,
  startMusic, stopMusic, setMusicPhase,
  setMusicEnabled, setSfxEnabled, resumeCtx,
} from './audio.js';

import {
  charInit, charResize, charUpdate, charDraw,
  charReact, charIsHit, charReset,
} from './character.js';

import {
  fxInit, fxResize, fxUpdate, fxBgDraw, fxDraw,
  fxDrawRain, fxSpawnHit, fxSpawnHeart, fxSpawnStar,
  fxShake, fxGetShake, fxFloatEmoji, fxHeartBurst,
  fxSetRain, fxSetRainCanvas,
} from './effects.js';

import {
  uiInit, uiUpdate, uiShowDialogue, uiUnlockAchievement,
  uiLoadUnlocked, uiGetUnlocked, uiBindSettings, uiSetToggle,
  uiShowSecretEnding, uiPhaseTransition,
  getDialogue,
} from './ui.js';

// ══════════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════════

const GS = {
  anger:    0,
  love:     100,
  totalHits:0,
  combo:    0,
  maxCombo: 0,
  score:    0,
  phase:    'normal',   // normal | chaotic | emotional | wholesome
  sorryUnlocked: false,
  hugUnlocked:   false,
  secretEndingShown: false,
  lastHitTime:   0,
  comboTimeout:  2400,  // ms without hit resets combo
  musicEnabled:  true,
  sfxEnabled:    true,
  darkMode:      true,
  particles:     true,
  startTime:     Date.now(),
  dramaticFallTriggered: false,
};

const SAVE_KEY = 'bfmode_save_v2';

// ══════════════════════════════════════════════════════════
//  CANVAS SETUP
// ══════════════════════════════════════════════════════════

let canvas, ctx, bgCanvas, rainCanvas, floatLayer, canvasWrap;
let canvasW = 400, canvasH = 400, dpr = 1;

function setupCanvas() {
  canvas      = document.getElementById('game-canvas');
  bgCanvas    = document.getElementById('bg-canvas');
  rainCanvas  = document.getElementById('rain-canvas');
  floatLayer  = document.getElementById('float-layer');
  canvasWrap  = document.getElementById('canvas-wrap');

  ctx = canvas.getContext('2d');
  resizeAll();
  window.addEventListener('resize', resizeAll);
}

function resizeAll() {
  dpr = window.devicePixelRatio || 1;
  const rect = canvasWrap.getBoundingClientRect();
  canvasW = rect.width;
  canvasH = rect.height;

  // Main canvas — retina-aware
  canvas.width  = canvasW * dpr;
  canvas.height = canvasH * dpr;
  canvas.style.width  = canvasW + 'px';
  canvas.style.height = canvasH + 'px';
  // Use setTransform to avoid accumulation on repeated resizes
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Decorative canvases use logical pixels (no DPR needed)
  if (bgCanvas) {
    bgCanvas.width  = canvasW;
    bgCanvas.height = canvasH;
  }
  if (rainCanvas) {
    rainCanvas.width  = canvasW;
    rainCanvas.height = canvasH;
  }

  charResize(canvasW, canvasH);
  fxResize(canvasW, canvasH);
}

// ══════════════════════════════════════════════════════════
//  INPUT HANDLING
// ══════════════════════════════════════════════════════════

let pointerX = canvasW / 2, pointerY = canvasH / 2;
let activeAction = 'slap'; // poke | slap | throw
let _lastActionTime = 0;

function getCanvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left),
    y: (src.clientY - rect.top),
  };
}

function onPointerMove(e) {
  const p = getCanvasPos(e);
  pointerX = p.x; pointerY = p.y;
}

function onPointerDown(e) {
  e.preventDefault();
  resumeCtx();
  const p = getCanvasPos(e);
  pointerX = p.x; pointerY = p.y;

  // Throttle: min 180ms between hits
  const now = Date.now();
  if (now - _lastActionTime < 180) return;
  _lastActionTime = now;

  if (charIsHit(p.x, p.y)) {
    doHit(activeAction, p.x, p.y);
  } else {
    // Tapping outside character — indirect throw
    if (activeAction === 'throw') {
      doHit('throw', p.x, p.y);
    }
  }
}

function bindInputs() {
  canvas.addEventListener('mousemove',   onPointerMove, { passive: true });
  canvas.addEventListener('mousedown',   onPointerDown);
  canvas.addEventListener('touchmove',   onPointerMove, { passive: true });
  canvas.addEventListener('touchstart',  onPointerDown, { passive: false });

  // Action buttons
  document.getElementById('btn-poke')?.addEventListener('click',  () => { activeAction = 'poke';  triggerAction('poke');  });
  document.getElementById('btn-slap')?.addEventListener('click',  () => { activeAction = 'slap';  triggerAction('slap');  });
  document.getElementById('btn-throw')?.addEventListener('click', () => { activeAction = 'throw'; triggerAction('throw'); });
  document.getElementById('btn-sorry')?.addEventListener('click', doApologize);
  document.getElementById('btn-hug')?.addEventListener('click',   doHug);
  document.getElementById('btn-play-again')?.addEventListener('click', resetGame);
}

function triggerAction(action) {
  resumeCtx();
  const now = Date.now();
  if (now - _lastActionTime < 200) return;
  _lastActionTime = now;
  doHit(action, canvasW/2, canvasH/2);
}

// ══════════════════════════════════════════════════════════
//  GAME LOGIC
// ══════════════════════════════════════════════════════════

const THROWABLES = ['🥄','📚','🍳','🎱','💼','🧦','📱','🎮','🍕','🧃','📝','🎯','👟','🪴','🧁'];

function doHit(action, x, y) {
  const now = Date.now();

  // Combo logic
  if (now - GS.lastHitTime < GS.comboTimeout) GS.combo++;
  else GS.combo = 1;
  GS.lastHitTime = now;
  if (GS.combo > GS.maxCombo) GS.maxCombo = GS.combo;

  // Score
  const multiplier = 1 + Math.floor(GS.combo / 5) * 0.5;
  const baseScore  = action === 'slap' ? 15 : action === 'throw' ? 12 : 8;
  GS.score += Math.round(baseScore * multiplier);

  // Meters
  const angerIncrease = action === 'slap' ? 8 : action === 'throw' ? 6 : 3;
  GS.anger = Math.min(100, GS.anger + angerIncrease);
  GS.love  = Math.max(0,   GS.love  - angerIncrease * 0.4);
  GS.totalHits++;

  // Intensity
  const intensity = Math.min(5, 1 + Math.floor(GS.combo / 4));

  // Dramatic fall check (non-throw actions)
  const canDramatic = intensity >= 4 && !GS.dramaticFallTriggered && GS.totalHits > 15;
  const goDramatic  = canDramatic && Math.random() < 0.18;

  if (action === 'throw') {
    // ── THROW: play whoosh now, impact fires when projectile arrives ──
    sfxThrow();
    if (GS.combo >= 3) sfxCombo(Math.min(GS.combo, 5));

    // Character target position on canvas
    const charHitX = canvasW / 2 + (Math.random() * 24 - 12);
    const charHitY = canvasH * 0.38 + (Math.random() * canvasH * 0.14);

    _spawnProjectile(charHitX, charHitY, () => {
      // ← called when projectile visually arrives
      sfxSlap(); // impact thud
      if (goDramatic) {
        GS.dramaticFallTriggered = true;
        sfxDramaticFall();
        charReact('dramatic', intensity);
        uiUnlockAchievement('dramatic_fall');
        setTimeout(() => sfxCry(), 1200);
        setTimeout(() => { GS.dramaticFallTriggered = false; }, 8000);
      } else {
        charReact('throw', intensity);
      }
      if (GS.particles) {
        fxSpawnHit(charHitX, charHitY, intensity);
        if (GS.combo >= 3) fxSpawnStar(charHitX, charHitY - 30, 4);
        fxShake(Math.min(intensity * 2.5, 12), 280 + intensity * 50);
      }
      fxFloatEmoji(charHitX + (Math.random()*30-15), charHitY - 25, '💥', { size: 2 });
    });

  } else {
    // ── POKE / SLAP: immediate reaction ──
    if (action === 'poke')  sfxPoke();
    else                    sfxSlap();
    if (GS.combo >= 3) sfxCombo(Math.min(GS.combo, 5));

    if (goDramatic) {
      GS.dramaticFallTriggered = true;
      sfxDramaticFall();
      charReact('dramatic', intensity);
      uiUnlockAchievement('dramatic_fall');
      setTimeout(() => sfxCry(), 1200);
      setTimeout(() => { GS.dramaticFallTriggered = false; }, 8000);
    } else {
      charReact(action, intensity);
    }

    if (GS.particles) {
      fxSpawnHit(x, y, intensity);
      if (GS.combo >= 3) fxSpawnStar(x, y - 30, 4);
      fxShake(Math.min(intensity * 2.5, 12), 280 + intensity * 50);
    }

    const hitEmojis   = ['💥','⚡','✨','💫','🌟'];
    const comboEmojis = ['🔥','💯','🌀','⭐'];
    fxFloatEmoji(
      x + (Math.random()*40-20), y - 30,
      GS.combo >= 5 ? comboEmojis[Math.floor(Math.random()*comboEmojis.length)]
                    : hitEmojis[Math.floor(Math.random()*hitEmojis.length)]
    );
  }

  // Dialogue
  const dlg = getDialogue({ phase: GS.phase, action, combo: GS.combo, lowLove: GS.love < 25 });
  uiShowDialogue(dlg, 2200 + GS.combo * 80);

  // Unlock sorry button
  if (!GS.sorryUnlocked && GS.anger >= 45) {
    GS.sorryUnlocked = true;
    setTimeout(() => uiShowDialogue('💡 Sorry button unlock ho gaya… hint hint 🙏', 2800), 600);
  }

  // Phase changes
  _checkPhaseChange();

  // Achievements
  _checkHitAchievements();

  // Save
  saveGame();

  // UI update
  uiUpdate(GS);
}

function doApologize() {
  resumeCtx();
  sfxApologize();
  charReact('apologize');
  GS.anger  = Math.max(0, GS.anger  - 22);
  GS.love   = Math.min(100, GS.love + 15);
  if (!GS.hugUnlocked && GS.anger < 40) {
    GS.hugUnlocked = true;
    setTimeout(() => uiShowDialogue('🤗 Hug button unlocked! Feel it.', 3000), 400);
  }
  uiShowDialogue(getDialogue({ apologized: true }), 2800);
  uiUnlockAchievement('sorry_pressed');
  fxFloatEmoji(canvasW/2, canvasH*0.4, '🙏', { size: 2.5 });
  _checkPhaseChange();
  uiUpdate(GS);
  saveGame();
}

function doHug() {
  resumeCtx();
  sfxHug();
  charReact('hug');
  GS.anger  = Math.max(0,   GS.anger - 40);
  GS.love   = Math.min(100, GS.love  + 35);
  GS.combo  = 0;

  if (GS.particles) {
    fxHeartBurst(canvasW/2, canvasH*0.45, 22);
    fxShake(2, 200);
  }
  uiShowDialogue(getDialogue({ hugged: true }), 4000);
  uiUnlockAchievement('hug_given');
  if (GS.anger === 0) charReact('forgiven');

  // Secret ending trigger
  if (!GS.secretEndingShown && GS.totalHits >= 60) {
    GS.secretEndingShown = true;
    setTimeout(() => _showSecretEnding(), 3500);
  }

  // Heart eye achievement
  uiUnlockAchievement('heart_eyes');

  _checkPhaseChange();
  uiUpdate(GS);
  saveGame();

  sfxAchievement();
}

// ── Phase logic ────────────────────────────────────────────

function _checkPhaseChange() {
  const oldPhase = GS.phase;

  if (GS.love >= 70 && GS.anger < 30) {
    GS.phase = 'wholesome';
  } else if (GS.anger >= 65 || GS.totalHits >= 50) {
    GS.phase = 'emotional';
  } else if (GS.anger >= 30 || GS.totalHits >= 20) {
    GS.phase = 'chaotic';
  } else {
    GS.phase = 'normal';
  }

  if (GS.phase !== oldPhase) {
    setMusicPhase(GS.phase);
    uiPhaseTransition(GS.phase);

    // Rain when emotional
    if (GS.phase === 'emotional') {
      fxSetRain(true);
      uiUnlockAchievement('rain_maker');
    } else {
      fxSetRain(false);
    }
  }

  if (GS.anger >= 99) uiUnlockAchievement('max_rage');
}

// ── Achievement checks ────────────────────────────────────

function _checkHitAchievements() {
  if (GS.totalHits === 1)  { uiUnlockAchievement('first_hit'); sfxAchievement(); }
  if (GS.combo === 5)      { uiUnlockAchievement('combo_5');   sfxAchievement(); }
  if (GS.combo === 10)     { uiUnlockAchievement('combo_10');  sfxAchievement(); }
  if (GS.combo === 20)     { uiUnlockAchievement('combo_20');  sfxAchievement(); }
  if (GS.totalHits === 25) { uiUnlockAchievement('hits_25');   sfxAchievement(); }
  if (GS.totalHits === 50) { uiUnlockAchievement('hits_50');   sfxAchievement(); }
  if (GS.totalHits === 100){ uiUnlockAchievement('hits_100');  sfxAchievement(); }
}

// ── Projectile animation (DOM) — fires onImpact callback when it arrives ──

function _spawnProjectile(targetX, targetY, onImpact) {
  const emoji  = THROWABLES[Math.floor(Math.random() * THROWABLES.length)];
  const el     = document.createElement('div');
  el.className = 'projectile';
  el.textContent = emoji;

  // Start from a random screen edge (left or right)
  const fromLeft = Math.random() < 0.5;
  const startX   = fromLeft ? -60 : canvasW + 60;
  const startY   = canvasH * 0.25 + Math.random() * canvasH * 0.30;

  const endX = targetX - startX;
  const endY = targetY - startY;
  const dur  = 0.32 + Math.random() * 0.14; // fast enough to feel snappy

  el.style.left = startX + 'px';
  el.style.top  = startY + 'px';
  el.style.setProperty('--ex', endX + 'px');
  el.style.setProperty('--ey', endY + 'px');
  el.style.setProperty('--fly-dur', dur + 's');

  canvasWrap.appendChild(el);

  // On arrival: remove projectile, spawn impact burst, call callback
  setTimeout(() => {
    el.remove();
    // DOM impact flash at the character position
    _spawnImpactFlash(targetX, targetY, emoji);
    if (onImpact) onImpact();
  }, dur * 1000);
}

function _spawnImpactFlash(x, y, emoji) {
  // Brief "splat" element that scales up then fades
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute; left:${x}px; top:${y}px;
    transform:translate(-50%,-50%) scale(0.2);
    font-size:2.4rem; pointer-events:none; z-index:35;
    transition: transform 0.12s ease-out, opacity 0.18s ease 0.12s;
  `;
  el.textContent = emoji;
  canvasWrap.appendChild(el);
  // Trigger scale-up in next frame
  requestAnimationFrame(() => {
    el.style.transform = 'translate(-50%,-50%) scale(1.6) rotate(20deg)';
    el.style.opacity   = '0';
  });
  setTimeout(() => el.remove(), 400);
}

// ── Secret ending ─────────────────────────────────────────

function _showSecretEnding() {
  uiShowSecretEnding(GS);
  sfxHug();
  uiUnlockAchievement('secret_ending');
  sfxAchievement();

  // Draw a love face on the ending canvas
  const ec = document.getElementById('ending-canvas');
  if (ec) {
    const s = Math.min(window.innerWidth * 0.45, 200);
    ec.width = s; ec.height = s;
    const ectx = ec.getContext('2d');
    ectx.fillStyle = '#1A0A30';
    ectx.fillRect(0, 0, s, s);
    ectx.font = `${s*0.55}px serif`;
    ectx.textAlign = 'center';
    ectx.textBaseline = 'middle';
    ectx.fillText('💝', s/2, s/2);
  }
  saveGame();
}

// ══════════════════════════════════════════════════════════
//  SAVE / LOAD
// ══════════════════════════════════════════════════════════

function saveGame() {
  try {
    const data = {
      anger:    GS.anger,
      love:     GS.love,
      totalHits:GS.totalHits,
      maxCombo: GS.maxCombo,
      score:    GS.score,
      phase:    GS.phase,
      sorryUnlocked: GS.sorryUnlocked,
      hugUnlocked:   GS.hugUnlocked,
      secretEndingShown: GS.secretEndingShown,
      musicEnabled: GS.musicEnabled,
      sfxEnabled:   GS.sfxEnabled,
      darkMode:     GS.darkMode,
      particles:    GS.particles,
      unlocked:     uiGetUnlocked(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch(_) {}
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    GS.anger    = d.anger    ?? 0;
    GS.love     = d.love     ?? 100;
    GS.totalHits= d.totalHits ?? 0;
    GS.maxCombo = d.maxCombo  ?? 0;
    GS.score    = d.score     ?? 0;
    GS.phase    = d.phase     ?? 'normal';
    GS.sorryUnlocked = d.sorryUnlocked ?? false;
    GS.hugUnlocked   = d.hugUnlocked   ?? false;
    GS.secretEndingShown = d.secretEndingShown ?? false;
    GS.musicEnabled = d.musicEnabled ?? true;
    GS.sfxEnabled   = d.sfxEnabled   ?? true;
    GS.darkMode     = d.darkMode     ?? true;
    GS.particles    = d.particles    ?? true;
    if (Array.isArray(d.unlocked)) uiLoadUnlocked(d.unlocked);
  } catch(_) {}
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  Object.assign(GS, {
    anger:0, love:100, totalHits:0, combo:0, maxCombo:0, score:0,
    phase:'normal', sorryUnlocked:false, hugUnlocked:false,
    secretEndingShown:false, lastHitTime:0,
  });
  charReset();
  fxSetRain(false);
  setMusicPhase('normal');
  uiLoadUnlocked([]);
  document.getElementById('btn-sorry')?.classList.add('hidden');
  document.getElementById('btn-hug')?.classList.add('hidden');
  document.getElementById('secret-ending')?.classList.add('hidden');
  uiUpdate(GS);
  uiShowDialogue('Reset complete. Round 2? 😤', 2500);
}

// ══════════════════════════════════════════════════════════
//  GAME LOOP
// ══════════════════════════════════════════════════════════

let _lastFrame = 0;

function gameLoop(ts) {
  const dt = Math.min(ts - _lastFrame, 80);
  _lastFrame = ts;

  // Combo timeout
  if (GS.combo > 0 && Date.now() - GS.lastHitTime > GS.comboTimeout) {
    GS.combo = 0;
    uiUpdate(GS);
  }

  // Update modules
  fxUpdate(dt);
  charUpdate(dt, pointerX, pointerY);

  // Clear main canvas
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Draw background stars
  fxBgDraw();

  // Draw particles (behind character)
  fxDraw(ctx);

  // Draw character
  const shake = fxGetShake();
  charDraw(ctx, shake.x, shake.y);

  // Draw rain
  fxDrawRain();

  requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════════════════════
//  LOADING SCREEN
// ══════════════════════════════════════════════════════════

function runLoadingScreen(onDone) {
  const fill    = document.getElementById('loading-bar-fill');
  const pct     = document.getElementById('loading-percent');
  const tips    = [
    'tip: combo hits for extra drama 💥',
    'tip: sorry button appears at high rage 🙏',
    'tip: keep going... there\'s a secret ending 💝',
    'tip: poke, slap, or throw to interact',
    'tip: hug button unlocks the wholesome arc 🤗',
  ];
  const tipEl = document.getElementById('loading-tip');

  let p = 0;
  const interval = setInterval(() => {
    p += 1.8 + Math.random() * 2.5;
    if (p >= 100) p = 100;
    fill.style.width = p + '%';
    pct.textContent  = Math.round(p) + '%';
    if (p < 100 && Math.random() < 0.08) {
      tipEl.textContent = tips[Math.floor(Math.random()*tips.length)];
    }
    if (p >= 100) {
      clearInterval(interval);
      setTimeout(onDone, 300);
    }
  }, 40);
}

// ══════════════════════════════════════════════════════════
//  SETTINGS WIRING
// ══════════════════════════════════════════════════════════

function applySettings() {
  const gc = document.getElementById('game-container');
  gc.classList.toggle('dark-mode',  GS.darkMode);
  gc.classList.toggle('light-mode', !GS.darkMode);

  uiSetToggle('tog-music',     GS.musicEnabled);
  uiSetToggle('tog-sfx',       GS.sfxEnabled);
  uiSetToggle('tog-dark',      GS.darkMode);
  uiSetToggle('tog-particles', GS.particles);

  setMusicEnabled(GS.musicEnabled);
  setSfxEnabled(GS.sfxEnabled);
}

function bindSettings() {
  uiBindSettings({
    music:     v => { GS.musicEnabled = v; setMusicEnabled(v); saveGame(); },
    sfx:       v => { GS.sfxEnabled   = v; setSfxEnabled(v);   saveGame(); },
    dark:      v => {
      GS.darkMode = v;
      const gc = document.getElementById('game-container');
      gc.classList.toggle('dark-mode',  v);
      gc.classList.toggle('light-mode', !v);
      saveGame();
    },
    particles: v => { GS.particles = v; saveGame(); },
    reset:     () => resetGame(),
  });
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════

function init() {
  setupCanvas();
  loadGame();
  applySettings();

  // Init modules (logical pixel dimensions, not physical DPR-scaled)
  charInit(canvasW, canvasH);
  fxInit(bgCanvas, floatLayer, canvasW, canvasH);
  fxSetRainCanvas(rainCanvas);
  uiInit();
  bindInputs();
  bindSettings();

  // Restore phase music + rain
  setMusicPhase(GS.phase);
  if (GS.phase === 'emotional') fxSetRain(true);

  uiUpdate(GS);

  // Opening dialogue
  const openings = [
    'tap me if you dare… 😏',
    'hello there 😊 don\'t hold back',
    'i\'m ready for whatever 🙂',
    'try the combo hits ⚡',
  ];
  setTimeout(() => uiShowDialogue(openings[Math.floor(Math.random()*openings.length)], 3000), 400);

  // Start game loop
  requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════

const loadingScreen = document.getElementById('loading-screen');
const gameContainer = document.getElementById('game-container');

runLoadingScreen(() => {
  loadingScreen.classList.add('fade-out');
  gameContainer.classList.remove('hidden');

  // Defer init so layout is fully rendered
  requestAnimationFrame(() => {
    init();
    // Start music on first real interaction
    const startOnTouch = () => {
      resumeCtx();
      if (GS.musicEnabled) startMusic();
      document.removeEventListener('pointerdown', startOnTouch);
    };
    document.addEventListener('pointerdown', startOnTouch, { once: true });
  });
});
