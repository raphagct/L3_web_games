import {
    gererEvolutionFruits,
    gererGameOver,
    isGameOver,
    resetGameOver,
} from "./collision.js";
import {
    getRandomFruit,
    getRadiusFruit,
} from "./fruitUtils.js";
import { assetsToLoad, etat, niveau } from "./model.js";
import { loadAssets } from "./assetLoader.js";
import BorduresJeu from "./BorduresJeu.js";
import { initListeners } from "./ecouteurs.js";

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.mouseX = this.canvas.width / 2;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // On crée le moteur et le monde physique Matter.js
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        this.etatJeu = etat.ACCUEIL;
        this.niveauJeu = niveau.LEVEL1;
        this.canDrop = true;
        this.delaiDrop = 400;
        this.score = 0;

        // On récupère le meilleur score dans le stockage du navigateur
        this.highScore = Number(localStorage.getItem("highScore")) || 0;

        this.fruits = [];
        this.effets = [];
    }

    async init() {
        // On charge les images et les sfx de façon asynchrone
        this.loadedAssets = await loadAssets(assetsToLoad);

        // On crée les bordures du jeu et le capteur de gameOver
        this.borduresJeu = new BorduresJeu(this.engine, this.width, this.height);
        this.borduresJeu.creeBordures();
        this.capteur = this.borduresJeu.creeCapteur();

        // On met en place le système d'évolution de fruit du même type via collisions et le système de gameOver
        gererEvolutionFruits(
            this.fruits,
            this.engine,
            this.loadedAssets,
            this.effets,
            this
        );
        gererGameOver(this.engine, this.capteur);

        // On crée le premier fruit et on recupere le fruit d'apres pour pouvoir l'afficher
        this.fruitCourant = getRandomFruit();
        this.fruitSuivant = getRandomFruit();
        this.afficherFruitSuivant();

        // On affiche le meilleur score et l'objectif
        this.updateScore();
        initListeners(this);
        this.updateObjectif();

        console.log("Game initialisé");
    }

    start() {
        console.log("Game démarré");
        // On démarre une animation à 60 images par seconde
        requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }

    mainAnimationLoop() {
        Matter.Engine.update(this.engine, 1000 / 60);

        this.checkSiNiveauTermine();

        if (this.etatJeu === etat.JEU_EN_COURS) {
            this.drawJeu();
        } else if (this.etatJeu === etat.GAME_OVER) {
            this.drawGameOver();
        } else if (this.etatJeu === etat.NEXT_LEVEL) {
            this.drawNextLevel();
        }
        requestAnimationFrame(this.mainAnimationLoop.bind(this));
    }

    checkSiNiveauTermine() {
        if (isGameOver()) {
            this.etatJeu = etat.GAME_OVER;
        }
    }

    monterDeNiveau() {
        if (this.niveauJeu === niveau.LEVEL1) {
            this.niveauJeu = niveau.LEVEL2;
            this.etatJeu = etat.NEXT_LEVEL;
        } else if (this.niveauJeu === niveau.LEVEL2) {
            this.niveauJeu = niveau.LEVEL3;
            this.etatJeu = etat.NEXT_LEVEL;
        } else if (this.niveauJeu === niveau.LEVEL3) {
            this.niveauJeu = niveau.FIN;
            this.etatJeu = etat.NEXT_LEVEL;
        }
        this.updateObjectif();
    }

    updateObjectif() {
        const divNiveau = document.getElementById("niveauActuel");
        const divFruit = document.getElementById("fruitObjectif");
        let levelName = "";
        let fruitObjectif = this.niveauJeu;

        if (this.niveauJeu === niveau.LEVEL1) levelName = "Niveau 1";
        else if (this.niveauJeu === niveau.LEVEL2) levelName = "Niveau 2";
        else if (this.niveauJeu === niveau.LEVEL3) levelName = "Niveau 3";
        else if (this.niveauJeu === niveau.FIN) {
            levelName = "Terminé !";
            fruitObjectif = null;
        }

        divNiveau.textContent = levelName;
        divFruit.innerHTML = "";

        if (fruitObjectif) {
            divFruit.textContent = fruitObjectif.toUpperCase();
        }
    }

    addScore(points) {
        this.score += points;
        // Vérification du meilleur score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem("highScore", this.highScore);
        }

        this.updateScore();
    }

    updateScore() {
        document.getElementById("scoreValue").textContent = this.score;
        document.getElementById("highScoreValue").textContent = this.highScore;
    }

    afficherFruitSuivant() {
        const rayonFruit = getRadiusFruit(this.fruitSuivant);
        const imgSrc = this.loadedAssets[this.fruitSuivant].src;
        const container = document.querySelector(".next-fruit-circle");
        container.innerHTML = "";
        const fruitImg = document.createElement("img");
        fruitImg.src = imgSrc;
        fruitImg.style.width = `${rayonFruit * 2.5}px`;
        fruitImg.style.height = `${rayonFruit * 2.5}px`;
        fruitImg.style.borderRadius = "50%";
        container.appendChild(fruitImg);

    }

    drawJeu() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.borduresJeu.drawLimite(this.ctx);

        // On draw les fruits
        this.fruits.forEach((f) => f.draw(this.ctx));

        // effets lors des fusions
        for (let i = this.effets.length - 1; i >= 0; i--) {
            const effet = this.effets[i];
            effet.update();
            effet.draw(this.ctx);
            if (effet.isFinished()) {
                this.effets.splice(i, 1);
            }
        }

        // On draw le fruit de preview 
        if (this.etatJeu === etat.JEU_EN_COURS && this.canDrop) {
            this.drawPreviewJouerFruit();
        }
    }

    drawPreviewJouerFruit() {
        const rayonFruit = getRadiusFruit(this.fruitCourant);
        const hitboxDiff = 1.4;
        const drawRadius = rayonFruit * hitboxDiff;
        const img = this.loadedAssets[this.fruitCourant];

        this.ctx.save();

        // Ligne pour afficher la traj de la chute du fruit
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouseX, 40 + drawRadius);
        this.ctx.lineTo(this.mouseX, this.height);
        this.ctx.stroke();

        //image du fruit courant avec opacité 0.5
        this.ctx.globalAlpha = 0.5;
        this.ctx.translate(this.mouseX, 40);
        this.ctx.drawImage(
            img,
            -drawRadius,
            -drawRadius,
            drawRadius * 2,
            drawRadius * 2
        );

        this.ctx.restore();
    }

    drawNextLevel() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "green";
        this.ctx.font = "48px Inconsolata";
        this.ctx.textAlign = "center";

        if (this.niveauJeu === niveau.FIN) {
            this.drawVictoire();
        } else {
            this.drawLevelSuivant();
        }
        this.ctx.restore();
    }

    drawVictoire() {
        this.ctx.fillText("Bravo vous avez fini le jeu !", this.width / 2, this.height / 2);
        this.ctx.font = "24px Inconsolata";
        this.ctx.fillText("Appuyez sur une touche pour recommencer", this.width / 2, this.height / 2 + 50);

        window.onkeydown = () => {
            window.onkeydown = null;
            this.resetGame(true);
        };
    }

    drawLevelSuivant() {
        this.ctx.fillText("Niveau Terminé !", this.width / 2, this.height / 2 - 50);
        this.ctx.font = "30px Inconsolata";
        this.ctx.fillText("Prochain objectif : " + this.niveauJeu, this.width / 2, this.height / 2);
        this.ctx.font = "24px Arial";
        this.ctx.fillText("Appuyez sur une touche pour continuer", this.width / 2, this.height / 2 + 50);

        window.onkeydown = () => {
            window.onkeydown = null;
            this.resetGame(false);
        };
    }

    drawGameOver() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "red";
        this.ctx.font = "48px Inconsolata";
        this.ctx.textAlign = "center";
        this.ctx.fillText("Game Over", this.width / 2, this.height / 2 - 50);
        this.ctx.font = "24px Inconsolata";
        this.ctx.fillText("Appuyez sur une touche pour rejouer", this.width / 2, this.height / 2 + 20);
        this.ctx.restore();

        window.onkeydown = () => {
            window.onkeydown = null;
            this.resetGame(true);
        };
    }

    resetGame(fullReset) {
        this.etatJeu = etat.JEU_EN_COURS;
        resetGameOver();

        if (fullReset) {
            this.niveauJeu = niveau.LEVEL1;
            this.score = 0;
            this.updateScore();
        }

        this.fruits.forEach((f) => Matter.Composite.remove(this.world, f.body));
        this.fruits.length = 0;

        this.fruitCourant = getRandomFruit();
        this.fruitSuivant = getRandomFruit();
        this.afficherFruitSuivant();

        document.body.classList.add("playing");
    }
}
