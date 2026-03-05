import { TransformNode, UniversalCamera, Vector3, MeshBuilder, StandardMaterial, Color3 } from "@babylonjs/core";

export class Player extends TransformNode {
  static SPEED = 0.15;

  constructor(scene, hud) {
    super("player", scene);
    this.scene = scene;
    this.hud = hud;

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

    // Créer le mesh du joueur (un cylindre simple)
    const body = MeshBuilder.CreateCylinder("body", { height: 3, diameter: 2 }, scene);
    const mat = new StandardMaterial("playerMat", scene);
    mat.diffuseColor = new Color3(0.8, 0.5, 0.5);
    body.material = mat;
    body.position.y = 1.5; // poser sur le sol
    body.parent = this;

    // Petite tête
    const head = MeshBuilder.CreateBox("head", { width: 0.5, depth: 0.5, height: 0.25 }, scene);
    head.position.y = 1.5;
    head.position.z = 1;
    head.parent = body;

    this.mesh = body;

    // Inputs clavier
    this.inputMap = {};
    window.addEventListener("keydown", (e) => { this.inputMap[e.key] = true; });
    window.addEventListener("keyup", (e) => { this.inputMap[e.key] = false; });

    // Caméra qui suit le joueur
    this.camera = new UniversalCamera("cam", new Vector3(0, 10, -15), scene);
    this.camera.setTarget(this.position);
    scene.activeCamera = this.camera;

    // Boucle de jeu
    scene.onBeforeRenderObservable.add(() => this.update());
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.hud) this.hud.updateHealth(this.health, this.maxHealth);
  }

  eat(amount) {
    this.food += amount;
    if (this.hud) this.hud.updateFood(this.food, this.maxFood);
  }

  update() {
    if (this.scene.isPaused) return;

    const speed = Player.SPEED;

    if (this.inputMap["ArrowUp"])    this.position.z += speed;
    if (this.inputMap["ArrowDown"])  this.position.z -= speed;
    if (this.inputMap["ArrowLeft"])  this.position.x -= speed;
    if (this.inputMap["ArrowRight"]) this.position.x += speed;

    // La caméra suit le joueur
    this.camera.position.x = this.position.x;
    this.camera.position.z = this.position.z - 15;
    this.camera.position.y = this.position.y + 10;
    this.camera.setTarget(this.position);
  }
}
