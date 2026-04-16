import { Mesh, NodeMaterial } from "@babylonjs/core";

export default class LavaScript {

    public constructor(public mesh: Mesh) { }

    public async onStart(): Promise<void> {
        const shaderId = "#PVATIY"; 
        const nodeMaterial = await NodeMaterial.ParseFromSnippetAsync(shaderId, this.mesh.getScene());
        this.mesh.material = nodeMaterial;
        
    }
}

