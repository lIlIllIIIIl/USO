# USO - Créateur de playlist Osu → Spotify

Version **Vue.js** (frontend) + **Node.js** (backend), sans Docker.  
Authentification Spotify en **Authorization Code avec PKCE** (exigences 2025).

## Fonctionnalités

- Connexion Spotify (OAuth **PKCE**, côté frontend)
- Recherche d’un joueur **osu!** par pseudo
- Récupération des musiques les plus jouées (beatmaps) et correspondance avec Spotify
- Création d’une playlist Spotify à partir des titres sélectionnés

## Prérequis

- **Node.js** 18+
- Comptes et applications :
  - [Spotify for Developers](https://developer.spotify.com/dashboard) (Client ID uniquement pour PKCE)
  - [osu! OAuth](https://osu.ppy.sh/home/account/edit) (Client ID + Secret)

## Installation

### 1. Backend

```bash
cd backend
cp .env.example .env
# Remplir OSU_CLIENT_ID, OSU_SECRET ; FRONTEND_URL = http://127.0.0.1:5173
npm install
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Remplir VITE_SPOTIFY_CLIENT_ID
# VITE_SPOTIFY_REDIRECT_URI = http://127.0.0.1:5173/callback (obligatoire : 127.0.0.1, pas localhost)
npm install
```

**Spotify Dashboard** : dans l’app, onglet _Redirect URIs_, ajouter exactement :  
`http://127.0.0.1:5173/callback`

## Lancement (sans Docker)

**Terminal 1 – API :**

```bash
cd backend
npm run dev
```

→ API sur `http://127.0.0.1:8081`

**Terminal 2 – Front :**

```bash
cd frontend
npm run dev
```

→ Ouvrir **http://127.0.0.1:5173** (utiliser 127.0.0.1 pour respecter les règles Spotify), se connecter à Spotify, puis utiliser la recherche osu! et la création de playlist.

## Structure

```
├── backend/          # Node.js (Express)
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js           # SQLite (utilisateurs + refresh_token)
│   │   ├── routes/         # auth (POST /register-session), api (pseudo, createPlaylist)
│   │   └── services/       # Osu, Spotify
│   └── data/
├── frontend/
│   └── src/
│       ├── views/          # ConnexionPage, PlaylistPage, SpotifyCallback
│       ├── components/     # Banner, SearchOsu, SpotifyPage
│       └── api/            # index.js, spotifyAuth.js (PKCE)
└── README.md
```

## Authentification Spotify (PKCE)

L’app utilise le **Authorization Code avec PKCE** ([doc Spotify](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)) :

- Le **frontend** génère `code_verifier` et `code_challenge`, redirige vers Spotify avec `code_challenge`.
- Spotify redirige vers `/callback?code=...`.
- Le frontend échange le `code` contre un token (avec `code_verifier`, **sans client_secret**).
- Le frontend envoie l’`access_token` au backend (`POST /register-session`), qui crée la session et renvoie un `token` utilisateur.

Conformité 2025 : pas d’implicit grant, redirect URI en **http://127.0.0.1** (pas `localhost`).

## Variables d’environnement

**Backend (`backend/.env`)**

| Variable           | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `PORT`             | Port (défaut 8081)                                    |
| `FRONTEND_URL`     | URL du front, ex. `http://127.0.0.1:5173` (pour CORS) |
| `OSU_*`            | URLs et identifiants osu!                             |
| `SPOTIFY_BASE_URL` | https://api.spotify.com/v1/                           |

**Frontend (`frontend/.env`)**

| Variable                    | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `VITE_API_URL`              | URL du backend (ex. `http://127.0.0.1:8081`). Vide = proxy `/api` |
| `VITE_SPOTIFY_CLIENT_ID`    | Client ID de l’app Spotify (obligatoire pour PKCE)                |
| `VITE_SPOTIFY_REDIRECT_URI` | Callback après login, ex. `http://127.0.0.1:5173/callback`        |
