// ============================================
// TRAFFIC LIGHT SYSTEM
// ============================================
class TrafficLightSystem {
    constructor(roadPositions) {
        this.roadPositions = roadPositions;
        this.intersections = new Map(); // key: "vx,hy" -> { timer, phase }

        const GREEN_TIME = 8, YELLOW_TIME = 2;
        this.GREEN_TIME = GREEN_TIME;
        this.YELLOW_TIME = YELLOW_TIME;
        this.CYCLE = (GREEN_TIME + YELLOW_TIME) * 2; // 20 seconds per full cycle

        let idx = 0;
        for (const vx of roadPositions.v) {
            for (const hy of roadPositions.h) {
                // Stagger start times so nearby intersections don't all change at once
                const offset = (idx * 3.7) % this.CYCLE;
                const il = { timer: offset, phase: 0 };
                this._computePhase(il);
                this.intersections.set(`${vx},${hy}`, il);
                idx++;
            }
        }
    }

    _computePhase(il) {
        const G = this.GREEN_TIME, Y = this.YELLOW_TIME;
        const t = il.timer;
        if (t < G)           il.phase = 0; // NS green,  EW red
        else if (t < G + Y)  il.phase = 1; // NS yellow, EW red
        else if (t < G*2+Y)  il.phase = 2; // NS red,    EW green
        else                 il.phase = 3; // NS red,    EW yellow
    }

    update(dt) {
        for (const il of this.intersections.values()) {
            il.timer += dt;
            if (il.timer >= this.CYCLE) il.timer -= this.CYCLE;
            this._computePhase(il);
        }
    }

    // Returns 'green', 'yellow', or 'red' for vehicles approaching this intersection
    // direction: 'ns' (on vertical road) or 'ew' (on horizontal road)
    getState(vx, hy, direction) {
        const il = this.intersections.get(`${vx},${hy}`);
        if (!il) return 'green';
        if (direction === 'ns') {
            if (il.phase === 0) return 'green';
            if (il.phase === 1) return 'yellow';
            return 'red';
        } else {
            if (il.phase === 2) return 'green';
            if (il.phase === 3) return 'yellow';
            return 'red';
        }
    }

    draw(ctx, camera, RW) {
        for (const [key, il] of this.intersections) {
            const [vx, hy] = key.split(',').map(Number);
            if (!camera.isVisible((vx - 1) * TILE, (hy - 1) * TILE, (RW + 2) * TILE, (RW + 2) * TILE)) continue;

            const nsState = il.phase === 0 ? 'green' : il.phase === 1 ? 'yellow' : 'red';
            const ewState = il.phase === 2 ? 'green' : il.phase === 3 ? 'yellow' : 'red';

            // NS signals at NE and SW corners (facing north-south traffic)
            this._drawSignal(ctx, (vx + RW) * TILE + TILE / 2, (hy - 1) * TILE + TILE / 2, nsState, 'v');
            this._drawSignal(ctx, (vx - 1) * TILE + TILE / 2, (hy + RW) * TILE + TILE / 2, nsState, 'v');

            // EW signals at NW and SE corners (facing east-west traffic)
            this._drawSignal(ctx, (vx - 1) * TILE + TILE / 2, (hy - 1) * TILE + TILE / 2, ewState, 'h');
            this._drawSignal(ctx, (vx + RW) * TILE + TILE / 2, (hy + RW) * TILE + TILE / 2, ewState, 'h');
        }
    }

    _drawSignal(ctx, cx, cy, state, orientation) {
        const isVert = orientation === 'v';
        const boxW = isVert ? 10 : 28;
        const boxH = isVert ? 28 : 10;
        const dotR = 3.5;
        const spacing = 9;

        // Housing
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);

        const positions = isVert
            ? [{ x: 0, y: -spacing }, { x: 0, y: 0 }, { x: 0, y: spacing }]   // red top → green bottom
            : [{ x: -spacing, y: 0 }, { x: 0, y: 0 }, { x: spacing, y: 0 }];  // red left → green right

        const lightColors = [
            { on: '#ff2222', off: '#3a0808' },  // red
            { on: '#ffee00', off: '#3a3400' },  // yellow
            { on: '#22ff44', off: '#083a12' },  // green
        ];

        const activeIdx = state === 'red' ? 0 : state === 'yellow' ? 1 : 2;

        for (let i = 0; i < 3; i++) {
            const p = positions[i];
            const c = lightColors[i];
            const isActive = i === activeIdx;

            // Glow for the active light
            if (isActive) {
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = c.on;
                ctx.beginPath();
                ctx.arc(cx + p.x, cy + p.y, dotR + 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }

            ctx.fillStyle = isActive ? c.on : c.off;
            ctx.beginPath();
            ctx.arc(cx + p.x, cy + p.y, dotR, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
