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
    this.mesh.position = new Vector3(position.x, position.y + 0.6, position.z);

    // Activer les collisions pour l'ennemi (ajusté avec l'échelle)
    this.mesh.checkCollisions = true;
    this.mesh.ellipsoid = new Vector3(0.24, 0.6, 0.24);

    this.wanderDirection = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.changeDirectionTimer = 0;

    this.visionRange = 12; // Distance de vision max (12 unités)
    this.visionAngle = Math.PI / 3; // Angle de vision (60 degrés de chaque côté, cône de 120 degrés)

    this.scene.onBeforeRenderObservable.add(() => {
      this.update();
    });
  }

  createMesh(scene) {
    const s = 0.6;
    const collider = MeshBuilder.CreateBox("enemyCollider", { height: 2 * s, width: 0.8 * s, depth: 0.8 * s }, scene);
    collider.isVisible = false;

    // Design "Robot IA"
    const base = MeshBuilder.CreateCylinder("enemyBase", { height: 0.4 * s, diameterTop: 0.6 * s, diameterBottom: 0.2 * s, tessellation: 16 }, scene);
    base.position.y = -0.8 * s;
    base.parent = collider;
    base.checkCollisions = false;

    // Torse (carré et massif, armure)
    const torso = MeshBuilder.CreateBox("enemyTorso", { height: 0.7 * s, width: 0.7 * s, depth: 0.5 * s }, scene);
    torso.position.y = -0.1 * s;
    torso.parent = collider;
    torso.checkCollisions = false;

    // Tête
    const head = MeshBuilder.CreateBox("enemyHead", { height: 0.4 * s, width: 0.6 * s, depth: 0.4 * s }, scene);
    head.position.y = 0.55 * s;
    head.parent = collider;
    head.checkCollisions = false;
    const antenna = MeshBuilder.CreateCylinder("enemyAntenna", { height: 0.3 * s, diameter: 0.05 * s }, scene);
    antenna.position.y = 0.3 * s;
    antenna.position.x = 0.2 * s;
    antenna.parent = head;
    antenna.checkCollisions = false;
    const antennaTip = MeshBuilder.CreateSphere("enemyAntennaTip", { diameter: 0.15 * s }, scene);
    antennaTip.position.y = 0.15 * s;
    antennaTip.parent = antenna;
    antennaTip.checkCollisions = false;

    const eye = MeshBuilder.CreateBox("enemyEye", { height: 0.1 * s, width: 0.4 * s, depth: 0.45 * s }, scene);
    eye.position.y = 0.05 * s; 
    eye.position.z = 0.05 * s; 
    eye.parent = head;
    eye.checkCollisions = false;

    // Épaules et Bras
    const armL = MeshBuilder.CreateBox("enemyArmL", { height: 0.6 * s, width: 0.2 * s, depth: 0.2 * s }, scene);
    armL.position.x = -0.45 * s;
    armL.position.y = 0;
    armL.parent = torso;
    armL.checkCollisions = false;

    const armR = MeshBuilder.CreateBox("enemyArmR", { height: 0.6 * s, width: 0.2 * s, depth: 0.2 * s }, scene);
    armR.position.x = 0.45 * s;
    armR.position.y = 0;
    armR.parent = torso;
    armR.checkCollisions = false;

    return collider;
  }

  applyColor(color) {
    const matId = Math.random().toString(36).substring(7);

    const material = new StandardMaterial("enemyMat_" + matId, this.scene);
    material.diffuseColor = color.scale(0.8);
    material.specularColor = new Color3(0.5, 0.5, 0.5);

    const glowMaterial = new StandardMaterial("enemyGlow_" + matId, this.scene);
    glowMaterial.emissiveColor = color; 
    glowMaterial.diffuseColor = color;
    glowMaterial.disableLighting = true;

    this.mesh.getChildMeshes().forEach(child => {
      if (child.name.includes("Eye") || child.name.includes("AntennaTip") || child.name.includes("Base")) {
        child.material = glowMaterial;
      } else {
        child.material = material;
      }
    });
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

    this.mesh.position.y = 0.6;
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
    this.applyColor(new Color3(1, 0.2, 0.2));
  }
}

export class EnemyType2 extends Enemy {
  constructor(scene, player, position) {
    super(scene, player, position, 100, 20, 1);
    this.applyColor(new Color3(0.2, 0.8, 1));
  }
}
