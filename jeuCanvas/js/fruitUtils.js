function getProchainTypeFruit(typeActuel) {
  const evolution = {
    myrtille: "cerise",
    cerise: "kaki",
    kaki: "banane",
    banane: "orange",
    orange: "pomme",
    pomme: "coco",
    coco: "melon",
    melon: "ananas",
    ananas: "pasteque",
    pasteque: null, // plus d'évolution possible apres la pastèque
  };

  return evolution[typeActuel];
}

function supprimerFruit(fruit, engine, fruits) {
  const index = fruits.indexOf(fruit);
  fruits.splice(index, 1);

  // on supprime le fruit du monde physique
  Matter.Composite.remove(engine.world, fruit.body);
}

function getRandomFruit() {
  const tab = ["myrtille", "cerise", "kaki", "banane", "orange"];
  const randomIndex = Math.floor(Math.random() * tab.length);
  return tab[randomIndex];
}

function getNbPointsPourFruit(type) {
  const pointsParFruit = {
    myrtille: 10,
    cerise: 20,
    kaki: 30,
    banane: 40,
    orange: 50,
    pomme: 60,
    coco: 70,
    melon: 80,
    ananas: 90,
    pasteque: 100,
  };
  return pointsParFruit[type];
}

// module-level score pour éviter les problèmes de passage par valeur
let score = 0;

function addScoreFruits(points) {
  score += points;
  const spanScore = document.querySelector("#scoreValue");
  if (spanScore) spanScore.textContent = score;
  return score;
}

function getScore() {
  return score;
}

function resetScore() {
  score = 0;
  const spanScore = document.querySelector("#scoreValue");
  if (spanScore) spanScore.textContent = score;
}

function getRadiusFruit(type) {
  switch (type) {
    case "myrtille":
      return 20;
    case "cerise":
      return 30;
    case "kaki":
      return 40;
    case "banane":
      return 50;
    case "orange":
      return 60;
    case "pomme":
      return 70;
    case "coco":
      return 80;
    case "melon":
      return 110;
    case "ananas":
      return 140;
    case "pasteque":
      return 170;
    default:
      return 30;
  }
}

export {
  getProchainTypeFruit,
  supprimerFruit,
  getNbPointsPourFruit,
  addScoreFruits,
  getRandomFruit,
  getScore,
  getRadiusFruit,
  resetScore,
};
