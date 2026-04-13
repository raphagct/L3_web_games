import {
  Vector3,
  SceneLoader
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Projectile } from "./Projectile.js";

export class Arme {
  static COOLDOWN = 0.25; // secondes entre chaque tir

  constructor(scene, camera, parent, nom = "Revolver") {
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

  async creerMesh(parent) {
    try {
      const result = await SceneLoader.ImportMeshAsync("", "./textures/meshes/pistolet/", "scene.gltf", this.scene);
      
      this.mesh = result.meshes[0];

      // S'assurer que tous les sous-meshes s'affichent au-dessus du décor (comme le bras)
      result.meshes.forEach((m) => {
        m.renderingGroupId = 1;
      });

      this.mesh.parent = parent;
      
      // Normaliser la taille du mesh pour qu'elle s'insère dans un cube de taille 1
      // Cela définit la propriété `scaling` interne de ce mesh pour compenser la taille originale.
      this.mesh.normalizeToUnitCube();
      
      // On rétrécit l'arme à 60% pour mieux s'aligner avec le bras
      this.mesh.scaling.scaleInPlace(0.6);
      
      // On avance la position sur l'axe Z (vers l'avant du bras, dont la pointe est à ~0.27)
      this.mesh.position = new Vector3(0, -0.05, 0.32); 
      
      // Tourner l'arme si le modèle est à l'envers
      this.mesh.rotation = new Vector3(0, Math.PI, 0); 
    } catch(e) {
      console.error("Erreur gLTF Pistolet:", e);
    }
  }

  tirer() {
    if (!this.mesh) return; // Si la 3D de l'arme charge encore
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
