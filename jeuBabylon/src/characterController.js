import {
  TransformNode,
  ShadowGenerator,
  Scene,
  Mesh,
  UniversalCamera,
  ArcRotateCamera,
  Vector3,
} from "@babylonjs/core";

export class Player extends TransformNode {
  static PLAYER_SPEED = 0.45;
  static JUMP_FORCE = 0.8;
  static GRAVITY = -2.8;
  static ORIGINAL_TILT = new Vector3(0.5934119456780721, 0, 0);

  //player movement vars
  deltaTime = 0;
  moveDirection = new Vector3();

  //gravity, ground detection, jumping
  gravity = new Vector3();
  lastGroundPos = Vector3.Zero(); // keep track of the last grounded positio

  constructor(assets, scene, shadowGenerator, input) {
    super("player", scene);
    this.scene = scene;
    this.setupPlayerCamera();

    this.mesh = assets.mesh;
    this.mesh.parent = this;

    shadowGenerator.addShadowCaster(assets.mesh); //the player mesh will cast shadows

    this.input = input; //inputs we will get from inputController.ts
  }

  updateFromControls() {
    this.deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

    this.moveDirection = Vector3.Zero(); // vector that holds movement information
    this.h = this.input.horizontal; //x-axis
    this.v = this.input.vertical; //z-axis

    //--MOVEMENTS BASED ON CAMERA (as it rotates)--
    let fwd = this.camRoot.forward;
    let right = this.camRoot.right;
    let correctedVertical = fwd.scaleInPlace(this.v);
    let correctedHorizontal = right.scaleInPlace(this.h);

    //movement based off of camera's view
    let move = correctedHorizontal.addInPlace(correctedVertical);

    //clear y so that the character doesnt fly up, normalize for next step
    this.moveDirection = new Vector3(move.normalize().x, 0, move.normalize().z);

    //clamp the input value so that diagonal movement isn't twice as fast
    let inputMag = Math.abs(this.h) + Math.abs(this.v);
    if (inputMag < 0) {
      this.inputAmt = 0;
    } else if (inputMag > 1) {
      this.inputAmt = 1;
    } else {
      this.inputAmt = inputMag;
    }

    //final movement that takes into consideration the inputs
    this.moveDirection = this.moveDirection.scaleInPlace(
      this.inputAmt * Player.PLAYER_SPEED,
    );

    //Rotations
    //check if there is movement to determine if rotation is needed
    let input = new Vector3(
      this.input.horizontalAxis,
      0,
      this.input.verticalAxis,
    ); //along which axis is the direction
    if (input.length() == 0) {
      //if there's no input detected, prevent rotation and keep player in same rotation
      return;
    }
    //rotation based on input & the camera angle
    let angle = Math.atan2(this.input.horizontalAxis, this.input.verticalAxis);
    angle += this.camRoot.rotation.y;
    let targ = Quaternion.FromEulerAngles(0, angle, 0);
    this.mesh.rotationQuaternion = Quaternion.Slerp(
      this.mesh.rotationQuaternion,
      targ,
      10 * this.deltaTime,
    );
  }

  floorRaycast(offsetx, offsetz, raycastlen) {
    let raycastFloorPos = new Vector3(
      this.mesh.position.x + offsetx,
      this.mesh.position.y + 0.5,
      this.mesh.position.z + offsetz,
    );
    let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

    let predicate = function (mesh) {
      return mesh.isPickable && mesh.isEnabled();
    };
    let pick = this.scene.pickWithRay(ray, predicate);

    if (pick.hit) {
      return pick.pickedPoint;
    } else {
      return Vector3.Zero();
    }
  }

  isGrounded() {
    if (this.floorRaycast(0, 0, 0.6).equals(Vector3.Zero())) {
      return false;
    } else {
      return true;
    }
  }

  updateGroundDetection() {
    if (!this.isGrounded()) {
      this.gravity = this.gravity.addInPlace(
        Vector3.Up().scale(this.deltaTime * Player.GRAVITY),
      );
      this.grounded = false;
    }
    //limit the speed of gravity to the negative of the jump power
    if (this.gravity.y < -Player.JUMP_FORCE) {
      this.gravity.y = -Player.JUMP_FORCE;
    }
    this.mesh.moveWithCollisions(this.moveDirection.addInPlace(this.gravity));

    if (this.isGrounded()) {
      this.gravity.y = 0;
      this.grounded = true;
      this.lastGroundPos.copyFrom(this.mesh.position);
    }
  }

  beforeRenderUpdate() {
    this.updateFromControls();
    this.updateGroundDetection();
  }

  activatePlayerCamera() {
    this.scene.registerBeforeRender(() => {
      this.beforeRenderUpdate();
      this.updateCamera();
    });
    return this.camera;
  }

  setupPlayerCamera() {
    //root camera parent that handles positioning of the camera to follow the player
    this.camRoot = new TransformNode("root");
    this.camRoot.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
    //to face the player from behind (180 degrees)
    this.camRoot.rotation = new Vector3(0, Math.PI, 0);

    //rotations along the x-axis (up/down tilting)
    let yTilt = new TransformNode("ytilt");
    //adjustments to camera view to point down at our player
    yTilt.rotation = Player.ORIGINAL_TILT;
    this.yTilt = yTilt;
    yTilt.parent = this.camRoot;

    //our actual camera that's pointing at our root's position
    this.camera = new UniversalCamera(
      "cam",
      new Vector3(0, 0, -30),
      this.scene,
    );
    this.camera.lockedTarget = this.camRoot.position;
    this.camera.fov = 0.47350045992678597;
    this.camera.parent = yTilt;

    this.scene.activeCamera = this.camera;
    return this.camera;
  }

  updateCamera() {
    let centerPlayer = this.mesh.position.y + 2;
    this.camRoot.position = Vector3.Lerp(
      this.camRoot.position,
      new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z),
      0.4,
    );
  }
}
