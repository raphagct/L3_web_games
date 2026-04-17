import { Mesh, StandardMaterial, Color3, GlowLayer } from "@babylonjs/core";

export default class NeonScript {
    public constructor(public mesh: Mesh, private neonColor: Color3) { }

    public onStart(): void {
        const scene = this.mesh.getScene();

        const neonMat = new StandardMaterial("neonMaterial_" + this.mesh.name, scene);
        neonMat.emissiveColor = this.neonColor; // ✅ Utilise la couleur passée en paramètre
        neonMat.disableLighting = true;

        this.mesh.material = neonMat;

        let glowLayer = scene.effectLayers.find(layer => layer.name === "neonGlow") as GlowLayer;
        if (!glowLayer) {
            glowLayer = new GlowLayer("neonGlow", scene);
            glowLayer.intensity = 0.2;
        }
    }
}