import { Mesh, StandardMaterial, Color3, GlowLayer } from "@babylonjs/core";

export default class NeonScript {
    public constructor(public mesh: Mesh, private neonColor: Color3, private glowLayer: GlowLayer) { }

    public onStart(): void {
        const scene = this.mesh.getScene();

        const neonMat = new StandardMaterial("neonMaterial_" + this.mesh.name, scene);
        neonMat.emissiveColor = this.neonColor; 
        neonMat.disableLighting = true;
        this.mesh.material = neonMat;

        this.glowLayer.addIncludedOnlyMesh(this.mesh);
    }
}