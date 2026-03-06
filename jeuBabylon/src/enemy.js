import {
  MeshBuilder,
  Vector3,
  Color3,
  StandardMaterial,
  Ray
} from "@babylonjs/core";

export class Enemy {
  constructor(scene, player, position, hp, damage, speed) {
    this.scene = scene;
    this.player = player;
    this.hp = hp;
    this.damage = damage;
    this.speed = speed;
    this.mode = "WANDER";

    this.mesh = this.createMesh(scene);
    this.mesh.position = new Vector3(position.x, position.y + 1, position.z);

    // Activer les collisions pour l'ennemi
    this.mesh.checkCollisions = true;
    this.mesh.ellipsoid = new Vector3(0.4, 1, 0.4);

    this.wanderDirection = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.changeDirectionTimer = 0;

    this.visionRange = 12; // Distance de vision max (12 unités)
    this.visionAngle = Math.PI / 3; // Angle de vision (60 degrés de chaque côté, cône de 120 degrés)

    this.scene.onBeforeRenderObservable.add(() => {
      this.update();
    });
  }

  createMesh(scene) {
    const collider = MeshBuilder.CreateBox("enemyCollider", { height: 2, width: 0.8, depth: 0.8 }, scene);
    collider.isVisible = false;

    // Design "bâton" temporaire : un cylindre pour le corps et une sphère pour la tête
    const body = MeshBuilder.CreateCylinder("enemyBody", { height: 1, diameter: 0.3 }, scene);
    const head = MeshBuilder.CreateSphere("enemyHead", { diameter: 0.4 }, scene);
    
    head.position.y = 0.7;
    head.parent = body;

    body.position.y = -0.5;
    body.parent = collider;
    body.checkCollisions = false;

    return collider;
  }

  update() {
    if (this.scene.isPaused) return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;

    if (this.canSeePlayer()) {
      this.mode = "CHASE";
    } else {
      this.mode = "WANDER";
    }

    if (this.mode === "WANDER") {
      this.changeDirectionTimer -= dt;
      if (this.changeDirectionTimer <= 0) {
        this.wanderDirection = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
        this.changeDirectionTimer = Math.random() * 3 + 1;
      }

      const move = this.wanderDirection.scale(this.speed * dt);
      this.mesh.moveWithCollisions(move);

      const targetRotation = this.mesh.position.add(this.wanderDirection);
      this.mesh.lookAt(targetRotation);

    } else if (this.mode === "CHASE") {
      if (this.player && this.player.mesh) {
        const direction = this.player.mesh.position.subtract(this.mesh.position);
        direction.y = 0;
        direction.normalize();

        const move = direction.scale(this.speed * dt);
        this.mesh.moveWithCollisions(move);

        const targetRotation = this.mesh.position.add(direction);
        this.mesh.lookAt(targetRotation);
      }
    }

    this.mesh.position.y = 1;
  }

  canSeePlayer() {
    if (!this.player || !this.player.mesh) return false;

    const startPos = this.mesh.position;
    const targetPos = this.player.mesh.position;

    // 1. Vérifier la distance
    const distance = Vector3.Distance(startPos, targetPos);
    if (distance > this.visionRange) return false;

    // 2. Vérifier l'angle de vision
    const directionToPlayer = targetPos.subtract(startPos).normalize();
    const forward = this.mesh.getDirection(Vector3.Forward()).normalize();

    // On ignore la hauteur (Y) pour le calcul de l'angle
    const forward2D = new Vector3(forward.x, 0, forward.z).normalize();
    const direction2D = new Vector3(directionToPlayer.x, 0, directionToPlayer.z).normalize();

    const dot = Vector3.Dot(forward2D, direction2D);
    if (dot < Math.cos(this.visionAngle)) return false;

    // 3. Lancer un rayon pour vérifier s'il y a un obstacle (mur, objet) entre l'ennemi et le joueur
    const ray = new Ray(startPos, directionToPlayer, distance);
    const hitInfo = this.scene.pickWithRay(ray, (mesh) => {
      // Ignorer l'ennemi lui-même
      return mesh.checkCollisions && mesh.name !== "enemyCollider" && !mesh.name.includes("enemyBody") && !mesh.name.includes("enemyHead");
    });

    if (hitInfo.hit && hitInfo.pickedMesh !== this.player.mesh) {
      return false; // Il y a un obstacle entre l'ennemi et le joueur
    }

    return true;
  }
}

export class EnemyType1 extends Enemy {
  constructor(scene, player, position) {
    super(scene, player, position, 50, 10, 2);
    this.applyColor(new Color3(1, 0, 0));
  }

  applyColor(color) {
    const material = new StandardMaterial("enemyMaterial1", this.scene);
    material.diffuseColor = color;
    this.mesh.getChildMeshes().forEach(child => child.material = material);
  }
}

export class EnemyType2 extends Enemy {
  constructor(scene, player, position) {
    super(scene, player, position, 100, 20, 1);
    this.applyColor(new Color3(0, 0, 1));
  }

  applyColor(color) {
    const material = new StandardMaterial("enemyMaterial2", this.scene);
    material.diffuseColor = color;
    this.mesh.getChildMeshes().forEach(child => child.material = material);
  }
}
