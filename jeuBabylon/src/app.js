import * as BABYLON from "@babylonjs/core";

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
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);

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

    //TODO: on charge les assets
    const environment = new Environment(scene);
    this.environment = environment;
    await this.environment.load(); //environment
    await this.loadCharacterAssets(scene);
  }

  async initializeGameAsync(scene) {
    //temporary light to light the entire scene
    let light0 = new HemisphericLight("HemiLight", new Vector3(0, 1, 0), scene);

    const light = new PointLight("sparklight", new Vector3(0, 0, 0), scene);
    light.diffuse = new Color3(
      0.08627450980392157,
      0.10980392156862745,
      0.15294117647058825,
    );
    light.intensity = 35;
    light.radius = 1;

    const shadowGenerator = new ShadowGenerator(1024, light);
    shadowGenerator.darkness = 0.4;

    //Create the player
    this.player = new Player(this.assets, scene, shadowGenerator); //dont have inputs yet so we dont need to pass it in
  }

  async loadCharacterAssets(scene) {
    async function loadCharacter() {
      //collision mesh
      const outer = MeshBuilder.CreateBox(
        "outer",
        { width: 2, depth: 1, height: 3 },
        scene,
      );
      outer.isVisible = false;
      outer.isPickable = false;
      outer.checkCollisions = true;

      //move origin of box collider to the bottom of the mesh (to match player mesh)
      outer.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0));

      //for collisions
      outer.ellipsoid = new Vector3(1, 1.5, 1);
      outer.ellipsoidOffset = new Vector3(0, 1.5, 0);

      outer.rotationQuaternion = new Quaternion(0, 1, 0, 0); // rotate the player mesh 180 since we want to see the back of the player

      const box = MeshBuilder.CreateBox(
        "Small1",
        {
          width: 0.5,
          depth: 0.5,
          height: 0.25,
          faceColors: [
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
            new Color4(0, 0, 0, 1),
          ],
        },
        scene,
      );
      box.position.y = 1.5;
      box.position.z = 1;

      const body = Mesh.CreateCylinder("body", 3, 2, 2, 0, 0, scene);
      const bodymtl = new StandardMaterial("red", scene);
      bodymtl.diffuseColor = new Color3(0.8, 0.5, 0.5);
      body.material = bodymtl;
      body.isPickable = false;
      body.bakeTransformIntoVertices(Matrix.Translation(0, 1.5, 0)); // simulates the imported mesh's origin

      //parent the meshes
      box.parent = body;
      body.parent = outer;

      return {
        mesh,
      };
    }
    return loadCharacter().then((assets) => {
      this.assets = assets;
    });
  }

  async goToGame() {
    //--SETUP SCENE--
    this.scene.detachControl();
    let scene = this.gamescene;
    scene.clearColor = new Color4(
      0.01568627450980392,
      0.01568627450980392,
      0.20392156862745098,
    ); // a color that fit the overall color scheme better
    let camera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene,
    );
    camera.setTarget(Vector3.Zero());

    //--GUI--
    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    //dont detect any inputs from this ui while the game is loading
    scene.detachControl();

    //create a simple button
    const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
    loseBtn.width = 0.2;
    loseBtn.height = "40px";
    loseBtn.color = "white";
    loseBtn.top = "-14px";
    loseBtn.thickness = 0;
    loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    playerUI.addControl(loseBtn);

    //this handles interactions with the start button attached to the scene
    loseBtn.onPointerDownObservable.add(() => {
      this.goToLose();
      scene.detachControl(); //observables disabled
    });

    this._input = new PlayerInput(scene);

    //temporary scene objects
    let light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    let sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);

    await this.initializeGameAsync(scene);

    //--WHEN SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    //get rid of start scene, switch to gamescene and change states
    this.scene.dispose();
    this.state = State.GAME;
    this.scene = scene;
    this.engine.hideLoadingUI();
    //the game is ready, attach control back
    this.scene.attachControl();
  }

  async goToStart() {
    this.engine.displayLoadingUI(); // on affiche un chargement le temps que la scene charge
    this.scene.detachControl();
    let scene = new Scene(this.engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());
    this.scene.dispose();
    this.scene = scene;
    this.state = State.START;

    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    guiMenu.idealHeight = 720; //fit our fullscreen ui to this height

    //create a simple button
    const startBtn = Button.CreateSimpleButton("start", "PLAY");
    startBtn.width = 0.2;
    startBtn.height = "40px";
    startBtn.color = "white";
    startBtn.top = "-14px";
    startBtn.thickness = 0;
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiMenu.addControl(startBtn);

    //this handles interactions with the start button attached to the scene
    startBtn.onPointerDownObservable.add(() => {
      this.goToCutScene();
      scene.detachControl(); //observables disabled
    });

    await scene.whenReadyAsync();
    this.engine.hideLoadingUI();
    //lastly set the current state to the start state and set the scene to the start scene
    this.scene.dispose();
    this.scene = scene;
    this.state = State.START;
  }

  async goToCutScene() {
    this.engine.displayLoadingUI();
    //--SETUP SCENE--
    //dont detect any inputs from this ui while the game is loading
    this.scene.detachControl();
    this.cutScene = new Scene(this.engine);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), this.cutScene);
    camera.setTarget(Vector3.Zero());
    this.cutScene.clearColor = new Color4(0, 0, 0, 1);

    //--GUI--
    const cutScene = AdvancedDynamicTexture.CreateFullscreenUI("cutscene");

    //--PROGRESS DIALOGUE--
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

    //--WHEN SCENE IS FINISHED LOADING--
    await this.cutScene.whenReadyAsync();
    this.engine.hideLoadingUI();
    this.scene.dispose();
    this.state = State.CUTSCENE;
    this.scene = this.cutScene;

    //--START LOADING AND SETTING UP THE GAME DURING THIS SCENE--
    let finishedLoading = false;
    await this.setUpGame().then((res) => {
      finishedLoading = true;
    });
  }

  async goToLose() {
    this.engine.displayLoadingUI();

    //--SCENE SETUP--
    this.scene.detachControl();
    let scene = new Scene(this.engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    //--GUI--
    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
    mainBtn.width = 0.2;
    mainBtn.height = "40px";
    mainBtn.color = "white";
    guiMenu.addControl(mainBtn);
    //this handles interactions with the start button attached to the scene
    mainBtn.onPointerUpObservable.add(() => {
      this.goToStart();
    });

    //--SCENE FINISHED LOADING--
    await scene.whenReadyAsync();
    this.engine.hideLoadingUI(); //when the scene is ready, hide loading
    //lastly set the current state to the lose state and set the scene to the lose scene
    this.scene.dispose();
    this.scene = scene;
    this.state = State.LOSE;
  }
}

new App();
