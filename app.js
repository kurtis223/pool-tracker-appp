// Firebase config - Replace with your own config from Firebase // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbTWVp9cjHP_uGlbOu-mUQbEoi7TpzSeI",
  authDomain: "pool-tracker-5a677.firebaseapp.com",
  projectId: "pool-tracker-5a677",
  storageBucket: "pool-tracker-5a677.firebasestorage.app",
  messagingSenderId: "200587625053",
  appId: "1:200587625053:web:de525aaa3ac07b029d03b4",
  measurementId: "G-RK55FXXMV0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let players = [];
let matches = [];

const playersTableBody = document.querySelector('#players-table tbody');
const matchesTableBody = document.querySelector('#matches-table tbody');
const leaderboardTableBody = document.querySelector('#leaderboard-table tbody');
const playerASelect = document.getElementById('player-a');
const playerBSelect = document.getElementById('player-b');
const winnerSelect = document.getElementById('winner');
const addPlayerForm = document.getElementById('add-player-form');
const addMatchForm = document.getElementById('add-match-form');
const newPlayerInput = document.getElementById('new-player-name');

// Listen for players updates from Firebase
db.ref('players').on('value', (snapshot) => {
  players = snapshot.val() || [];
  updateStats();
  renderAll();
});

// Listen for matches updates from Firebase
db.ref('matches').on('value', (snapshot) => {
  matches = snapshot.val() || [];
  updateStats();
  renderAll();
});

// Save players to Firebase
function savePlayers() {
  db.ref('players').set(players);
}

// Save matches to Firebase
function saveMatches() {
  db.ref('matches').set(matches);
}

// Update player stats from matches
function updateStats() {
  players.forEach(p => {
    p.wins = 0;
    p.losses = 0;
  });
  matches.forEach(m => {
    const winner = players.find(p => p.name === m.winner);
    const loser = players.find(p => p.name === (m.playerA === m.winner ? m.playerB : m.playerA));
    if (winner) winner.wins++;
    if (loser) loser.losses++;
  });
}

// Render players table
function renderPlayers() {
  playersTableBody.innerHTML = '';
  players.forEach((p, i) => {
    const games = p.wins + p.losses;
    const winPct = games > 0 ? ((p.wins / games) * 100).toFixed(1) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${games}</td>
      <td>${p.wins}</td>
      <td>${p.losses}</td>
      <td>${winPct}%</td>
      <td><button class="remove-btn" data-index="${i}">X</button></td>
    `;
    playersTableBody.appendChild(tr);
  });
}

// Render match selectors
function renderMatchSelectors() {
  [playerASelect, playerBSelect, winnerSelect].forEach(select => {
    select.innerHTML = '<option value="" disabled selected>Select player</option>';
    players.forEach(p => {
      const option = document.createElement('option');
      option.value = p.name;
      option.textContent = p.name;
      select.appendChild(option);
    });
  });
}

// Render matches table
function renderMatches() {
  matchesTableBody.innerHTML = '';
  matches.forEach((m, i) => {
    const tr = document.createElement('tr');
    const dateStr = new Date(m.date).toLocaleDateString();
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${m.playerA}</td>
      <td>${m.playerB}</td>
      <td>${m.winner}</td>
      <td>${dateStr}</td>
      <td><button class="remove-btn" data-index="${i}">X</button></td>
    `;
    matchesTableBody.appendChild(tr);
  });
}

// Render leaderboard (sorted by wins desc, then win % desc)
function renderLeaderboard() {
  leaderboardTableBody.innerHTML = '';
  const sorted = [...players].sort((a, b) => {
    const aGames = a.wins + a.losses;
    const bGames = b.wins + b.losses;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (bGames === 0) return -1;
    if (aGames === 0) return 1;
    return (b.wins / bGames) - (a.wins / aGames);
  });
  sorted.forEach((p, i) => {
    const games = p.wins + p.losses;
    const winPct = games > 0 ? ((p.wins / games) * 100).toFixed(1) : 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.name}</td>
      <td>${p.wins}</td>
      <td>${games}</td>
      <td>${winPct}%</td>
    `;
    leaderboardTableBody.appendChild(tr);
  });
}

// Add new player
addPlayerForm.addEventListener('submit', e => {
  e.preventDefault();
  const newName = newPlayerInput.value.trim();
  if (!newName) return alert('Enter a player name');
  if (players.find(p => p.name.toLowerCase() === newName.toLowerCase())) {
    alert('Player already exists');
    return;
  }
  players.push({ name: newName, wins: 0, losses: 0 });
  newPlayerInput.value = '';
  savePlayers();
});

// Remove player
playersTableBody.addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    const index = e.target.dataset.index;
    const playerName = players[index].name;
    if (!confirm(`Remove player ${playerName}? This will also remove related matches.`)) return;
    // Remove related matches
    matches = matches.filter(m => m.playerA !== playerName && m.playerB !== playerName);
    players.splice(index, 1);
    saveMatches();
    savePlayers();
  }
});

// Add new match
addMatchForm.addEventListener('submit', e => {
  e.preventDefault();
  const playerA = playerASelect.value;
  const playerB = playerBSelect.value;
  const winner = winnerSelect.value;
  if (!playerA || !playerB || !winner) return alert('Select all fields');
  if (playerA === playerB) return alert('Player A and Player B must be different');
  if (winner !== playerA && winner !== playerB) return alert('Winner must be either Player A or Player B');

  matches.push({
    playerA,
    playerB,
    winner,
    date: new Date().toISOString(),
  });
  saveMatches();
});

// Remove match
matchesTableBody.addEventListener('click', e => {
  if (e.target.classList.contains('remove-btn')) {
    const index = e.target.dataset.index;
    if (!confirm(`Remove match #${parseInt(index) + 1}?`)) return;
    matches.splice(index, 1);
    saveMatches();
  }
});

// Render all UI elements
function renderAll() {
  renderPlayers();
  renderMatchSelectors();
  renderMatches();
  renderLeaderboard();
}
