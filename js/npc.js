// ============================================
// NPC SYSTEM
// ============================================
class NPC {
    constructor(x, y, type, img) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 16;
        this.type = type; // 'pedestrian' or 'traffic'
        this.speed = 40 + Math.random() * 30;
        this.angle = Math.random() * Math.PI * 2;
        this.health = 50;
        this.alive = true;
        this.state = 'wander'; // wander, crossing, flee
        this.stateTimer = 2 + Math.random() * 5;
        this.img = img;
        this.imgIndex = Math.floor(Math.random() * 4);
        this.fleeTarget = null;
        this.drop = null; // set on death: { type: 'cash'|'weapon', amount, weapon, ammo }
        this.crossAngle = 0;  // committed crossing direction
        this.hurryTimer = 0;  // >0 means a car is waiting — move faster to get clear
    }

    update(dt, world, playerX, playerY, isShooting) {
        if (!this.alive) return;

        this.stateTimer -= dt;
        if (this.hurryTimer > 0) this.hurryTimer -= dt;

        const spd = this.speed * (this.hurryTimer > 0 ? 3 : 1);

        // Flee if player is shooting nearby
        if (isShooting && Collision.dist(this.x, this.y, playerX, playerY) < 300) {
            this.state = 'flee';
            this.stateTimer = 3;
            this.fleeTarget = { x: playerX, y: playerY };
        }

        // Safety net: if on a non-NPC-walkable tile (e.g. dropped into an intersection
        // after a crossing was aborted) escape toward nearest safe ground immediately.
        if (!world.isNPCWalkable(this.x, this.y) && this.state !== 'crossing') {
            this._escapeToSidewalk(dt, spd, world);
            // Keep in world bounds and return — don't run normal state logic this frame
            this.x = Math.max(TILE * 7, Math.min(WORLD_PX_W - TILE * 2, this.x));
            this.y = Math.max(TILE * 2, Math.min(WORLD_PX_H - TILE * 7, this.y));
            return;
        }

        if (this.state === 'wander') {
            this._updateWander(dt, spd, world);
        } else if (this.state === 'crossing') {
            this._updateCrossing(dt, spd, world);
        } else if (this.state === 'flee') {
            this._updateFlee(dt, spd, world);
        }

        // Keep in world bounds
        this.x = Math.max(TILE * 7, Math.min(WORLD_PX_W - TILE * 2, this.x));
        this.y = Math.max(TILE * 2, Math.min(WORLD_PX_H - TILE * 7, this.y));
    }

    // Walk toward the nearest NPC-walkable tile — called when stuck on road/intersection
    _escapeToSidewalk(dt, spd, world) {
        // Prefer reversing the way we came (works if we just aborted a crossing)
        const candidates = [
            this.crossAngle + Math.PI,
            this.angle + Math.PI,
            0, Math.PI / 2, Math.PI, -Math.PI / 2,
            Math.PI / 4, 3 * Math.PI / 4, -Math.PI / 4, -3 * Math.PI / 4
        ];

        // First pass: try a single step in each direction
        for (const a of candidates) {
            const tx = this.x + Math.cos(a) * spd * dt * 3;
            const ty = this.y + Math.sin(a) * spd * dt * 3;
            if (world.isNPCWalkable(tx, ty)) {
                this.angle = a;
                this.x = tx; this.y = ty;
                return;
            }
        }

        // Second pass: look further ahead to pick the best escape direction
        for (const a of candidates) {
            for (let d = TILE * 0.5; d <= TILE * 2; d += TILE * 0.5) {
                if (world.isNPCWalkable(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d)) {
                    this.angle = a;
                    this.x += Math.cos(a) * spd * dt * 2;
                    this.y += Math.sin(a) * spd * dt * 2;
                    return;
                }
            }
        }
    }

    _updateWander(dt, spd, world) {
        // Pick a new random direction periodically
        if (this.stateTimer <= 0) {
            this.angle = Math.random() * Math.PI * 2;
            this.stateTimer = 3 + Math.random() * 5;
        }

        // If on a crosswalk tile and heading toward a road, commit to crossing
        const curTile = world.getTile(this.x, this.y);
        if (curTile === T.CROSSWALK) {
            const peekX = this.x + Math.cos(this.angle) * TILE * 0.6;
            const peekY = this.y + Math.sin(this.angle) * TILE * 0.6;
            const peekTile = world.getTile(peekX, peekY);
            if (peekTile === T.ROAD || peekTile === T.INTERSECTION) {
                this.state = 'crossing';
                this.crossAngle = this.angle;
                this.stateTimer = 12; // max seconds to complete the crossing
                return;
            }
        }

        const nx = this.x + Math.cos(this.angle) * spd * dt;
        const ny = this.y + Math.sin(this.angle) * spd * dt;

        if (world.isNPCWalkable(nx, ny) && !world.checkBuildingCollision(nx - 8, ny - 8, 16, 16)) {
            this.x = nx; this.y = ny;
        } else {
            // Push back slightly from obstruction
            this.x -= Math.cos(this.angle) * 3;
            this.y -= Math.sin(this.angle) * 3;

            // Try 90° turns before reversing — keeps NPCs walking along sidewalks
            const candidates = [
                this.angle + Math.PI / 2,
                this.angle - Math.PI / 2,
                this.angle + Math.PI
            ];
            let turned = false;
            for (const a of candidates) {
                const tx = this.x + Math.cos(a) * spd * dt * 3;
                const ty = this.y + Math.sin(a) * spd * dt * 3;
                if (world.isNPCWalkable(tx, ty) && !world.checkBuildingCollision(tx - 8, ty - 8, 16, 16)) {
                    this.angle = a;
                    this.stateTimer = 1.5 + Math.random() * 2;
                    turned = true;
                    break;
                }
            }
            if (!turned) {
                // Completely boxed in — pick a random open direction
                this.angle = Math.random() * Math.PI * 2;
                this.stateTimer = 1;
            }
        }
    }

    _updateCrossing(dt, spd, world) {
        const curTile = world.getTile(this.x, this.y);

        // Successfully reached the other side
        if (curTile === T.SIDEWALK || curTile === T.PARK || curTile === T.SAND || curTile === T.GRASS) {
            this.state = 'wander';
            this.stateTimer = 1 + Math.random() * 2;
            return;
        }

        if (this.stateTimer <= 0) {
            // Timed out mid-crossing — reverse direction and keep trying rather than
            // aborting to wander (which would leave them spinning in the intersection)
            this.crossAngle = this.crossAngle + Math.PI;
            this.stateTimer = 6;
            return;
        }

        // Walk straight across at 1.5× speed (faster when hurrying)
        const crossSpd = this.hurryTimer > 0 ? spd * 2 : this.speed * 1.5;
        const nx = this.x + Math.cos(this.crossAngle) * crossSpd * dt;
        const ny = this.y + Math.sin(this.crossAngle) * crossSpd * dt;

        if (world.isWalkable(nx, ny)) {
            this.x = nx; this.y = ny;
        } else {
            // Physically blocked (building) — reverse and try to escape
            this.crossAngle = this.crossAngle + Math.PI;
            this.stateTimer = 4;
        }
    }

    _updateFlee(dt, spd, world) {
        if (this.fleeTarget) {
            this.angle = Math.atan2(this.y - this.fleeTarget.y, this.x - this.fleeTarget.x);
        }

        const nx = this.x + Math.cos(this.angle) * spd * 2.5 * dt;
        const ny = this.y + Math.sin(this.angle) * spd * 2.5 * dt;

        // Fleeing NPCs stay on NPC-safe tiles — no running into roads
        if (world.isNPCWalkable(nx, ny)) {
            this.x = nx; this.y = ny;
        } else {
            // Try turning 90° left or right rather than freezing at a road edge
            const altLeft  = this.angle + Math.PI / 2;
            const altRight = this.angle - Math.PI / 2;
            const txL = this.x + Math.cos(altLeft)  * spd * 2 * dt;
            const tyL = this.y + Math.sin(altLeft)  * spd * 2 * dt;
            const txR = this.x + Math.cos(altRight) * spd * 2 * dt;
            const tyR = this.y + Math.sin(altRight) * spd * 2 * dt;
            if (world.isNPCWalkable(txL, tyL)) {
                this.x = txL; this.y = tyL;
            } else if (world.isNPCWalkable(txR, tyR)) {
                this.x = txR; this.y = tyR;
            }
        }

        if (this.stateTimer <= 0) {
            this.state = 'wander';
            this.stateTimer = 3;
        }
    }

    takeDamage(amount, particles) {
        this.health -= amount;
        particles.blood(this.x, this.y);
        if (this.health <= 0) {
            this.alive = false;
            this._generateDrop();
        }
    }

    _generateDrop() {
        const roll = Math.random();
        if (roll < 0.70) {
            // 70%: cash drop ($1–$50)
            this.drop = { type: 'cash', amount: 1 + Math.floor(Math.random() * 50) };
        } else if (roll < 0.85) {
            // 15%: ammo drop
            const weapons = ['pistol', 'smg', 'shotgun'];
            const wpn = weapons[Math.floor(Math.random() * weapons.length)];
            this.drop = { type: 'weapon', weapon: wpn, ammo: 5 + Math.floor(Math.random() * 15) };
        }
        // 15%: nothing dropped
    }

    draw(ctx) {
        if (!this.alive) {
            // Draw drop on ground if any
            if (this.drop) {
                ctx.save();
                ctx.globalAlpha = 0.85;
                if (this.drop.type === 'cash') {
                    ctx.fillStyle = '#22cc44';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 7px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$', this.x, this.y);
                } else {
                    ctx.fillStyle = '#cc8800';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 7px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('A', this.x, this.y);
                }
                ctx.restore();
            }
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Draw NPC as colored circle with simple body
        const colors = ['#3366cc', '#cc6633', '#339933', '#cc3366'];
        ctx.fillStyle = colors[this.imgIndex % colors.length];
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ddb892';
        ctx.beginPath();
        ctx.arc(0, -4, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
    }
}

class NPCManager {
    constructor(world, count) {
        this.npcs = [];
        this.world = world;
        for (let i = 0; i < count; i++) {
            const sp = world.getRandomSpawnPoint();
            if (sp) {
                this.npcs.push(new NPC(sp.x, sp.y, 'pedestrian', null));
            }
        }
    }

    update(dt, playerX, playerY, isShooting) {
        for (const npc of this.npcs) {
            if (!npc.alive) continue;
            npc.update(dt, this.world, playerX, playerY, isShooting);
        }

        // Respawn dead NPCs occasionally (only those whose drop has been collected)
        if (Math.random() < 0.002) {
            const dead = this.npcs.find(n => !n.alive && !n.drop);
            if (dead) {
                const sp = this.world.getRandomSpawnPoint();
                if (sp) {
                    dead.x = sp.x;
                    dead.y = sp.y;
                    dead.health = 50;
                    dead.alive = true;
                    dead.state = 'wander';
                    dead.drop = null;
                    dead.hurryTimer = 0;
                }
            }
        }
    }

    draw(ctx, camera) {
        for (const npc of this.npcs) {
            if (camera.isVisible(npc.x - 10, npc.y - 10, 20, 20)) {
                npc.draw(ctx);
            }
        }
    }
}
