export default class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = BABYLON.MeshBuilder.CreateBox("player", { size: 1 }, scene);
    this.mesh.position.y = 0.5;
  }
}
