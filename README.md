# 💝 Boyfriend Mode — Stress Relief Browser Game

> *A funny, emotional, interactive stress-relief game where you can tap, slap, poke, and throw things at your cute animated boyfriend — and watch him react with drama, tears, and undying affection.*

---

## 🎮 About

**Boyfriend Mode** is a wholesome chaos simulator. The character reacts to every poke, slap, and thrown object with animated expressions, funny dialogue, and escalating drama — but no matter how many hits he takes, he never stops caring.

The game has **four emotional chapters**:

| Chapter | Trigger | Vibe |
|---------|---------|------|
| 😊 Normal | Start | Funny & light |
| 🔥 Chaotic | 20+ hits / rage 30%+ | Manic energy |
| 💔 Emotional | 50+ hits / rage 65%+ | Genuinely touching |
| 💖 Wholesome | Hug after high rage | Healing arc |

---

## 🕹️ Controls

| Action | Mouse/Desktop | Mobile |
|--------|---------------|--------|
| **Poke** | Click Poke button or use active action | Tap button |
| **Slap** | Click Slap button | Tap button |
| **Throw** | Click Throw button | Tap button |
| **Sorry** | Click Sorry (unlocks at 45% rage) | Tap button |
| **Hug** | Click Hug (unlocks after apologizing) | Tap button |
| Direct hit | Click/tap the character on canvas | Tap character |

---

## ✨ Features

- **130+ unique dialogue lines** — context-aware, phase-dependent, combo-responsive
- **Animated Canvas character** — procedurally drawn with expressions, blinking, breathing, eye tracking, tears, heart eyes, and dramatic falls
- **Combo system** — chain hits within 2.4 seconds for bonus score and dialogue
- **Rage / Love / Mood meters** — meters evolve the game's emotional tone
- **15 achievements** — hidden and visible, with toast notifications
- **Particle effects** — hit bursts, floating hearts, star particles, screen shake
- **Projectile animations** — spoons, phones, books fly across screen on Throw
- **Rain mode** — automatically rains during the emotional chapter
- **Background music** — procedural lo-fi chords via Web Audio API (changes by phase)
- **Secret ending** — unlocks after 60+ hits + a hug (a genuine emotional moment)
- **Settings panel** — music, SFX, dark/light mode, particles toggle
- **Progress saved** — localStorage auto-save across sessions
- **No dependencies** — runs directly in browser, zero backend, zero files to download

---

## 🚀 Deploy to GitHub Pages

### Step 1 — Create a GitHub repository

```bash
git init
git add .
git commit -m "initial commit — Boyfriend Mode 💝"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/boyfriend-mode.git
git push -u origin main
```

### Step 2 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select `main` branch, `/ (root)` folder
4. Click **Save**

### Step 3 — Play!

Your game will be live at:
```
https://YOUR_USERNAME.github.io/boyfriend-mode/
```

> Changes pushed to `main` auto-deploy within ~60 seconds.

---

## 📁 File Structure

```
/
├── index.html      — Game HTML structure & loading screen
├── style.css       — All styling (glassmorphism, dark/light, animations)
├── audio.js        — Web Audio API sounds & procedural music
├── character.js    — Canvas character drawing & animation state machine
├── effects.js      — Particles, screen shake, emojis, rain, starfield
├── ui.js           — Dialogue DB (130+ lines), achievements, UI updates
├── main.js         — Game loop, input, state, save/load, phase logic
└── README.md       — This file
```

---

## 🎨 Customization Guide

### Change character colors

In `character.js`, look for these hex values:

```javascript
// Skin tone
'#FFE3C0'  → lighter skin
'#FFBA80'  → shadow

// Hair
'#5C3D24'  → lighter hair
'#3D2B1F'  → dark hair

// Shirt
'#7B72FF'  → shirt highlight
'#4E45C0'  → shirt base
```

### Add dialogue lines

In `ui.js`, find the `D` object and add to any category:

```javascript
normal: [
  "your new line here 😊",
  // ...existing lines
],
```

### Change meter thresholds

In `main.js`, find `_checkPhaseChange()` and adjust:

```javascript
if (GS.anger >= 30 || GS.totalHits >= 20) GS.phase = 'chaotic';
//                              ↑ change this number
```

### Add achievements

In `ui.js`, add to `ACHIEVEMENTS`:

```javascript
my_achievement: { icon:'🎯', title:'My Title', desc:'My description', hidden:false },
```

Then trigger it anywhere with:

```javascript
uiUnlockAchievement('my_achievement');
```

### Adjust music

In `audio.js`, modify `CHORDS` to change the lo-fi progression:

```javascript
normal: [[261, 329, 392], [220, 277, 330], [174, 220, 261], [196, 247, 294]],
```

---

## 📸 Screenshots

| Loading Screen | Normal Phase | Chaotic Phase | Wholesome Ending |
|---|---|---|---|
| *(add screenshot)* | *(add screenshot)* | *(add screenshot)* | *(add screenshot)* |

---

## 🛠️ Technical Notes

- **ES Modules** — Modern browsers only (Chrome 61+, Firefox 60+, Safari 11+, iOS 11+)
- **Web Audio API** — All sound is procedurally generated, no audio files needed
- **Canvas 2D** — Character is drawn entirely with bezier curves and gradients
- **devicePixelRatio** — Retina/HiDPI displays are fully supported
- **localStorage** — Progress persists across sessions, can be reset in Settings
- **No build step** — Drop files on any static host and play

---

## 💖 Credits

Built with pure HTML + CSS + Vanilla JavaScript. No frameworks, no libraries, no external assets. Everything — sounds, character art, animations — is generated at runtime.

*Made with chaotic love 💝*
