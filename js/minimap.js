// ============================================
// MINIMAP
// ============================================
class Minimap {
    constructor(size) {
        this.size = size;
        this.x = 20;
        this.y = 0; // Set dynamically
        this.scale = size / WORLD_PX_W;
    }

    draw(ctx, canvasHeight, player, world, vehicles, missions, police, stores) {
        this.y = canvasHeight - this.size - 20;
        const cx = this.x + this.size / 2;
        const cy = this.y + this.size / 2;

        // Background circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, this.size / 2, 0, Math.PI * 2);
        ctx.clip();

        // Map offset (center on player)
        const mapScale = 0.8;
        const offsetX = cx - player.x * this.scale * mapScale;
        const offsetY = cy - player.y * this.scale * mapScale;

        // Draw tiles
        for (let y = 0; y < WORLD_H; y++) {
            for (let x = 0; x < WORLD_W; x++) {
                const tile = world.tiles[y][x];
                let color = '#2d8a4e';
                if (tile === T.ROAD || tile === T.CROSSWALK || tile === T.INTERSECTION) color = '#555';
                else if (tile === T.WATER) color = '#1a5276';
                else if (tile === T.SAND) color = '#d4b98a';
                else if (tile === T.BUILDING) color = '#888';
                else if (tile === T.SIDEWALK) color = '#999';
                ctx.fillStyle = color;
                ctx.fillRect(
                    offsetX + x * TILE * this.scale * mapScale,
                    offsetY + y * TILE * this.scale * mapScale,
                    TILE * this.scale * mapScale + 1,
                    TILE * this.scale * mapScale + 1
                );
            }
        }

        // Vehicles on minimap
        for (const v of vehicles) {
            const vx = offsetX + v.x * this.scale * mapScale;
            const vy = offsetY + v.y * this.scale * mapScale;

            if (v.type === 'helicopter') {
                ctx.fillStyle = '#222';
                ctx.beginPath();
                ctx.arc(vx, vy, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 8px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('H', vx, vy + 1);
            } else {
                ctx.fillStyle = v.type === 'police' ? '#ff0000' : '#00aaff';
                ctx.fillRect(vx - 2, vy - 2, 4, 4);
            }
        }

        // Store markers (Ammu-Nation)
        if (stores) {
            for (const store of stores) {
                const mx = offsetX + store.x * this.scale * mapScale;
                const my = offsetY + store.y * this.scale * mapScale;
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(mx, my, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#00ff66';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔫', mx, my + 1);
            }
        }

        // Mission markers
        const target = missions.getTargetPosition();
        if (target) {
            ctx.fillStyle = '#ffaa00';
            const mx = offsetX + target.x * this.scale * mapScale;
            const my = offsetY + target.y * this.scale * mapScale;
            ctx.beginPath();
            ctx.arc(mx, my, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mission start markers
        for (const marker of missions.missionMarkers) {
            ctx.fillStyle = '#ffff00';
            const mx = offsetX + marker.x * this.scale * mapScale;
            const my = offsetY + marker.y * this.scale * mapScale;
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Hospital blip — red cross
        {
            const mx = offsetX + HOSPITAL_PX.x * this.scale * mapScale;
            const my = offsetY + HOSPITAL_PX.y * this.scale * mapScale;
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(mx - 1, my - 5, 2, 10);
            ctx.fillRect(mx - 5, my - 1, 10, 2);
        }

        // Police station blip
        {
            const mx = offsetX + STATION_PX.x * this.scale * mapScale;
            const my = offsetY + STATION_PX.y * this.scale * mapScale;
            ctx.fillStyle = '#4466ff';
            ctx.beginPath();
            ctx.arc(mx, my, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 5px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('P', mx, my);
        }

        // Player blip
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        // Player direction arrow
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(player.angle) * 10, cy + Math.sin(player.angle) * 10);
        ctx.stroke();

        ctx.restore();

        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, this.size / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Outer glow
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, this.size / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}
