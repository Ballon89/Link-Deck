// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const Workspace = require('./models/workspace');
const User = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Datenbank & Session-Speicher ---
const connectionString = process.env.MONGODB_URI;
mongoose.connect(connectionString).then(() => console.log('MongoDB verbunden!')).catch(err => console.error(err));

app.use(session({
    secret: 'dein-super-geheimes-geheimnis',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: connectionString }),
    cookie: { sameSite: 'lax', secure: false }
}));

const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).send({ error: 'Bitte zuerst einloggen.' });
    }
    next();
};


// === API Routen ===

// --- Benutzer-Routen ---
app.post('/api/users/register', async (req, res) => {
    try {
        const user = new User({ username: req.body.username, password: req.body.password });
        await user.save();
        const defaultWorkspace = new Workspace({ name: 'Default', tiles: [], owner: user._id });
        await defaultWorkspace.save();
        res.status(201).send({ message: 'Benutzer erfolgreich registriert.' });
    } catch (error) {
        res.status(400).send({ error: 'Benutzername existiert bereits.' });
    }
});

app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).send({ error: 'Falscher Benutzername oder Passwort.' });
    const isMatch = await require('bcrypt').compare(password, user.password);
    if (!isMatch) return res.status(400).send({ error: 'Falscher Benutzername oder Passwort.' });
    req.session.userId = user._id;
    res.send({ message: 'Login erfolgreich.', username: user.username });
});

app.post('/api/users/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send({ error: 'Logout fehlgeschlagen.' });
        res.clearCookie('connect.sid');
        res.send({ message: 'Logout erfolgreich.' });
    });
});

app.get('/api/users/current', async (req, res) => {
    if (!req.session.userId) return res.status(401).send({ error: 'Nicht eingeloggt.' });
    const user = await User.findById(req.session.userId);
    res.send({ username: user.username });
});


// --- Workspace-Routen ---
app.get('/api/workspaces', requireLogin, async (req, res) => {
    const workspaces = await Workspace.find({ owner: req.session.userId }, 'name');
    res.json(workspaces.map(ws => ws.name));
});

app.post('/api/workspaces', requireLogin, async (req, res) => {
    try {
        const newWorkspace = new Workspace({
            name: req.body.name,
            tiles: [],
            owner: req.session.userId
        });
        await newWorkspace.save();
        res.status(201).json(newWorkspace);
    } catch (err) {
        res.status(400).json({ error: 'Fehler beim Erstellen des Workspaces.' });
    }
});

app.delete('/api/workspaces/:name', requireLogin, async (req, res) => {
    try {
        await Workspace.deleteOne({ name: req.params.name, owner: req.session.userId });
        res.status(200).json({ message: 'Workspace erfolgreich gelöscht.' });
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Löschen des Workspaces' });
    }
});


// --- Kachel-Routen ---
app.get('/api/tiles/:workspaceName', requireLogin, async (req, res) => {
    try {
        const workspace = await Workspace.findOne({ name: req.params.workspaceName, owner: req.session.userId });
        res.json(workspace ? workspace.tiles : []);
    } catch (err) {
        res.status(500).json({ error: 'Fehler beim Abrufen der Kacheln' });
    }
});

app.post('/api/tiles/:workspaceName', requireLogin, async (req, res) => {
    try {
        await Workspace.updateOne(
            { name: req.params.workspaceName, owner: req.session.userId },
            { tiles: req.body }
        );
        res.status(200).json({ message: 'Kacheln erfolgreich gespeichert.' });
    } catch (err) {
        res.status(400).json({ error: 'Fehler beim Speichern der Kacheln' });
    }
});


// --- Statische Dateien ausliefern (muss nach den API-Routen stehen) ---
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Server starten (ganz am Ende) ---
app.listen(port, () => {
    console.log(`Server läuft auf ${port}`);
});