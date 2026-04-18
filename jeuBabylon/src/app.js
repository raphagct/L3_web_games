import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  Color4,
  HemisphericLight,
  Ray
} from "@babylonjs/core";
import { Environment } from "./environnment.js";
import { Player } from "./characterController.js";
import { PlayerHUD, PauseMenu, SettingsMenu, LoseMenu } from "./ui.js";
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
    this.menuMusic = new Audio("/sfx/menu-music.mp3");
    this.menuMusicMuted = false;
    this._menuMusicUnlockHandler = null;
    this.menuMusic.loop = true;
    this.menuMusic.preload = "auto";
    this.menuMusic.volume = 0.45;
    this._lightningInterval = null;

    //on init scene et engine
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);

    this.main();
  }

  _playMenuMusic() {
    if (!this.menuMusic) return;
    this.menuMusic.volume = this.menuMusicMuted ? 0 : 0.45;
    const playPromise = this.menuMusic.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Lecture bloquée tant qu'il n'y a pas d'interaction utilisateur
      });
    }
  }

  _stopMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.pause();
      this.menuMusic.currentTime = 0;
    }
    this._unbindMenuMusicUnlock();
  }

  _bindMenuMusicUnlock() {
    this._unbindMenuMusicUnlock();

    this._menuMusicUnlockHandler = () => {
      if (this.state !== State.START) return;
      this._playMenuMusic();
      if (this.menuMusic && !this.menuMusic.paused) {
        this._unbindMenuMusicUnlock();
      }
    };

    window.addEventListener("pointerdown", this._menuMusicUnlockHandler, { passive: true });
    window.addEventListener("keydown", this._menuMusicUnlockHandler);
    window.addEventListener("touchstart", this._menuMusicUnlockHandler, { passive: true });
  }

  _unbindMenuMusicUnlock() {
    if (!this._menuMusicUnlockHandler) return;
    window.removeEventListener("pointerdown", this._menuMusicUnlockHandler);
    window.removeEventListener("keydown", this._menuMusicUnlockHandler);
    window.removeEventListener("touchstart", this._menuMusicUnlockHandler);
    this._menuMusicUnlockHandler = null;
  }

  _clearLightningInterval() {
    if (this._lightningInterval) {
      clearInterval(this._lightningInterval);
      this._lightningInterval = null;
    }
  }

  _bindLightningOverlay(overlay, isActive) {
    this._clearLightningInterval();
    const lightningLayers = overlay.querySelectorAll(".start-menu-lightning");
    if (lightningLayers.length === 0) return;
    this._lightningInterval = setInterval(() => {
      if (!isActive()) return;
      if (Math.random() < 0.72) {
        const burstCount = Math.random() < 0.35 ? 2 : 1;
        for (let i = 0; i < burstCount; i++) {
          const layer = lightningLayers[Math.floor(Math.random() * lightningLayers.length)];
          if (!layer) continue;
          const delay = i * (50 + Math.random() * 90);
          setTimeout(() => {
            layer.classList.add("is-flashing");
            setTimeout(() => layer.classList.remove("is-flashing"), 190 + Math.random() * 180);
          }, delay);
        }
      }
    }, 680 + Math.random() * 620);
  }

  _stormBackdropHtml() {
    return `
      <div class="start-menu-vignette"></div>
      <div class="start-menu-lightning lightning-a"></div>
      <div class="start-menu-lightning lightning-b"></div>
      <div class="start-menu-lightning lightning-c"></div>
      <div class="start-menu-lightning lightning-d"></div>
      <div class="start-menu-lightning lightning-e"></div>
      <div class="start-menu-lightning lightning-f"></div>
      <div class="start-menu-lightning lightning-g"></div>
      <div class="start-menu-rune"></div>
    `;
  }

  _removeStartMenuDom() {
    this._clearLightningInterval();
    const existing = document.getElementById("start-menu-overlay");
    if (existing) {
      existing.remove();
    }
  }

  _removeCutsceneDom() {
    this._clearLightningInterval();
    const existing = document.getElementById("cutscene-overlay");
    if (existing) {
      existing.remove();
    }
  }

  _renderStartMenuDom() {
    this._removeStartMenuDom();

    const overlay = document.createElement("div");
    overlay.id = "start-menu-overlay";
    overlay.innerHTML = `
      ${this._stormBackdropHtml()}
      <div class="start-menu-shell">
        <div class="start-menu-brand-wrap">
          <div class="start-menu-brand">S.U.D.O</div>
          <div class="start-menu-brand-underline"></div>
        </div>
        <div class="start-menu-tagline">Resistez. Survivez. Reprenez le controle.</div>
        <div class="start-menu-actions">
          <button id="start-play-btn" class="start-menu-link start-menu-link-active">COMMENCER</button>
          <button id="start-music-toggle-btn" class="start-menu-link start-menu-link-small">MUSIQUE: ON</button>
        </div>
      </div>
      <div class="start-menu-footer-credit">Auteur : Raphaël GUICHET, Valentin Fouilloud, Mathis LECHEVALIER - GamesOnWeb 2026</div>
    `;
    document.body.appendChild(overlay);

    const playBtn = document.getElementById("start-play-btn");
    const musicBtn = document.getElementById("start-music-toggle-btn");

    const updateMusicLabel = () => {
      if (!musicBtn) return;
      musicBtn.textContent = this.menuMusicMuted ? "MUSIQUE: OFF" : "MUSIQUE: ON";
    };
    updateMusicLabel();

    if (playBtn) {
      playBtn.addEventListener("click", () => {
        this._playMenuMusic();
        this._stopMenuMusic();
        this._removeStartMenuDom();
        this.goToCutScene();
      });
    }

    if (musicBtn) {
      musicBtn.addEventListener("click", () => {
        this.menuMusicMuted = !this.menuMusicMuted;
        this._playMenuMusic();
        updateMusicLabel();
      });
    }

    this._bindLightningOverlay(overlay, () => this.state === State.START);
  }

  _renderCutsceneDom(title, text, onNext) {
    this._removeCutsceneDom();

    const overlay = document.createElement("div");
    overlay.id = "cutscene-overlay";
    overlay.innerHTML = `
      ${this._stormBackdropHtml()}
      <div class="cutscene-shell">
        <div class="cutscene-chapter" id="cutscene-title"></div>
        <div class="cutscene-brand-underline"></div>
        <div class="cutscene-lore" id="cutscene-body"></div>
        <div class="cutscene-actions">
          <button type="button" id="cutscene-next-btn" class="start-menu-link start-menu-link-active">SUIVANT</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const titleEl = overlay.querySelector("#cutscene-title");
    const bodyEl = overlay.querySelector("#cutscene-body");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = text;

    const nextBtn = overlay.querySelector("#cutscene-next-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (onNext) onNext();
      });
    }

    this._bindLightningOverlay(overlay, () => this.state === State.CUTSCENE);
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
          let found = false;
          let finalPos = new Vector3(0, 0, 0);
          let attempts = 0;
          
          while (!found && attempts < 30) {
              const angle = Math.random() * Math.PI * 2;
              let radius = 10 + Math.random() * 15; // De 10 à 25m
              
              const dirX = Math.sin(angle);
              const dirZ = Math.cos(angle);
              const direction = new Vector3(dirX, 0, dirZ).normalize();
              
              // 1. Raycast depuis le centre vers l'extérieur pour ne pas traverser les murs
              const centerRay = new Ray(new Vector3(spawnPos.x, spawnPos.y + 1.5, spawnPos.z), direction, radius);
              const centerHit = scene.pickWithRay(centerRay, (m) => {
                  return m.checkCollisions && m.name !== "player" && !m.name.includes("enemy");
              });

              if (centerHit && centerHit.hit) {
                  // Si on tape un mur, on s'arrête avant le mur
                  // Si le mur est trop proche (ex: < 4m), on annule et on cherche un autre angle
                  if (centerHit.distance < 4) {
                      attempts++;
                      continue; 
                  }
                  radius = centerHit.distance - 2; // On se place 2m avant le mur
              }

              const testX = spawnPos.x + dirX * radius;
              const testZ = spawnPos.z + dirZ * radius;
              
              // 2. Raycast vers le bas pour trouver le sol à cet endroit
              const downRay = new Ray(new Vector3(testX, spawnPos.y + 50, testZ), new Vector3(0, -1, 0), 100);
              const downHit = scene.pickWithRay(downRay, (m) => {
                  return m.checkCollisions && m.name !== "player" && !m.name.includes("enemy");
              });

              if (downHit && downHit.hit) {
                  // On vérifie que le sol n'est pas trop bas (ex: un trou de la mort)
                  if (downHit.pickedPoint.y >= spawnPos.y - 5) {
                      finalPos = new Vector3(testX, downHit.pickedPoint.y + 1, testZ);
                      found = true;
                  }
              }
              attempts++;
          }

          if (!found) {
              // Fallback au cas où aucun point valide n'est trouvé
              finalPos = new Vector3(spawnPos.x + (Math.random() - 0.5) * 5, spawnPos.y + 2.5, spawnPos.z + (Math.random() - 0.5) * 5);
          }

          return finalPos;
      };

      const num1 = 1 + this.currentArenaIndex;
      for(let i=0; i<num1; i++) {
          this.enemies.push(new EnemyType1(scene, this.player, getRandomArenaPos()));
      }
      const num2 = 1 + Math.floor(this.currentArenaIndex / 2);
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

      this._renderCutsceneDom(nextData.title, nextData.text, () => {
          this._removeCutsceneDom();
          this.cutScene.dispose();

          this.scene = savedGameScene;
          this.scene.isPaused = false;
          this.isPaused = false;
          if (this.hud) this.hud.isPaused = false;

          this.spawnEnemiesForArena(this.scene);
          this.levelCompleteTriggered = false;

          this.state = State.GAME;
          this.scene.attachControl();

          setTimeout(() => {
              this._ignoringPointerLock = false;
          }, 300);
      });

      this.scene = this.cutScene;
  }

  async goToStart() {
    this.engine.displayLoadingUI();
    this._removeCutsceneDom();
    this._removeStartMenuDom();
    this.scene.detachControl();
    let scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.05, 0.05, 0.1, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());
    this.scene.dispose();
    this.scene = scene;
    this.state = State.START;
    this._bindMenuMusicUnlock();
    this._playMenuMusic();
    this._renderStartMenuDom();

    await scene.whenReadyAsync();
    this.engine.hideLoadingUI();
  }

  async goToCutScene() {
    this._removeStartMenuDom();
    this._removeCutsceneDom();
    this._stopMenuMusic();
    this.engine.displayLoadingUI();
    this.scene.detachControl();
    this.cutScene = new Scene(this.engine);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this.cutScene);
    camera.setTarget(Vector3.Zero());
    this.cutScene.clearColor = new Color4(0, 0, 0, 1);

    const initData = this.cutsceneTexts[0];

    await this.cutScene.whenReadyAsync();
    this.engine.hideLoadingUI();
    this.scene.dispose();
    this.state = State.CUTSCENE;
    this.scene = this.cutScene;

    this._renderCutsceneDom(initData.title, initData.text, () => {
      this._removeCutsceneDom();
      this.goToGame();
    });

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

    // On ne détache PAS la scène (this.scene.detachControl()), sinon on ne peut plus cliquer sur les boutons de l'interface GUI !
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