import * as DOM from './dom.js';
import * as STATE from './state.js';

export function createNewTile(url, title, comment = '', timestamp = null) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    const dateTimeString = timestamp || new Date().toLocaleString('de-DE');
    const displayTitle = title || url;

    tile.innerHTML = `
        <div class="tile-menu">
            <button class="menu-btn" aria-label="Menü öffnen">⋮</button>
            <div class="menu-dropdown">
                <a href="#" class="menu-item edit-item">Bearbeiten</a>
                <a href="#" class="menu-item delete-item">Löschen</a>
            </div>
        </div>
        <a href="${url}" target="_blank" class="tile-link">${displayTitle}</a>
        <p class="date-time">${dateTimeString}</p>
        <textarea placeholder="Dein Kommentar...">${comment}</textarea>
    `;

    DOM.tileContainer.appendChild(tile);
}

export function openModal() {
    DOM.modal.classList.add('active');
}

export function closeModal() {
    DOM.modal.classList.remove('active');
    STATE.setTileBeingEdited(null);
}

export function clearTiles() {
    const tiles = document.querySelectorAll('.tile:not(.add-tile-placeholder)');
    tiles.forEach(tile => tile.remove());
}

// KORRIGIERTE FUNKTION: Nimmt Daten als Parameter entgegen, anstatt sie selbst zu holen.
export function updateWorkspaceSwitcher(workspaces, activeWorkspace) {
    DOM.workspaceSwitcher.innerHTML = ''; 

    workspaces.forEach(ws => {
        const option = document.createElement('option');
        option.value = ws;
        option.textContent = ws;
        if (ws === activeWorkspace) {
            option.selected = true;
        }
        DOM.workspaceSwitcher.appendChild(option);
    });
}