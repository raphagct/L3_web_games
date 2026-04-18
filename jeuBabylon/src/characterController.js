import {
  Vector3,
  MeshBuilder,
  FreeCamera
} from "@babylonjs/core";
import { GameSettings } from "./config.js";
import { Bras } from "./Bras.js";

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

    // Initialiser l'affichage au démarrage
    if (this.hud) {
      this.hud.updateHealth(this.health, this.maxHealth);
      this.hud.updateFood(this.food, this.maxFood);
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
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDead = true;
      if (this.onDeath) this.onDeath();
    }
    if (this.hud) {
      this.hud.updateHealth(this.health, this.maxHealth);
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
    this.camera.attachControl(canvas, true);

    canvas.addEventListener("click", () => {
      if (this.scene.isPaused) return;
      canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
      if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    });

    // Créer le bras (+ arme attachée) en FPS
    this.bras = new Bras(this.scene, this.camera);
    if (this.hud && this.bras.arme) {
      this.hud.updateWeapon(this.bras.arme.nom);
    }

    // Tir au clic gauche (uniquement en pointer lock)
    canvas.addEventListener("pointerdown", (e) => {
      if (e.button === 0 && document.pointerLockElement === canvas) {
        this.bras.tirer();
      }
    });

    // Désactiver les touches par défaut de la caméra Babylon
    this.camera.inputs.removeByType("FreeCameraKeyboardMoveInput");
    this.scene.activeCamera = this.camera;
    // Mouvement à chaque frame via l'observable
    this.scene.onBeforeRenderObservable.add(() => {
      this.updateMovement();
    });
  }

  updateMovement() {
    if (this.scene.isPaused) return;

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

    let displacement = new Vector3(0, -9.81 * dt, 0);

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

    // Si le joueur tombe de la carte
    if (this.mesh.position.y < -50) {
      this.takeDamage(this.health);
    }
  }
}