import { InputHandler } from './InputHandler.js';

export class Game {
    constructor(callbacks) {
        this.callbacks = callbacks; // onGameOver(score)

        this.container = document.getElementById('game-canvas-container');
        this.player = document.createElement('div');
        this.player.className = 'player';
        this.container.appendChild(this.player);

        this.width = 600;
        this.height = 600;

        this.input = new InputHandler();

        this.state = 'STOPPED'; // RUNNING, STOPPED
        this.score = 0;
        this.enemies = [];
        this.playerPos = { x: 300, y: 300 };

        // Reverse Logic
        this.isReversed = true; // "Remove Normal Control" -> Default Reverse
        this.reverseTimer = 0;
        this.reverseInterval = 5; // seconds

        // Dash
        this.dashCooldown = 0;
        this.isDashing = false;

        // Display
        this.timeDisplay = document.getElementById('time-display');
        this.statusDisplay = document.getElementById('status-display');
    }

    start() {
        this.state = 'RUNNING';
        this.score = 0;
        this.enemies.forEach(e => e.el.remove());
        this.enemies = [];
        this.playerPos = { x: 300, y: 300 };
        this.lastTime = performance.now();
        this.isReversed = true;
        this.reverseTimer = 0;

        requestAnimationFrame(t => this.loop(t));
    }

    loop(timestamp) {
        if (this.state !== 'RUNNING') return;

        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        this.score += dt;
        this.reverseTimer += dt;
        this.dashCooldown -= dt;

        // CHAOS MODE: Randomly flip controls
        if (this.reverseTimer > this.reverseInterval) {
            this.isReversed = !this.isReversed;
            this.reverseTimer = 0;
            this.updateStatus();
        }

        // MOVEMENT
        const input = this.input.getVector(this.isReversed);
        const speed = this.isDashing ? 600 : 300;

        // Dash Logic
        if (input.dash && this.dashCooldown <= 0) {
            this.performDash();
        }

        this.playerPos.x += input.dx * speed * dt;
        this.playerPos.y += input.dy * speed * dt;

        // Clamp
        this.playerPos.x = Math.max(15, Math.min(585, this.playerPos.x));
        this.playerPos.y = Math.max(15, Math.min(585, this.playerPos.y));

        // ENEMIES
        if (Math.random() < dt * 1.5) this.spawnEnemy(); // Approx 1.5 per sec

        this.enemies.forEach((e, i) => {
            e.x += e.vx * dt;
            e.y += e.vy * dt;

            // Check Collision
            if (!this.isDashing && this.checkCollision(e)) {
                this.gameOver();
            }

            // Despawn
            if (e.x < -50 || e.x > 650 || e.y < -50 || e.y > 650) {
                e.el.remove();
                this.enemies.splice(i, 1);
            }
        });

        // UI
        this.timeDisplay.textContent = Math.floor(this.score);
    }

    performDash() {
        this.isDashing = true;
        this.dashCooldown = 2; // 2s cooldown
        this.player.classList.add('dash');

        setTimeout(() => {
            this.isDashing = false;
            this.player.classList.remove('dash');
        }, 200); // 0.2s duration
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.random() * 600; y = -30; break;
            case 1: x = 630; y = Math.random() * 600; break;
            case 2: x = Math.random() * 600; y = 630; break;
            case 3: x = -30; y = Math.random() * 600; break;
        }

        const angle = Math.atan2(this.playerPos.y - y, this.playerPos.x - x);
        const speed = 200;

        const el = document.createElement('div');
        el.className = 'enemy';
        this.container.appendChild(el);

        this.enemies.push({
            el, x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        });
    }

    checkCollision(e) {
        const dx = this.playerPos.x - e.x;
        const dy = this.playerPos.y - e.y;
        return (dx * dx + dy * dy) < 600; // 25px radius approx
    }

    updateStatus() {
        if (this.isReversed) {
            this.statusDisplay.textContent = "SYSTEM: COMPROMISED (REVERSED)";
            this.statusDisplay.className = "status-box warning";
            this.container.classList.add('glitched');
        } else {
            this.statusDisplay.textContent = "SYSTEM: STABLE";
            this.statusDisplay.className = "status-box";
            this.container.classList.remove('glitched');
        }
    }

    render() {
        this.player.style.transform = `translate(${this.playerPos.x}px, ${this.playerPos.y}px) translate(-50%, -50%)`;
        this.enemies.forEach(e => {
            e.el.style.transform = `translate(${e.x}px, ${e.y}px) translate(-50%, -50%) rotate(45deg)`;
        });
    }

    gameOver() {
        this.state = 'STOPPED';
        this.callbacks.onGameOver(this.score);
    }
}
