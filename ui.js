/* ════════════════════════════════════════════════════════════
   ui.js — Dialogue (130+ lines), achievements, phase text,
           meter updates, toast notifications
   Exports: uiInit, uiUpdate, uiShowDialogue,
            uiUnlockAchievement, getDialogue, ACHIEVEMENTS
   ════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════════
//  DIALOGUE DATABASE  (130+ funny / emotional lines)
// ══════════════════════════════════════════════════════════

const D = {
  // Normal phase – light & funny
  normal: [
    "okay fine, that was deserved 😔",
    "ow. noted.",
    "violence detected 🚨",
    "was that necessary though",
    "i felt that in my soul",
    "respectfully... ow",
    "my therapist warned me about this",
    "that hit different 😳",
    "okay i'm not even mad",
    "bold move bestie",
    "error 404: dignity not found",
    "rebooting emotional system…",
    "this is fine 🙂🔥",
    "i will remember this",
    "mental note: stand further away",
    "new phone, who dis",
    "sending love and pain tolerance",
    "that one was free",
    "patching relationship bugs…",
    "filing an incident report rn",
    "buffering.. buffering..",
    "ah yes, stress relief simulator",
    "at least you're paying attention",
    "i still love you btw 🥺",
    "this is my villain origin story",
  ],

  // Poke-specific
  poke: [
    "hey! stop poking me 😤",
    "i'm not a button",
    "that tickled actually",
    "do i look like a boba ball to you",
    "👆 stop that",
    "poke me one more time i dare you",
    "poking: the language of emotional unavailability",
    "i'm not a touch screen",
    "are you done yet?",
    "...you're kind of cute when you poke me",
  ],

  // Slap-specific
  slap: [
    "WOW okay 😲",
    "she slapped. she snapped.",
    "emotional damage: critical",
    "that was a lot.",
    "my ancestors felt that",
    "i am sorry!!!!",
    "was i talking too much? fair.",
    "that slap had lore",
    "calling HR immediately",
    "alright, i deserved that one",
    "babe that was my good side",
    "okay you're actually kind of scary",
    "slapped into another dimension momentarily",
  ],

  // Throw-specific
  throw: [
    "did you just throw something at me",
    "the audacity 😭",
    "okay what did i do THIS time",
    "that wasn't even on the menu",
    "ballistic damage detected",
    "rude. effective, but rude.",
    "object thrown. feelings: hurt.",
    "is this a new love language??",
    "i'm filing a police report",
    "that hit like the truth",
  ],

  // Chaotic phase
  chaotic: [
    "okay at this point you're just showing off",
    "combo attack is CRAZY right now",
    "you woke up and chose chaos",
    "this is giving final boss energy",
    "i'm running out of health points",
    "my recovery arc just went offline",
    "damage report: everything",
    "you have RANGE girl",
    "this level of dedication is impressive",
    "starting to question our relationship ngl",
    "i am become damage",
    "sir this is a Wendy's",
    "at what point do we hug it out",
    "trauma speedrun any%",
    "plot twist: i'm enjoying this",
    "are you okay? genuinely asking",
    "combo counter broke btw",
    "you're in your villain arc and it's working",
    "the hits just keep coming. literally.",
    "my dignity has left the building",
    "i'm like 70% damage right now",
    "health bar found dead",
    "sending my last working brain cell",
    "this is giving angry bird energy",
    "save some hits for next time babe",
  ],

  // High combo
  combo: [
    "COMBO x{n}?? hello?? 😭",
    "combo {n} that's illegal",
    "she's building towards something",
    "the rhythm… she's got it",
    "this isn't even my final form",
    "x{n} combo detected. impressive. terrifying.",
    "consecutive hits. this is intentional.",
    "{n} hits in a row?? i'm literally just standing here",
    "combo {n}: she found her passion",
    "please take a breath between combos",
  ],

  // Emotional phase
  emotional: [
    "okay this is getting a little personal",
    "i'm not crying you're crying 😭",
    "did i do something wrong",
    "i keep taking the hits because i care",
    "this is fine. i'm fine.",
    "at some point the pain becomes symbolic",
    "i just want you to be happy",
    "still here btw. still yours.",
    "the hits hurt less than your silence would",
    "okay maybe i deserved SOME of them",
    "i would take a thousand more if you needed it",
    "you know you can just talk to me right",
    "i'm still smiling because you're here",
    "it's okay. i know you're stressed.",
    "i see you. i hear you. i'm still here.",
  ],

  // Sorry button pressed
  apologize: [
    "wait… really? 🥺",
    "you don't have to apologize but i'm glad you did",
    "it's okay. actually. it's okay.",
    "all is forgiven. immediately.",
    "this is the hug update loading…",
    "apology received, processing feelings…",
    "oh no you're making me happy again",
    "i literally cannot stay mad at you",
    "forgiveness.exe running…",
    "the sorry button unlocked something in me",
  ],

  // Hug
  hug: [
    "oh 🥺🥺🥺",
    "i missed this",
    "you came back 💖",
    "this is all i ever wanted tbh",
    "...this makes everything worth it",
    "charging love meter… 100%",
    "heart: healing detected",
    "warmth restored",
    "okay i forgive everything",
    "stay like this forever please",
    "this is the content i signed up for",
    "you hugged the damage away 🥹",
    "emotional damage fully reversed",
    "relationship status: fixed",
    "that was the update i needed",
  ],

  // Very low love (critical)
  critical: [
    "it's getting quiet in here 💔",
    "love meter is… not great",
    "are we okay?",
    "i'm still here if you need me",
    "this is the part where i don't leave",
    "running on love fumes rn",
    "critical love warning issued",
    "please hit the sorry button. or don't. i'll survive.",
  ],

  // Wholesome / ending phase
  wholesome: [
    "we survived the chaos arc 💕",
    "look at us, all healed up",
    "relationship: restored + upgraded",
    "i never stopped loving you btw",
    "wholesome mode activated ✨",
    "the ending we deserved",
    "you can still hit me if you want. lovingly.",
    "i'm so glad you stayed",
    "we went through a lot, huh",
  ],

  // Random surprise lines (any phase)
  surprise: [
    "brb updating my will",
    "doctors will be confused",
    "sending this to my support group",
    "okay but your timing is immaculate",
    "hug update available — install now?",
    "i said sorry in my head. does that count?",
    "your emotional range is chef's kiss",
    "this would be a great TikTok honestly",
    "i'm going to frame this in our future home",
    "no notes. well. one note. maybe stop.",
    "you really committed to this today",
    "my reaction time is getting slower btw",
    "mom said dinner's ready",
    "brb writing a song about this",
    "okay this one hit different AND the same",
  ],
};

// Flattened for random access
const ALL_LINES = [...D.normal, ...D.chaotic, ...D.surprise];

export function getDialogue(context = {}) {
  const { phase, action, combo, lowLove, apologized, hugged } = context;

  if (hugged)     return _pick(D.hug);
  if (apologized) return _pick(D.apologize);
  if (lowLove)    return _pick(D.critical);

  if (phase === 'wholesome') return _pick(D.wholesome);
  if (phase === 'emotional') return _pick([...D.emotional, ...D.normal]);

  if (combo && combo >= 5) {
    const line = _pick(D.combo).replace(/\{n\}/g, combo);
    return line;
  }

  if (action === 'poke')  return Math.random() < 0.55 ? _pick(D.poke)  : _pick(D.normal);
  if (action === 'slap')  return Math.random() < 0.55 ? _pick(D.slap)  : _pick(D.chaotic);
  if (action === 'throw') return Math.random() < 0.55 ? _pick(D.throw) : _pick(D.chaotic);

  if (phase === 'chaotic') return _pick([...D.chaotic, ...D.surprise]);
  return _pick(ALL_LINES);
}

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ══════════════════════════════════════════════════════════
//  ACHIEVEMENTS
// ══════════════════════════════════════════════════════════

export const ACHIEVEMENTS = {
  first_hit:      { icon:'👊', title:'First Strike',        desc:'Land your first hit',         hidden: false },
  combo_5:        { icon:'⚡', title:'Combo Starter',       desc:'Reach a 5x combo',            hidden: false },
  combo_10:       { icon:'🔥', title:'On Fire',             desc:'Reach a 10x combo',           hidden: false },
  combo_20:       { icon:'💫', title:'Unstoppable',         desc:'Reach a 20x combo',           hidden: false },
  hits_25:        { icon:'💥', title:'Stress Warrior',      desc:'Land 25 hits total',          hidden: false },
  hits_50:        { icon:'🎯', title:'Chaos Agent',         desc:'Land 50 hits total',          hidden: false },
  hits_100:       { icon:'🌀', title:'Legend',              desc:'Land 100 hits total',         hidden: false },
  sorry_pressed:  { icon:'🙏', title:'The Apologizer',      desc:'Press the sorry button',      hidden: false },
  hug_given:      { icon:'🤗', title:'Softie',              desc:'Give a hug',                  hidden: false },
  secret_ending:  { icon:'💖', title:'True Love',           desc:'Unlock the secret ending',    hidden: true  },
  rain_maker:     { icon:'🌧️', title:'Rain Maker',          desc:'Trigger rain mode',           hidden: true  },
  dramatic_fall:  { icon:'🎭', title:'Drama King',          desc:'Trigger a dramatic fall',     hidden: true  },
  heart_eyes:     { icon:'😍', title:'Love Struck',         desc:'Make him get heart eyes',     hidden: true  },
  max_rage:       { icon:'😤', title:'FULL RAGE',           desc:'Max out the rage meter',      hidden: true  },
  forgiven_fast:  { icon:'⚡', title:'Speed Forgiver',      desc:'Forgive within 30 seconds',   hidden: true  },
};

// ══════════════════════════════════════════════════════════
//  PHASES
// ══════════════════════════════════════════════════════════

const PHASES = {
  normal:    { label:'Normal 😊',    badge:'Normal',    music:'normal' },
  chaotic:   { label:'Chaotic 🔥',   badge:'CHAOTIC',   music:'chaotic' },
  emotional: { label:'Emotional 💔', badge:'Emotional', music:'emotional' },
  wholesome: { label:'Wholesome 💖', badge:'Wholesome', music:'wholesome' },
};

// ══════════════════════════════════════════════════════════
//  DOM ELEMENT CACHE
// ══════════════════════════════════════════════════════════

let _els = {};

export function uiInit() {
  _els = {
    angerFill:  document.getElementById('anger-fill'),
    angerVal:   document.getElementById('anger-val'),
    loveFill:   document.getElementById('love-fill'),
    loveVal:    document.getElementById('love-val'),
    moodFill:   document.getElementById('mood-fill'),
    moodEmoji:  document.getElementById('mood-emoji'),
    phaseBadge: document.getElementById('phase-badge'),
    comboDisp:  document.getElementById('combo-display'),
    comboNum:   document.getElementById('combo-num'),
    dialogBox:  document.getElementById('dialogue-box'),
    dialogTxt:  document.getElementById('dialogue-text'),
    statHits:   document.getElementById('stat-hits'),
    statCombo:  document.getElementById('stat-combo'),
    statScore:  document.getElementById('stat-score'),
    btnSorry:   document.getElementById('btn-sorry'),
    btnHug:     document.getElementById('btn-hug'),
    achToast:   document.getElementById('achievement-toast'),
    achIcon:    document.getElementById('ach-icon'),
    achTitle:   document.getElementById('ach-title'),
    achDesc:    document.getElementById('ach-desc'),
    gc:         document.getElementById('game-container'),
    endingEl:   document.getElementById('secret-ending'),
    endingMsg:  document.getElementById('ending-msg'),
    settingsTog:document.getElementById('settings-toggle'),
    settingsPanel:document.getElementById('settings-panel'),
    togMusic:   document.getElementById('tog-music'),
    togSfx:     document.getElementById('tog-sfx'),
    togDark:    document.getElementById('tog-dark'),
    togParticles:document.getElementById('tog-particles'),
    btnReset:   document.getElementById('btn-reset'),
    rainOverlay:document.getElementById('rain-overlay'),
    bgGradient: document.querySelector('.bg-gradient'),
  };
}

/** Update all UI from game state GS */
export function uiUpdate(GS) {
  if (!_els.angerFill) return;

  // Meters
  _els.angerFill.style.width = GS.anger + '%';
  _els.angerVal.textContent  = Math.round(GS.anger);
  _els.loveFill.style.width  = GS.love  + '%';
  _els.loveVal.textContent   = Math.round(GS.love);

  const mood = clamp(GS.love - GS.anger * 0.5, 0, 100);
  _els.moodFill.style.width = mood + '%';
  _els.moodEmoji.textContent = _moodEmoji(mood);

  // Stats
  _els.statHits.textContent  = GS.totalHits;
  _els.statCombo.textContent = GS.maxCombo;
  _els.statScore.textContent = GS.score;

  // Phase badge
  const p = PHASES[GS.phase] || PHASES.normal;
  _els.phaseBadge.textContent = p.badge;

  // Combo
  if (GS.combo >= 3) {
    _els.comboDisp.classList.remove('hidden');
    _els.comboNum.textContent = GS.combo;
  } else {
    _els.comboDisp.classList.add('hidden');
  }

  // Unlock sorry / hug buttons
  if (GS.sorryUnlocked) _els.btnSorry.classList.remove('hidden');
  if (GS.hugUnlocked)   _els.btnHug.classList.remove('hidden');

  // Phase class on container
  _els.gc.classList.toggle('phase-chaotic',   GS.phase === 'chaotic');
  _els.gc.classList.toggle('phase-emotional', GS.phase === 'emotional');
  _els.gc.classList.toggle('phase-wholesome', GS.phase === 'wholesome');
}

function _moodEmoji(mood) {
  if (mood >= 80) return '😄';
  if (mood >= 60) return '😊';
  if (mood >= 40) return '😐';
  if (mood >= 20) return '😟';
  return '😢';
}

function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

// ── Dialogue ─────────────────────────────────────────────

let _dialogTimer = null;

export function uiShowDialogue(text, duration = 2800) {
  if (!_els.dialogBox) return;
  _els.dialogTxt.textContent = text;
  _els.dialogBox.classList.remove('hidden');
  clearTimeout(_dialogTimer);
  _dialogTimer = setTimeout(() => {
    _els.dialogBox.classList.add('hidden');
  }, duration);
}

// ── Achievements ─────────────────────────────────────────

let _unlockedSet = new Set();

export function uiLoadUnlocked(arr) {
  _unlockedSet = new Set(arr);
}

export function uiGetUnlocked() { return [..._unlockedSet]; }

export function uiUnlockAchievement(id) {
  if (_unlockedSet.has(id)) return false;
  const ach = ACHIEVEMENTS[id];
  if (!ach) return false;
  _unlockedSet.add(id);
  _showAchToast(ach);
  return true;
}

let _toastTimer = null;
function _showAchToast(ach) {
  if (!_els.achToast) return;
  _els.achIcon.textContent  = ach.icon;
  _els.achTitle.textContent = 'Achievement Unlocked!';
  _els.achDesc.textContent  = ach.title + ' — ' + ach.desc;
  _els.achToast.classList.remove('hidden', 'hiding');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    _els.achToast.classList.add('hiding');
    setTimeout(() => _els.achToast.classList.add('hidden'), 400);
  }, 3200);
}

// ── Settings panel toggle ────────────────────────────────

export function uiBindSettings(callbacks) {
  if (!_els.settingsTog) return;

  _els.settingsTog.addEventListener('click', () => {
    _els.settingsPanel.classList.toggle('hidden');
  });

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!_els.settingsPanel.contains(e.target) &&
        e.target !== _els.settingsTog) {
      _els.settingsPanel.classList.add('hidden');
    }
  });

  _bindToggle('tog-music',    v => callbacks.music(v));
  _bindToggle('tog-sfx',      v => callbacks.sfx(v));
  _bindToggle('tog-dark',     v => callbacks.dark(v));
  _bindToggle('tog-particles',v => callbacks.particles(v));

  if (_els.btnReset) {
    _els.btnReset.addEventListener('click', () => {
      if (confirm('Reset all progress?')) callbacks.reset();
    });
  }
}

function _bindToggle(id, cb) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const active = btn.classList.toggle('active');
    btn.textContent = active ? 'ON' : 'OFF';
    cb(active);
  });
}

export function uiSetToggle(id, value) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.classList.toggle('active', value);
  btn.textContent = value ? 'ON' : 'OFF';
}

// ── Secret ending ────────────────────────────────────────

const ENDING_MESSAGES = [
  "no matter how many times you hit me, my love for you doesn't decrease. it just makes the hugs mean more. 💝",
  "i was always going to stay. every hit, every combo, every dramatic fall — still here, still yours. 🥹",
  "you stressed, i took it, and we made it to the other side. that's what love looks like sometimes. 💖",
  "the rage meter hit 100 but the love meter never hit zero. think about that. 🌸",
  "thanks for playing. and more importantly — thanks for staying. 💕",
];

export function uiShowSecretEnding(GS) {
  if (!_els.endingEl) return;
  const msg = ENDING_MESSAGES[Math.floor(Math.random() * ENDING_MESSAGES.length)];
  _els.endingMsg.textContent = msg;
  _els.endingEl.classList.remove('hidden');

  // Spawn floating hearts in ending layer
  const layer = document.getElementById('ending-hearts-layer');
  if (layer) {
    layer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const h = document.createElement('div');
      h.className = 'ending-float-heart';
      h.textContent = ['💕','💖','💗','💝','✨'][Math.floor(Math.random()*5)];
      h.style.left = Math.random()*100 + '%';
      h.style.setProperty('--dur', (3 + Math.random()*4) + 's');
      h.style.animationDelay = (Math.random()*3) + 's';
      layer.appendChild(h);
    }
  }

  // Draw character on ending canvas
  const ec = document.getElementById('ending-canvas');
  if (ec) {
    const s = Math.min(window.innerWidth*0.45, 200);
    ec.width = s; ec.height = s;
    // (character will be redrawn by main.js)
  }
}

// ── Phase transition flash ────────────────────────────────

export function uiPhaseTransition(phase) {
  const messages = {
    chaotic:   'CHAOS MODE ACTIVATED 🔥',
    emotional: 'Emotional Chapter... 💔',
    wholesome: 'True Ending Unlocked 💖',
  };
  const msg = messages[phase];
  if (msg) uiShowDialogue(msg, 3500);
}
