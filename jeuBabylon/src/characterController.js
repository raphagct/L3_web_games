import {
  Mesh,
  Vector3,
  MeshBuilder,
  FreeCamera
} from "@babylonjs/core";
import { Bras } from "./Bras.js";

export class Player {
  static SPEED = 0.15;

  constructor(scene, hud) {
    this.scene = scene;
    this.mesh = null;
    this.speed = 10; 

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

  async load() {
    // on crée le mesh du perso(qu'on voit pas vu que c'est en 1ere personne)
    this.mesh = MeshBuilder.CreateBox("player", { size: 1 }, this.scene);
    this.mesh.position.y = 1;
    this.mesh.isVisible = false; 

    this.camera = new FreeCamera("camera", new Vector3(0, 0, 0), this.scene);
    this.camera.parent = this.mesh;
    this.camera.minZ = 0.01; // Permet de voir les objets proches (bras/arme)
    
    const canvas = this.scene.getEngine().getRenderingCanvas();
    this.camera.attachControl(canvas, true);

    // On active le pointer lock pour bouger la souris sans cliquer
    canvas.addEventListener("click", () => {
      canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
      if (canvas.requestPointerLock) {
        canvas.requestPointerLock();
      }
    });

    // Créer le bras (+ arme attachée) en FPS
    this.bras = new Bras(this.scene, this.camera);

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

    if (this.inputMap["z"]) {
      this.mesh.position.addInPlace(forward.scale(distance)); // avant
    }
    if (this.inputMap["s"]) {
      this.mesh.position.subtractInPlace(forward.scale(distance)); // arrière
    }
    if (this.inputMap["q"]) {
      this.mesh.position.subtractInPlace(right.scale(distance)); // gauche
    }
    if (this.inputMap["d"]) {
      this.mesh.position.addInPlace(right.scale(distance)); // droite
    }
  }
}