import {
  MeshBuilder,
  Vector3,
  Color3,
  StandardMaterial,
  Ray
} from "@babylonjs/core";
import { SoundManager } from "./soundManager.js";

export class Enemy {
  constructor(scene, player, position, hp, damage, speed, attackCooldownMax = 1.0) {
    this.scene = scene;
    this.player = player;
    this.hp = hp;
    this.damage = damage;
    this.speed = speed;
    this.mode = "WANDER";
    this.attackCooldown = 0;
    this.attackCooldownMax = attackCooldownMax;
    this.isDead = false;

    this.mesh = this.createMesh(scene);
    this.mesh.position = new Vector3(position.x, position.y + 1, position.z);

    this.arms = [];
    this.mesh.getChildMeshes().forEach(child => {
      if (child.name === "enemyArmL" || child.name === "enemyArmR") {
        this.arms.push(child);
      }
    });

    this.attackAnimTimer = 0;

    // Activer les collisions pour l'ennemi (ajusté avec l'échelle)
    this.mesh.checkCollisions = true;
    this.mesh.ellipsoid = new Vector3(0.24, 0.6, 0.24);

    this.wanderDirection = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    this.changeDirectionTimer = 0;

    this.visionRange = 20; // Distance de vision réduite pour qu'ils ne nous voient pas de trop loin
    this.visionAngle = Math.PI / 2.5; // Angle de vision réaliste (environ 72 degrés de chaque côté)

    this._observateur = this.scene.onBeforeRenderObservable.add(() => {
      if (!this.isDead) this.update();
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp -= amount;
    this.mode = "CHASE";
    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;
    if (this.player && this.player.hud && typeof this.player.hud.addKill === 'function') {
      const killPos = this.mesh ? this.mesh.getAbsolutePosition().clone() : null;
      this.player.hud.addKill(killPos);
    }
    if (this._observateur) {
      this.scene.onBeforeRenderObservable.remove(this._observateur);
    }
    if (this.mesh) {
      this.mesh.dispose();
    }
    if (this.scene.enemies) {
      const index = this.scene.enemies.indexOf(this);
      if (index !== -1) {
        this.scene.enemies.splice(index, 1);
      }
    }
  }

  createMesh(scene) {
    const s = 0.6;
    const collider = MeshBuilder.CreateBox("enemyCollider", { height: 2 * s, width: 0.8 * s, depth: 0.8 * s }, scene);
    collider.isVisible = false;

    // Design Robot 
    const base = MeshBuilder.CreateCylinder("enemyBase", { height: 0.4 * s, diameterTop: 0.6 * s, diameterBottom: 0.2 * s, tessellation: 16 }, scene);
    base.position.y = -0.8 * s;
    base.parent = collider;
    base.checkCollisions = false;

    const torso = MeshBuilder.CreateBox("enemyTorso", { height: 0.7 * s, width: 0.7 * s, depth: 0.5 * s }, scene);
    torso.position.y = -0.1 * s;
    torso.parent = collider;
    torso.checkCollisions = false;

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

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.mesh.position.y < -50) {
      this.die();
      return;
    }

    if (this.player && this.player.mesh) {
      if (this.attackCooldown <= 0 && this.mesh.intersectsMesh(this.player.mesh, false)) {
        if (typeof this.player.takeDamage === "function") {
          this.player.takeDamage(this.damage);
          this.attackCooldown = this.attackCooldownMax;
          this.attackAnimTimer = 0.3; // Animation de coup
          SoundManager.play('enemyAttack');
        }
      }
    }

    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= dt;
      this.arms.forEach(arm => {
        arm.rotation.x = -Math.PI / 2;
      });
    } else {
      this.arms.forEach(arm => {
        arm.rotation.x = arm.rotation.x * 0.9;
      });
    }

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
      move.y = -9.81 * dt; // Gravité
      this.mesh.moveWithCollisions(move);

      const targetRotation = this.mesh.position.add(this.wanderDirection);
      this.mesh.lookAt(targetRotation);

    } else if (this.mode === "CHASE") {
      if (this.player && this.player.mesh) {
        const direction = this.player.mesh.position.subtract(this.mesh.position);
        direction.y = 0;
        direction.normalize();

        const move = direction.scale(this.speed * dt);
        move.y = -9.81 * dt; // Gravité
        this.mesh.moveWithCollisions(move);

        const targetRotation = this.mesh.position.add(direction);
        this.mesh.lookAt(targetRotation);
      }
    }
  }

  canSeePlayer() {
    if (!this.player || !this.player.mesh) return false;

    const startPos = this.mesh.position;
    const targetPos = this.player.mesh.position;

    const distance = Vector3.Distance(startPos, targetPos);
    if (distance > this.visionRange) return false;

    const directionToPlayer = targetPos.subtract(startPos).normalize();
    const forward = this.mesh.getDirection(Vector3.Forward()).normalize();
    const forward2D = new Vector3(forward.x, 0, forward.z).normalize();
    const direction2D = new Vector3(directionToPlayer.x, 0, directionToPlayer.z).normalize();

    const dot = Vector3.Dot(forward2D, direction2D);
    if (dot < Math.cos(this.visionAngle)) return false;

    return true;
  }
}

export class EnemyType1 extends Enemy {
  constructor(scene, player, position) {
    super(scene, player, position, 40, 5, 5, 2);
    this.applyColor(new Color3(1, 0.2, 0.2));
  }
}

export class EnemyType2 extends Enemy {
  constructor(scene, player, position) {
    super(scene, player, position, 80, 30, 2, 1.0);
    this.applyColor(new Color3(0.2, 0.8, 1));
  }
}

export class Boss extends Enemy {
  constructor(scene, player, position) {
    super(scene, player, position, 1500, 20, 3, 2.0);
    this.applyColor(new Color3(0.8, 0.1, 0.8));

    this.mesh.scaling = new Vector3(3, 3, 3);
    this.mesh.ellipsoid = new Vector3(0.72, 1.8, 0.72);



    this.bossState = "WANDER";
    this.stateTimer = 6.0;

    this.laserMesh = MeshBuilder.CreateCylinder("bossLaser", { height: 80, diameter: 0.8 }, scene);
    this.laserMesh.rotation.x = Math.PI / 2;
    this.laserMesh.position.z = 40;
    this.laserMesh.isVisible = false;
    this.laserMesh.parent = this.mesh;
    this.laserMesh.checkCollisions = false;

    const laserMat = new StandardMaterial("bossLaserMat", scene);
    laserMat.emissiveColor = new Color3(1, 0, 0);
    laserMat.diffuseColor = new Color3(1, 0, 0);
    laserMat.disableLighting = true;
    laserMat.alpha = 0.7;
    this.laserMesh.material = laserMat;

    this.laserDamageTimer = 0;

    if (this.player && this.player.hud) {
      this.player.hud.showBossHealthBar("S.U.D.O CORE (BOSS)", this.hp, this.hp);
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;
    this.hp -= amount;
    if (this.player && this.player.hud) {
      this.player.hud.updateBossHealthBar(this.hp);
    }
    if (this.hp <= 0) {
      if (this.player && this.player.hud) {
        this.player.hud.hideBossHealthBar();
      }
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.bossState = "DEAD";
    SoundManager.play('bossDeath');

    if (this.scene.gameApp) {
      this.scene.gameApp.stopBossMusicWithFade();
    }

    if (this.laserMesh) {
      this.laserMesh.isVisible = false;
      this.laserMesh.dispose();
    }

    const fadeDiv = document.createElement("div");
    fadeDiv.id = "boss-fade-out";
    fadeDiv.style.position = "absolute";
    fadeDiv.style.top = "0";
    fadeDiv.style.left = "0";
    fadeDiv.style.width = "100%";
    fadeDiv.style.height = "100%";
    fadeDiv.style.backgroundColor = "black";
    fadeDiv.style.opacity = "0";
    fadeDiv.style.transition = "opacity 3s ease-in";
    fadeDiv.style.zIndex = "9999";
    fadeDiv.style.pointerEvents = "none";
    document.body.appendChild(fadeDiv);

    setTimeout(() => {
      const fade = document.getElementById("boss-fade-out");
      if (fade) fade.style.opacity = "1";
    }, 500);

    let targetRot = this.mesh.rotation.x - Math.PI / 2;
    let animObs = this.scene.onBeforeRenderObservable.add(() => {
      if (!this.mesh) return;
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      this.mesh.rotation.x += (targetRot - this.mesh.rotation.x) * dt * 3;

      this.mesh.getChildMeshes().forEach(c => {
        if (c.material) {
          if (c.material.emissiveColor) {
            c.material.emissiveColor = c.material.emissiveColor.scale(0.9);
          }
          if (c.material.diffuseColor) {
            c.material.diffuseColor = c.material.diffuseColor.scale(0.9);
          }
        }
      });
    });

    if (this.player && this.player.hud && typeof this.player.hud.addKill === 'function') {
      const killPos = this.mesh ? this.mesh.getAbsolutePosition().clone() : null;
      this.player.hud.addKill(killPos);
    }

    setTimeout(() => {
      if (this.scene) this.scene.onBeforeRenderObservable.remove(animObs);

      if (this.scene && this.scene.enemies) {
        const index = this.scene.enemies.indexOf(this);
        if (index !== -1) {
          this.scene.enemies.splice(index, 1);
        }
      }
    }, 4000);
  }

  update() {
    if (this.scene.isPaused || this.isDead) return;

    const dt = this.scene.getEngine().getDeltaTime() / 1000;

    if (this.mesh.position.y < -50) {
      this.die();
      if (this.player && this.player.hud) {
        this.player.hud.hideBossHealthBar();
      }
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    if (this.player && this.player.mesh) {
      if (this.attackCooldown <= 0 && this.mesh.intersectsMesh(this.player.mesh, false)) {
        if (typeof this.player.takeDamage === "function") {
          this.player.takeDamage(this.damage);
          this.attackCooldown = this.attackCooldownMax;
          this.attackAnimTimer = 0.3;
          SoundManager.play('enemyAttack');
        }
      }
    }

    if (this.attackAnimTimer > 0 && this.bossState === "WANDER") {
      this.attackAnimTimer -= dt;
      this.arms.forEach(arm => {
        arm.rotation.x = -Math.PI / 2;
      });
    }

    this.stateTimer -= dt;

    if (this.bossState === "WANDER") {
      this.laserMesh.isVisible = false;

      if (this.player && this.player.mesh) {
        const direction = this.player.mesh.position.subtract(this.mesh.position);
        direction.y = 0;
        direction.normalize();

        const move = direction.scale(this.speed * dt);
        move.y = -9.81 * dt;
        this.mesh.moveWithCollisions(move);

        const targetRotation = this.mesh.position.add(direction);
        this.mesh.lookAt(targetRotation);
      }

      if (this.attackAnimTimer <= 0) {
        this.arms.forEach(arm => {
          arm.rotation.x = arm.rotation.x * 0.9;
        });
      }

      if (this.stateTimer <= 0) {
        this.bossState = "PREPARE_LASER";
        this.stateTimer = 2.0;
      }
    } else if (this.bossState === "PREPARE_LASER") {
      const move = new Vector3(0, -9.81 * dt, 0);
      this.mesh.moveWithCollisions(move);

      this.arms.forEach(arm => {
        arm.rotation.x = arm.rotation.x + (-Math.PI / 2 - arm.rotation.x) * dt * 5;
      });

      this.laserMesh.isVisible = true;
      this.laserMesh.scaling = new Vector3(0.2, 1, 0.2);
      this.laserMesh.material.alpha = 0.5;
      this.laserMesh.material.emissiveColor = new Color3(1, 0, 0);

      if (this.stateTimer <= 0) {
        this.bossState = "SHOOT_LASER";
        this.stateTimer = 1.5;
        this.laserDamageTimer = 0;
        SoundManager.play('laser');
      }
    } else if (this.bossState === "SHOOT_LASER") {
      const move = new Vector3(0, -9.81 * dt, 0);
      this.mesh.moveWithCollisions(move);
      this.arms.forEach(arm => {
        arm.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.2;
      });

      this.laserMesh.isVisible = true;
      this.laserMesh.scaling = new Vector3(2, 1, 2);
      this.laserMesh.material.alpha = 1.0;
      this.laserMesh.material.emissiveColor = new Color3(1, 0.2, 0.2);

      this.laserDamageTimer -= dt;
      if (this.laserDamageTimer <= 0) {
        const playerPos = this.player.mesh.getAbsolutePosition();
        const bossPos = this.mesh.getAbsolutePosition();
        const toPlayer = playerPos.subtract(bossPos);
        const bossForward = this.mesh.forward;

        const dot = Vector3.Dot(toPlayer.normalize(), bossForward);

        if (dot > 0 && this.laserMesh.intersectsMesh(this.player.mesh, true)) {
          if (typeof this.player.takeDamage === "function") {
            this.player.takeDamage(30);
            this.laserDamageTimer = 0.3;
          }
        }
      }

      if (this.stateTimer <= 0) {
        this.bossState = "WANDER";
        this.stateTimer = 6.0;
      }
    }
  }
}
