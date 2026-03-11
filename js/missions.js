// ============================================
// MISSION SYSTEM
// ============================================
const MISSION_DATA = [
    // ── TIER 1: Available from the start (5 missions, spread across the map) ──
    {
        id: 'first_ride',
        name: 'First Ride',
        description: 'Steal a car and drive it to the NW safehouse.',
        reward: 500,
        startTile: { x: 12, y: 10 },   // NW
        available: true,
        steps: [
            { type: 'enter_vehicle', text: 'Find and steal a vehicle' },
            { type: 'drive_to', text: 'Drive to the NW safehouse', targetTile: { x: 22, y: 20 }, radius: 100 }
        ]
    },
    {
        id: 'the_pickup',
        name: 'The Pickup',
        description: 'Collect a package from the NE docks and deliver it downtown.',
        reward: 1000,
        startTile: { x: 60, y: 10 },   // NE
        available: true,
        steps: [
            { type: 'go_to', text: 'Go to the NE pickup point', targetTile: { x: 72, y: 10 }, radius: 80 },
            { type: 'go_to', text: 'Deliver the package downtown', targetTile: { x: 46, y: 22 }, radius: 80 }
        ]
    },
    {
        id: 'repo_job',
        name: 'Repo Job',
        description: 'Steal the marked sports car in the SE and bring it to the garage.',
        reward: 1500,
        startTile: { x: 60, y: 58 },   // SE
        available: true,
        steps: [
            { type: 'go_to', text: 'Find the repo car in the SE', targetTile: { x: 72, y: 58 }, radius: 120 },
            { type: 'enter_repo_vehicle', text: 'Steal the marked car' },
            { type: 'drive_to', text: 'Deliver to the garage', targetTile: { x: 46, y: 44 }, radius: 100 }
        ]
    },
    {
        id: 'street_race',
        name: 'Street Race',
        description: 'Race through city checkpoints — NW to NE to SE to SW!',
        reward: 2000,
        timeLimit: 90,
        startTile: { x: 35, y: 22 },   // Center
        available: true,
        steps: [
            { type: 'enter_vehicle', text: 'Get in a fast car' },
            { type: 'drive_to', text: 'Checkpoint 1 — NW corner', targetTile: { x: 12, y: 10 }, radius: 100 },
            { type: 'drive_to', text: 'Checkpoint 2 — NE corner', targetTile: { x: 70, y: 10 }, radius: 100 },
            { type: 'drive_to', text: 'Checkpoint 3 — SE corner', targetTile: { x: 70, y: 56 }, radius: 100 },
            { type: 'drive_to', text: 'FINISH LINE — SW', targetTile: { x: 22, y: 56 }, radius: 100 }
        ]
    },
    {
        id: 'the_heist',
        name: 'The Heist',
        description: 'Rob the SW store and escape east!',
        reward: 3000,
        startTile: { x: 24, y: 58 },   // SW
        available: true,
        steps: [
            { type: 'go_to', text: 'Go to the target store', targetTile: { x: 22, y: 68 }, radius: 80 },
            { type: 'shoot', text: 'Rob the store (shoot inside)', targetTile: { x: 22, y: 68 }, radius: 120 },
            { type: 'enter_vehicle', text: 'Get to a getaway car' },
            { type: 'drive_to', text: 'Escape to the SE safehouse', targetTile: { x: 58, y: 56 }, radius: 120 }
        ]
    },

    // ── TIER 2: Unlocked one at a time as missions are completed ──
    {
        id: 'hot_pursuit',
        name: 'Hot Pursuit',
        description: 'Chase a speeding criminal through the NE corridor.',
        reward: 2500,
        startTile: { x: 72, y: 10 },   // NE far corner
        available: false,
        steps: [
            { type: 'enter_vehicle', text: 'Get in a vehicle — fast!' },
            { type: 'drive_to', text: 'Intercept at Checkpoint 1', targetTile: { x: 58, y: 22 }, radius: 100 },
            { type: 'drive_to', text: 'Cut them off at Checkpoint 2', targetTile: { x: 70, y: 44 }, radius: 100 },
            { type: 'drive_to', text: 'Corner them in the SE', targetTile: { x: 58, y: 58 }, radius: 100 }
        ]
    },
    {
        id: 'smuggler_run',
        name: 'Smuggler Run',
        description: 'Pick up contraband at the SW docks and run it north.',
        reward: 2000,
        startTile: { x: 12, y: 58 },   // SW waterfront
        available: false,
        steps: [
            { type: 'go_to', text: 'Go to the SW docks', targetTile: { x: 10, y: 70 }, radius: 80 },
            { type: 'go_to', text: 'Collect the second crate', targetTile: { x: 34, y: 68 }, radius: 80 },
            { type: 'enter_vehicle', text: 'Get to a vehicle' },
            { type: 'drive_to', text: 'Deliver to the NW warehouse', targetTile: { x: 22, y: 20 }, radius: 100 }
        ]
    },
    {
        id: 'downtown_express',
        name: 'Downtown Express',
        description: 'Rush a VIP package across the city — 60 seconds!',
        reward: 2500,
        timeLimit: 60,
        startTile: { x: 47, y: 22 },   // NE mid
        available: false,
        steps: [
            { type: 'enter_vehicle', text: 'Get in a vehicle' },
            { type: 'drive_to', text: 'Pick up the VIP package', targetTile: { x: 58, y: 32 }, radius: 80 },
            { type: 'drive_to', text: 'Deliver to the NW drop point', targetTile: { x: 12, y: 20 }, radius: 100 }
        ]
    },
    {
        id: 'gang_hit',
        name: 'Gang Hit',
        description: 'Disrupt a gang meeting in the SE and escape south.',
        reward: 3500,
        startTile: { x: 47, y: 58 },   // SE mid
        available: false,
        steps: [
            { type: 'go_to', text: 'Go to the gang location', targetTile: { x: 58, y: 68 }, radius: 80 },
            { type: 'shoot', text: 'Open fire on the gang', targetTile: { x: 58, y: 68 }, radius: 120 },
            { type: 'enter_vehicle', text: 'Get to a getaway vehicle' },
            { type: 'drive_to', text: 'Escape to the SW', targetTile: { x: 34, y: 68 }, radius: 100 }
        ]
    },
    {
        id: 'neon_circuit',
        name: 'Neon Circuit',
        description: 'A full lap of Vice City — all four corners, 2 minutes!',
        reward: 4000,
        timeLimit: 120,
        startTile: { x: 72, y: 46 },   // SE far
        available: false,
        steps: [
            { type: 'enter_vehicle', text: 'Get in a fast car' },
            { type: 'drive_to', text: 'Checkpoint 1 — NE', targetTile: { x: 70, y: 10 }, radius: 100 },
            { type: 'drive_to', text: 'Checkpoint 2 — NW', targetTile: { x: 10, y: 10 }, radius: 100 },
            { type: 'drive_to', text: 'Checkpoint 3 — SW', targetTile: { x: 10, y: 68 }, radius: 100 },
            { type: 'drive_to', text: 'FINISH — SE', targetTile: { x: 58, y: 56 }, radius: 120 }
        ]
    },
    {
        id: 'vice_run',
        name: 'Vice Run',
        description: 'Transport a shipment from the NW to the SE port.',
        reward: 3000,
        startTile: { x: 12, y: 22 },   // NW mid
        available: false,
        steps: [
            { type: 'enter_vehicle', text: 'Get a vehicle for the run' },
            { type: 'drive_to', text: 'First drop — city center', targetTile: { x: 34, y: 32 }, radius: 100 },
            { type: 'drive_to', text: 'Final drop — SE port', targetTile: { x: 70, y: 68 }, radius: 100 }
        ]
    },
    {
        id: 'the_armored_job',
        name: 'The Armored Job',
        description: 'Meet Darnell — he\'s got work for you.',
        reward: 5000,
        startTile: { x: 24, y: 34 },
        available: true,
        steps: [
            { type: 'find_darnell',      text: 'Talk to Darnell, he has a job for you' },
            { type: 'close_chat',        text: 'Talk to Darnell' },
            { type: 'get_rpg',           text: 'Search the dumpster near the attorney\'s office (east side)' },
            { type: 'shoot_armored_car', text: 'Take out the armored truck! (0/3 RPG hits)' },
            { type: 'kill_guards',       text: 'Take out the guards! (2 remaining)' },
            { type: 'lose_wanted',       text: 'Lose the police!' },
            { type: 'drive_to',          text: 'Get to the NW safehouse', targetTile: { x: 22, y: 20 }, radius: 100 }
        ]
    }
];

class MissionSystem {
    constructor() {
        this.missions = MISSION_DATA.map(m => ({ ...m, completed: false }));
        this.activeMission = null;
        this.currentStep = 0;
        this.missionMarkers = [];
        this.missionMessage = '';
        this.messageTimer = 0;
        this.repoVehicle = null;
        this.missionTimer = 0;
        this.timerActive = false;
        this.armoredCar = null;
        this.armoredCarHits = 0;
        this.darnell = null;
        this.chatBox = null;
        this.guards = [];
        this.rpgPickup = null;
        this.setupMarkers();
    }

    setupMarkers() {
        this.missionMarkers = [];
        for (let i = 0; i < this.missions.length; i++) {
            const m = this.missions[i];
            if (!m.completed && m.available) {
                this.missionMarkers.push({
                    x: m.startTile.x * TILE, y: m.startTile.y * TILE,
                    missionIndex: i, radius: 50
                });
            }
        }
    }

    spawnRepoVehicle(vehicles, images) {
        const mission = this.missions.find(m => m.id === 'repo_job');
        const step0 = mission && mission.steps[0];
        const tx = step0 ? step0.targetTile.x * TILE : 72 * TILE;
        const ty = step0 ? step0.targetTile.y * TILE : 58 * TILE;
        const repoCar = new Vehicle(tx, ty, 'sports', images);
        repoCar.isRepoTarget = true;
        repoCar.ai.active = false;
        repoCar.speed = 0;
        repoCar.angle = Math.PI / 4;
        this.repoVehicle = repoCar;
        vehicles.push(repoCar);
    }

    removeRepoVehicle(vehicles) {
        if (this.repoVehicle) {
            this.repoVehicle.isRepoTarget = false;
            this.repoVehicle = null;
        }
    }

    _spawnArmoredTruck(vehicles, images) {
        const startX = 79.5 * TILE;
        const startY = 64.5 * TILE;
        const car = new Vehicle(startX, startY, 'armored', images);
        car.ai.active = false;
        car.speed = 0;
        car.angle = Math.PI; // face west
        car.isArmoredTarget = true;
        car.health = 999;
        // Path: east edge → west to col 55, then north to row 29
        car._waypoints = [
            { x: 55.5 * TILE, y: 64.5 * TILE },
            { x: 55.5 * TILE, y: 29 * TILE },
        ];
        car._waypointIdx = 0;
        car._armoredSpeed = 90;
        this.armoredCar = car;
        this.armoredCarHits = 0;
        vehicles.push(car);
    }

    spawnArmoredCar(vehicles, images) {
        this._spawnArmoredTruck(vehicles, images);
    }

    removeArmoredCar(vehicles) {
        if (this.armoredCar) {
            const idx = vehicles.indexOf(this.armoredCar);
            if (idx !== -1) vehicles.splice(idx, 1);
            this.armoredCar = null;
            this.armoredCarHits = 0;
        }
    }

    hitArmoredCar(bullet, particles, audio, player) {
        if (!this.armoredCar || !this.armoredCar.isArmoredTarget) return false;
        if (!Collision.aabb(bullet, this.armoredCar.getBounds())) return false;

        // Only RPG can damage the armored truck
        if (bullet.weaponName !== 'rpg') {
            this.showMessage('Bullets bounce off! Use the RPG!');
            particles.impact(bullet.x, bullet.y);
            bullet.active = false;
            return true;
        }

        this.armoredCarHits++;
        particles.explosion(bullet.x, bullet.y);
        audio.playExplosion();
        bullet.active = false;

        if (this.armoredCarHits >= 3) {
            // Destroy it and spawn guards
            particles.explosion(this.armoredCar.x, this.armoredCar.y);
            this.armoredCar.health = 0;
            this._spawnGuards(this.armoredCar.x, this.armoredCar.y);
            this.showMessage('Truck destroyed! Take out the guards!');
        } else {
            this.showMessage(`RPG hit! (${this.armoredCarHits}/3)`);
            if (this.activeMission && this.activeMission.id === 'the_armored_job') {
                const step = this.activeMission.steps[this.currentStep];
                if (step && step.type === 'shoot_armored_car') {
                    step.text = `Take out the armored truck! (${this.armoredCarHits}/3 RPG hits)`;
                }
            }
        }
        return true;
    }

    _spawnGuards(x, y) {
        this.guards = [
            { x: x - 48, y: y - 32, health: 100, alive: true, angle: 0, shootTimer: 0, activationDelay: 3 },
            { x: x + 48, y: y + 32, health: 100, alive: true, angle: 0, shootTimer: 0, activationDelay: 3 },
        ];
    }

    update(dt, player, audio, vehicles, images) {
        this.messageTimer = Math.max(0, this.messageTimer - dt);

        if (!this.activeMission) {
            for (const marker of this.missionMarkers) {
                if (Collision.dist(player.x, player.y, marker.x, marker.y) < marker.radius) {
                    this.startMission(marker.missionIndex, audio, vehicles, images);
                    break;
                }
            }
            return;
        }

        // ── Failure conditions ──
        if (!player.alive) {
            this.failMission('You were wasted!', audio, vehicles);
            return;
        }
        if (this.activeMission.id === 'repo_job' && this.repoVehicle && this.repoVehicle.health <= 0) {
            this.failMission('The car was destroyed!', audio, vehicles);
            return;
        }
        if (this.activeMission.id === 'the_armored_job') {
            // Darnell killed during intro steps
            if (this.currentStep <= 1 && this.darnell && !this.darnell.alive) {
                this.failMission('Darnell was killed!', audio, vehicles);
                return;
            }
            // Truck reached the bank (exhausted its waypoints) — mission fails
            if (this.armoredCar && this.armoredCar.health > 0 &&
                    this.armoredCar._waypoints && this.armoredCar._waypointIdx >= this.armoredCar._waypoints.length) {
                this.failMission('The armored truck reached the bank!', audio, vehicles);
                return;
            }
        }
        // Countdown timer
        if (this.activeMission.timeLimit && this.timerActive) {
            this.missionTimer -= dt;
            if (this.missionTimer <= 0) {
                this.failMission('Time ran out!', audio, vehicles);
                return;
            }
        }

        // ── Armored truck waypoint AI (only active from step 2 onward) ──
        if (this.activeMission.id === 'the_armored_job' && this.currentStep >= 2 &&
                this.armoredCar && this.armoredCar.health > 0) {
            const car = this.armoredCar;
            if (car._waypoints && car._waypointIdx < car._waypoints.length) {
                const wp = car._waypoints[car._waypointIdx];
                const dx = wp.x - car.x;
                const dy = wp.y - car.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 40) {
                    car._waypointIdx++;
                    if (car._waypointIdx < car._waypoints.length) {
                        const nwp = car._waypoints[car._waypointIdx];
                        car.angle = Math.atan2(nwp.y - car.y, nwp.x - car.x);
                    }
                } else {
                    car.angle = Math.atan2(dy, dx);
                    car.x += Math.cos(car.angle) * car._armoredSpeed * dt;
                    car.y += Math.sin(car.angle) * car._armoredSpeed * dt;
                }
            }
        }

        // ── Guard AI ──
        if (this.guards && this.guards.length > 0) {
            for (const guard of this.guards) {
                if (!guard.alive) continue;
                // Activation delay — guards scatter first, then attack
                if (guard.activationDelay > 0) {
                    guard.activationDelay -= dt;
                    continue;
                }
                const gdx = player.x - guard.x;
                const gdy = player.y - guard.y;
                const gdist = Math.sqrt(gdx * gdx + gdy * gdy);
                guard.angle = Math.atan2(gdy, gdx);
                if (gdist > 80) {
                    guard.x += Math.cos(guard.angle) * 60 * dt;
                    guard.y += Math.sin(guard.angle) * 60 * dt;
                }
                guard.shootTimer = (guard.shootTimer || 0) - dt;
                if (guard.shootTimer <= 0 && gdist < 300) {
                    guard.shootTimer = 1.2;
                    const spread = (Math.random() - 0.5) * 0.3;
                    const bAngle = guard.angle + spread;
                    const bullet = new Bullet(guard.x, guard.y, bAngle, 600, 15, 'guard', 'pistol');
                    player.weapons.bullets.push(bullet);
                }
            }
        }

        // ── Step progression ──
        const step = this.activeMission.steps[this.currentStep];
        if (!step) {
            this.completeMission(player, audio, vehicles);
            return;
        }

        let completed = false;
        switch (step.type) {
            case 'find_darnell':
                if (!player.inVehicle && this.darnell && this.darnell.alive) {
                    const dd = Collision.dist(player.x, player.y, this.darnell.x, this.darnell.y);
                    if (dd < 96) {
                        // Open chatbox
                        this.chatBox = {
                            active: true,
                            lines: [
                                'An armored truck is delivering some loot to the bank, should be an easy take.',
                                'I left something for you near the dumpster east of my attorney\'s office that will help.',
                                'Get a car and get moving.'
                            ]
                        };
                        completed = true;
                    }
                }
                break;
            case 'close_chat':
                // Engine handles E key to set chatBox.active = false
                if (this.chatBox && this.chatBox.active) break; // still open
                // Chatbox closed — count down 3 seconds before spawning truck
                if (this.truckSpawnDelay === 0) this.truckSpawnDelay = 3;
                this.truckSpawnDelay -= dt;
                if (this.truckSpawnDelay <= 0) {
                    this._spawnArmoredTruck(vehicles, images);
                    this.rpgPickup = { x: 79.5 * TILE, y: 17.5 * TILE, active: true };
                    completed = true;
                }
                break;
            case 'get_rpg':
                if (this.rpgPickup && !this.rpgPickup.active) completed = true;
                break;
            case 'go_to':
                if (step.targetTile) {
                    const tx = step.targetTile.x * TILE, ty = step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius) completed = true;
                }
                break;
            case 'enter_vehicle':
                if (player.inVehicle) completed = true;
                break;
            case 'enter_repo_vehicle':
                if (player.inVehicle && player.inVehicle.isRepoTarget) completed = true;
                break;
            case 'drive_to':
                if (player.inVehicle && step.targetTile) {
                    const tx = step.targetTile.x * TILE, ty = step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius) completed = true;
                }
                break;
            case 'shoot':
                if (step.targetTile) {
                    const tx = step.targetTile.x * TILE, ty = step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius && player.weapons.fireCooldown > 0) {
                        completed = true;
                        player.addWanted(3, audio);
                    }
                }
                break;
            case 'shoot_armored_car':
                if (this.armoredCarHits >= 3) completed = true;
                break;
            case 'kill_guards':
                if (this.guards.length > 0 && this.guards.every(g => !g.alive)) {
                    completed = true;
                    player.wantedLevel = 5;
                    player.wantedDecayTimer = 0;
                }
                // Keep step text updated
                {
                    const alive = this.guards.filter(g => g.alive).length;
                    step.text = `Take out the guards! (${alive} remaining)`;
                }
                break;
            case 'lose_wanted':
                if (player.wantedLevel === 0) completed = true;
                break;
        }

        if (completed) {
            this.currentStep++;
            if (this.activeMission.timeLimit && this.currentStep === 1 && !this.timerActive) {
                this.timerActive = true;
                this.missionTimer = this.activeMission.timeLimit;
            }
            if (this.currentStep >= this.activeMission.steps.length) {
                this.completeMission(player, audio, vehicles);
            } else {
                this.showMessage(this.activeMission.steps[this.currentStep].text);
                audio.playPickup();
            }
        }
    }

    startMission(index, audio, vehicles, images) {
        this.activeMission = this.missions[index];
        this.currentStep = 0;
        this.missionTimer = 0;
        this.timerActive = false;
        this.showMessage(`MISSION: ${this.activeMission.name} — ${this.activeMission.description}`);
        audio.playPickup();
        if (this.activeMission.id === 'repo_job') {
            this.spawnRepoVehicle(vehicles, images);
        }
        if (this.activeMission.id === 'the_armored_job') {
            // Spawn Darnell as a mission NPC (not in NPCManager)
            this.darnell = { x: 9.5 * TILE, y: 16.5 * TILE, alive: true };
            this.chatBox = null;
            this.guards = [];
            this.rpgPickup = null;
            this.armoredCar = null;
            this.armoredCarHits = 0;
            this.truckSpawnDelay = 0;
        }
    }

    _cleanupArmoredJob(vehicles) {
        this.removeArmoredCar(vehicles);
        this.darnell = null;
        this.chatBox = null;
        this.guards = [];
        this.rpgPickup = null;
    }

    completeMission(player, audio, vehicles) {
        player.money += this.activeMission.reward;
        this.showMessage(`MISSION COMPLETE: ${this.activeMission.name}! +$${this.activeMission.reward}`);

        if (this.activeMission.id === 'repo_job') this.removeRepoVehicle(vehicles);
        if (this.activeMission.id === 'the_armored_job') this._cleanupArmoredJob(vehicles);

        this.activeMission.completed = true;
        this.activeMission = null;
        this.currentStep = 0;
        this.timerActive = false;

        const next = this.missions.find(m => !m.completed && !m.available);
        if (next) next.available = true;

        this.setupMarkers();
        audio.playMissionComplete();
    }

    failMission(reason, audio, vehicles) {
        const name = this.activeMission.name;
        this.showMessage(`MISSION FAILED: ${name} — ${reason}`);
        if (this.activeMission.id === 'repo_job') this.removeRepoVehicle(vehicles);
        if (this.activeMission.id === 'the_armored_job') this._cleanupArmoredJob(vehicles);
        this.activeMission = null;
        this.currentStep = 0;
        this.timerActive = false;
        this.missionTimer = 0;
        this.setupMarkers();
    }

    showMessage(msg) {
        this.missionMessage = msg;
        this.messageTimer = 4;
    }

    getCurrentObjective() {
        if (!this.activeMission) return null;
        const step = this.activeMission.steps[this.currentStep];
        return step ? step.text : null;
    }

    getTargetPosition() {
        if (!this.activeMission) return null;
        const step = this.activeMission.steps[this.currentStep];
        if (!step) return null;
        if (step.type === 'find_darnell' && this.darnell && this.darnell.alive) {
            return { x: this.darnell.x, y: this.darnell.y };
        }
        if (step.type === 'get_rpg' && this.rpgPickup && this.rpgPickup.active) {
            return { x: this.rpgPickup.x, y: this.rpgPickup.y };
        }
        if (step.targetTile) {
            return { x: step.targetTile.x * TILE, y: step.targetTile.y * TILE };
        }
        return null;
    }

    getMissionTimer() {
        if (!this.timerActive) return null;
        return Math.max(0, this.missionTimer);
    }

    drawMissionEntities(ctx, images, player) {
        // Draw Darnell NPC
        if (this.darnell && this.darnell.alive) {
            const d = this.darnell;
            const img = images['npc_casual_front'];
            ctx.save();
            if (img) {
                ctx.drawImage(img, d.x - 12, d.y - 18, 24, 36);
            } else {
                ctx.fillStyle = '#ff8800';
                ctx.fillRect(d.x - 10, d.y - 16, 20, 32);
            }
            // Name tag
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(d.x - 28, d.y - 34, 56, 14);
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('DARNELL', d.x, d.y - 33);
            ctx.restore();
        }

        // RPG pickup marker (drawn here so it appears above tile sprites)
        if (this.rpgPickup && this.rpgPickup.active) {
            const pulse = Math.abs(Math.sin(Date.now() / 300));
            ctx.save();
            ctx.strokeStyle = `rgba(255, 80, 0, ${0.6 + 0.4 * pulse})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.rpgPickup.x, this.rpgPickup.y, 24 + pulse * 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw guards
        for (const guard of this.guards) {
            if (!guard.alive) continue;
            ctx.save();
            // Body
            ctx.fillStyle = '#224488';
            ctx.fillRect(guard.x - 10, guard.y - 14, 20, 28);
            // Health bar
            const ratio = guard.health / 100;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(guard.x - 16, guard.y - 22, 32, 6);
            ctx.fillStyle = ratio > 0.5 ? '#00cc44' : ratio > 0.25 ? '#ccaa00' : '#cc2200';
            ctx.fillRect(guard.x - 16, guard.y - 22, 32 * ratio, 6);
            ctx.restore();
        }
    }

    drawMarkers(ctx) {
        for (const marker of this.missionMarkers) {
            const pulse = Math.sin(Date.now() / 300) * 5;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, 30 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(marker.x, marker.y, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('M', marker.x, marker.y);
            ctx.restore();
        }

        // Active mission target
        const target = this.getTargetPosition();
        if (target) {
            const pulse = Math.sin(Date.now() / 200) * 8;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(target.x, target.y, 40 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(target.x, target.y, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ff6600';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', target.x, target.y);
            ctx.restore();
        }

        // Repo vehicle marker
        if (this.repoVehicle) {
            const pulse = Math.sin(Date.now() / 300) * 6;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 165, 0, 0.15)';
            ctx.beginPath();
            ctx.arc(this.repoVehicle.x, this.repoVehicle.y, 45 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.repoVehicle.x, this.repoVehicle.y, 35, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('REPO', this.repoVehicle.x, this.repoVehicle.y - this.repoVehicle.h / 2 - 15);
            ctx.restore();
        }

        // Darnell NPC marker
        if (this.darnell && this.darnell.alive) {
            const pulse = Math.sin(Date.now() / 400) * 4;
            ctx.save();
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.darnell.x, this.darnell.y, 22 + pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Armored car target marker
        if (this.armoredCar && this.armoredCar.health > 0) {
            const pulse = Math.sin(Date.now() / 200) * 8;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 50, 50, 0.2)';
            ctx.beginPath();
            ctx.arc(this.armoredCar.x, this.armoredCar.y, 50 + pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.armoredCar.x, this.armoredCar.y, 35, 0, Math.PI * 2);
            ctx.stroke();
            // Crosshair on target
            ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.armoredCar.x - 20, this.armoredCar.y);
            ctx.lineTo(this.armoredCar.x + 20, this.armoredCar.y);
            ctx.moveTo(this.armoredCar.x, this.armoredCar.y - 20);
            ctx.lineTo(this.armoredCar.x, this.armoredCar.y + 20);
            ctx.stroke();
            ctx.fillStyle = '#ff3333';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('TARGET', this.armoredCar.x, this.armoredCar.y - this.armoredCar.h / 2 - 18);
            ctx.restore();
        }
    }
}
