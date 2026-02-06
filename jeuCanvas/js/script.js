import Fruit from "./fruit.js";
import { evolutionFruits } from "./collision.js";
import { getRandomFruit, getAttributsFruit } from "./fruitUtils.js";

window.onload = init;

let canvas, ctx;
let prochainTypeFruit;
let etat = "MENU ACCUEIL";

// alias de Matter.js
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events;

const engine = Engine.create();
const fruits = [];

function init() {
  canvas = document.querySelector("#monCanvas");
  ctx = canvas.getContext("2d");

  creeBordure();
  // ne pas passer score par valeur ; collision.js utilise maintenant addScoreFruits
  evolutionFruits(Events, fruits, engine, Bodies, Composite);

  prochainTypeFruit = getRandomFruit();
  afficherProchainFruit();

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const fruit = new Fruit(x, y, prochainTypeFruit, engine, Bodies, Composite);
    fruits.push(fruit);

    prochainTypeFruit = getRandomFruit();
    afficherProchainFruit();
  });

  // bouton Jouer : masque le menu (nav) et affiche le main en jouant via z-index
  const boutonJouer = document.getElementById("boutonJouer");
  if (boutonJouer) {
    boutonJouer.addEventListener("click", () => {
      // applique la classe qui gère z-index/visibilité via CSS
      document.body.classList.add("playing");
      // passe l'état du jeu en cours
      etat = "JEU EN COURS";
    });
  }

  requestAnimationFrame(startGame);
}

function startGame() {
  Engine.update(engine, 1000 / 60);
  if (etat === "JEU EN COURS") {
    drawJeu();
  } else if (etat === "GAME OVER") {
    drawGameOver();
  }

  requestAnimationFrame(startGame);
}

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
    etat = "JEU EN COURS";
    // assure que le menu HTML disparaisse aussi
    document.body.classList.add("playing");
    window.onkeydown = null; // on enlève l'écouteur pour ne pas redémarrer le jeu
  };

  ctx.restore();
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
  const attributs = getAttributsFruit(prochainTypeFruit);
  const prochainFruitDiv = document.querySelector(".prochainFruit");
  prochainFruitDiv.innerHTML = `<h3>Prochain fruit :</h3>
    <div style="display: flex; align-items: center; justify-content: center;">
      <div style="width: ${attributs.radius * 2}px; height: ${attributs.radius * 2}px; background-color: ${attributs.color}; border-radius: 50%;"></div>
    </div>`;
}
