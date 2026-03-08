// ============================================
// POLICE AI SYSTEM
// ============================================
class PoliceUnit {
    constructor(x, y, vehicle) {
        this.x = x; this.y = y;
        this.vehicle = vehicle;
        this.onFoot = false;
        this.health = 100;
        this.alive = true;
        this.shootTimer = 0;
        this.angle = 0;
        this.speed = 0;
        this.patrolling = true;
        this.bailed = false;    // true once officers have bailed out of a destroyed vehicle
        this.avoidTimer = 0;    // when > 0, steer away from building instead of chasing
        this.avoidDir = 1;      // +1 or -1: which way to turn during avoidance
    }
}

class PoliceHelicopter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.angle = 0;
        this.altitude = 0;
        this.rotorAngle = 0;
        this.health = 200;
        this.alive = true;
        this.shootTimer = 0;
        this.spotlightAngle = 0;
        this.speed = 250;
    }

    update(dt, player, audio, particles) {
        if (!this.alive) return;

        // Follow player with slight lag
        this.targetX = player.x + Math.sin(Date.now() / 2000) * 100;
        this.targetY = player.y + Math.cos(Date.now() / 2000) * 100;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }

        this.x = Math.max(100, Math.min(WORLD_PX_W - 100, this.x));
        this.y = Math.max(100, Math.min(WORLD_PX_H - 100, this.y));

        this.rotorAngle += 15 * dt;
        this.spotlightAngle += 0.8 * dt;

        // Shoot at player
        this.shootTimer -= dt;
        const playerDist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
        if (this.shootTimer <= 0 && playerDist < 500) {
            const bulletAngle = Math.atan2(player.y - this.y, player.x - this.x) + (Math.random() - 0.5) * 0.3;
            const bullet = new Bullet(this.x, this.y, bulletAngle, 600, 8, 'police');
            player.weapons.bullets.push(bullet);
            audio.playGunshot();
            this.shootTimer = 0.5;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        // Shadow on ground
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 15, 35, 20, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Spotlight cone
        ctx.save();
        const spotX = this.x + Math.cos(this.spotlightAngle) * 40;
        const spotY = this.y + Math.sin(this.spotlightAngle) * 40;
        const gradient = ctx.createRadialGradient(spotX, spotY, 5, spotX, spotY, 80);
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.15)');
        gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(spotX, spotY, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.fillStyle = '#1a1a3a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333366';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-5, 0, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a3a';
        ctx.fillRect(15, -3, 20, 6);

        ctx.fillStyle = '#555';
        ctx.save();
        ctx.translate(35, 0);
        ctx.rotate(this.rotorAngle * 3);
        ctx.fillRect(-6, -1, 12, 2);
        ctx.restore();

        ctx.save();
        ctx.rotate(this.rotorAngle);
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-30, 0); ctx.lineTo(30, 0);
        ctx.moveTo(0, -30); ctx.lineTo(0, 30);
        ctx.stroke();
        ctx.fillStyle = 'rgba(150, 150, 150, 0.08)';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('POLICE', 0, 3);

        const t = Date.now() / 150;
        ctx.fillStyle = Math.sin(t) > 0 ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,255,0.8)';
        ctx.beginPath();
        ctx.arc(0, -10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = Math.sin(t) > 0 ? 'rgba(0,0,255,0.8)' : 'rgba(255,0,0,0.8)';
        ctx.beginPath();
        ctx.arc(0, 10, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (this.health < 200) {
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - 25, this.y - 25, 50, 4);
            ctx.fillStyle = this.health > 100 ? '#00cc00' : this.health > 50 ? '#cccc00' : '#cc0000';
            ctx.fillRect(this.x - 25, this.y - 25, 50 * (this.health / 200), 4);
        }
    }
}

class PoliceSystem {
    constructor() {
        this.units = [];
        this.patrolUnits = [];
        this.helicopter = null;
        this.sirenTimer = 0;
        this.spawnTimer = 0;
        this.patrolSpawned = false;
        this.heliSoundTimer = 0;
    }

    spawnPatrolCars(world, vehicles, images) {
        if (this.patrolSpawned) return;
        this.patrolSpawned = true;

        const patrolCount = 3 + Math.floor(Math.random() * 2);
        const spawnPoints = world.spawnPoints;

        for (let i = 0; i < patrolCount && spawnPoints.length > 0; i++) {
            const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
            const vehicle = new Vehicle(sp.x, sp.y, 'police', images);
            vehicle.isPolicePatrol = true;
            vehicle.ai.targetSpeed = 50 + Math.random() * 40;
            vehicle.ai.active = true;
            vehicle.angle = [0, Math.PI / 2, Math.PI, -Math.PI / 2][Math.floor(Math.random() * 4)];
            vehicles.push(vehicle);

            const unit = new PoliceUnit(sp.x, sp.y, vehicle);
            unit.patrolling = true;
            this.patrolUnits.push(unit);
        }
    }

    // Shared helper: move a police vehicle toward the player, with unstuck avoidance
    _driveToward(unit, targetX, targetY, speedFactor, world, dt) {
        const v = unit.vehicle;
        const dx = targetX - v.x;
        const dy = targetY - v.y;
        const chaseAngle = Math.atan2(dy, dx);

        if (unit.avoidTimer > 0) {
            // Steer in a consistent direction until clear — don't reset mid-avoid
            unit.avoidTimer -= dt;
            v.angle += unit.avoidDir * 1.8 * dt;
            v.speed = Math.min(v.topSpeed * 0.35, v.speed + v.accel * dt);
        } else {
            let angleDiff = chaseAngle - v.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            v.angle += angleDiff * 3 * dt;
            v.speed = Math.min(v.topSpeed * speedFactor, v.speed + v.accel * dt);
        }

        const vx = Math.cos(v.angle) * v.speed * dt;
        const vy = Math.sin(v.angle) * v.speed * dt;
        const newX = v.x + vx;
        const newY = v.y + vy;

        if (newX > 0 && newX < WORLD_PX_W && newY > 0 && newY < WORLD_PX_H) {
            const bCol = world.checkBuildingCollision(newX - v.w / 2, newY - v.h / 2, v.w, v.h);
            if (!bCol) {
                v.x = newX;
                v.y = newY;
            } else if (unit.avoidTimer <= 0) {
                // Only start avoidance when not already avoiding — prevents spin loops
                v.speed *= -0.3;
                unit.avoidDir = Math.random() > 0.5 ? 1 : -1;
                unit.avoidTimer = 2.5;
            }
        }
    }

    // Spawn two foot officers bailing from a destroyed vehicle
    _bailOut(unit) {
        unit.bailed = true;
        unit.vehicle.isWreck = true;

        for (let i = 0; i < 2; i++) {
            const side = (i === 0 ? 1 : -1) * 35;
            const fu = new PoliceUnit(
                unit.vehicle.x + Math.cos(unit.vehicle.angle + Math.PI / 2) * side,
                unit.vehicle.y + Math.sin(unit.vehicle.angle + Math.PI / 2) * side,
                null
            );
            fu.onFoot = true;
            fu.patrolling = false;
            this.units.push(fu);
        }
    }

    update(dt, player, world, vehicles, images, audio, particles) {
        this.spawnPatrolCars(world, vehicles, images);

        // ---- Patrol units ----
        for (const unit of this.patrolUnits) {
            if (!unit.alive || !unit.vehicle) continue;
            unit.x = unit.vehicle.x;
            unit.y = unit.vehicle.y;

            // Bail out if patrol car was destroyed
            if (unit.vehicle.health <= 0 && !unit.bailed) {
                this._bailOut(unit);
                continue;
            }
            if (unit.vehicle.health <= 0) continue;

            if (player.wantedLevel >= 1) {
                unit.patrolling = false;
                const dx = player.x - unit.x;
                const dy = player.y - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 800) {
                    unit.vehicle.ai.active = false;
                    this._driveToward(unit, player.x, player.y, 0.7, world, dt);
                    unit.x = unit.vehicle.x;
                    unit.y = unit.vehicle.y;

                    if (dist < 400 && dist > 50) {
                        unit.shootTimer -= dt;
                        if (unit.shootTimer <= 0) {
                            const chaseAngle = Math.atan2(player.y - unit.y, player.x - unit.x);
                            const bulletAngle = chaseAngle + (Math.random() - 0.5) * 0.2;
                            const bullet = new Bullet(unit.x, unit.y, bulletAngle, 500, 10, 'police');
                            player.weapons.bullets.push(bullet);
                            audio.playGunshot();
                            particles.muzzleFlash(unit.x + Math.cos(bulletAngle) * 15, unit.y + Math.sin(bulletAngle) * 15, bulletAngle);
                            unit.shootTimer = 0.8 - player.wantedLevel * 0.05;
                        }
                    }

                    if (dist < 50 && player.inVehicle) {
                        player.inVehicle.health -= dt * 15;
                        unit.vehicle.speed *= 0.5;
                    }
                } else {
                    unit.vehicle.ai.active = true;
                }
            } else {
                unit.patrolling = true;
                unit.vehicle.ai.active = true;
                unit.vehicle.ai.targetSpeed = 50 + Math.random() * 40;
            }
        }

        // ---- Chase units ----
        if (player.wantedLevel <= 0) {
            // Clean up all chase units and their vehicles
            for (const unit of this.units) {
                if (unit.vehicle) {
                    const idx = vehicles.indexOf(unit.vehicle);
                    if (idx >= 0) vehicles.splice(idx, 1);
                }
            }
            this.units = [];
            this.helicopter = null;
        } else {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.units.filter(u => !u.onFoot).length < player.wantedLevel * 2) {
                this.spawnChaseUnit(player, world, vehicles, images);
                this.spawnTimer = 5 - player.wantedLevel * 0.5;
            }

            this.sirenTimer -= dt;
            if (this.sirenTimer <= 0 && (this.units.length > 0 || this.patrolUnits.some(u => !u.patrolling))) {
                audio.playSiren();
                this.sirenTimer = 2;
            }

            if (player.wantedLevel >= 5 && !this.helicopter) {
                const angle = Math.random() * Math.PI * 2;
                this.helicopter = new PoliceHelicopter(
                    player.x + Math.cos(angle) * 500,
                    player.y + Math.sin(angle) * 500
                );
            }

            if (this.helicopter && this.helicopter.alive) {
                this.helicopter.update(dt, player, audio, particles);
                this.heliSoundTimer -= dt;
                if (this.heliSoundTimer <= 0) {
                    audio.playHeliSound();
                    this.heliSoundTimer = 0.3;
                }
            }

            for (const unit of this.units) {
                if (!unit.alive) continue;

                // ---- On-foot officers (bailed from destroyed car) ----
                if (unit.onFoot) {
                    const dx = player.x - unit.x;
                    const dy = player.y - unit.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    unit.angle = Math.atan2(dy, dx);

                    // Walk toward player
                    if (dist > 50) {
                        const footSpeed = 120;
                        const nx = unit.x + Math.cos(unit.angle) * footSpeed * dt;
                        const ny = unit.y + Math.sin(unit.angle) * footSpeed * dt;
                        if (world.isWalkable(nx, ny)) { unit.x = nx; unit.y = ny; }
                    }

                    // Shoot at player
                    if (dist < 400 && dist > 40) {
                        unit.shootTimer -= dt;
                        if (unit.shootTimer <= 0) {
                            const bulletAngle = unit.angle + (Math.random() - 0.5) * 0.25;
                            const bullet = new Bullet(unit.x, unit.y, bulletAngle, 500, 10, 'police');
                            player.weapons.bullets.push(bullet);
                            audio.playGunshot();
                            particles.muzzleFlash(unit.x + Math.cos(bulletAngle) * 15, unit.y + Math.sin(bulletAngle) * 15, bulletAngle);
                            unit.shootTimer = 1.0;
                        }
                    }

                    unit.x = Math.max(10, Math.min(WORLD_PX_W - 10, unit.x));
                    unit.y = Math.max(10, Math.min(WORLD_PX_H - 10, unit.y));
                    continue;
                }

                // ---- Vehicle officers ----
                const dx = player.x - unit.x;
                const dy = player.y - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Bail out if vehicle was destroyed
                if (unit.vehicle && unit.vehicle.health <= 0 && !unit.bailed) {
                    this._bailOut(unit);
                    continue;
                }

                if (unit.vehicle && unit.vehicle.health > 0) {
                    this._driveToward(unit, player.x, player.y, 0.8, world, dt);
                    unit.x = unit.vehicle.x;
                    unit.y = unit.vehicle.y;

                    if (dist < 50 && player.inVehicle) {
                        player.inVehicle.health -= dt * 15;
                        unit.vehicle.speed *= 0.5;
                    }
                }

                if (player.wantedLevel >= 3 && dist < 400 && dist > 50) {
                    unit.shootTimer -= dt;
                    if (unit.shootTimer <= 0) {
                        const chaseAngle = Math.atan2(dy, dx);
                        const bulletAngle = chaseAngle + (Math.random() - 0.5) * 0.2;
                        const bullet = new Bullet(unit.x, unit.y, bulletAngle, 500, 10, 'police');
                        player.weapons.bullets.push(bullet);
                        audio.playGunshot();
                        particles.muzzleFlash(unit.x + Math.cos(bulletAngle) * 15, unit.y + Math.sin(bulletAngle) * 15, bulletAngle);
                        unit.shootTimer = 0.8 - player.wantedLevel * 0.05;
                    }
                }
            }
        }
    }

    spawnChaseUnit(player, world, vehicles, images) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 600 + Math.random() * 400;
        let sx = player.x + Math.cos(angle) * dist;
        let sy = player.y + Math.sin(angle) * dist;
        sx = Math.max(TILE * 8, Math.min(WORLD_PX_W - TILE * 5, sx));
        sy = Math.max(TILE * 3, Math.min(WORLD_PX_H - TILE * 8, sy));

        const vehicle = new Vehicle(sx, sy, 'police', images);
        vehicle.angle = Math.atan2(player.y - sy, player.x - sx);
        vehicle.ai.active = false;
        vehicles.push(vehicle);

        const unit = new PoliceUnit(sx, sy, vehicle);
        unit.patrolling = false;
        this.units.push(unit);
    }

    draw(ctx) {
        // Flashing lights on chasing police vehicles
        const allUnits = [...this.patrolUnits, ...this.units];
        for (const unit of allUnits) {
            if (!unit.alive) continue;
            if (unit.onFoot) {
                // Draw foot officer
                const t = Date.now() / 200;
                ctx.save();
                ctx.fillStyle = '#1a1aaa';
                ctx.beginPath();
                ctx.arc(unit.x, unit.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ddb892';
                ctx.beginPath();
                ctx.arc(unit.x, unit.y - 5, 5, 0, Math.PI * 2);
                ctx.fill();
                // Flashing badge
                ctx.strokeStyle = Math.sin(t) > 0 ? 'rgba(255,0,0,0.9)' : 'rgba(0,100,255,0.9)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(unit.x, unit.y, 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                continue;
            }
            if (!unit.vehicle || unit.patrolling) continue;
            const t = Date.now() / 200;
            ctx.save();
            ctx.translate(unit.vehicle.x, unit.vehicle.y);
            ctx.fillStyle = Math.sin(t) > 0 ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,255,0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.helicopter && this.helicopter.alive) {
            this.helicopter.draw(ctx);
        }
    }
}
