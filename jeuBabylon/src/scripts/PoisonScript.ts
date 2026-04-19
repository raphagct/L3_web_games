import { Mesh, NodeMaterial } from "@babylonjs/core";

export default class PoisonScript {
    public constructor(public mesh: Mesh) { }

    public async onStart(): Promise<void> {
        const shaderId = "#3FU5FG#90";
        
        const nodeMaterial = await NodeMaterial.ParseFromSnippetAsync(shaderId, this.mesh.getScene());
         this.mesh.material = nodeMaterial;
    }
}