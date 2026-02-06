import Fruit from "./fruit.js";
import { evolutionFruits } from "./collision.js";
import { getRandomFruit, getAttributsFruit } from "./fruitUtils.js";

window.onload = init;

let canvas, ctx;
let score = 0;
let prochainTypeFruit;
let etat = "MENU ACCUEIL";
let mouseX = 0;

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
  mouseX = canvas.width / 2;

  creeBordure();
  evolutionFruits(Events, fruits, engine, Bodies, Composite, score);

  prochainTypeFruit = getRandomFruit();
  afficherProchainFruit();

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
  });

  canvas.addEventListener("click", (event) => {
    const x = mouseX;
    const fruit = new Fruit(x, 40, prochainTypeFruit, engine, Bodies, Composite);
    fruits.push(fruit);

    prochainTypeFruit = getRandomFruit();
    afficherProchainFruit();
  });

  requestAnimationFrame(startGame);
}

function startGame() {
  Engine.update(engine, 1000 / 60);
  if (etat === "MENU ACCUEIL") {
    drawMenuAccueil();
  } else if (etat === "JEU EN COURS") {
    drawJeu();
  } else if (etat === "GAME OVER") {
    drawGameOver();
  }

  requestAnimationFrame(startGame);
}

function drawMenuAccueil() {
  // Bonne pratique : dès qu'on change l'état du contexte graphique
  // ex: on change la couleur, la police, l'épaisseur du trait, la position
  // du repère etc. on sauvegarde l'état précédent avec ctx.save()
  ctx.save();

  ctx.fillStyle = "black";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Bienvenue dans le Jeu!",
    canvas.width / 2,
    canvas.height / 2 - 50,
  );
  ctx.font = "24px Arial";
  ctx.fillText(
    "Appuyez sur une touche pour commencer",
    canvas.width / 2,
    canvas.height / 2 + 20,
  );
  // On écoute les touches pour démarrer le jeu
  window.onkeydown = (event) => {
    etat = "JEU EN COURS";
    window.onkeydown = null; // on enlève l'écouteur pour ne pas redémarrer le jeu
  };

  // Si on a fait ctx.save(). .. on doit faire ctx.restore() à la fin
  ctx.restore();
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

  if (etat === "JEU EN COURS") {
    const attributs = getAttributsFruit(prochainTypeFruit);

    // Dessine la ligne de visée
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(mouseX, 40 + attributs.radius);
    ctx.lineTo(mouseX, canvas.height);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = attributs.color;
    // ajout d'un effet de transparence pour que le fruit semble fantomatique et donc pas encore en jeu
    ctx.globalAlpha = 0.7; 
    ctx.beginPath();
    ctx.arc(mouseX, 40, attributs.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  const attributs = getAttributsFruit(prochainTypeFruit);
  const prochainFruitDiv = document.querySelector(".prochainFruit");
  prochainFruitDiv.innerHTML = `<h3>Prochain fruit :</h3>
    <div style="display: flex; align-items: center; justify-content: center;">
      <div style="width: ${attributs.radius * 2}px; height: ${attributs.radius * 2}px; background-color: ${attributs.color}; border-radius: 50%;"></div>
    </div>`;
}
