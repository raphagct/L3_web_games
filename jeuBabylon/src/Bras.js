import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { Arme } from "./Arme.js";

export class Bras {
  constructor(scene, camera, hud) {
    this.scene = scene;
    this.camera = camera;
    this.hud = hud;

    this.mesh = this._creerBras();

    // Créer l'arme attachée au bout du bras
    this.arme = new Arme(scene, camera, this.mesh, hud);
  }

  _creerBras() {
    const RG = 1;

    const matPeau = new StandardMaterial("matPeau", this.scene);
    matPeau.diffuseColor = new Color3(0.88, 0.70, 0.55);
    matPeau.emissiveColor = new Color3(0.22, 0.14, 0.09);
    matPeau.specularColor = new Color3(0.30, 0.20, 0.15);
    matPeau.specularPower = 48;

    const matManche = new StandardMaterial("matManche", this.scene);
    matManche.diffuseColor = new Color3(0.12, 0.12, 0.15);
    matManche.emissiveColor = new Color3(0.04, 0.04, 0.05);
    matManche.specularColor = new Color3(0.06, 0.06, 0.07);
    matManche.specularPower = 12;

    const bras = MeshBuilder.CreateBox(
      "bras",
      { width: 0.14, height: 0.14, depth: 0.55 },
      this.scene
    );
    bras.material = matPeau;
    bras.renderingGroupId = RG;
    bras.parent = this.camera;
    bras.position = new Vector3(0.35, -0.25, 0.55);
    bras.rotation = new Vector3(0, 0, -0.1);

    const manche = MeshBuilder.CreateCylinder("manche", {
      height: 0.22,
      diameterTop: 0.155,
      diameterBottom: 0.175,
      tessellation: 10
    }, this.scene);
    manche.material = matManche;
    manche.renderingGroupId = RG;
    manche.parent = bras;
    manche.position = new Vector3(0, 0, -0.20);
    manche.rotation = new Vector3(Math.PI / 2, 0, 0);

    const poignet = MeshBuilder.CreateCylinder("poignet", {
      height: 0.06,
      diameterTop: 0.135,
      diameterBottom: 0.15,
      tessellation: 10
    }, this.scene);
    poignet.material = matPeau;
    poignet.renderingGroupId = RG;
    poignet.parent = bras;
    poignet.position = new Vector3(0, 0, -0.09);
    poignet.rotation = new Vector3(Math.PI / 2, 0, 0);

    return bras;
  }

  tirer() {
    this.arme.tirer();
  }
}
