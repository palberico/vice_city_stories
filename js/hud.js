// ============================================
// HUD (Heads-Up Display)
// ============================================
class HUD {
    constructor() {
        this.minimap = new Minimap(150);
        this.notificationQueue = [];
    }

    notify(msg, duration = 3) {
        this.notificationQueue.push({ text: msg, timer: duration });
    }

    draw(ctx, canvas, player, world, vehicles, missions, police, audio, dayNight, stores) {
        const W = canvas.width;
        const H = canvas.height;

        // ---- Health / Armor Bars (bottom-right) ----
        const barX = W - 220;
        const barY = H - 50;
        // Health
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, 200, 14);
        ctx.fillStyle = player.health > 50 ? '#00cc44' : player.health > 25 ? '#ccaa00' : '#cc2200';
        ctx.fillRect(barX + 1, barY + 1, 198 * (player.health / 100), 12);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px "Segoe UI", Arial';
        ctx.textAlign = 'left';
        ctx.fillText('HP', barX - 22, barY + 11);

        // Stamina (shown while swimming or recovering)
        if (player.isSwimming || player.stamina < player.maxStamina) {
            const stRatio = player.stamina / player.maxStamina;
            const stColor = stRatio > 0.5 ? '#00aaff' : stRatio > 0.2 ? '#0066cc' : '#ff4400';
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, barY - 18, 200, 14);
            ctx.fillStyle = stColor;
            ctx.fillRect(barX + 1, barY - 17, 198 * stRatio, 12);
            ctx.fillStyle = '#88ccff';
            ctx.font = 'bold 10px "Segoe UI", Arial';
            ctx.textAlign = 'left';
            ctx.fillText('ST', barX - 22, barY - 7);
        }

        // Armor (always 36px above HP bar so it doesn't overlap stamina)
        if (player.armor > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX, barY - 36, 200, 14);
            ctx.fillStyle = '#4488cc';
            ctx.fillRect(barX + 1, barY - 35, 198 * (player.armor / 100), 12);
            ctx.fillStyle = '#aaccff';
            ctx.font = 'bold 10px "Segoe UI", Arial';
            ctx.fillText('AR', barX - 22, barY - 25);
        }

        // ---- Wanted Level Stars (top-right) ----
        ctx.font = '22px Arial';
        ctx.textAlign = 'right';
        for (let i = 0; i < 5; i++) {
            if (i < Math.floor(player.wantedLevel)) {
                ctx.fillStyle = '#ffcc00';
            } else if (i < player.wantedLevel) {
                ctx.fillStyle = '#cc8800';
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
            }
            ctx.fillText('★', W - 20 - i * 26, 35);
        }

        // ---- Money (top-right below stars) ----
        ctx.fillStyle = '#44dd44';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`$${player.money.toLocaleString()}`, W - 20, 60);

        // ---- Weapon Info (bottom-right) ----
        const wpn = player.weapons.getCurrentWeapon();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px "Segoe UI", Arial';
        ctx.textAlign = 'right';
        ctx.fillText(wpn.name, W - 20, H - 60);
        if (player.weapons.currentWeapon !== 'fist') {
            ctx.fillStyle = '#aaa';
            ctx.font = '12px "Segoe UI", Arial';
            ctx.fillText(`Ammo: ${player.weapons.ammo[player.weapons.currentWeapon]}`, W - 20, H - 75);
        }

        // ---- Vehicle info ----
        if (player.inVehicle) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(W / 2 - 100, H - 40, 200, 30);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px "Segoe UI", Arial';
            ctx.textAlign = 'center';
            ctx.fillText(player.inVehicle.name, W / 2, H - 22);
            // Speed (scaled so motorcycle at 480 matches 220 mph)
            ctx.fillStyle = '#aaa';
            ctx.font = '11px "Segoe UI", Arial';
            ctx.fillText(`${Math.abs(Math.round(player.inVehicle.speed * (220 / 480)))} mph`, W / 2, H - 10);

            // Vehicle health bar
            const vhRatio = Math.max(0, player.inVehicle.health / 200);
            const vhColor = vhRatio > 0.6 ? '#00cc44' : vhRatio > 0.3 ? '#ccaa00' : '#cc3300';
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(W / 2 - 100, H - 57, 200, 10);
            ctx.fillStyle = vhColor;
            ctx.fillRect(W / 2 - 100, H - 57, 200 * vhRatio, 10);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px "Segoe UI", Arial';
            ctx.textAlign = 'left';
            ctx.fillText('CAR', W / 2 - 100 - 24, H - 49);

            // Radio station
            const stations = ['♫ Synthwave FM', '♫ Vice Beats', '♫ Neon Dance'];
            if (audio.radioPlaying) {
                ctx.fillStyle = '#ffaa00';
                ctx.font = '11px "Segoe UI", Arial';
                ctx.textAlign = 'center';
                ctx.fillText(stations[audio.radioStation] + '  [R] Change', W / 2, H - 70);
            }
        }

        // ---- Mission Objective ----
        const objective = missions.getCurrentObjective();
        if (objective) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(W / 2 - 200, 10, 400, 30);
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 13px "Segoe UI", Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`★ ${objective}`, W / 2, 30);
        }

        // ---- Race Timer ----
        const raceTimer = missions.getMissionTimer();
        if (raceTimer !== null) {
            const secs = Math.ceil(raceTimer);
            const urgent = secs <= 15;
            ctx.fillStyle = urgent ? 'rgba(180,0,0,0.8)' : 'rgba(0,0,0,0.6)';
            ctx.fillRect(W / 2 - 60, 45, 120, 28);
            ctx.fillStyle = urgent ? '#ff4444' : '#ffffff';
            ctx.font = `bold 18px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(`⏱ ${secs}s`, W / 2, 64);
        }

        // ---- Mission Message ----
        if (missions.messageTimer > 0) {
            const alpha = Math.min(1, missions.messageTimer);
            const isFailed = missions.missionMessage.startsWith('MISSION FAILED');
            ctx.fillStyle = `rgba(0,0,0,${0.7 * alpha})`;
            ctx.fillRect(W / 2 - 300, raceTimer !== null ? 80 : 50, 600, 35);
            ctx.fillStyle = isFailed ? `rgba(255,80,80,${alpha})` : `rgba(255,255,255,${alpha})`;
            ctx.font = 'bold 15px "Segoe UI", Arial';
            ctx.textAlign = 'center';
            ctx.fillText(missions.missionMessage, W / 2, (raceTimer !== null ? 80 : 50) + 22);
        }

        // ---- Day/Night indicator ----
        ctx.fillStyle = '#aaa';
        ctx.font = '12px "Segoe UI", Arial';
        ctx.textAlign = 'left';
        const hours = Math.floor(dayNight.time);
        const mins = Math.floor((dayNight.time % 1) * 60);
        ctx.fillText(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`, 20, 25);

        // ---- Controls hint (top-left, small) ----
        if (!player.inVehicle) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px "Segoe UI", Arial';
            ctx.fillText('WASD:Move  Shift:Sprint  E:Enter Car  Q:Switch Weapon  Click:Shoot', 20, 42);
        } else {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px "Segoe UI", Arial';
            ctx.fillText('WASD:Drive  Space:Brake  E:Exit  R:Radio  Click:Shoot  ESC:Pause  F:Rob  M:Map', 20, 42);
        }

        // ---- Notifications ----
        for (let i = this.notificationQueue.length - 1; i >= 0; i--) {
            const n = this.notificationQueue[i];
            n.timer -= 0.016;
            if (n.timer <= 0) { this.notificationQueue.splice(i, 1); continue; }
            const alpha = Math.min(1, n.timer);
            ctx.fillStyle = `rgba(0,0,0,${0.6 * alpha})`;
            ctx.fillRect(W / 2 - 200, 100 + i * 30, 400, 25);
            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
            ctx.font = '13px "Segoe UI", Arial';
            ctx.textAlign = 'center';
            ctx.fillText(n.text, W / 2, 118 + i * 30);
        }

        // ---- Chat Box (mission dialogue) ----
        if (missions.chatBox && missions.chatBox.active) {
            const bw = 620, bh = 140, bx = W / 2 - bw / 2, by = H - bh - 20;
            ctx.fillStyle = 'rgba(10,10,20,0.92)';
            ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, bw, bh);
            ctx.fillStyle = '#ff8800';
            ctx.font = 'bold 13px "Segoe UI", Arial';
            ctx.textAlign = 'left';
            ctx.fillText('DARNELL:', bx + 18, by + 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Segoe UI", Arial';
            const lines = missions.chatBox.lines || [];
            for (let i = 0; i < lines.length; i++) {
                ctx.fillText(lines[i], bx + 18, by + 46 + i * 22);
            }
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '11px "Segoe UI", Arial';
            ctx.textAlign = 'right';
            ctx.fillText('[E] Close', bx + bw - 14, by + bh - 10);
        }

        // ---- Minimap ----
        this.minimap.draw(ctx, H, player, world, vehicles, missions, police, stores);

        // ---- Death / Arrest Screen ----
        if (!player.alive) {
            ctx.fillStyle = 'rgba(180,0,0,0.5)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px "Segoe UI", Arial';
            ctx.textAlign = 'center';
            if (player.arrested) {
                ctx.fillText('ARRESTED', W / 2, H / 2);
                ctx.font = '18px "Segoe UI", Arial';
                ctx.fillText(`$${player.arrestedLost.toLocaleString()} confiscated — releasing at station...`, W / 2, H / 2 + 40);
            } else {
                ctx.fillText('WASTED', W / 2, H / 2);
                ctx.font = '18px "Segoe UI", Arial';
                ctx.fillText(`Respawning... -$100`, W / 2, H / 2 + 40);
            }
        }
    }
}
