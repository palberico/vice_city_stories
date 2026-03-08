// ============================================
// MISSION SYSTEM
// ============================================
const MISSION_DATA = [
    {
        id: 'first_ride',
        name: 'First Ride',
        description: 'Steal a car and drive it to the safehouse.',
        reward: 500,
        steps: [
            { type: 'enter_vehicle', text: 'Find and enter a vehicle', radius: 0 },
            { type: 'drive_to', text: 'Drive to the safehouse', targetTile: { x: 34, y: 20 }, radius: 100 }
        ]
    },
    {
        id: 'the_pickup',
        name: 'The Pickup',
        description: 'Collect a package from the docks and deliver it.',
        reward: 1000,
        steps: [
            { type: 'go_to', text: 'Go to the pickup point', targetTile: { x: 10, y: 28 }, radius: 80 },
            { type: 'go_to', text: 'Deliver the package', targetTile: { x: 46, y: 20 }, radius: 80 }
        ]
    },
    {
        id: 'repo_job',
        name: 'Repo Job',
        description: 'Steal the marked sports car and bring it to the garage.',
        reward: 1500,
        steps: [
            { type: 'go_to', text: 'Go to the target vehicle', targetTile: { x: 46, y: 38 }, radius: 120 },
            { type: 'enter_repo_vehicle', text: 'Steal the marked car', radius: 0 },
            { type: 'drive_to', text: 'Deliver it to the garage', targetTile: { x: 22, y: 32 }, radius: 100 }
        ]
    },
    {
        id: 'street_race',
        name: 'Street Race',
        description: 'Race through the city checkpoints!',
        reward: 2000,
        steps: [
            { type: 'enter_vehicle', text: 'Get in a fast car', radius: 0 },
            { type: 'drive_to', text: 'Checkpoint 1', targetTile: { x: 22, y: 20 }, radius: 100 },
            { type: 'drive_to', text: 'Checkpoint 2', targetTile: { x: 46, y: 32 }, radius: 100 },
            { type: 'drive_to', text: 'Checkpoint 3', targetTile: { x: 58, y: 20 }, radius: 100 },
            { type: 'drive_to', text: 'FINISH LINE', targetTile: { x: 34, y: 44 }, radius: 100 }
        ]
    },
    {
        id: 'the_heist',
        name: 'The Heist',
        description: 'Rob the store and escape the police!',
        reward: 5000,
        steps: [
            { type: 'go_to', text: 'Go to the store', targetTile: { x: 46, y: 32 }, radius: 80 },
            { type: 'shoot', text: 'Rob the store (shoot inside)', targetTile: { x: 46, y: 32 }, radius: 120 },
            { type: 'enter_vehicle', text: 'Get to a getaway car', radius: 0 },
            { type: 'drive_to', text: 'Escape to the safehouse', targetTile: { x: 22, y: 56 }, radius: 120 }
        ]
    }
];

class MissionSystem {
    constructor() {
        this.missions = MISSION_DATA.map(m => ({ ...m, completed: false, available: true }));
        this.activeMission = null;
        this.currentStep = 0;
        this.missionMarkers = [];
        this.missionMessage = '';
        this.messageTimer = 0;
        this.repoVehicle = null; // special car for repo mission
        this.setupMarkers();
    }

    setupMarkers() {
        this.missionMarkers = [];
        const startPositions = [
            { x: 12, y: 10 }, { x: 22, y: 20 }, { x: 32, y: 10 },
            { x: 42, y: 20 }, { x: 52, y: 10 }
        ];
        for (let i = 0; i < this.missions.length; i++) {
            if (!this.missions[i].completed && this.missions[i].available) {
                const pos = startPositions[i];
                this.missionMarkers.push({
                    x: pos.x * TILE, y: pos.y * TILE,
                    missionIndex: i, radius: 50
                });
            }
        }
    }

    spawnRepoVehicle(vehicles, images) {
        // Spawn a special sports car at the repo target location (must perfectly match targetTile from mission data)
        const tx = 46 * TILE;
        const ty = 38 * TILE;
        const repoCar = new Vehicle(tx, ty, 'sports', images);
        repoCar.isRepoTarget = true;
        repoCar.ai.active = false; // parked, don't drive
        repoCar.speed = 0;
        repoCar.angle = Math.PI / 4; // angled parking
        this.repoVehicle = repoCar;
        vehicles.push(repoCar);
    }

    removeRepoVehicle(vehicles) {
        if (this.repoVehicle) {
            this.repoVehicle.isRepoTarget = false;
            this.repoVehicle = null;
        }
    }

    update(dt, player, audio, vehicles, images) {
        this.messageTimer = Math.max(0, this.messageTimer - dt);

        if (!this.activeMission) {
            // Check if player is near a mission marker
            for (const marker of this.missionMarkers) {
                if (Collision.dist(player.x, player.y, marker.x, marker.y) < marker.radius) {
                    this.startMission(marker.missionIndex, audio, vehicles, images);
                    break;
                }
            }
        } else {
            // Update active mission
            const step = this.activeMission.steps[this.currentStep];
            if (!step) {
                this.completeMission(player, audio, vehicles);
                return;
            }

            let completed = false;
            switch (step.type) {
                case 'go_to':
                    if (step.targetTile) {
                        const tx = step.targetTile.x * TILE;
                        const ty = step.targetTile.y * TILE;
                        if (Collision.dist(player.x, player.y, tx, ty) < step.radius) {
                            completed = true;
                        }
                    }
                    break;
                case 'enter_vehicle':
                    if (player.inVehicle) completed = true;
                    break;
                case 'enter_repo_vehicle':
                    // Must enter the specific repo car
                    if (player.inVehicle && player.inVehicle.isRepoTarget) {
                        completed = true;
                    }
                    break;
                case 'drive_to':
                    if (player.inVehicle && step.targetTile) {
                        const tx = step.targetTile.x * TILE;
                        const ty = step.targetTile.y * TILE;
                        if (Collision.dist(player.x, player.y, tx, ty) < step.radius) {
                            completed = true;
                        }
                    }
                    break;
                case 'shoot':
                    if (step.targetTile) {
                        const tx = step.targetTile.x * TILE;
                        const ty = step.targetTile.y * TILE;
                        if (Collision.dist(player.x, player.y, tx, ty) < step.radius && player.weapons.fireCooldown > 0) {
                            completed = true;
                            player.addWanted(3, audio);
                        }
                    }
                    break;
            }

            if (completed) {
                this.currentStep++;
                if (this.currentStep >= this.activeMission.steps.length) {
                    this.completeMission(player, audio, vehicles);
                } else {
                    this.showMessage(this.activeMission.steps[this.currentStep].text);
                    audio.playPickup();
                }
            }
        }
    }

    startMission(index, audio, vehicles, images) {
        this.activeMission = this.missions[index];
        this.currentStep = 0;
        this.showMessage(`MISSION: ${this.activeMission.name} — ${this.activeMission.description}`);
        audio.playPickup();

        // Spawn repo vehicle if this is the repo job
        if (this.activeMission.id === 'repo_job') {
            this.spawnRepoVehicle(vehicles, images);
        }
    }

    completeMission(player, audio, vehicles) {
        player.money += this.activeMission.reward;
        this.showMessage(`MISSION COMPLETE: ${this.activeMission.name}! +$${this.activeMission.reward}`);

        // Clean up repo vehicle
        if (this.activeMission.id === 'repo_job') {
            this.removeRepoVehicle(vehicles);
        }

        this.activeMission.completed = true;
        this.activeMission = null;
        this.currentStep = 0;
        this.setupMarkers();
        audio.playMissionComplete();
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

    drawMarkers(ctx) {
        // Mission start markers (yellow circles with M)
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

        // Active mission target marker (orange circle)
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
            ctx.fillText('★', target.x, target.y);
            ctx.restore();
        }

        // Repo vehicle marker (pulsing orange circle around the car)
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
            ctx.fillText('REPO', this.repoVehicle.x, this.repoVehicle.y - this.repoVehicle.h / 2 - 15);
            ctx.restore();
        }
    }
}
