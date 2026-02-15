import {
  getProchainTypeFruit,
  supprimerFruit,
  getNbPointsPourFruit,
  getRadiusFruit,
} from "./fruitUtils.js";
import Fruit from "./fruit.js";
import EffetEvolution from "./effet.js";

let gameOverDetecte = false;

function gererEvolutionFruits(
  fruits,
  engine,
  loadedAssets,
  effets,
  game
) {
  // On détect les collisions au premier choc avec collisionStart
  Matter.Events.on(engine, "collisionStart", (event) => {
    const pairs = event.pairs;

    // on recup les fruits en collision
    pairs.forEach((pair) => {
      const fruit1 = fruits.find((f) => f.body === pair.bodyA);
      const fruit2 = fruits.find((f) => f.body === pair.bodyB);

      // vérif si c'est des fruits du même type
      if (fruit1 && fruit2 && fruit1.type === fruit2.type) {
        const typeSuivant = getProchainTypeFruit(fruit1.type);

        // vérif si c'est pas déjà une pasteque
        if (typeSuivant) {
          const x = (fruit1.body.position.x + fruit2.body.position.x) / 2;
          const y = (fruit1.body.position.y + fruit2.body.position.y) / 2;

          // Calcule le nouveau rayon basé sur le type du fruit suivant
          const newRadius = getRadiusFruit(typeSuivant);

          // créer le nouveau fruit
          const nouveauFruit = new Fruit(
            x,
            y,
            engine,
            typeSuivant,
            loadedAssets[typeSuivant],
            newRadius,
          );
          fruits.push(nouveauFruit);

          // on supprime les anciens fruits
          supprimerFruit(fruit1, engine, fruits);
          supprimerFruit(fruit2, engine, fruits);

          // on joue le bruit du plop
          loadedAssets.plop.play();

          // on met à jour le score et on vérif le niveau
          game.addScore(getNbPointsPourFruit(typeSuivant));
          if (typeSuivant === game.niveauJeu) {
            game.monterDeNiveau();
          }

          // on ajoute l'animation de particules
          effets.push(new EffetEvolution(x, y, newRadius, "#FFD700"));

          console.log("fruit fusionné");
        }
      }
    });
  });
}


function gererGameOver(engine, sensor) {
  let gameOverFrameCount = 0;

  // On détecte les collisions au contact constant avec collisionActive
  Matter.Events.on(engine, "collisionActive", (event) => {
    const paires = event.pairs;
    let fruitSurLaLigne = false;

    for (const paire of paires) {
      const bodyA = paire.bodyA;
      const bodyB = paire.bodyB;

      // On verif si un des corps est le capteur
      let fruitBody = null;
      if (bodyA === sensor) {
        fruitBody = bodyB;
      }
      else if (bodyB === sensor) {
        fruitBody = bodyA;
      }

      // Si collision avec le capteur
      if (fruitBody) {
        // On vérif si le fruit est quasi à l'arrêt
        if (fruitBody.speed < 0.2) {
          fruitSurLaLigne = true;
          break;
        }
      }
    }

    if (fruitSurLaLigne) {
      gameOverFrameCount++;
      // Si + de 2 secondes (à 60fps)
      if (gameOverFrameCount > 120) {
        gameOverDetecte = true;
        gameOverFrameCount = 0;
      }
    } else {
      gameOverFrameCount = 0;
    }
  });
}

function isGameOver() {
  return gameOverDetecte;
}

function resetGameOver() {
  gameOverDetecte = false;
}

export { gererEvolutionFruits, gererGameOver, isGameOver, resetGameOver };
