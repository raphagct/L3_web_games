import {
  getProchainTypeFruit,
  supprimerFruit,
  getNbPointsPourFruit,
  addScoreFruits,
} from "./fruitUtils.js";
import Fruit from "./fruit.js";

function gererEvolutionFruits(
  Events,
  fruits,
  engine,
  Bodies,
  Composite,
  loadedAssets,
) {
  Events.on(engine, "collisionStart", (event) => {
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
            Bodies,
            Composite,
            typeSuivant,
            loadedAssets[typeSuivant],
            newRadius, // On passe le rayon calculé
          );
          fruits.push(nouveauFruit);

          // supprimer les anciens fruits
          supprimerFruit(fruit1, Composite, engine, fruits);
          supprimerFruit(fruit2, Composite, engine, fruits);

          // mettre à jour le score (addScoreFruits gère le cumul maintenant)
          addScoreFruits(getNbPointsPourFruit(typeSuivant));
        }
      }
    });
  });
}

export { gererEvolutionFruits };
