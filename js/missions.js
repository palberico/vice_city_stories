// ============================================
// MISSION SYSTEM
// ============================================
const MISSION_DATA = [
    // ── TIER 1: Available from the start (5 missions, spread across the map) ──
    {
        id: 'first_ride',
        name: 'First Ride',
        description: 'Steal a car, pick up Darnell at the hospital, then drop him at his attorney before heading home.',
        reward: 500,
        startTile: { x: 12, y: 10 },   // NW
        available: true,
        steps: [
            { type: 'enter_vehicle', text: 'Find and steal a vehicle' },
            { type: 'wait_for_darnell', text: 'Drive to the hospital pickup', targetPos: HOSPITAL_PICKUP_PX, radius: 70 },
            { type: 'drive_darnell_to_attorney', text: 'Take Darnell to his attorney', targetPos: ATTORNEY_DROP_PX, radius: 80 },
            { type: 'return_to_safe_house', text: 'Take your new ride back to the safe house', targetPos: SAFE_HOUSE_DRIVEWAY_PX, radius: 70 }
        ]
    },
    {
        id: 'high_jinx',
        name: 'High Jinx',
        description: 'Catch the police helipad gate while it is open, borrow the Maverick, grab JJ on the beach, and get it back before the cop returns.',
        reward: 500,
        startTile: { x: 34, y: 26 },
        available: false,
        steps: [
            { type: 'high_jinx_intro', text: 'Talk to Darnell at the police station' },
            { type: 'high_jinx_wait_for_gate', text: 'Wait for the helipad gate to open' },
            { type: 'high_jinx_enter_heli', text: 'Hop in the police helicopter before the gate closes' },
            { type: 'high_jinx_fly_to', text: 'Fly to the safe house', targetTile: { x: 18, y: 8 }, radius: 130 },
            { type: 'high_jinx_fly_to', text: 'Fly to the northeast corner', targetTile: { x: 70, y: 10 }, radius: 150 },
            { type: 'high_jinx_fly_to', text: 'Fly to the southeast corner', targetTile: { x: 70, y: 66 }, radius: 150 },
            { type: 'high_jinx_meet_jj', text: 'Land near JJ on the southwest beach', targetTile: { x: 9, y: 66 }, radius: 110 },
            { type: 'high_jinx_close_jj_chat', text: 'Talk to JJ' },
            { type: 'high_jinx_reenter_heli', text: 'Get back in the helicopter' },
            { type: 'high_jinx_return_heli', text: 'Get the helicopter back to the police helipad', targetPos: { x: 34.5 * TILE, y: 28.5 * TILE }, radius: 70 },
            { type: 'high_jinx_exit_heli', text: 'Land on the helipad and get out before the gate closes', targetPos: { x: 34.5 * TILE, y: 28.5 * TILE }, radius: 70 },
            { type: 'high_jinx_outro', text: 'Talk to Darnell' }
        ]
    },
    {
        id: 'the_pickup',
        name: 'The Pickup',
        description: 'Meet Darnell, swipe a box truck, grab JJ\'s packages, repaint it, and make the drops.',
        reward: 0,
        startTile: { x: 71, y: 39 },
        available: false,
        steps: [
            { type: 'pickup_intro', text: 'Get out and talk to Darnell' },
            { type: 'pickup_enter_truck', text: 'Steal the green box truck', targetTile: { x: 76, y: 33 }, radius: 110 },
            { type: 'pickup_drive_to_jj', text: 'Take the box truck to JJ at the fish market', targetPos: { x: 9.5 * TILE, y: 66.5 * TILE }, radius: 130 },
            { type: 'pickup_talk_jj', text: 'Get out and talk to JJ' },
            { type: 'pickup_close_jj_chat', text: 'Talk to JJ' },
            { type: 'pickup_repaint_truck', text: 'Repaint the truck at Pay \'n\' Spray', targetPos: PAY_SPRAY_PX, radius: 150 },
            { type: 'pickup_dropoff', text: 'Deliver a package to Ammu-Nation NorthWest (3 left)', targetTile: { x: 14, y: 16 }, radius: 90, dropIndex: 0 },
            { type: 'pickup_dropoff', text: 'Deliver a package to Ammu-Nation SouthWest (2 left)', targetTile: { x: 45, y: 63 }, radius: 90, dropIndex: 1 },
            { type: 'pickup_return_to_larry', text: 'Take the last package back to Larry', targetTile: { x: 71, y: 39 }, radius: 100 },
            { type: 'pickup_talk_larry', text: 'Get out and talk to Larry' }
        ]
    },
    {
        id: 'repo_job',
        name: 'Repo Job',
        description: 'Meet Darnell behind Pay \'n\' Spray, repossess his car, lose the cops, and bring it back.',
        reward: 1500,
        startTile: { x: 16, y: 58 },
        available: false,
        steps: [
            { type: 'repo_intro', text: 'Talk to Darnell' },
            { type: 'enter_repo_vehicle', text: 'Steal Darnell\'s car', targetTile: { x: 76, y: 18 }, radius: 110 },
            { type: 'lose_wanted', text: 'Lose the police!' },
            { type: 'repo_return_car', text: 'Bring Darnell\'s car back', targetPos: { x: 19.5 * TILE, y: 60.5 * TILE }, radius: 90 },
            { type: 'repo_outro', text: 'Talk to Darnell' }
        ]
    },
    {
        id: 'street_race',
        name: 'Street Race',
        description: 'Race through city checkpoints — NW to NE to SE to SW!',
        reward: 2000,
        timeLimit: 90,
        startTile: { x: 35, y: 22 },   // Center
        available: false,
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
        available: false,
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
        available: false,
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
    constructor(savedMissionState = null, options = {}) {
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
        this.jj = null;
        this.larry = null;
        this.chatBox = null;
        this.chatContext = null;
        this.chatCloseDelay = 0;
        this.guards = [];
        this.rpgPickup = null;
        this.highJinx = null;
        this.pickupTruck = null;
        this.pickupJob = null;
        this.repoJob = null;
        this.departingNPCs = [];
        this.displayTimer = null;
        this.onStateChange = options.onStateChange || null;
        this.onMissionComplete = options.onMissionComplete || null;
        this.firstRideWaitShown = false;
        this.firstRideAttorneyChatShown = false;
        this.firstRideAttorneyDropDone = false;
        if (savedMissionState) this.applyMissionState(savedMissionState);
        this.normalizeMissionAvailability();
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

    applyMissionState(savedMissionState) {
        if (!Array.isArray(savedMissionState)) return;
        for (const saved of savedMissionState) {
            const mission = this.missions.find(m => m.id === saved.id);
            if (!mission) continue;
            mission.completed = !!saved.completed;
            mission.available = !!saved.available;
        }
    }

    getMissionState() {
        return this.missions.map(m => ({
            id: m.id,
            completed: !!m.completed,
            available: !!m.available,
        }));
    }

    normalizeMissionAvailability() {
        const firstRide = this.missions.find(m => m.id === 'first_ride');
        if (!firstRide) return;

        const next = this.missions.find(m => !m.completed);
        for (const mission of this.missions) {
            mission.available = !!next && mission.id === next.id;
        }
    }

    openChat(speaker, lines, context = null) {
        this.chatBox = {
            active: true,
            speaker,
            lines
        };
        this.chatContext = context;
        this.chatCloseDelay = 0.25;
    }

    spawnRepoVehicle(vehicles, images) {
        const targetX = 76.5 * TILE;
        const targetY = 18.5 * TILE;
        const existing = vehicles.find(v => Collision.dist(v.x, v.y, targetX, targetY) < 48);
        const repoCar = existing || new Vehicle(targetX, targetY, 'sports', images);
        if (!existing) vehicles.push(repoCar);
        repoCar.x = targetX;
        repoCar.y = targetY;
        repoCar.isRepoTarget = true;
        repoCar.ai.active = false;
        repoCar.speed = 0;
        repoCar.angle = Math.PI / 2;
        repoCar.health = Math.max(repoCar.health, 100);
        if (images['car_sports_red']) {
            repoCar.img = images['car_sports_red'];
            repoCar.imgKey = 'car_sports_red';
        }
        this.repoVehicle = repoCar;
        return repoCar;
    }

    ensureHighJinxHelicopter(vehicles, images) {
        const heliX = 34 * TILE + TILE / 2;
        const heliY = 28 * TILE + TILE / 2;
        const candidates = vehicles.filter(v =>
            v.type === 'helicopter_police' && (v.isHelipadParked || v.isHighJinxHelicopter)
        );
        const helicopter = candidates[0] || new Vehicle(heliX, heliY, 'helicopter_police', images);

        if (!candidates[0]) vehicles.push(helicopter);
        for (let i = 1; i < candidates.length; i++) {
            const idx = vehicles.indexOf(candidates[i]);
            if (idx !== -1) vehicles.splice(idx, 1);
        }

        if (helicopter.driver && helicopter.driver.exitVehicle) {
            helicopter.driver.exitVehicle();
        }

        helicopter.x = heliX;
        helicopter.y = heliY;
        helicopter.angle = 0;
        helicopter.speed = 0;
        helicopter.health = 100;
        helicopter.ai.active = false;
        helicopter.driver = null;
        helicopter.isHelipadParked = true;
        helicopter.isHighJinxHelicopter = true;
        helicopter.wasPlayerDriven = false;
        helicopter.abandonedTimer = 0;
        helicopter.liftScale = 0;

        return helicopter;
    }

    spawnPickupTruck(vehicles, images) {
        this.removePickupTruck(vehicles);
        const truck = new Vehicle(76.5 * TILE, 33.5 * TILE, 'box_truck', images);
        truck.img = images['truck_box_green'] || truck.img;
        truck.imgKey = 'truck_box_green';
        truck.ai.active = false;
        truck.speed = 0;
        truck.angle = Math.PI / 2;
        truck.isPickupTruck = true;
        this.pickupTruck = truck;
        vehicles.push(truck);
        return truck;
    }

    removePickupTruck(vehicles) {
        if (!this.pickupTruck) return;
        const idx = vehicles.indexOf(this.pickupTruck);
        if (idx !== -1) vehicles.splice(idx, 1);
        this.pickupTruck = null;
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

    _spawnFirstRideDarnell(vehicle) {
        this.darnell = {
            x: HOSPITAL_DOOR_PX.x,
            y: HOSPITAL_DOOR_PX.y,
            alive: true,
            angle: 0,
            state: 'walking_to_car',
            vehicle,
            targetX: vehicle ? vehicle.x : HOSPITAL_PICKUP_PX.x,
            targetY: vehicle ? vehicle.y : HOSPITAL_PICKUP_PX.y,
        };
    }

    _releaseDarnellFromCar(targetX, targetY) {
        if (!this.darnell) return;
        this.darnell.x = ATTORNEY_DROP_PX.x - TILE * 0.8;
        this.darnell.y = ATTORNEY_DROP_PX.y - TILE * 0.15;
        this.darnell.angle = Math.PI;
        this.darnell.exitPause = 0.4;
        this.darnell.state = 'walking_to_office';
        this.darnell.vehicle = null;
        this.darnell.targetX = targetX;
        this.darnell.targetY = targetY;
    }

    _sendDarnellWalking(targetX, targetY) {
        if (!this.darnell) return;
        this.darnell.state = 'walking_to_office';
        this.darnell.vehicle = null;
        this.darnell.exitPause = 0;
        this.darnell.targetX = targetX;
        this.darnell.targetY = targetY;
    }

    _updateWalkingNpc(npc, dt) {
        if (!npc || !npc.alive) return;
        if (npc.exitPause > 0) {
            npc.exitPause -= dt;
            return;
        }
        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = npc.walkSpeed || 90;
        if (dist > 10) {
            npc.x += (dx / dist) * speed * dt;
            npc.y += (dy / dist) * speed * dt;
            npc.angle = Math.atan2(dy, dx);
        } else {
            npc.alive = false;
        }
    }

    handleChatClosed() {
        const context = this.chatContext;
        this.chatContext = null;
        if (!this.activeMission) return;
        const step = this.activeMission.steps[this.currentStep];
        if (!step) return;
        if ((context === 'first_ride_attorney' ||
                (this.activeMission.id === 'first_ride' && step.type === 'drive_darnell_to_attorney')) &&
            this.firstRideAttorneyChatShown &&
            this.darnell &&
            this.darnell.state === 'in_car') {
            this._releaseDarnellFromCar(ATTORNEY_OFFICE_PX.x, ATTORNEY_OFFICE_PX.y);
            this.firstRideAttorneyDropDone = true;
            return;
        }

        if (this.activeMission.id === 'high_jinx') {
            if (context === 'high_jinx_gate_closed') {
                this.currentStep = 1;
                this.showMessage('The gate is shut. Watch the clock and come back when it opens.');
                return;
            }
            if (context === 'high_jinx_gate_open') {
                this.currentStep = 2;
                this.showMessage(this.activeMission.steps[this.currentStep].text);
                return;
            }
            if (context === 'high_jinx_jj') {
                if (this.highJinx) this.highJinx.packagePickedUp = true;
                return;
            }
            if (context === 'high_jinx_outro') {
                if (this.highJinx) this.highJinx.keepDarnellAfterMission = true;
                this._sendDarnellWalking(38.5 * TILE, 26.5 * TILE);
                this.currentStep = this.activeMission.steps.length;
                this.showMessage('MISSION COMPLETE: High Jinx! +$500');
            }
        }

        if (this.activeMission.id === 'the_pickup') {
            if (context === 'pickup_intro') {
                this.currentStep = 1;
                this.showMessage(this.activeMission.steps[this.currentStep].text);
                return;
            }
            if (context === 'pickup_jj') {
                if (this.pickupJob) {
                    this.pickupJob.jjBriefed = true;
                    this.pickupJob.packagesRemaining = 3;
                }
                return;
            }
            if (context === 'pickup_larry') {
                if (this.pickupJob) {
                    this.pickupJob.keepWalkersAfterMission = true;
                }
                if (this.darnell && this.darnell.alive) {
                    this.departingNPCs.push({
                        x: this.darnell.x,
                        y: this.darnell.y,
                        angle: 0,
                        alive: true,
                        targetX: 74.5 * TILE,
                        targetY: 42.5 * TILE,
                        walkSpeed: 92,
                        sprite: 'npc_casual_front',
                        name: 'DARNELL',
                        color: '#ff8800'
                    });
                }
                if (this.larry && this.larry.alive) {
                    this.departingNPCs.push({
                        x: this.larry.x,
                        y: this.larry.y,
                        angle: 0,
                        alive: true,
                        targetX: 75.5 * TILE,
                        targetY: 42.5 * TILE,
                        walkSpeed: 88,
                        sprite: 'npc_business_man_front',
                        name: 'LARRY',
                        color: '#22ddee'
                    });
                }
                this.currentStep = this.activeMission.steps.length;
                return;
            }
        }

        if (this.activeMission.id === 'repo_job') {
            if (context === 'repo_intro') {
                this.currentStep = 1;
                this.showMessage(this.activeMission.steps[this.currentStep].text);
                return;
            }
            if (context === 'repo_outro') {
                if (this.repoJob) this.repoJob.outroDone = true;
                return;
            }
        }
    }

    onVehicleRepaint(vehicle, colorChoice) {
        if (!this.activeMission || this.activeMission.id !== 'the_pickup') return;
        if (!this.pickupTruck || vehicle !== this.pickupTruck || !this.pickupJob) return;
        this.pickupJob.repainted = true;
        this.pickupJob.repaintColor = colorChoice ? colorChoice.name : 'Custom';
    }

    _updateDarnell(dt, player) {
        if (!this.darnell || !this.darnell.alive) return;

        if (this.darnell.state === 'walking_to_car' || this.darnell.state === 'walking_to_repo_car') {
            const targetVehicle = this.darnell.vehicle;
            if (!targetVehicle || targetVehicle.health <= 0) {
                this.darnell.alive = false;
                return;
            }
            const dx = targetVehicle.x - this.darnell.x;
            const dy = targetVehicle.y - this.darnell.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 90;
            if (dist > 18) {
                this.darnell.angle = Math.atan2(dy, dx);
                this.darnell.x += (dx / dist) * speed * dt;
                this.darnell.y += (dy / dist) * speed * dt;
            } else {
                if (this.darnell.state === 'walking_to_repo_car') {
                    this.darnell.alive = false;
                    targetVehicle.isRepoDeparting = true;
                    targetVehicle.isRepoTarget = false;
                    targetVehicle._repoWaypoints = [
                        { x: 19.5 * TILE, y: 64.5 * TILE }
                    ];
                    targetVehicle._repoWaypointIdx = 0;
                    targetVehicle.speed = 0;
                    targetVehicle.angle = Math.PI / 2;
                } else {
                    this.darnell.state = 'in_car';
                    this.darnell.vehicle = targetVehicle;
                    this.showMessage('Darnell is in. Take him to the attorney.');
                }
            }
        } else if (this.darnell.state === 'in_car') {
            const ride = this.darnell.vehicle;
            if (!ride || ride.health <= 0) {
                this.darnell.alive = false;
                return;
            }
            this.darnell.x = ride.x;
            this.darnell.y = ride.y;
            this.darnell.angle = ride.angle;
        } else if (this.darnell.state === 'walking_to_office') {
            if (this.darnell.exitPause > 0) {
                this.darnell.exitPause -= dt;
                return;
            }
            const dx = this.darnell.targetX - this.darnell.x;
            const dy = this.darnell.targetY - this.darnell.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 95;
            if (dist > 10) {
                this.darnell.x += (dx / dist) * speed * dt;
                this.darnell.y += (dy / dist) * speed * dt;
                this.darnell.angle = Math.atan2(dy, dx);
            } else {
                this.darnell.state = 'inside';
            }
        } else if (this.darnell.state === 'inside') {
            this.darnell.alive = false;
        }

    }

    update(dt, player, audio, vehicles, images, world) {
        this.messageTimer = Math.max(0, this.messageTimer - dt);
        this.displayTimer = null;
        this.chatCloseDelay = Math.max(0, this.chatCloseDelay - dt);
        this._updateDarnell(dt, player);
        if (this.repoVehicle && this.repoVehicle.isRepoDeparting) {
            const wp = this.repoVehicle._repoWaypoints && this.repoVehicle._repoWaypoints[this.repoVehicle._repoWaypointIdx || 0];
            if (wp) {
                const dx = wp.x - this.repoVehicle.x;
                const dy = wp.y - this.repoVehicle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const speed = 120;
                this.repoVehicle.angle = Math.PI / 2;
                if (dist > 10) {
                    this.repoVehicle.x += (dx / dist) * speed * dt;
                    this.repoVehicle.y += (dy / dist) * speed * dt;
                } else {
                    this.repoVehicle._repoWaypointIdx++;
                }
            } else {
                this.repoVehicle.isRepoDeparting = false;
                this.repoVehicle.ai.active = true;
                this.repoVehicle.ai.targetSpeed = 100;
                this.repoVehicle.speed = 40;
                this.repoVehicle = null;
            }
        }
        this.departingNPCs = this.departingNPCs.filter(npc => npc && npc.alive);
        for (const npc of this.departingNPCs) this._updateWalkingNpc(npc, dt);

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
        if (this.activeMission.id === 'first_ride' && this.darnell && !this.darnell.alive &&
            this.currentStep <= 1) {
            this.failMission('Darnell did not make it.', audio, vehicles);
            return;
        }
        if (this.activeMission.id === 'repo_job' && this.repoVehicle && this.repoVehicle.health <= 0) {
            this.failMission('The car was destroyed!', audio, vehicles);
            return;
        }
        if (this.activeMission.id === 'repo_job' && this.darnell && !this.darnell.alive) {
            this.failMission('Darnell was killed!', audio, vehicles);
            return;
        }
        if (this.activeMission.id === 'the_pickup') {
            if (this.darnell && !this.darnell.alive) {
                this.failMission('Darnell was killed!', audio, vehicles);
                return;
            }
            if (this.jj && !this.jj.alive) {
                this.failMission('JJ was killed!', audio, vehicles);
                return;
            }
            if (this.larry && !this.larry.alive) {
                this.failMission('Larry was killed!', audio, vehicles);
                return;
            }
            if (this.pickupTruck && this.pickupTruck.health <= 0) {
                this.failMission('The box truck was destroyed!', audio, vehicles);
                return;
            }
        }
        if (this.activeMission.id === 'high_jinx') {
            if (this.darnell && !this.darnell.alive) {
                this.failMission('Darnell was killed!', audio, vehicles);
                return;
            }
            if (this.jj && !this.jj.alive) {
                this.failMission('JJ was killed!', audio, vehicles);
                return;
            }
            if (this.highJinx && this.highJinx.helicopter && this.highJinx.helicopter.health <= 0) {
                this.failMission('The helicopter was destroyed!', audio, vehicles);
                return;
            }
            if (this.currentStep === 1 && world) {
                this.displayTimer = world.getHelipadTimeRemaining();
            }
            if (this.currentStep >= 2 && this.currentStep <= 10 && world) {
                this.displayTimer = world.getHelipadTimeRemaining();
                if (!world.helipadOpen) {
                    this.failMission('The cop came back and the helipad gate slammed shut!', audio, vehicles);
                    return;
                }
            }
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
                        this.openChat('Darnell', [
                            'An armored truck is delivering some loot to the bank, should be an easy take.',
                            'I left something for you near the dumpster east of my attorney\'s office that will help.',
                            'Get a car and get moving.'
                        ]);
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
            case 'wait_for_darnell':
                if (player.inVehicle && step.targetPos &&
                    Collision.dist(player.x, player.y, step.targetPos.x, step.targetPos.y) < step.radius &&
                    Math.abs(player.inVehicle.speed) < 20) {
                    if (!this.firstRideWaitShown) {
                        this.firstRideWaitShown = true;
                        this.showMessage('Wait for Darnell');
                        this._spawnFirstRideDarnell(player.inVehicle);
                    }
                }
                if (this.darnell && this.darnell.state === 'in_car') completed = true;
                break;
            case 'drive_darnell_to_attorney':
                if (!this.firstRideAttorneyChatShown && player.inVehicle && this.darnell && this.darnell.state === 'in_car' &&
                    step.targetPos && Collision.dist(player.x, player.y, step.targetPos.x, step.targetPos.y) < step.radius &&
                    Math.abs(player.inVehicle.speed) < 20) {
                    if (!this.firstRideAttorneyChatShown) {
                        this.firstRideAttorneyChatShown = true;
                        this.openChat('Darnell', [
                            'Thanks for the ride. My attorney is inside.',
                            'There are a couple of cars in the lot if you want something different.',
                            'Meet me back at the safe house when you are ready.'
                        ], 'first_ride_attorney');
                    }
                }
                if (this.firstRideAttorneyDropDone) {
                    completed = true;
                }
                break;
            case 'return_to_safe_house':
                if (player.inVehicle && step.targetPos &&
                    Collision.dist(player.x, player.y, step.targetPos.x, step.targetPos.y) < step.radius &&
                    Math.abs(player.inVehicle.speed) < 20) {
                    completed = true;
                }
                break;
            case 'enter_repo_vehicle':
                if (player.inVehicle && player.inVehicle.isRepoTarget) {
                    player.addWanted(3, audio);
                    completed = true;
                }
                break;
            case 'repo_intro':
                if (!player.inVehicle && this.darnell && this.darnell.alive &&
                    Collision.dist(player.x, player.y, this.darnell.x, this.darnell.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    this.openChat('Darnell', [
                        'My attorney took my ride for collateral and parked it across town.',
                        'Go get my car back from that lot and bring it here in one piece.',
                        'The second you touch it, the law will be all over you, so shake them before you come back.'
                    ], 'repo_intro');
                }
                break;
            case 'repo_return_car':
                if (player.inVehicle && player.inVehicle === this.repoVehicle && (step.targetPos || step.targetTile)) {
                    const tx = step.targetPos ? step.targetPos.x : step.targetTile.x * TILE;
                    const ty = step.targetPos ? step.targetPos.y : step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius &&
                        Math.abs(player.inVehicle.speed) < 25) {
                        completed = true;
                    }
                }
                break;
            case 'repo_outro':
                if (!player.inVehicle && this.darnell && this.darnell.alive &&
                    Collision.dist(player.x, player.y, this.darnell.x, this.darnell.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active) && !(this.repoJob && this.repoJob.outroDone)) {
                    this.openChat('Darnell', [
                        'That is my car. Nice work getting it back clean.',
                        'Here is your cut, and one more thing: my cousin Ray Ray says his chop shop is open to you anytime.',
                        'Take care of your rides back there and he will take care of you.'
                    ], 'repo_outro');
                }
                if (this.repoJob && this.repoJob.outroDone && (!this.chatBox || !this.chatBox.active)) {
                    completed = true;
                }
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
            case 'pickup_intro':
                if (!player.inVehicle && this.darnell && this.darnell.alive &&
                    Collision.dist(player.x, player.y, this.darnell.x, this.darnell.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    this.openChat('Darnell', [
                        'I need you to jack a box truck and head down to JJ at the fish market.',
                        'He has a package waiting, but keep it quiet and keep your hands clean.',
                        'Get moving. The green truck is parked nearby.'
                    ], 'pickup_intro');
                }
                break;
            case 'pickup_enter_truck':
                if (player.inVehicle && player.inVehicle === this.pickupTruck) completed = true;
                break;
            case 'pickup_drive_to_jj':
                if (player.inVehicle === this.pickupTruck && this.jj &&
                    Collision.dist(player.x, player.y, this.jj.x, this.jj.y) < 130 &&
                    Math.abs(player.inVehicle.speed) < 35) {
                    completed = true;
                }
                break;
            case 'pickup_talk_jj':
                if (!player.inVehicle && this.jj && this.jj.alive &&
                    Collision.dist(player.x, player.y, this.jj.x, this.jj.y) < 96 &&
                    this.pickupTruck &&
                    Collision.dist(this.pickupTruck.x, this.pickupTruck.y, this.jj.x, this.jj.y) < 220 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    this.openChat('JJ', [
                        'Fish market imports more than fresh snapper, if you catch my drift.',
                        'Here are three packages. Drop them at the stores, but repaint that truck first.',
                        'Do not roll up hot. Lose the cops before every drop.'
                    ], 'pickup_jj');
                    completed = true;
                }
                break;
            case 'pickup_close_jj_chat':
                if (this.pickupJob && this.pickupJob.jjBriefed && (!this.chatBox || !this.chatBox.active)) {
                    completed = true;
                }
                break;
            case 'pickup_repaint_truck':
                if (this.pickupJob && this.pickupJob.repainted &&
                    player.inVehicle === this.pickupTruck) {
                    completed = true;
                }
                break;
            case 'pickup_dropoff':
                if (player.inVehicle === this.pickupTruck && step.targetTile) {
                    const tx = step.targetTile.x * TILE;
                    const ty = step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius &&
                        Math.abs(player.inVehicle.speed) < 30) {
                        if (player.wantedLevel > 0) {
                            this.showMessage('Lose the cops before making the drop.');
                        } else {
                            if (this.pickupJob) this.pickupJob.packagesRemaining = Math.max(0, this.pickupJob.packagesRemaining - 1);
                            completed = true;
                        }
                    }
                }
                break;
            case 'pickup_return_to_larry':
                if (player.inVehicle === this.pickupTruck && step.targetTile) {
                    const tx = step.targetTile.x * TILE;
                    const ty = step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius &&
                        Math.abs(player.inVehicle.speed) < 30) {
                        if (player.wantedLevel > 0) {
                            this.showMessage('Lose the cops before the final handoff.');
                        } else {
                            if (this.pickupJob) this.pickupJob.packagesRemaining = 0;
                            if (!this.larry) {
                                this.larry = {
                                    x: 72.3 * TILE,
                                    y: 40.2 * TILE,
                                    alive: true,
                                    angle: Math.PI,
                                    name: 'LARRY',
                                    sprite: 'npc_business_man_front'
                                };
                            }
                            completed = true;
                        }
                    }
                }
                break;
            case 'pickup_talk_larry':
                if (!player.inVehicle && this.larry && this.larry.alive &&
                    Collision.dist(player.x, player.y, this.larry.x, this.larry.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    this.openChat('Larry', [
                        'Nice work. Those goods made it in one piece.',
                        'I cannot pay cash right now, but take this pistol and a hundred rounds for your trouble.',
                        'You ever need more, Ammu-Nation is open for business now.'
                    ], 'pickup_larry');
                }
                break;
            case 'high_jinx_intro':
                if (!player.inVehicle && this.darnell && this.darnell.alive &&
                    Collision.dist(player.x, player.y, this.darnell.x, this.darnell.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    if (world && world.helipadOpen) {
                        this.openChat('Darnell', [
                            'That dumb cop left the gate open again. Move now.',
                            'Hop in the Maverick, hit the safe house, then sweep the northeast and southeast corners.',
                            'JJ is waiting on the southwest beach with the package. Get the heli back before the gate shuts.'
                        ], 'high_jinx_gate_open');
                    } else {
                        this.openChat('Darnell', [
                            'That fool still has the gate locked up.',
                            'Come back in a few and keep an eye on the clock.',
                            'Soon as it opens, we are taking that helicopter for a joy ride.'
                        ], 'high_jinx_gate_closed');
                    }
                }
                break;
            case 'high_jinx_wait_for_gate':
                if (world && world.helipadOpen && !player.inVehicle && this.darnell && this.darnell.alive &&
                    Collision.dist(player.x, player.y, this.darnell.x, this.darnell.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    this.openChat('Darnell', [
                        'There it is. Gate is open.',
                        'Get in the Maverick, swing by the safe house, then work the northeast and southeast corners.',
                        'Pick up JJ on the southwest beach and bring the bird back before the cop gets home.'
                    ], 'high_jinx_gate_open');
                }
                break;
            case 'high_jinx_enter_heli':
                if (this.highJinx && player.inVehicle === this.highJinx.helicopter) completed = true;
                break;
            case 'high_jinx_fly_to':
                if (this.highJinx && player.inVehicle === this.highJinx.helicopter && step.targetTile) {
                    const tx = step.targetTile.x * TILE, ty = step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius) completed = true;
                }
                break;
            case 'high_jinx_meet_jj':
                if (this.highJinx && this.jj && this.jj.alive && !player.inVehicle) {
                    const nearJJ = Collision.dist(player.x, player.y, this.jj.x, this.jj.y) < 96;
                    const heliNearby = !this.highJinx.helicopter ||
                        Collision.dist(this.highJinx.helicopter.x, this.highJinx.helicopter.y, this.jj.x, this.jj.y) < 260;
                    if (nearJJ && heliNearby && (!this.chatBox || !this.chatBox.active)) {
                        this.openChat('JJ', [
                            'Package is here. Nice bird.',
                            'Darnell says quit sight-seeing and get that helicopter back to the station.',
                            'I am out of here.'
                        ], 'high_jinx_jj');
                        completed = true;
                    }
                }
                break;
            case 'high_jinx_close_jj_chat':
                if (this.highJinx && this.jj && this.jj.alive && !this.highJinx.packagePickedUp &&
                    !player.inVehicle &&
                    Collision.dist(player.x, player.y, this.jj.x, this.jj.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    this.openChat('JJ', [
                        'Package is here. Nice bird.',
                        'Darnell says quit sight-seeing and get that helicopter back to the station.',
                        'I am out of here.'
                    ], 'high_jinx_jj');
                }
                if (this.highJinx && this.highJinx.packagePickedUp && (!this.chatBox || !this.chatBox.active)) {
                    completed = true;
                }
                break;
            case 'high_jinx_reenter_heli':
                if (this.highJinx && player.inVehicle === this.highJinx.helicopter) completed = true;
                break;
            case 'high_jinx_return_heli':
                if (this.highJinx && player.inVehicle === this.highJinx.helicopter && (step.targetPos || step.targetTile)) {
                    const tx = step.targetPos ? step.targetPos.x : step.targetTile.x * TILE;
                    const ty = step.targetPos ? step.targetPos.y : step.targetTile.y * TILE;
                    if (Collision.dist(player.x, player.y, tx, ty) < step.radius &&
                        Math.abs(player.inVehicle.speed) < 40) {
                        completed = true;
                    }
                }
                break;
            case 'high_jinx_exit_heli':
                if (this.highJinx && !player.inVehicle && this.highJinx.helicopter && (step.targetPos || step.targetTile)) {
                    const tx = step.targetPos ? step.targetPos.x : step.targetTile.x * TILE;
                    const ty = step.targetPos ? step.targetPos.y : step.targetTile.y * TILE;
                    if (Collision.dist(this.highJinx.helicopter.x, this.highJinx.helicopter.y, tx, ty) < step.radius) {
                        if (world && world.helipadOpen) completed = true;
                        else {
                            this.failMission('You got back too late and the gate was closed.', audio, vehicles);
                            return;
                        }
                    }
                }
                break;
            case 'high_jinx_outro':
                if (!player.inVehicle && this.darnell && this.darnell.alive &&
                    Collision.dist(player.x, player.y, this.darnell.x, this.darnell.y) < 96 &&
                    (!this.chatBox || !this.chatBox.active)) {
                    this.openChat('Darnell', [
                        'Nice pull. Thanks for getting my stuff back in one piece.',
                        'Keep your ears open. That cop leaves the gate open all the time when he is not looking.',
                        'Check back with me, we might borrow that bird again.'
                    ], 'high_jinx_outro');
                }
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
        this.displayTimer = null;
        this.firstRideWaitShown = false;
        this.firstRideAttorneyChatShown = false;
        this.firstRideAttorneyDropDone = false;
        this.darnell = null;
        this.jj = null;
        this.larry = null;
        this.chatBox = null;
        this.chatContext = null;
        this.highJinx = null;
        this.pickupTruck = null;
        this.pickupJob = null;
        this.repoJob = null;
        this.showMessage(`MISSION: ${this.activeMission.name} — ${this.activeMission.description}`);
        audio.playPickup();
        if (this.activeMission.id === 'the_pickup') {
            this.darnell = {
                x: 71.5 * TILE,
                y: 40.5 * TILE,
                alive: true,
                angle: Math.PI,
                state: 'idle'
            };
            this.jj = {
                x: 9.5 * TILE,
                y: 66.5 * TILE,
                alive: true,
                angle: 0,
                name: 'JJ',
                sprite: 'npc_beach_tourist_front'
            };
            this.pickupTruck = this.spawnPickupTruck(vehicles, images);
            this.pickupJob = {
                jjBriefed: false,
                repainted: false,
                packagesRemaining: 0,
                keepWalkersAfterMission: false
            };
        }
        if (this.activeMission.id === 'high_jinx') {
            this.darnell = {
                x: 35.5 * TILE,
                y: 26.5 * TILE,
                alive: true,
                angle: Math.PI,
                state: 'idle'
            };
            this.jj = {
                x: 9.5 * TILE,
                y: 66.5 * TILE,
                alive: true,
                angle: 0,
                name: 'JJ',
                sprite: 'npc_beach_tourist_front'
            };
            const missionHelicopter = this.ensureHighJinxHelicopter(vehicles, images);
            this.highJinx = {
                helicopter: missionHelicopter,
                packagePickedUp: false,
                keepDarnellAfterMission: false
            };
        }
        if (this.activeMission.id === 'repo_job') {
            this.darnell = {
                x: 19.5 * TILE,
                y: 58.5 * TILE,
                alive: true,
                angle: Math.PI,
                state: 'idle'
            };
            this.repoJob = { outroDone: false };
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

    debugStartMission(index, audio, vehicles, images) {
        if (index < 0 || index >= this.missions.length) return false;

        if (this.activeMission) {
            if (this.activeMission.id === 'first_ride') this._cleanupFirstRide();
            if (this.activeMission.id === 'the_pickup') this._cleanupThePickup(vehicles);
            if (this.activeMission.id === 'high_jinx') this._cleanupHighJinx();
            if (this.activeMission.id === 'repo_job') this._cleanupRepoJob();
            if (this.activeMission.id === 'the_armored_job') this._cleanupArmoredJob(vehicles);
            this.activeMission = null;
            this.currentStep = 0;
            this.timerActive = false;
            this.missionTimer = 0;
            this.displayTimer = null;
        }

        this.missions[index].available = true;
        this.startMission(index, audio, vehicles, images);
        this.setupMarkers();
        if (this.onStateChange) this.onStateChange(this.getMissionState());
        return true;
    }

    _cleanupArmoredJob(vehicles) {
        this.removeArmoredCar(vehicles);
        this.darnell = null;
        this.chatBox = null;
        this.guards = [];
        this.rpgPickup = null;
    }

    _cleanupFirstRide() {
        this.darnell = null;
        this.chatBox = null;
        this.chatContext = null;
        this.firstRideWaitShown = false;
        this.firstRideAttorneyChatShown = false;
        this.firstRideAttorneyDropDone = false;
    }

    _cleanupHighJinx() {
        if (!(this.highJinx && this.highJinx.keepDarnellAfterMission)) {
            this.darnell = null;
        }
        this.jj = null;
        this.chatBox = null;
        this.chatContext = null;
        this.highJinx = null;
        this.displayTimer = null;
    }

    _cleanupRepoJob() {
        this.darnell = null;
        this.chatBox = null;
        this.chatContext = null;
        this.repoJob = null;
        this.removeRepoVehicle();
    }

    _cleanupThePickup(vehicles) {
        this.darnell = null;
        this.jj = null;
        this.larry = null;
        this.chatBox = null;
        this.chatContext = null;
        this.removePickupTruck(vehicles);
        this.pickupJob = null;
        this.displayTimer = null;
    }

    completeMission(player, audio, vehicles) {
        const completedMission = this.activeMission;
        player.money += this.activeMission.reward;
        this.showMessage(`MISSION COMPLETE: ${this.activeMission.name}! +$${this.activeMission.reward}`);

        if (this.activeMission.id === 'first_ride') this._cleanupFirstRide();
        if (this.activeMission.id === 'the_pickup') {
            player.weapons.pickupWeapon('pistol', 100);
            this.showMessage('MISSION COMPLETE: The Pickup! Larry hooked you up with a pistol and 100 rounds.');
            this._cleanupThePickup(vehicles);
        }
        if (this.activeMission.id === 'high_jinx') this._cleanupHighJinx();
        if (this.activeMission.id === 'repo_job' && this.darnell && this.repoVehicle) {
            this.darnell.state = 'walking_to_repo_car';
            this.darnell.vehicle = this.repoVehicle;
        } else if (this.activeMission.id === 'repo_job') {
            this._cleanupRepoJob();
        }
        if (this.activeMission.id === 'the_armored_job') this._cleanupArmoredJob(vehicles);

        this.activeMission.completed = true;
        this.activeMission = null;
        this.currentStep = 0;
        this.timerActive = false;

        this.normalizeMissionAvailability();
        this.setupMarkers();
        if (this.onMissionComplete) this.onMissionComplete(completedMission, player, vehicles);
        if (this.onStateChange) this.onStateChange(this.getMissionState());
        audio.playMissionComplete();
    }

    failMission(reason, audio, vehicles) {
        const name = this.activeMission.name;
        this.showMessage(`MISSION FAILED: ${name} — ${reason}`);
        if (this.activeMission.id === 'first_ride') this._cleanupFirstRide();
        if (this.activeMission.id === 'the_pickup') this._cleanupThePickup(vehicles);
        if (this.activeMission.id === 'high_jinx') this._cleanupHighJinx();
        if (this.activeMission.id === 'repo_job') this._cleanupRepoJob();
        if (this.activeMission.id === 'the_armored_job') this._cleanupArmoredJob(vehicles);
        this.activeMission = null;
        this.currentStep = 0;
        this.timerActive = false;
        this.missionTimer = 0;
        this.displayTimer = null;
        this.setupMarkers();
    }

    showMessage(msg, duration = 6) {
        this.missionMessage = msg;
        this.messageTimer = duration;
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
        if (step.type === 'wait_for_darnell' && this.darnell && this.darnell.alive) {
            return { x: this.darnell.x, y: this.darnell.y };
        }
        if (step.type === 'find_darnell' && this.darnell && this.darnell.alive) {
            return { x: this.darnell.x, y: this.darnell.y };
        }
        if (step.type === 'pickup_intro' && this.darnell && this.darnell.alive) {
            return { x: this.darnell.x, y: this.darnell.y };
        }
        if ((step.type === 'repo_intro' || step.type === 'repo_outro') && this.darnell && this.darnell.alive) {
            return { x: this.darnell.x, y: this.darnell.y };
        }
        if (step.type === 'pickup_enter_truck' && this.pickupTruck) {
            return { x: this.pickupTruck.x, y: this.pickupTruck.y };
        }
        if ((step.type === 'pickup_talk_jj' || step.type === 'pickup_close_jj_chat') && this.jj && this.jj.alive) {
            return { x: this.jj.x, y: this.jj.y };
        }
        if (step.type === 'pickup_repaint_truck') {
            return { x: PAY_SPRAY_PX.x, y: PAY_SPRAY_PX.y };
        }
        if (step.type === 'pickup_talk_larry' && this.larry && this.larry.alive) {
            return { x: this.larry.x, y: this.larry.y };
        }
        if ((step.type === 'high_jinx_intro' || step.type === 'high_jinx_wait_for_gate') && this.darnell && this.darnell.alive) {
            return { x: this.darnell.x, y: this.darnell.y };
        }
        if (step.type === 'high_jinx_outro' && this.darnell && this.darnell.alive) {
            return { x: this.darnell.x, y: this.darnell.y };
        }
        if (step.type === 'high_jinx_enter_heli' && this.highJinx && this.highJinx.helicopter) {
            return { x: this.highJinx.helicopter.x, y: this.highJinx.helicopter.y };
        }
        if (step.type === 'high_jinx_reenter_heli' && this.highJinx && this.highJinx.helicopter) {
            return { x: this.highJinx.helicopter.x, y: this.highJinx.helicopter.y };
        }
        if ((step.type === 'high_jinx_meet_jj' || step.type === 'high_jinx_close_jj_chat') && this.jj && this.jj.alive) {
            return { x: this.jj.x, y: this.jj.y };
        }
        if (step.type === 'get_rpg' && this.rpgPickup && this.rpgPickup.active) {
            return { x: this.rpgPickup.x, y: this.rpgPickup.y };
        }
        if (step.targetPos) {
            return { x: step.targetPos.x, y: step.targetPos.y };
        }
        if (step.targetTile) {
            return { x: step.targetTile.x * TILE, y: step.targetTile.y * TILE };
        }
        return null;
    }

    getMissionTimer() {
        if (this.displayTimer !== null) return Math.max(0, this.displayTimer);
        if (!this.timerActive) return null;
        return Math.max(0, this.missionTimer);
    }

    drawMissionEntities(ctx, images, player) {
        const drawNamedNpc = (npc, spriteKey, ringColor, name, labelW = 56) => {
            if (!npc || !npc.alive) return;
            const img = images[spriteKey];
            ctx.save();
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(npc.x, npc.y, 16, 0, Math.PI * 2);
            ctx.stroke();
            if (img) {
                ctx.drawImage(img, npc.x - 12, npc.y - 18, 24, 36);
            } else {
                ctx.fillStyle = ringColor;
                ctx.fillRect(npc.x - 10, npc.y - 16, 20, 32);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(npc.x - labelW / 2, npc.y - 34, labelW, 14);
            ctx.fillStyle = ringColor;
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(name, npc.x, npc.y - 33);
            ctx.restore();
        };

        // Draw Darnell NPC
        if (this.darnell && this.darnell.alive && this.darnell.state !== 'in_car') {
            const d = this.darnell;
            const img = Math.sin(d.angle || 0) >= 0 ? images['npc_casual_front_walk'] || images['npc_casual_front']
                : images['npc_casual_back_walk'] || images['npc_casual_back'];
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 136, 0, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 16, 0, Math.PI * 2);
            ctx.stroke();
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

        if (this.jj && this.jj.alive) {
            drawNamedNpc(this.jj, this.jj.sprite || 'npc_beach_tourist_front', '#22ddee', 'JJ', 36);
        }

        if (this.larry && this.larry.alive) {
            drawNamedNpc(this.larry, this.larry.sprite || 'npc_business_man_front', '#88ddff', 'LARRY', 44);
        }

        for (const npc of this.departingNPCs) {
            drawNamedNpc(npc, npc.sprite || 'npc_casual_front', npc.color || '#ffffff', npc.name || 'NPC', 56);
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
        if (this.darnell && this.darnell.alive && this.darnell.state !== 'in_car') {
            const pulse = Math.sin(Date.now() / 400) * 4;
            ctx.save();
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.darnell.x, this.darnell.y, 22 + pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.jj && this.jj.alive) {
            const pulse = Math.sin(Date.now() / 400) * 4;
            ctx.save();
            ctx.strokeStyle = '#22ddee';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.jj.x, this.jj.y, 22 + pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (this.larry && this.larry.alive) {
            const pulse = Math.sin(Date.now() / 400) * 4;
            ctx.save();
            ctx.strokeStyle = '#88ddff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.larry.x, this.larry.y, 22 + pulse, 0, Math.PI * 2);
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
