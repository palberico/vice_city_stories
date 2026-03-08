// ============================================
// VEHICLE SYSTEM
// ============================================
const VEHICLE_TYPES = {
    // spriteRot: rotation offset to align sprite "up" direction with angle=0 (right)
    // Sprites with front at BOTTOM of image: -PI/2 (sports)
    // Sprites with front at TOP of image: +PI/2 (sedan, police, motorcycle)
    sports: { name: 'Infernus', topSpeed: 393, accel: 280, handling: 3.0, braking: 350, w: 30, h: 55, color: '#cc2222', img: 'car_sports', spriteRot: -Math.PI / 2 },
    sedan: { name: 'Admiral', topSpeed: 262, accel: 200, handling: 2.5, braking: 300, w: 28, h: 52, color: '#eeeecc', img: 'car_sedan', spriteRot: Math.PI / 2 },
    police: { name: 'Police', topSpeed: 349, accel: 260, handling: 2.8, braking: 340, w: 30, h: 55, color: '#222244', img: 'car_police', spriteRot: Math.PI / 2 },
    motorcycle: { name: 'PCJ-600', topSpeed: 480, accel: 320, handling: 4.0, braking: 250, w: 14, h: 30, color: '#333333', img: 'motorcycle', spriteRot: Math.PI / 2 },
    helicopter: { name: 'Maverick', topSpeed: 349, accel: 150, handling: 1.5, braking: 100, w: 40, h: 40, color: '#990000', img: null, spriteRot: 0 }
};

class Vehicle {
    constructor(x, y, type, images) {
        this.x = x; this.y = y;
        this.type = type;
        const spec = VEHICLE_TYPES[type];
        this.name = spec.name;
        this.topSpeed = spec.topSpeed;
        this.accel = spec.accel;
        this.handling = spec.handling;
        this.braking = spec.braking;
        this.w = spec.w;
        this.h = spec.h;
        this.color = spec.color;
        this.spriteRot = spec.spriteRot;
        this.angle = 0;
        this.speed = 0;
        this.health = 100;
        this.driver = null;
        this.img = images[spec.img] || null;
        this.engineSoundTimer = 0;
        this.isPolicePatrol = false;
        this.isRepoTarget = false; // special mission car
        this.rotorAngle = 0; // for helicopter
        this.idleTimer = 0; // Tracks consecutive seconds of being stopped

        // NPC AI driving
        this.ai = {
            active: type !== 'helicopter', // helicopters sit parked until player enters
            targetSpeed: 60 + Math.random() * 80,
            turnTimer: 0,
            turnInterval: 3 + Math.random() * 5,
            stopped: false,
            stopTimer: 0,
            innerLane: Math.random() > 0.5
        };
    }

    update(dt, world, input, isPlayerDriving, player, allVehicles) {
        if (isPlayerDriving && this.driver) {
            // ---- PLAYER DRIVING ----
            if (input.isDown('w') || input.isDown('arrowup')) {
                this.speed += this.accel * dt;
            } else if (input.isDown('s') || input.isDown('arrowdown')) {
                this.speed -= this.braking * dt;
            } else {
                this.speed *= (1 - 1.5 * dt);
            }
            this.speed = Math.max(-this.topSpeed * 0.3, Math.min(this.topSpeed, this.speed));

            if (Math.abs(this.speed) > 10) {
                const steerFactor = this.handling * dt * (this.speed > 0 ? 1 : -1);
                if (input.isDown('a') || input.isDown('arrowleft')) this.angle -= steerFactor;
                if (input.isDown('d') || input.isDown('arrowright')) this.angle += steerFactor;
            }
            if (input.isDown(' ') && Math.abs(this.speed) > 50) {
                this.speed *= 0.95;
            }

            // Vehicle-vehicle collision when player is driving
            if (allVehicles) {
                for (const other of allVehicles) {
                    if (other === this) continue;
                    if (this.checkVehicleCollision(other)) {
                        this.resolveVehicleCrash(other, dt);
                    }
                }
            }
        } else if (!this.driver && this.ai.active) {
            // ---- NPC AI DRIVING ----
            this.updateAI(dt, world, player, allVehicles);
        } else if (!this.driver) {
            this.speed *= (1 - 3 * dt);
            if (Math.abs(this.speed) < 1) this.speed = 0;
        }

        // Apply movement
        if (this.type === 'helicopter') {
            // Helicopters ignore water and buildings
            if (this.driver || Math.abs(this.speed) > 1) {
                this.x += Math.cos(this.angle) * this.speed * dt;
                this.y += Math.sin(this.angle) * this.speed * dt;
                // Clamp helicopter to map boundaries strictly
                this.x = Math.max(20, Math.min(WORLD_PX_W - 20, this.x));
                this.y = Math.max(20, Math.min(WORLD_PX_H - 20, this.y));
            }
            // Rotor spin
            if (this.driver) {
                // Spin fast when driving
                this.rotorAngle += 20 * dt;
            } else if (Math.abs(this.speed) > 5) {
                // Spin medium when coasting after exit
                this.rotorAngle += 10 * dt;
            } else {
                // Spin slowly to a stop
                this.rotorAngle += 2 * dt * (this.speed / 5);
            }
        } else if (Math.abs(this.speed) > 0.5) {
            const vx = Math.cos(this.angle) * this.speed * dt;
            const vy = Math.sin(this.angle) * this.speed * dt;
            const newX = this.x + vx;
            const newY = this.y + vy;

            if (newX > 0 && newX < WORLD_PX_W && newY > 0 && newY < WORLD_PX_H) {
                const bCol = world.checkBuildingCollision(newX - this.w / 2, newY - this.h / 2, this.w, this.h);
                if (bCol) {
                    this.speed *= -0.3;
                    this.health -= Math.abs(this.speed) * 0.02;
                    if (!this.driver) {
                        this.angle += Math.PI;
                        this.speed = 0;
                    }
                } else {
                    // For NPC: only move if staying on road
                    if (!this.driver && this.ai.active) {
                        const newTile = world.getTile(newX, newY);
                        const isRoadTile = (newTile === T.ROAD || newTile === T.CROSSWALK || newTile === T.INTERSECTION);
                        if (isRoadTile) {
                            this.x = newX;
                            this.y = newY;
                        } else {
                            this.speed *= 0.5;
                            this.angle += Math.PI / 2;
                        }
                    } else {
                        this.x = newX;
                        this.y = newY;
                    }
                }
                if (world.getTile(this.x, this.y) === T.WATER) {
                    this.speed *= 0.9;
                    this.health -= dt * 20;
                }
            } else {
                // NPC vehicles reaching north edge: despawn and respawn elsewhere
                if (!this.driver && this.ai.active && newY <= 0) {
                    const spawn = world.getRandomVehicleSpawn();
                    if (spawn) {
                        this.x = spawn.x;
                        this.y = spawn.y;
                        this.angle = spawn.angle;
                        this.speed = 0;
                    }
                } else {
                    this.speed *= -0.5;
                    if (!this.driver) this.angle += Math.PI;
                }
            }
        }
    }

    checkVehicleCollision(other) {
        if (this.type === 'helicopter' || other.type === 'helicopter') return false;
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (this.w + other.w) / 2 + 5;
        return dist < minDist;
    }

    resolveVehicleCrash(other, dt) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = (this.w + other.w) / 2 + 5;
        const overlap = minDist - dist;

        if (overlap > 0) {
            // Push apart
            const nx = dx / dist;
            const ny = dy / dist;
            this.x += nx * overlap * 0.5;
            this.y += ny * overlap * 0.5;
            other.x -= nx * overlap * 0.5;
            other.y -= ny * overlap * 0.5;

            // Damage based on speed difference
            const impactSpeed = Math.abs(this.speed) + Math.abs(other.speed);
            const damage = impactSpeed * 0.05;
            this.health -= damage * 0.5;
            other.health -= damage;

            // Transfer momentum
            const thisSpeed = this.speed;
            this.speed *= 0.3;
            other.speed = thisSpeed * 0.4;
            other.angle = this.angle + (Math.random() - 0.5) * 0.3;
        }
    }

    updateAI(dt, world, player, allVehicles) {
        // Lane-based driving system
        // Right-hand traffic rules:
        // Horizontal: LEFT (angle≈π) → lanes 0-1 (top), RIGHT (angle≈0) → lanes 2-3 (bottom)
        // Vertical: UP (angle≈-π/2) → lanes 2-3 (right), DOWN (angle≈π/2) → lanes 0-1 (left)

        const roadInfo = world.getRoadInfo(this.x, this.y);

        // Check for obstacles ahead (braking)
        const lookDist = 70 + Math.abs(this.speed) * 0.3;
        let obstacle = false;

        if (player && player.alive && !player.inVehicle) {
            // Police bypass braking for players on foot if they have a wanted level (to run them over)
            let willRamPlayer = (this.type === 'police' && player.wantedLevel > 0);

            if (!willRamPlayer) {
                const directDist = Collision.dist(this.x, this.y, player.x, player.y);
                if (directDist < lookDist) {
                    const toP = Math.atan2(player.y - this.y, player.x - this.x);
                    let diff = toP - this.angle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    if (Math.abs(diff) < Math.PI / 3) obstacle = true;
                }
            }
        }

        if (!obstacle && player && player.inVehicle) {
            const directDist = Collision.dist(this.x, this.y, player.inVehicle.x, player.inVehicle.y);
            if (directDist < lookDist + 20) {
                const toP = Math.atan2(player.inVehicle.y - this.y, player.inVehicle.x - this.x);
                let diff = toP - this.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                if (Math.abs(diff) < Math.PI / 3) obstacle = true;
            }
        }

        if (!obstacle && allVehicles) {
            for (const other of allVehicles) {
                if (other === this) continue;
                const d = Collision.dist(this.x, this.y, other.x, other.y);
                if (d < 90 && d > 5) {
                    const toO = Math.atan2(other.y - this.y, other.x - this.x);
                    let diff = toO - this.angle;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    if (Math.abs(diff) < Math.PI / 4) {
                        obstacle = true;
                        break;
                    }
                }
            }
        }

        if (obstacle) {
            this.speed *= (1 - 6 * dt);
            if (Math.abs(this.speed) < 3) {
                this.speed = 0;
                // Accumulate idle time if stuck
                if (!this.isRepoTarget) {
                    this.idleTimer += dt;
                    if (this.idleTimer >= 10) {
                        this.health = 0; // Triggers despawn in engine.js
                    }
                }
            } else {
                this.idleTimer = 0; // Reset if inching forward
            }
            this.ai.stopped = true;
            this.ai.stopTimer += dt;
            // Try reversing if stuck recently
            if (this.speed === 0 && this.ai.stopTimer > 2) {
                this.speed = -30;
                this.idleTimer = 0; // Reset timer when taking evasive action
            }
        } else {
            this.idleTimer = 0; // Clear idle timer when clear
            this.ai.stopped = false;
            this.ai.stopTimer = 0;
        }

        // Determine current direction from angle
        // Normalize angle to [0, 2π)
        let normAngle = ((this.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        let dir; // 'right', 'down', 'left', 'up'
        if (normAngle < Math.PI / 4 || normAngle > Math.PI * 7 / 4) dir = 'right';
        else if (normAngle < Math.PI * 3 / 4) dir = 'down';
        else if (normAngle < Math.PI * 5 / 4) dir = 'left';
        else dir = 'up';

        // Get the correct lane center based on direction
        // Lane rules (right-hand traffic):
        // RIGHT → horizontal road, lanes 2-3 (bottom half)
        // LEFT  → horizontal road, lanes 0-1 (top half)
        // DOWN  → vertical road, lanes 0-1 (left half)
        // UP    → vertical road, lanes 2-3 (right half)
        const RW = world.ROAD_WIDTH;

        if (roadInfo) {
            if (roadInfo.type === 'v') {
                // On a vertical road — snap X to correct lane, keep angle vertical
                let targetLane;
                if (dir === 'down') {
                    targetLane = this.ai.innerLane ? 1 : 0; // lane 0 or 1
                    this.angle = Math.PI / 2;
                } else {
                    targetLane = this.ai.innerLane ? 2 : 3; // lane 2 or 3
                    this.angle = -Math.PI / 2;
                    dir = 'up';
                }
                const targetX = world.getLaneCenter('v', roadInfo.roadStart, targetLane);
                // Smoothly steer toward lane center
                this.x += (targetX - this.x) * Math.min(1, 5 * dt);

            } else if (roadInfo.type === 'h') {
                // On a horizontal road — snap Y to correct lane, keep angle horizontal
                let targetLane;
                if (dir === 'right') {
                    targetLane = this.ai.innerLane ? 2 : 3; // lane 2 or 3
                    this.angle = 0;
                } else {
                    targetLane = this.ai.innerLane ? 1 : 0; // lane 0 or 1
                    this.angle = Math.PI;
                    dir = 'left';
                }
                const targetY = world.getLaneCenter('h', roadInfo.roadStart, targetLane);
                this.y += (targetY - this.y) * Math.min(1, 5 * dt);

            } else if (roadInfo.type === 'intersection') {
                // At an intersection — decide to turn or go straight
                let forceTurn = false;
                let banLeft = false;
                let banDown = false;

                // West edge check
                if (dir === 'left' && roadInfo.vRoad === world.roadPositions.v[0]) {
                    const centerX = (roadInfo.vRoad + RW / 2) * TILE;
                    if (this.x <= centerX) {
                        forceTurn = true;
                        banLeft = true;
                    }
                }
                // South edge check
                if (dir === 'down' && roadInfo.hRoad === world.roadPositions.h[world.roadPositions.h.length - 1]) {
                    const centerY = (roadInfo.hRoad + RW / 2) * TILE;
                    if (this.y >= centerY) {
                        forceTurn = true;
                        banDown = true;
                    }
                }

                this.ai.turnTimer += dt;
                if (this.ai.turnTimer >= this.ai.turnInterval || forceTurn) {
                    this.ai.turnTimer = 0;
                    this.ai.turnInterval = 2 + Math.random() * 4;

                    // Choose a new direction (including current direction for going straight)
                    const choices = ['right', 'down', 'left', 'up'];
                    // Don't reverse direction unless absolutely stuck
                    const opposite = { right: 'left', left: 'right', up: 'down', down: 'up' };
                    let validChoices = choices.filter(c => c !== opposite[dir]);

                    if (banLeft || (roadInfo.vRoad === world.roadPositions.v[0])) {
                        validChoices = validChoices.filter(c => c !== 'left');
                    }
                    if (banDown || (roadInfo.hRoad === world.roadPositions.h[world.roadPositions.h.length - 1])) {
                        validChoices = validChoices.filter(c => c !== 'down');
                    }
                    if (validChoices.length === 0) validChoices = ['up', 'right'];

                    const newDir = validChoices[Math.floor(Math.random() * validChoices.length)];

                    // Set angle and snap to correct lane for new direction
                    if (newDir === 'right') {
                        this.angle = 0;
                        const targetY = world.getLaneCenter('h', roadInfo.hRoad, this.ai.innerLane ? 2 : 3);
                        this.y = targetY;
                    } else if (newDir === 'left') {
                        this.angle = Math.PI;
                        const targetY = world.getLaneCenter('h', roadInfo.hRoad, this.ai.innerLane ? 1 : 0);
                        this.y = targetY;
                    } else if (newDir === 'down') {
                        this.angle = Math.PI / 2;
                        const targetX = world.getLaneCenter('v', roadInfo.vRoad, this.ai.innerLane ? 1 : 0);
                        this.x = targetX;
                    } else if (newDir === 'up') {
                        this.angle = -Math.PI / 2;
                        const targetX = world.getLaneCenter('v', roadInfo.vRoad, this.ai.innerLane ? 2 : 3);
                        this.x = targetX;
                    }
                }
                // While in intersection, maintain current direction/speed
            }
        } else {
            // Off any road — steer back to nearest road
            this.speed *= 0.85;
            const checkDist = TILE * 3;
            let bestDist = Infinity;
            let bestAngle = this.angle;

            for (const vx of world.roadPositions.v) {
                const roadCenterX = (vx + 1) * TILE + TILE / 2;
                const d = Math.abs(this.x - roadCenterX);
                if (d < bestDist) {
                    bestDist = d;
                    bestAngle = this.x > roadCenterX ? Math.PI : 0;
                }
            }
            for (const hy of world.roadPositions.h) {
                const roadCenterY = (hy + 1) * TILE + TILE / 2;
                const d = Math.abs(this.y - roadCenterY);
                if (d < bestDist) {
                    bestDist = d;
                    bestAngle = this.y > roadCenterY ? -Math.PI / 2 : Math.PI / 2;
                }
            }
            this.angle = bestAngle;
            if (this.speed < 30) this.speed = 30;
        }

        // Accelerate to target speed
        if (this.speed < this.ai.targetSpeed) {
            this.speed += this.accel * 0.25 * dt;
        } else {
            this.speed *= (1 - 1 * dt);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Use per-type rotation offset so each sprite faces the right way
        ctx.rotate(this.angle + this.spriteRot);

        if (this.img && this.img.complete) {
            let scale = Math.max(this.w / this.img.width, this.h / this.img.height) * 2.2;
            if (this.type === 'motorcycle') scale *= 0.7;
            ctx.drawImage(this.img, -this.img.width * scale / 2, -this.img.height * scale / 2, this.img.width * scale, this.img.height * scale);
        } else if (this.type === 'helicopter') {
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(5, 5, 25, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Fuselage setup
            // Angle 0 faces right.
            // Main body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, 22, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#550000';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Cockpit glass (front facing right)
            ctx.fillStyle = 'rgba(150, 200, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(10, 0, 8, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tail boom (stretching left)
            ctx.fillStyle = this.color;
            ctx.fillRect(-35, -2, 20, 4);

            // Tail rotor
            ctx.fillStyle = '#666';
            ctx.save();
            ctx.translate(-35, 0);
            ctx.rotate(this.rotorAngle * 2.5);
            ctx.fillRect(-6, -1, 12, 2);
            ctx.restore();

            // Main rotor
            ctx.save();
            ctx.rotate(this.rotorAngle);
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-35, 0);
            ctx.lineTo(35, 0);
            ctx.moveTo(0, -35);
            ctx.lineTo(0, 35);
            ctx.stroke();
            // Rotor blur
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(0, 0, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            ctx.fillStyle = 'rgba(150,200,255,0.6)';
            ctx.fillRect(-this.w / 2 + 4, -this.h / 2 + 5, this.w - 8, 10);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(-this.w / 2, this.h / 2 - 5, 6, 4);
            ctx.fillRect(this.w / 2 - 6, this.h / 2 - 5, 6, 4);
        }

        // Brake lights when NPC stopped
        if (this.ai.stopped && !this.driver) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.9)';
            ctx.fillRect(-this.w / 2, this.h / 2 - 6, 7, 5);
            ctx.fillRect(this.w / 2 - 7, this.h / 2 - 6, 7, 5);
        }

        // Repo target glow
        if (this.isRepoTarget) {
            ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.strokeRect(-this.w / 2 - 5, -this.h / 2 - 5, this.w + 10, this.h + 10);
            ctx.setLineDash([]);
        }

        ctx.restore();

        // Health bar if damaged
        if (this.health < 100) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 20, this.y - this.h / 2 - 12, 40, 4);
            ctx.fillStyle = this.health > 50 ? '#00cc00' : this.health > 25 ? '#cccc00' : '#cc0000';
            ctx.fillRect(this.x - 20, this.y - this.h / 2 - 12, 40 * (this.health / 100), 4);
        }
    }

    getBounds() {
        return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
    }
}
