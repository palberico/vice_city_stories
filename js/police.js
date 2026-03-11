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
    constructor(images) {
        this.x = STATION_PX.x;
        this.y = STATION_PX.y + TILE * 0.5;
        this.targetX = this.x;
        this.targetY = this.y;
        this.angle = 0;
        this.rotorAngle = 0;
        this.liftScale = 0;   // 0 = grounded, 1 = fully airborne
        this.health = 200;
        this.alive = true;
        this.active = false;  // false = parked on roof
        this.shootTimer = 0;
        this.spotlightAngle = 0;
        this.speed = 250;
        this.img = images ? images['helicopter_police'] : null;
        this.propellerImg = images ? images['propeller'] : null;
    }

    update(dt, player, audio, particles) {
        if (!this.alive) return;

        // Rotor: slow idle when parked, fast when active
        this.rotorAngle += (this.active ? 15 : 2) * dt;

        if (!this.active) {
            // Slowly land back on roof
            this.liftScale = Math.max(0, this.liftScale - dt * 1.2);
            return;
        }

        // Lift off animation
        this.liftScale = Math.min(1, this.liftScale + dt * 1.2);

        this.spotlightAngle += 0.8 * dt;

        this.targetX = player.x + Math.sin(Date.now() / 2000) * 100;
        this.targetY = player.y + Math.cos(Date.now() / 2000) * 100;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10 && this.liftScale > 0.3) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
            this.angle = Math.atan2(dy, dx);
        }

        this.x = Math.max(100, Math.min(WORLD_PX_W - 100, this.x));
        this.y = Math.max(100, Math.min(WORLD_PX_H - 100, this.y));

        this.shootTimer -= dt;
        const playerDist = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
        if (this.shootTimer <= 0 && playerDist < 500 && this.liftScale > 0.5) {
            const bulletAngle = Math.atan2(player.y - this.y, player.x - this.x) + (Math.random() - 0.5) * 0.3;
            const bullet = new Bullet(this.x, this.y, bulletAngle, 600, 8, 'police');
            player.weapons.bullets.push(bullet);
            audio.playGunshot();
            this.shootTimer = 0.5;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        const bodyScale = 1.0 + this.liftScale * 0.38;

        // Shadow (grows as helicopter lifts)
        if (this.liftScale > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${0.22 - this.liftScale * 0.08})`;
            ctx.beginPath();
            ctx.ellipse(
                this.x + 8 + this.liftScale * 22,
                this.y + 8 + this.liftScale * 22,
                30 * bodyScale, 20 * bodyScale, 0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        // Spotlight (only when airborne and active)
        if (this.active && this.liftScale > 0.5) {
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
        }

        // Body
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.scale(bodyScale, bodyScale);
        if (this.img && this.img.complete && this.img.width > 0) {
            const drawW = 80;
            const drawH = this.img.height * (drawW / this.img.width);
            ctx.drawImage(this.img, -drawW / 2, -drawH / 2, drawW, drawH);
        }
        ctx.restore();

        // Propeller
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.scale(bodyScale, bodyScale);
        ctx.rotate(this.rotorAngle);
        if (this.propellerImg && this.propellerImg.complete && this.propellerImg.width > 0) {
            const propW = 80;
            const propH = this.propellerImg.height * (propW / this.propellerImg.width);
            ctx.drawImage(this.propellerImg, -propW / 2, -propH / 2, propW, propH);
        }
        ctx.restore();

        // Flashing lights when active
        if (this.active) {
            const t = Date.now() / 150;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = Math.sin(t) > 0 ? 'rgba(255,0,0,0.85)' : 'rgba(0,100,255,0.85)';
            ctx.beginPath();
            ctx.arc(-8, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = Math.sin(t) > 0 ? 'rgba(0,100,255,0.85)' : 'rgba(255,0,0,0.85)';
            ctx.beginPath();
            ctx.arc(8, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

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

    // ---- Trigger arrest: confiscate money and send player to station ----
    _triggerArrest(player, audio) {
        if (!player.alive || player.arrested) return;
        const penalty = player.wantedLevel <= 1 ? 100 : player.wantedLevel <= 2 ? 250 : 400;
        const lost = Math.min(player.money, penalty);
        player.money = Math.max(0, player.money - lost);
        player.wantedLevel = 0;
        player.wantedDecayTimer = 0;
        if (player.inVehicle) {
            player.inVehicle.driver = null;
            player.inVehicle.speed = 0;
            player.inVehicle = null;
            player.enterCooldown = 0.5;
        }
        player.arrested = true;
        player.arrestedLost = lost;
        player.alive = false;
        player.respawnTimer = 3;
        audio.playWantedUp();
    }

    // ---- Check if a unit should arrest the player (1–3 stars only) ----
    _checkArrest(unit, player, audio, dt) {
        if (player.wantedLevel > 3 || player.wantedLevel <= 0 || !player.alive || player.arrested) {
            unit.arrestTimer = 0;
            return;
        }
        const dist = Collision.dist(unit.x, unit.y, player.x, player.y);
        // Immediate arrest if officer reaches player on foot
        if (!player.inVehicle && dist < 45) {
            this._triggerArrest(player, audio);
            return;
        }
        // Vehicle arrest: player must be nearly stopped next to a cop for 2.5s
        if (player.inVehicle && dist < 80 && Math.abs(player.inVehicle.speed) < 20) {
            unit.arrestTimer = (unit.arrestTimer || 0) + dt;
            if (unit.arrestTimer >= 2.5) this._triggerArrest(player, audio);
        } else {
            unit.arrestTimer = 0;
        }
    }

    // ---- Snap a world position to the nearest road intersection center ----
    _findRoadblockPos(fromX, fromY, playerAngle, world) {
        // Project ~5 tiles ahead of the player
        const projX = fromX + Math.cos(playerAngle) * TILE * 5;
        const projY = fromY + Math.sin(playerAngle) * TILE * 5;
        const RW = world.ROAD_WIDTH || 4;
        // Find nearest intersection (where a v-road and h-road cross)
        let bestPos = null;
        let bestDist = Infinity;
        for (const vx of world.roadPositions.v) {
            for (const hy of world.roadPositions.h) {
                const ix = (vx + RW / 2) * TILE;
                const iy = (hy + RW / 2) * TILE;
                const d = Collision.dist(projX, projY, ix, iy);
                if (d < bestDist) { bestDist = d; bestPos = { x: ix, y: iy }; }
            }
        }
        return bestPos || { x: projX, y: projY };
    }

    // ---- Roadblock unit: race ahead of player, park perpendicular, then shoot ----
    _updateRoadblock(unit, player, world, audio, particles, dt) {
        if (!unit.roadblockPos) {
            // Snap to nearest road intersection ahead of the player
            const playerAngle = player.inVehicle ? player.inVehicle.angle : player.angle;
            unit.roadblockPos = this._findRoadblockPos(player.x, player.y, playerAngle, world);
        }
        if (!unit.roadblockSet) {
            this._driveToward(unit, unit.roadblockPos.x, unit.roadblockPos.y, 1.0, world, dt);
            unit.x = unit.vehicle.x;
            unit.y = unit.vehicle.y;
            if (Collision.dist(unit.x, unit.y, unit.roadblockPos.x, unit.roadblockPos.y) < 80) {
                unit.roadblockSet = true;
                unit.vehicle.speed = 0;
                unit.vehicle.angle += Math.PI / 2; // park perpendicular to block the road
            }
        } else {
            // Slowly halt
            unit.vehicle.speed *= (1 - 6 * dt);
            if (Math.abs(unit.vehicle.speed) < 1) unit.vehicle.speed = 0;
            unit.x = unit.vehicle.x;
            unit.y = unit.vehicle.y;
        }
        // Shoot at player from the roadblock position
        const dist = Collision.dist(unit.x, unit.y, player.x, player.y);
        if (dist < 500 && dist > 30) {
            unit.shootTimer -= dt;
            if (unit.shootTimer <= 0) {
                const ang = Math.atan2(player.y - unit.y, player.x - unit.x) + (Math.random() - 0.5) * 0.3;
                player.weapons.bullets.push(new Bullet(unit.x, unit.y, ang, 500, 10, 'police'));
                audio.playGunshot();
                particles.muzzleFlash(unit.x + Math.cos(ang) * 15, unit.y + Math.sin(ang) * 15, ang);
                unit.shootTimer = 0.5;
            }
        }
        this._checkArrest(unit, player, audio, dt);
    }

    // ---- Spawn one patrol car into the first unassigned parking spot ----
    _spawnPatrolUnit(vehicles, images) {
        // Find first spot not already owned by an active patrol unit
        const spot = STATION_PATROL_SPOTS.find(s =>
            !this.patrolUnits.some(u => u.alive && u.spotTx === s.tx && u.spotTy === s.ty)
        );
        if (!spot) return; // all spots occupied

        const spawnX = spot.tx * TILE + TILE / 2;
        const spawnY = spot.ty * TILE;
        const vehicle = new Vehicle(spawnX, spawnY, 'police', images);
        vehicle.angle = Math.PI / 2; // south-facing while parked
        vehicle.ai.active = false;
        vehicle.isPolicePatrol = true;
        vehicles.push(vehicle);

        const unit = new PoliceUnit(spawnX, spawnY, vehicle);
        unit.patrolling = false;
        unit.patrolPhase = 'parked'; // parked (60s) → exiting → patrolling → returning → entering → despawn
        unit.parkedTimer = 0;
        unit.patrolTimer = 0;
        unit.returnTimer = 0;
        unit.parkingX = spawnX;
        unit.parkingY = spawnY;
        unit.spotTx = spot.tx;
        unit.spotTy = spot.ty;
        this.patrolUnits.push(unit);
    }

    update(dt, player, world, vehicles, images, audio, particles) {
        // ---- Initial patrol deployment: stagger 5 cars with 10s gaps ----
        if (!this.initialized) {
            this.initialized = true;
            this.deployTimer = 0; // first one spawns immediately
        }

        // Spawn helicopter only at 5 stars; destroy it when wanted clears
        if (player.wantedLevel >= 5) {
            if (!this.helicopter) {
                this.helicopter = new PoliceHelicopter(images);
                this.helicopter.active = true;
            }
        } else if (this.helicopter && player.wantedLevel === 0) {
            this.helicopter = null;
        }

        if (this.helicopter) this.helicopter.update(dt, player, audio, particles);

        // ---- Patrol unit management ----
        // Remove dead/done patrol units
        for (let i = this.patrolUnits.length - 1; i >= 0; i--) {
            const unit = this.patrolUnits[i];
            if (!unit.alive) { this.patrolUnits.splice(i, 1); continue; }

            // Player stole this patrol car — stop tracking it, schedule a replacement
            if (unit.vehicle && unit.vehicle.driver) {
                this.patrolUnits.splice(i, 1);
                this.deployTimer = Math.max(this.deployTimer, 15);
                continue;
            }

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
            if (!unit.alive || !unit.vehicle || unit.vehicle.health <= 0 || unit.vehicle.driver) continue;

            const v = unit.vehicle;
            const distToPlayer = Collision.dist(unit.x, unit.y, player.x, player.y);

            // Wanted: chase player (not while inside station driveway)
            if (player.wantedLevel >= 1 && distToPlayer < 800 &&
                unit.patrolPhase !== 'exiting' && unit.patrolPhase !== 'entering') {
                unit.patrolPhase = 'chasing';
                unit.patrolling = false;
                v.ai.active = false;
                v.ai.destX = undefined; // clear any return destination
                v.ai.destY = undefined;
                this._driveToward(unit, player.x, player.y, 0.8, world, dt);
                unit.x = v.x;
                unit.y = v.y;

                // Only shoot at 4+ stars; 1–3 stars → pursue and try to arrest
                if (player.wantedLevel >= 4 && distToPlayer < 400 && distToPlayer > 50) {
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
                this._checkArrest(unit, player, audio, dt);
                if (distToPlayer < 50 && player.inVehicle) {
                    player.inVehicle.health -= dt * 15;
                    v.speed *= 0.5;
                }
                continue;
            }

            // Chase → wind-down when wanted clears (pause briefly, then despawn & replace)
            if (unit.patrolPhase === 'chasing' && player.wantedLevel <= 0) {
                unit.patrolPhase = 'winding_down';
                unit.windTimer = 3 + Math.random() * 2;
                v.ai.active = false;
            }

            // Wind-down: slow to a stop, then despawn and schedule a fresh patrol car
            if (unit.patrolPhase === 'winding_down') {
                v.speed *= (1 - 2 * dt);
                if (Math.abs(v.speed) < 2) v.speed = 0;
                unit.windTimer -= dt;
                unit.x = v.x;
                unit.y = v.y;
                if (unit.windTimer <= 0) {
                    const idx = vehicles.indexOf(v);
                    if (idx >= 0) vehicles.splice(idx, 1);
                    unit.alive = false;
                    if (this.deployTimer < 5) this.deployTimer = 5;
                }
                continue;
            }

            if (unit.patrolPhase === 'parked') {
                // Sit in parking spot for 60 seconds before departing
                unit.parkedTimer += dt;
                if (unit.parkedTimer >= 60) {
                    unit.patrolPhase = 'exiting';
                }

            } else if (unit.patrolPhase === 'exiting') {
                // Drive south manually out of parking area onto the main road
                v.angle = Math.PI / 2;
                v.speed = 90;
                unit.x = v.x;
                unit.y = v.y;
                if (v.y > 36 * TILE + TILE) {
                    unit.patrolPhase = 'patrolling';
                    unit.patrolTimer = 0;
                    v.ai.active = true;
                    v.ai.targetSpeed = 60 + Math.random() * 40;
                }

            } else if (unit.patrolPhase === 'patrolling') {
                unit.patrolling = true;
                v.ai.active = true;
                v.ai.targetSpeed = 60 + Math.random() * 40;
                unit.patrolTimer += dt;
                unit.x = v.x;
                unit.y = v.y;
                if (unit.patrolTimer > 90 && player.wantedLevel <= 0) {
                    unit.patrolPhase = 'returning';
                    unit.patrolling = false;
                    unit.returnTimer = 0;
                }

            } else if (unit.patrolPhase === 'returning') {
                // Target: north road entry to station driveway (x=31, on h=22 road)
                const entryX = 31 * TILE + TILE / 2;
                const entryY = 22 * TILE + TILE / 2;

                // Road AI with destination bias — car steers toward station at intersections
                v.ai.active = true;
                v.ai.destX = entryX;
                v.ai.destY = entryY;
                unit.x = v.x;
                unit.y = v.y;

                // Trigger entry when car reaches the north road near the station driveway
                const onNorthRoad = v.y >= 22 * TILE && v.y <= 27 * TILE;
                const nearEntryX = Math.abs(v.x - entryX) < TILE * 2;
                if (onNorthRoad && nearEntryX) {
                    v.ai.destX = undefined;
                    v.ai.destY = undefined;
                    unit.patrolPhase = 'entering';
                    v.ai.active = false;
                    v.x = entryX; // snap to driveway column
                    v.angle = Math.PI / 2;
                    v.speed = 0;
                }

            } else if (unit.patrolPhase === 'entering') {
                // Drive south down the driveway and despawn at tile (31,29)
                v.x = 31 * TILE + TILE / 2; // keep centered in driveway
                v.angle = Math.PI / 2;
                v.speed = 80;
                unit.x = v.x;
                unit.y = v.y;
                if (v.y >= 29 * TILE) {
                    v.speed = 0;
                    const idx = vehicles.indexOf(v);
                    if (idx >= 0) vehicles.splice(idx, 1);
                    unit.alive = false;
                    if (this.deployTimer < 10) this.deployTimer = 10;
                }
            }
        }

        // ---- Chase units (spawned when wanted > 0) ----
        if (player.wantedLevel <= 0) {
            // Begin wind-down for all active chase units instead of instantly despawning
            for (const unit of this.units) {
                if (!unit.windingDown) {
                    unit.windingDown = true;
                    unit.windTimer = 3 + Math.random() * 2;
                    if (unit.vehicle) unit.vehicle.ai.active = false;
                }
            }
        } else {
            // Spawn chase units scaled to wanted level
            // Exclude bailed/winding-down units from the count
            const activeVehicleUnits = this.units.filter(u => !u.onFoot && !u.windingDown);
            if (activeVehicleUnits.length < player.wantedLevel * 2) {
                this._spawnChaseUnit(player, vehicles, images);
            }

            this.sirenTimer -= dt;
            if (this.sirenTimer <= 0 && (this.units.some(u => !u.windingDown) || this.patrolUnits.some(u => !u.patrolling))) {
                audio.playSiren();
                this.sirenTimer = 2;
            }

        }

        // ---- Update all chase units (including winding-down ones) ----
        for (let i = this.units.length - 1; i >= 0; i--) {
            const unit = this.units[i];
            if (!unit.alive) { this.units.splice(i, 1); continue; }

            // Wind-down: slow vehicle, then despawn
            if (unit.windingDown) {
                unit.windTimer -= dt;
                if (unit.vehicle && !unit.vehicle.driver) {
                    unit.vehicle.speed *= (1 - 3 * dt);
                    if (Math.abs(unit.vehicle.speed) < 1) unit.vehicle.speed = 0;
                }
                if (unit.windTimer <= 0) {
                    if (unit.vehicle && !unit.vehicle.driver) {
                        const idx = vehicles.indexOf(unit.vehicle);
                        if (idx >= 0) vehicles.splice(idx, 1);
                    }
                    this.units.splice(i, 1);
                }
                continue;
            }

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

                // On-foot officers only shoot at 4+ stars; otherwise try to arrest
                if (player.wantedLevel >= 4 && dist < 400 && dist > 40) {
                    unit.shootTimer -= dt;
                    if (unit.shootTimer <= 0) {
                        const bulletAngle = unit.angle + (Math.random() - 0.5) * 0.25;
                        player.weapons.bullets.push(new Bullet(unit.x, unit.y, bulletAngle, 500, 10, 'police'));
                        audio.playGunshot();
                        particles.muzzleFlash(unit.x + Math.cos(bulletAngle) * 15, unit.y + Math.sin(bulletAngle) * 15, bulletAngle);
                        unit.shootTimer = 1.0;
                    }
                }
                this._checkArrest(unit, player, audio, dt);

                unit.x = Math.max(10, Math.min(WORLD_PX_W - 10, unit.x));
                unit.y = Math.max(10, Math.min(WORLD_PX_H - 10, unit.y));
                continue;
            }

            // Skip vehicles the player has stolen
            if (unit.vehicle && unit.vehicle.driver) continue;

            // Bail out of destroyed vehicle
            if (unit.vehicle && unit.vehicle.health <= 0 && !unit.bailed) {
                this._bailOut(unit);
                this.units.splice(i, 1);
                continue;
            }

            // Roadblock units: race ahead, park perpendicular, shoot
            if (unit.role === 'roadblock' && unit.vehicle && unit.vehicle.health > 0) {
                this._updateRoadblock(unit, player, world, audio, particles, dt);
                continue;
            }

            // Chase units: pursue player directly
            if (unit.vehicle && unit.vehicle.health > 0) {
                this._driveToward(unit, player.x, player.y, 0.9, world, dt);
                unit.x = unit.vehicle.x;
                unit.y = unit.vehicle.y;

                const dist = Collision.dist(unit.x, unit.y, player.x, player.y);

                // Ram player's vehicle when very close
                if (dist < 50 && player.inVehicle) {
                    player.inVehicle.health -= dt * 15;
                    unit.vehicle.speed *= 0.5;
                }

                // 4+ stars: chase units shoot; 1–3 stars: attempt arrest
                if (player.wantedLevel >= 4 && dist < 400 && dist > 50) {
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
                this._checkArrest(unit, player, audio, dt);
            }
        }
    }

    _spawnChaseUnit(player, vehicles, images) {
        const vehicle = new Vehicle(STATION_PARKING_PX.x, STATION_PARKING_PX.y, 'police', images);
        vehicle.angle = Math.atan2(player.y - STATION_PARKING_PX.y, player.x - STATION_PARKING_PX.x);
        vehicle.ai.active = false;
        vehicles.push(vehicle);

        const unit = new PoliceUnit(STATION_PARKING_PX.x, STATION_PARKING_PX.y, vehicle);
        unit.patrolling = false;

        // Role assignment: at 3+ stars, spawn some roadblocks alongside chasers.
        // Cap: 1 roadblock at 3 stars, 2 at 4–5 stars.
        const roadblockMax = Math.min(2, Math.max(0, player.wantedLevel - 2));
        const activeRoadblocks = this.units.filter(u => u.role === 'roadblock' && !u.windingDown).length;
        const activeChasers = this.units.filter(u => u.role === 'chase' && !u.windingDown && !u.onFoot).length;
        // Assign roadblock if we're under cap AND there's already at least one chaser
        if (player.wantedLevel >= 3 && activeRoadblocks < roadblockMax && activeChasers >= 1) {
            unit.role = 'roadblock';
        } else {
            unit.role = 'chase';
        }

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
            if (!unit.vehicle) continue;
            // Patrol units: only show siren glow when chasing; chase units always show it
            if (unit.patrolPhase && unit.patrolPhase !== 'chasing') continue;
            const t = Date.now() / 200;
            ctx.save();
            ctx.translate(unit.vehicle.x, unit.vehicle.y);
            ctx.fillStyle = Math.sin(t) > 0 ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,255,0.5)';
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (this.helicopter) this.helicopter.draw(ctx);
    }
}
