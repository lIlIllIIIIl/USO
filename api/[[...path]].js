/**
 * Handler Vercel serverless : transmet toutes les requêtes /api/* à l'app Express (backend).
 * Réécrit l'URL de /api/xxx vers /xxx pour que les routes Express correspondent.
 */
import app from '../backend/src/app.js';

export default function handler(req, res) {
  const url = req.url || '';
  req.url = url.replace(/^\/api/, '') || '/';
  return app(req, res);
}
