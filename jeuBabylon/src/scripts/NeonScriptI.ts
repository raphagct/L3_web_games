import { Mesh, StandardMaterial, Color3, GlowLayer } from "@babylonjs/core";

export default class NeonScriptI {
    // On ajoute glowLayer dans le constructeur
    public constructor(public mesh: Mesh, private neonColor: Color3, private glowLayer: GlowLayer) { }

    public onStart(): void {
        const scene = this.mesh.getScene();

        const neonMat = new StandardMaterial("neonMaterial_" + this.mesh.name, scene);
        neonMat.emissiveColor = this.neonColor; 
        neonMat.disableLighting = true;
        this.mesh.material = neonMat;

        // On ajoute le mesh au GlowLayer fourni
        this.glowLayer.addIncludedOnlyMesh(this.mesh);
    }
}