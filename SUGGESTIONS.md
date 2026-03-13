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

When mission one is complete, this will unlock mission 2, "High Jinx". This a new mission. The mission icon will appear on tile 34,26, Darnell will be standing in tile 35,26. When the player activates this mission, a chatbox will open. Darnell with tell the player that a "dumb" cop forgets to close the gate to the helicopter from time to time (Note, the gate to the helipad spawns as closed and stays closed for 3 minutes). If the player gets to the mission and the gate is closed, Darnell will say something like "The fool hasn't left yet, come back and see me in a few." A countdown clock will appear at the top of the screen showing how much time until the gate opens. This does not reset to three minutes, it should show how long until the gate opens. When the player returns, Darnell will tell the player to hop in the helicopter, they only have 3 minutes until the officer returns. They are taking the heli for a joy ride. The player will then need to fly around the city, start at the safe house, fly to the northeast corner, fly down to the southeast corner then over to the southwest corner. At the southeast corner the player will need to land the helicopter and talk to "JJ" (npc_beach_tourist_front.png tile 9,66). JJ will give the player a package and get back in the helicopter. Darnell will then tell the player to get the helicopter back to the station before the Officer returns. The player will land at the police department helipad and exit the helicopter. If the gate is still open, the mission is passed and they are awared $500. This should be saved as a completed mission. If the gate is closed, the mission fails. If the player kills Darnell or JJ the mision fails. 