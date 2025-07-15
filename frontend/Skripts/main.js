import * as DOM from './dom.js';
import * as AUTH from './auth.js';
import * as UI from './ui.js';
import * as STORAGE from './storage.js';
import * as STATE from './state.js';

// Globale Variable, die den aktuell ausgewählten Workspace speichert
let activeWorkspace = null;

// --- Authentifizierungs-Event-Listeners ---

DOM.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = DOM.loginForm.querySelector('#login-username').value;
    const password = DOM.loginForm.querySelector('#login-password').value;
    const result = await AUTH.loginUser(username, password);
    if (result.error) {
        alert(result.error);
    } else {
        // Rufe direkt die Funktion zum Aufbauen der App auf
        await initializeApp(result.username); 
    }
});

DOM.registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = DOM.registerForm.querySelector('#register-username').value;
    const password = DOM.registerForm.querySelector('#register-password').value;

    console.log("Sende Registrieung für Benutzter:", username);

    const result = await AUTH.registerUser(username, password);
    if (result.error) {
        alert(result.error);
    } else {
        alert(result.message);
        DOM.registerForm.reset();
    }
});

DOM.logoutBtn.addEventListener('click', async () => {
    await AUTH.logoutUser();
    showAuthView();
});


// --- App-Event-Listeners (Kacheln, Workspaces, etc.) ---

DOM.addTileBtn.addEventListener('click', () => {
    STATE.setTileBeingEdited(null);
    DOM.modalHeadline.textContent = 'Neuen Link hinzufügen';
    DOM.addLinkForm.reset();
    UI.openModal();
});

DOM.closeModalBtn.addEventListener('click', UI.closeModal);

DOM.modal.addEventListener('click', (event) => {
    if (event.target === DOM.modal) UI.closeModal();
});

DOM.addLinkForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = DOM.linkUrlInput.value;
    const title = DOM.linkTitleInput.value;
    const tileToEdit = STATE.getTileBeingEdited();

    if (tileToEdit) {
        const linkElement = tileToEdit.querySelector('.tile-link');
        linkElement.setAttribute('href', url);
        linkElement.textContent = title || url;
    } else {
        UI.createNewTile(url, title);
    }
    await STORAGE.saveTiles(activeWorkspace);
    UI.closeModal();
});

DOM.addWorkspaceBtn.addEventListener('click', async () => {
    const newName = DOM.newWorkspaceInput.value.trim();
    if (newName) {
        await STORAGE.addWorkspace(newName);
        STORAGE.setActiveWorkspaceInStorage(newName);
        await initializeApp(DOM.usernameDisplay.textContent.replace('Willkommen, ','').replace('!',''));
        DOM.newWorkspaceInput.value = '';
    }
});

DOM.workspaceSwitcher.addEventListener('change', async (event) => {
    const selectedWorkspace = event.target.value;
    STORAGE.setActiveWorkspaceInStorage(selectedWorkspace);
    activeWorkspace = selectedWorkspace;
    await STORAGE.loadTiles(activeWorkspace);
});

DOM.deleteWorkspaceBtn.addEventListener('click', async () => {
    if (!activeWorkspace) return;
    if (confirm(`Möchtest du den Workspace "${activeWorkspace}" wirklich löschen?`)) {
        await STORAGE.deleteWorkspace(activeWorkspace);
        STORAGE.setActiveWorkspaceInStorage(null);
        await initializeApp(DOM.usernameDisplay.textContent.replace('Willkommen, ','').replace('!',''));
    }
});

DOM.tileContainer.addEventListener("input", (event) => {
    if (event.target.tagName.toLowerCase() === 'textarea') {
        STORAGE.saveTiles(activeWorkspace)
    }
});

DOM.tileContainer.addEventListener('click', async (event) => {
    const target = event.target;
    if (target.classList.contains('menu-btn')) { target.nextElementSibling.classList.toggle('active'); return; }
    if (target.classList.contains('edit-item')) { event.preventDefault(); const tile = target.closest('.tile'); STATE.setTileBeingEdited(tile); const linkElement = tile.querySelector('.tile-link'); DOM.linkUrlInput.value = linkElement.getAttribute('href'); DOM.linkTitleInput.value = linkElement.textContent; DOM.modalHeadline.textContent = 'Link bearbeiten'; UI.openModal(); }
    if (target.classList.contains('delete-item')) { event.preventDefault(); const tileToDelete = target.closest('.tile'); if (confirm('Möchtest du diese Kachel wirklich löschen?')) { tileToDelete.remove(); await STORAGE.saveTiles(activeWorkspace); } }
});

window.addEventListener('click', (event) => {
    if (!event.target.classList.contains('menu-btn')) { document.querySelectorAll('.menu-dropdown.active').forEach(dropdown => { dropdown.classList.remove('active'); }); }
});


// --- Haupt-Logik und Initialisierung ---

async function initializeApp(username) {
    DOM.authContainer.classList.add('hidden');
    DOM.appContainer.classList.remove('hidden');
    DOM.usernameDisplay.textContent = `Willkommen, ${username}!`;

    const allWorkspaces = await STORAGE.getAllWorkspaces();
    if (!allWorkspaces || allWorkspaces.length === 0) {
        UI.updateWorkspaceSwitcher([], null);
        UI.clearTiles();
        return;
    }

    let lastActive = STORAGE.getActiveWorkspaceFromStorage();
    if (!lastActive || !allWorkspaces.includes(lastActive)) {
        lastActive = allWorkspaces[0];
        STORAGE.setActiveWorkspaceInStorage(lastActive);
    }
    
    activeWorkspace = lastActive;
    UI.updateWorkspaceSwitcher(allWorkspaces, activeWorkspace);
    await STORAGE.loadTiles(activeWorkspace);
    
    if (!DOM.tileContainer.sortable) {
        new Sortable(DOM.tileContainer, {
            animation: 150,
            draggable: '.tile:not(.add-tile-placeholder)',
            onEnd: () => STORAGE.saveTiles(activeWorkspace)
        });
    }
}

function showAuthView() {
    DOM.appContainer.classList.add('hidden');
    DOM.authContainer.classList.remove('hidden');
    DOM.loginForm.reset();
    DOM.registerForm.reset();
}

async function initialize() {
    const status = await AUTH.checkLoginStatus();
    if (status.username) {
        await initializeApp(status.username);
    } else {
        showAuthView();
    }
}

initialize();