import Game from "./Game.js";

window.onload = init;

async function init() {
  let canvas = document.querySelector("#monCanvas");

  let game = new Game(canvas);

  await game.init();

  game.start();
}
