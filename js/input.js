// ============================================
// INPUT MANAGER
// ============================================
const Input = {
    keys: {},
    mouse: { x: 0, y: 0, worldX: 0, worldY: 0, down: false, clicked: false },

    init(canvas) {
        canvas.setAttribute('tabindex', '0');
        canvas.focus();
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab'].includes(e.key.toLowerCase())) e.preventDefault();
        });
        canvas.addEventListener('click', () => canvas.focus());
        window.addEventListener('keyup', e => {
            this.keys[e.key.toLowerCase()] = false;
        });
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('mousedown', e => {
            this.mouse.down = true;
            this.mouse.clicked = true;
        });
        canvas.addEventListener('mouseup', e => {
            this.mouse.down = false;
        });
        canvas.addEventListener('contextmenu', e => e.preventDefault());
    },

    isDown(key) { return !!this.keys[key]; },

    resetFrame() {
        this.mouse.clicked = false;
    },

    updateWorldMouse(camera) {
        this.mouse.worldX = (this.mouse.x - camera.width / 2) / camera.zoom + camera.x;
        this.mouse.worldY = (this.mouse.y - camera.height / 2) / camera.zoom + camera.y;
    }
};
