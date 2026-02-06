import { ArcRotateCamera, Vector3, TransformNode } from "@babylonjs/core";

export default class Player extends TransformNode {
  constructor(scene, input) {
    super("player", scene);
    this.scene = scene;
    this.setupPlayerCamera();
    this.mesh = assets.mesh;
    this.mesh.parent = this;
  }

  setupPlayerCamera() {
    const camera4 = new ArcRotateCamera(
      "arc",
      -Math.PI / 2,
      Math.PI / 2,
      40,
      new Vector3(0, 3, 0),
      this.scene,
    );
  }
}
