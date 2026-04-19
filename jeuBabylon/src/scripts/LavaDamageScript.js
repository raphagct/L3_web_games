import { Mesh, Vector3 } from "@babylonjs/core";

export default class LavaDamageScript {

    constructor(mesh) {
        this.mesh = mesh;
        this._damageCooldown = 0;
        this._DAMAGE_PER_HIT = 8;
        this._DAMAGE_INTERVAL = 0.5;
        this._DETECTION_RADIUS = 2.5;
        this._DETECTION_Y_ABOVE = 1.5;
    }

    _checkLavaCollision(pos, meshObj) {
        const lavaPos = this.mesh.getAbsolutePosition();
        const dx = pos.x - lavaPos.x;
        const dz = pos.z - lavaPos.z;
        const distH = Math.sqrt(dx * dx + dz * dz);

        const feetY = pos.y - 1.0;
        const lavaTopY = lavaPos.y + 0.1;

        return this.mesh.intersectsMesh(meshObj, false)
            || (distH < this._DETECTION_RADIUS && feetY <= lavaTopY + this._DETECTION_Y_ABOVE);
    }

    onStart() {
        const scene = this.mesh.getScene();

        scene.onBeforeRenderObservable.add(() => {
            const dt = scene.getEngine().getDeltaTime() / 1000;

            if (this._damageCooldown > 0) {
                this._damageCooldown -= dt;
                return;
            }

            let hitSomething = false;

            const player = scene.player;
            if (player && player.mesh && !player.isDead) {
                if (this._checkLavaCollision(player.mesh.getAbsolutePosition(), player.mesh)) {
                    player.takeDamage(this._DAMAGE_PER_HIT);
                    hitSomething = true;
                }
            }

            if (scene.enemies) {
                for (const enemy of scene.enemies) {
                    if (!enemy.isDead) {
                        if (this._checkLavaCollision(enemy.mesh.getAbsolutePosition(), enemy.mesh)) {
                            enemy.takeDamage(this._DAMAGE_PER_HIT);
                            hitSomething = true;
                        }
                    }
                }
            }

            if (hitSomething) {
                this._damageCooldown = this._DAMAGE_INTERVAL;
            }
        });
    }
}

