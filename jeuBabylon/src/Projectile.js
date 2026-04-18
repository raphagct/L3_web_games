import {
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Color3,
  Color4,
  Quaternion,
  ParticleSystem,
  Texture,
  PointLight
} from "@babylonjs/core";

export class Projectile {
  static VITESSE = 80;
  static DUREE_VIE = 2; // secondes

  constructor(scene, positionDepart, direction, hud) {
    this.scene = scene;
    this.direction = direction.normalize();
    this.tempsEcoule = 0;
    this.hud = hud;
    this.hasHitEnemy = false;

    // === CORPS DE LA BALLE (capsule allongée) ===
    this.mesh = MeshBuilder.CreateCylinder(
      "projectile",
      { height: 0.4, diameterTop: 0.04, diameterBottom: 0.06, tessellation: 8 },
      scene
    );
    this.mesh.position = positionDepart.clone();
    // Aligner avec la direction de tir
    this.mesh.rotationQuaternion = Quaternion.FromLookDirectionRH(this.direction, Vector3.Up());
    this.mesh.rotate(new Vector3(1, 0, 0), Math.PI / 2);

    // Matériau métal chaud (cuivré / doré)
    const matBalle = new StandardMaterial("matBalle", scene);
    matBalle.diffuseColor = new Color3(0.95, 0.75, 0.2);
    matBalle.emissiveColor = new Color3(1.0, 0.55, 0.0);
    matBalle.specularColor = new Color3(1, 1, 0.5);
    matBalle.specularPower = 64;
    this.mesh.material = matBalle;

    // === LUEUR DYNAMIQUE (Point Light) ===
    this._light = new PointLight("bulletLight", positionDepart.clone(), scene);
    this._light.diffuse = new Color3(1, 0.6, 0.1);
    this._light.specular = new Color3(1, 0.4, 0.0);
    this._light.intensity = 3.5;
    this._light.range = 6;

    // === TRAINÉE DE PARTICULES ===
    this._particles = new ParticleSystem("bulletTrail", 80, scene);
    // Utiliser une texture procédurale (cercle blanc intégré à Babylon)
    this._particles.particleTexture = new Texture("https://assets.babylonjs.com/textures/flare.png", scene);
    this._particles.emitter = this.mesh;

    // Émission depuis le centre
    this._particles.minEmitBox = new Vector3(0, 0, 0);
    this._particles.maxEmitBox = new Vector3(0, 0, 0);

    // Couleurs (du blanc chaud à l'orange transparent)
    this._particles.color1 = new Color4(1, 0.9, 0.4, 1.0);
    this._particles.color2 = new Color4(1, 0.4, 0.0, 0.8);
    this._particles.colorDead = new Color4(0.3, 0.1, 0, 0.0);

    // Taille des particules
    this._particles.minSize = 0.03;
    this._particles.maxSize = 0.10;

    // Durée de vie très courte pour une traînée serrée
    this._particles.minLifeTime = 0.03;
    this._particles.maxLifeTime = 0.08;

    // Vitesse d'émission
    this._particles.emitRate = 200;

    // Les particules partent "en arrière" légèrement aléatoirement
    this._particles.direction1 = this.direction.negate().add(new Vector3(0.05, 0.05, 0.05));
    this._particles.direction2 = this.direction.negate().subtract(new Vector3(0.05, 0.05, 0.05));
    this._particles.minEmitPower = 0.5;
    this._particles.maxEmitPower = 2;

    // Gravité nulle (traçante)
    this._particles.gravity = new Vector3(0, 0, 0);

    // Pas de mise à l'échelle
    this._particles.minAngularSpeed = 0;
    this._particles.maxAngularSpeed = 0;

    this._particles.start();

    // Mettre à jour chaque frame
    this._observateur = scene.onBeforeRenderObservable.add(() => {
      this.mettreAJour();
    });
  }

  mettreAJour() {
    const dt = this.scene.getEngine().getDeltaTime() / 1000;
    this.tempsEcoule += dt;

    // Auto-destruction après la durée de vie
    if (this.tempsEcoule >= Projectile.DUREE_VIE) {
      if (!this.hasHitEnemy && this.hud && typeof this.hud.resetCombo === 'function') {
        this.hud.resetCombo();
      }
      this.detruire();
      return;
    }

    // Déplacer dans la direction
    const deplacement = this.direction.scale(Projectile.VITESSE * dt);
    this.mesh.position.addInPlace(deplacement);

    // Synchroniser la lumière avec la balle
    this._light.position.copyFrom(this.mesh.position);

    // Vérifier les collisions avec les ennemis
    if (this.scene.enemies) {
      for (let enemy of this.scene.enemies) {
        if (!enemy.isDead && enemy.mesh && this.mesh.intersectsMesh(enemy.mesh, false)) {
          this.hasHitEnemy = true;
          enemy.takeDamage(15);
          if (this.hud && typeof this.hud.addHit === 'function') {
              this.hud.addHit();
          } else if (enemy.player && enemy.player.hud && typeof enemy.player.hud.addHit === 'function') {
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

    if (this._particles) {
      this._particles.stop();
      // Laisser les dernières particules disparaître avant de détruire
      setTimeout(() => {
        if (this._particles) {
          this._particles.dispose();
          this._particles = null;
        }
      }, 150);
    }

    if (this._light) {
      this._light.dispose();
      this._light = null;
    }

    if (this.mesh) {
      if (this.mesh.material) this.mesh.material.dispose();
      this.mesh.dispose();
      this.mesh = null;
    }
  }
}
