// ============================================
// WEAPON SYSTEM
// ============================================
const WEAPONS = {
    fist: { name: 'Fist', damage: 10, fireRate: 0.4, range: 40, ammo: Infinity, auto: false, bulletSpeed: 0, spread: 0 },
    pistol: { name: 'Pistol', damage: 25, fireRate: 0.3, range: 400, ammo: 60, auto: false, bulletSpeed: 800, spread: 0.08 },
    smg: { name: 'SMG', damage: 15, fireRate: 0.08, range: 350, ammo: 120, auto: true, bulletSpeed: 700, spread: 0.15 },
    shotgun: { name: 'Shotgun', damage: 40, fireRate: 0.6, range: 250, ammo: 30, auto: false, bulletSpeed: 600, spread: 0.4, pellets: 5 },
    rpg: { name: 'RPG', damage: 100, fireRate: 1.5, range: 600, ammo: 3, auto: false, bulletSpeed: 500, spread: 0, explosive: true, explodeRadius: 80 }
};

class Bullet {
    constructor(x, y, angle, speed, damage, owner, weaponName) {
        this.x = x; this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.damage = damage;
        this.life = 1.0;
        this.owner = owner;
        this.weaponName = weaponName || 'pistol'; // fallback
        this.w = this.weaponName === 'rpg' ? 8 : 4;
        this.h = this.weaponName === 'rpg' ? 8 : 4;
        this.active = true;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.active = false;
    }
    draw(ctx) {
        ctx.fillStyle = this.weaponName === 'rpg' ? '#ff4400' : '#ffcc00';
        if (this.weaponName === 'rpg') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
        }
    }
}

class WeaponManager {
    constructor() {
        this.bullets = [];
        this.currentWeapon = 'fist';
        this.inventory = { fist: true, pistol: false, smg: false, shotgun: false, rpg: false };
        this.ammo = { pistol: 0, smg: 0, shotgun: 0, rpg: 0 };
        this.fireCooldown = 0;
    }

    pickupWeapon(type, ammoAmount) {
        this.inventory[type] = true;
        if (type !== 'fist') this.ammo[type] = (this.ammo[type] || 0) + ammoAmount;
        this.currentWeapon = type;
    }

    cycleWeapon() {
        const weapons = Object.keys(this.inventory).filter(w => this.inventory[w]);
        const idx = weapons.indexOf(this.currentWeapon);
        this.currentWeapon = weapons[(idx + 1) % weapons.length];
    }

    shoot(x, y, angle, owner, particles, audio) {
        if (this.fireCooldown > 0) return;
        const wpn = WEAPONS[this.currentWeapon];
        if (!wpn || wpn.bulletSpeed === 0) return; // fists handled separately

        if (this.currentWeapon !== 'fist' && this.ammo[this.currentWeapon] <= 0) return;
        if (this.currentWeapon !== 'fist') this.ammo[this.currentWeapon]--;

        const pellets = wpn.pellets || 1;
        for (let i = 0; i < pellets; i++) {
            const a = angle + (Math.random() - 0.5) * wpn.spread;
            this.bullets.push(new Bullet(x, y, a, wpn.bulletSpeed, wpn.damage, owner, this.currentWeapon));
        }

        this.fireCooldown = wpn.fireRate;
        particles.muzzleFlash(x + Math.cos(angle) * 20, y + Math.sin(angle) * 20, angle);

        if (this.currentWeapon === 'shotgun') audio.playShotgun();
        else audio.playGunshot();
    }

    update(dt) {
        this.fireCooldown = Math.max(0, this.fireCooldown - dt);
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update(dt);
            if (!this.bullets[i].active) this.bullets.splice(i, 1);
        }
    }

    drawBullets(ctx) {
        this.bullets.forEach(b => b.draw(ctx));
    }

    getCurrentWeapon() {
        return WEAPONS[this.currentWeapon];
    }
}
