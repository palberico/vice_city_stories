// ============================================
// NPC SYSTEM
// ============================================
class NPC {
    constructor(x, y, type, charSprites) {
        this.x = x; this.y = y;
        this.w = 16; this.h = 16;
        this.type = type; // 'pedestrian' or 'traffic'
        this.speed = 40 + Math.random() * 30;
        // Start facing a cardinal direction so movement aligns with the sidewalk grid
        const CARD = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        this.angle = CARD[Math.floor(Math.random() * 4)];
        this.health = 50;
        this.alive = true;
        this.state = 'wander'; // wander, crossing, flee
        this.stateTimer = 2 + Math.random() * 5;
        this.charSprites = charSprites; // { front, back, frontWalk, backWalk }
        this.walkTimer = 0;
        this.fleeTarget = null;
        this.drop = null; // set on death: { type: 'cash'|'weapon', amount, weapon, ammo }
        this.crossAngle = 0;  // committed crossing direction
        this.hurryTimer = 0;  // >0 means a car is waiting — move faster to get clear
        this.crossCooldown = 3 + Math.random() * 8; // counts down; when it hits 0 the NPC will cross at the next corner
        this.wantsToCross = false;                   // true once cooldown expires — NPC crosses at next corner visited
        this.crossOnRoad = false; // true once NPC has entered road/intersection during a crossing
    }

    update(dt, world, playerX, playerY, isShooting) {
        if (!this.alive) return;

        this.walkTimer += dt;
        this.stateTimer -= dt;
        if (this.hurryTimer > 0) this.hurryTimer -= dt;
        if (this.crossCooldown > 0) this.crossCooldown -= dt;
        // When the cooldown expires, arm the "wants to cross" flag — it stays true
        // until the NPC actually reaches a corner and crosses.
        if (this.crossCooldown <= 0 && !this.wantsToCross) {
            this.wantsToCross = true;
            this.crossCooldown = 15 + Math.random() * 10; // arm the next cooldown immediately
        }

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

        // Street crossing — attempt whenever wantsToCross is armed AND NPC is at a corner.
        // A corner tile has road/intersection adjacent in 2+ directions; mid-block only has 1.
        if (this.state === 'wander' && this.wantsToCross && world.isNPCWalkable(this.x, this.y)) {
            const CARDINALS = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
            const isRoadType = t => t === T.ROAD || t === T.INTERSECTION || t === T.CROSSWALK;
            const roadDirs = CARDINALS.filter(a =>
                isRoadType(world.getTile(this.x + Math.cos(a) * TILE, this.y + Math.sin(a) * TILE))
            );
            if (roadDirs.length >= 2) {
                // At a corner — find a direction that crosses to a far sidewalk
                const dirs = [...roadDirs].sort(() => Math.random() - 0.5);
                crossSearch: for (const a of dirs) {
                    for (let d = TILE * 2; d <= TILE * 8; d += TILE) {
                        const t = world.getTile(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d);
                        if (t === T.SIDEWALK || t === T.PARK || t === T.SAND) {
                            this.state = 'crossing';
                            this.crossAngle = a;
                            this.stateTimer = 15;
                            this.crossOnRoad = false;
                            this.wantsToCross = false;
                            break crossSearch;
                        }
                        if (!isRoadType(t)) break;
                    }
                }
            }
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
        const isSidewalkSafe = (px, py) => {
            const t = world.getTile(px, py);
            return t === T.SIDEWALK || t === T.PARK || t === T.SAND;
        };

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
            if (isSidewalkSafe(tx, ty)) {
                this.angle = a;
                this.x = tx; this.y = ty;
                return;
            }
        }

        // Second pass: look further ahead to pick the best escape direction
        for (const a of candidates) {
            for (let d = TILE * 0.5; d <= TILE * 2; d += TILE * 0.5) {
                if (isSidewalkSafe(this.x + Math.cos(a) * d, this.y + Math.sin(a) * d)) {
                    this.angle = a;
                    this.x += Math.cos(a) * spd * dt * 2;
                    this.y += Math.sin(a) * spd * dt * 2;
                    return;
                }
            }
        }
    }

    _updateWander(dt, spd, world) {
        const CARDINALS = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

        // Movement: sidewalk + intersection corners are walkable
        const isSafe = (px, py) => {
            const t = world.getTile(px, py);
            return (t === T.SIDEWALK || t === T.PARK || t === T.SAND || t === T.INTERSECTION)
                && !world.checkBuildingCollision(px - 8, py - 8, 16, 16);
        };

        // Look-ahead: scan through intersection tiles (they bridge sidewalk gaps at corners).
        // Keep scanning until we find a real sidewalk tile (clear) or a hard blocker (road/building/water).
        const pathClear = (angle) => {
            for (let d = TILE * 0.75; d <= TILE * 8; d += TILE * 0.75) {
                const t = world.getTile(
                    this.x + Math.cos(angle) * d,
                    this.y + Math.sin(angle) * d
                );
                if (t === T.SIDEWALK || t === T.PARK || t === T.SAND) return true;
                if (t === T.INTERSECTION) continue; // pass through intersection corners
                return false; // road, building, water — hard block
            }
            return false;
        };

        const aheadBlocked = !pathClear(this.angle);

        if (aheadBlocked || this.stateTimer <= 0) {
            // Score each cardinal: straight(4) > 90° turn(3) > U-turn(1)
            const pool = [];
            for (const a of CARDINALS) {
                if (!pathClear(a)) continue;
                const diff = Math.abs(((a - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
                const w = diff < 0.1 ? 4 : diff > Math.PI - 0.1 ? 1 : 3;
                for (let i = 0; i < w; i++) pool.push(a);
            }
            if (pool.length > 0) {
                this.angle = pool[Math.floor(Math.random() * pool.length)];
            }
            this.stateTimer = 10 + Math.random() * 15;
        }

        const nx = this.x + Math.cos(this.angle) * spd * dt;
        const ny = this.y + Math.sin(this.angle) * spd * dt;

        if (isSafe(nx, ny)) {
            this.x = nx; this.y = ny;
        } else {
            this.stateTimer = 0; // blocked mid-stride — force re-evaluation next frame
        }
    }

    _updateCrossing(dt, spd, world) {
        const curTile = world.getTile(this.x, this.y);

        // Track when NPC steps onto road/intersection territory
        if (curTile === T.ROAD || curTile === T.INTERSECTION || curTile === T.CROSSWALK) {
            this.crossOnRoad = true;
        }

        // Successfully reached the other side — only valid after actually crossing road
        if (this.crossOnRoad && (curTile === T.SIDEWALK || curTile === T.PARK || curTile === T.SAND || curTile === T.GRASS)) {
            this.crossOnRoad = false;
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
        const isSidewalkSafe = (px, py) => {
            const t = world.getTile(px, py);
            return t === T.SIDEWALK || t === T.PARK || t === T.SAND;
        };

        if (this.fleeTarget) {
            this.angle = Math.atan2(this.y - this.fleeTarget.y, this.x - this.fleeTarget.x);
        }

        const nx = this.x + Math.cos(this.angle) * spd * 2.5 * dt;
        const ny = this.y + Math.sin(this.angle) * spd * 2.5 * dt;

        // Fleeing NPCs stay on sidewalk-safe tiles — no running into roads
        if (isSidewalkSafe(nx, ny)) {
            this.x = nx; this.y = ny;
        } else {
            // Try turning 90° left or right rather than freezing at a road edge
            const altLeft  = this.angle + Math.PI / 2;
            const altRight = this.angle - Math.PI / 2;
            const txL = this.x + Math.cos(altLeft)  * spd * 2 * dt;
            const tyL = this.y + Math.sin(altLeft)  * spd * 2 * dt;
            const txR = this.x + Math.cos(altRight) * spd * 2 * dt;
            const tyR = this.y + Math.sin(altRight) * spd * 2 * dt;
            if (isSidewalkSafe(txL, tyL)) {
                this.x = txL; this.y = tyL;
            } else if (isSidewalkSafe(txR, tyR)) {
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

        const s = this.charSprites;
        if (s) {
            // Determine facing from movement angle
            const sinA = Math.sin(this.angle);
            const cosA = Math.cos(this.angle);
            const facingDown = sinA >= 0; // positive-Y = toward camera = front sprite
            const facingLeft  = cosA < -0.3 && Math.abs(cosA) > Math.abs(sinA);

            // Alternate walk frames every 0.25 s
            const walkStep = Math.floor(this.walkTimer / 0.25) % 2 === 1;

            const sprite = facingDown
                ? (walkStep ? s.frontWalk : s.front)
                : (walkStep ? s.backWalk  : s.back);

            if (sprite && sprite.complete && sprite.width > 0) {
                const drawW = 18;
                const drawH = sprite.height * (drawW / sprite.width);
                if (facingLeft) ctx.scale(-1, 1); // mirror for leftward movement
                ctx.drawImage(sprite, -drawW / 2, -drawH / 2, drawW, drawH);
            }
        } else {
            ctx.fillStyle = '#888888';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
    }
}

class NPCManager {
    constructor(world, count, characters) {
        this.npcs = [];
        this.world = world;
        this.characters = Array.isArray(characters) ? characters : [];
        for (let i = 0; i < count; i++) {
            const sp = world.getRandomSpawnPoint();
            if (sp) {
                const charSprites = this.characters.length > 0
                    ? this.characters[Math.floor(Math.random() * this.characters.length)]
                    : null;
                this.npcs.push(new NPC(sp.x, sp.y, 'pedestrian', charSprites));
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
                    dead.crossCooldown = 3 + Math.random() * 8;
                    dead.crossOnRoad = false;
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
