import { Scene, Mesh, Vector3 } from "@babylonjs/core";

export class Environment {
  constructor(scene) {
    this.scene = scene;
  }

  async load() {
    const ground = Mesh.CreateBox("ground", 24, this.scene);
    ground.scaling = new Vector3(1, 0.02, 1);
  }
}
