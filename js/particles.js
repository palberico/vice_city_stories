// ============================================
// PARTICLE SYSTEM
// ============================================
class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = life; this.maxLife = life;
        this.color = color; this.size = size;
        this.alpha = 1;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.alpha = Math.max(0, this.life / this.maxLife);
        this.size *= 0.99;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, options = {}) {
        const { color = '#ffaa00', speed = 100, life = 0.5, size = 3, spread = Math.PI * 2, angle = 0 } = options;
        for (let i = 0; i < count; i++) {
            const a = angle + (Math.random() - 0.5) * spread;
            const s = speed * (0.5 + Math.random() * 0.5);
            const colors = Array.isArray(color) ? color[Math.floor(Math.random() * color.length)] : color;
            this.particles.push(new Particle(
                x, y, Math.cos(a) * s, Math.sin(a) * s,
                life * (0.5 + Math.random()), colors, size * (0.5 + Math.random())
            ));
        }
    }

    muzzleFlash(x, y, angle) {
        this.emit(x, y, 8, { color: ['#ffff00', '#ffaa00', '#ff6600'], speed: 200, life: 0.15, size: 4, spread: 0.5, angle });
    }

    impact(x, y) {
        this.emit(x, y, 5, { color: ['#ffcc00', '#ff8800', '#aaaaaa'], speed: 80, life: 0.3, size: 2 });
    }

    blood(x, y) {
        this.emit(x, y, 8, { color: ['#cc0000', '#880000', '#ff0000'], speed: 60, life: 0.4, size: 3 });
    }

    explosion(x, y) {
        this.emit(x, y, 30, { color: ['#ff4400', '#ffaa00', '#ffff00', '#333333'], speed: 200, life: 0.8, size: 6 });
        this.emit(x, y, 20, { color: ['#666666', '#444444', '#222222'], speed: 100, life: 1.2, size: 8 });
    }

    tireSmoke(x, y) {
        this.emit(x, y, 2, { color: ['#aaaaaa88', '#88888888'], speed: 20, life: 0.6, size: 5 });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
