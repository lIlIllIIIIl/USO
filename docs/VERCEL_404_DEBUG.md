# Diagnostic 404 sur Vercel (redirection /callback)

Si tu as une **404 NOT_FOUND** sur `https://ton-app.vercel.app/callback` (ou autre route SPA), vérifie les points suivants **dans l’ordre**.

---

## 1. Root Directory (cause la plus fréquente)

Si **Root Directory** n’est pas la racine du dépôt, Vercel **ignore** le `vercel.json` à la racine du repo.

**À faire :**

1. Vercel Dashboard → ton projet **USO** → **Settings** → **General**
2. Section **Root Directory**
3. **Doit être vide ou `.`** (racine du repo).  
   Si c’est `frontend` ou autre chose → **Clear** / remettre vide et **Save**
4. **Redeploy** le projet (Deployments → … → Redeploy)

Tant que Root Directory pointe vers `frontend`, le `vercel.json` à la racine (où sont les `rewrites`) n’est jamais lu, donc les routes comme `/callback` tombent en 404.

---

## 2. Vérifier que `vercel.json` est bien déployé

1. **Deployments** → clique sur le dernier déploiement
2. Onglet **Source** ou **Files** (selon l’interface)
3. Vérifie qu’à la **racine** du déploiement tu as bien un fichier **`vercel.json`** (pas seulement `frontend/`, `api/`, etc.)

Si `vercel.json` n’apparaît pas à la racine, soit le Root Directory est mauvais (retour au point 1), soit le fichier n’est pas commité/poussé.

---

## 3. Contenu de `vercel.json`

À la racine du repo, `vercel.json` doit contenir des **rewrites**, par exemple :

```json
"rewrites": [
  { "source": "/api/:path*", "destination": "/api/:path*" },
  { "source": "/callback", "destination": "/index.html" },
  { "source": "/playlist-creator", "destination": "/index.html" },
  { "source": "/:path*", "destination": "/index.html" }
]
```

- Les requêtes vers **/api/** restent envoyées à l’API.
- **/callback** et **/playlist-creator** (et toute autre route) sont renvoyées vers **/index.html** pour que le routeur Vue (SPA) gère l’URL.

---

## 4. Build & Output Directory

Dans **Settings** → **Build & Development Settings** :

- **Build Command** : celle définie dans `vercel.json` (ex. `npm run vercel-build`) ou laisser Vercel utiliser le fichier
- **Output Directory** : `frontend/dist` (comme dans `vercel.json`)

Si Output Directory est incorrect, Vercel peut servir un mauvais dossier et tu peux avoir des 404 même avec les bons rewrites.

---

## 5. Test après correction

1. Corriger **Root Directory** (vide ou `.`) et sauvegarder
2. **Redeploy** (sans cache si possible)
3. Ouvrir **https://ton-app.vercel.app/** (page d’accueil) → doit charger
4. Puis ouvrir **https://ton-app.vercel.app/callback** → doit afficher la page de callback (ou la vue Vue correspondante), **pas** une 404 Vercel

Si après ça tu as encore 404 sur `/callback`, envoie une capture ou le message d’erreur exact + une capture des **Settings** → **General** (Root Directory visible).
