export class SceneManager {
    constructor() {
        this.scenes = {
            home: document.getElementById('scene-home'),
            game: document.getElementById('scene-game'),
            result: document.getElementById('scene-result')
        };
        this.currentScene = 'home';
    }

    show(sceneName) {
        // Hide all
        Object.values(this.scenes).forEach(el => el.classList.add('hidden'));

        // Show target
        if (this.scenes[sceneName]) {
            this.scenes[sceneName].classList.remove('hidden');
            this.currentScene = sceneName;
        } else {
            console.error(`Scene ${sceneName} not found`);
        }
    }
}
