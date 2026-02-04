/* ================= CONFIG ================= */
let CONFIG = {
    GAME_WIDTH: 600,
    GAME_HEIGHT: 600,
    PLAYER_SPEED: 280,
    ENEMY_BASE_SPEED: 180,
    SPAWN_RATE: 1.5,
    DIFFICULTY_MULT: 1
};

const SKINS = [
    { id: 'neon', name: 'NEON BLUE', color: '#00f3ff', cost: 0 },
    { id: 'ruby', name: 'RUBY RED', color: '#ff0055', cost: 50 },
    { id: 'emerald', name: 'TOXIC GREEN', color: '#0f0', cost: 100 },
    { id: 'gold', name: 'GOLDEN OP', color: '#ffcc00', cost: 300 }
];

/* ================= STATE ================= */
const Game = {
    state: 'HOME',
    lastTime: 0,
    score: 0,
    coins: 0,

    // Persistence
    totalCoins: parseInt(localStorage.getItem('rc_coins')) || 0,
    ownedSkins: JSON.parse(localStorage.getItem('rc_owned')) || ['neon'],
    equippedSkin: localStorage.getItem('rc_equipped') || 'neon',

    // Logic
    level: 'MEDIUM',

    // Entities
    player: { x: 300, y: 300, vx: 0, vy: 0, el: null },
    enemies: [],
    particles: [],
    items: [], // Coins

    // DOM
    container: document.getElementById('game-container'),
    scenes: {
        home: document.getElementById('scene-home'),
        levels: document.getElementById('scene-levels'),
        shop: document.getElementById('scene-shop'),
        game: document.getElementById('scene-game'),
        result: document.getElementById('scene-result')
    }
};

const Keys = {
    w: false, a: false, s: false, d: false,
    ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};

/* ================= INITIALIZATION ================= */
function init() {
    window.addEventListener('keydown', e => handleKey(e, true));
    window.addEventListener('keyup', e => handleKey(e, false));

    // Buttons
    document.getElementById('btn-play-menu').addEventListener('click', () => switchScene('levels'));
    document.getElementById('btn-shop').addEventListener('click', openShop);
    document.getElementById('btn-back-home').addEventListener('click', () => switchScene('home'));
    document.getElementById('btn-back-shop').addEventListener('click', () => switchScene('home'));

    document.getElementById('btn-retry').addEventListener('click', () => startLevel(Game.level));
    document.getElementById('btn-home').addEventListener('click', () => switchScene('home'));

    // Global UI
    updateCoinDisplay();

    // Loop
    requestAnimationFrame(loop);
}

function handleKey(e, isDown) {
    if (Keys.hasOwnProperty(e.key)) {
        Keys[e.key] = isDown;
    }
}

function switchScene(name) {
    Object.values(Game.scenes).forEach(el => el.classList.add('hidden'));
    Game.scenes[name].classList.remove('hidden');
}

/* ================= LEVEL LOGIC ================= */
function startLevel(difficulty) {
    Game.level = difficulty;

    // Tune Difficulty
    if (difficulty === 'EASY') {
        CONFIG.ENEMY_BASE_SPEED = 100;
        CONFIG.SPAWN_RATE = 0.8;
    } else if (difficulty === 'MEDIUM') {
        CONFIG.ENEMY_BASE_SPEED = 180;
        CONFIG.SPAWN_RATE = 1.5;
    } else { // HARD
        CONFIG.ENEMY_BASE_SPEED = 240;
        CONFIG.SPAWN_RATE = 1.0; // Higher freq spawning? No, previous logic was confusing. 
        // In previous logic (Step 211), HARD rate was 1.0. 
        // If Logic: if (Math.random() < dt * CONFIG.SPAWN_RATE)
        // Rate 1.0 is LESS than 1.5. So HARD spawned FEWER enemies?
        // Let's fix this. Higher Rate = More Enemies.
        // Let's set HARD to 3.0. MEDIUM to 1.5. EASY to 0.8.
        CONFIG.SPAWN_RATE = 3.0;
    }

    Game.state = 'PLAYING';
    Game.score = 0;
    Game.coins = 0;

    Game.player.x = 300;
    Game.player.y = 300;

    clearEntities();
    createPlayer();

    switchScene('game');
    updateStatus();

    // Apply Skin
    const skin = SKINS.find(s => s.id === Game.equippedSkin);
    Game.player.el.style.background = skin.color;
    Game.player.el.style.boxShadow = `0 0 15px ${skin.color}`;
}

function gameOver() {
    Game.state = 'RESULT';
    switchScene('result');

    // Save Coins
    Game.totalCoins += Game.coins;
    localStorage.setItem('rc_coins', Game.totalCoins);
    updateCoinDisplay();

    document.getElementById('final-score-val').innerText = Math.floor(Game.score);
    document.getElementById('final-coins-val').innerText = Game.coins;
}

/* ================= LOOP ================= */
function loop(timestamp) {
    if (!Game.lastTime) Game.lastTime = timestamp;
    const dt = (timestamp - Game.lastTime) / 1000;
    Game.lastTime = timestamp;

    if (Game.state === 'PLAYING') {
        update(dt);
    }

    if (Game.state === 'PLAYING') render();

    requestAnimationFrame(loop);
}

function update(dt) {
    Game.score += dt;

    // MOVEMENT
    movePlayer(dt);

    // SPAWNING
    if (Math.random() < dt * CONFIG.SPAWN_RATE) spawnEnemy();
    if (Math.random() < dt * 0.05) spawnCoin();

    // UPDATES
    updateEnemies(dt);
    updateItems(dt);
    updateParticles(dt);

    // UI
    document.getElementById('time-display').innerText = Math.floor(Game.score);
    document.getElementById('game-coins').innerText = Game.coins;
}

function movePlayer(dt) {
    let dx = 0, dy = 0;
    const up = Keys.ArrowUp || Keys.w;
    const down = Keys.ArrowDown || Keys.s;
    const left = Keys.ArrowLeft || Keys.a;
    const right = Keys.ArrowRight || Keys.d;

    // PERMANENT REVERSE LOGIC
    // Up -> Moves Down
    // Down -> Moves Up
    // Left -> Moves Right
    // Right -> Moves Left
    if (up) dy += 1;
    if (down) dy -= 1;
    if (left) dx += 1;
    if (right) dx -= 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        dx /= len; dy /= len;
    }

    Game.player.x += dx * CONFIG.PLAYER_SPEED * dt;
    Game.player.y += dy * CONFIG.PLAYER_SPEED * dt;

    // Bounds
    Game.player.x = Math.max(15, Math.min(585, Game.player.x));
    Game.player.y = Math.max(15, Math.min(585, Game.player.y));
}

/* ================= ENTITIES ================= */
function createPlayer() {
    if (!Game.player.el) {
        const el = document.createElement('div');
        el.className = 'player';
        Game.container.appendChild(el);
        Game.player.el = el;
    }
}

function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    switch (side) {
        case 0: x = Math.random() * 600; y = -30; break;
        case 1: x = 630; y = Math.random() * 600; break;
        case 2: x = Math.random() * 600; y = 630; break;
        case 3: x = -30; y = Math.random() * 600; break;
    }

    const angle = Math.atan2(Game.player.y - y, Game.player.x - x);
    const speed = CONFIG.ENEMY_BASE_SPEED + (Game.score * 1.5);

    const el = document.createElement('div');
    el.className = 'enemy';
    Game.container.appendChild(el);

    Game.enemies.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, el });
}

function spawnCoin() {
    const x = 50 + Math.random() * 500;
    const y = 50 + Math.random() * 500;

    const el = document.createElement('div');
    el.className = 'coin';
    Game.container.appendChild(el);

    Game.items.push({ x, y, el });
}

function updateEnemies(dt) {
    for (let i = Game.enemies.length - 1; i >= 0; i--) {
        const e = Game.enemies[i];
        e.x += e.vx * dt;
        e.y += e.vy * dt;

        if (dist(e.x, e.y, Game.player.x, Game.player.y) < 25) {
            gameOver();
        }

        if (e.x < -100 || e.x > 700 || e.y < -100 || e.y > 700) {
            e.el.remove();
            Game.enemies.splice(i, 1);
        }
    }
}

function updateItems(dt) {
    for (let i = Game.items.length - 1; i >= 0; i--) {
        const it = Game.items[i];
        if (dist(it.x, it.y, Game.player.x, Game.player.y) < 30) {
            // Collect
            Game.coins++;
            spawnParticles(it.x, it.y, 8, '#ffcc00');
            it.el.remove();
            Game.items.splice(i, 1);
        }
    }
}

/* ================= SHOP LOGIC ================= */
function openShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    document.getElementById('shop-coins').innerText = Game.totalCoins;

    SKINS.forEach(skin => {
        const card = document.createElement('div');
        const owned = Game.ownedSkins.includes(skin.id);
        const equipped = Game.equippedSkin === skin.id;

        card.className = `skin-card ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}`;
        card.innerHTML = `
            <div class="skin-preview" style="background:${skin.color}; box-shadow:0 0 10px ${skin.color}"></div>
            <div style="font-weight:bold; margin-bottom:5px;">${skin.name}</div>
            <div style="color:${owned ? '#888' : 'var(--neon-yellow)'}">
                ${owned ? (equipped ? 'EQUIPPED' : 'OWNED') : skin.cost}
            </div>
        `;

        card.onclick = () => tryBuyOrEquip(skin);
        grid.appendChild(card);
    });

    switchScene('shop');
}

function tryBuyOrEquip(skin) {
    if (Game.equippedSkin === skin.id) return;

    if (Game.ownedSkins.includes(skin.id)) {
        // Equip
        Game.equippedSkin = skin.id;
        localStorage.setItem('rc_equipped', skin.id);
        openShop(); // Refresh UI
    } else {
        // Buy
        if (Game.totalCoins >= skin.cost) {
            Game.totalCoins -= skin.cost;
            Game.ownedSkins.push(skin.id);
            Game.equippedSkin = skin.id; // Auto equip

            localStorage.setItem('rc_coins', Game.totalCoins);
            localStorage.setItem('rc_owned', JSON.stringify(Game.ownedSkins));
            localStorage.setItem('rc_equipped', skin.id);

            openShop();
            updateCoinDisplay();
        } else {
            alert("Not enough coins!");
        }
    }
}

/* ================= HELPERS ================= */
function clearEntities() {
    Game.enemies.forEach(e => e.el.remove());
    Game.enemies = [];
    Game.items.forEach(i => i.el.remove());
    Game.items = [];
    Game.particles.forEach(p => p.el.remove());
    Game.particles = [];
}

function updateStatus() {
    const el = document.getElementById('status-display');
    const container = document.getElementById('game-container');

    // ALWAYS REVERSED
    el.innerText = "WARNING: PERMANENT REVERSE";
    el.className = "hud-panel warning";
    container.classList.add('reversed');
}

function dist(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }

function updateCoinDisplay() {
    document.getElementById('total-coins-display').innerText = Game.totalCoins;
}

// Particle system simplified
function spawnParticles(x, y, n, color) {
    for (let i = 0; i < n; i++) {
        const el = document.createElement('div');
        el.className = 'particle';
        el.style.background = color;
        el.style.width = (3 + Math.random() * 3) + 'px';
        el.style.height = el.style.width;
        Game.container.appendChild(el);
        Game.particles.push({
            el, x, y,
            vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300,
            life: 0.5
        });
    }
}
function updateParticles(dt) {
    for (let i = Game.particles.length - 1; i >= 0; i--) {
        const p = Game.particles[i];
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        p.el.style.opacity = p.life;
        if (p.life <= 0) { p.el.remove(); Game.particles.splice(i, 1); }
    }
}

/* ================= RENDER ================= */
function render() {
    // Player
    if (Game.player.el) {
        Game.player.el.style.transform = `translate(${Game.player.x}px, ${Game.player.y}px) translate(-50%, -50%)`;
    }

    // Enemies
    Game.enemies.forEach(e => {
        e.el.style.transform = `translate(${e.x}px, ${e.y}px) translate(-50%, -50%) rotate(45deg)`;
    });

    // Items
    Game.items.forEach(i => {
        i.el.style.transform = `translate(${i.x}px, ${i.y}px) translate(-50%, -50%)`;
    });
}

// Map Game to window for HTML access
Game.startLevel = startLevel;
window.Game = Game;
init();
