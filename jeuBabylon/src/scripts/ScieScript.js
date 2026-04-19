import { Mesh } from "@babylonjs/core";

export default class ScieScript {
    constructor(mesh, distance = 10, vitesse = 2, angleDegres = 0) {
        this.mesh = mesh;
        this.distance = distance;
        this.vitesse = vitesse;
        this.angleDegres = angleDegres;
        
        this.temps = 0;
        this.departX = 0;
        this.departZ = 0;
        
        this._damageCooldown = 0;
        this._DAMAGE_PER_HIT = 20;
        this._DAMAGE_INTERVAL = 0.4;
    }

    onStart() {
        this.departX = this.mesh.position.x;
        this.departZ = this.mesh.position.z;
        
        const angleRadians = this.angleDegres * (Math.PI / 180);
        this.mesh.rotation.y = angleRadians;

        const scene = this.mesh.getScene();

        scene.onBeforeRenderObservable.add(() => {
            const deltaTime = scene.getEngine().getDeltaTime() / 1000;
            this.temps += deltaTime;

            // Mouvement aller-retour
            const deplacement = Math.sin(this.temps * this.vitesse) * this.distance;
            this.mesh.position.x = this.departX + (Math.cos(angleRadians) * deplacement);
            this.mesh.position.z = this.departZ - (Math.sin(angleRadians) * deplacement);

            // Cooldown de dégâts
            if (this._damageCooldown > 0) {
                this._damageCooldown -= deltaTime;
                return;
            }

            // Lecture dynamique du joueur sur la scène
            const player = scene.player;
            if (player && player.mesh && !player.isDead) {
                if (this.mesh.intersectsMesh(player.mesh, false)) {
                    player.takeDamage(this._DAMAGE_PER_HIT);
                    this._damageCooldown = this._DAMAGE_INTERVAL;
                    return;
                }
            }

            // Lecture des ennemis
            if (scene.enemies) {
                for (const enemy of scene.enemies) {
                    if (!enemy.isDead && this.mesh.intersectsMesh(enemy.mesh, false)) {
                        enemy.takeDamage(this._DAMAGE_PER_HIT);
                        this._damageCooldown = this._DAMAGE_INTERVAL;
                        return;
                    }
                }
            }
        });
    }
}