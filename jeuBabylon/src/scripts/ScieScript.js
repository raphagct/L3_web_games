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
    }

    onStart() {
        this.departX = this.mesh.position.x;
        this.departZ = this.mesh.position.z;
        
        // 1. On convertit tes degrés (ex: 45) en Radians pour Babylon.js
        const angleRadians = this.angleDegres * (Math.PI / 180);

        // 2. On tourne la scie physiquement
        this.mesh.rotation.y = angleRadians;

        const scene = this.mesh.getScene();

        scene.onBeforeRenderObservable.add(() => {
            const deltaTime = scene.getEngine().getDeltaTime() / 1000;
            this.temps += deltaTime;

            // 3. Le mouvement de base (aller-retour)
            const deplacement = Math.sin(this.temps * this.vitesse) * this.distance;
            
            // 4. Déplacement en DIAGONALE !
            // Cosinus calcule la part du mouvement sur X
            // Sinus calcule la part du mouvement sur Z
            this.mesh.position.x = this.departX + (Math.cos(angleRadians) * deplacement);
            this.mesh.position.z = this.departZ - (Math.sin(angleRadians) * deplacement); 
            // Note: Le "moins" devant le Math.sin est là car Babylon utilise un système de coordonnées inversé sur Z.
        });
    }
}