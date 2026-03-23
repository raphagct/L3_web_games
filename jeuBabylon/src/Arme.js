import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { Projectile } from "./Projectile.js";

export class Arme {
  static COOLDOWN = 0.25; // secondes entre chaque tir

  constructor(scene, camera, parent, nom = "Blaster Laser") {
    this.scene = scene;
    this.camera = camera;
    this.tempsCooldown = 0;
    this.projectiles = [];
    this.nom = nom;

    this.creerMesh(parent);

    // Décrémenter le cooldown à chaque frame
    this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      if (this.tempsCooldown > 0) {
        this.tempsCooldown -= dt;
      }
    });
  }

  creerMesh(parent) {
    // L'arme : un petit rectangle foncé (canon) au bout du bras
    this.mesh = MeshBuilder.CreateBox(
      "arme",
      { width: 0.07, height: 0.07, depth: 0.4 },
      this.scene
    );

    const materiau = new StandardMaterial("matArme", this.scene);
    materiau.diffuseColor = new Color3(0.2, 0.2, 0.25);
    materiau.emissiveColor = new Color3(0.1, 0.1, 0.12); // lumière propre
    materiau.specularColor = new Color3(0.4, 0.4, 0.4);
    this.mesh.material = materiau;

    // Rendu au-dessus de tout (même layer que le bras)
    this.mesh.renderingGroupId = 1;

    // Positionner au bout du bras (dépasse vers l'avant)
    this.mesh.parent = parent;
    this.mesh.position = new Vector3(0, 0.05, 0.28);
  }

  tirer() {
    if (this.tempsCooldown > 0) return;
    if (this.scene.isPaused) return;

    this.tempsCooldown = Arme.COOLDOWN;

    // Position de départ = position absolue du bout de l'arme
    const positionDepart = this.mesh.getAbsolutePosition().clone();

    // Direction = là où la caméra regarde
    const direction = this.camera.getDirection(Vector3.Forward());

    const projectile = new Projectile(this.scene, positionDepart, direction);
    this.projectiles.push(projectile);
  }
}
