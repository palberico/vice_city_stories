// ============================================
// MAIN GAME ENGINE
// ============================================
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'menu'; // menu, loading, playing, paused
        this.lastTime = 0;
        this.images = {};
        this.dayNight = { time: 8, speed: 0.02 }; // starts at 8:00 AM, 0.02 hours/sec (~20 min per full cycle)
        this.menuReady = false;

        // Systems
        this.camera = null;
        this.world = null;
        this.player = null;
        this.vehicles = [];
        this.npcManager = null;
        this.police = null;
        this.particles = new ParticleSystem();
        this.audio = new AudioEngine();
        this.missions = null;
        this.hud = null;
        this.menu = new MenuSystem();

        this.resize();
        window.addEventListener('resize', () => this.resize());
        Input.init(this.canvas);

        // Load images
        console.log('[GTA6] Loading assets...');
        this.loadAssets().then(() => {
            this.menu.setLogo(this.images.logo);
            requestAnimationFrame(t => this.gameLoop(t));

            // Auto-start if URL has ?autostart (for automated testing)
            if (window.location.search.includes('autostart')) {
                setTimeout(() => {
                    try {
                        this.audio.init();
                        this.initGame();
                    } catch (err) {
                        console.error('[GTA6] Init error:', err);
                    }
                }, 300);
                return;
            }

            // Direct event listeners for starting the game (bypasses Input system for reliability)
            const startGame = (e) => {
                if (this.state !== 'menu') return;
                e.preventDefault();
                document.removeEventListener('click', startGame);
                document.removeEventListener('keydown', startGame);
                document.removeEventListener('touchstart', startGame);
                this.audio.init();
                this.initGame();
            };
            // Small delay to prevent starting from load-click
            setTimeout(() => {
                document.addEventListener('click', startGame);
                document.addEventListener('keydown', startGame);
                document.addEventListener('touchstart', startGame);
            }, 600);
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.camera) this.camera.resize(this.canvas.width, this.canvas.height);
    }

    async loadAssets() {
        const assetList = ['player', 'car_sports', 'car_sedan', 'car_police', 'motorcycle', 'npc_sprites', 'logo'];
        const loadingBar = document.getElementById('loadingBar');
        const loadingScreen = document.getElementById('loading-screen');
        let loaded = 0;

        const promises = assetList.map(name => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.images[name] = img;
                    loaded++;
                    if (loadingBar) loadingBar.style.width = `${(loaded / assetList.length) * 100}%`;
                    resolve();
                };
                img.onerror = () => {
                    this.images[name] = null;
                    loaded++;
                    if (loadingBar) loadingBar.style.width = `${(loaded / assetList.length) * 100}%`;
                    resolve();
                };
                img.src = `assets/${name}.png`;
            });
        });
        await Promise.all(promises);

        // Remove checkered/white backgrounds from sprite images (not logo)
        const spriteNames = ['player', 'car_sports', 'car_sedan', 'car_police', 'motorcycle', 'npc_sprites'];
        for (const name of spriteNames) {
            if (this.images[name]) {
                this.images[name] = this.removeBackground(this.images[name]);
            }
        }

        // Hide loading screen
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => { loadingScreen.style.display = 'none'; }, 600);
        }
    }

    removeBackground(img) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const cx = c.getContext('2d');
        cx.drawImage(img, 0, 0);
        const data = cx.getImageData(0, 0, c.width, c.height);
        const d = data.data;
        const w = c.width, h = c.height;

        const isBg = (i) => {
            if (i < 0 || i >= d.length) return false;
            const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
            if (a === 0) return true;
            // Green screen (#00FF00 and similar bright greens)
            if (g > 180 && r < 150 && b < 150 && g > r + 50 && g > b + 50) return true;
            // White/near-white
            if (r > 190 && g > 190 && b > 190) return true;
            // Grey checkered
            if (r > 170 && g > 170 && b > 170 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return true;
            return false;
        };

        const visited = new Uint8Array(w * h);
        const queue = [];
        for (let x = 0; x < w; x++) {
            queue.push(x);
            queue.push((h - 1) * w + x);
        }
        for (let y = 0; y < h; y++) {
            queue.push(y * w);
            queue.push(y * w + w - 1);
        }

        while (queue.length > 0) {
            const pos = queue.pop();
            if (pos < 0 || pos >= w * h || visited[pos]) continue;
            const pi = pos * 4;
            if (!isBg(pi)) continue;
            visited[pos] = 1;
            d[pi + 3] = 0;
            const x = pos % w, y = Math.floor(pos / w);
            if (x > 0) queue.push(pos - 1);
            if (x < w - 1) queue.push(pos + 1);
            if (y > 0) queue.push(pos - w);
            if (y < h - 1) queue.push(pos + w);
        }

        cx.putImageData(data, 0, 0);
        const result = new Image();
        result.src = c.toDataURL();
        return result;
    }

    initGame() {
        this.world = new World();
        this.camera = new Camera(this.canvas.width, this.canvas.height);

        // Spawn player
        const sp = this.world.spawnPoints[Math.floor(this.world.spawnPoints.length / 2)]
            || this.world.spawnPoints[0]
            || { x: WORLD_PX_W / 2, y: WORLD_PX_H / 2 };
        this.player = new Player(sp.x, sp.y, this.images.player);

        // Snap camera to player immediately
        this.camera.x = sp.x;
        this.camera.y = sp.y;

        // Give player some starting weapons
        this.player.weapons.pickupWeapon('smg', 60);
        this.player.weapons.pickupWeapon('shotgun', 15);
        this.player.weapons.currentWeapon = 'pistol';

        // Spawn vehicles
        this.vehicles = [];
        const vehicleTypes = ['sports', 'sedan', 'sedan', 'sports', 'motorcycle', 'sedan'];
        for (let i = 0; i < Math.min(20, this.world.vehicleSpawns.length); i++) {
            const spawn = this.world.vehicleSpawns[i];
            const type = vehicleTypes[i % vehicleTypes.length];
            const vehicle = new Vehicle(spawn.x, spawn.y, type, this.images);
            vehicle.angle = spawn.angle;
            this.vehicles.push(vehicle);
        }

        // Spawn one playable helicopter
        const heliSpawn = this.world.spawnPoints[Math.floor(Math.random() * this.world.spawnPoints.length)];
        if (heliSpawn) {
            const helicopter = new Vehicle(heliSpawn.x, heliSpawn.y, 'helicopter', this.images);
            this.vehicles.push(helicopter);
        }

        // NPCs
        this.npcManager = new NPCManager(this.world, 150);

        // Police
        this.police = new PoliceSystem();
        // patrol cars deploy automatically from the station

        // Missions
        this.missions = new MissionSystem();

        // HUD
        this.hud = new HUD();

        // Weapon Stores (Ammu-Nation)
        this.stores = [
            { x: 14 * TILE + TILE / 2, y: 15 * TILE + TILE / 2, name: 'Ammu-Nation NorthWest' },
            { x: 69 * TILE + TILE / 2, y: 39 * TILE + TILE / 2, name: 'Ammu-Nation MiddleEast' },
            { x: 45 * TILE + TILE / 2, y: 63 * TILE + TILE / 2, name: 'Ammu-Nation SouthWest' }
        ];
        this.storeOpen = false;
        this.storeIndex = -1;
        this.storeCooldown = 0;

        // Audio
        this.audio.init();
        this.audio.startAmbientMusic();

        this.state = 'playing';
    }

    gameLoop(timestamp) {
        const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
        this.lastTime = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.state) {
            case 'menu':
                this.updateMenu();
                this.menu.drawMainMenu(this.ctx, this.canvas);
                break;
            case 'playing':
                this.updateGame(dt);
                this.drawGame();
                break;
            case 'paused':
                this.drawGame();
                this.menu.drawPauseMenu(this.ctx, this.canvas);
                this.updatePause();
                break;
        }

        Input.resetFrame();
        requestAnimationFrame(t => this.gameLoop(t));
    }

    updateMenu() {
        // Start is handled by direct event listeners in constructor
    }

    updatePause() {
        if (Input.isDown('escape')) {
            Input.keys['escape'] = false;
            this.state = 'playing';
        }
        if (Input.isDown('m')) {
            Input.keys['m'] = false;
            this.audio.stopRadio();
            this.audio.stopAmbientMusic();
            this.state = 'menu';
        }
    }

    updateGame(dt) {
        // Pause
        if (Input.isDown('escape')) {
            Input.keys['escape'] = false;
            this.state = 'paused';
            return;
        }

        // Phone
        if (Input.isDown('tab')) {
            Input.keys['tab'] = false;
            this.menu.phoneOpen = !this.menu.phoneOpen;
        }
        if (this.menu.phoneOpen) return; // Freeze game when phone open

        // Day/night cycle
        this.dayNight.time += this.dayNight.speed * dt;
        if (this.dayNight.time >= 24) this.dayNight.time -= 24;

        // Update world mouse position
        Input.updateWorldMouse(this.camera);

        // Update player
        const isShooting = this.player.weapons.fireCooldown > 0;
        this.player.update(dt, this.world, this.vehicles, this.audio, this.particles);

        // Update vehicles (reverse loop to allow despawning)
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const v = this.vehicles[i];

            // Wrecks stay in the scene as burnt-out shells — skip update, keep for rendering
            if (v.isWreck) continue;
            // Remove non-wreck destroyed vehicles (non-police cars that just died)
            if (v.health <= 0 && v.type !== 'helicopter') {
                this.vehicles.splice(i, 1);
                continue;
            }

            v.update(dt, this.world, Input, v.driver === this.player, this.player, this.vehicles);
        }

        // Update NPCs
        this.npcManager.update(dt, this.player.x, this.player.y, isShooting);

        // Update police
        this.police.update(dt, this.player, this.world, this.vehicles, this.images, this.audio, this.particles);

        // Update missions
        this.missions.update(dt, this.player, this.audio, this.vehicles, this.images);

        // Update particles
        this.particles.update(dt);

        // Bullet collision checks
        for (let i = this.player.weapons.bullets.length - 1; i >= 0; i--) {
            const b = this.player.weapons.bullets[i];
            if (!b.active) continue;

            // Building or range expire collision
            if (this.world.checkBuildingCollision(b.x - 2, b.y - 2, 4, 4) || b.life <= 0.1) {
                if (b.weaponName === 'rpg') {
                    this.explode(b.x, b.y, 80, 100, b.owner);
                } else if (b.life > 0.1) {
                    this.particles.impact(b.x, b.y);
                }
                b.active = false;
                continue;
            }

            if (b.owner === 'police') {
                // Police bullets hit the player
                if (this.player.alive) {
                    const target = this.player.inVehicle || this.player;
                    if (Collision.aabb(b, target.getBounds())) {
                        if (this.player.inVehicle) {
                            this.player.inVehicle.health -= b.damage;
                        } else {
                            this.player.takeDamage(b.damage);
                        }
                        this.particles.impact(b.x, b.y);
                        b.active = false;
                    }
                }
                continue;
            }

            if (b.owner === 'player') {
                let hitAny = false;
                // Hit NPCs
                for (const npc of this.npcManager.npcs) {
                    if (!npc.alive) continue;
                    if (Collision.aabb(b, npc.getBounds())) {
                        if (b.weaponName === 'rpg') {
                            this.explode(b.x, b.y, 80, 100, b.owner);
                        } else {
                            npc.takeDamage(b.damage, this.particles);
                            if (!npc.alive) this.player.addWanted(0.5, this.audio);
                        }
                        b.active = false;
                        hitAny = true;
                        break;
                    }
                }
                if (hitAny) continue;

                // Hit Vehicles
                for (const v of this.vehicles) {
                    if (v.health <= 0 || v === this.player.inVehicle) continue;
                    if (Collision.aabb(b, v.getBounds())) {
                        if (b.weaponName === 'rpg') {
                            this.explode(b.x, b.y, 80, 100, b.owner);
                        } else {
                            v.health -= b.damage * 0.2; // small arms do reduced damage to vehicles
                            this.particles.impact(b.x, b.y);
                            if (v.type === 'police') this.player.addWanted(0.3, this.audio);
                            if (v.health <= 0) {
                                this.particles.explosion(v.x, v.y);
                                this.audio.playExplosion();
                            }
                        }
                        b.active = false;
                        break;
                    }
                }
            }
        }

        // Collect drops from dead NPCs
        for (const npc of this.npcManager.npcs) {
            if (!npc.alive && npc.drop && Collision.dist(this.player.x, this.player.y, npc.x, npc.y) < 30) {
                const drop = npc.drop;
                npc.drop = null;
                if (drop.type === 'cash') {
                    this.player.money += drop.amount;
                    this.hud.notify(`+$${drop.amount}`);
                    this.audio.playPickup();
                } else if (drop.type === 'weapon') {
                    this.player.weapons.pickupWeapon(drop.weapon, drop.ammo);
                    this.hud.notify(`Picked up ${WEAPONS[drop.weapon].name} ammo!`);
                    this.audio.playPickup();
                }
            }
        }

        // Camera
        this.camera.setZoom(this.player.inVehicle ? 0.7 : 1.0);
        this.camera.follow(this.player, dt);

        // Wanted level from traffic accidents — ONLY if police nearby
        if (this.player.inVehicle && this.player.inVehicle.type !== 'helicopter') {
            // Check if any police car is within 500px
            const allPoliceVehicles = [
                ...this.police.patrolUnits.map(u => u.vehicle),
                ...this.police.units.map(u => u.vehicle)
            ].filter(v => v);
            const policeNearby = allPoliceVehicles.some(pv =>
                Collision.dist(this.player.x, this.player.y, pv.x, pv.y) < 500
            );

            for (const v of this.vehicles) {
                if (v === this.player.inVehicle) continue;
                if (Collision.dist(this.player.x, this.player.y, v.x, v.y) < 40 && Math.abs(this.player.inVehicle.speed) > 200) {
                    if (policeNearby) {
                        this.player.addWanted(0.2, this.audio);
                    }
                    v.health -= 10;
                    this.particles.impact(v.x, v.y);
                }
            }

            // Run over NPCs
            for (const npc of this.npcManager.npcs) {
                if (!npc.alive) continue;
                const dist = Collision.dist(this.player.x, this.player.y, npc.x, npc.y);
                if (dist < 25 && Math.abs(this.player.inVehicle.speed) > 30) {
                    const dmg = Math.abs(this.player.inVehicle.speed) * 0.5;
                    npc.takeDamage(dmg, this.particles);
                    if (!npc.alive) {
                        this.player.addWanted(0.5, this.audio);
                        this.player.money += 10;
                    }
                }
            }
        }

        // Weapon Store interaction
        this.updateStore(dt);

        // AI-driven vehicles stop for pedestrians and signal them to hurry
        for (const v of this.vehicles) {
            if (v.driver || v.type === 'helicopter' || v.isWreck) continue;
            if (v.speed <= 0) continue;
            for (const npc of this.npcManager.npcs) {
                if (!npc.alive) continue;
                if (Collision.dist(v.x, v.y, npc.x, npc.y) < 55) {
                    const toNpc = Math.atan2(npc.y - v.y, npc.x - v.x);
                    let diff = toNpc - v.angle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    if (Math.abs(diff) < Math.PI / 2) {
                        v.speed = 0;
                        npc.hurryTimer = 1.5; // NPC moves faster to clear the road
                        break;
                    }
                }
            }
        }
    }

    drawGame() {
        const ctx = this.ctx;

        // Sky color based on time
        const skyColor = this.getSkyColor();
        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // World transform
        this.camera.applyTransform(ctx);

        // Draw world tiles
        this.world.draw(ctx, this.camera);

        // Draw mission markers
        this.missions.drawMarkers(ctx);

        // Draw store markers
        this.drawStoreMarkers(ctx);

        // Draw ground vehicles
        for (const v of this.vehicles) {
            if (v.type !== 'helicopter' && this.camera.isVisible(v.x - 40, v.y - 40, 80, 80)) {
                v.draw(ctx);
            }
        }

        // Draw NPCs
        this.npcManager.draw(ctx, this.camera);

        // Draw player
        this.player.draw(ctx);

        // Draw buildings (on top for depth)
        this.world.drawBuildings(ctx, this.camera);

        // Draw special location overlays (on top of buildings)
        this._drawSpecialLocations(ctx);

        // Draw air vehicles (on top of buildings)
        for (const v of this.vehicles) {
            if (v.type === 'helicopter' && this.camera.isVisible(v.x - 40, v.y - 40, 80, 80)) {
                v.draw(ctx);
            }
        }

        // Draw police effects
        this.police.draw(ctx);

        // Draw bullets
        this.player.weapons.drawBullets(ctx);

        // Draw particles
        this.particles.draw(ctx);

        // Day/night overlay
        this.drawDayNightOverlay(ctx);

        this.camera.restoreTransform(ctx);

        // Crosshair (screen space)
        if (this.player && this.player.alive && !this.menu.phoneOpen && !this.storeOpen) {
            const mx = Input.mouse.x;
            const my = Input.mouse.y;
            ctx.save();
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;
            const s = 10;
            ctx.beginPath();
            ctx.moveTo(mx - s, my); ctx.lineTo(mx - 3, my);
            ctx.moveTo(mx + 3, my); ctx.lineTo(mx + s, my);
            ctx.moveTo(mx, my - s); ctx.lineTo(mx, my - 3);
            ctx.moveTo(mx, my + 3); ctx.lineTo(mx, my + s);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw HUD (screen space)
        this.hud.draw(ctx, this.canvas, this.player, this.world, this.vehicles, this.missions, this.police, this.audio, this.dayNight, this.stores);

        // Store overlay
        if (this.storeOpen) {
            this.drawStoreUI(ctx, this.canvas);
        }

        // Phone overlay
        if (this.menu.phoneOpen) {
            this.menu.drawPhone(ctx, this.canvas, this.missions);
        }
    }

    getSkyColor() {
        const t = this.dayNight.time;
        if (t >= 6 && t < 8) {
            // Dawn
            const f = (t - 6) / 2;
            return this.lerpColor('#1a0a2e', '#ff9966', f);
        } else if (t >= 8 && t < 18) {
            // Day
            return '#87ceeb';
        } else if (t >= 18 && t < 20) {
            // Dusk
            const f = (t - 18) / 2;
            return this.lerpColor('#ff9966', '#1a0a2e', f);
        } else {
            // Night
            return '#0a0a1e';
        }
    }

    drawDayNightOverlay(ctx) {
        const t = this.dayNight.time;
        let alpha = 0;
        if (t >= 20 || t < 5) {
            alpha = 0.4; // Night
        } else if (t >= 18 && t < 20) {
            alpha = 0.4 * ((t - 18) / 2); // Getting dark
        } else if (t >= 5 && t < 7) {
            alpha = 0.4 * (1 - (t - 5) / 2); // Getting light
        }

        if (alpha > 0) {
            ctx.fillStyle = `rgba(10, 10, 40, ${alpha})`;
            // Apply to visible area
            const hw = this.camera.width / this.camera.zoom;
            const hh = this.camera.height / this.camera.zoom;
            ctx.fillRect(this.camera.x - hw, this.camera.y - hh, hw * 2, hh * 2);
        }
    }

    lerpColor(c1, c2, t) {
        const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
        const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
        const r = Math.round(r1 + (r2 - r1) * t);
        const g = Math.round(g1 + (g2 - g1) * t);
        const b = Math.round(b1 + (b2 - b1) * t);
        return `rgb(${r},${g},${b})`;
    }
    updateStore(dt) {
        this.storeCooldown = Math.max(0, this.storeCooldown - dt);

        // Check proximity to stores
        let nearStore = -1;
        for (let i = 0; i < this.stores.length; i++) {
            const s = this.stores[i];
            if (Collision.dist(this.player.x, this.player.y, s.x, s.y) < 60) {
                nearStore = i;
                break;
            }
        }

        if (nearStore >= 0 && !this.player.inVehicle) {
            if (!this.storeOpen) {
                this.storeOpen = true;
                this.storeIndex = nearStore;
                this.hud.notify('Welcome to ' + this.stores[nearStore].name + '!');
            }
            // Handle purchases (number keys)
            if (this.storeCooldown <= 0) {
                if (Input.isDown('1')) {
                    // Pistol ammo
                    if (this.player.money >= 50) {
                        this.player.money -= 50;
                        this.player.weapons.pickupWeapon('pistol', 30);
                        this.hud.notify('Bought Pistol Ammo (+30) — $50');
                        this.audio.playPickup();
                        this.storeCooldown = 0.5;
                    } else {
                        this.hud.notify('Not enough money!');
                        this.storeCooldown = 0.5;
                    }
                }
                if (Input.isDown('2')) {
                    // SMG
                    if (this.player.money >= 400) {
                        this.player.money -= 400;
                        this.player.weapons.pickupWeapon('smg', 60);
                        this.hud.notify('Bought SMG (+60 ammo) — $400');
                        this.audio.playPickup();
                        this.storeCooldown = 0.5;
                    } else {
                        this.hud.notify('Not enough money!');
                        this.storeCooldown = 0.5;
                    }
                }
                if (Input.isDown('3')) {
                    // Shotgun
                    if (this.player.money >= 600) {
                        this.player.money -= 600;
                        this.player.weapons.pickupWeapon('shotgun', 20);
                        this.hud.notify('Bought Shotgun (+20 ammo) — $600');
                        this.audio.playPickup();
                        this.storeCooldown = 0.5;
                    } else {
                        this.hud.notify('Not enough money!');
                        this.storeCooldown = 0.5;
                    }
                }
                if (Input.isDown('4')) {
                    // Armor
                    if (this.player.money >= 200) {
                        this.player.money -= 200;
                        this.player.armor = Math.min(100, this.player.armor + 50);
                        this.hud.notify('Bought Armor (+50) — $200');
                        this.audio.playPickup();
                        this.storeCooldown = 0.5;
                    } else {
                        this.hud.notify('Not enough money!');
                        this.storeCooldown = 0.5;
                    }
                }
                if (Input.isDown('5')) {
                    // RPG
                    if (this.player.money >= 3000) {
                        this.player.money -= 3000;
                        this.player.weapons.pickupWeapon('rpg', 3);
                        this.hud.notify('Bought RPG (+3 ammo) — $3000');
                        this.audio.playPickup();
                        this.storeCooldown = 0.5;
                    } else {
                        this.hud.notify('Not enough money!');
                        this.storeCooldown = 0.5;
                    }
                }
            }
        } else {
            this.storeOpen = false;
            this.storeIndex = -1;
        }
    }

    _drawSpecialLocations(ctx) {
        // ---- Hospital ----
        const hx = HOSPITAL_PX.x;
        const hy = HOSPITAL_PX.y;
        const pulse = Math.sin(Date.now() / 600) * 0.15 + 0.85;

        ctx.save();
        // Red cross on building roof
        ctx.fillStyle = `rgba(220, 0, 0, ${pulse})`;
        ctx.fillRect(hx - 10, hy - 34, 20, 68);
        ctx.fillRect(hx - 34, hy - 10, 68, 20);
        // White border on cross
        ctx.strokeStyle = `rgba(255, 255, 255, 0.8)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(hx - 10, hy - 34, 20, 68);
        ctx.strokeRect(hx - 34, hy - 10, 68, 20);
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText('HOSPITAL', hx, hy + 60);
        ctx.restore();

        // ---- Police Station ----
        const sx = STATION_PX.x;
        const sy = STATION_PX.y;

        ctx.save();
        // "POLICE" sign on building roof
        ctx.fillStyle = 'rgba(0, 40, 100, 0.85)';
        ctx.fillRect(sx - 52, sy - 22, 104, 28);
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 52, sy - 22, 104, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText('POLICE', sx, sy - 8);
        ctx.textBaseline = 'alphabetic';

        // Parking lot lines (drawn over the road tiles at y=28..30)
        const parkX = 27 * TILE;
        const parkY = 28 * TILE;
        const parkW = 6 * TILE;
        const parkH = 3 * TILE;
        ctx.fillStyle = 'rgba(20, 20, 40, 0.55)';
        ctx.fillRect(parkX, parkY, parkW, parkH);
        // 6 parking spaces
        ctx.strokeStyle = 'rgba(255, 220, 0, 0.85)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const px = parkX + i * TILE;
            ctx.strokeRect(px + 4, parkY + 4, TILE - 8, parkH - 8);
        }
        // "PARKING" label
        ctx.fillStyle = 'rgba(255,220,0,0.7)';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PARKING', sx, parkY + parkH / 2 + 4);
        ctx.restore();
    }

    drawStoreMarkers(ctx) {
        for (const store of this.stores) {
            const pulse = Math.sin(Date.now() / 400) * 4;
            ctx.save();
            // Green glow
            ctx.fillStyle = 'rgba(0, 200, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(store.x, store.y, 35 + pulse, 0, Math.PI * 2);
            ctx.fill();
            // Solid circle
            ctx.fillStyle = '#00aa44';
            ctx.beginPath();
            ctx.arc(store.x, store.y, 18, 0, Math.PI * 2);
            ctx.fill();
            // $ symbol
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', store.x, store.y);
            // Name label
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(store.x - 45, store.y - 32, 90, 16);
            ctx.fillStyle = '#00ff66';
            ctx.font = 'bold 9px Arial';
            ctx.fillText('AMMU-NATION', store.x, store.y - 24);
            ctx.restore();
        }
    }

    drawStoreUI(ctx, canvas) {
        const W = canvas.width;
        const H = canvas.height;
        const store = this.stores[this.storeIndex];
        if (!store) return;

        // Background panel
        const panelW = 340;
        const panelH = 310;
        const px = W / 2 - panelW / 2;
        const py = H / 2 - panelH / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(px, py, panelW, panelH);
        ctx.strokeStyle = '#00cc44';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, panelW, panelH);

        // Title
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 20px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AMMU-NATION', W / 2, py + 30);

        // Subtitle
        ctx.fillStyle = '#aaa';
        ctx.font = '12px "Segoe UI", Arial';
        ctx.fillText(`Balance: $${this.player.money.toLocaleString()}`, W / 2, py + 50);

        // Items
        const items = [
            { key: '1', name: 'Pistol Ammo (+30)', price: 50, owned: `Current: ${this.player.weapons.ammo.pistol || 0}` },
            { key: '2', name: 'SMG (+60 ammo)', price: 400, owned: this.player.weapons.inventory.smg ? `Current: ${this.player.weapons.ammo.smg || 0}` : 'NEW!' },
            { key: '3', name: 'Shotgun (+20 ammo)', price: 600, owned: this.player.weapons.inventory.shotgun ? `Current: ${this.player.weapons.ammo.shotgun || 0}` : 'NEW!' },
            { key: '4', name: 'Body Armor (+50)', price: 200, owned: `Current: ${Math.round(this.player.armor)}` },
            { key: '5', name: 'RPG (+3 shots)', price: 3000, owned: this.player.weapons.inventory.rpg ? `Current: ${this.player.weapons.ammo.rpg || 0}` : 'NEW!' }
        ];

        ctx.textAlign = 'left';
        items.forEach((item, i) => {
            const iy = py + 75 + i * 42;
            const canAfford = this.player.money >= item.price;

            // Row background
            ctx.fillStyle = canAfford ? 'rgba(0, 100, 0, 0.3)' : 'rgba(100, 0, 0, 0.2)';
            ctx.fillRect(px + 10, iy, panelW - 20, 34);

            // Key button
            ctx.fillStyle = '#00cc44';
            ctx.font = 'bold 14px "Segoe UI", Arial';
            ctx.fillText(`[${item.key}]`, px + 18, iy + 22);

            // Item name
            ctx.fillStyle = canAfford ? '#fff' : '#666';
            ctx.font = '13px "Segoe UI", Arial';
            ctx.fillText(item.name, px + 55, iy + 15);

            // Price
            ctx.fillStyle = canAfford ? '#44dd44' : '#cc4444';
            ctx.font = 'bold 13px "Segoe UI", Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`$${item.price}`, px + panelW - 18, iy + 15);

            // Owned/current
            ctx.fillStyle = '#888';
            ctx.font = '10px "Segoe UI", Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.owned, px + 55, iy + 29);
            ctx.textAlign = 'left';
        });

        // Footer
        ctx.fillStyle = '#666';
        ctx.font = '10px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Walk away to close', W / 2, py + panelH - 10);
    }

    explode(x, y, radius, damage, shooter) {
        this.particles.explosion(x, y);
        this.audio.playExplosion();

        // Check NPCs
        for (const npc of this.npcManager.npcs) {
            if (!npc.alive) continue;
            if (Collision.dist(x, y, npc.x, npc.y) < radius) {
                npc.takeDamage(damage, this.particles);
                if (!npc.alive && shooter === 'player') {
                    this.player.addWanted(0.5, this.audio);
                }
            }
        }

        // Check vehicles
        for (const v of this.vehicles) {
            if (v.health <= 0) continue;
            if (Collision.dist(x, y, v.x, v.y) < radius * 1.5) {
                v.health = 0; // destroyed
                this.particles.explosion(v.x, v.y);

                if (shooter === 'player') {
                    if (v.type === 'police') {
                        // Officers bail out — handled by PoliceSystem.update next frame
                        // Give 5 stars
                        this.player.wantedLevel = 5;
                        this.hud.notify('Cop Killer! 5 STARS!');
                        this.audio.playSiren();
                    } else {
                        // Check if police witness it
                        let witness = false;
                        for (const u of this.police.units) {
                            if (u.alive && Collision.dist(x, y, u.x, u.y) < 600) witness = true;
                        }
                        for (const u of this.police.patrolUnits) {
                            if (u.alive && u.vehicle && Collision.dist(x, y, u.vehicle.x, u.vehicle.y) < 600) witness = true;
                        }
                        if (witness) {
                            this.player.addWanted(1, this.audio);
                            this.hud.notify('Crime Reported!');
                        }
                    }
                }
            }
        }

        // Check player
        if (this.player.alive && Collision.dist(x, y, this.player.x, this.player.y) < radius) {
            const dmg = damage * 0.5; // less damage to self
            if (this.player.inVehicle) {
                this.player.inVehicle.health -= dmg;
            } else {
                this.player.takeDamage(dmg);
            }
        }
    }

}
// Start the game
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
