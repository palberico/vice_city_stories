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
const HOSPITAL_PX = { x: 45 * TILE, y: 47 * TILE }; // center of 4x4 hospital block
const HOSPITAL_DOOR_PX = { x: 45 * TILE, y: 49 * TILE - 8 }; // front door at the south face of the hospital
const STATION_PX = { x: 34 * TILE + TILE / 2, y: 32 * TILE + TILE / 2 }; // center of 5x5 police station
const STATION_PARKING_PX = { x: 34 * TILE + TILE / 2, y: 35 * TILE + TILE / 2 }; // one tile south of station
// Designated patrol car spawn spots — one car per tile, checked before spawning
const STATION_PATROL_SPOTS = [
    { tx: 29, ty: 33 }, { tx: 30, ty: 33 }, { tx: 31, ty: 33 },
    { tx: 29, ty: 31 }, { tx: 30, ty: 31 }, { tx: 31, ty: 31 },
];
const SAFE_HOUSE_PX = { x: 16.5 * TILE, y: 5.5 * TILE }; // center of the 3x3 safe house building
const SAFE_HOUSE_SPAWN_PX = { x: 18 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 }; // player start tile at 18,6
const SAFE_HOUSE_MARKER_PX = { x: 16.5 * TILE, y: 7.5 * TILE }; // same zone, shifted 0.5 tile right for better alignment
const SAFE_HOUSE_DRIVEWAY_PX = { x: 18.5 * TILE, y: 4.5 * TILE };
const HOSPITAL_PICKUP_PX = { x: 44 * TILE, y: 50 * TILE };
const ATTORNEY_DROP_PX = { x: 76 * TILE, y: 22 * TILE };
const ATTORNEY_OFFICE_PX = { x: 71 * TILE, y: 21 * TILE };
const PAY_SPRAY_PX = { x: 16.5 * TILE, y: 63 * TILE };
const HEAL_PX = { x: 45 * TILE, y: 50.5 * TILE }; // two tiles south of hospital
const LAWYER_PX = { x: 73 * TILE + TILE / 2, y: 19 * TILE }; // center of 5x4 lawyer building
const BANK_PX = { x: 56 * TILE, y: 29 * TILE }; // center of 4-tile robbery zone (SW corner of tile 56,28)

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

        // Road grid — 4-tile wide roads, spaced every 14 tiles
        // This creates wider roads and reasonably-sized city blocks (10-tile blocks)
        const ROAD_WIDTH = 4;
        const ROAD_SPACING = 14;
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
        // TEMP: random building spawns disabled for layout work
        const buildingColors = [
            '#8899aa', '#7788aa', '#667799', '#998877', '#aa8866',
            '#887799', '#6688aa', '#556677', '#889988', '#aa7766',
            '#cc8855', '#5577aa', '#7a8899', '#996644', '#668877'
        ];

        /* TEMP: random building spawns disabled for layout work
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
        */ // END TEMP disabled block

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

        // ---- Hospital block — 4x4, with a 4x4 skyscraper directly north ----
        {
            const HBX = 43, HBY = 45, HBW = 4, HBH = 4;
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

        {
            const SKX = 43, SKY = 41, SKW = 4, SKH = 4;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= SKX && bl < SKX + SKW && bb >= SKY && bt < SKY + SKH);
            });
            for (let ty = SKY; ty < SKY + SKH; ty++) {
                for (let tx = SKX; tx < SKX + SKW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: SKX * TILE, y: SKY * TILE,
                w: SKW * TILE, h: SKH * TILE,
                color: '#728099', height: 80,
                windows: true, roofColor: '#5f6b80',
                isSkyscraper1: true
            });
        }

        // ---- Police station block — SW corner at tile (32,34), 5x5 ----
        {
            const SBX = 32, SBW = 5;
            const SBuildY = 30, SBuildH = 5;
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

        // ---- Bank block — NW corner at tile (57,27), 4x4 ----
        {
            const BBX = 57, BBW = 4;
            const BBY = 27, BBH = 4;
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

        // ---- Building2 — SW corner at tile (77,16), 3x4 ----
        {
            const B2X = 77, B2W = 3;
            const B2Y = 13, B2H = 4;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= B2X && bl < B2X + B2W && bb >= B2Y && bt < B2Y + B2H);
            });
            for (let ty = B2Y; ty < B2Y + B2H; ty++) {
                for (let tx = B2X; tx < B2X + B2W; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: B2X * TILE, y: B2Y * TILE,
                w: B2W * TILE, h: B2H * TILE,
                color: '#556677', height: 40,
                windows: true, roofColor: '#445566',
                isBuilding2: true
            });
        }

        // ---- Building1 — SW corner at tile (71,16), 4x3 ----
        {
            const B1X = 71, B1W = 4;
            const B1Y = 14, B1H = 3;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= B1X && bl < B1X + B1W && bb >= B1Y && bt < B1Y + B1H);
            });
            for (let ty = B1Y; ty < B1Y + B1H; ty++) {
                for (let tx = B1X; tx < B1X + B1W; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: B1X * TILE, y: B1Y * TILE,
                w: B1W * TILE, h: B1H * TILE,
                color: '#556677', height: 40,
                windows: true, roofColor: '#445566',
                isBuilding1: true
            });
        }

        // ---- Lawyer building — SW corner at tile (71,20), 5x4 ----
        {
            const LBX = 71, LBW = 5;
            const LBY = 17, LBH = 4;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= LBX && bl < LBX + LBW && bb >= LBY && bt < LBY + LBH);
            });
            for (let ty = LBY; ty < LBY + LBH; ty++) {
                for (let tx = LBX; tx < LBX + LBW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: LBX * TILE, y: LBY * TILE,
                w: LBW * TILE, h: LBH * TILE,
                color: '#2a3a4a', height: 40,
                windows: true, roofColor: '#1a2a3a',
                isLawyer: true
            });
        }

        // ---- Parking lot — SW corner at tile (76,20), 4x4 ----
        {
            const PLX = 76, PLW = 4;
            const PLY = 17, PLH = 4;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= PLX && bl < PLX + PLW && bb >= PLY && bt < PLY + PLH);
            });
            for (let ty = PLY; ty < PLY + PLH; ty++) {
                for (let tx = PLX; tx < PLX + PLW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: PLX * TILE, y: PLY * TILE,
                w: PLW * TILE, h: PLH * TILE,
                color: '#555555', height: 1,
                isParkinglot: true, noCollision: true
            });
            // Walkable rows inside the lot (entry/exit lane + dumpster area)
            for (let tx = 76; tx <= 79; tx++) {
                this.tiles[17][tx] = T.ROAD;
                this.tiles[18][tx] = T.ROAD;
                this.tiles[19][tx] = T.ROAD;
                this.tiles[20][tx] = T.ROAD;
            }
        }

        // ---- Pay & Spray gas station — SW corner at tile (15,62), 4x4 ----
        {
            const GBX = 15, GBW = 4;
            const GBY = 59, GBH = 4;
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= GBX && bl < GBX + GBW && bb >= GBY && bt < GBY + GBH);
            });
            for (let ty = GBY; ty < GBY + GBH; ty++) {
                for (let tx = GBX; tx < GBX + GBW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: GBX * TILE, y: GBY * TILE,
                w: GBW * TILE, h: GBH * TILE,
                color: '#cc6600', height: 20,
                windows: false, roofColor: '#aa4400',
                isPaySpray: true
            });
        }

        // ---- Safe House - SW corner at tile (15,6), 3x3 ----
        {
            const SHBX = 15, SHBW = 3;
            const SHBY = 4, SHBH = 3;
            // Filter out overlapping random buildings just in case
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= SHBX && bl < SHBX + SHBW && bb >= SHBY && bt < SHBY + SHBH);
            });
            // Mark tiles as building
            for (let ty = SHBY; ty < SHBY + SHBH; ty++) {
                for (let tx = SHBX; tx < SHBX + SHBW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: SHBX * TILE, y: SHBY * TILE,
                w: SHBW * TILE, h: SHBH * TILE,
                color: '#8b4513', height: 40,
                windows: true, roofColor: '#5c4033',
                isSafeHouse: true
            });
        }

        // ---- House 1 - section starting at 20,4, 3x3 ----
        {
            const H1BX = 20, H1BW = 3;
            const H1BY = 4, H1BH = 3;
            // Filter out overlapping random buildings just in case
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= H1BX && bl < H1BX + H1BW && bb >= H1BY && bt < H1BY + H1BH);
            });
            // Mark tiles as building
            for (let ty = H1BY; ty < H1BY + H1BH; ty++) {
                for (let tx = H1BX; tx < H1BX + H1BW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: H1BX * TILE, y: H1BY * TILE,
                w: H1BW * TILE, h: H1BH * TILE,
                color: '#654321', height: 40,
                windows: true, roofColor: '#3d2514',
                isHouse1: true
            });
        }

        // ---- House 2 - section starting at 15,0, 3x3 ----
        {
            const H2BX = 15, H2BW = 3;
            const H2BY = 0, H2BH = 3;
            // Filter out overlapping random buildings just in case
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= H2BX && bl < H2BX + H2BW && bb >= H2BY && bt < H2BY + H2BH);
            });
            // Mark tiles as building
            for (let ty = H2BY; ty < H2BY + H2BH; ty++) {
                for (let tx = H2BX; tx < H2BX + H2BW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: H2BX * TILE, y: H2BY * TILE,
                w: H2BW * TILE, h: H2BH * TILE,
                color: '#654321', height: 40,
                windows: true, roofColor: '#3d2514',
                isHouse2: true
            });
        }

        // ---- House 3 - section starting at 20,0, 3x3 ----
        {
            const H3BX = 20, H3BW = 3;
            const H3BY = 0, H3BH = 3;
            // Filter out overlapping random buildings just in case
            this.buildings = this.buildings.filter(b => {
                const bl = Math.floor(b.x / TILE), bt = Math.floor(b.y / TILE);
                const br = Math.floor((b.x + b.w - 1) / TILE), bb = Math.floor((b.y + b.h - 1) / TILE);
                return !(br >= H3BX && bl < H3BX + H3BW && bb >= H3BY && bt < H3BY + H3BH);
            });
            // Mark tiles as building
            for (let ty = H3BY; ty < H3BY + H3BH; ty++) {
                for (let tx = H3BX; tx < H3BX + H3BW; tx++) {
                    this.tiles[ty][tx] = T.BUILDING;
                }
            }
            this.buildings.push({
                x: H3BX * TILE, y: H3BY * TILE,
                w: H3BW * TILE, h: H3BH * TILE,
                color: '#654321', height: 40,
                windows: true, roofColor: '#3d2514',
                isHouse3: true
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

        // Tile sprite overlays — walkable tiles with a custom sprite drawn on top
        this.tileSprites = new Map([
            ['15,3', 'landscape/grass2'],
            ['16,3', 'landscape/grass2'],
            ['17,3', 'landscape/grass2'],
            ['18,0', 'landscape/grass2'],
            ['19,0', 'landscape/grass2'],
            ['18,1', 'landscape/grass2'],
            ['19,1', 'landscape/grass2'],
            ['18,2', 'landscape/grass2'],
            ['19,2', 'landscape/grass2'],
            ['18,3', 'landscape/grass2'],
            ['18,4', 'landscape/driveway2'],
            ['18,5', 'landscape/driveway1'],
            ['18,6', 'landscape/driveway1'],
            ['19,4', 'landscape/driveway2'],
            ['19,5', 'landscape/driveway1'],
            ['19,6', 'landscape/driveway1'],
            ['19,3', 'landscape/grass2'],
            ['20,3', { key: 'landscape/driveway2', rot: -Math.PI / 2 }],
            ['21,3', { key: 'landscape/driveway1', rot: -Math.PI / 2 }],
            ['22,3', { key: 'landscape/driveway1', rot: -Math.PI / 2 }],
            ['29,33', 'roads/parking/police_parking'],
            ['30,33', 'roads/parking/police_parking'],
            ['31,33', 'roads/parking/police_parking'],
            ['29,31', 'roads/parking/police_parking'],
            ['30,31', 'roads/parking/police_parking'],
            ['31,31', 'roads/parking/police_parking'],
            ['29,29', 'roads/parking/police_parking'],
            ['30,29', 'roads/parking/police_parking'],
            ['31,29', 'roads/parking/police_parking'],
            ['47,45', 'roads/asphalt_blank2'],
            ['47,46', 'roads/parking/ambulance'],
            ['47,47', 'roads/asphalt_blank2'],
            ['47,48', 'roads/asphalt_blank2'],
            ['75,14', 'landscape/grass'],
            ['75,15', 'landscape/grass'],
            ['75,16', 'landscape/grass'],
            ['76,14', 'landscape/grass_fence1'],
            ['76,15', 'landscape/grass_fence1'],
            ['76,16', 'landscape/grass_fence1'],
            ['76,13', 'landscape/grass_fence2'],
            ['71,13', { key: 'landscape/grass_fence2', rot: -Math.PI / 2 }],
            ['72,13', { key: 'landscape/grass_fence1', rot: -Math.PI / 2 }],
            ['73,13', { key: 'landscape/grass_fence1', rot: -Math.PI / 2 }],
            ['74,13', { key: 'landscape/grass_fence1', rot: -Math.PI / 2 }],
            ['75,13', { key: 'landscape/grass_fence1', rot: -Math.PI / 2 }],
            ['9,68', { key: 'sidewalk/corner', rot: -Math.PI / 2 }],
        ]);

        // East-west road markings — applied to every segment between adjacent vertical roads
        {
            const RW = ROAD_WIDTH;
            const vRoads = roadPositions.v;
            const hRoads = roadPositions.h;
            const setRoad = (tx, ty, val) => {
                if (this.tiles[ty] && this.tiles[ty][tx] === T.ROAD)
                    this.tileSprites.set(`${tx},${ty}`, val);
            };
            const LINE_E = { key: 'roads/asphalt_line', rot: Math.PI / 2 };
            const LINE_W = { key: 'roads/asphalt_line', rot: -Math.PI / 2 };
            const STOP_E = { key: 'roads/asphalt_stop', rot: Math.PI / 2 };
            const STOP_W = { key: 'roads/asphalt_stop', rot: -Math.PI / 2 };
            const SLINE_E = { key: 'roads/asphalt_stop_line', rot: Math.PI / 2 };
            const SLINE_W = { key: 'roads/asphalt_stop_line', rot: -Math.PI / 2 };
            const YLINE_E = { key: 'roads/asphalt_yellow_line', rot: -Math.PI / 2 };
            const YLINE_W = { key: 'roads/asphalt_yellow_line', rot: Math.PI / 2 };

            for (const hy of hRoads) {
                for (let vi = 0; vi < vRoads.length - 1; vi++) {
                    const vxL = vRoads[vi];
                    const vxR = vRoads[vi + 1];
                    // Crosswalks at the edges of each segment
                    const crossL = vxL + RW;
                    const crossR = vxR - 1;
                    for (let r = 0; r < RW; r++) {
                        this.tileSprites.set(`${crossL},${hy + r}`, 'roads/crosswalk');
                        this.tileSprites.set(`${crossR},${hy + r}`, 'roads/crosswalk');
                    }
                    // Lane markings between the crosswalks
                    const startX = crossL + 1;
                    const endX = crossR - 1;
                    for (let x = startX; x <= endX; x++) {
                        const isLeft = x === startX;
                        const isRight = x === endX;
                        setRoad(x, hy, isLeft ? STOP_E : LINE_E);
                        setRoad(x, hy + 1, isLeft ? SLINE_E : isRight ? 'roads/asphalt_blank' : YLINE_E);
                        setRoad(x, hy + 2, isRight ? SLINE_W : isLeft ? 'roads/asphalt_blank' : YLINE_W);
                        setRoad(x, hy + 3, isRight ? STOP_W : LINE_W);
                    }
                }
            }
        }

        // North-south road markings — applied to every segment between adjacent horizontal roads
        {
            const RW = ROAD_WIDTH;
            const vRoads = roadPositions.v;
            const hRoads = roadPositions.h;
            const setRoad = (tx, ty, val) => {
                if (this.tiles[ty] && this.tiles[ty][tx] === T.ROAD)
                    this.tileSprites.set(`${tx},${ty}`, val);
            };
            const LINE_S = { key: 'roads/asphalt_line', rot: 0 };
            const LINE_N = { key: 'roads/asphalt_line', rot: Math.PI };
            const STOP_S = { key: 'roads/asphalt_stop_alt', ox: 1 };
            const STOP_N = { key: 'roads/asphalt_stop_alt', rot: Math.PI };
            const SLINE_S = { key: 'roads/asphalt_stop_line_alt' };
            const SLINE_N = { key: 'roads/asphalt_stop_line_alt', rot: Math.PI };
            const YLINE_S = { key: 'roads/asphalt_yellow_line', rot: Math.PI };
            const YLINE_N = { key: 'roads/asphalt_yellow_line', rot: 0 };
            const CW_NS = { key: 'roads/crosswalk', rot: Math.PI / 2 };

            for (const vx of vRoads) {
                for (let hi = 0; hi < hRoads.length - 1; hi++) {
                    const hyT = hRoads[hi];
                    const hyB = hRoads[hi + 1];
                    // Crosswalks at the top and bottom edges of each segment
                    const crossT = hyT + RW;
                    const crossB = hyB - 1;
                    for (let r = 0; r < RW; r++) {
                        this.tileSprites.set(`${vx + r},${crossT}`, CW_NS);
                        this.tileSprites.set(`${vx + r},${crossB}`, CW_NS);
                    }
                    // Lane markings between the crosswalks
                    const startY = crossT + 1;
                    const endY = crossB - 1;
                    for (let y = startY; y <= endY; y++) {
                        const isTop = y === startY;
                        const isBottom = y === endY;
                        setRoad(vx, y, isTop ? STOP_S : LINE_S);
                        setRoad(vx + 1, y, isTop ? SLINE_S : isBottom ? 'roads/asphalt_blank' : YLINE_S);
                        setRoad(vx + 2, y, isBottom ? SLINE_N : isTop ? 'roads/asphalt_blank' : YLINE_N);
                        setRoad(vx + 3, y, isBottom ? STOP_N : LINE_N);
                    }
                }
            }
        }

        // Fill rest of police block (x=29-36, y=27-34) with asphalt where not building or parking
        for (let ty = 27; ty <= 34; ty++) {
            for (let tx = 29; tx <= 36; tx++) {
                const key = `${tx},${ty}`;
                if (this.tiles[ty][tx] !== T.BUILDING && !this.tileSprites.has(key)) {
                    this.tileSprites.set(key, 'roads/asphalt_blank');
                }
            }
        }

        // Helipad building collision — starts CLOSED, all 9 tiles blocked
        for (let ty = 27; ty <= 29; ty++) {
            for (let tx = 33; tx <= 35; tx++) {
                this.tiles[ty][tx] = T.BUILDING;
            }
        }

        // Helipad open/close state (toggles every 3 minutes)
        this.helipadOpen = false;
        this.helipadTimer = 0;

        // Fish market on the southwest beach
        for (let ty = 66; ty <= 68; ty++) {
            for (let tx = 6; tx <= 8; tx++) {
                this.tiles[ty][tx] = T.BUILDING;
            }
        }

        // Explicit tile sprite overrides — applied after road marking loops so they are not overwritten

        // Fill all intersections with asphalt_blank
        for (const vx of roadPositions.v) {
            for (const hy of roadPositions.h) {
                for (let ty = hy; ty < hy + ROAD_WIDTH; ty++) {
                    for (let tx = vx; tx < vx + ROAD_WIDTH; tx++) {
                        if (tx === 26 && ty === 24) continue;
                        this.tileSprites.set(`${tx},${ty}`, 'roads/asphalt_blank');
                    }
                }
            }
        }
        this.tileSprites.set('26,24', 'roads/asphalt_sewer');
        this.tileSprites.set('10,7', 'roads/asphalt_closed');
        this.tileSprites.set('11,7', 'roads/asphalt_closed');
        this.tileSprites.set('12,7', 'roads/asphalt_closed');
        this.tileSprites.set('13,7', 'roads/asphalt_closed');
        for (let ty = 0; ty < 7; ty++) {
            for (let tx = 10; tx <= 13; tx++) {
                this.tileSprites.set(`${tx},${ty}`, 'roads/asphalt_blank');
            }
        }

        // Multi-tile sprites — drawn as a single image spanning multiple tiles
        // SW corner at (33,29) → NW corner at (33,27), 3×3 tiles
        this.multiTileSprites = [
            { tx: 33, ty: 27, tw: 3, th: 3, key: 'roads/parking/helipad_closed' },
            { tx: 48, ty: 46, tw: 3, th: 3, key: 'roads/parking/helipad_closed' },
            { tx: 6, ty: 66, tw: 3, th: 3, key: 'buildings/fish_market', rot: -Math.PI / 2 },
        ];
    }

    _buildSidewalkSprites() {
        this.sidewalkSprites = new Map();
        const set = (tx, ty, key, rot) => {
            if (ty >= 0 && ty < WORLD_H && tx >= 0 && tx < WORLD_W &&
                this.tiles[ty][tx] === T.SIDEWALK) {
                this.sidewalkSprites.set(`${tx},${ty}`, { key, rot: rot || 0 });
            }
        };

        // Scan outward from a starting tile until a sidewalk tile is found.
        // dx/dy is the step direction (e.g. -1,0 = scan left).
        const findSW = (startX, startY, dx, dy) => {
            let tx = startX, ty = startY;
            while (tx >= 0 && tx < WORLD_W && ty >= 0 && ty < WORLD_H) {
                if (this.tiles[ty][tx] === T.SIDEWALK) return dx !== 0 ? tx : ty;
                tx += dx; ty += dy;
            }
            return -1; // not found
        };

        for (const b of this.buildings) {
            if (!b.isHospital && !b.isPoliceStation && !b.isBank && !b.isLawyer && !b.isBuilding1 && !b.isBuilding2 && !b.isSafeHouse && !b.isHouse1 && !b.isHouse2 && !b.isHouse3) continue;
            const bx1 = Math.round(b.x / TILE);
            const by1 = Math.round(b.y / TILE);
            const bx2 = bx1 + Math.round(b.w / TILE) - 1;
            const by2 = by1 + Math.round(b.h / TILE) - 1;

            // Use the midpoint of each edge as the scan reference so we don't
            // accidentally walk into a corner tile of a different building.
            const midX = Math.floor((bx1 + bx2) / 2);
            const midY = Math.floor((by1 + by2) / 2);

            const leftX = findSW(bx1 - 1, midY, -1, 0);
            const rightX = findSW(bx2 + 1, midY, 1, 0);
            const topY = findSW(midX, by1 - 1, 0, -1);
            const botY = findSW(midX, by2 + 1, 0, 1);

            // Place each side independently — skip sides with no sidewalk rather than the whole building
            const hasL = leftX >= 0, hasR = rightX >= 0, hasT = topY >= 0, hasB = botY >= 0;

            // Corners (only where both adjacent sides exist)
            if (hasL && hasT) set(leftX, topY, 'sidewalk/corner', 0);
            if (hasR && hasT) set(rightX, topY, 'sidewalk/corner', Math.PI / 2);
            if (hasR && hasB) set(rightX, botY, 'sidewalk/corner', Math.PI);
            if (hasL && hasB) set(leftX, botY, 'sidewalk/corner', -Math.PI / 2);
            // Top edge
            if (hasT) {
                const tLeft = hasL ? leftX + 1 : bx1;
                const tRight = hasR ? rightX : bx2 + 1;
                for (let tx = tLeft; tx < tRight; tx++) set(tx, topY, 'sidewalk/sidewalk_plain', 0);
            }
            // Bottom edge
            if (hasB) {
                const tLeft = hasL ? leftX + 1 : bx1;
                const tRight = hasR ? rightX : bx2 + 1;
                for (let tx = tLeft; tx < tRight; tx++) set(tx, botY, 'sidewalk/sidewalk_plain', Math.PI);
            }
            // Left edge
            if (hasL) {
                const tTop = hasT ? topY + 1 : by1;
                const tBot = hasB ? botY : by2 + 1;
                for (let ty = tTop; ty < tBot; ty++) set(leftX, ty, 'sidewalk/sidewalk_plain', -Math.PI / 2);
            }
            // Right edge
            if (hasR) {
                const tTop = hasT ? topY + 1 : by1;
                const tBot = hasB ? botY : by2 + 1;
                for (let ty = tTop; ty < tBot; ty++) set(rightX, ty, 'sidewalk/sidewalk_plain', Math.PI / 2);
            }
        }

        // Manual sidewalk sprite placements
        for (let tx = 76; tx <= 79; tx++) {
            set(tx, 21, 'sidewalk/sidewalk_plain', Math.PI); // south face (row above road at y=22)
            set(tx, 12, 'sidewalk/sidewalk_plain', 0);       // north face (row below road at y=8-11)
        }

        // Hospital-side sidewalk label override.
        set(47, 49, 'roads/er', 0);
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

    draw(ctx, camera, images, showGrid = false) {
        const startX = Math.max(0, Math.floor((camera.x - camera.width / 2 / camera.zoom) / TILE) - 1);
        const startY = Math.max(0, Math.floor((camera.y - camera.height / 2 / camera.zoom) / TILE) - 1);
        const endX = Math.min(WORLD_W, Math.ceil((camera.x + camera.width / 2 / camera.zoom) / TILE) + 1);
        const endY = Math.min(WORLD_H, Math.ceil((camera.y + camera.height / 2 / camera.zoom) / TILE) + 1);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tile = this.tiles[y][x];
                ctx.fillStyle = TILE_COLORS[tile] || '#333';
                ctx.fillRect(x * TILE, y * TILE, TILE + 1, TILE + 1);

                // Tile sprite overlays (walkable — drawn on top of base tile color)
                if (images && this.tileSprites) {
                    const entry = this.tileSprites.get(`${x},${y}`);
                    if (entry) {
                        const spriteKey = typeof entry === 'string' ? entry : entry.key;
                        const rot = typeof entry === 'string' ? 0 : (entry.rot || 0);
                        const ox = typeof entry === 'string' ? 0 : (entry.ox || 0);
                        const oy = typeof entry === 'string' ? 0 : (entry.oy || 0);
                        const img = images[spriteKey];
                        if (img && img.complete && img.width > 0) {
                            if (rot) {
                                ctx.save();
                                ctx.translate(x * TILE + TILE / 2 + ox, y * TILE + TILE / 2 + oy);
                                ctx.rotate(rot);
                                ctx.drawImage(img, -TILE / 2, -TILE / 2, TILE + 1, TILE + 1);
                                ctx.restore();
                            } else {
                                ctx.drawImage(img, x * TILE + ox, y * TILE + oy, TILE + 1, TILE + 1);
                            }
                        }
                    }
                }

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
                            ctx.drawImage(img, -TILE / 2, -TILE / 2, TILE + 1, TILE + 1);
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
                    const onWestStrip = (x === 7 || x === 8) && y < WORLD_H - 7;
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

        // Multi-tile sprites (drawn after per-tile loop so they sit on top)
        if (images && this.multiTileSprites) {
            for (const s of this.multiTileSprites) {
                const img = images[s.key];
                if (!img || !img.complete || !img.width) continue;
                if (!camera.isVisible(s.tx * TILE, s.ty * TILE, s.tw * TILE, s.th * TILE)) continue;
                if (s.rot) {
                    const w = s.tw * TILE;
                    const h = s.th * TILE;
                    ctx.save();
                    ctx.translate(s.tx * TILE + w / 2, s.ty * TILE + h / 2);
                    ctx.rotate(s.rot);
                    ctx.drawImage(img, -w / 2, -h / 2, w, h);
                    ctx.restore();
                } else {
                    ctx.drawImage(img, s.tx * TILE, s.ty * TILE, s.tw * TILE, s.th * TILE);
                }
            }
        }

        // DEV: tile coordinate grid (toggle with G key)
        if (showGrid) {
            const LABEL_EVERY = 2;
            ctx.strokeStyle = 'rgba(255,255,0,0.3)';
            ctx.lineWidth = 0.5;
            ctx.font = '11px monospace';
            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
                    if (x % LABEL_EVERY === 0 && y % LABEL_EVERY === 0) {
                        ctx.fillStyle = 'rgba(0,0,0,0.6)';
                        ctx.fillRect(x * TILE + 1, y * TILE + 1, 38, 15);
                        ctx.fillStyle = '#ffff00';
                        ctx.fillText(`${x},${y}`, x * TILE + 3, y * TILE + 13);
                    }
                }
            }
        }
    }

    // Draw ground-level sprites (no height — must render before entities)
    drawGroundOverlays(ctx, camera, images) {
        for (const b of this.buildings) {
            if (!b.isParkinglot) continue;
            if (!camera.isVisible(b.x, b.y, b.w, b.h)) continue;
            if (images && images['buildings/parkinglot'] && images['buildings/parkinglot'].complete) {
                ctx.drawImage(images['buildings/parkinglot'], b.x, b.y, b.w, b.h);
            }
        }
    }

    drawBuildings(ctx, camera, images) {
        for (const b of this.buildings) {
            if (b.isParkinglot) continue; // drawn in drawGroundOverlays before entities
            if (!camera.isVisible(b.x, b.y, b.w, b.h)) continue;

            if (b.isHospital && images && images['hospital'] && images['hospital'].complete) {
                ctx.drawImage(images['hospital'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isSkyscraper1 && images && images['skyscraper1'] && images['skyscraper1'].complete) {
                ctx.drawImage(images['skyscraper1'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isSafeHouse && images && images['safe_house'] && images['safe_house'].complete) {
                ctx.drawImage(images['safe_house'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isHouse1 && images && images['house1'] && images['house1'].complete) {
                ctx.drawImage(images['house1'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isHouse2 && images && images['house2'] && images['house2'].complete) {
                ctx.drawImage(images['house2'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isHouse3 && images && images['house3'] && images['house3'].complete) {
                ctx.drawImage(images['house3'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isPoliceStation && images && images['police_building'] && images['police_building'].complete) {
                ctx.drawImage(images['police_building'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isBank && images && images['bank'] && images['bank'].complete) {
                ctx.drawImage(images['bank'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isParkinglot && images && images['buildings/parkinglot'] && images['buildings/parkinglot'].complete) {
                ctx.drawImage(images['buildings/parkinglot'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isPaySpray && images && images['buildings/gas'] && images['buildings/gas'].complete) {
                ctx.drawImage(images['buildings/gas'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isLawyer && images && images['buildings/lawyer'] && images['buildings/lawyer'].complete) {
                ctx.drawImage(images['buildings/lawyer'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isBuilding1 && images && images['buildings/building1'] && images['buildings/building1'].complete) {
                ctx.drawImage(images['buildings/building1'], b.x, b.y, b.w, b.h);
                continue;
            }

            if (b.isBuilding2 && images && images['buildings/building2'] && images['buildings/building2'].complete) {
                ctx.drawImage(images['buildings/building2'], b.x, b.y, b.w, b.h);
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

    updateHelipad(dt) {
        this.helipadTimer += dt;
        if (this.helipadTimer >= 180) { // 3 minutes
            this.helipadTimer = 0;
            this.helipadOpen = !this.helipadOpen;
            const key = this.helipadOpen ? 'roads/parking/helipad_open' : 'roads/parking/helipad_closed';
            this.multiTileSprites[0] = { tx: 33, ty: 27, tw: 3, th: 3, key };
            // Open: unlock the gate, landing tile, and the surrounding walkway tiles
            // Closed: re-block all 9 tiles
            const openTiles = new Set(['34,27', '33,28', '34,28', '35,28', '34,29']);
            for (let ty = 27; ty <= 29; ty++) {
                for (let tx = 33; tx <= 35; tx++) {
                    if (this.helipadOpen && openTiles.has(`${tx},${ty}`)) {
                        this.tiles[ty][tx] = T.ROAD; // walkable when open
                    } else {
                        this.tiles[ty][tx] = T.BUILDING;
                    }
                }
            }
        }
    }

    getHelipadTimeRemaining() {
        return Math.max(0, 180 - this.helipadTimer);
    }

    checkBuildingCollision(x, y, w, h) {
        for (const b of this.buildings) {
            if (b.noCollision) continue;
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
