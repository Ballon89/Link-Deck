import { createNewTile, clearTiles } from './ui.js';

const API_BASE_URL = '';
const ACTIVE_WORKSPACE_KEY = 'linkDeckActiveWorkspace'; // Schlüssel für localStorage

// --- Lokale Speicherung für den aktiven Workspace ---
export function getActiveWorkspaceFromStorage() {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

export function setActiveWorkspaceInStorage(workspaceName) {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceName);
}

// --- Backend-Kommunikation für Workspaces ---
export async function getAllWorkspaces() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/workspaces`);
        if (!response.ok) throw new Error('Server-Fehler!');
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Abrufen der Workspace-Daten:', error);
        return null;
    }
}

export async function addWorkspace(workspaceName) {
    try {
        await fetch(`${API_BASE_URL}/api/workspaces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: workspaceName })
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Workspaces:', error);
    }
}

export async function deleteWorkspace(workspaceName) {
    try {
        await fetch(`${API_BASE_URL}/api/workspaces/${workspaceName}`, { method: 'DELETE' });
    } catch (error) {
        console.error('Fehler beim Löschen des Workspaces:', error);
    }
}

// --- Backend-Kommunikation für Kacheln ---
export async function loadTiles(workspaceName) {
    clearTiles();
    if (!workspaceName) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/tiles/${workspaceName}`);
        const tilesData = await response.json();
        if (tilesData) {
            tilesData.forEach(tileData => createNewTile(tileData.url, tileData.title, tileData.comment, tileData.timestamp));
        }
    } catch (error) {
        console.error('Fehler beim Laden der Kacheln:', error);
    }
}

export async function saveTiles(workspaceName) {
    if (!workspaceName) return;
    const tiles = document.querySelectorAll('.tile:not(.add-tile-placeholder)');
    const tilesData = [];
    tiles.forEach(tile => {
        const linkElement = tile.querySelector('.tile-link');
        const commentElement = tile.querySelector('textarea');
        const dateElement = tile.querySelector('.date-time');
        if (linkElement && dateElement) { // Sicherheitsabfrage hinzugefügt
            tilesData.push({
                url: linkElement.getAttribute('href'),
                title: linkElement.textContent,
                comment: commentElement.value,
                timestamp: dateElement.textContent
            });
        }
    });
    try {
        await fetch(`${API_BASE_URL}/api/tiles/${workspaceName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tilesData)
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Kacheln:', error);
    }
}