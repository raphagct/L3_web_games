import {
  getProchainTypeFruit,
  supprimerFruit,
  getNbPointsPourFruit,
  addScoreFruits,
} from "./fruitUtils.js";
import Fruit from "./fruit.js";

function gererEvolutionFruits(
  fruits,
  engine,
  loadedAssets,
  onFruitMerged,
) {
  Matter.Events.on(engine, "collisionStart", (event) => {
    const pairs = event.pairs;

    pairs.forEach((pair) => {
      // récupère les fruits en collision
      const fruit1 = fruits.find((f) => f.body === pair.bodyA);
      const fruit2 = fruits.find((f) => f.body === pair.bodyB);

      // vérif si c'est bien les mêmes fruits
      if (fruit1 && fruit2 && fruit1.type === fruit2.type) {
        const typeSuivant = getProchainTypeFruit(fruit1.type);

        // vérifie si c'est pas déjà une pasteque
        if (typeSuivant) {
          const x = (fruit1.body.position.x + fruit2.body.position.x) / 2;
          const y = (fruit1.body.position.y + fruit2.body.position.y) / 2;

          // Calculer le nouveau rayon basé sur le précédent

          let multiplier = 1.4; // Par défaut pour les petits fruits

          // Ajustements spécifiques pour les gros fruits pour garantir la hiérarchie
          // tout en évitant l'explosion de taille
          if (typeSuivant === "melon")
            multiplier = 1.2; // Coco -> Melon
          else if (typeSuivant === "ananas")
            multiplier = 1.2; // Melon -> Ananas
          else if (typeSuivant === "pasteque")
            multiplier = 1.2; // Ananas -> Pastèque
          else if (fruit1.radius > 60) multiplier = 1.15; // Sécurité générique

          const newRadius = fruit1.radius * multiplier;

          // créer le nouveau fruit
          const nouveauFruit = new Fruit(
            x,
            y,
            engine,
            typeSuivant,
            loadedAssets[typeSuivant],
            newRadius, // On passe le rayon calculé
          );
          fruits.push(nouveauFruit);

          if (onFruitMerged) {
            onFruitMerged(typeSuivant);
          }

          // supprimer les anciens fruits
          supprimerFruit(fruit1, engine, fruits);
          supprimerFruit(fruit2, engine, fruits);

          loadedAssets.plop.play();

          // mettre à jour le score (addScoreFruits gère le cumul maintenant)
          addScoreFruits(getNbPointsPourFruit(typeSuivant));
        }
      }
    });
  });
}

function gererGameOver(engine, sensor, onGameOver) {
  let gameOverFrameCount = 0;

  Matter.Events.on(engine, "collisionActive", (event) => {
    const pairs = event.pairs;
    let dangerDeLeFrame = false;

    for (const pair of pairs) {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;

      // On vérifie si un des corps est le capteur
      let fruitBody = null;
      if (bodyA === sensor) fruitBody = bodyB;
      else if (bodyB === sensor) fruitBody = bodyA;

      // Si collision avec le capteur
      if (fruitBody) {
        // On vérifie si le fruit est quasi à l'arrêt
        if (fruitBody.speed < 0.2) {
            dangerDeLeFrame = true;
            break; // Un seul fruit suffit pour trigger le danger
        }
      }
    }

    if (dangerDeLeFrame) {
        gameOverFrameCount++;
        // Si plus de 2 secondes (à 60fps)
        if (gameOverFrameCount > 120) {
            onGameOver();
            gameOverFrameCount = 0; // reset
        }
    } else {
        gameOverFrameCount = 0;
    }
  });
}

export { gererEvolutionFruits, gererGameOver };
