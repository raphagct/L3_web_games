import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  Mesh,
} from "@babylonjs/core";

export class Projectile {
  static VITESSE = 40;
  static DUREE_VIE = 2; // secondes

  constructor(scene, positionDepart, direction) {
    this.scene = scene;
    this.direction = direction.normalize();
    this.tempsEcoule = 0;

    // --- Création de la balle (cylindre + pointe) ---
    const corps = MeshBuilder.CreateCylinder("corps", {
      height: 0.4,
      diameter: 0.12,
      tessellation: 8,
    }, scene);

    const pointe = MeshBuilder.CreateCylinder("pointe", {
      height: 0.15,
      diameterTop: 0,
      diameterBottom: 0.12,
      tessellation: 8,
    }, scene);
    pointe.position.y = 0.275;

    // Culasse (petit cylindre arrière légèrement plus large)
    const culasse = MeshBuilder.CreateCylinder("culasse", {
      height: 0.02,
      diameter: 0.14,
      tessellation: 8,
    }, scene);
    culasse.position.y = -0.24;

    // Fusionner en un seul mesh
    this.mesh = Mesh.MergeMeshes([corps, pointe, culasse], true, true);
    this.mesh.position = positionDepart.clone();

    const cible = positionDepart.add(direction);
    this.mesh.lookAt(cible);
    // La balle est orientée verticalement par défaut, on corrige l'axe
    this.mesh.rotate(new Vector3(1, 0, 0), Math.PI / 2);

    // --- Matériau métal doré ---
    const materiau = new StandardMaterial("matProjectile", scene);
    materiau.diffuseColor = new Color3(0.85, 0.65, 0.1);  
    materiau.specularColor = new Color3(1, 0.9, 0.4);       
    materiau.specularPower = 64;
    materiau.emissiveColor = new Color3(0.2, 0.15, 0.0);   
    this.mesh.material = materiau;

    // Déplacer le projectile à chaque frame
    this._observateur = scene.onBeforeRenderObservable.add(() => {
      this.mettreAJour();
    });
  }

  mettreAJour() {
    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    this.tempsEcoule += dt;

    // Auto-destruction après la durée de vie
    if (this.tempsEcoule >= Projectile.DUREE_VIE) {
      this.detruire();
      return;
    }

    // Déplacer dans la direction
    const deplacement = this.direction.scale(Projectile.VITESSE * dt);
    this.mesh.position.addInPlace(deplacement);

    // Vérifier les collisions avec les ennemis
    if (this.scene.enemies) {
      for (let enemy of this.scene.enemies) {
        if (!enemy.isDead && enemy.mesh && this.mesh.intersectsMesh(enemy.mesh, false)) {
          enemy.takeDamage(15);
          if (enemy.player && enemy.player.hud && typeof enemy.player.hud.addHit === 'function') {
            enemy.player.hud.addHit();
          }
          this.detruire();
          return;
        }
      }
    }
  }

  detruire() {
    this.scene.onBeforeRenderObservable.remove(this._observateur);
    if (this.mesh.material) {
      this.mesh.material.dispose();
    }
    this.mesh.dispose();
  }
}