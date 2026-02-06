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

function supprimerFruit(fruit, Composite, engine, fruits) {
  const index = fruits.indexOf(fruit);
  if (index > -1) {
    fruits.splice(index, 1);
  }
  Composite.remove(engine.world, fruit.body);
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

function getAttributsFruit(type) {
  switch (type) {
    case "myrtille":
      return { radius: 20, color: "blue" };
    case "cerise":
      return { radius: 30, color: "darkred" };
    case "kaki":
      return { radius: 40, color: "green" };
    case "banane":
      return { radius: 50, color: "yellow" };
    case "orange":
      return { radius: 60, color: "orange" };
    case "pomme":
      return { radius: 70, color: "red" };
    case "coco":
      return { radius: 90, color: "brown" };
    case "melon":
      return { radius: 100, color: "lightgreen" };
    case "ananas":
      return { radius: 110, color: "gold" };
    case "pasteque":
      return { radius: 120, color: "darkgreen" };
    default:
      return { radius: 30, color: "gray" };
  }
}

export {
  getProchainTypeFruit,
  supprimerFruit,
  getNbPointsPourFruit,
  getAttributsFruit,
  addScoreFruits,
  getRandomFruit,
  getScore,
};
