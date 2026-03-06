import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";

export class Environment {
  constructor(scene) {
    this.scene = scene;
  }

  async load() {
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 24, height: 24 },
      this.scene,
    );

    const groundMaterial = new StandardMaterial("groundMat", this.scene);
    groundMaterial.diffuseTexture = new Texture(
      "/textures/skybox/skybox_ny.jpg",
      this.scene,
    );
    ground.material = groundMaterial;

    const skybox = MeshBuilder.CreateBox("skyBox", { size: 100.0 }, this.scene);
    const skyboxMaterial = new StandardMaterial("skyBox", this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skybox.material = skyboxMaterial;
    skybox.infiniteDistance = true;
    skyboxMaterial.disableLighting = true;
    const cubeTex = new CubeTexture("/textures/skybox/skybox", this.scene);
    skyboxMaterial.reflectionTexture = cubeTex;
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
  }
}
