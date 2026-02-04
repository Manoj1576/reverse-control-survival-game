import { SceneManager } from './SceneManager.js';
import { Game } from './Game.js';

// Init Logic
document.addEventListener('DOMContentLoaded', () => {
    const sceneManager = new SceneManager();
    const game = new Game({
        onGameOver: (score) => {
            const finalScore = Math.floor(score);
            document.getElementById('final-score-val').textContent = finalScore;

            // High Score
            const best = localStorage.getItem('glitch_high_score') || 0;
            if (finalScore > best) {
                localStorage.setItem('glitch_high_score', finalScore);
            }

            sceneManager.show('result');
        }
    });

    // Button Bindings
    document.getElementById('btn-play').addEventListener('click', () => {
        sceneManager.show('game');
        game.start();
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
        sceneManager.show('game');
        game.start();
    });

    document.getElementById('btn-home').addEventListener('click', () => {
        sceneManager.show('home');
    });

    // Initial Scene
    sceneManager.show('home');
});
