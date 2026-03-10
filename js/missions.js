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
        description: 'Destroy the armored truck before it escapes!',
        reward: 5000,
        startTile: { x: 24, y: 34 },   // Center-W
        available: true,
        steps: [
            { type: 'go_to', text: 'Get to the SE to intercept the armored car', targetTile: { x: 68, y: 60 }, radius: 200 },
            { type: 'shoot_armored_car', text: 'Shoot the armored car! (0/3 hits)' },
            { type: 'lose_wanted', text: 'Lose the cops! (5 stars)' },
            { type: 'drive_to', text: 'Lay low — get to the NW safehouse', targetTile: { x: 22, y: 20 }, radius: 100 }
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

    spawnArmoredCar(vehicles, images) {
        // Spawn in SE corner on the last horizontal road (y=68) near the last vertical road (x=70)
        const startX = 71 * TILE;
        const startY = 69 * TILE;
        const car = new Vehicle(startX, startY, 'armored', images);
        car.ai.active = false; // we drive it ourselves with waypoints
        car.speed = 0;
        car.angle = Math.PI; // face left initially
        car.isArmoredTarget = true;
        car.health = 999; // tough — we track hits separately
        // Waypoint path: SE → SW along bottom road, then SW → NW up the west road
        car._waypoints = [
            { x: 11 * TILE, y: 69 * TILE },  // drive left to SW along bottom road
            { x: 11 * TILE, y: 9 * TILE },   // then drive up to NW
        ];
        car._waypointIdx = 0;
        car._armoredSpeed = 90; // pixels per second
        this.armoredCar = car;
        this.armoredCarHits = 0;
        vehicles.push(car);
    }

    removeArmoredCar(vehicles) {
        if (this.armoredCar) {
            const idx = vehicles.indexOf(this.armoredCar);
            if (idx !== -1) vehicles.splice(idx, 1);
            this.armoredCar = null;
            this.armoredCarHits = 0;
        }
    }

    hitArmoredCar(bullet, particles, audio) {
        if (!this.armoredCar || !this.armoredCar.isArmoredTarget) return false;
        // Check collision
        if (!Collision.aabb(bullet, this.armoredCar.getBounds())) return false;

        this.armoredCarHits++;
        particles.impact(bullet.x, bullet.y);
        bullet.active = false;

        if (this.armoredCarHits >= 3) {
            // Blow it up!
            particles.explosion(this.armoredCar.x, this.armoredCar.y);
            audio.playExplosion();
            this.armoredCar.health = 0;
            this.showMessage('The armored car is destroyed! MISSION COMPLETE!');
        } else {
            this.showMessage(`Hit! (${this.armoredCarHits}/3)`);
            // Update current step text
            if (this.activeMission && this.activeMission.id === 'the_armored_job') {
                const step = this.activeMission.steps[this.currentStep];
                if (step && step.type === 'shoot_armored_car') {
                    step.text = `Shoot the armored car! (${this.armoredCarHits}/3 hits)`;
                }
            }
        }
        return true;
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
        // Armored car escape check — if it reaches NW, mission fails
        if (this.activeMission.id === 'the_armored_job' && this.armoredCar) {
            const escapeX = 13 * TILE;
            const escapeY = 13 * TILE;
            if (this.armoredCar.x <= escapeX && this.armoredCar.y <= escapeY) {
                this.failMission('The armored car escaped!', audio, vehicles);
                return;
            }
        }
        // Countdown timer — starts after the player completes step 0 (enter_vehicle) on timed missions
        if (this.activeMission.timeLimit && this.timerActive) {
            this.missionTimer -= dt;
            if (this.missionTimer <= 0) {
                this.failMission('Time ran out!', audio, vehicles);
                return;
            }
        }

        // ── Armored car waypoint AI ──
        if (this.activeMission.id === 'the_armored_job' && this.armoredCar && this.armoredCar.health > 0) {
            const car = this.armoredCar;
            if (car._waypoints && car._waypointIdx < car._waypoints.length) {
                const wp = car._waypoints[car._waypointIdx];
                const dx = wp.x - car.x;
                const dy = wp.y - car.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 40) {
                    // Reached waypoint, advance to next
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

        // ── Step progression ──
        const step = this.activeMission.steps[this.currentStep];
        if (!step) {
            this.completeMission(player, audio, vehicles);
            return;
        }

        let completed = false;
        switch (step.type) {
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
                // Completed when 3 hits registered (handled by hitArmoredCar)
                if (this.armoredCarHits >= 3) {
                    completed = true;
                    player.wantedLevel = 5;
                    player.wantedDecayTimer = 0;
                }
                break;
            case 'lose_wanted':
                if (player.wantedLevel === 0) completed = true;
                break;
        }

        if (completed) {
            this.currentStep++;
            // Start countdown timer after entering a vehicle (step 0 → 1) on timed missions
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
            this.spawnArmoredCar(vehicles, images);
        }
    }

    completeMission(player, audio, vehicles) {
        player.money += this.activeMission.reward;
        this.showMessage(`MISSION COMPLETE: ${this.activeMission.name}! +$${this.activeMission.reward}`);

        if (this.activeMission.id === 'repo_job') this.removeRepoVehicle(vehicles);
        if (this.activeMission.id === 'the_armored_job') this.removeArmoredCar(vehicles);

        this.activeMission.completed = true;
        this.activeMission = null;
        this.currentStep = 0;
        this.timerActive = false;

        // Unlock the next locked mission from the pool
        const next = this.missions.find(m => !m.completed && !m.available);
        if (next) next.available = true;

        this.setupMarkers();
        audio.playMissionComplete();
    }

    failMission(reason, audio, vehicles) {
        const name = this.activeMission.name;
        this.showMessage(`MISSION FAILED: ${name} — ${reason}`);
        if (this.activeMission.id === 'repo_job') this.removeRepoVehicle(vehicles);
        if (this.activeMission.id === 'the_armored_job') this.removeArmoredCar(vehicles);
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
        if (step && step.targetTile) {
            return { x: step.targetTile.x * TILE, y: step.targetTile.y * TILE };
        }
        return null;
    }

    getMissionTimer() {
        if (!this.timerActive) return null;
        return Math.max(0, this.missionTimer);
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
