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
        const assetList = [
            'player', 'car_sports', 'car_sedan', 'car_police', 'motorcycle', 'logo',
            'helicopter', 'helicopter_police', 'propeller', 'armored_car',
            'helicopter_red', 'helicopter_green', 'helicopter_blue',
            'car_sports_red', 'car_sports_blue', 'car_sports_green', 'car_sports_white',
            'car_sedan_red', 'car_sedan_blue', 'car_sedan_green', 'car_sedan_white',
            'hospital', 'police_building', 'bank',
            'sidewalk/corner',
            'sidewalk/sidewalk_plain',
            'roads/parking/police_parking',
            'roads/asphalt_blank',
            'roads/asphalt_line',
            'roads/asphalt_stop',
            'roads/asphalt_stop_line',
            'roads/crosswalk',
            'npc_business_man_front', 'npc_business_man_back',
            'npc_business_man_front_walk', 'npc_business_man_back_walk',
            'npc_beach_tourist_front', 'npc_beach_tourist_back',
            'npc_beach_tourist_front_walk', 'npc_beach_tourist_back_walk',
            'npc_casual_front', 'npc_casual_back',
            'npc_casual_front_walk', 'npc_casual_back_walk',
            'npc_jogger_front', 'npc_jogger_back',
            'npc_jogger_front_walk', 'npc_jogger_back_walk',
        ];
        const loadingBar = document.getElementById('loadingBar');
        const loadingScreen = document.getElementById('loading-screen');
        let loaded = 0;

        // Custom paths for assets that don't live at assets/{name}.png
        const customPaths = {
            'helicopter': 'assets/vehicles/air/helicopter.png',
            'helicopter_police': 'assets/vehicles/air/helicopter_police.png',
            'propeller': 'assets/vehicles/air/propeller.png',
            'armored_car': 'assets/armored_car.png',
            'helicopter_red': 'assets/vehicles/air/colors/helicopter_red.png',
            'helicopter_green': 'assets/vehicles/air/colors/helicopter_green.png',
            'helicopter_blue': 'assets/vehicles/air/colors/helicopter_blue.png',
            'car_sports_red':   'assets/vehicles/ground/car_sports_red.png',
            'car_sports_blue':  'assets/vehicles/ground/car_sports_blue.png',
            'car_sports_green': 'assets/vehicles/ground/car_sports_green.png',
            'car_sports_white': 'assets/vehicles/ground/car_sports_white.png',
            'car_sedan_red':    'assets/vehicles/ground/car_sedan_red.png',
            'car_sedan_blue':   'assets/vehicles/ground/car_sedan_blue.png',
            'car_sedan_green':  'assets/vehicles/ground/car_sedan_green.png',
            'car_sedan_white':  'assets/vehicles/ground/car_sedan_white.png',
            'hospital':                    'assets/buildings/hospital.png',
            'police_building':             'assets/buildings/police.png',
            'bank':                        'assets/buildings/bank.png',
            'roads/parking/police_parking': 'assets/roads/parking/police_parking.png',
            'roads/crosswalk':              'assets/roads/crosswalk.png',
        };

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
                const ASSET_V = 68;
                img.src = (customPaths[name] || `assets/${name}.png`) + `?v=${ASSET_V}`;
            });
        });
        await Promise.all(promises);

        // Remove checkered/white backgrounds from sprite images (not logo, not sidewalk tiles)
        const spriteNames = [
            'player', 'car_sports', 'car_sedan', 'car_police', 'motorcycle',
            'helicopter', 'helicopter_police', 'propeller', 'armored_car',
            'helicopter_red', 'helicopter_green', 'helicopter_blue',
            'car_sports_red', 'car_sports_blue', 'car_sports_green', 'car_sports_white',
            'car_sedan_red', 'car_sedan_blue', 'car_sedan_green', 'car_sedan_white',
            'hospital', 'police_building', 'bank',
            'npc_business_man_front', 'npc_business_man_back',
            'npc_business_man_front_walk', 'npc_business_man_back_walk',
            'npc_beach_tourist_front', 'npc_beach_tourist_back',
            'npc_beach_tourist_front_walk', 'npc_beach_tourist_back_walk',
            'npc_casual_front', 'npc_casual_back',
            'npc_casual_front_walk', 'npc_casual_back_walk',
            'npc_jogger_front', 'npc_jogger_back',
            'npc_jogger_front_walk', 'npc_jogger_back_walk',
        ];
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

        // Define spray colors early so they can be used for vehicle spawning
        this.sprayColors = [
            { name: 'Red',   hex: '#cc2200', sportsImg: 'car_sports_red',   sedanImg: 'car_sedan_red' },
            { name: 'Blue',  hex: '#2255cc', sportsImg: 'car_sports_blue',  sedanImg: 'car_sedan_blue' },
            { name: 'Green', hex: '#228833', sportsImg: 'car_sports_green', sedanImg: 'car_sedan_green' },
            { name: 'White', hex: '#dddddd', sportsImg: 'car_sports_white', sedanImg: 'car_sedan_white' },
        ];

        // Spawn vehicles with randomised colors
        this.vehicles = [];
        const vehicleTypes = ['sports', 'sedan', 'sedan', 'sports', 'motorcycle', 'sedan'];
        for (let i = 0; i < Math.min(20, this.world.vehicleSpawns.length); i++) {
            const spawn = this.world.vehicleSpawns[i];
            const type = vehicleTypes[i % vehicleTypes.length];
            const vehicle = new Vehicle(spawn.x, spawn.y, type, this.images);
            vehicle.angle = spawn.angle;
            const randColor = this.sprayColors[Math.floor(Math.random() * this.sprayColors.length)];
            if (type === 'sports' && this.images[randColor.sportsImg]) {
                vehicle.img = this.images[randColor.sportsImg];
            } else if (type === 'sedan' && this.images[randColor.sedanImg]) {
                vehicle.img = this.images[randColor.sedanImg];
            } else {
                vehicle.customColor = randColor.hex;
            }
            this.vehicles.push(vehicle);
        }


        // Two static police cars parked at tiles (29,29) and (30,29)
        {
            const staticSpots = [
                { tx: 29, ty: 29 },
                { tx: 30, ty: 29 },
            ];
            for (const { tx, ty } of staticSpots) {
                const policeV = new Vehicle(tx * TILE + TILE / 2, ty * TILE, 'police', this.images);
                policeV.angle = Math.PI / 2; // facing south
                policeV.ai.active = false;
                policeV.isStationParked = true;
                this.vehicles.push(policeV);
            }
        }

        // Spawn one playable helicopter
        const heliSpawn = this.world.spawnPoints[Math.floor(Math.random() * this.world.spawnPoints.length)];
        if (heliSpawn) {
            const helicopter = new Vehicle(heliSpawn.x, heliSpawn.y, 'helicopter', this.images);
            this.vehicles.push(helicopter);
        }

        // NPCs
        const npcCharacters = ['business_man', 'beach_tourist', 'casual', 'jogger'].map(name => ({
            front: this.images[`npc_${name}_front`],
            back: this.images[`npc_${name}_back`],
            frontWalk: this.images[`npc_${name}_front_walk`],
            backWalk: this.images[`npc_${name}_back_walk`],
        }));
        this.npcManager = new NPCManager(this.world, 150, npcCharacters);

        // Police
        this.police = new PoliceSystem();
        // patrol cars deploy automatically from the station

        // Missions
        this.missions = new MissionSystem();

        // Traffic lights
        this.trafficLights = new TrafficLightSystem(this.world.roadPositions);
        window.trafficLights = this.trafficLights;

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

        this.sprayOpen = false;
        this.sprayCooldown = 0;
        this.healCooldown = 0;
        this.lawyerCooldown = 0;
        this.bankLastRobbedAt = null; // Date.now() timestamp, null = never robbed
        this.bankStolen = 0;          // amount taken in last robbery
        this.bankProxCooldown = 0;    // prevents re-trigger every frame
        this.mapOpen = false;
        this.infoOpen = false;

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

        // Full map toggle
        if (Input.isDown('m') && !this.menu.phoneOpen) {
            Input.keys['m'] = false;
            this.mapOpen = !this.mapOpen;
            this.infoOpen = false;
        }
        if (this.mapOpen) return; // freeze game while map is open

        // Info screen toggle
        if (Input.isDown('i')) {
            Input.keys['i'] = false;
            this.infoOpen = !this.infoOpen;
        }
        if (this.infoOpen) return; // freeze game while info is open

        // Day/night cycle
        this.dayNight.time += this.dayNight.speed * dt;
        if (this.dayNight.time >= 24) this.dayNight.time -= 24;

        // Update world mouse position
        Input.updateWorldMouse(this.camera);

        // Bank robbery check (before player update so E key can be consumed first)
        this.updateBank(dt);

        // Update player
        const isShooting = this.player.weapons.fireCooldown > 0;
        this.player.update(dt, this.world, this.vehicles, this.audio, this.particles);

        // Update traffic lights
        this.trafficLights.update(dt);

        // Update vehicles (reverse loop to allow despawning)
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const v = this.vehicles[i];

            // Wrecks stay in the scene as burnt-out shells — skip update, keep for rendering
            if (v.isWreck) continue;
            // Remove non-wreck destroyed vehicles (non-police cars that just died)
            if (v.health <= 0 && v.type !== 'helicopter' && !v.isArmoredTarget) {
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

                // Hit armored car (mission target — special hit counting)
                if (this.missions && this.missions.armoredCar && b.active) {
                    if (this.missions.hitArmoredCar(b, this.particles, this.audio)) {
                        continue;
                    }
                }

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

        // Rob NPCs — press F near a living NPC
        if (Input.isDown('f') && !this.player.inVehicle && this.player.alive) {
            Input.keys['f'] = false;
            let robbed = false;
            for (const npc of this.npcManager.npcs) {
                if (!npc.alive) continue;
                if (Collision.dist(this.player.x, this.player.y, npc.x, npc.y) < 70) {
                    const amount = 10 + Math.floor(Math.random() * 40);
                    this.player.money += amount;
                    this.hud.notify(`Robbed NPC — +$${amount}!`);
                    this.audio.playPickup();
                    // NPC flees
                    npc.state = 'flee';
                    npc.stateTimer = 5;
                    npc.fleeTarget = { x: this.player.x, y: this.player.y };
                    // Witness check — any police or NPC within 250px (excluding the victim)
                    const witnessed = this.police.patrolUnits.some(u =>
                        u.alive && u.vehicle && Collision.dist(this.player.x, this.player.y, u.vehicle.x, u.vehicle.y) < 300
                    ) || this.npcManager.npcs.some(n =>
                        n !== npc && n.alive && Collision.dist(this.player.x, this.player.y, n.x, n.y) < 200
                    );
                    if (witnessed) {
                        this.player.addWanted(1, this.audio);
                        this.hud.notify('Witness called the cops!');
                    }
                    robbed = true;
                    break;
                }
            }
            if (!robbed) {
                this.hud.notify('No one nearby to rob.');
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

        // Pay & Spray interaction
        this.updatePaySpray(dt);

        // Hospital heal zone
        this.updateHeal(dt);

        // Lawyer's office
        this.updateLawyer(dt);

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
        this.world.draw(ctx, this.camera, this.images);

        // Draw traffic light signals
        this.trafficLights.draw(ctx, this.camera, this.world.ROAD_WIDTH);

        // Draw mission markers
        this.missions.drawMarkers(ctx);

        // Draw store markers
        this.drawStoreMarkers(ctx);

        // Draw ground vehicles (excluding station-parked cars drawn after buildings)
        for (const v of this.vehicles) {
            if (v.type !== 'helicopter' && !v.isStationParked && this.camera.isVisible(v.x - 40, v.y - 40, 80, 80)) {
                v.draw(ctx);
            }
        }

        // Draw NPCs
        this.npcManager.draw(ctx, this.camera);

        // Draw player
        this.player.draw(ctx);

        // Draw buildings (on top for depth)
        this.world.drawBuildings(ctx, this.camera, this.images);

        // Draw station-parked police cars on top of the station building sprite
        for (const v of this.vehicles) {
            if (v.isStationParked && this.camera.isVisible(v.x - 40, v.y - 40, 80, 80)) {
                v.draw(ctx);
            }
        }

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

        // Pay & Spray overlay
        this.drawPaySprayUI(ctx, this.canvas);

        // Phone overlay
        if (this.menu.phoneOpen) {
            this.menu.drawPhone(ctx, this.canvas, this.missions);
        }

        // Full map overlay (drawn last so it appears on top of everything)
        this.drawFullMap(ctx, this.canvas);

        // Info screen overlay
        this.drawInfoScreen(ctx, this.canvas);
    }

    drawInfoScreen(ctx, canvas) {
        if (!this.infoOpen) return;
        const W = canvas.width, H = canvas.height;

        ctx.save();
        // Dark backdrop
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, W, H);

        // Panel
        const pw = Math.min(700, W - 60), ph = Math.min(520, H - 60);
        const px = (W - pw) / 2, py = (H - ph) / 2;
        ctx.fillStyle = '#0d0d1a';
        ctx.strokeStyle = '#ff1493';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 12);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.fillStyle = '#ff1493';
        ctx.font = 'bold 22px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff1493';
        ctx.shadowBlur = 12;
        ctx.fillText('CONTROLS & INFO', W / 2, py + 38);
        ctx.shadowBlur = 0;

        // Divider
        ctx.strokeStyle = 'rgba(255,20,147,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 20, py + 50); ctx.lineTo(px + pw - 20, py + 50);
        ctx.stroke();

        // Two-column layout
        const col1X = px + 30, col2X = px + pw / 2 + 10;
        const startY = py + 72;
        const lineH = 26;

        const sections = [
            {
                title: 'ON FOOT', col: 0, items: [
                    ['WASD / Arrows', 'Move'],
                    ['Shift', 'Sprint'],
                    ['Left Click', 'Shoot'],
                    ['Q', 'Switch Weapon'],
                    ['E', 'Enter Vehicle'],
                    ['F', 'Rob Nearby NPC'],
                ]
            },
            {
                title: 'IN VEHICLE', col: 1, items: [
                    ['WASD / Arrows', 'Drive'],
                    ['Space', 'Handbrake / Brake'],
                    ['E', 'Exit Vehicle'],
                    ['R', 'Change Radio Station'],
                    ['Left Click', 'Shoot from Car'],
                ]
            },
            {
                title: 'GENERAL', col: 0, rowOffset: 8, items: [
                    ['Tab', 'Phone — Missions'],
                    ['M', 'Full City Map'],
                    ['I', 'This Info Screen'],
                    ['Esc', 'Pause / Resume'],
                ]
            },
            {
                title: 'LOCATIONS', col: 1, rowOffset: 7, items: [
                    ['Red Cross ✚', 'Hospital — Respawn'],
                    ['Blue P', 'Police Station'],
                    ['Orange S', 'Pay & Spray — $500'],
                    ['Green $', 'Ammu-Nation Store'],
                ]
            },
        ];

        for (const sec of sections) {
            const baseX = sec.col === 0 ? col1X : col2X;
            const rowOff = sec.rowOffset || 0;
            const baseY = startY + rowOff * lineH;

            // Section header
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 12px "Segoe UI", Arial';
            ctx.textAlign = 'left';
            ctx.fillText(sec.title, baseX, baseY);

            // Items
            ctx.font = '12px "Segoe UI", Arial';
            sec.items.forEach((item, i) => {
                const y = baseY + (i + 1) * lineH;
                ctx.fillStyle = '#ffcc00';
                ctx.fillText(`[${item[0]}]`, baseX + 10, y);
                ctx.fillStyle = '#cccccc';
                ctx.fillText(item[1], baseX + 115, y);
            });
        }

        // Tips section at bottom
        const tipY = py + ph - 52;
        ctx.strokeStyle = 'rgba(255,20,147,0.3)';
        ctx.beginPath();
        ctx.moveTo(px + 20, tipY - 8); ctx.lineTo(px + pw - 20, tipY - 8);
        ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.font = 'italic 11px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tip: Earn money by completing missions, robbing NPCs, or collecting cash drops from defeated enemies.', W / 2, tipY + 8);
        ctx.fillText('Pay & Spray repairs your car, repaints it, and clears your wanted level for $500.', W / 2, tipY + 24);

        // Close hint
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px "Segoe UI", Arial';
        ctx.fillText('[I]  Close', W / 2, py + ph - 12);

        ctx.restore();
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

    updatePaySpray(dt) {
        this.sprayCooldown = Math.max(0, this.sprayCooldown - dt);
        const near = this.player.inVehicle &&
            this.player.inVehicle.type !== 'helicopter' &&
            Collision.dist(this.player.x, this.player.y, PAY_SPRAY_PX.x, PAY_SPRAY_PX.y) < 200;

        if (near && this.sprayCooldown <= 0) {
            this.sprayOpen = true;
            {
                // Number keys 1-8 pick color + repair
                for (let i = 0; i < this.sprayColors.length; i++) {
                    const key = String(i + 1);
                    if (Input.isDown(key)) {
                        Input.keys[key] = false;
                        const cost = 500;
                        if (this.player.money >= cost) {
                            this.player.money -= cost;
                            const sc = this.sprayColors[i];
                            const v = this.player.inVehicle;
                            if (v.type === 'sports' && this.images[sc.sportsImg]) {
                                v.img = this.images[sc.sportsImg];
                                v.customColor = null;
                            } else if (v.type === 'sedan' && this.images[sc.sedanImg]) {
                                v.img = this.images[sc.sedanImg];
                                v.customColor = null;
                            } else {
                                v.customColor = sc.hex;
                            }
                            v.health = 200;
                            this.player.wantedLevel = 0;
                            this.hud.notify(`Repainted ${sc.name} & repaired — $${cost}  ★ Cleared!`);
                            this.audio.playPickup();
                            this.sprayOpen = false;
                            this.sprayCooldown = 10.0;
                        } else {
                            this.hud.notify('Not enough money! Need $500');
                            this.sprayCooldown = 0.5;
                        }
                        break;
                    }
                }
            }
        } else {
            this.sprayOpen = false;
        }
    }

    updateHeal(dt) {
        this.healCooldown = Math.max(0, this.healCooldown - dt);
        if (this.player.inVehicle || !this.player.alive) return;
        const near = Collision.dist(this.player.x, this.player.y, HEAL_PX.x, HEAL_PX.y) < 55;
        if (!near || this.healCooldown > 0) return;
        if (Input.isDown('h')) {
            Input.keys['h'] = false;
            if (this.player.health >= 100) {
                this.hud.notify('Already at full health!');
            } else if (this.player.money >= 25) {
                const gained = Math.min(25, 100 - this.player.health);
                this.player.health = Math.min(100, this.player.health + 25);
                this.player.money -= 25;
                this.hud.notify(`+${Math.round(gained)} HP — $25`);
                this.audio.playPickup();
            } else {
                this.hud.notify('Not enough money! Need $25');
            }
            this.healCooldown = 0.4;
        }
    }

    updateLawyer(dt) {
        this.lawyerCooldown = Math.max(0, this.lawyerCooldown - dt);
        if (this.player.inVehicle || !this.player.alive) return;
        const near = Collision.dist(this.player.x, this.player.y, LAWYER_PX.x, LAWYER_PX.y) < 60;
        if (!near || this.lawyerCooldown > 0) return;
        if (Input.isDown('l')) {
            Input.keys['l'] = false;
            if (this.player.wantedLevel <= 0) {
                this.hud.notify('No wanted level to clear.');
            } else if (this.player.money >= 200) {
                this.player.money -= 200;
                this.player.wantedLevel = Math.max(0, this.player.wantedLevel - 1);
                this.player.wantedDecayTimer = 0;
                this.hud.notify('Bribed! One ★ dropped — $200');
                this.audio.playPickup();
            } else {
                this.hud.notify('Not enough money! Need $200');
            }
            this.lawyerCooldown = 0.5;
        }
    }

    updateBank(dt) {
        this.bankProxCooldown = Math.max(0, this.bankProxCooldown - dt);
        if (!this.player.alive) return;

        const near = Collision.dist(this.player.x, this.player.y, BANK_PX.x, BANK_PX.y) < 80;
        if (!near) return;

        const now = Date.now();
        const cdMs = this.bankLastRobbedAt ? Math.max(0, 3600000 - (now - this.bankLastRobbedAt)) : 0;

        if (cdMs > 0) {
            // Player returned during cooldown — arrest on foot
            if (!this.player.inVehicle && this.bankProxCooldown <= 0) {
                const lost = Math.min(this.player.money, this.bankStolen);
                this.player.money = Math.max(0, this.player.money - this.bankStolen);
                this.player.x = STATION_PX.x;
                this.player.y = STATION_PX.y + 2 * TILE;
                this.camera.x = this.player.x;
                this.camera.y = this.player.y;
                this.player.wantedLevel = 0;
                this.player.wantedDecayTimer = 0;
                this.storeOpen = false;
                this.sprayOpen = false;
                this.hud.notify(`ARRESTED! $${lost.toLocaleString()} confiscated — released at station`);
                this.audio.playPickup();
                this.bankProxCooldown = 4;
            }
            return;
        }

        // Bank is available — trigger robbery on E
        if (!this.player.inVehicle && this.bankProxCooldown <= 0 && Input.isDown('e')) {
            Input.keys['e'] = false;
            const stolen = 5000 + Math.floor(Math.random() * 5001); // $5,000–$10,000
            this.player.money += stolen;
            this.player.wantedLevel = 5;
            this.player.wantedDecayTimer = 0;
            this.bankLastRobbedAt = Date.now();
            this.bankStolen = stolen;
            this.hud.notify(`BANK ROBBED! +$${stolen.toLocaleString()} — 5★ WANTED!`);
            this.audio.playExplosion();
            this.bankProxCooldown = 2;
        }
    }

    _drawMiniCar(ctx, cx, cy, color, type) {
        // Draws a top-down car silhouette centred at (cx, cy)
        const isMoto = type === 'motorcycle';
        const bw = isMoto ? 10 : 26;  // body width
        const bh = isMoto ? 34 : 48;  // body height

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);

        if (isMoto) {
            // Front wheel
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.ellipse(cx, cy - bh / 2 - 3, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
            // Rear wheel
            ctx.beginPath(); ctx.ellipse(cx, cy + bh / 2 + 3, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
            // Seat stripe
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(cx - bw / 2 + 2, cy - 6, bw - 4, 12);
        } else {
            // Windshield
            ctx.fillStyle = 'rgba(160, 220, 255, 0.8)';
            ctx.fillRect(cx - bw / 2 + 3, cy - bh / 2 + 6, bw - 6, bh * 0.24);
            // Roof shadow
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            ctx.fillRect(cx - bw / 2 + 4, cy - bh / 2 + 6 + bh * 0.24, bw - 8, bh * 0.2);
            // Rear window
            ctx.fillStyle = 'rgba(160, 220, 255, 0.5)';
            ctx.fillRect(cx - bw / 2 + 3, cy + bh * 0.06, bw - 6, bh * 0.16);
            // Taillights
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(cx - bw / 2 + 1, cy + bh / 2 - 6, (bw / 2) - 2, 5);
            ctx.fillStyle = '#ff8800';
            ctx.fillRect(cx + 1, cy + bh / 2 - 6, (bw / 2) - 2, 5);
            // Headlights
            ctx.fillStyle = '#ffffaa';
            ctx.fillRect(cx - bw / 2 + 2, cy - bh / 2 + 1, (bw / 2) - 2, 4);
            ctx.fillRect(cx + 1, cy - bh / 2 + 1, (bw / 2) - 2, 4);
            // Wheels
            ctx.fillStyle = '#111';
            const ww = 5, wh = 9;
            ctx.fillRect(cx - bw / 2 - ww + 1, cy - bh / 2 + 7, ww, wh);
            ctx.fillRect(cx + bw / 2 - 1, cy - bh / 2 + 7, ww, wh);
            ctx.fillRect(cx - bw / 2 - ww + 1, cy + bh / 2 - 16, ww, wh);
            ctx.fillRect(cx + bw / 2 - 1, cy + bh / 2 - 16, ww, wh);
        }
    }

    drawPaySprayUI(ctx, canvas) {
        if (!this.sprayOpen) return;
        const W = canvas.width, H = canvas.height;
        const vehicle = this.player.inVehicle;

        // Panel
        const pw = 340, ph = 180;
        const px = W / 2 - pw / 2, py = H / 2 - ph / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.82)';
        ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pw, ph);

        // Title
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 18px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAY & SPRAY', W / 2, py + 28);

        ctx.fillStyle = '#888';
        ctx.font = '11px "Segoe UI", Arial';
        ctx.fillText('Choose a color — $500 repairs, repaints & clears stars', W / 2, py + 48);

        // 4 swatches in a single row
        const swW = 70, swH = 70;
        const gridX = px + (pw - this.sprayColors.length * swW) / 2;
        const gridY = py + 60;

        for (let i = 0; i < this.sprayColors.length; i++) {
            const bx = gridX + i * swW;
            const sc = this.sprayColors[i];
            const isSelected = vehicle && vehicle.customColor === sc.hex;

            // Color swatch
            ctx.fillStyle = sc.hex;
            ctx.fillRect(bx + 6, gridY + 4, swW - 12, swH - 24);
            ctx.strokeStyle = isSelected ? '#ff9900' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.strokeRect(bx + 6, gridY + 4, swW - 12, swH - 24);

            // Color name + key
            ctx.fillStyle = isSelected ? '#ff9900' : '#ddd';
            ctx.font = `${isSelected ? 'bold ' : ''}11px "Segoe UI", Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`[${i + 1}] ${sc.name}`, bx + swW / 2, gridY + swH - 6);
        }

        ctx.restore();
    }

    _drawSpecialLocations(ctx) {
        // ---- Lawyer's Office (NE) ----
        const lx = LAWYER_PX.x, ly = LAWYER_PX.y;
        const lawPulse = Math.sin(Date.now() / 700) * 0.2 + 0.8;
        ctx.save();
        ctx.fillStyle = `rgba(100, 50, 200, ${0.25 * lawPulse})`;
        ctx.fillRect(lx - 40, ly - 40, 80, 80);
        ctx.strokeStyle = `rgba(160, 100, 255, ${lawPulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(lx - 40, ly - 40, 80, 80);
        ctx.fillStyle = '#bb88ff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText('LAWYER', lx, ly - 8);
        ctx.fillStyle = '#ddbbff';
        ctx.font = '10px Arial';
        ctx.fillText('Drop ★  $200  [L]', lx, ly + 8);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();

        // ---- Hospital Heal Zone ----
        const healX = HEAL_PX.x;
        const healY = HEAL_PX.y;
        const healPulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
        ctx.save();
        ctx.fillStyle = `rgba(0, 200, 80, ${0.22 * healPulse})`;
        ctx.fillRect(healX - 40, healY - 40, 80, 80);
        ctx.strokeStyle = `rgba(0, 230, 90, ${healPulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(healX - 40, healY - 40, 80, 80);
        ctx.fillStyle = `rgba(0, 230, 90, ${healPulse})`;
        ctx.fillRect(healX - 5, healY - 16, 10, 32);
        ctx.fillRect(healX - 16, healY - 5, 32, 10);
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillText('+25 HP  $25  [H]', healX, healY + 30);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();

        // ---- Pay & Spray ----
        const px = PAY_SPRAY_PX.x;
        const py = PAY_SPRAY_PX.y;
        const psPulse = Math.sin(Date.now() / 400) * 0.2 + 0.8;
        ctx.save();
        ctx.fillStyle = `rgba(255, 100, 0, ${0.3 * psPulse})`;
        ctx.fillRect(px - 64, py - 32, 128, 64);
        ctx.strokeStyle = `rgba(255, 140, 0, ${psPulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(px - 64, py - 32, 128, 64);
        ctx.fillStyle = '#ff6600';
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText('PAY & SPRAY', px, py - 8);
        ctx.fillStyle = '#ffaa44';
        ctx.font = '10px Arial';
        ctx.fillText('Drive in with a car', px, py + 8);
        ctx.textBaseline = 'alphabetic';
        ctx.restore();

        // ---- First National Bank ----
        {
            const bx = BANK_PX.x - 4 * TILE, by = BANK_PX.y - 1.5 * TILE;
            const now = Date.now();
            const cdMs = this.bankLastRobbedAt ? Math.max(0, 3600000 - (now - this.bankLastRobbedAt)) : 0;
            const isNear = Collision.dist(this.player.x, this.player.y, BANK_PX.x, BANK_PX.y) < 250;
            const bankPulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 3;

            // Pulsing box (matches hospital style, yellow)
            ctx.fillStyle = `rgba(200, 170, 0, ${0.22 * bankPulse})`;
            ctx.fillRect(bx - 40, by - 40, 80, 80);
            ctx.strokeStyle = `rgba(255, 220, 0, ${bankPulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(bx - 40, by - 40, 80, 80);

            // Dollar sign icon
            ctx.fillStyle = `rgba(255, 220, 0, ${bankPulse})`;
            ctx.font = 'bold 28px Arial';
            ctx.fillText('$', bx, by - 8);

            // "Bank" label
            ctx.fillStyle = '#ffe066';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('Bank', bx, by + 20);

            // Proximity prompt
            if (isNear) {
                if (cdMs > 0) {
                    const mins = Math.floor(cdMs / 60000);
                    const secs = Math.floor((cdMs % 60000) / 1000);
                    ctx.fillStyle = '#ff2222';
                    ctx.font = 'bold 10px Arial';
                    ctx.fillText(`⚠ SECURE — ${mins}m ${secs}s`, bx, by + 34);
                } else {
                    ctx.fillStyle = '#ffff00';
                    ctx.font = 'bold 10px Arial';
                    ctx.fillText('Press [E] to Rob', bx, by + 34);
                }
            }

            ctx.textBaseline = 'alphabetic';
            ctx.restore();
        }
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

    drawFullMap(ctx, canvas) {
        if (!this.mapOpen) return;
        const W = canvas.width, H = canvas.height;

        // Darken background
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, W, H);

        // Map dimensions — fit to screen with padding
        const padding = 40;
        const mapW = W - padding * 2;
        const mapH = H - padding * 2;
        const scaleX = mapW / WORLD_PX_W;
        const scaleY = mapH / WORLD_PX_H;
        const scale = Math.min(scaleX, scaleY);
        const offX = padding + (mapW - WORLD_PX_W * scale) / 2;
        const offY = padding + (mapH - WORLD_PX_H * scale) / 2;

        // Draw tile grid (sampled)
        const sampleStep = 2; // draw every 2 tiles for speed
        for (let ty = 0; ty < WORLD_H; ty += sampleStep) {
            for (let tx = 0; tx < WORLD_W; tx += sampleStep) {
                const tile = this.world.tiles[ty][tx];
                let color;
                switch (tile) {
                    case 4: case 5: case 8: color = '#444'; break; // road/crosswalk/intersection
                    case 0: color = '#1a5276'; break; // water
                    case 1: color = '#d4b98a'; break; // sand
                    case 2: color = '#2d8a4e'; break; // grass
                    case 3: color = '#888'; break;     // sidewalk
                    case 6: color = '#555'; break;     // building
                    case 7: color = '#1e7a3a'; break;  // park
                    default: color = '#2d8a4e';
                }
                ctx.fillStyle = color;
                ctx.fillRect(
                    offX + tx * TILE * scale,
                    offY + ty * TILE * scale,
                    TILE * scale * sampleStep + 1,
                    TILE * scale * sampleStep + 1
                );
            }
        }

        // Hospital blip
        ctx.fillStyle = '#ff2222';
        ctx.fillRect(offX + HOSPITAL_PX.x * scale - 1, offY + HOSPITAL_PX.y * scale - 4, 2, 8);
        ctx.fillRect(offX + HOSPITAL_PX.x * scale - 4, offY + HOSPITAL_PX.y * scale - 1, 8, 2);

        // Police station blip
        const spx = offX + STATION_PX.x * scale, spy = offY + STATION_PX.y * scale;
        ctx.fillStyle = '#4466ff';
        ctx.beginPath(); ctx.arc(spx, spy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 6px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('P', spx, spy);

        // Pay & Spray blip
        const psx = offX + PAY_SPRAY_PX.x * scale, psy = offY + PAY_SPRAY_PX.y * scale;
        ctx.fillStyle = '#ff6600';
        ctx.beginPath(); ctx.arc(psx, psy, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 6px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('S', psx, psy);

        // Ammu-Nation blips
        ctx.textBaseline = 'middle';
        for (const store of this.stores) {
            const sx = offX + store.x * scale, sy = offY + store.y * scale;
            ctx.fillStyle = '#00aa44';
            ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 5px Arial'; ctx.textAlign = 'center';
            ctx.fillText('$', sx, sy);
        }

        // Mission markers
        const target = this.missions.getTargetPosition();
        if (target) {
            const tx = offX + target.x * scale, ty2 = offY + target.y * scale;
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath(); ctx.arc(tx, ty2, 5, 0, Math.PI * 2); ctx.fill();
        }
        for (const marker of this.missions.missionMarkers) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(offX + marker.x * scale, offY + marker.y * scale, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Player blip
        const plx = offX + this.player.x * scale;
        const ply = offY + this.player.y * scale;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath(); ctx.arc(plx, ply, 5, 0, Math.PI * 2); ctx.fill();
        // Direction arrow
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plx, ply);
        ctx.lineTo(plx + Math.cos(this.player.angle) * 12, ply + Math.sin(this.player.angle) * 12);
        ctx.stroke();

        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('VICE CITY — FULL MAP', W / 2, padding - 10);
        ctx.fillStyle = '#aaa';
        ctx.font = '11px Arial';
        ctx.fillText('[M] Close', W / 2, H - 10);

        // Legend
        const legX = offX + WORLD_PX_W * scale + 10;
        if (legX + 80 < W) {
            const items = [
                { color: '#00ff00', label: 'You' },
                { color: '#ff2222', label: 'Hospital' },
                { color: '#4466ff', label: 'Police' },
                { color: '#ff6600', label: 'Pay & Spray' },
                { color: '#00aa44', label: 'Ammu-Nation' },
                { color: '#ffaa00', label: 'Mission' },
            ];
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            items.forEach((item, i) => {
                ctx.fillStyle = item.color;
                ctx.fillRect(legX, offY + i * 20, 10, 10);
                ctx.fillStyle = '#ccc';
                ctx.font = '10px Arial';
                ctx.fillText(item.label, legX + 14, offY + i * 20 + 5);
            });
        }

        ctx.restore();
    }

}
// Start the game
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
