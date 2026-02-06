import * as BABYLON from "@babylonjs/core";

// main.js utilise le global `BABYLON` fourni par le CDN (babylon.js)
// 1. Récupérer le canvas HTML
const canvas = document.getElementById("canvas");

// 2. Initialiser le moteur Babylon
const engine = new BABYLON.Engine(canvas, true);

// 3. Fonction pour créer la scène
const createScene = function () {
  const scene = new BABYLON.Scene(engine);

  // CAMERA : Une caméra qui tourne autour du centre (ArcRotate)
  // Paramètres : Alpha, Beta, Radius, Target, Scene
  const camera = new BABYLON.ArcRotateCamera(
    "camera1",
    Math.PI / 2,
    Math.PI / 2.5,
    10,
    BABYLON.Vector3.Zero(),
    scene,
  );

  // On attache la caméra au canvas pour pouvoir bouger avec la souris
  camera.attachControl(canvas, true);

  // LUMIÈRE : Une lumière hémisphérique (ambiance générale)
  const light = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  light.intensity = 0.7;

  // OBJET 1 : Une sphère
  const sphere = BABYLON.MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 2, segments: 32 },
    scene,
  );
  // On la monte un peu (y = 1) pour qu'elle soit posée sur le sol
  sphere.position.y = 1;

  // OBJET 2 : Le sol
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 6, height: 6 },
    scene,
  );

  return scene;
};

// 4. Appel de la fonction
const scene = createScene();

// 5. La boucle de rendu (C'est ce qui fait tourner le jeu 60 fois par seconde)
engine.runRenderLoop(function () {
  scene.render();
});

// 6. Gérer le redimensionnement de la fenêtre
window.addEventListener("resize", function () {
  engine.resize();
});
