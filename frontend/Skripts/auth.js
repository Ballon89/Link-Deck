// Skripts/auth.js
const API_BASE_URL = '';

// WICHTIG: 'credentials: "include"' sorgt dafür, dass Cookies (für die Session) mitgeschickt werden.
export async function registerUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return response.json();
}

export async function loginUser(username, password) {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    });
    return response.json();
}

export async function logoutUser() {
    const response = await fetch(`${API_BASE_URL}/api/users/logout`, {
        method: 'POST',
        credentials: 'include'
    });
    return response.json();
}

export async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/current`, {
            credentials: 'include'
        });
        if (!response.ok) return { error: 'Nicht eingeloggt' };
        return response.json();
    } catch (err) {
        return { error: 'Server nicht erreichbar' };
    }
}