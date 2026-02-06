import * as BABYLON from "@babylonjs/core";

export default class App {
  state = 0;
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    this.scene = new BABYLON.Scene(this.engine);
    this.camera = new BABYLON.ArcRotateCamera(
      "camera1",
      Math.PI / 2,
      Math.PI / 2.5,
      10,
      BABYLON.Vector3.Zero(),
      this.scene,
    );
    this.camera.attachControl(this.canvas, true);
    const light = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      this.scene,
    );
    light.intensity = 0.7;
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      "sphere",
      { diameter: 2, segments: 32 },
      this.scene,
    );
    sphere.position.y = 1;
    const ground = BABYLON.MeshBuilder.CreateGround(
      "ground",
      { width: 6, height: 6 },
      this.scene,
    );
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  async goToStart() {
    this.engine.displayLoadingUI();
    this.scene.detachControl();
    let scene = new BABYLON.Scene(this.engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
    let camera = new BABYLON.FreeCamera(
      "camera1",
      new BABYLON.Vector3(0, 0, 0),
      scene,
    );
    camera.setTarget(BABYLON.Vector3.Zero());
  }
}

new App();
