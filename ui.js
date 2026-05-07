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
  // Normal phase — he knows he was wrong, so he just takes it
  normal: [
    "haan, theek hai. deserved tha 😔",
    "ow. noted.",
    "okay fine, maar le",
    "sahi hai, kya bolun",
    "arre yaar... ho gaya",
    "meri hi galti thi, I know",
    "that hit different 😳",
    "chup hoon kyunki I deserve this",
    "kya karein, sahi hai",
    "acha theek hai, bol de dil ko",
    "error 404: dignity not found",
    "relationship bugs patching… please wait",
    "this is fine 🙂🔥",
    "haan main hi galat tha, hundred percent",
    "mental note: next time don't be an idiot",
    "sorry na yaar, sach mein",
    "samjha, galti meri thi",
    "sending love and pain tolerance",
    "theek hai, ek aur",
    "bhai, I'm just standing here accepting this",
    "buffering apology… 40%",
    "at least you're paying attention to me 😅",
    "i still love you btw 🥺",
    "this is my villain origin story… no wait I'm the villain",
    "acha hua, I needed this reality check",
  ],

  // Poke-specific Hinglish
  poke: [
    "arre yaar, kya kar rahi hai 😤",
    "i'm not a button, I'm a person",
    "that tickled actually — aur maar",
    "main boba ball nahi hoon",
    "👆 ruk ja ek second",
    "poke me one more time, I dare you",
    "poking = meri galti yaad dilana",
    "touch screen nahi hoon main",
    "ho gaya? ya aur baaki hai?",
    "...cute lagti hai jab poking karti hai 🥺",
    "samjha, samjha — sorry",
    "theek hai yaar, de le ek aur",
  ],

  // Slap-specific Hinglish
  slap: [
    "WOW okay 😲 — haan, sahi hai",
    "bhai itna zor se?? meri galti thi na",
    "emotional damage: critical. deserved.",
    "that was a lot. theek hai.",
    "mere dada dadi ne bhi feel kiya ye",
    "main sorry bol raha hoon na!",
    "zyada baat karta tha kya? fair point",
    "us slap mein bahut kuch tha",
    "HR call kar raha hoon 😭",
    "sahi hai, I earned this one",
    "babe that was my good cheek",
    "okay tu actually thodi scary hai",
    "teen second ke liye doosri dimension mein gaya tha",
    "galti meri, slap teri — fair deal",
    "dekh, I know I messed up. maar le.",
  ],

  // Throw-specific Hinglish
  throw: [
    "yaar tune kuch phenka mujhpe??",
    "audacity 😭 full level",
    "is baar kya kiya maine?",
    "ye toh menu mein nahi tha",
    "ballistic damage detected. noted.",
    "rude. but effective. aur sahi bhi.",
    "cheez phenko, feelings hurt karo — classic",
    "ye naya love language hai kya",
    "FIR darj kara raha hoon",
    "that hit like the truth, literally",
    "seedha laga yaar 😭",
    "okay okay — galti meri hai, maafi",
  ],

  // Chaotic phase Hinglish
  chaotic: [
    "okay at this point tu sirf show off kar rahi hai",
    "combo attack is CRAZY right now yaar 😭",
    "uth ke chaos choose kiya aaj",
    "final boss energy aa gayi tujhme",
    "health points khatam ho rahe hain",
    "mera recovery arc offline ho gaya",
    "damage report: sab kuch",
    "tu itni dangerous kyun hai yaar",
    "dedication impressive hai, main impressed hoon",
    "relationship pe seriously sawaal uthne lage 😂",
    "I have become damage",
    "yaar ye to seedha dil pe laga",
    "hug karein? kab?",
    "trauma speedrun any% 🏃",
    "plot twist: mujhe accha lag raha hai",
    "tu theek toh hai na? genuinely puch raha hoon",
    "combo counter toot gaya",
    "teri villain arc chal rahi hai aur teri hai",
    "hits ruk hi nahi rahe. literally.",
    "meri izzat building chhod ke chali gayi",
    "main 70% damage pe hoon abhi",
    "health bar wali izzat gayi",
    "last brain cell bhej raha hoon",
    "angry birds wali energy aa gayi",
    "thodi hits bacha ke rakh next time ke liye",
  ],

  // High combo Hinglish
  combo: [
    "COMBO x{n}?? yaar hello?? 😭",
    "combo {n} — ye illegal hai",
    "kuch build kar rahi hai ye",
    "rhythm aa gayi isko",
    "abhi to ye meri final form bhi nahi",
    "x{n} combo detected. impressive. terrifying.",
    "consecutive hits. ye intentional hai.",
    "{n} baar ek ke baad ek?? main toh bas khada hoon",
    "combo {n}: isko apna passion mil gaya",
    "bhai ek baar breath le combo ke beech",
    "x{n}?? teri andar ka anger kaafi deep hai",
  ],

  // Emotional phase — he genuinely reflects
  emotional: [
    "okay ye thoda personal ho gaya",
    "main nahi ro raha — tu ro rahi hai 😭",
    "kuch kiya tha maine? haan. sorry.",
    "main hits isliye leta hoon kyunki teri parwaah karta hoon",
    "this is fine. main fine hoon. 🙂",
    "pain kabhi kabhi symbolic hota hai",
    "bas teri khushi chahiye mujhe",
    "still here. still yours. hamesha.",
    "teri chup se zyada dard nahi deta ye",
    "haan, main hi galat tha. almost sab baar.",
    "hazaar maar le agar tujhe accha lage",
    "tu baat kar sakti hai mujhse na, yaar",
    "main isliye muskura raha hoon ki tu yahan hai",
    "pata hai tune kitna hurt feel kiya. sorry yaar.",
    "I see you. I hear you. abhi bhi yahan hoon.",
    "tujhe pata hai na, main kuch bhi karunga tere liye",
    "teri naraazgi samajh aati hai mujhe",
  ],

  // Sorry button pressed
  apologize: [
    "ruk... sach mein? 🥺",
    "sorry bolne ki zarurat nahi thi, par thanks",
    "theek hai. actually theek hai.",
    "maafi mil gayi. abhi. turant.",
    "hug update loading ho raha hai…",
    "apology received, feelings process ho rahi hain…",
    "oh no tu mujhe khush kar rahi hai dobara",
    "main tujhse naraaz nahi reh sakta literally",
    "forgiveness.exe chal raha hai…",
    "sorry button ne kuch unlock kar diya andar",
    "nahi karna tha sorry, phir bhi — dil bhar aaya",
    "itni jaldi maafi — tu bhi toh pyaar karti hai na 🥺",
  ],

  // Hug Hinglish
  hug: [
    "oh 🥺🥺🥺",
    "yaar miss kiya tha ye",
    "aa gayi wapas 💖",
    "bas yahi chahiye tha mujhe, sach mein",
    "...sab kuch worth it ho gaya",
    "love meter charging… 100%",
    "dil theek ho gaya",
    "warmth wapas aa gayi",
    "sab maaf. abhi. bina soche.",
    "aise hi reh please, mat ja",
    "ye wali feeling ke liye sign up kiya tha maine",
    "tune hug karke saara dard bhaga diya 🥹",
    "emotional damage: reversed",
    "relationship status: fixed ✅",
    "ye update chahiye tha mujhe",
    "I love you yaar. sach mein.",
  ],

  // Very low love — he's worried, not angry
  critical: [
    "bahut shant ho gayi hai yahan 💔",
    "love meter… not great yaar",
    "hum theek toh hain na?",
    "abhi bhi yahan hoon agar chahiye",
    "ye woh part hai jab main nahi jaata",
    "love ke fumes pe chal raha hoon abhi",
    "critical warning. main still here hoon.",
    "sorry button dabaao. ya mat dabao. survive karunga.",
    "tujhe khona nahi chahta yaar",
    "galti meri thi. I know. I know.",
  ],

  // Wholesome ending phase
  wholesome: [
    "chaos arc survive kar li humne 💕",
    "dekh, sab theek ho gaya",
    "relationship: restored + upgraded",
    "maine kab bola ki pyaar band kar liya",
    "wholesome mode activated ✨",
    "ye wala ending deserve karte the hum dono",
    "maar le chahein toh, pyaar se",
    "bahut khushi hui ki tu ruki",
    "bahut kuch guzra, huh",
    "tere saath rehna chahta hoon, hamesha",
    "I love you. that's it. that's the tweet.",
  ],

  // Surprise lines — Hinglish mix
  surprise: [
    "brb will update kar raha hoon",
    "doctors confused honge",
    "support group ko forward kar raha hoon ye",
    "teri timing toh ekdum perfect hai",
    "hug update available — install now?",
    "sorry bol liya tha apne mann mein. count hoga?",
    "tera emotional range chef's kiss hai",
    "ye ek great TikTok hoti yaar",
    "hamare ghar mein frame karunga ye moment",
    "koi notes nahi. well. ek — thoda ruk ja.",
    "tu committed hai aaj, I respect that",
    "meri reaction time slow ho rahi hai btw",
    "mummy ne khana bulaya hai",
    "brb iske baare mein ek song likh raha hoon",
    "okay this one hit different AND same",
    "yaar tu sach mein meri weakness hai 😭",
    "galat tha main. haan. officially.",
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
