import {
  Vector3,
  SceneLoader,
  Ray
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { Projectile } from "./Projectile.js";
import { SoundManager } from "./soundManager.js";

export class Arme {
  static COOLDOWN = 0.25; // secondes entre chaque tir

  constructor(scene, camera, parent, hud, nom = "Revolver") {
    this.scene = scene;
    this.camera = camera;
    this.hud = hud;
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

      this.mesh.normalizeToUnitCube();
      this.mesh.scaling.scaleInPlace(0.6);
      this.mesh.position = new Vector3(0, -0.05, 0.32);
      this.mesh.rotation = new Vector3(0, Math.PI, 0);
    } catch (e) {
      console.error("Erreur gLTF Pistolet:", e);
    }
  }

  tirer() {
    if (!this.mesh) return; // Si la 3D de l'arme charge encore
    if (this.tempsCooldown > 0) return;
    if (this.scene.isPaused) return;

    this.tempsCooldown = Arme.COOLDOWN;

    SoundManager.play('shoot');

    // Animation de recul (recoil) de l'arme
    if (this._recoilObs) {
      this.scene.onBeforeRenderObservable.remove(this._recoilObs);
    }
    const initialPos = new Vector3(0, -0.05, 0.32);
    this.mesh.position = new Vector3(0, -0.05, 0.15); // On recule l'arme (recoil)
    this.mesh.rotation.x = -0.3; // On lève légèrement le canon

    this._recoilObs = this.scene.onBeforeRenderObservable.add(() => {
      this.mesh.position = Vector3.Lerp(this.mesh.position, initialPos, 0.2);
      this.mesh.rotation.x = this.mesh.rotation.x * 0.8;
      if (Vector3.Distance(this.mesh.position, initialPos) < 0.001 && Math.abs(this.mesh.rotation.x) < 0.001) {
        this.mesh.position = initialPos;
        this.mesh.rotation.x = 0;
        this.scene.onBeforeRenderObservable.remove(this._recoilObs);
        this._recoilObs = null;
      }
    });

    // Position de départ = position absolue du bout de l'arme
    const positionDepart = this.mesh.getAbsolutePosition().clone();

    const camPos = this.camera.globalPosition.clone();
    const camDir = this.camera.getDirection(Vector3.Forward());
    const ray = new Ray(camPos, camDir, 1000);

    const hitInfo = this.scene.pickWithRay(ray, (m) => {
      return m.checkCollisions && m.name !== "player" && !m.name.includes("arme");
    });

    let targetPoint;
    if (hitInfo && hitInfo.hit) {
      targetPoint = hitInfo.pickedPoint;
    } else {
      targetPoint = camPos.add(camDir.scale(1000));
    }

    const direction = targetPoint.subtract(positionDepart).normalize();

    const projectile = new Projectile(this.scene, positionDepart, direction, this.hud);
    this.projectiles.push(projectile);
  }
}
