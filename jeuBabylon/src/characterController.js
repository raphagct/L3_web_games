import * as BABYLON from "@babylonjs/core";

export class Player extends TransformNode {
    camera;
    input;
    constructor(assets, scene, shadowGenerator, input) {
        super("player", scene);
        this.scene = scene;
        this.setupPlayerCamera();

        this.mesh = assets.mesh;
        this.mesh.parent = this;

        shadowGenerator.addShadowCaster(assets.mesh); //the player mesh will cast shadows

        this.input = input; //inputs we will get from inputController.js
    }

   setupPlayerCamera() {
    this.camera = new BABYLON.ArcRotateCamera("arc", -Math.PI/2, Math.PI/2, 40, new BABYLON.Vector3(0,3,0), this.scene);
}
}