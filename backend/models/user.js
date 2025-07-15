const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true // Entfernt Leerzeichen am Anfang/Ende
    },
    password: {
        type: String,
        required: true
    }
});

// WICHTIG: Diese Funktion wird automatisch VOR dem Speichern ausgeführt
UserSchema.pre('save', async function(next) {
    // Nur hashen, wenn das Passwort neu ist oder geändert wurde
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('User', UserSchema);