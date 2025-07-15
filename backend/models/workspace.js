const mongoose = require('mongoose');

// Bauplan für eine einzelne Kachel
const TileSchema = new mongoose.Schema({
    url: String,
    title: String,
    comment: String,
    timestamp: String
});

// Bauplan für einen Workspace, der einen Namen und eine Liste von Kacheln enthält
const WorkspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    tiles: [TileSchema], // Ein Array, das Kacheln nach dem obigen Bauplan enthält
        owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Erstelle und exportiere das "Modell", das wir im Code verwenden werden
module.exports = mongoose.model('Workspace', WorkspaceSchema);