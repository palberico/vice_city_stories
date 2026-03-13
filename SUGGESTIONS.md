# Vice City Stories — Feature Suggestions & Code Notes

## How to Run Locally

**Option 1 — VS Code Live Server (easiest)**
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` → **Open with Live Server**
3. Browser opens at `http://127.0.0.1:5500`

**Option 2 — Python (built-in)**
```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

**Option 3 — Node (npx)**
```bash
npx serve .
# Open http://localhost:3000
```

> Note: Don't open `index.html` directly via `file://` — some browsers block Web Audio API and canvas features on that protocol.

---

## Code Issues to Address

- [ ] **Global namespace pollution** — all classes dump into `window`. Consider `type="module"` scripts.
- [ ] **Fragile script load order** — manual ordering in `index.html` means one moved file breaks the game.
- [ ] **Wanted level in two places** — `player.wantedLevel` and `PoliceSystem` may desync.
- [ ] **Magic numbers** — hardcoded tile positions (e.g. `27 * TILE`, `28 * TILE`) should be named constants.
- [ ] **Input state mutation in player** — `Input.keys['r'] = false` should use a `consume(key)` method instead.
- [ ] **`removeBackground` blocks main thread** — the flood-fill pixel pass during load should be offloaded to a `Worker`.

---

## Recommended Features

### High Impact

- [ ] **Save System** — `localStorage` save/load for money, completed missions, and player position.
- [ ] **Mission Select Screen** — Phone-style UI to browse available missions with descriptions before accepting.
- [ ] **Wanted Level Persistence** — Stars survive vehicle changes; decay tied to police line-of-sight, not just a timer.
- [ ] **Weapon Shop** — Indoor zone (Ammu-Nation style) to spend money on weapons/ammo.
- [ ] **Vehicle Persistence** — Parked vehicles stay where the player left them between sessions.

### Gameplay Depth

- [ ] **Faction/Gang Territory** — Color-coded zones on minimap; entering rival territory triggers NPC hostility.
- [ ] **Vehicle Damage States** — Sprite shifts to damaged variant at 50% health; smoke at 25%, explosion at 0%.
- [ ] **Speed Camera / Spike Strip** — Police deploy countermeasures ahead of fleeing player at high wanted levels.
- [ ] **Timed Side Missions** — Taxi, ambulance, delivery truck; hold `E` near them to start a side hustle with countdown.
- [ ] **Weather System** — Rain slows movement, reduces NPC density, adds wet-road canvas overlay.

### Polish

- [ ] **Animated Minimap Blips** — Pulse effect on mission markers; red blips for active police pursuit.
- [ ] **Screen Shake** — Brief canvas `translate` jitter on explosions and crashes.
- [ ] **Death/Respawn Animation** — Fade to black → "Wasted" text → fade in at hospital instead of instant respawn.

High Jinx Mission

When mission one is complete, this will unlock mission 2, "High Jinx". The mission icon will appear on tile 34,26, Darnell will be standing in tile 35,26. When the player activates a mission, a chatbox will open. Darnell with tell the player that a "dumb" cop forgets to close the gate to the helicopter from time to time (Note, the gate to the helipad spawns as closed and stays closed for 3 minutes). 