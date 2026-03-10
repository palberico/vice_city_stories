// ============================================
// WORLD GENERATION & RENDERING
// ============================================
const TILE = 64;
const WORLD_W = 80; // in tiles
const WORLD_H = 80;
const WORLD_PX_W = WORLD_W * TILE;
const WORLD_PX_H = WORLD_H * TILE;

// Tile types
const T = {
    WATER: 0, SAND: 1, GRASS: 2, SIDEWALK: 3, ROAD: 4,
    CROSSWALK: 5, BUILDING: 6, PARK: 7, INTERSECTION: 8
};

const TILE_COLORS = {
    [T.WATER]: '#1a5276',
    [T.SAND]: '#f0d9a0',
    [T.GRASS]: '#2d8a4e',
    [T.SIDEWALK]: '#b0a89a',
    [T.ROAD]: '#3a3a3a',
    [T.CROSSWALK]: '#3a3a3a',
    [T.BUILDING]: '#666',
    [T.PARK]: '#1e7a3a',
    [T.INTERSECTION]: '#3a3a3a'
};

// Special fixed locations — placed inside city blocks between road grid lines
const HOSPITAL_PX = { x: 42 * TILE, y: 40 * TILE };
const STATION_PX  = { x: 30 * TILE, y: 26 * TILE + TILE / 2 };
const STATION_PARKING_PX = { x: 30 * TILE, y: 34 * TILE + TILE / 2 };
const PAY_SPRAY_PX = { x: 52 * TILE + TILE / 2, y: 55 * TILE + TILE / 2 };
const HEAL_PX      = { x: 42 * TILE, y: 43 * TILE + TILE / 2 }; // sidewalk south of hospital
const LAWYER_PX    = { x: 62 * TILE + TILE / 2, y: 14 * TILE }; // NE — sidewalk east of v=58 road
const BANK_PX      = { x: 54 * TILE + TILE / 2, y: 30 * TILE + TILE / 2 }; // NE quadrant — south face of bank building

class World {
    constructor() {
        this.tiles = [];
        this.buildings = [];
        this.spawnPoints = [];
        this.vehicleSpawns = [];
        this.generate();
    }

    generate() {
        // Init all grass
        this.tiles = Array.from({ length: WORLD_H }, () => Array(WORLD_W).fill(T.GRASS));

        // Water border (ocean on left and bottom)
        for (let y = 0; y < WORLD_H; y++) {
            for (let x = 0; x < WORLD_W; x++) {
                if (x < 3 || y > WORLD_H - 4) this.tiles[y][x] = T.WATER;
                else if (x < 5 || y > WORLD_H - 6) this.tiles[y][x] = T.SAND;
            }
        }

        // Beach strip along water
        for (let y = 0; y < WORLD_H - 6; y++) {
            if (this.tiles[y][5] === T.GRASS) this.tiles[y][5] = T.SAND;
            if (this.tiles[y][6] === T.GRASS) this.tiles[y][6] = T.SAND;
        }

        // Road grid — 4-tile wide roads, spaced every 12 tiles
        // This creates wider roads and reasonably-sized city blocks
        const ROAD_WIDTH = 4;
        const ROAD_SPACING = 12;
        const roadPositions = { h: [], v: [] };

        // Store on instance for vehicle AI lane system
        this.ROAD_WIDTH = ROAD_WIDTH;
        this.roadPositions = roadPositions;

        // Vertical roads — extend from top of map (y=0) down
        for (let i = 10; i < WORLD_W - 5; i += ROAD_SPACING) {
            roadPositions.v.push(i);
            for (let y = 0; y < WORLD_H - 6; y++) {
                for (let r = 0; r < ROAD_WIDTH; r++) {
                    if (i + r < WORLD_W) {
                        this.tiles[y][i + r] = T.ROAD;
                    }
                }
            }
        }

        // Determine the last horizontal road position for south edge treatment
        // (calculated after horizontal roads are generated below)

        // Horizontal roads — start at the first vertical road, not before
        const firstVRoad = 10; // first vertical road column
        for (let j = 8; j < WORLD_H - 6; j += ROAD_SPACING) {
            roadPositions.h.push(j);
            for (let x = firstVRoad; x < WORLD_W; x++) {
                for (let r = 0; r < ROAD_WIDTH; r++) {
                    if (j + r < WORLD_H) {
                        this.tiles[j + r][x] = T.ROAD;
                    }
                }
            }
        }

        // Edge road identifiers
        const firstV = roadPositions.v[0]; // westernmost vertical road
        const lastH = roadPositions.h[roadPositions.h.length - 1]; // southernmost horizontal road

        // Trim vertical roads to end at the last horizontal road (+ road width)
        for (const vx of roadPositions.v) {
            for (let y = lastH + ROAD_WIDTH; y < WORLD_H; y++) {
                for (let r = 0; r < ROAD_WIDTH; r++) {
                    if (vx + r < WORLD_W && this.tiles[y][vx + r] === T.ROAD) {
                        this.tiles[y][vx + r] = T.GRASS;
                    }
                }
            }
        }

        // Intersections — cover the full crossing area, but skip diagonal corners for sidewalk
        for (const vx of roadPositions.v) {
            for (const hy of roadPositions.h) {
                // Don't expand left of the first vertical road
                const dxStart = (vx === firstV) ? 0 : -1;
                // Don't expand below the last horizontal road
                const dyEnd = (hy === lastH) ? ROAD_WIDTH - 1 : ROAD_WIDTH;
                for (let dy = -1; dy <= dyEnd; dy++) {
                    for (let dx = dxStart; dx <= ROAD_WIDTH; dx++) {
                        // Skip the diagonal corners — these become sidewalk
                        if ((dy === -1 || dy === dyEnd) && (dx === dxStart || dx === ROAD_WIDTH)) continue;
                        const ty = hy + dy, tx = vx + dx;
                        if (ty >= 0 && ty < WORLD_H && tx >= 0 && tx < WORLD_W) {
                            this.tiles[ty][tx] = T.INTERSECTION;
                        }
                    }
                }
            }
        }

        // Sidewalks — thin 1-tile border along roads, between road and buildings
        for (let y = 0; y < WORLD_H; y++) {
            for (let x = 0; x < WORLD_W; x++) {
                if (this.tiles[y][x] !== T.GRASS && this.tiles[y][x] !== T.SAND) continue;
                const neighbors = [
                    y > 0 ? this.tiles[y - 1][x] : -1,
                    y < WORLD_H - 1 ? this.tiles[y + 1][x] : -1,
                    x > 0 ? this.tiles[y][x - 1] : -1,
                    x < WORLD_W - 1 ? this.tiles[y][x + 1] : -1
                ];
                if (neighbors.some(n => n === T.ROAD || n === T.INTERSECTION)) {
                    if (this.tiles[y][x] !== T.WATER) this.tiles[y][x] = T.SIDEWALK;
                }
            }
        }

        // Corner sidewalks — place sidewalk at the exact diagonal corners of each intersection
        for (const vx of roadPositions.v) {
            for (const hy of roadPositions.h) {
                const corners = [];
                // Only add left corners if NOT the westernmost road
                if (vx !== firstV) {
                    corners.push({ x: vx - 1, y: hy - 1 });          // top-left
                    if (hy !== lastH) corners.push({ x: vx - 1, y: hy + ROAD_WIDTH }); // bottom-left
                }
                corners.push({ x: vx + ROAD_WIDTH, y: hy - 1 });  // top-right
                // Only add bottom-right corner if NOT the southernmost road
                if (hy !== lastH) corners.push({ x: vx + ROAD_WIDTH, y: hy + ROAD_WIDTH }); // bottom-right
                for (const c of corners) {
                    if (c.x >= 0 && c.x < WORLD_W && c.y >= 0 && c.y < WORLD_H) {
                        if (this.tiles[c.y][c.x] === T.GRASS || this.tiles[c.y][c.x] === T.SAND) {
                            this.tiles[c.y][c.x] = T.SIDEWALK;
                        }
                    }
                }
            }
        }

        // Crosswalks — connect sidewalk corners across roads at each intersection edge
        for (const vx of roadPositions.v) {
            for (const hy of roadPositions.h) {
                // Top crosswalk: row hy-1, across the vertical road (columns vx to vx+RW-1)
                for (let dx = 0; dx < ROAD_WIDTH; dx++) {
                    const ty = hy - 1, tx = vx + dx;
                    if (ty >= 0 && ty < WORLD_H && tx >= 0 && tx < WORLD_W) {
                        this.tiles[ty][tx] = T.CROSSWALK;
                    }
                }
                // Bottom crosswalk: row hy+RW — ONLY if not the southernmost road
                if (hy !== lastH) {
                    for (let dx = 0; dx < ROAD_WIDTH; dx++) {
                        const ty = hy + ROAD_WIDTH, tx = vx + dx;
                        if (ty >= 0 && ty < WORLD_H && tx >= 0 && tx < WORLD_W) {
                            this.tiles[ty][tx] = T.CROSSWALK;
                        }
                    }
                }
                // Left crosswalk: column vx-1 — ONLY if not the westernmost road
                if (vx !== firstV) {
                    for (let dy = 0; dy < ROAD_WIDTH; dy++) {
                        const ty = hy + dy, tx = vx - 1;
                        if (ty >= 0 && ty < WORLD_H && tx >= 0 && tx < WORLD_W) {
                            this.tiles[ty][tx] = T.CROSSWALK;
                        }
                    }
                }
                // Right crosswalk: column vx+RW, across the horizontal road
                for (let dy = 0; dy < ROAD_WIDTH; dy++) {
                    const ty = hy + dy, tx = vx + ROAD_WIDTH;
                    if (ty >= 0 && ty < WORLD_H && tx >= 0 && tx < WORLD_W) {
                        this.tiles[ty][tx] = T.CROSSWALK;
                    }
                }
            }
        }

        // Continuous sidewalk strip along the west side of the first vertical road
        for (let y = 0; y < lastH + ROAD_WIDTH; y++) {
            if (this.tiles[y][firstV - 1] === T.GRASS || this.tiles[y][firstV - 1] === T.SAND) {
                this.tiles[y][firstV - 1] = T.SIDEWALK;
            }
        }

        // Continuous sidewalk strip along the south side of the last horizontal road
        for (let x = firstV; x < WORLD_W; x++) {
            const sy = lastH + ROAD_WIDTH;
            if (sy < WORLD_H && (this.tiles[sy][x] === T.GRASS || this.tiles[sy][x] === T.SAND)) {
                this.tiles[sy][x] = T.SIDEWALK;
            }
        }

        // Buildings — fill city blocks tightly, right against sidewalks
        const buildingColors = [
            '#8899aa', '#7788aa', '#667799', '#998877', '#aa8866',
            '#887799', '#6688aa', '#556677', '#889988', '#aa7766',
            '#cc8855', '#5577aa', '#7a8899', '#996644', '#668877'
        ];

        for (let vi = 0; vi < roadPositions.v.length; vi++) {
            for (let hi = 0; hi < roadPositions.h.length; hi++) {
                const vx = roadPositions.v[vi];
                const hy = roadPositions.h[hi];

                // Block is NW of this intersection
                // Right edge: vx - 1 (sidewalk), so building ends at vx - 2
                // Bottom edge: hy - 1 (sidewalk), so building ends at hy - 2
                // Left edge: previous vertical road right side + sidewalk
                // Top edge: previous horizontal road bottom side + sidewalk
                const prevVx = vi > 0 ? roadPositions.v[vi - 1] : firstV - 2;
                const prevHy = hi > 0 ? roadPositions.h[hi - 1] : -ROAD_WIDTH - 1;

                const blockLeft = prevVx + ROAD_WIDTH + 1;  // after prev road + sidewalk
                const blockTop = Math.max(0, prevHy + ROAD_WIDTH + 1);   // after prev road + sidewalk, clamp to 0
                const blockRight = vx - 1;                   // before sidewalk
                const blockBottom = hy - 1;                  // before sidewalk

                const blockW = blockRight - blockLeft;
                const blockH = blockBottom - blockTop;

                if (blockW < 2 || blockH < 2) continue;
                if (blockLeft < 7) continue;

                // Fill with buildings — try to cover the whole block
                // Strategy: place large buildings that tile the entire block
                let placed = [];
                let attempts = 0;
                const maxAttempts = 30;

                while (attempts < maxAttempts) {
                    attempts++;
                    const bw = 2 + Math.floor(Math.random() * Math.min(4, blockW - 1));
                    const bh = 2 + Math.floor(Math.random() * Math.min(4, blockH - 1));
                    const bx = blockLeft + Math.floor(Math.random() * Math.max(1, blockW - bw + 1));
                    const by = blockTop + Math.floor(Math.random() * Math.max(1, blockH - bh + 1));

                    if (bx + bw > blockRight + 1 || by + bh > blockBottom + 1) continue;

                    let canPlace = true;
                    for (let dy = 0; dy < bh && canPlace; dy++) {
                        for (let dx = 0; dx < bw && canPlace; dx++) {
                            const ty = by + dy, tx = bx + dx;
                            if (ty < 0 || ty >= WORLD_H || tx < 0 || tx >= WORLD_W) { canPlace = false; continue; }
                            if (this.tiles[ty][tx] !== T.GRASS) canPlace = false;
                        }
                    }

                    if (canPlace) {
                        const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];
                        const height = 30 + Math.floor(Math.random() * 60);
                        this.buildings.push({
                            x: bx * TILE, y: by * TILE,
                            w: bw * TILE, h: bh * TILE,
                            color, height,
                            windows: Math.random() > 0.2,
                            roofColor: '#' + Math.floor(Math.random() * 0x444444 + 0x333333).toString(16)
                        });
                        for (let dy = 0; dy < bh; dy++) {
                            for (let dx = 0; dx < bw; dx++) {
                                this.tiles[by + dy][bx + dx] = T.BUILDING;
                            }
                        }
                        placed.push({ bx, by, bw, bh });
                    }
                }
            }
        }

        // Parks
        const parkLocations = [[15, 22], [37, 42], [55, 27]];
        for (const [px, py] of parkLocations) {
            if (px + 4 < WORLD_W && py + 4 < WORLD_H) {
                for (let dy = 0; dy < 4; dy++) {
                    for (let dx = 0; dx < 4; dx++) {
                        if (this.tiles[py + dy][px + dx] === T.GRASS) {
                            this.tiles[py + dy][px + dx] = T.PARK;
                        }
                    }
                }
            }
        }

        // ---- Hospital block (map center, between v=34/v=46 and h=32/h=44) ----
        // Clear random buildings and place a single white hospital building
        {
            const HBX = 39, HBY = 37, HBW = 6, HBH = 6;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= HBX && bl < HBX + HBW && bb >= HBY && bt < HBY + HBH);
            });
            for (let ty = HBY; ty < HBY + HBH; ty++) {
                for (let tx = HBX; tx < HBX + HBW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: HBX * TILE, y: HBY * TILE,
                w: HBW * TILE, h: HBH * TILE,
                color: '#e0e8f0', height: 40,
                windows: true, roofColor: '#d0d8e0',
                isHospital: true
            });

        }

        // ---- Police station block (between v=22/v=34 and h=20/h=32) ----
        // Full 6x6 block is building
        {
            const SBX = 27, SBW = 6;
            const SBuildY = 25, SBuildH = 6;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= SBX && bl < SBX + SBW && bb >= SBuildY && bt < SBuildY + SBuildH);
            });
            for (let ty = SBuildY; ty < SBuildY + SBuildH; ty++) {
                for (let tx = SBX; tx < SBX + SBW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: SBX * TILE, y: SBuildY * TILE,
                w: SBW * TILE, h: SBuildH * TILE,
                color: '#334466', height: 40,
                windows: true, roofColor: '#223355',
                isPoliceStation: true
            });
        }

        // ---- Bank block (NE quadrant, between v=46/v=58 and h=20/h=32) ----
        // Full 6x6 block for collision/sidewalk; sprite drawn at half-size in SW corner
        {
            const BBX = 51, BBW = 6;
            const BBY = 25, BBH = 6;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= BBX && bl < BBX + BBW && bb >= BBY && bt < BBY + BBH);
            });
            for (let ty = BBY; ty < BBY + BBH; ty++) {
                for (let tx = BBX; tx < BBX + BBW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: BBX * TILE, y: BBY * TILE,
                w: BBW * TILE, h: BBH * TILE,
                color: '#4a3a20', height: 40,
                windows: true, roofColor: '#3a2a10',
                isBank: true
            });
        }

        // Spawn points on sidewalks, parks, and sand
        for (let y = 5; y < WORLD_H - 6; y++) {
            for (let x = 7; x < WORLD_W - 2; x++) {
                if (this.tiles[y][x] === T.SIDEWALK || this.tiles[y][x] === T.PARK || this.tiles[y][x] === T.SAND) {
                    this.spawnPoints.push({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
                }
            }
        }
        // Fallback
        if (this.spawnPoints.length < 10) {
            this.spawnPoints.push({ x: WORLD_PX_W / 2, y: WORLD_PX_H / 2 });
        }

        // Vehicle spawn points on roads — in correct lanes
        // Vertical roads: down traffic (angle=PI/2) in lanes 0-1, up traffic (angle=-PI/2) in lanes 2-3
        for (const vx of roadPositions.v) {
            for (let y = 10; y < WORLD_H - 10; y += 8) {
                // Down traffic: lane 1 center
                this.vehicleSpawns.push({
                    x: (vx + 1) * TILE + TILE / 2,
                    y: y * TILE,
                    angle: Math.PI / 2
                });
                // Up traffic: lane 3 center (every other spawn)
                if (y % 16 === 2) {
                    this.vehicleSpawns.push({
                        x: (vx + 2) * TILE + TILE / 2,
                        y: y * TILE,
                        angle: -Math.PI / 2
                    });
                }
            }
        }
        // Horizontal roads: right traffic (angle=0) in lanes 2-3, left traffic (angle=PI) in lanes 0-1
        for (const hy of roadPositions.h) {
            for (let x = 10; x < WORLD_W - 5; x += 8) {
                // Right traffic: lane 3 center
                this.vehicleSpawns.push({
                    x: x * TILE,
                    y: (hy + 2) * TILE + TILE / 2,
                    angle: 0
                });
                // Left traffic: lane 1 center (every other spawn)
                if (x % 16 === 2) {
                    this.vehicleSpawns.push({
                        x: x * TILE,
                        y: (hy + 1) * TILE + TILE / 2,
                        angle: Math.PI
                    });
                }
            }
        }

        // Build sidewalk sprite map for all buildings
        this._buildSidewalkSprites();
    }

    _buildSidewalkSprites() {
        this.sidewalkSprites = new Map();
        const set = (tx, ty, key, rot) => {
            if (ty >= 0 && ty < WORLD_H && tx >= 0 && tx < WORLD_W &&
                this.tiles[ty][tx] === T.SIDEWALK) {
                this.sidewalkSprites.set(`${tx},${ty}`, { key, rot: rot || 0 });
            }
        };
        for (const b of this.buildings) {
            if (!b.isHospital && !b.isPoliceStation && !b.isBank) continue;
            const bx1 = Math.round(b.x / TILE);
            const by1 = Math.round(b.y / TILE);
            const bx2 = bx1 + Math.round(b.w / TILE) - 1;
            const by2 = by1 + Math.round(b.h / TILE) - 1;
            // Corners
            set(bx1 - 1, by1 - 1, 'sidewalk/corner', 0);               // NW
            set(bx2 + 1, by1 - 1, 'sidewalk/corner', Math.PI / 2);     // NE
            set(bx2 + 1, by2 + 1, 'sidewalk/corner', Math.PI);         // SE
            set(bx1 - 1, by2 + 1, 'sidewalk/corner', -Math.PI / 2);   // SW
            // Top edge
            for (let tx = bx1; tx <= bx2; tx++) set(tx, by1 - 1, 'sidewalk/sidewalk_plain', 0);
            // Bottom edge
            for (let tx = bx1; tx <= bx2; tx++) set(tx, by2 + 1, 'sidewalk/sidewalk_plain', Math.PI);
            // Left edge
            for (let ty = by1; ty <= by2; ty++) set(bx1 - 1, ty, 'sidewalk/sidewalk_plain', -Math.PI / 2);
            // Right edge
            for (let ty = by1; ty <= by2; ty++) set(bx2 + 1, ty, 'sidewalk/sidewalk_plain', Math.PI / 2);
        }
    }

    getTile(x, y) {
        const tx = Math.floor(x / TILE);
        const ty = Math.floor(y / TILE);
        if (tx < 0 || tx >= WORLD_W || ty < 0 || ty >= WORLD_H) return T.WATER;
        return this.tiles[ty][tx];
    }

    isWalkable(x, y) {
        const t = this.getTile(x, y);
        return t !== T.WATER && t !== T.BUILDING;
    }

    // NPCs can only walk on sidewalks, crosswalks, parks, and the beach
    isNPCWalkable(x, y) {
        const t = this.getTile(x, y);
        return t === T.SIDEWALK || t === T.CROSSWALK || t === T.PARK || t === T.SAND;
    }

    isDriveable(x, y) {
        const t = this.getTile(x, y);
        return t === T.ROAD || t === T.CROSSWALK || t === T.INTERSECTION || t === T.SIDEWALK || t === T.GRASS || t === T.SAND || t === T.PARK;
    }

    // Returns info about which road segment a pixel position is on
    // Returns { type: 'h'|'v'|'intersection'|null, roadStart: tileIndex, laneIndex: 0-3 }
    getRoadInfo(px, py) {
        const tx = Math.floor(px / TILE);
        const ty = Math.floor(py / TILE);
        const RW = this.ROAD_WIDTH;

        // Check vertical roads
        for (const vx of this.roadPositions.v) {
            if (tx >= vx && tx < vx + RW) {
                // Check if also on a horizontal road (intersection)
                for (const hy of this.roadPositions.h) {
                    if (ty >= hy - 1 && ty <= hy + RW) {
                        return { type: 'intersection', vRoad: vx, hRoad: hy, laneX: tx - vx, laneY: ty - hy };
                    }
                }
                return { type: 'v', roadStart: vx, lane: tx - vx };
            }
        }
        // Check horizontal roads
        for (const hy of this.roadPositions.h) {
            if (ty >= hy && ty < hy + RW) {
                return { type: 'h', roadStart: hy, lane: ty - hy };
            }
        }
        return null;
    }

    // Get the pixel center of a lane on a specific road
    // roadType: 'v' or 'h', roadStart: tile index, lane: 0-3
    getLaneCenter(roadType, roadStart, lane) {
        const tilePos = roadStart + lane;
        return tilePos * TILE + TILE / 2;
    }

    draw(ctx, camera, images) {
        const startX = Math.max(0, Math.floor((camera.x - camera.width / 2 / camera.zoom) / TILE) - 1);
        const startY = Math.max(0, Math.floor((camera.y - camera.height / 2 / camera.zoom) / TILE) - 1);
        const endX = Math.min(WORLD_W, Math.ceil((camera.x + camera.width / 2 / camera.zoom) / TILE) + 1);
        const endY = Math.min(WORLD_H, Math.ceil((camera.y + camera.height / 2 / camera.zoom) / TILE) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                ctx.fillStyle = TILE_COLORS[tile] || '#333';
                ctx.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1);

                // Sidewalk — sprite override or default curb detail
                if (tile === T.SIDEWALK) {
                    const override = images && this.sidewalkSprites &&
                        this.sidewalkSprites.get(`${x},${y}`);
                    if (override) {
                        const img = images[override.key];
                        if (img && img.complete && img.width > 0) {
                            ctx.save();
                            ctx.translate(x * TILE + TILE / 2, y * TILE + TILE / 2);
                            if (override.rot) ctx.rotate(override.rot);
                            ctx.drawImage(img, -TILE / 2, -TILE / 2, TILE, TILE);
                            ctx.restore();
                        }
                    } else {
                        // Check for adjacent road and draw a curb line
                        ctx.fillStyle = '#9a9488';
                        const top = y > 0 ? this.tiles[y - 1][x] : -1;
                        const bot = y < WORLD_H - 1 ? this.tiles[y + 1][x] : -1;
                        const lft = x > 0 ? this.tiles[y][x - 1] : -1;
                        const rgt = x < WORLD_W - 1 ? this.tiles[y][x + 1] : -1;
                        const isRoad = t => t === T.ROAD || t === T.CROSSWALK || t === T.INTERSECTION;
                        if (isRoad(top)) ctx.fillRect(x * TILE, y * TILE, TILE, 2);
                        if (isRoad(bot)) ctx.fillRect(x * TILE, y * TILE + TILE - 2, TILE, 2);
                        if (isRoad(lft)) ctx.fillRect(x * TILE, y * TILE, 2, TILE);
                        if (isRoad(rgt)) ctx.fillRect(x * TILE + TILE - 2, y * TILE, 2, TILE);
                    }
                }

                // Park decoration
                if (tile === T.PARK) {
                    ctx.fillStyle = '#1a6b30';
                    if ((x + y) % 3 === 0) {
                        ctx.beginPath();
                        ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 12, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#4a2a0a';
                        ctx.fillRect(x * TILE + TILE / 2 - 2, y * TILE + TILE / 2, 4, 15);
                    }
                }

                // Beach/west palm tree strip — grass tiles bordering the sand on west and south edges
                if (tile === T.GRASS && (x + y) % 2 === 0) {
                    const onWestStrip  = (x === 7 || x === 8) && y < WORLD_H - 7;
                    const onSouthStrip = (y === WORLD_H - 7 || y === WORLD_H - 8) && x >= 7;
                    if (onWestStrip || onSouthStrip) {
                        const cx = x * TILE + TILE / 2;
                        const cy = y * TILE + TILE / 2;
                        ctx.fillStyle = '#5c3a10';
                        ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#228b35';
                        ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#2ec44a';
                        ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.beginPath(); ctx.arc(cx + 3, cy - 5, 5, 0, Math.PI * 2); ctx.fill();
                    }
                }

                // Water shimmer
                if (tile === T.WATER) {
                    ctx.fillStyle = `rgba(100,180,255,${0.05 + Math.sin(Date.now() / 1000 + x + y) * 0.03})`;
                    ctx.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1);
                }
            }
        }

        // Stop lines at intersections — one per approach, spanning 2 lanes only
        const RW = this.ROAD_WIDTH; // 4
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (const vx of this.roadPositions.v) {
            for (const hy of this.roadPositions.h) {
                // Check if intersection is in camera view (rough check)
                const ix = vx * TILE, iy = hy * TILE;
                const iw = RW * TILE, ih = RW * TILE;
                if (!camera.isVisible(ix - TILE, iy - TILE, iw + 2 * TILE, ih + 2 * TILE)) continue;

                // Northbound traffic (going UP) — lanes 3-4 (columns vx+2, vx+3)
                // Stop line at south approach — ONLY if not the southernmost road
                if (hy !== this.roadPositions.h[this.roadPositions.h.length - 1]) {
                    ctx.fillRect(
                        (vx + 2) * TILE,           // starts at lane 3
                        (hy + RW) * TILE,           // top edge of bottom crosswalk row
                        2 * TILE,                   // spans 2 lanes (lanes 3-4)
                        3                           // line thickness
                    );
                }

                // Southbound traffic (going DOWN) — lanes 1-2 (columns vx, vx+1)
                // Stop line at north approach: horizontal line at bottom of top crosswalk row
                // Extends from upper-left corner inward (2 tiles)
                ctx.fillRect(
                    vx * TILE,                  // starts at lane 1
                    (hy) * TILE - 3,            // bottom edge of top crosswalk row
                    2 * TILE,                   // spans 2 lanes (lanes 1-2)
                    3                           // line thickness
                );

                // Eastbound traffic (going RIGHT) — lanes 3-4 (rows hy+2, hy+3)
                // Stop line at west approach — ONLY if not the westernmost road
                if (vx !== this.roadPositions.v[0]) {
                    ctx.fillRect(
                        vx * TILE,                  // right edge of left crosswalk column
                        (hy + 2) * TILE,            // starts at lane 3
                        3,                          // line thickness
                        2 * TILE                    // spans 2 lanes (lanes 3-4)
                    );
                }

                // Westbound traffic (going LEFT) — lanes 1-2 (rows hy, hy+1)
                // Stop line at east approach: vertical line at left of right crosswalk column
                // Extends from upper-right corner inward (2 tiles)
                ctx.fillRect(
                    (vx + RW) * TILE - 3,       // left edge of right crosswalk column
                    hy * TILE,                  // starts at lane 1
                    3,                          // line thickness
                    2 * TILE                    // spans 2 lanes (lanes 1-2)
                );
            }
        }
    }

    drawBuildings(ctx, camera, images) {
        for (const b of this.buildings) {
            if (!camera.isVisible(b.x, b.y, b.w, b.h)) continue;

            if (b.isHospital && images && images['hospital'] && images['hospital'].complete) {
                ctx.drawImage(images['hospital'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isPoliceStation && images && images['police_building'] && images['police_building'].complete) {
                ctx.drawImage(images['police_building'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isBank && images && images['bank'] && images['bank'].complete) {
                ctx.drawImage(images['bank'], b.x, b.y + b.h / 3, b.w * 2 / 3, b.h * 2 / 3);
                continue;
            }

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(b.x + 5, b.y + 5, b.w, b.h);
            // Building body
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            // Border
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x, b.y, b.w, b.h);
            // Roof accent
            ctx.fillStyle = b.roofColor;
            ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, 6);
            // Windows
        }
    }

    checkBuildingCollision(x, y, w, h) {
        for (const b of this.buildings) {
            if (Collision.aabb({ x, y, w, h }, { x: b.x, y: b.y, w: b.w, h: b.h })) {
                return b;
            }
        }
        return null;
    }

    getRandomSpawnPoint() {
        return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    }

    getRandomVehicleSpawn() {
        return this.vehicleSpawns[Math.floor(Math.random() * this.vehicleSpawns.length)];
    }
}
