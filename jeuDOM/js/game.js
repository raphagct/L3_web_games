let tailleGrille = 4;
let grille = [];
let score = 0;
let meilleurScore = localStorage.getItem("meilleurScore2048") || 0;
let jeuTermine = false;
let jokersActifs = true;
let obstaclesActifs = false;
let modeSurvie = false;
let tempsRestant = 100;
let survivalInterval = null;
let nombreObstacles = 0;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("best-score").innerText = meilleurScore;
    
    document.getElementById("grid-size").addEventListener("change", (e) => {
        setGridSize(parseInt(e.target.value));
    });
    document.getElementById("game-mode").addEventListener("change", (e) => {
        initialiserJeu();
    });

    initialiserJeu();

    document.getElementById("new-game-btn").addEventListener("click", initialiserJeu);
    document.getElementById("try-again-btn").addEventListener("click", initialiserJeu);
    
    document.addEventListener("keydown", gererTouches);
});

function setGridSize(size) {
    tailleGrille = size;
    let cellSize = size >= 6 ? 55 : (size === 5 ? 65 : 85);
    document.documentElement.style.setProperty('--grid-size', size);
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
    initialiserJeu();
}

function initialiserJeu() {
    grille = Array(tailleGrille).fill().map(() => Array(tailleGrille).fill(0));
    score = 0;
    jeuTermine = false;
    jokersActifs = document.getElementById('joker-toggle').checked;
    obstaclesActifs = document.getElementById('obstacle-toggle').checked;
    modeSurvie = document.getElementById('game-mode').value === 'survival';
    nombreObstacles = 0;
    
    // Réactiver les boutons s'ils étaient désactivés
    document.getElementById('joker-toggle').disabled = false;
    document.getElementById('obstacle-toggle').disabled = false;
    document.getElementById('game-mode').disabled = false;
    document.getElementById('grid-size').disabled = false;

    if (survivalInterval) clearInterval(survivalInterval);
    
    if (modeSurvie) {
        document.getElementById('survival-timer-container').classList.remove('hidden');
        tempsRestant = 100;
        document.getElementById('survival-timer-bar').style.width = '100%';
        document.getElementById('survival-timer-bar').style.backgroundColor = '#f67c5f';
        survivalInterval = setInterval(tickSurvie, 100);
    } else {
        document.getElementById('survival-timer-container').classList.add('hidden');
    }

    mettreAJourScore(0);
    document.getElementById("game-over").classList.add("hidden");
    
    const gridContainer = document.getElementById("grid-container");
    gridContainer.innerHTML = "";
    for (let i = 0; i < tailleGrille * tailleGrille; i++) {
        const cell = document.createElement("div");
        cell.classList.add("grid-cell");
        gridContainer.appendChild(cell);
    }
    
    ajouterTuileAleatoire();
    ajouterTuileAleatoire();
    dessinerGrille();
}

function ajouterTuileAleatoire() {
    let cellulesVides = [];
    for (let r = 0; r < tailleGrille; r++) {
        for (let c = 0; c < tailleGrille; c++) {
            if (grille[r][c] === 0) {
                cellulesVides.push({r, c});
            }
        }
    }
    
    if (cellulesVides.length > 0) {
        let celluleAleatoire = cellulesVides[Math.floor(Math.random() * cellulesVides.length)];
        let val;
        let rand = Math.random();
        
        if (obstaclesActifs && rand < 0.04 && nombreObstacles < 3) {
            val = 'X';
            nombreObstacles++;
        }
        else if (jokersActifs && rand >= 0.04 && rand < 0.09) val = 'J';
        else if (rand < 0.9) val = 2;
        else val = 4;
        grille[celluleAleatoire.r][celluleAleatoire.c] = val;
    }
}

function dessinerGrille() {
    const tileContainer = document.getElementById("tile-container");
    tileContainer.innerHTML = "";

    for (let r = 0; r < tailleGrille; r++) {
        for (let c = 0; c < tailleGrille; c++) {
            if (grille[r][c] !== 0) {
                const tuile = document.createElement("div");
                if (grille[r][c] === 'J') {
                    tuile.classList.add("tile", "tile-joker");
                    tuile.innerText = "⭐";
                } else if (grille[r][c] === 'X') {
                    tuile.classList.add("tile", "tile-obstacle");
                    tuile.innerText = "🧱";
                } else {
                    tuile.classList.add("tile", `tile-${grille[r][c]}`);
                    tuile.innerText = grille[r][c];
                }
                
                let currentCellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
                let currentGapSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap-size'));
                
                tuile.style.top = `${r * (currentCellSize + currentGapSize)}px`;
                tuile.style.left = `${c * (currentCellSize + currentGapSize)}px`;
                
                tileContainer.appendChild(tuile);
            }
        }
    }
}

function gererTouches(e) {
    if (jeuTermine) return;

    let aBouge = false;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    switch (e.key) {
        case "ArrowUp":
            aBouge = deplacerHaut();
            break;
        case "ArrowDown":
            aBouge = deplacerBas();
            break;
        case "ArrowLeft":
            aBouge = deplacerGauche();
            break;
        case "ArrowRight":
            aBouge = deplacerDroite();
            break;
        default:
            return;
    }

    if (aBouge) {
        // Dès qu'on joue un coup, on ne peut plus modifier les règles
        document.getElementById('joker-toggle').disabled = true;
        document.getElementById('obstacle-toggle').disabled = true;
        document.getElementById('game-mode').disabled = true;
        document.getElementById('grid-size').disabled = true;
        
        ajouterTuileAleatoire();
        dessinerGrille();
        verifierFinDeJeu();
    }
}

function glisserLigne(ligne) {
    let nouvelleLigne = ligne.filter(val => val !== 0);
    while (nouvelleLigne.length < tailleGrille) {
        nouvelleLigne.push(0);
    }
    return nouvelleLigne;
}

function fusionnerLigne(ligne) {
    for (let i = 0; i < tailleGrille - 1; i++) {
        if (ligne[i] !== 0 && ligne[i+1] !== 0) {
            if (ligne[i] === 'X' || ligne[i+1] === 'X') continue;

            if (ligne[i] === ligne[i + 1] && ligne[i] !== 'J') {
                ligne[i] *= 2;
                ligne[i + 1] = 0;
                mettreAJourScore(ligne[i]);
            } else if (ligne[i] === 'J' && ligne[i+1] !== 'J') {
                ligne[i] = ligne[i+1] * 2;
                ligne[i+1] = 0;
                mettreAJourScore(ligne[i]);
            } else if (ligne[i+1] === 'J' && ligne[i] !== 'J') {
                ligne[i] = ligne[i] * 2;
                ligne[i+1] = 0;
                mettreAJourScore(ligne[i]);
            } else if (ligne[i] === 'J' && ligne[i+1] === 'J') {
                ligne[i] = 4;
                ligne[i+1] = 0;
                mettreAJourScore(4);
            }
        }
    }
    return ligne;
}

function traiterLigne(ligne) {
    ligne = glisserLigne(ligne);
    ligne = fusionnerLigne(ligne);
    ligne = glisserLigne(ligne);
    return ligne;
}

function deplacerGauche() {
    let aBouge = false;
    for (let r = 0; r < tailleGrille; r++) {
        let ligneOriginale = [...grille[r]];
        let nouvelleLigne = traiterLigne(grille[r]);
        grille[r] = nouvelleLigne;
        if (ligneOriginale.join(',') !== nouvelleLigne.join(',')) {
            aBouge = true;
        }
    }
    return aBouge;
}

function deplacerDroite() {
    let aBouge = false;
    for (let r = 0; r < tailleGrille; r++) {
        let ligneOriginale = [...grille[r]];
        let ligneInversee = ligneOriginale.slice().reverse();
        let nouvelleLigneInversee = traiterLigne(ligneInversee);
        let nouvelleLigne = nouvelleLigneInversee.reverse();
        grille[r] = nouvelleLigne;
        if (ligneOriginale.join(',') !== nouvelleLigne.join(',')) {
            aBouge = true;
        }
    }
    return aBouge;
}

function deplacerHaut() {
    let aBouge = false;
    for (let c = 0; c < tailleGrille; c++) {
        let colonneOriginale = [];
        for(let r=0; r<tailleGrille; r++) colonneOriginale.push(grille[r][c]);
        let nouvelleColonne = traiterLigne([...colonneOriginale]);
        
        for (let r = 0; r < tailleGrille; r++) {
            grille[r][c] = nouvelleColonne[r];
        }
        if (colonneOriginale.join(',') !== nouvelleColonne.join(',')) {
            aBouge = true;
        }
    }
    return aBouge;
}

function deplacerBas() {
    let aBouge = false;
    for (let c = 0; c < tailleGrille; c++) {
        let colonneOriginale = [];
        for(let r=0; r<tailleGrille; r++) colonneOriginale.push(grille[r][c]);
        let colonneInversee = colonneOriginale.slice().reverse();
        let nouvelleColonneInversee = traiterLigne(colonneInversee);
        let nouvelleColonne = nouvelleColonneInversee.reverse();
        
        for (let r = 0; r < tailleGrille; r++) {
            grille[r][c] = nouvelleColonne[r];
        }
        if (colonneOriginale.join(',') !== nouvelleColonne.join(',')) {
            aBouge = true;
        }
    }
    return aBouge;
}

function mettreAJourScore(pointsAjoutes) {
    score += pointsAjoutes;
    document.getElementById("score").innerText = score;
    
    // Dans le mode survie, faire des fusions redonne du temps !
    if (modeSurvie && pointsAjoutes > 0 && survivalInterval !== null) {
        let tempsGagne = pointsAjoutes > 16 ? 10 : 5;
        tempsRestant = Math.min(100, tempsRestant + tempsGagne);
    }
    
    if (score > meilleurScore) {
        meilleurScore = score;
        localStorage.setItem("meilleurScore2048", meilleurScore);
        document.getElementById("best-score").innerText = meilleurScore;
    }
}

function tickSurvie() {
    if (jeuTermine) return;
    
    // Baisse de 0.5% tous les 100ms -> Game Over en 20 secondes sans fusion
    tempsRestant -= 0.5;
    
    const bar = document.getElementById('survival-timer-bar');
    bar.style.width = tempsRestant + '%';
    
    if (tempsRestant <= 20) {
        bar.style.backgroundColor = '#f65e3b'; // Rouge
    } else {
        bar.style.backgroundColor = '#f67c5f'; // Orange
    }
    
    if (tempsRestant <= 0) {
        tempsRestant = 0;
        verifierFinDeJeu(true); // Force Game Over
    }
}

function verifierFinDeJeu(forceGameOver = false) {
    let mouvementPossible = false;

    if (!forceGameOver) {
        for (let r = 0; r < tailleGrille; r++) {
            for (let c = 0; c < tailleGrille; c++) {
                if (grille[r][c] === 0) mouvementPossible = true;
            }
        }
        
        for (let r = 0; r < tailleGrille; r++) {
            for (let c = 0; c < tailleGrille - 1; c++) {
                if (grille[r][c] === 'X' || grille[r][c+1] === 'X') continue;
                if (grille[r][c] === grille[r][c + 1] || grille[r][c] === 'J' || grille[r][c+1] === 'J') mouvementPossible = true;
            }
        }
        for (let c = 0; c < tailleGrille; c++) {
            for (let r = 0; r < tailleGrille - 1; r++) {
                if (grille[r][c] === 'X' || grille[r+1][c] === 'X') continue;
                if (grille[r][c] === grille[r + 1][c] || grille[r][c] === 'J' || grille[r+1][c] === 'J') mouvementPossible = true;
            }
        }
    }

    if (!mouvementPossible || forceGameOver) {
        jeuTermine = true;
        if (survivalInterval) clearInterval(survivalInterval);
        document.getElementById("game-over").classList.remove("hidden");
        sauvegarderScoreBDD();
    }
}

async function sauvegarderScoreBDD() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) return;

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    gameName: 'dom',
                    score: score
                })
            });
            console.log("Score de " + score + " sauvegardé en BDD !");
        } catch(e) {
            console.error('Erreur lors de la sauvegarde du score en BDD', e);
        }
    }
}
