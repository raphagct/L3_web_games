import {
  MeshBuilder,
  PhotoDome,
  StandardMaterial,
  Texture,
  Vector3,
  Color3,
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
    ground.checkCollisions = true;

    // Ajouter des murs invisibles aux extrémités
    const createBoundary = (name, w, d, x, z) => {
      const wall = MeshBuilder.CreateBox(name, { width: w, height: 10, depth: d }, this.scene);
      wall.position = new Vector3(x, 5, z);
      wall.checkCollisions = true;
      wall.isVisible = false;
    };
    createBoundary("wallNorth", 24, 1, 0, 12);
    createBoundary("wallSouth", 24, 1, 0, -12);
    createBoundary("wallEast", 1, 24, 12, 0);
    createBoundary("wallWest", 1, 24, -12, 0);

    // Cube au milieu en tant qu'obstacle
    const obstacle = MeshBuilder.CreateBox("obstacle", { size: 3 }, this.scene);
    obstacle.position = new Vector3(0, 1.5, 4); 
    obstacle.checkCollisions = true;
    
    const obsMat = new StandardMaterial("obsMat", this.scene);
    obsMat.diffuseColor = new Color3(0.8, 0.4, 0.1); 
    obstacle.material = obsMat;

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
