import Fruit from "./fruit.js";

window.onload = init;

let canvas, ctx;
// alias de Matter.js 
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite;

const engine = Engine.create();
const fruits = [];

function init() {
  canvas = document.querySelector("#monCanvas");
  ctx = canvas.getContext("2d");

  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  creeBordure();

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const fruit = new Fruit(x, y, getRandomFruit(), engine, Bodies, Composite);
    fruits.push(fruit);
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
