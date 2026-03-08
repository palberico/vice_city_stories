// ============================================
// CAMERA SYSTEM
// ============================================
class Camera {
    constructor(width, height) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = height;
        this.zoom = 1;
        this.targetZoom = 1;
        this.smoothing = 0.08;
    }

    follow(target, dt) {
        const tx = target.x;
        const ty = target.y;
        this.x += (tx - this.x) * this.smoothing;
        this.y += (ty - this.y) * this.smoothing;
        this.zoom += (this.targetZoom - this.zoom) * 0.05;
    }

    setZoom(z) {
        this.targetZoom = z;
    }

    applyTransform(ctx) {
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    restoreTransform(ctx) {
        ctx.restore();
    }

    isVisible(x, y, w, h) {
        const hw = (this.width / 2) / this.zoom + 100;
        const hh = (this.height / 2) / this.zoom + 100;
        return x + w > this.x - hw && x < this.x + hw &&
            y + h > this.y - hh && y < this.y + hh;
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
    }
}
