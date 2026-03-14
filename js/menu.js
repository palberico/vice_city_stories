// ============================================
// MENU SYSTEM
// ============================================
class MenuSystem {
    constructor() {
        this.state = 'main'; // main, playing, paused, phone
        this.logoImg = null;
        this.fadeAlpha = 1;
        this.phoneOpen = false;
        this.devMissionOpen = false;
        this.devMissionIndex = 0;
    }

    setLogo(img) {
        this.logoImg = img;
    }

    drawMainMenu(ctx, canvas, hasSaveData = false) {
        const W = canvas.width;
        const H = canvas.height;

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a0533');
        grad.addColorStop(0.5, '#2d1b4e');
        grad.addColorStop(1, '#ff6b35');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Animated palm tree silhouettes
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 5; i++) {
            const px = i * (W / 4) - 50 + Math.sin(Date.now() / 2000 + i) * 10;
            ctx.beginPath();
            ctx.moveTo(px + 10, H);
            ctx.lineTo(px + 15, H * 0.5);
            ctx.lineTo(px + 20, H);
            ctx.fill();
            // Palm leaves
            for (let j = 0; j < 5; j++) {
                const angle = -Math.PI / 2 + (j - 2) * 0.4 + Math.sin(Date.now() / 1000 + j) * 0.05;
                ctx.beginPath();
                ctx.moveTo(px + 15, H * 0.5);
                ctx.quadraticCurveTo(
                    px + 15 + Math.cos(angle) * 60, H * 0.5 + Math.sin(angle) * 60,
                    px + 15 + Math.cos(angle) * 100, H * 0.5 + Math.sin(angle) * 20
                );
                ctx.stroke();
            }
        }

        // Logo
        if (this.logoImg && this.logoImg.complete) {
            const logoW = Math.min(500, W * 0.6);
            const logoH = logoW * (this.logoImg.height / this.logoImg.width);
            ctx.drawImage(this.logoImg, W / 2 - logoW / 2, H * 0.08, logoW, logoH);
        } else {
            // Text fallback
            ctx.fillStyle = '#ff1493';
            ctx.font = 'bold 72px "Georgia", serif';
            ctx.textAlign = 'center';
            ctx.fillText('VICE CITY', W / 2, H * 0.25);
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 36px "Georgia", serif';
            ctx.fillText('STORIES', W / 2, H * 0.32);
        }

        // Main action prompt
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.shadowColor = '#ff1493';
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = `rgba(255,255,255,${pulse})`;
        ctx.font = 'bold 24px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            hasSaveData ? 'CLICK OR PRESS ENTER TO CONTINUE' : 'CLICK OR PRESS ENTER TO START',
            W / 2,
            H * 0.65
        );
        ctx.shadowBlur = 0;

        if (hasSaveData) {
            ctx.fillStyle = 'rgba(255,255,255,0.78)';
            ctx.font = 'bold 18px "Segoe UI", Arial';
            ctx.fillText('PRESS N FOR NEW GAME', W / 2, H * 0.69);
            ctx.fillStyle = 'rgba(255,255,255,0.42)';
            ctx.font = '13px "Segoe UI", Arial';
            ctx.fillText('Clears local save progress and driveway car', W / 2, H * 0.72);
        }

        // Controls guide
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px "Segoe UI", Arial';
        const controls = [
            'WASD / Arrows — Move / Drive        E — Enter / Exit Vehicle',
            'Left Click — Shoot                  Q — Switch Weapon',
            'SHIFT — Sprint                      SPACE — Handbrake',
            'F — Rob NPC                         R — Change Radio',
            'TAB — Phone (Missions)              M — Full Map',
            'S — Save at Safe House              H — Buy HP at Hospital ($25)',
            'L — Lawyer: Drop ★ ($200)           I — Controls Info',
            'ESC — Pause',
        ];
        const controlsStartY = hasSaveData ? H * 0.76 : H * 0.73;
        controls.forEach((c, i) => {
            ctx.fillText(c, W / 2, controlsStartY + i * 22);
        });

        // Version
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '11px "Segoe UI", Arial';
        ctx.fillText('v1.0 — Built with ❤️ and Canvas', W / 2, H - 20);
    }

    drawPauseMenu(ctx, canvas) {
        const W = canvas.width;
        const H = canvas.height;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', W / 2, H / 2 - 30);
        ctx.font = '20px "Segoe UI", Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Press ESC to Resume', W / 2, H / 2 + 20);
        ctx.fillText('Press M for Main Menu', W / 2, H / 2 + 50);
    }

    drawPhone(ctx, canvas, missions) {
        const W = canvas.width;
        const H = canvas.height;
        const availableMissions = missions.missions.filter(m => !m.completed && m.available && m !== missions.activeMission);
        const completedCount = missions.missions.filter(m => m.completed).length;
        const lockedCount = missions.missions.filter(m => !m.completed && !m.available).length;

        // Phone frame
        const pw = Math.min(360, W - 32);
        const ph = Math.min(640, H - 32);
        const px = W / 2 - pw / 2;
        const py = H / 2 - ph / 2;
        const screenX = px + 12;
        const screenY = py + 44;
        const screenW = pw - 24;
        const screenH = ph - 88;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);

        // Phone body
        ctx.fillStyle = '#1a1a2e';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 15);
        ctx.fill();
        ctx.stroke();

        // Screen
        ctx.fillStyle = '#0f0f23';
        ctx.fillRect(screenX, screenY, screenW, screenH);

        // Title
        ctx.fillStyle = '#ff1493';
        ctx.font = 'bold 16px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSIONS', W / 2, py + 28);

        // Screen content
        let cursorY = screenY + 18;
        const cardX = screenX + 12;
        const cardW = screenW - 24;

        ctx.textAlign = 'left';
        ctx.fillStyle = '#7ed9ff';
        ctx.font = 'bold 11px "Segoe UI", Arial';
        ctx.fillText('JOB TRACKER', cardX, cursorY);
        cursorY += 10;

        if (missions.activeMission) {
            const active = missions.activeMission;
            const activeCardH = 112;
            ctx.fillStyle = 'rgba(255, 170, 0, 0.14)';
            ctx.strokeStyle = 'rgba(255, 190, 60, 0.65)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX, cursorY, cardW, activeCardH, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ffd26a';
            ctx.font = 'bold 10px "Segoe UI", Arial';
            ctx.fillText('NOW PLAYING', cardX + 12, cursorY + 18);
            ctx.fillStyle = '#fff1c4';
            ctx.font = 'bold 17px "Segoe UI", Arial';
            ctx.fillText(active.name, cardX + 12, cursorY + 40);
            ctx.fillStyle = '#c5c8de';
            ctx.font = '11px "Segoe UI", Arial';
            this.drawWrappedText(ctx, active.description, cardX + 12, cursorY + 58, cardW - 24, 14, 2);

            const step = active.steps && active.steps[missions.currentStep];
            const footerY = cursorY + activeCardH - 24;
            if (step) {
                ctx.fillStyle = '#ffb347';
                ctx.font = 'bold 10px "Segoe UI", Arial';
                ctx.fillText('NEXT', cardX + 12, footerY);
                ctx.fillStyle = '#f5f7ff';
                ctx.font = '10px "Segoe UI", Arial';
                this.drawWrappedText(ctx, step.text, cardX + 46, footerY, cardW - 58, 12, 2);
            } else {
                ctx.fillStyle = '#f5f7ff';
                ctx.font = '10px "Segoe UI", Arial';
                ctx.fillText('Wrapping up mission...', cardX + 12, footerY);
            }
            cursorY += activeCardH + 18;
        } else {
            const idleCardH = 64;
            ctx.fillStyle = 'rgba(0, 180, 255, 0.10)';
            ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cardX, cursorY, cardW, idleCardH, 12);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#d9fbff';
            ctx.font = 'bold 14px "Segoe UI", Arial';
            ctx.fillText('No active mission', cardX + 12, cursorY + 24);
            ctx.fillStyle = '#9ea6c8';
            ctx.font = '11px "Segoe UI", Arial';
            ctx.fillText('Head to a mission marker to pick up new work.', cardX + 12, cursorY + 44);
            cursorY += idleCardH + 18;
        }

        ctx.fillStyle = '#7ed9ff';
        ctx.font = 'bold 11px "Segoe UI", Arial';
        ctx.fillText('AVAILABLE JOBS', cardX, cursorY);
        cursorY += 12;

        const listBottom = screenY + screenH - 86;
        const itemGap = 8;
        for (const mission of availableMissions) {
            const itemH = 58;
            if (cursorY + itemH > listBottom) break;

            ctx.fillStyle = 'rgba(150, 160, 220, 0.10)';
            ctx.strokeStyle = 'rgba(140, 150, 210, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cardX, cursorY, cardW, itemH, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#dfe3ff';
            ctx.font = 'bold 13px "Segoe UI", Arial';
            ctx.fillText(mission.name, cardX + 12, cursorY + 18);
            ctx.fillStyle = '#66ffb3';
            ctx.font = 'bold 10px "Segoe UI", Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`$${mission.reward}`, cardX + cardW - 12, cursorY + 18);
            ctx.textAlign = 'left';

            ctx.fillStyle = '#9ea6c8';
            ctx.font = '10px "Segoe UI", Arial';
            this.drawWrappedText(ctx, mission.description, cardX + 12, cursorY + 35, cardW - 24, 12, 2);
            cursorY += itemH + itemGap;
        }

        // Footer stats
        const chipY = screenY + screenH - 56;
        this.drawPhoneChip(ctx, cardX, chipY, 92, 28, '#44aa44', `${completedCount} DONE`);
        this.drawPhoneChip(ctx, cardX + 100, chipY, 92, 28, '#6677aa', `${lockedCount} LOCKED`);
        this.drawPhoneChip(ctx, cardX + 200, chipY, cardW - 200, 28, '#00bcd4', `${availableMissions.length} OPEN`);

        // Close hint
        ctx.fillStyle = '#888';
        ctx.font = '12px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press TAB to close', W / 2, py + ph - 25);
    }

    drawDevMissionPicker(ctx, canvas, missions) {
        const W = canvas.width;
        const H = canvas.height;
        const pickerW = Math.min(520, W - 40);
        const pickerH = Math.min(640, H - 40);
        const px = W / 2 - pickerW / 2;
        const py = H / 2 - pickerH / 2;
        const list = missions.missions;

        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#111827';
        ctx.fillRect(px, py, pickerW, pickerH);
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, pickerW, pickerH);

        ctx.fillStyle = '#ffb347';
        ctx.font = 'bold 18px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('DEV MISSION PICKER', W / 2, py + 28);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '11px "Segoe UI", Arial';
        ctx.fillText('Shift+Tab hidden tool', W / 2, py + 48);

        let y = py + 78;
        for (let i = 0; i < list.length; i++) {
            const mission = list[i];
            const selected = i === this.devMissionIndex;
            ctx.fillStyle = selected ? 'rgba(255,136,0,0.22)' : 'rgba(255,255,255,0.04)';
            ctx.fillRect(px + 14, y - 16, pickerW - 28, 34);
            ctx.fillStyle = selected ? '#fff3d1' : '#d1d5db';
            ctx.font = selected ? 'bold 13px "Segoe UI", Arial' : '12px "Segoe UI", Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${i + 1}. ${mission.name}`, px + 26, y);
            ctx.textAlign = 'right';
            ctx.fillStyle = mission.completed ? '#44aa44' : mission.available ? '#7ed9ff' : '#8892a6';
            ctx.fillText(mission.completed ? 'DONE' : mission.available ? 'OPEN' : 'LOCKED', px + pickerW - 26, y);
            y += 40;
            if (y > py + pickerH - 60) break;
        }

        ctx.fillStyle = '#9ca3af';
        ctx.font = '12px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Up/Down to choose, Enter to start, Shift+Tab to close', W / 2, py + pickerH - 20);
    }

    drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = Infinity) {
        const words = String(text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let line = '';

        for (const word of words) {
            const test = line ? `${line} ${word}` : word;
            if (ctx.measureText(test).width <= maxWidth || !line) {
                line = test;
            } else {
                lines.push(line);
                line = word;
                if (lines.length >= maxLines) break;
            }
        }

        if (lines.length < maxLines && line) lines.push(line);

        if (words.length > 0 && lines.length === maxLines) {
            const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
            if (consumed < words.length) {
                let truncated = lines[lines.length - 1];
                while (truncated.length > 0 && ctx.measureText(`${truncated}...`).width > maxWidth) {
                    truncated = truncated.slice(0, -1);
                }
                lines[lines.length - 1] = `${truncated.trimEnd()}...`;
            }
        }

        lines.forEach((wrappedLine, index) => {
            ctx.fillText(wrappedLine, x, y + index * lineHeight);
        });
    }

    drawPhoneChip(ctx, x, y, w, h, color, label) {
        ctx.fillStyle = `${color}22`;
        ctx.strokeStyle = `${color}aa`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 999);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f4f7ff';
        ctx.font = 'bold 10px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + w / 2, y + h / 2);
        ctx.textBaseline = 'alphabetic';
    }
}
