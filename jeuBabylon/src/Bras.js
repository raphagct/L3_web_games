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

    this.creerMesh();

    // Créer l'arme attachée au bout du bras
    this.arme = new Arme(scene, camera, this.mesh, hud);
  }

  creerMesh() {
    // Le bras : un rectangle allongé (box étirée), couleur peau
    this.mesh = MeshBuilder.CreateBox(
      "bras",
      { width: 0.14, height: 0.14, depth: 0.55 },
      this.scene
    );

    const materiau = new StandardMaterial("matBras", this.scene);
    materiau.diffuseColor = new Color3(0.87, 0.72, 0.53); // couleur peau
    materiau.emissiveColor = new Color3(0.35, 0.28, 0.2); // lumière propre pour être toujours visible
    this.mesh.material = materiau;

    // Rendu au-dessus de tout (layer 1 = par-dessus la scène)
    this.mesh.renderingGroupId = 1;

    // Attacher le bras à la caméra (il suit le regard)
    this.mesh.parent = this.camera;

    // Positionner en bas à droite du champ de vision
    this.mesh.position = new Vector3(0.35, -0.25, 0.55);

    // Légère rotation pour un effet naturel
    this.mesh.rotation = new Vector3(0, 0, -0.1);
  }

  tirer() {
    this.arme.tirer();
  }
}
