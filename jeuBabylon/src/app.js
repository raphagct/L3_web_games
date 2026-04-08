import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  Color4,
  HemisphericLight,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { Environment } from "./environnment.js";
import { Player } from "./characterController.js";
import { PlayerHUD, PauseMenu, SettingsMenu, StartMenu, CutsceneMenu, LoseMenu } from "./ui.js";
import { EnemyType1, EnemyType2 } from "./enemy.js";

const State = {
  START: 0,
  CUTSCENE: 1,
  GAME: 2,
  LOSE: 3,
};


export default class App {
  state = 0;
  constructor() {
    this.canvas = document.getElementById("canvas");

    //on init scene et engine
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);

    this.main();
  }

  async main() {
    await this.goToStart();

    this.engine.runRenderLoop(() => {
      switch (this.state) {
        case State.START:
          this.scene.render();
          break;
        case State.CUTSCENE:
          this.scene.render();
          break;
        case State.GAME:
          this.scene.render();
          break;
        case State.LOSE:
          this.scene.render();
          break;
        default:
          break;
      }
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });

    window.addEventListener("keydown", (e) => {
      if (this.state === State.GAME && e.key === "Escape") {
        if (this.isPaused) {
          this.togglePause();
        } 
        else if (!document.pointerLockElement) {
          this.togglePause();
        }
      }
    });

    document.addEventListener("pointerlockchange", () => {
      if (this.state === State.GAME) {
        if (!document.pointerLockElement && !this.isPaused) {
          this.togglePause();
        }
      }
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.scene) this.scene.isPaused = this.isPaused;

    if (this.hud) {
      this.hud.isPaused = this.isPaused;
    }

    // Gérer l'affichage du menu
    if (this.isPaused) {
      if (this.pauseMenu) this.pauseMenu.show();
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    } else {
      if (this.pauseMenu) this.pauseMenu.hide();
      if (this.settingsMenu) this.settingsMenu.hide();
      
      const canvas = this.engine.getRenderingCanvas();
      if (canvas && canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    }
  }

  async setUpGame() {
    let scene = new Scene(this.engine);
    this.gamescene = scene;

    // Charger l'environnement (le sol)
    const environment = new Environment(scene);
    this.environment = environment;
    await this.environment.load();
  }

  async initializeGameAsync(scene) {
    scene.collisionsEnabled = true;

    // Lumière
    let light = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

    // Créer le HUD
    this.hud = new PlayerHUD(scene);

    // Créer le joueur (il gère ses propres inputs et sa caméra)
    this.player = new Player(scene, this.hud, () => this.goToLose());
    await this.player.load();

    // Créer les ennemis initialement sur la carte
    this.enemies = [];
    scene.enemies = this.enemies;
    // Ennemis de type 1
    this.enemies.push(new EnemyType1(scene, this.player, new Vector3(10, 0, 10)));
    this.enemies.push(new EnemyType1(scene, this.player, new Vector3(-10, 0, 10)));
    // Ennemis de type 2
    this.enemies.push(new EnemyType2(scene, this.player, new Vector3(10, 0, -10)));
    this.enemies.push(new EnemyType2(scene, this.player, new Vector3(-10, 0, -10)));
  }

  async goToGame() {
    //--SETUP SCENE--
    this.scene.detachControl();
    let scene = this.gamescene;
    scene.clearColor = new Color4(0.01, 0.01, 0.2);

    //--GUI--
    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    scene.detachControl();

    //bouton lose pour tester
    const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
    loseBtn.width = 0.2;
    loseBtn.height = "40px";
    loseBtn.color = "white";
    loseBtn.top = "-14px";
    loseBtn.thickness = 0;
    loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    playerUI.addControl(loseBtn);

    loseBtn.onPointerDownObservable.add(() => {
      this.goToLose();
      scene.detachControl();
    });

    await this.initializeGameAsync(scene);

    //--WHEN SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    
    // Menu Pause
    this.isPaused = false;
    scene.isPaused = false;

    this.settingsMenu = new SettingsMenu(scene, () => {
      this.settingsMenu.hide();
      this.pauseMenu.show();
    });

    this.loseMenu = new LoseMenu(
      scene,
      () => {
        if (this.pauseMenu) this.pauseMenu.dispose();
        if (this.settingsMenu) this.settingsMenu.dispose();
        if (this.loseMenu) this.loseMenu.dispose();
        this.goToCutScene();
      },
      () => {
        if (this.pauseMenu) this.pauseMenu.dispose();
        if (this.settingsMenu) this.settingsMenu.dispose();
        if (this.loseMenu) this.loseMenu.dispose();
        this.goToStart();
      }
    );

    this.pauseMenu = new PauseMenu(
      scene,
      () => this.togglePause(),
      () => {
        this.pauseMenu.hide();
        this.settingsMenu.show();
      },
      () => {
        this.pauseMenu.dispose();
        if (this.settingsMenu) this.settingsMenu.dispose();
        if (this.loseMenu) this.loseMenu.dispose();
        this.goToStart();
      }
    );

    this.scene.dispose();
    this.state = State.GAME;
    this.scene = scene;
    this.engine.hideLoadingUI();
    this.scene.attachControl();
  }

  async goToStart() {
    this.engine.displayLoadingUI();
    this.scene.detachControl();
    let scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.05, 0.05, 0.1, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());
    this.scene.dispose();
    this.scene = scene;
    this.state = State.START;

    this.startMenu = new StartMenu(scene, () => {
      this.startMenu.dispose();
      this.goToCutScene();
    });

    await scene.whenReadyAsync();
    this.engine.hideLoadingUI();
  }

  async goToCutScene() {
    this.engine.displayLoadingUI();
    this.scene.detachControl();
    this.cutScene = new Scene(this.engine);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this.cutScene);
    camera.setTarget(Vector3.Zero());
    this.cutScene.clearColor = new Color4(0, 0, 0, 1);

    this.cutsceneMenu = new CutsceneMenu(this.cutScene, () => {
      this.cutsceneMenu.dispose();
      this.goToGame();
    });

    await this.cutScene.whenReadyAsync();
    this.engine.hideLoadingUI();
    this.scene.dispose();
    this.state = State.CUTSCENE;
    this.scene = this.cutScene;

    // Charger le jeu pendant la cutscene
    await this.setUpGame();
  }

  goToLose() {
    if (this.state === State.LOSE) return;
    this.state = State.LOSE;

    this.scene.isPaused = true;
    if (this.hud) {
        this.hud.isPaused = true;
        this.saveScoreToDB(Math.floor(this.hud._realTimeSeconds));
    }

    if (document.exitPointerLock) {
      document.exitPointerLock();
    }

    if (this.loseMenu) {
      this.loseMenu.show();
    }
  }

  async saveScoreToDB(score) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) return;
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            await fetch('http://localhost:5000/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    gameName: 'babylon',
                    score: score
                })
            });
        } catch(e) {
            console.error('Erreur sauvegarde score', e);
        }
    }
  }
}

new App();