import {
  MeshBuilder,
  PhotoDome,
  StandardMaterial,
  Texture,
} from "@babylonjs/core";

export class Environment {
  constructor(scene) {
    this.scene = scene;
  }

  async load() {
    // create a flat ground
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 24, height: 24 },
      this.scene,
    );

    const groundMaterial = new StandardMaterial("groundMat", this.scene);
    groundMaterial.diffuseTexture = new Texture("ground.jpg", this.scene);
    ground.material = groundMaterial;

    // sky / photo dome
    const skyDome = new PhotoDome(
      "skyDome",
      "Sky1.jpg",
      { resolution: 32, size: 500 },
      this.scene,
    );
  }
}
