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
import { EnemyType1, EnemyType2, Boss } from "./enemy.js";
import { SoundManager } from "./soundManager.js";
import { GameSettings } from "./config.js";

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
      {
        title: "NIVEAU 1 : L'ÉVEIL",
        text: "2048. L'IA S.U.D.O a pris le contrôle total des systèmes d'informations mondiaux. Seuls quelques rebelles subsistent...\n\nVotre mission : vous infiltrer et détruire la première ligne de défense.",
      },
      {
        title: "NIVEAU 2 : LA PLATEFORME",
        text: "S.U.D.O a localisé votre position. Des unités supplémentaires ont été envoyées sur la plateforme. Préparez-vous au combat !",
      },
      {
        title: "NIVEAU 3 : LE TEST",
        text: "S.U.D.O a repéré votre potentiel, il a décidé de vous mettre au défi.",
      },
      {
        title: "NIVEAU 4 : LE TERMINAL",
        text: "S.U.D.O a reconnu votre valeur et a décidé de vous donner des privilèges pour vous déplacer jusqu'a son noyau.",
      },
      {
        title: "NIVEAU 5 : LE FIREWALL",
        text: "Vous vous approchez du noyau, le pare-feu de S.U.D.O se déclenche !",
      },
      {
        title: "NIVEAU 6 : L'AFFRONTEMENT FINAL",
        text: "Vous voici à l'intérieur du noyau. Sauvez l'humanité et écrivez l'histoire !",
      },
    ];

    this.currentArenaIndex = 0;
    this.levelCompleteTriggered = false;
    this.menuMusic = new Audio("./sfx/menu-music.mp3");
    this.menuMusicMuted = false;
    this._menuMusicUnlockHandler = null;
    this.menuMusic.loop = true;
    this.menuMusic.preload = "auto";
    this.menuMusic.volume = (GameSettings.musicVolume !== undefined ? GameSettings.musicVolume : 0.5) * 0.5;
    
    this.bossMusic = new Audio("./sfx/boss_music.mp3");
    this.bossMusic.loop = true;
    this.bossMusic.preload = "auto";
    this.bossMusic.volume = (GameSettings.musicVolume !== undefined ? GameSettings.musicVolume : 0.5) * 0.3; // musique en faible dans le fond
    
    this._lightningInterval = null;

    //on init scene et engine
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);
    this.scene.gameApp = this;

    this.main();
  }

  _playMenuMusic() {
    if (!this.menuMusic) return;
    this.updateVolumes();
    const playPromise = this.menuMusic.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Lecture bloquée tant qu'il n'y a pas d'interaction utilisateur
      });
    }
  }

  updateVolumes() {
    const musicVol = GameSettings.musicVolume !== undefined ? GameSettings.musicVolume : 0.5;
    if (this.menuMusic) {
        this.menuMusic.volume = (this.menuMusicMuted ? 0 : musicVol) * 0.5;
    }
    if (this.bossMusic) {
        this.bossMusic.volume = musicVol * 0.3;
    }
    // Mise à jour du SoundManager pour les sons longs (pas)
    SoundManager.updateVolume();
  }

  stopBossMusicWithFade() {
    if (!this.bossMusic) return;
    const initialVolume = this.bossMusic.volume;
    const fadeDuration = 3000; // 3 seconds
    const interval = 50;
    const steps = fadeDuration / interval;
    const volumeStep = initialVolume / steps;

    const fadeInterval = setInterval(() => {
      if (this.bossMusic.volume > volumeStep) {
        this.bossMusic.volume -= volumeStep;
      } else {
        this.bossMusic.volume = 0;
        this.bossMusic.pause();
        clearInterval(fadeInterval);
      }
    }, interval);
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

    const existingFade = document.getElementById("boss-fade-out");
    if (existingFade) existingFade.remove();

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
        // Debounce: ignore escape if we already handled it very recently
        const now = Date.now();
        if (this._lastEscapeTime && now - this._lastEscapeTime < 400) return;
        this._lastEscapeTime = now;
        this.togglePause();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      // Ne déclencher la pause QUE si on est en GAME et pas en transition
      if (this.state !== State.GAME) return;
      if (this._ignoringPointerLock) return;
      // Ignore the event triggered by our own requestPointerLock call
      if (this._skipNextPointerLockEvent) {
        this._skipNextPointerLockEvent = false;
        return;
      }
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
      SoundManager.setFootsteps(false);
      if (this.pauseMenu) this.pauseMenu.show();
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    } else {
      if (this.pauseMenu) this.pauseMenu.hide();
      if (this.settingsMenu) this.settingsMenu.hide();

      // Tell the pointerlock listener to ignore the event triggered by the lock itself
      this._skipNextPointerLockEvent = true;
      const canvas = this.engine.getRenderingCanvas();
      if (canvas && canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    }
  }

  async setUpGame() {
    let scene = new Scene(this.engine);
    scene.gameApp = this; // Ensure gameApp is accessible for music fades
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

    // Stocker le joueur sur la scène pour que les scripts (scies, lave...) puissent y accéder dynamiquement
    scene.player = this.player;

    // Ne PAS spawner les ennemis ici - on attend que la scène soit entièrement prête
  }

  _showCustomLoader(message = "CHARGEMENT...") {
    const existing = document.getElementById("custom-loader-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "custom-loader-overlay";
    overlay.innerHTML = `
      <style>
        #custom-loader-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: linear-gradient(135deg, #020818 0%, #0a0f2e 60%, #050e1f 100%);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          font-family: 'Courier New', monospace;
        }
        .loader-title { color: #00e5ff; font-size: 36px; font-weight: bold;
          letter-spacing: 8px; text-transform: uppercase;
          text-shadow: 0 0 30px rgba(0,229,255,0.7); margin-bottom: 12px; }
        .loader-subtitle { color: rgba(0,229,255,0.5); font-size: 12px;
          letter-spacing: 4px; margin-bottom: 48px; }
        .loader-bar-outer { width: 420px; height: 6px; background: rgba(0,229,255,0.1);
          border-radius: 3px; border: 1px solid rgba(0,229,255,0.2); overflow: hidden; }
        .loader-bar-inner { height: 100%; width: 0%; background: linear-gradient(90deg, #00b4d8, #00e5ff);
          border-radius: 3px; transition: width 0.3s ease;
          box-shadow: 0 0 12px rgba(0,229,255,0.8); }
        .loader-phase { color: rgba(0,229,255,0.6); font-size: 11px; letter-spacing: 2px;
          margin-top: 16px; min-height: 16px; }
        .loader-dots::after { content: ''; animation: dots 1.2s steps(4, end) infinite; }
        @keyframes dots { 0%{content:'.'} 33%{content:'..'} 66%{content:'...'} 100%{content:''} }
        .loader-scanlines { position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px); }
      </style>
      <div class="loader-scanlines"></div>
      <div class="loader-title">S.U.D.O CORE</div>
      <div class="loader-subtitle">INITIALISATION DU SYSTÈME</div>
      <div class="loader-bar-outer">
        <div class="loader-bar-inner" id="loader-bar"></div>
      </div>
      <div class="loader-phase loader-dots" id="loader-phase">${message}</div>
    `;
    document.body.appendChild(overlay);
  }

  _updateLoader(percent, phase) {
    const bar = document.getElementById("loader-bar");
    const phaseEl = document.getElementById("loader-phase");
    if (bar) bar.style.width = `${Math.min(100, percent)}%`;
    if (phaseEl) phaseEl.textContent = phase;
  }

  _hideCustomLoader() {
    const overlay = document.getElementById("custom-loader-overlay");
    if (!overlay) return;
    overlay.style.transition = "opacity 0.6s ease";
    overlay.style.opacity = "0";
    setTimeout(() => overlay.remove(), 650);
  }

  async goToGame() {
    this.currentArenaIndex = 0;
    this.levelCompleteTriggered = false;

    this._showCustomLoader("DÉMARRAGE");
    this._updateLoader(5, "DÉMARRAGE DU MOTEUR");

    const oldScene = this.scene;
    const scene = this.gamescene;
    scene.clearColor = new Color4(0.01, 0.01, 0.2);
    oldScene.detachControl();
    scene.detachControl();

    // 1. Load player + lights
    this._updateLoader(15, "CHARGEMENT DE L'ENVIRONNEMENT");
    await this.initializeGameAsync(scene);

    // 2. Wait for scene graph to be declared ready
    this._updateLoader(35, "INITIALISATION DES SYSTÈMES");
    await scene.whenReadyAsync();

    // 3. Wait for textures
    this._updateLoader(50, "CHARGEMENT DES TEXTURES");
    await new Promise(resolve => {
      const check = () => scene.isReady(true) ? resolve() : setTimeout(check, 40);
      check();
    });

    // 4. Build menus (before spawn to avoid race)
    this.isPaused = false;
    scene.isPaused = false;
    this.settingsMenu = new SettingsMenu(scene, () => {
      this.settingsMenu.hide(); this.pauseMenu.show();
    }, () => this.updateVolumes());
    this.loseMenu = new LoseMenu(scene,
      () => { if (this.pauseMenu) this.pauseMenu.dispose(); if (this.settingsMenu) this.settingsMenu.dispose(); if (this.loseMenu) this.loseMenu.dispose(); if (this.hud) this.hud.dispose(); this.gamescene = null; this.goToStart(); },
      () => { if (this.pauseMenu) this.pauseMenu.dispose(); if (this.settingsMenu) this.settingsMenu.dispose(); if (this.loseMenu) this.loseMenu.dispose(); if (this.hud) this.hud.dispose(); if (this.bossMusic) this.bossMusic.pause(); this.gamescene = null; this.goToStart(); }
    );
    this.pauseMenu = new PauseMenu(scene, () => this.togglePause(),
      () => { this.pauseMenu.hide(); this.settingsMenu.show(); },
      () => { this.pauseMenu.dispose(); if (this.settingsMenu) this.settingsMenu.dispose(); if (this.loseMenu) this.loseMenu.dispose(); if (this.bossMusic) this.bossMusic.pause(); this.goToStart(); }
    );

    // 5. Spawn enemies BEFORE warmup so their shaders compile too
    this._updateLoader(60, "SPAWN DES ENNEMIS");
    this.spawnEnemiesForArena(scene);

    // Force all bounding boxes now so intersectsMesh works on frame 1
    scene.meshes.forEach(m => { m.computeWorldMatrix(true); m.refreshBoundingInfo(); });

    // 6. Switch to game scene
    oldScene.dispose();
    this.state = State.GAME;
    this.scene = scene;
    scene.attachControl();

    // 7. WARMUP: stop the engine render loop, render manually
    //    This avoids double-render and gives us full control over frame count.
    //    The custom loader covers the canvas so the player sees nothing.
    this._updateLoader(65, "COMPILATION DES SHADERS");
    this.engine.stopRenderLoop();

    await new Promise(resolve => {
      let frames = 0;
      const WARMUP_FRAMES = 120; // ~2 seconds of compilation

      const warmup = () => {
        try { scene.render(); } catch(e) {}
        frames++;
        const pct = 65 + Math.round((frames / WARMUP_FRAMES) * 30);
        this._updateLoader(Math.min(95, pct), `COMPILATION DES SHADERS (${frames}/${WARMUP_FRAMES})`);
        if (frames < WARMUP_FRAMES) {
          requestAnimationFrame(warmup);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(warmup);
    });

    // 8. Restart the normal render loop
    this._updateLoader(100, "PRÊT !");
    this.engine.runRenderLoop(() => {
      switch (this.state) {
        case State.START:
        case State.CUTSCENE:
        case State.LOSE:
          if (this.scene) this.scene.render();
          break;
        case State.GAME:
          if (!this.isPaused && this.scene.enemies && this.scene.enemies.length === 0 && !this.levelCompleteTriggered) {
            this.levelCompleteTriggered = true;
            this.handleArenaComplete();
          }
          if (this.scene) this.scene.render();
          break;
      }
    });

    await new Promise(resolve => setTimeout(resolve, 250));
    this.engine.hideLoadingUI();
    this._ignoringPointerLock = false;
    this._skipNextPointerLockEvent = false;
    this._hideCustomLoader();
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
          // Protection contre les dégâts au spawn (3 secondes d'invincibilité)
          if (typeof this.player.setSpawnProtection === "function") {
              this.player.setSpawnProtection(3);
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

      if (this.currentArenaIndex === this.arenas.length - 1) {
          this.enemies.push(new Boss(scene, this.player, getRandomArenaPos()));
          if (this.bossMusic && !this.menuMusicMuted) {
              this.updateVolumes(); // Reset volume in case of previous fade-out
              this.bossMusic.currentTime = 0;
              this.bossMusic.play().catch(e => console.log("Boss music blocked", e));
          }
      } else {
          const num1 = 1 + this.currentArenaIndex;
          for(let i=0; i<num1; i++) {
              this.enemies.push(new EnemyType1(scene, this.player, getRandomArenaPos()));
          }
          const num2 = 1 + Math.floor(this.currentArenaIndex / 2);
          for(let i=0; i<num2; i++) {
              this.enemies.push(new EnemyType2(scene, this.player, getRandomArenaPos()));
          }
      }
  }

  async handleArenaComplete() {
      this.currentArenaIndex++;
      if (this.currentArenaIndex >= this.arenas.length) {
          this.state = State.CUTSCENE;
          this._ignoringPointerLock = true;
          this.isPaused = true;
          this.scene.isPaused = true;
          if (this.hud) this.hud.isPaused = true;
          
          this.scene.detachControl();
          if (document.exitPointerLock) document.exitPointerLock();
          SoundManager.setFootsteps(false);
          
          this.cutScene = new Scene(this.engine);
          let camera = new FreeCamera("cutCamera", new Vector3(0, 0, 0), this.cutScene);
          this.cutScene.clearColor = new Color4(0, 0, 0, 1);
          
          this._renderCutsceneDom("VICTOIRE", "L'IA S.U.D.O est détruite. Son noyau est hors-ligne. Vous avez sauvé l'humanité !", () => {
              this._removeCutsceneDom();
              this.cutScene.dispose();
              
              if (this.pauseMenu) this.pauseMenu.dispose();
              if (this.settingsMenu) this.settingsMenu.dispose();
              if (this.loseMenu) this.loseMenu.dispose();
              if (this.hud) this.hud.dispose();
              if (this.gamescene) {
                  this.gamescene.dispose();
                  this.gamescene = null;
              }
              if (this.bossMusic) this.bossMusic.pause();
              
              this.currentArenaIndex = 0; 
              this.goToStart();
          });

          const nextBtn = document.getElementById("cutscene-next-btn");
          if (nextBtn) {
              nextBtn.textContent = "RETOUR AU MENU";
          }
          
          this.scene = this.cutScene;
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
      SoundManager.setFootsteps(false);
      
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
    if (this.bossMusic) this.bossMusic.pause();
    SoundManager.setFootsteps(false);
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
    if (this.bossMusic) this.bossMusic.pause();
    SoundManager.setFootsteps(false);
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
    SoundManager.setFootsteps(false);
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