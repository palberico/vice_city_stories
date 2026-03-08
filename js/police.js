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
    }
}

class PoliceHelicopter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.angle = 0;
        this.altitude = 0; // visual only, for shadow offset
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

        // Clamp to world
        this.x = Math.max(100, Math.min(WORLD_PX_W - 100, this.x));
        this.y = Math.max(100, Math.min(WORLD_PX_H - 100, this.y));

        // Rotor spin
        this.rotorAngle += 15 * dt;

        // Spotlight sweeps
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

        // Helicopter body
        ctx.save();
        ctx.translate(this.x, this.y);

        // Fuselage
        ctx.fillStyle = '#1a1a3a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333366';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cockpit glass
        ctx.fillStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.beginPath();
        ctx.ellipse(-5, 0, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail boom
        ctx.fillStyle = '#1a1a3a';
        ctx.fillRect(15, -3, 20, 6);

        // Tail rotor
        ctx.fillStyle = '#555';
        ctx.save();
        ctx.translate(35, 0);
        ctx.rotate(this.rotorAngle * 3);
        ctx.fillRect(-6, -1, 12, 2);
        ctx.restore();

        // Main rotor
        ctx.save();
        ctx.rotate(this.rotorAngle);
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        ctx.lineTo(30, 0);
        ctx.moveTo(0, -30);
        ctx.lineTo(0, 30);
        ctx.stroke();
        // Rotor disc (blurred circle)
        ctx.fillStyle = 'rgba(150, 150, 150, 0.08)';
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // POLICE marking
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 6px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('POLICE', 0, 3);

        // Flashing lights
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

        // Health bar
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

    update(dt, player, world, vehicles, images, audio, particles) {
        this.spawnPatrolCars(world, vehicles, images);

        // Update patrol cars
        for (const unit of this.patrolUnits) {
            if (!unit.alive || !unit.vehicle) continue;
            unit.x = unit.vehicle.x;
            unit.y = unit.vehicle.y;

            if (player.wantedLevel >= 1) {
                unit.patrolling = false;
                const dx = player.x - unit.x;
                const dy = player.y - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const chaseAngle = Math.atan2(dy, dx);

                if (dist < 800) {
                    unit.vehicle.ai.active = false;
                    let angleDiff = chaseAngle - unit.vehicle.angle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    unit.vehicle.angle += angleDiff * 3 * dt;
                    unit.vehicle.speed = Math.min(unit.vehicle.topSpeed * 0.7, unit.vehicle.speed + unit.vehicle.accel * dt);

                    const vx = Math.cos(unit.vehicle.angle) * unit.vehicle.speed * dt;
                    const vy = Math.sin(unit.vehicle.angle) * unit.vehicle.speed * dt;
                    const newX = unit.vehicle.x + vx;
                    const newY = unit.vehicle.y + vy;

                    if (newX > 0 && newX < WORLD_PX_W && newY > 0 && newY < WORLD_PX_H) {
                        const bCol = world.checkBuildingCollision(newX - unit.vehicle.w / 2, newY - unit.vehicle.h / 2, unit.vehicle.w, unit.vehicle.h);
                        if (!bCol) {
                            unit.vehicle.x = newX;
                            unit.vehicle.y = newY;
                        } else {
                            unit.vehicle.speed *= -0.3;
                            unit.vehicle.angle += 0.5;
                        }
                    }

                    if (player.wantedLevel >= 1 && dist < 400 && dist > 50) {
                        unit.shootTimer -= dt;
                        if (unit.shootTimer <= 0) {
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

        // Handle chase units
        if (player.wantedLevel <= 0) {
            for (const unit of this.units) {
                if (unit.vehicle) {
                    const idx = vehicles.indexOf(unit.vehicle);
                    if (idx >= 0) vehicles.splice(idx, 1);
                }
            }
            this.units = [];
            // Remove helicopter
            this.helicopter = null;
        } else {
            // Spawn chase units
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0 && this.units.length < player.wantedLevel * 2) {
                this.spawnChaseUnit(player, world, vehicles, images);
                this.spawnTimer = 5 - player.wantedLevel * 0.5;
            }

            // Siren sounds ONLY when wanted
            this.sirenTimer -= dt;
            if (this.sirenTimer <= 0 && (this.units.length > 0 || this.patrolUnits.some(u => !u.patrolling))) {
                audio.playSiren();
                this.sirenTimer = 2;
            }

            // Spawn helicopter at 5 stars
            if (player.wantedLevel >= 5 && !this.helicopter) {
                const angle = Math.random() * Math.PI * 2;
                this.helicopter = new PoliceHelicopter(
                    player.x + Math.cos(angle) * 500,
                    player.y + Math.sin(angle) * 500
                );
            }

            // Update helicopter
            if (this.helicopter && this.helicopter.alive) {
                this.helicopter.update(dt, player, audio, particles);
                // Helicopter sound
                this.heliSoundTimer -= dt;
                if (this.heliSoundTimer <= 0) {
                    // Play a low rhythm to simulate chopper
                    audio.playHeliSound();
                    this.heliSoundTimer = 0.3;
                }
            }

            // Update chase units
            for (const unit of this.units) {
                if (!unit.alive) continue;
                const dx = player.x - unit.x;
                const dy = player.y - unit.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const chaseAngle = Math.atan2(dy, dx);

                if (unit.vehicle && unit.vehicle.health > 0) {
                    let angleDiff = chaseAngle - unit.vehicle.angle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    unit.vehicle.angle += angleDiff * 3 * dt;
                    unit.vehicle.speed = Math.min(unit.vehicle.topSpeed * 0.8, unit.vehicle.speed + unit.vehicle.accel * dt);

                    const vx = Math.cos(unit.vehicle.angle) * unit.vehicle.speed * dt;
                    const vy = Math.sin(unit.vehicle.angle) * unit.vehicle.speed * dt;
                    const newX = unit.vehicle.x + vx;
                    const newY = unit.vehicle.y + vy;

                    if (newX > 0 && newX < WORLD_PX_W && newY > 0 && newY < WORLD_PX_H) {
                        const bCol = world.checkBuildingCollision(newX - unit.vehicle.w / 2, newY - unit.vehicle.h / 2, unit.vehicle.w, unit.vehicle.h);
                        if (!bCol) {
                            unit.vehicle.x = newX;
                            unit.vehicle.y = newY;
                        } else {
                            unit.vehicle.speed *= -0.3;
                            unit.vehicle.angle += 0.5;
                        }
                    }

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
        // Flashing lights on chasing police
        const allUnits = [...this.patrolUnits, ...this.units];
        for (const unit of allUnits) {
            if (!unit.alive || !unit.vehicle) continue;
            if (unit.patrolling) continue;
            const t = Date.now() / 200;
            ctx.save();
            ctx.translate(unit.vehicle.x, unit.vehicle.y);
            ctx.fillStyle = Math.sin(t) > 0 ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,255,0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw helicopter (drawn on top of everything)
        if (this.helicopter && this.helicopter.alive) {
            this.helicopter.draw(ctx);
        }
    }
}
