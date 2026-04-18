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

    onStart() {
        const scene = this.mesh.getScene();

        scene.onBeforeRenderObservable.add(() => {
            const player = scene.player;
            if (!player || !player.mesh || player.isDead) return;

            const dt = scene.getEngine().getDeltaTime() / 1000;

            if (this._damageCooldown > 0) {
                this._damageCooldown -= dt;
                return;
            }

            const lavaPos   = this.mesh.getAbsolutePosition();
            const playerPos = player.mesh.getAbsolutePosition();

            const dx = playerPos.x - lavaPos.x;
            const dz = playerPos.z - lavaPos.z;
            const distH = Math.sqrt(dx * dx + dz * dz);

            const playerFeetY = playerPos.y - 1.0;
            const lavaTopY    = lavaPos.y + 0.1;

            const onLava = this.mesh.intersectsMesh(player.mesh, false)
                        || (distH < this._DETECTION_RADIUS && playerFeetY <= lavaTopY + this._DETECTION_Y_ABOVE);

            if (onLava) {
                player.takeDamage(this._DAMAGE_PER_HIT);
                this._damageCooldown = this._DAMAGE_INTERVAL;
            }
        });
    }
}

