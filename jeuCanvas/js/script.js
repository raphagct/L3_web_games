import Fruit from "./fruit.js";
import { gererEvolutionFruits, gererGameOver } from "./collision.js";
import { getRandomFruit, getRadiusFruit, getHighScore, updateHighScoreDisplay, resetScore } from "./fruitUtils.js";
import { assetsToLoad, etat, niveau } from "./model.js";
import { loadAssets } from "./assetLoader.js";
import BorduresJeu from "./borduresjeu.js";
import FusionEffect from "./effect.js";

window.onload = init;

let canvas, ctx, loadedAssets, prochainTypeFruit, prochainTypeFruitImgSrc;
let etatJeu = etat.ACCUEIL;
let niveauJeu = niveau.LEVEL1;
let score = 0;
let mouseX = 0;
let borduresJeu;
let canDrop = true;
const delaiDrop = 700;

// alias de Matter.js
const Engine = Matter.Engine,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Events = Matter.Events;

// on crée le moteur physique
const engine = Matter.Engine.create();
const fruits = [];
const effects = [];

async function init() {
  canvas = document.querySelector("#monCanvas");
  ctx = canvas.getContext("2d");
  mouseX = canvas.width / 2;

  // on charge les assets avant de lancer le jeu
  loadedAssets = await loadAssets(assetsToLoad);

  // On crée la map et le capteur 
  borduresJeu = new BorduresJeu(engine, canvas.width, canvas.height);
  borduresJeu.creeBordures();
  const capteur = borduresJeu.creeCapteur();
  
  // on init le syteme d'evolution par collision entre fruit du même type

  gererEvolutionFruits(
    fruits,
    engine,
    loadedAssets,
    (typeFruitCree) => {
      // Callback appelé quand deux fruits fusionnent
      if (typeFruitCree === niveauJeu) {
        // Niveau terminé !
        if (niveauJeu === niveau.LEVEL1) {
          niveauJeu = niveau.LEVEL2;
          etatJeu = etat.NEXT_LEVEL;
        } else if (niveauJeu === niveau.LEVEL2) {
          niveauJeu = niveau.LEVEL3;
          etatJeu = etat.NEXT_LEVEL;
        } else if (niveauJeu === niveau.LEVEL3) {
          niveauJeu = niveau.FIN;
          etatJeu = etat.NEXT_LEVEL;
        }
      }
    },
    effects,
  );
  gererGameOver(engine, capteur, () => {
    etatJeu = etat.GAME_OVER;
  });
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
    if (!canDrop) return;
    canDrop = false;
    setTimeout(() => {
      canDrop = true;
    }, delaiDrop);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (event.clientX - rect.left) * scaleX;

    const x = mouseX;
    const fruitImage = loadedAssets[prochainTypeFruit];
    const fruit = new Fruit(
      x,
      40,
      engine,
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
  Matter.Engine.update(engine, 1000 / 60);
  if (etatJeu === etat.JEU_EN_COURS) {
    drawJeu();
  } else if (etatJeu === etat.GAME_OVER) {
    drawGameOver();
  } else if (etatJeu === etat.NEXT_LEVEL) {
    drawNextLevel();
  }
  
  requestAnimationFrame(startGame);
}

function drawJeu() {
  // clear canvas et dessine la limite rouge
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  borduresJeu.drawLimit(ctx);

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

  if (etatJeu === etat.JEU_EN_COURS && canDrop) {
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

function drawNextLevel() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "green";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  
  if (niveauJeu === niveau.FIN) {
    ctx.fillText(
      "Bravo vous avez fini le jeu !",
      canvas.width / 2,
      canvas.height / 2,
    );
    ctx.font = "24px Arial";
    ctx.fillText(
      "Appuyez sur une touche pour recommencer",
      canvas.width / 2,
      canvas.height / 2 + 50,
    );
     // On écoute les touches pour redémarrer le jeu complet
     window.onkeydown = (event) => {
        niveauJeu = niveau.LEVEL1;
        etatJeu = etat.JEU_EN_COURS;
        score = 0;
        resetScore();
        fruits.forEach((f) => Matter.Composite.remove(engine.world, f.body));
        fruits.length = 0;
        document.body.classList.add("playing");
        window.onkeydown = null;
      };

  } else {
    // Affiche le niveau suivant
    ctx.fillText("Niveau Terminé !", canvas.width / 2, canvas.height / 2 - 50);
    ctx.font = "30px Arial";
    ctx.fillText(
        "Prochain objectif : " + niveauJeu,
        canvas.width / 2,
        canvas.height / 2,
    );
    ctx.font = "24px Arial";
    ctx.fillText(
      "Appuyez sur une touche pour continuer",
      canvas.width / 2,
      canvas.height / 2 + 50,
    );

    // On attend un clic pour continuer
    window.onkeydown = () => {
        etatJeu = etat.JEU_EN_COURS;
        score = 0;
        resetScore();
        // Clear le "rect" => Clear tous les fruits
        fruits.forEach((f) => Matter.Composite.remove(engine.world, f.body));
        fruits.length = 0;
        
        document.body.classList.add("playing");
        window.onkeydown = null;
    }
  }
  ctx.restore();
}

function drawGameOver() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    etatJeu = etat.JEU_EN_COURS;
    score = 0;
    resetScore(); // reset score in fruitUtils
    
    // Remove all fruits from the world
    fruits.forEach((f) => {
      Matter.Composite.remove(engine.world, f.body);
    });
    // Empty the array
    fruits.length = 0;

    // assure que le menu HTML disparaisse aussi
    document.body.classList.add("playing");
    window.onkeydown = null; // on enlève l'écouteur pour ne pas redémarrer le jeu
  };

  ctx.restore();
}


