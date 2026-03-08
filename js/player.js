// ============================================
// PLAYER
// ============================================
class Player {
    constructor(x, y, img) {
        this.x = x; this.y = y;
        this.w = 20; this.h = 20;
        this.speed = 150;
        this.sprintSpeed = 250;
        this.health = 100;
        this.armor = 0;
        this.money = 500;
        this.wantedLevel = 0;
        this.wantedTimer = 0;
        this.wantedDecayTimer = 0;
        this.angle = 0;
        this.inVehicle = null;
        this.weapons = new WeaponManager();
        this.weapons.pickupWeapon('pistol', 30);
        this.img = img;
        this.footstepTimer = 0;
        this.moving = false;
        this.alive = true;
        this.respawnTimer = 0;
        this.enterCooldown = 0;
    }

    update(dt, world, vehicles, audio, particles) {
        this.enterCooldown = Math.max(0, this.enterCooldown - dt);

        if (!this.alive) {
            this.respawnTimer -= dt;
            if (this.respawnTimer <= 0) this.respawn(world);
            return;
        }

        if (this.inVehicle) {
            // In vehicle
            this.x = this.inVehicle.x;
            this.y = this.inVehicle.y;
            this.angle = this.inVehicle.angle;

            // Exit vehicle
            if (Input.isDown('e') && this.enterCooldown <= 0) {
                this.exitVehicle();
                return;
            }

            // Shoot from vehicle
            if (Input.mouse.clicked && this.weapons.currentWeapon !== 'fist') {
                const aimAngle = Math.atan2(Input.mouse.worldY - this.y, Input.mouse.worldX - this.x);
                this.weapons.shoot(this.x, this.y, aimAngle, 'player', particles, audio);
            }

            // Radio controls
            if (Input.isDown('r')) {
                Input.keys['r'] = false; // consume
                const station = (audio.radioStation + 1) % 3;
                audio.startRadio(station);
            }

            // Tire smoke when drifting
            if (Input.isDown(' ') && Math.abs(this.inVehicle.speed) > 100) {
                particles.tireSmoke(
                    this.x - Math.cos(this.angle) * 20 + (Math.random() - 0.5) * 10,
                    this.y - Math.sin(this.angle) * 20 + (Math.random() - 0.5) * 10
                );
                if (Math.random() < 0.02) audio.playTireScreech();
            }
        } else {
            // On foot
            this.moving = false;
            const sprint = Input.isDown('shift');
            const spd = sprint ? this.sprintSpeed : this.speed;
            let dx = 0, dy = 0;
            if (Input.isDown('w') || Input.isDown('arrowup')) dy = -1;
            if (Input.isDown('s') || Input.isDown('arrowdown')) dy = 1;
            if (Input.isDown('a') || Input.isDown('arrowleft')) dx = -1;
            if (Input.isDown('d') || Input.isDown('arrowright')) dx = 1;

            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx * dx + dy * dy);
                dx /= len; dy /= len;
                const newX = this.x + dx * spd * dt;
                const newY = this.y + dy * spd * dt;
                this.angle = Math.atan2(dy, dx);
                this.moving = true;

                if (world.isWalkable(newX, this.y)) this.x = newX;
                if (world.isWalkable(this.x, newY)) this.y = newY;

                // Building collision
                const bCol = world.checkBuildingCollision(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
                if (bCol) {
                    Collision.resolveAABB(
                        { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h },
                        { x: bCol.x, y: bCol.y, w: bCol.w, h: bCol.h }
                    );
                    this.x = this.x;
                    this.y = this.y;
                }

                // Footsteps
                this.footstepTimer -= dt;
                if (this.footstepTimer <= 0) {
                    audio.playFootstep();
                    this.footstepTimer = sprint ? 0.25 : 0.4;
                }
            }

            // Enter vehicle
            if (Input.isDown('e') && this.enterCooldown <= 0) {
                const nearest = this.findNearestVehicle(vehicles);
                if (nearest && Collision.dist(this.x, this.y, nearest.x, nearest.y) < 60) {
                    this.enterVehicle(nearest, audio);
                }
            }

            // Aim
            this.angle = Math.atan2(Input.mouse.worldY - this.y, Input.mouse.worldX - this.x);

            // Shoot
            if (Input.mouse.down && this.weapons.getCurrentWeapon().auto) {
                this.weapons.shoot(this.x, this.y, this.angle, 'player', particles, audio);
            } else if (Input.mouse.clicked) {
                this.weapons.shoot(this.x, this.y, this.angle, 'player', particles, audio);
            }

            // Cycle weapon
            if (Input.isDown('q')) {
                Input.keys['q'] = false;
                this.weapons.cycleWeapon();
            }
        }

        this.weapons.update(dt);

        // Wanted level decay
        if (this.wantedLevel > 0) {
            this.wantedDecayTimer += dt;
            if (this.wantedDecayTimer > 15) {
                this.wantedLevel = Math.max(0, this.wantedLevel - 1);
                this.wantedDecayTimer = 0;
            }
        }

        // Clamp position
        this.x = Math.max(10, Math.min(WORLD_PX_W - 10, this.x));
        this.y = Math.max(10, Math.min(WORLD_PX_H - 10, this.y));
    }

    takeDamage(amount) {
        if (this.armor > 0) {
            const armorBlock = Math.min(this.armor, amount * 0.7);
            this.armor -= armorBlock;
            amount -= armorBlock;
        }
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            this.respawnTimer = 3;
            if (this.inVehicle) this.exitVehicle();
        }
    }

    addWanted(amount, audio) {
        const prevLevel = this.wantedLevel;
        this.wantedLevel = Math.min(5, this.wantedLevel + amount);
        this.wantedDecayTimer = 0;
        if (Math.floor(this.wantedLevel) > Math.floor(prevLevel)) {
            audio.playWantedUp();
        }
    }

    enterVehicle(vehicle, audio) {
        this.inVehicle = vehicle;
        vehicle.driver = this;
        this.enterCooldown = 0.5;
        audio.playCarDoor();
        audio.startRadio(0);
    }

    exitVehicle() {
        if (!this.inVehicle) return;
        this.x = this.inVehicle.x + Math.cos(this.inVehicle.angle + Math.PI / 2) * 40;
        this.y = this.inVehicle.y + Math.sin(this.inVehicle.angle + Math.PI / 2) * 40;
        this.inVehicle.driver = null;
        this.inVehicle.speed *= 0.3;
        this.inVehicle = null;
        this.enterCooldown = 0.5;
        if (typeof game !== 'undefined') game.audio.stopRadio();
        if (typeof game !== 'undefined') game.audio.playCarDoor();
    }

    findNearestVehicle(vehicles) {
        let nearest = null, minDist = Infinity;
        for (const v of vehicles) {
            const d = Collision.dist(this.x, this.y, v.x, v.y);
            if (d < minDist) { minDist = d; nearest = v; }
        }
        return nearest;
    }

    respawn(world) {
        this.alive = true;
        this.health = 100;
        this.armor = 0;
        this.wantedLevel = 0;
        this.money = Math.max(0, this.money - 100);
        const sp = world.getRandomSpawnPoint();
        if (sp) { this.x = sp.x; this.y = sp.y; }
    }

    draw(ctx) {
        if (!this.alive) return;
        if (this.inVehicle) return; // drawn as vehicle

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        if (this.img && this.img.complete) {
            const scale = 0.07;
            ctx.drawImage(this.img, -this.img.width * scale / 2, -this.img.height * scale / 2, this.img.width * scale, this.img.height * scale);
        } else {
            // Fallback
            ctx.fillStyle = '#ffaa44';
            ctx.fillRect(-10, -12, 20, 24);
            ctx.fillStyle = '#cc8833';
            ctx.fillRect(-8, -12, 16, 8);
        }

        // Weapon indicator
        if (this.weapons.currentWeapon !== 'fist') {
            ctx.fillStyle = '#555';
            ctx.fillRect(6, -3, 14, 4);
        }

        ctx.restore();
    }

    getBounds() {
        return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
    }
}
