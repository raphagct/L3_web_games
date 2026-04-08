const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const connectDB = require('./connectDB/connectDb');
const User = require('./models/User');

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
})

connectDB();

app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "Un utilisateur existe déjà avec cet email" });
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "Inscription réussie!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect" });
        }
        res.status(200).json({ message: "Connecté", user: { id: user._id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const Score = require('./models/Score');

// Enregistrer ou mettre à jour un score (seulement si c'est le meilleur)
app.post('/api/scores', async (req, res) => {
    try {
        const { userId, gameName, score } = req.body;
        if (!['canvas', 'dom', 'babylon'].includes(gameName)) {
            return res.status(400).json({ message: "Jeu inconnu" });
        }

        // Le $max mettra à jour le score dans la BDD uniquement si le nouveau score est supérieur à l'ancien
        const updatedScore = await Score.findOneAndUpdate(
            { user: userId, gameName: gameName },
            { $max: { score: score } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: "Score mis à jour", data: updatedScore });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Récupérer les meilleurs scores personnels d'un utilisateur
app.get('/api/scores/user/:userId', async (req, res) => {
    try {
        const scores = await Score.find({ user: req.params.userId });
        res.status(200).json(scores);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Récupérer le high score global d'un jeu
app.get('/api/scores/game/:gameName/highscore', async (req, res) => {
    try {
        const { gameName } = req.params;
        const highScore = await Score.findOne({ gameName: gameName })
            .sort({ score: -1 })
            .populate('user', 'username') // Permet de récupérer le nom du joueur
            .exec();
        
        if (!highScore) {
            return res.status(200).json({ highScore: 0, player: "Aucun" });
        }
        res.status(200).json({ highScore: highScore.score, player: highScore.user.username });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.use(express.static(path.join(__dirname, '../')));

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});