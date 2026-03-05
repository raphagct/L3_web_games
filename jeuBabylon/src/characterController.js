export class characterController() {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.speed = 0.1;
  }

  async load() {
    // Créer un mesh pour le personnage
    this.mesh = Mesh.CreateBox("player", 1, this.scene);
    this.mesh.position.y = 0.5; // pour que le personnage soit au-dessus du sol

    // Ajouter une caméra qui suit le personnage
    const camera = new FollowCamera("FollowCam", new Vector3(0, 5, -10), this.scene);
    camera.lockedTarget = this.mesh; // la caméra suit le mesh du personnage
    camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
  }

  move(direction) {
    switch (direction) {
      case "forward":
        this.mesh.position.z += this.speed;
        break;
      case "backward":
        this.mesh.position.z -= this.speed;
        break;
      case "left":
        this.mesh.position.x -= this.speed;
        break;
      case "right":
        this.mesh.position.x += this.speed;
        break;
      default:
        break;
    }
  }
}