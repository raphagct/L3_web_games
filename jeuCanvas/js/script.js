import Fruit from "./fruit.js";

window.onload = init;

let canvas, ctx;
// alias de Matter.js 
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events;

const engine = Engine.create();
const fruits = [];
let prochainTypeFruit = null;
let prochainFruitDiv = null;

function init() {
  canvas = document.querySelector("#monCanvas");
  ctx = canvas.getContext("2d");
  prochainFruitDiv = document.querySelector(".prochainFruit");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  creeBordure();
  gererCollisions();

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

  requestAnimationFrame(startGame);
}

function startGame() {
  Engine.update(engine, 1000 / 60);

  // clear canvas et dessine la limite rouge
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawLimite(ctx);

  // on dessine chaque fruit
  fruits.forEach((f) => f.draw(ctx));

  requestAnimationFrame(startGame);
}

function getRandomFruit() {
  const tab = [
    "myrtille",
    "cerise",
    "kaki",
    "banane",
    "orange",
    "pomme",
    "kaki",
    "coco",
    "melon",
    "ananas",
    "pasteque",
  ];
  const randomIndex = Math.floor(Math.random() * tab.length);
  return tab[randomIndex];
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
prochainFruitDiv.innerHTML = `<h3>Prochain fruit :</h3>
    <div style="display: flex; align-items: center; justify-content: center;">
      <div style="width: ${attributs.radius * 2}px; height: ${attributs.radius * 2}px; background-color: ${attributs.color}; border-radius: 50%;"></div>
    </div>`;
}

function getAttributsFruit(type) {
  switch (type) {
    case "myrtille": return { radius: 20, color: "blue" };
    case "cerise": return { radius: 30, color: "darkred" };
    case "kaki": return { radius: 40, color: "green" };
    case "banane": return { radius: 50, color: "yellow" };
    case "orange": return { radius: 60, color: "orange" };
    case "pomme": return { radius: 70, color: "red" };
    case "coco": return { radius: 90, color: "brown" };
    case "melon": return { radius: 100, color: "lightgreen" };
    case "ananas": return { radius: 110, color: "gold" };
    case "pasteque": return { radius: 120, color: "darkgreen" };
    default: return { radius: 30, color: "gray" };
  }
}

function getProchainTypeFruit(typeActuel) {
  const evolution = {
    "myrtille": "cerise",
    "cerise": "kaki",
    "kaki": "banane",
    "banane": "orange",
    "orange": "pomme",
    "pomme": "coco",
    "coco": "melon",
    "melon": "ananas",
    "ananas": "pasteque",
    "pasteque": null // plus d'évolution possible apres la pastèque
  };
  return evolution[typeActuel];
}

function gererCollisions() {
  Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      // récupère les fruits en collision
      const fruit1 = fruits.find(f => f.body === pair.bodyA);
      const fruit2 = fruits.find(f => f.body === pair.bodyB);
      
      // vérif si c'est bien les mêmes fruits
      if (fruit1 && fruit2 && fruit1.type === fruit2.type) {
        const typeSuivant = getProchainTypeFruit(fruit1.type);
        
        // vérifie si c'est pas déjà une pasteque
        if (typeSuivant) {
          const x = (fruit1.body.position.x + fruit2.body.position.x) / 2;
          const y = (fruit1.body.position.y + fruit2.body.position.y) / 2;
          
          // créer le nouveau fruit
          const nouveauFruit = new Fruit(x, y, typeSuivant, engine, Bodies, Composite);
          fruits.push(nouveauFruit);
          
          // supprimer les anciens fruits
          supprimerFruit(fruit1);
          supprimerFruit(fruit2);
        }
      }
    });
  });
}

function supprimerFruit(fruit) {
  const index = fruits.indexOf(fruit);
  if (index > -1) {
    fruits.splice(index, 1);
  }
  Composite.remove(engine.world, fruit.body);
}
