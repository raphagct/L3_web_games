const assetsToLoad = {
  pasteque: { url: "./assets/img/pasteque.png" },
  melon: { url: "./assets/img/melon.png" },
  ananas: { url: "./assets/img/ananas.png" },
  coco: { url: "./assets/img/coco.png" },
  pomme: { url: "./assets/img/pomme.png" },
  orange: { url: "./assets/img/orange.png" },
  banane: { url: "./assets/img/banane.png" },
  kaki: { url: "./assets/img/kaki.png" },
  cerise: { url: "./assets/img/cerise.png" },
  myrtille: { url: "./assets/img/myrtille.png" },
  plop: { url: "./assets/sfx/pop-sfx.mp3" },
};

const etat = {
  ACCUEIL: "ACCUEIL",
  JEU_EN_COURS: "JEU EN COURS",
  GAME_OVER: "GAME OVER",
  NEXT_LEVEL: "NEXT LEVEL",
};

const niveau = {
  LEVEL1: "melon",
  LEVEL2: "ananas",
  LEVEL3: "pasteque",
  FIN: "FIN",
};
export { assetsToLoad, etat, niveau };
