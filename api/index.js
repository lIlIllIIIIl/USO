/**
 * Point d’entrée Vercel pour tout le backend Express.
 * Le rewrite `vercel.json` envoie `/api/*` ici ; on enlève le préfixe `/api` pour matcher les routes Express (`/account-status`, etc.).
 */
import app from '../backend/src/app.js';

export default function handler(req, res) {
  const raw = req.url || '';
  req.url = raw.replace(/^\/api(?=\/|$)/, '') || '/';
  return app(req, res);
}
