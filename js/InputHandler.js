export class InputHandler {
    constructor() {
        this.keys = {};
        this.dashboard = false; // Dash trigger

        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.dashboard = true;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.dashboard = false;
        });
    }

    getVector(isReversed) {
        let dx = 0;
        let dy = 0;

        const up = this.keys['ArrowUp'] || this.keys['KeyW'];
        const down = this.keys['ArrowDown'] || this.keys['KeyS'];
        const left = this.keys['ArrowLeft'] || this.keys['KeyA'];
        const right = this.keys['ArrowRight'] || this.keys['KeyD'];

        if (!isReversed) {
            if (up) dy -= 1;
            if (down) dy += 1;
            if (left) dx -= 1;
            if (right) dx += 1;
        } else {
            // Reversed Controls
            if (up) dy += 1;
            if (down) dy -= 1;
            if (left) dx += 1;
            if (right) dx -= 1;
        }

        // Normalize
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        return { dx, dy, dash: this.keys['Space'] };
    }
}
