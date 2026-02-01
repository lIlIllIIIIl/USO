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

## Déploiement sur Vercel

Le projet est prêt pour un déploiement unique (frontend + API) sur [Vercel](https://vercel.com).

### Étapes

1. **Pousser le repo sur GitHub** (déjà fait si vous êtes dans la racine du projet).

2. **Créer un projet sur Vercel**
   - [vercel.com/new](https://vercel.com/new) → importer le dépôt GitHub.
   - **Root Directory** : laisser la racine du repo (pas `frontend`).
   - Vercel utilisera le `vercel.json` et le `package.json` à la racine.

3. **Variables d’environnement** (onglet _Settings → Environment Variables_)  
   À définir pour **Production** (et éventuellement Preview) :

   | Variable                    | Valeur (exemple)                        |
   | --------------------------- | --------------------------------------- |
   | `FRONTEND_URL`              | `https://votre-app.vercel.app`          |
   | `VITE_SPOTIFY_CLIENT_ID`    | Client ID de votre app Spotify          |
   | `VITE_SPOTIFY_REDIRECT_URI` | `https://votre-app.vercel.app/callback` |
   | `OSU_CLIENT_ID`             | Client ID osu!                          |
   | `OSU_SECRET`                | Secret osu!                             |
   | `SPOTIFY_BASE_URL`          | `https://api.spotify.com/v1/`           |

   Les variables `VITE_*` sont lues au **build** : ajoutez-les dans Vercel avant le premier déploiement.

4. **Spotify Dashboard**  
   Dans l’app Spotify, onglet _Redirect URIs_, ajouter :  
   `https://votre-app.vercel.app/callback`

5. **Déployer**  
   Un push sur la branche connectée (souvent `main`) déclenche un déploiement.  
   L’app est accessible à l’URL fournie par Vercel (ex. `https://uso-xxx.vercel.app`).

### Comportement

- **Frontend** : servi en statique depuis `frontend/dist`.
- **API** : toutes les routes backend sont exposées sous `/api/*` (ex. `/api/pseudo`, `/api/register-session`, `/api/createPlaylist`) via un handler serverless qui transmet à Express.

En production, le frontend utilise `/api` comme base URL (pas besoin de `VITE_API_URL` si tout est sur le même domaine).

### Base de données (SQLite sur Vercel)

Sur Vercel, le filesystem est en lecture seule sauf `/tmp`. La base SQLite est donc utilisée dans `/tmp` : **les données sont éphémères** (elles peuvent disparaître entre déploiements ou cold starts). Pour une persistance réelle en production, il faudrait migrer vers une base managée (ex. [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), Turso, etc.).
