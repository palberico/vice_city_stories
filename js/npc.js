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
        this.state = 'wander'; // wander, flee
        this.stateTimer = 2 + Math.random() * 5;
        this.img = img;
        this.imgIndex = Math.floor(Math.random() * 4);
        this.fleeTarget = null;
    }

    update(dt, world, playerX, playerY, isShooting) {
        if (!this.alive) return;

        this.stateTimer -= dt;

        // Flee if player is shooting nearby
        if (isShooting && Collision.dist(this.x, this.y, playerX, playerY) < 300) {
            this.state = 'flee';
            this.stateTimer = 3;
            this.fleeTarget = { x: playerX, y: playerY };
        }

        if (this.state === 'wander') {
            if (this.stateTimer <= 0) {
                this.angle = Math.random() * Math.PI * 2;
                this.stateTimer = 2 + Math.random() * 5;
            }
            const nx = this.x + Math.cos(this.angle) * this.speed * dt;
            const ny = this.y + Math.sin(this.angle) * this.speed * dt;
            // NPCs walk on sidewalks, sand, crosswalks, etc.
            if (world.isNPCWalkable(nx, ny) && !world.checkBuildingCollision(nx - 8, ny - 8, 16, 16)) {
                this.x = nx; this.y = ny;
            } else {
                // Instantly push back to escape the collision zone
                this.x -= Math.cos(this.angle) * 2;
                this.y -= Math.sin(this.angle) * 2;
                // Turn around 
                this.angle += Math.PI + (Math.random() - 0.5) * 0.5;
                this.stateTimer = 0.5 + Math.random() * 2;
            }
        } else if (this.state === 'flee') {
            if (this.fleeTarget) {
                this.angle = Math.atan2(this.y - this.fleeTarget.y, this.x - this.fleeTarget.x);
            }
            const nx = this.x + Math.cos(this.angle) * this.speed * 2.5 * dt;
            const ny = this.y + Math.sin(this.angle) * this.speed * 2.5 * dt;
            // Fleeing NPCs can run anywhere (panic mode)
            if (world.isWalkable(nx, ny)) {
                this.x = nx; this.y = ny;
            }
            if (this.stateTimer <= 0) {
                this.state = 'wander';
                this.stateTimer = 3;
            }
        }

        // Keep in world
        this.x = Math.max(TILE * 7, Math.min(WORLD_PX_W - TILE * 2, this.x));
        this.y = Math.max(TILE * 2, Math.min(WORLD_PX_H - TILE * 7, this.y));
    }

    takeDamage(amount, particles) {
        this.health -= amount;
        particles.blood(this.x, this.y);
        if (this.health <= 0) {
            this.alive = false;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
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

        // Respawn dead NPCs occasionally
        if (Math.random() < 0.002) {
            const dead = this.npcs.find(n => !n.alive);
            if (dead) {
                const sp = this.world.getRandomSpawnPoint();
                if (sp) {
                    dead.x = sp.x;
                    dead.y = sp.y;
                    dead.health = 50;
                    dead.alive = true;
                    dead.state = 'wander';
                }
            }
        }
    }

    draw(ctx, camera) {
        for (const npc of this.npcs) {
            if (!npc.alive) continue;
            if (camera.isVisible(npc.x - 10, npc.y - 10, 20, 20)) {
                npc.draw(ctx);
            }
        }
    }
}
