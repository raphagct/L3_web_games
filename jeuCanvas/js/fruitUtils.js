//fonctions utilitaires pour indiquer les evolutions des fruits
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

function getRadiusFruit(type) {
  const rayonParFruit = {
    myrtille: 20,
    cerise: 30,
    kaki: 40,
    banane: 50,
    orange: 60,
    pomme: 70,
    coco: 80,
    melon: 110,
    ananas: 140,
    pasteque: 170,
  };
  return rayonParFruit[type];
}

export {
  getProchainTypeFruit,
  supprimerFruit,
  getNbPointsPourFruit,
  getRandomFruit,
  getRadiusFruit,
};
