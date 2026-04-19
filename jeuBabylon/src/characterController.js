import {
  Vector3,
  MeshBuilder,
  FreeCamera
} from "@babylonjs/core";
import { GameSettings } from "./config.js";
import { Bras } from "./Bras.js";
import { SoundManager } from "./soundManager.js";

export class Player {
  static SPEED = 0.15;

  constructor(scene, hud, onDeath) {
    this.scene = scene;
    this.onDeath = onDeath;
    this.mesh = null;
    this.isDead = false;
    this.speed = 5;

    //on stock touches pressées
    this.hud = hud;

    // Bras + Arme (initialisés dans load())
    this.bras = null;

    // Statistiques du joueur
    this.maxHealth = 100;
    this.health = 100;
    this.maxFood = 100;
    this.food = 100;
    
    // Invincibilité au spawn (en secondes)
    this._spawnProtection = 0;

    // Initialiser l'affichage au démarrage
    if (this.hud) {
      this.hud.updateHealth(this.health, this.maxHealth);
    }

    // Inputs clavier
    this.inputMap = {};
    this.setupInputs();
  }

  setupInputs() {
    window.addEventListener("keydown", (e) => {
      this.inputMap[e.key.toLowerCase()] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.inputMap[e.key.toLowerCase()] = false;
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    // Invincibilité temporaire au spawn
    if (this._spawnProtection > 0) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      if (this.onDeath) this.onDeath();
    }
    if (this.hud) {
      this.hud.updateHealth(this.health, this.maxHealth);
      if (typeof this.hud.showDamageEffect === 'function') {
        this.hud.showDamageEffect();
      }
    }
  }

  setSpawnProtection(seconds = 3) {
    this._spawnProtection = seconds;
    if (this.hud && typeof this.hud.showSpawnProtection === 'function') {
      this.hud.showSpawnProtection(seconds);
    }
  }

  healFull() {
    this.health = this.maxHealth;
    if (this.hud) {
      this.hud.updateHealth(this.health, this.maxHealth);
    }
  }

  async load() {
    // on crée le mesh du perso(qu'on voit pas vu que c'est en 1ere personne)
    this.mesh = MeshBuilder.CreateBox("player", { height: 2, width: 0.8, depth: 0.8 }, this.scene);
    this.mesh.position.y = 180;
    this.mesh.isVisible = false; 

    // Activer les collisions pour le joueur
    this.mesh.checkCollisions = true;
    this.mesh.ellipsoid = new Vector3(0.4, 1, 0.4); 

    this.camera = new FreeCamera("camera", new Vector3(0, 0, 0), this.scene);
    this.camera.parent = this.mesh;
    this.camera.minZ = 0.01; // Permet de voir les objets proches (bras/arme)
    
    const canvas = this.scene.getEngine().getRenderingCanvas();

    // ------------------------------------------------------------------
    // CUSTOM MOUSE LOOK — Only rotates when pointer lock is ON
    // This prevents the "camera teleport" bug caused by accumulated mouse
    // deltas being applied in one frame when pointer lock is re-acquired.
    // ------------------------------------------------------------------
    this.camera.inputs.clear(); // Remove ALL default camera inputs
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");

    const SENSITIVITY = 0.0012; // radians per pixel
    this._onMouseMove = (e) => {
      if (document.pointerLockElement !== canvas) return;
      if (this.scene.isPaused) return;

      // Clamp each delta to prevent huge single-frame jumps
      const dx = Math.max(-50, Math.min(50, e.movementX));
      const dy = Math.max(-50, Math.min(50, e.movementY));

      this.camera.rotation.y += dx * SENSITIVITY;
      this.camera.rotation.x += dy * SENSITIVITY;

      // Clamp vertical rotation to avoid flipping upside-down
      this.camera.rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.camera.rotation.x));
    };
    document.addEventListener("mousemove", this._onMouseMove);

    canvas.addEventListener("click", () => {
      // Only request pointer lock when in game and not paused
      if (this.scene.isPaused) return;
      if (document.pointerLockElement === canvas) return;
      if (canvas.requestPointerLock) canvas.requestPointerLock();
    });

    // Tir au clic gauche (uniquement en pointer lock)
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button === 0 && document.pointerLockElement === canvas) {
        this.bras.tirer();
      }
    });

    // Désactiver les touches par défaut de la caméra Babylon
    this.camera.inertia = 0; // Custom input = no inertia needed
    this.camera.speed = 0;   // We handle movement ourselves

    this.scene.activeCamera = this.camera;

    // Créer le bras (+ arme attachée) en FPS
    this.bras = new Bras(this.scene, this.camera, this.hud);
    if (this.hud && this.bras.arme) {
      this.hud.updateWeapon(this.bras.arme.nom);
    }
    
    // State pour l'animation du bras
    this._bobTime = 0;
    this._isWalking = false;
    this._brasSway = new Vector3(0, 0, 0);
    this._brasBasePosX = 0.35;
    this._brasBasePosY = -0.25;
    
    // Mouvement à chaque frame via l'observable
    this.scene.onBeforeRenderObservable.add(() => {
      // Décrémenter la protection de spawn
      if (this._spawnProtection > 0) {
        const dt = this.scene.getEngine().getDeltaTime() / 1000;
        this._spawnProtection = Math.max(0, this._spawnProtection - dt);
      }
      this.updateMovement();
    });
    
    // Activer la protection au spawn initial
    this.setSpawnProtection(3);
  }

  updateMovement() {
    if (this.scene.isPaused) {
      SoundManager.setFootsteps(false);
      return;
    }

    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    const distance = this.speed * dt;

    // Direction où la caméra regarde (forward/right)
    const forward = this.camera.getDirection(Vector3.Forward());
    const right = this.camera.getDirection(Vector3.Right());

    // On annule l'axe Y pour ne pas voler quand on regarde en l'air
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();

    let displacement = new Vector3(0, 0, 0);

    // Gravity: clamp to avoid excessive accumulation
    this._verticalVelocity = (this._verticalVelocity || 0) - 9.81 * dt;
    this._verticalVelocity = Math.max(this._verticalVelocity, -20); // terminal velocity cap
    displacement.y = this._verticalVelocity * dt;

    // Reset vertical velocity when grounded (detect collision below)
    const prevY = this.mesh.position.y;

    if (this.inputMap[GameSettings.keys.forward]) {
      displacement.addInPlace(forward.scale(distance)); // avant
    }
    if (this.inputMap[GameSettings.keys.backward]) {
      displacement.subtractInPlace(forward.scale(distance)); // arrière
    }
    if (this.inputMap[GameSettings.keys.left]) {
      displacement.subtractInPlace(right.scale(distance)); // gauche
    }
    if (this.inputMap[GameSettings.keys.right]) {
      displacement.addInPlace(right.scale(distance)); // droite
    }

    this.mesh.moveWithCollisions(displacement);
    
    // If position barely changed vertically, we're on ground -> reset velocity
    if (Math.abs(this.mesh.position.y - prevY - displacement.y) > 0.001) {
      this._verticalVelocity = 0;
    }
    
    // Animation du bras (bob en marchant + sway latéral)
    if (this.bras && this.bras.mesh) {
      const moving = this.inputMap[GameSettings.keys.forward] ||
                     this.inputMap[GameSettings.keys.backward] ||
                     this.inputMap[GameSettings.keys.left] ||
                     this.inputMap[GameSettings.keys.right];

      const brasTarget = this.bras.mesh;
      
      if (moving && !this.scene.isPaused) {
        this._bobTime += dt * 7; // Vitesse du balancement
        // Balancement vertical (haut/bas) et latéral léger
        const bobY = Math.sin(this._bobTime) * 0.025;
        const bobX = Math.cos(this._bobTime * 0.5) * 0.015;
        
        brasTarget.position.x = this._brasBasePosX + bobX;
        brasTarget.position.y = this._brasBasePosY + bobY;

        SoundManager.setFootsteps(true);
      } else {
        SoundManager.setFootsteps(false);
        // Retour doux à la position de base
        brasTarget.position.x += (this._brasBasePosX - brasTarget.position.x) * 0.12;
        brasTarget.position.y += (this._brasBasePosY - brasTarget.position.y) * 0.12;
      }

      // Inclinaison latérale du bras lors du strafe
      let targetTilt = 0;
      if (this.inputMap[GameSettings.keys.left])  targetTilt =  0.07;
      if (this.inputMap[GameSettings.keys.right]) targetTilt = -0.07;
      brasTarget.rotation.z += (targetTilt - 0.1 - brasTarget.rotation.z) * 0.1;
    }

    // Si le joueur tombe de la carte
    if (this.mesh.position.y < -50) {
      this.takeDamage(this.health);
    }
  }
}