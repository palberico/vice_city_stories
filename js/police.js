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
        this.bailed = false;
        this.avoidTimer = 0;
        this.avoidDir = 1;
        this.patrolTimer = 0;   // counts up while patrolling
        this.returning = false; // true when heading back to station
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

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 15, 35, 20, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

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
        this.units = [];        // active chase units (spawned when wanted)
        this.patrolUnits = [];  // up to 5 patrol units rotating from station
        this.helicopter = null;
        this.sirenTimer = 0;
        this.heliSoundTimer = 0;
        this.deployTimer = 0;   // countdown before next patrol deployment
        this.initialized = false;
    }

    // ---- Shared helper: move a police vehicle toward a target with unstuck avoidance ----
    _driveToward(unit, targetX, targetY, speedFactor, world, dt) {
        const v = unit.vehicle;
        const dx = targetX - v.x;
        const dy = targetY - v.y;
        const chaseAngle = Math.atan2(dy, dx);

        if (unit.avoidTimer > 0) {
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
                v.speed *= -0.3;
                unit.avoidDir = Math.random() > 0.5 ? 1 : -1;
                unit.avoidTimer = 2.5;
            }
        }
    }

    // ---- Bail out two foot officers from a destroyed vehicle ----
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

    // ---- Spawn one patrol car from the station ----
    _spawnPatrolUnit(vehicles, images) {
        // Spawn on the h=32 road near the station parking lot, staggered by slot
        const slot = this.patrolUnits.length;
        const spawnX = STATION_PARKING_PX.x + (slot - 2) * TILE * 1.2;
        const spawnY = STATION_PARKING_PX.y;
        const vehicle = new Vehicle(spawnX, spawnY, 'police', images);
        vehicle.angle = 0; // driving right along horizontal road
        vehicle.isPolicePatrol = true;
        vehicle.ai.active = true;
        vehicle.ai.targetSpeed = 60 + Math.random() * 40;
        vehicles.push(vehicle);

        const unit = new PoliceUnit(spawnX, spawnY, vehicle);
        unit.patrolling = true;
        unit.returning = false;
        unit.patrolTimer = 0;
        this.patrolUnits.push(unit);
    }

    update(dt, player, world, vehicles, images, audio, particles) {
        // ---- Initial patrol deployment: stagger 5 cars with 10s gaps ----
        if (!this.initialized) {
            this.initialized = true;
            this.deployTimer = 0; // first one spawns immediately
        }

        // ---- Patrol unit management ----
        // Remove dead/done patrol units
        for (let i = this.patrolUnits.length - 1; i >= 0; i--) {
            const unit = this.patrolUnits[i];
            if (!unit.alive) { this.patrolUnits.splice(i, 1); continue; }

            // Bail if vehicle destroyed
            if (unit.vehicle && unit.vehicle.health <= 0 && !unit.bailed) {
                this._bailOut(unit);
                this.patrolUnits.splice(i, 1);
                this.deployTimer = Math.max(this.deployTimer, 10); // schedule replacement
                continue;
            }

            unit.x = unit.vehicle ? unit.vehicle.x : unit.x;
            unit.y = unit.vehicle ? unit.vehicle.y : unit.y;
        }

        // Deploy patrol units until we have 5 active
        this.deployTimer -= dt;
        if (this.deployTimer <= 0 && this.patrolUnits.length < 5) {
            this._spawnPatrolUnit(vehicles, images);
            this.deployTimer = 10;
        }

        // ---- Update each patrol unit ----
        for (const unit of this.patrolUnits) {
            if (!unit.alive || !unit.vehicle || unit.vehicle.health <= 0) continue;

            const distToPlayer = Collision.dist(unit.x, unit.y, player.x, player.y);

            if (player.wantedLevel >= 1 && distToPlayer < 800) {
                // Chase the player
                unit.patrolling = false;
                unit.returning = false;
                unit.vehicle.ai.active = false;
                this._driveToward(unit, player.x, player.y, 0.8, world, dt);
                unit.x = unit.vehicle.x;
                unit.y = unit.vehicle.y;

                // Shoot
                if (distToPlayer < 400 && distToPlayer > 50) {
                    unit.shootTimer -= dt;
                    if (unit.shootTimer <= 0) {
                        const chaseAngle = Math.atan2(player.y - unit.y, player.x - unit.x);
                        const bulletAngle = chaseAngle + (Math.random() - 0.5) * 0.2;
                        player.weapons.bullets.push(new Bullet(unit.x, unit.y, bulletAngle, 500, 10, 'police'));
                        audio.playGunshot();
                        particles.muzzleFlash(unit.x + Math.cos(bulletAngle) * 15, unit.y + Math.sin(bulletAngle) * 15, bulletAngle);
                        unit.shootTimer = 0.8 - player.wantedLevel * 0.05;
                    }
                }

                if (distToPlayer < 50 && player.inVehicle) {
                    player.inVehicle.health -= dt * 15;
                    unit.vehicle.speed *= 0.5;
                }
            } else if (unit.returning) {
                // Head back to station
                unit.vehicle.ai.active = false;
                this._driveToward(unit, STATION_PARKING_PX.x, STATION_PARKING_PX.y, 0.6, world, dt);
                unit.x = unit.vehicle.x;
                unit.y = unit.vehicle.y;

                // Arrived at station — retire this unit
                if (Collision.dist(unit.x, unit.y, STATION_PARKING_PX.x, STATION_PARKING_PX.y) < 180) {
                    // Remove vehicle from world
                    const idx = vehicles.indexOf(unit.vehicle);
                    if (idx >= 0) vehicles.splice(idx, 1);
                    unit.alive = false;
                    // deployTimer controls when next unit goes out (10s gap)
                    if (this.deployTimer < 10) this.deployTimer = 10;
                }
            } else {
                // Normal patrol — AI drives around
                unit.patrolling = true;
                unit.vehicle.ai.active = true;
                unit.vehicle.ai.targetSpeed = 60 + Math.random() * 0.1;
                unit.patrolTimer += dt;

                // After 90s, return to station (unless wanted)
                if (unit.patrolTimer > 90 && player.wantedLevel <= 0) {
                    unit.returning = true;
                    unit.vehicle.ai.active = false;
                }
            }
        }

        // ---- Chase units (spawned when wanted > 0) ----
        if (player.wantedLevel <= 0) {
            // Clean up all chase units
            for (const unit of this.units) {
                if (unit.vehicle) {
                    const idx = vehicles.indexOf(unit.vehicle);
                    if (idx >= 0) vehicles.splice(idx, 1);
                }
            }
            this.units = [];
            this.helicopter = null;
        } else {
            // Spawn chase units from station based on wanted level
            const vehicleUnits = this.units.filter(u => !u.onFoot);
            if (vehicleUnits.length < player.wantedLevel * 2) {
                this._spawnChaseUnit(player, vehicles, images);
            }

            this.sirenTimer -= dt;
            if (this.sirenTimer <= 0 && (this.units.length > 0 || this.patrolUnits.some(u => !u.patrolling))) {
                audio.playSiren();
                this.sirenTimer = 2;
            }

            if (player.wantedLevel >= 5 && !this.helicopter) {
                this.helicopter = new PoliceHelicopter(
                    player.x + Math.cos(Math.random() * Math.PI * 2) * 500,
                    player.y + Math.sin(Math.random() * Math.PI * 2) * 500
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

                if (unit.onFoot) {
                    const dx = player.x - unit.x;
                    const dy = player.y - unit.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    unit.angle = Math.atan2(dy, dx);

                    if (dist > 50) {
                        const footSpeed = 120;
                        const nx = unit.x + Math.cos(unit.angle) * footSpeed * dt;
                        const ny = unit.y + Math.sin(unit.angle) * footSpeed * dt;
                        if (world.isWalkable(nx, ny)) { unit.x = nx; unit.y = ny; }
                    }

                    if (dist < 400 && dist > 40) {
                        unit.shootTimer -= dt;
                        if (unit.shootTimer <= 0) {
                            const bulletAngle = unit.angle + (Math.random() - 0.5) * 0.25;
                            player.weapons.bullets.push(new Bullet(unit.x, unit.y, bulletAngle, 500, 10, 'police'));
                            audio.playGunshot();
                            particles.muzzleFlash(unit.x + Math.cos(bulletAngle) * 15, unit.y + Math.sin(bulletAngle) * 15, bulletAngle);
                            unit.shootTimer = 1.0;
                        }
                    }

                    unit.x = Math.max(10, Math.min(WORLD_PX_W - 10, unit.x));
                    unit.y = Math.max(10, Math.min(WORLD_PX_H - 10, unit.y));
                    continue;
                }

                // Vehicle chase unit
                const dx = player.x - unit.x;
                const dy = player.y - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (unit.vehicle && unit.vehicle.health <= 0 && !unit.bailed) {
                    this._bailOut(unit);
                    continue;
                }

                if (unit.vehicle && unit.vehicle.health > 0) {
                    this._driveToward(unit, player.x, player.y, 0.9, world, dt);
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
                        player.weapons.bullets.push(new Bullet(unit.x, unit.y, bulletAngle, 500, 10, 'police'));
                        audio.playGunshot();
                        particles.muzzleFlash(unit.x + Math.cos(bulletAngle) * 15, unit.y + Math.sin(bulletAngle) * 15, bulletAngle);
                        unit.shootTimer = 0.8 - player.wantedLevel * 0.05;
                    }
                }
            }
        }
    }

    _spawnChaseUnit(player, vehicles, images) {
        // All chase units spawn from the police station parking area
        const vehicle = new Vehicle(STATION_PARKING_PX.x, STATION_PARKING_PX.y, 'police', images);
        vehicle.angle = Math.atan2(player.y - STATION_PARKING_PX.y, player.x - STATION_PARKING_PX.x);
        vehicle.ai.active = false;
        vehicles.push(vehicle);

        const unit = new PoliceUnit(STATION_PARKING_PX.x, STATION_PARKING_PX.y, vehicle);
        unit.patrolling = false;
        this.units.push(unit);
    }

    draw(ctx) {
        const allUnits = [...this.patrolUnits, ...this.units];
        for (const unit of allUnits) {
            if (!unit.alive) continue;
            if (unit.onFoot) {
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
