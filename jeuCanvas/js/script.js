import Fruit from "./fruit.js";
import { gererEvolutionFruits } from "./collision.js";
import { getRandomFruit, getRadiusFruit, getHighScore, updateHighScoreDisplay } from "./fruitUtils.js";
import { assetsToLoad, etat, niveau } from "./model.js";
import { loadAssets } from "./assetLoader.js";
import FusionEffect from "./effect.js";

window.onload = init;

let canvas, ctx, loadedAssets, prochainTypeFruit, prochainTypeFruitImgSrc;
let etatJeu = etat.ACCUEIL;
let niveauJeu = niveau.LEVEL1;
let score = 0;
let mouseX = 0;

// alias de Matter.js
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events;

// on crée le moteur physique
const engine = Engine.create();
const fruits = [];
const effects = [];

async function init() {
  canvas = document.querySelector("#monCanvas");
  ctx = canvas.getContext("2d");
  mouseX = canvas.width / 2;

  // on charge les assets avant de lancer le jeu
  loadedAssets = await loadAssets(assetsToLoad);

  // on draw les bordures et on init le syteme d'evolution
  // par collision entre fruit du même type
  creeBordure();
  gererEvolutionFruits(
    Events,
    fruits,
    engine,
    Bodies,
    Composite,
    loadedAssets,
    effects,
  );

  // On recup un fruit au hasard  et on l'affiche dans la preview 
  prochainTypeFruit = getRandomFruit();
  prochainTypeFruitImgSrc = loadedAssets[prochainTypeFruit].src;
  afficherProchainFruit();
  updateHighScoreDisplay(getHighScore());

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (event.clientX - rect.left) * scaleX;
  });


  //ecouteur pour placer un fruit
  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (event.clientX - rect.left) * scaleX;

    const x = mouseX;
    const fruitImage = loadedAssets[prochainTypeFruit];
    const fruit = new Fruit(
      x,
      40,
      engine,
      Bodies,
      Composite,
      prochainTypeFruit,
      fruitImage,
    );
    fruits.push(fruit);

    prochainTypeFruit = getRandomFruit();
    prochainTypeFruitImgSrc = loadedAssets[prochainTypeFruit].src;
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

  // on dessine et met à jour les effets
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.update();
    effect.draw(ctx);
    if (effect.isFinished()) {
      effects.splice(i, 1);
    }
  }

  if (etatJeu === etat.JEU_EN_COURS) {
    const radius = getRadiusFruit(prochainTypeFruit);
    // Le fruit a un rayon d'affichage plus grand que son corps physique (1.4x)
    // On reprend la logique de Fruit.draw pour que le fantôme ait la meme taille
    const hitboxDiff = 1.4;
    const drawRadius = radius * hitboxDiff;
    const img = loadedAssets[prochainTypeFruit];

    // Dessine la ligne de visée
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(mouseX, 40 + drawRadius);
    ctx.lineTo(mouseX, canvas.height);
    ctx.stroke();
    ctx.restore();

    // Dessine le fruit fantôme avec transparence
    if (img) {
      ctx.save();
      ctx.globalAlpha = 0.5; 
      ctx.translate(mouseX, 40);
      ctx.drawImage(
        img,
        -drawRadius,
        -drawRadius,
        drawRadius * 2,
        drawRadius * 2,
      );
      ctx.restore();
    }
  }
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
  fruitDiv.src = prochainTypeFruitImgSrc;
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
