import {
  Engine,
  Scene,
  FreeCamera,
  ArcRotateCamera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  PointLight,
  MeshBuilder,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";
import { Environment } from "./environnment.js";
import { Player } from "./characterController.js";

const State = {
  START: 0,
  CUTSCENE: 1,
  GAME: 2,
  LOSE: 3,
};

export default class App {
  state = 0;
  constructor() {
    this.canvas = document.getElementById("canvas");

    //on init scene et engine
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);

    this.main();
  }

  async main() {
    await this.goToStart();

    this.engine.runRenderLoop(() => {
      switch (this.state) {
        case State.START:
          this.scene.render();
          break;
        case State.CUTSCENE:
          this.scene.render();
          break;
        case State.GAME:
          this.scene.render();
          break;
        case State.LOSE:
          this.scene.render();
          break;
        default:
          break;
      }
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  async setUpGame() {
    let scene = new Scene(this.engine);
    this.gamescene = scene;

    // Charger l'environnement (le sol)
    const environment = new Environment(scene);
    this.environment = environment;
    await this.environment.load();
  }

  async initializeGameAsync(scene) {
    // Lumière
    let light = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

    // Créer le joueur (il gère ses propres inputs et sa caméra)
    //this.player = new Player(scene);
  }

  async goToGame() {
    //--SETUP SCENE--
    this.scene.detachControl();
    let scene = this.gamescene;
    scene.clearColor = new Color4(0.01, 0.01, 0.2);

    //--GUI--
    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    scene.detachControl();

    //bouton lose pour tester
    const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
    loseBtn.width = 0.2;
    loseBtn.height = "40px";
    loseBtn.color = "white";
    loseBtn.top = "-14px";
    loseBtn.thickness = 0;
    loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    playerUI.addControl(loseBtn);

    loseBtn.onPointerDownObservable.add(() => {
      this.goToLose();
      scene.detachControl();
    });

    await this.initializeGameAsync(scene);

    //--WHEN SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this.scene.dispose();
    this.state = State.GAME;
    this.scene = scene;
    this.engine.hideLoadingUI();
    this.scene.attachControl();
  }

  async goToStart() {
    this.engine.displayLoadingUI();
    this.scene.detachControl();
    let scene = new Scene(this.engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());
    this.scene.dispose();
    this.scene = scene;
    this.state = State.START;

    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    guiMenu.idealHeight = 720;

    const startBtn = Button.CreateSimpleButton("start", "PLAY");
    startBtn.width = 0.2;
    startBtn.height = "40px";
    startBtn.color = "white";
    startBtn.top = "-14px";
    startBtn.thickness = 0;
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiMenu.addControl(startBtn);

    startBtn.onPointerDownObservable.add(() => {
      this.goToCutScene();
      scene.detachControl();
    });

    await scene.whenReadyAsync();
    this.engine.hideLoadingUI();
  }

  async goToCutScene() {
    this.engine.displayLoadingUI();
    this.scene.detachControl();
    this.cutScene = new Scene(this.engine);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this.cutScene);
    camera.setTarget(Vector3.Zero());
    this.cutScene.clearColor = new Color4(0, 0, 0, 1);

    const cutScene = AdvancedDynamicTexture.CreateFullscreenUI("cutscene");

    const next = Button.CreateSimpleButton("next", "NEXT");
    next.color = "white";
    next.thickness = 0;
    next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    next.width = "64px";
    next.height = "64px";
    next.top = "-3%";
    next.left = "-12%";
    cutScene.addControl(next);

    next.onPointerUpObservable.add(() => {
      this.goToGame();
    });

    await this.cutScene.whenReadyAsync();
    this.engine.hideLoadingUI();
    this.scene.dispose();
    this.state = State.CUTSCENE;
    this.scene = this.cutScene;

    // Charger le jeu pendant la cutscene
    await this.setUpGame();
  }

  async goToLose() {
    this.engine.displayLoadingUI();

    this.scene.detachControl();
    let scene = new Scene(this.engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
    mainBtn.width = 0.2;
    mainBtn.height = "40px";
    mainBtn.color = "white";
    guiMenu.addControl(mainBtn);

    mainBtn.onPointerUpObservable.add(() => {
      this.goToStart();
    });

    await scene.whenReadyAsync();
    this.engine.hideLoadingUI();
    this.scene.dispose();
    this.scene = scene;
    this.state = State.LOSE;
  }
}

new App();
