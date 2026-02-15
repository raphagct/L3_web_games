import { etat } from "./model.js";
import Fruit from "./fruit.js";
import { getRandomFruit } from "./fruitUtils.js";

function initListeners(game) {
    game.canvas.addEventListener("mousemove", (event) => {
        const rect = game.canvas.getBoundingClientRect();
        const scaleX = game.width / rect.width;
        game.mouseX = (event.clientX - rect.left) * scaleX;
    });

    game.canvas.addEventListener("click", (event) => {
        gererDrop(event, game);
    });

    const boutonJouer = document.getElementById("boutonJouer");
    boutonJouer.addEventListener("click", () => {
        document.body.classList.add("playing");
        game.etatJeu = etat.JEU_EN_COURS;
    });
}

function gererDrop(event, game) {
    if (game.etatJeu !== etat.JEU_EN_COURS) return;
    if (!game.canDrop) return;

    game.canDrop = false;
    // on met du délai pour éviter le spam
    setTimeout(() => {
        game.canDrop = true;
    }, game.delaiDrop);

    const rect = game.canvas.getBoundingClientRect();
    const scaleX = game.width / rect.width;
    game.mouseX = (event.clientX - rect.left) * scaleX;

    const x = game.mouseX;
    const typeToDrop = game.fruitCourant;
    const fruitImage = game.loadedAssets[typeToDrop];

    // On crée un fruit dans le monde physique en haut du canvas
    const fruit = new Fruit(x, 40, game.engine, typeToDrop, fruitImage);
    game.fruits.push(fruit);

    // Cycle des fruits
    game.fruitCourant = game.fruitSuivant;
    game.fruitSuivant = getRandomFruit();
    game.afficherFruitSuivant();
}

export { initListeners };
