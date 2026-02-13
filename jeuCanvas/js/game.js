import Fruit from "./fruit.js";
import {
    gererEvolutionFruits,
    gererGameOver,
    getEvenementEvolution,
    isGameOver,
    resetCollisionState,
} from "./collision.js";
import {
    getRandomFruit,
    getRadiusFruit,
    getHighScore,
    updateHighScoreDisplay,
    resetScore,
} from "./fruitUtils.js";
import { assetsToLoad, etat, niveau } from "./model.js";
import { loadAssets } from "./assetLoader.js";
import BorduresJeu from "./borduresjeu.js";

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        this.mouseX = this.canvas.width / 2;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // On crée le moteur et le monde physique
        this.engine = Matter.Engine.create();
        this.world = this.engine.world;

        // On init les etats du jeu
        this.etatJeu = etat.ACCUEIL;
        this.niveauJeu = niveau.LEVEL1;
        this.canDrop = true;
        this.delaiDrop = 400;

        // Entities
        this.fruits = [];
        this.effects = [];
        this.borduresJeu = null;
        this.capteur = null;

        // Next Fruit Logic
        this.fruitCourant = null; // Le fruit qui suit la souris
        this.fruitSuivant = null; // Le fruit affiché dans la case "Suivant"
        this.loadedAssets = null;
    }

    async init() {
        // On charge les images et les sfx de façon asynchrone
        this.loadedAssets = await loadAssets(assetsToLoad);

        // On crée les bordures du jeu
        this.borduresJeu = new BorduresJeu(this.engine, this.width, this.height);
        this.borduresJeu.creeBordures();
        this.capteur = this.borduresJeu.creeCapteur();

        // On met en place le système d'évolution de fruit du même type via collisions
        gererEvolutionFruits(
            this.fruits,
            this.engine,
            this.loadedAssets,
            this.effects
        );
        gererGameOver(this.engine, this.capteur);

        // On crée le premier fruit
        this.fruitCourant = getRandomFruit();
        this.fruitSuivant = getRandomFruit();
        this.afficherFruitSuivant();

        // On affiche le meilleur score
        updateHighScoreDisplay(getHighScore());

        // On met en place les inputs
        this.setupInputs();

    }

    start() {
        requestAnimationFrame(() => this.loop());
    }

    setupInputs() {
        // Mouse Move
        this.canvas.addEventListener("mousemove", (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            this.mouseX = (event.clientX - rect.left) * scaleX;
        });

        // Click to Drop
        this.canvas.addEventListener("click", (event) => {
            this.handleDrop(event);
        });

        // Play Button
        const boutonJouer = document.getElementById("boutonJouer");
        if (boutonJouer) {
            boutonJouer.addEventListener("click", () => {
                document.body.classList.add("playing");
                this.etatJeu = etat.JEU_EN_COURS;
            });
        }

        // Restart Listeners are set in drawGameOver/drawNextLevel only when needed
    }

    handleDrop(event) {
        if (this.etatJeu !== etat.JEU_EN_COURS) return;
        if (!this.canDrop) return;

        this.canDrop = false;
        setTimeout(() => {
            this.canDrop = true;
        }, this.delaiDrop);

        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        this.mouseX = (event.clientX - rect.left) * scaleX;

        const x = this.mouseX;
        const typeToDrop = this.fruitCourant;
        const fruitImage = this.loadedAssets[typeToDrop];

        // Create Physical Fruit
        const fruit = new Fruit(x, 40, this.engine, typeToDrop, fruitImage);
        this.fruits.push(fruit);

        // Cycle Fruits: Current becomes what Next wass, New Next is generated
        this.fruitCourant = this.fruitSuivant;
        this.fruitSuivant = getRandomFruit();
        this.afficherFruitSuivant();
    }

    afficherFruitSuivant() {
        const radiusFruit = getRadiusFruit(this.fruitSuivant);
        const imgSrc = this.loadedAssets[this.fruitSuivant].src;
        const container = document.querySelector(".next-fruit-circle");

        if (container) {
            container.innerHTML = "";
            const fruitImg = document.createElement("img");
            fruitImg.src = imgSrc;
            fruitImg.style.width = `${radiusFruit * 2.5}px`;
            fruitImg.style.height = `${radiusFruit * 2.5}px`;
            fruitImg.style.borderRadius = "50%";
            container.appendChild(fruitImg);
        }
    }

    loop() {
        Matter.Engine.update(this.engine, 1000 / 60);

        this.checkGameEvents();

        // Draw based on state
        if (this.etatJeu === etat.JEU_EN_COURS) {
            this.drawJeu();
        } else if (this.etatJeu === etat.GAME_OVER) {
            this.drawGameOver();
        } else if (this.etatJeu === etat.NEXT_LEVEL) {
            this.drawNextLevel();
        }

        requestAnimationFrame(() => this.loop());
    }

    checkGameEvents() {
        // Polling Evolution
        const typeFruitCree = getEvenementEvolution();
        if (typeFruitCree) {
            if (typeFruitCree === this.niveauJeu) {
                this.levelUp();
            }
        }

        // Polling GameOver
        if (isGameOver()) {
            this.etatJeu = etat.GAME_OVER;
        }
    }

    levelUp() {
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
    }

    drawJeu() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.borduresJeu.drawLimite(this.ctx);

        // Fruits
        this.fruits.forEach((f) => f.draw(this.ctx));

        // Effects
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update();
            effect.draw(this.ctx);
            if (effect.isFinished()) {
                this.effects.splice(i, 1);
            }
        }

        // Phantom Fruit (Current)
        if (this.etatJeu === etat.JEU_EN_COURS && this.canDrop) {
            this.drawPhantom();
        }
    }

    drawPhantom() {
        const radius = getRadiusFruit(this.fruitCourant);
        const hitboxDiff = 1.4;
        const drawRadius = radius * hitboxDiff;
        const img = this.loadedAssets[this.fruitCourant];

        this.ctx.save();

        // Line
        this.ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.mouseX, 40 + drawRadius);
        this.ctx.lineTo(this.mouseX, this.height);
        this.ctx.stroke();

        // Image
        if (img) {
            this.ctx.globalAlpha = 0.5;
            this.ctx.translate(this.mouseX, 40);
            this.ctx.drawImage(
                img,
                -drawRadius,
                -drawRadius,
                drawRadius * 2,
                drawRadius * 2
            );
        }
        this.ctx.restore();
    }

    drawNextLevel() {
        this.ctx.save();
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = "green";
        this.ctx.font = "48px Inconsolata";
        this.ctx.textAlign = "center";

        if (this.niveauJeu === niveau.FIN) {
            this.drawWinScreen();
        } else {
            this.drawLevelCompleteScreen();
        }
        this.ctx.restore();
    }

    drawWinScreen() {
        this.ctx.fillText("Bravo vous avez fini le jeu !", this.width / 2, this.height / 2);
        this.ctx.font = "24px Inconsolata";
        this.ctx.fillText("Appuyez sur une touche pour recommencer", this.width / 2, this.height / 2 + 50);

        this.setupRestartListener(true);
    }

    drawLevelCompleteScreen() {
        this.ctx.fillText("Niveau Terminé !", this.width / 2, this.height / 2 - 50);
        this.ctx.font = "30px Inconsolata";
        this.ctx.fillText("Prochain objectif : " + this.niveauJeu, this.width / 2, this.height / 2);
        this.ctx.font = "24px Arial";
        this.ctx.fillText("Appuyez sur une touche pour continuer", this.width / 2, this.height / 2 + 50);

        this.setupRestartListener(false);
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

        this.setupRestartListener(true);
    }

    setupRestartListener(fullReset) {
        // Avoid checking keydown multiple times per frame or stacking listeners
        if (this.waitingForRestart) return;
        this.waitingForRestart = true;

        const handler = () => {
            this.waitingForRestart = false;
            window.removeEventListener("keydown", handler);
            this.resetGame(fullReset);
        };
        window.addEventListener("keydown", handler);
    }

    resetGame(fullReset) {
        this.etatJeu = etat.JEU_EN_COURS;

        if (fullReset) {
            this.niveauJeu = niveau.LEVEL1;
            resetScore();
        }

        // Reset inputs/state
        resetCollisionState();

        // Clear Physics World
        this.fruits.forEach((f) => Matter.Composite.remove(this.world, f.body));
        this.fruits.length = 0;

        // Reset Next Fruit Cycle
        this.fruitCourant = getRandomFruit();
        this.fruitSuivant = getRandomFruit();
        this.afficherFruitSuivant();

        document.body.classList.add("playing");
    }
}
