import Fruit from "./fruit.js";
import { gererEvolutionFruits } from "./collision.js";
import { getRandomFruit, getRadiusFruit } from "./fruitUtils.js";
import { assetsToLoad, etat, niveau } from "./model.js";
import { loadAssets } from "./assetLoader.js";

window.onload = init;

let canvas, ctx, loadedAssets;
let prochainTypeFruit, prochainTypeFruitImg;
let etatJeu = etat.ACCUEIL;
let niveauJeu = niveau.LEVEL1;

// alias de Matter.js
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events;

// on crée le moteur physique
const engine = Engine.create();
const fruits = [];

async function init() {
  canvas = document.querySelector("#monCanvas");
  ctx = canvas.getContext("2d");

  // on charge les assets avant de lancer le jeu
  loadedAssets = await loadAssets(assetsToLoad);

  creeBordure();
  gererEvolutionFruits(Events, fruits, engine, Bodies, Composite, loadedAssets);

  prochainTypeFruit = getRandomFruit();
  prochainTypeFruitImg = assetsToLoad[prochainTypeFruit].url;
  afficherProchainFruit();

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    // Convertir les coordonnées du clic (client) en coordonnées du canvas
    // (le canvas peut être redimensionné en CSS, il faut tenir compte du ratio)
    const scaleX = canvas.width / rect.width; // ratio entre pixels canvas et pixels CSS
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const fruitImage = loadedAssets[prochainTypeFruit];
    const fruit = new Fruit(
      x,
      y,
      engine,
      Bodies,
      Composite,
      prochainTypeFruit,
      fruitImage,
    );
    fruits.push(fruit);

    prochainTypeFruit = getRandomFruit();
    prochainTypeFruitImg = assetsToLoad[prochainTypeFruit].url;
    afficherProchainFruit();
  });

  const boutonJouer = document.getElementById("boutonJouer");
  if (boutonJouer) {
    boutonJouer.addEventListener("click", () => {
      document.body.classList.add("playing");
      etatJeu = etat.JEU_EN_COURS;
    });
  }

  requestAnimationFrame(startGame);
}

function startGame() {
  Engine.update(engine, 1000 / 60);
  if (etatJeu === etat.JEU_EN_COURS) {
    drawJeu();
  } else if (etatJeu === etat.GAME_OVER) {
    drawGameOver();
  }

  requestAnimationFrame(startGame);
}

function drawJeu() {
  // clear canvas et dessine la limite rouge
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLimite(ctx);

  // on dessine chaque fruit
  fruits.forEach((f) => f.draw(ctx));
}

function drawLimite(ctx) {
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.moveTo(0, 80);
  ctx.lineTo(ctx.canvas.width, 80);
  ctx.stroke();
}

function creeBordure() {
  const ground = Bodies.rectangle(
    ctx.canvas.width / 2,
    ctx.canvas.height + 50,
    ctx.canvas.width,
    100,
    { isStatic: true },
  );
  const leftWall = Bodies.rectangle(
    -50,
    ctx.canvas.height / 2,
    100,
    ctx.canvas.height,
    { isStatic: true },
  );
  const rightWall = Bodies.rectangle(
    ctx.canvas.width + 50,
    ctx.canvas.height / 2,
    100,
    ctx.canvas.height,
    { isStatic: true },
  );
  Composite.add(engine.world, [ground, leftWall, rightWall]);
}

function afficherProchainFruit() {
  const radiusFruit = getRadiusFruit(prochainTypeFruit);
  const container = document.querySelector(".next-fruit-circle");

  const fruitDiv = document.createElement("img");
  fruitDiv.src = prochainTypeFruitImg;
  fruitDiv.style.width = `${radiusFruit * 2.5}px`;
  fruitDiv.style.height = `${radiusFruit * 2.5}px`;
  fruitDiv.style.borderRadius = "50%";

  container.innerHTML = "";
  container.appendChild(fruitDiv);
}

/** 
function drawGameOver() {
  ctx.save();

  ctx.fillStyle = "red";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);
  ctx.font = "24px Arial";
  ctx.fillText(
    "Appuyez sur une touche pour rejouer",
    canvas.width / 2,
    canvas.height / 2 + 20,
  );

  // On écoute les touches pour redémarrer le jeu
  window.onkeydown = (event) => {
    etatJeu = etatJeu.JEU_EN_COURS;
    // assure que le menu HTML disparaisse aussi
    document.body.classList.add("playing");
    window.onkeydown = null; // on enlève l'écouteur pour ne pas redémarrer le jeu
  };

  ctx.restore();
}
*/
