import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";

export class Projectile {
  static VITESSE = 40;
  static DUREE_VIE = 2; // secondes

  constructor(scene, positionDepart, direction) {
    this.scene = scene;
    this.direction = direction.normalize();
    this.tempsEcoule = 0;

    // Créer le mesh (petite sphère)
    this.mesh = MeshBuilder.CreateSphere(
      "projectile",
      { diameter: 0.15 },
      scene
    );
    this.mesh.position = positionDepart.clone();

    // Matériau jaune lumineux
    const materiau = new StandardMaterial("matProjectile", scene);
    materiau.diffuseColor = new Color3(1, 0.9, 0.2);
    materiau.emissiveColor = new Color3(1, 0.7, 0);
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
          enemy.takeDamage(15); // Dégâts de l'arme !
          if (enemy.player && enemy.player.hud && typeof enemy.player.hud.addHit === 'function') {
              enemy.player.hud.addHit();
          }
          this.detruire(); // Détruire le projectile
          return;
        }
      }
    }
  }

  detruire() {
    // Retirer l'observateur de la boucle de rendu
    this.scene.onBeforeRenderObservable.remove(this._observateur);

    // Supprimer le matériau et le mesh
    if (this.mesh.material) {
      this.mesh.material.dispose();
    }
    this.mesh.dispose();
  }
}
