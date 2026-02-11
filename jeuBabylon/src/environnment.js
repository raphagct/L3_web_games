import * as BABYLON from "@babylonjs/core";

export class Environment {
  constructor(scene) {
    this.scene = scene;
  }

  async load() {
    const light = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      this.scene,
    );
    light.intensity = 0.7;
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      "sphere",
      { diameter: 2, segments: 32 },
      this.scene,
    );
    sphere.position.y = 1.4;
    const ground = BABYLON.MeshBuilder.CreateBox(
      "ground",
      { size: 48 },
      this.scene,
    );
    ground.scaling = new BABYLON.Vector3(1, 0.02, 1);
  }
}
