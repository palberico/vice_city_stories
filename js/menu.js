// ============================================
// MENU SYSTEM
// ============================================
class MenuSystem {
    constructor() {
        this.state = 'main'; // main, playing, paused, phone
        this.logoImg = null;
        this.fadeAlpha = 1;
        this.phoneOpen = false;
    }

    setLogo(img) {
        this.logoImg = img;
    }

    drawMainMenu(ctx, canvas) {
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

        // Neon glow effect on "Press ENTER to Start"
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.shadowColor = '#ff1493';
        ctx.shadowBlur = 20 * pulse;
        ctx.fillStyle = `rgba(255,255,255,${pulse})`;
        ctx.font = 'bold 24px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CLICK OR PRESS ENTER TO START', W / 2, H * 0.65);
        ctx.shadowBlur = 0;

        // Controls guide
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '14px "Segoe UI", Arial';
        const controls = [
            'WASD / Arrows — Move / Drive        E — Enter / Exit Vehicle',
            'Left Click — Shoot                  Q — Switch Weapon',
            'SHIFT — Sprint                      SPACE — Handbrake',
            'F — Rob NPC                         R — Change Radio',
            'TAB — Phone (Missions)              M — Full Map',
            'I — Controls Info                   ESC — Pause',
        ];
        controls.forEach((c, i) => {
            ctx.fillText(c, W / 2, H * 0.73 + i * 22);
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

        // Phone frame
        const pw = 260;
        const ph = 400;
        const px = W / 2 - pw / 2;
        const py = H / 2 - ph / 2;

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
        ctx.fillRect(px + 10, py + 40, pw - 20, ph - 80);

        // Title
        ctx.fillStyle = '#ff1493';
        ctx.font = 'bold 16px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📱 MISSIONS', W / 2, py + 60);

        // Mission list
        ctx.textAlign = 'left';
        ctx.font = '13px "Segoe UI", Arial';
        let yOffset = py + 85;
        for (const mission of missions.missions) {
            if (mission.completed) {
                ctx.fillStyle = '#44aa44';
                ctx.fillText(`✓ ${mission.name} — COMPLETED`, px + 20, yOffset);
            } else if (missions.activeMission === mission) {
                ctx.fillStyle = '#ffaa00';
                ctx.fillText(`► ${mission.name} — IN PROGRESS`, px + 20, yOffset);
            } else if (mission.available) {
                ctx.fillStyle = '#aaaacc';
                ctx.fillText(`○ ${mission.name} — $${mission.reward}`, px + 20, yOffset);
            }
            ctx.fillStyle = '#666';
            ctx.font = '10px "Segoe UI", Arial';
            ctx.fillText(mission.description, px + 32, yOffset + 14);
            ctx.font = '13px "Segoe UI", Arial';
            yOffset += 42;
        }

        // Close hint
        ctx.fillStyle = '#888';
        ctx.font = '12px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press TAB to close', W / 2, py + ph - 25);
    }
}
