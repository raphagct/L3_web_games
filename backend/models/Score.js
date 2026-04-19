const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameName: {
        type: String,
        required: true,
        enum: ['canvas', 'dom', 'babylon']
    },
    score: {
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

// Garantit qu'un utilisateur n'a qu'un seul document de score par jeu (son meilleur score)
ScoreSchema.index({ user: 1, gameName: 1 }, { unique: true });

module.exports = mongoose.model('Score', ScoreSchema);
