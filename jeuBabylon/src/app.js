import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  Color4,
  HemisphericLight,
  Ray
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

    this.arenas = [
        "sol_lvl2", 
        "ground", 
        "ground3", 
        "ground_arene_4",
        "New Ground",
        "ground_coté"
    ];

    this.cutsceneTexts = [
        { title: "NIVEAU 1 : L'ÉVEIL", text: "L'an 2142. L'Intelligence Artificielle S.U.D.O. a pris le contrôle total du réseau mondial. Seuls quelques rebelles subsistent...\n\nVotre mission : vous infiltrer et détruire la première ligne de défense." },
        { title: "NIVEAU 2 : LA PLATEFORME", text: "SUDO a localisé votre position. Des unités d'extermination ont été envoyées sur la plateforme. Préparez-vous au combat !" },
        { title: "NIVEAU 3 : TERRES DÉSOLÉES", text: "La zone est lourdement gardée. Les défenses de SUDO s'intensifient. Détruisez-les pour avancer." },
        { title: "NIVEAU 4 : LE BASTION", text: "Vous approchez d'un nœud de serveur critique. Les unités lourdes sont déployées. Ne montrez aucune pitié." },
        { title: "NIVEAU 5 : CARREFOUR MORTEL", text: "Les réserves énergétiques de la zone sont à leur maximum. Les renforts ennemis arrivent de toute part." },
        { title: "NIVEAU 6 : L'AFFRONTEMENT FINAL", text: "C'est la dernière arène de ce secteur. Éliminez tous les robots pour pirater définitivement ce quadrant du réseau de SUDO !" }
    ];

    this.currentArenaIndex = 0;
    this.levelCompleteTriggered = false;

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
          if (!this.isPaused && this.scene.enemies && this.scene.enemies.length === 0 && !this.levelCompleteTriggered) {
             this.levelCompleteTriggered = true;
             this.handleArenaComplete();
          }
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
      // Ne déclencher la pause QUE si on est en GAME et pas en transition
      if (this.state !== State.GAME) return;
      if (this._ignoringPointerLock) return;
      if (!document.pointerLockElement && !this.isPaused) {
        this.togglePause();
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

    this.spawnEnemiesForArena(scene);
  }

  async goToGame() {
    this.currentArenaIndex = 0;
    this.levelCompleteTriggered = false;
    //--SETUP SCENE--
    this.scene.detachControl();
    let scene = this.gamescene;
    scene.clearColor = new Color4(0.01, 0.01, 0.2);

    scene.detachControl();

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
        // Rejouer : on dispose tout et on reconstruit le jeu de zéro
        if (this.pauseMenu) this.pauseMenu.dispose();
        if (this.settingsMenu) this.settingsMenu.dispose();
        if (this.loseMenu) this.loseMenu.dispose();
        if (this.hud) this.hud.dispose();
        this.gamescene = null;
        this.goToStart();
      },
      () => {
        if (this.pauseMenu) this.pauseMenu.dispose();
        if (this.settingsMenu) this.settingsMenu.dispose();
        if (this.loseMenu) this.loseMenu.dispose();
        if (this.hud) this.hud.dispose();
        this.gamescene = null;
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

  spawnEnemiesForArena(scene) {
      if (scene.enemies) {
          scene.enemies.forEach(e => {
              if (!e.isDead) e.die();
          });
      }
      this.enemies = [];
      scene.enemies = this.enemies;

      const arenaMeshName = this.arenas[this.currentArenaIndex];
      const spawnMesh = scene.getMeshByName(arenaMeshName);
      
      let spawnPos = new Vector3(0, 0, 0);

      if (spawnMesh) {
          spawnMesh.computeWorldMatrix(true);
          const boundingInfo = spawnMesh.getBoundingInfo();
          if (boundingInfo) {
              spawnPos = boundingInfo.boundingBox.centerWorld.clone();
          } else {
              spawnPos = spawnMesh.getAbsolutePosition().clone();
          }
      }

      if (this.player && this.player.mesh) {
          this.player.mesh.position.x = spawnPos.x;
          this.player.mesh.position.y = spawnPos.y + 2.5;
          this.player.mesh.position.z = spawnPos.z;
          if (typeof this.player.healFull === "function") {
              this.player.healFull();
          }
      }

      // On récupère la direction où le joueur regarde pour spawner les ennemis DEVANT lui
      let playerForward = new Vector3(0, 0, 1);
      if (this.player && this.player.mesh && scene.activeCamera) {
          const cam = scene.activeCamera;
          playerForward = cam.getDirection(Vector3.Forward());
          playerForward.y = 0;
          playerForward.normalize();
      }

      const getRandomArenaPos = () => {
          // Spawn dans un arc de 120° DEVANT le joueur, entre 8 et 15m
          const radius = 8 + Math.random() * 7;
          // Angle aléatoire dans un arc avant : -60° à +60° par rapport à la direction du joueur
          const baseAngle = Math.atan2(playerForward.x, playerForward.z);
          const spread = (Math.random() - 0.5) * (Math.PI * 2 / 3); // ±60°
          const angle = baseAngle + spread;
          const rx = Math.sin(angle) * radius;
          const rz = Math.cos(angle) * radius;
          return new Vector3(spawnPos.x + rx, spawnPos.y + 2.5, spawnPos.z + rz);
      };

      const num1 = 1 + this.currentArenaIndex * 2;
      for(let i=0; i<num1; i++) {
          this.enemies.push(new EnemyType1(scene, this.player, getRandomArenaPos()));
      }
      const num2 = 1 + this.currentArenaIndex;
      for(let i=0; i<num2; i++) {
          this.enemies.push(new EnemyType2(scene, this.player, getRandomArenaPos()));
      }
  }

  async handleArenaComplete() {
      this.currentArenaIndex++;
      if (this.currentArenaIndex >= this.arenas.length) {
          this.currentArenaIndex = 0; 
          this.goToStart();
          return;
      }
      
      // === ÉTAPE 1 : Bloquer TOUT ===
      this.state = State.CUTSCENE;
      this._ignoringPointerLock = true;
      this.isPaused = true;
      this.scene.isPaused = true;
      if (this.hud) this.hud.isPaused = true;
      
      // Détacher les inputs de la scène de jeu
      this.scene.detachControl();
      if (document.exitPointerLock) document.exitPointerLock();
      
      // Sauvegarder la référence au jeu
      const savedGameScene = this.scene;
      
      // === ÉTAPE 2 : Créer une scène de cutscene séparée (comme goToCutScene) ===
      this.cutScene = new Scene(this.engine);
      let camera = new FreeCamera("cutCamera", new Vector3(0, 0, 0), this.cutScene);
      camera.setTarget(Vector3.Zero());
      this.cutScene.clearColor = new Color4(0, 0, 0, 1);
      
      const nextData = this.cutsceneTexts[this.currentArenaIndex] || { title: "VICTOIRE", text: "Victoire écrasante" };
      
      this.cutsceneMenu = new CutsceneMenu(
          this.cutScene, 
          () => {
              // === ÉTAPE 3 : Le joueur a cliqué SUIVANT ===
              this.cutsceneMenu.dispose();
              this.cutScene.dispose();
              
              // Restaurer la scène de jeu
              this.scene = savedGameScene;
              this.scene.isPaused = false;
              this.isPaused = false;
              if (this.hud) this.hud.isPaused = false;
              
              // Spawner les ennemis de la nouvelle arène
              this.spawnEnemiesForArena(this.scene);
              this.levelCompleteTriggered = false;
              
              // Réactiver les contrôles
              this.state = State.GAME;
              this.scene.attachControl();
              
              // Laisser la souris libre - le joueur cliquera naturellement
              // pour réacquérir le pointer lock via le click handler du Player
              // NE PAS appeler requestPointerLock() ici!
              // Désactiver le flag après un délai pour laisser les events se calmer
              setTimeout(() => {
                  this._ignoringPointerLock = false;
              }, 300);
          },
          nextData.title,
          nextData.text
      );
      
      // === ÉTAPE 4 : Basculer le rendu sur la scène cutscene ===
      this.scene = this.cutScene;
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

    const initData = this.cutsceneTexts[0];

    this.cutsceneMenu = new CutsceneMenu(
      this.cutScene, 
      () => {
        this.cutsceneMenu.dispose();
        this.goToGame();
      },
      initData.title,
      initData.text
    );

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
    this._ignoringPointerLock = true;

    this.scene.isPaused = true;
    this.isPaused = true;
    if (this.hud) {
        this.hud.isPaused = true;
        this.saveScoreToDB(Math.floor(this.hud._realTimeSeconds));
    }

    // Détacher la scène pour que les clics sur les boutons
    // ne passent pas par la caméra du joueur
    this.scene.detachControl();
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
            await fetch('/api/scores', {
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