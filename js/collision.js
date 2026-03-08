// ============================================
// COLLISION DETECTION
// ============================================
const Collision = {
    aabb(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
            a.y < b.y + b.h && a.y + a.h > b.y;
    },

    pointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.w &&
            py >= rect.y && py <= rect.y + rect.h;
    },

    circleRect(cx, cy, cr, rx, ry, rw, rh) {
        const nearX = Math.max(rx, Math.min(cx, rx + rw));
        const nearY = Math.max(ry, Math.min(cy, ry + rh));
        const dx = cx - nearX;
        const dy = cy - nearY;
        return (dx * dx + dy * dy) < (cr * cr);
    },

    dist(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    resolveAABB(mover, blocker) {
        const overlapX = Math.min(mover.x + mover.w - blocker.x, blocker.x + blocker.w - mover.x);
        const overlapY = Math.min(mover.y + mover.h - blocker.y, blocker.y + blocker.h - mover.y);
        if (overlapX < overlapY) {
            if (mover.x < blocker.x) mover.x -= overlapX;
            else mover.x += overlapX;
        } else {
            if (mover.y < blocker.y) mover.y -= overlapY;
            else mover.y += overlapY;
        }
    }
};
