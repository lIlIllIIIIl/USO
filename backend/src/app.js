import express from 'express';
import cors from 'cors';
import { getDb } from './db.js';
import { registerSession } from './routes/auth.js';
import { pseudo, createPlaylistRoute } from './routes/api.js';

getDb();

const app = express();
const allowedOrigins = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  (process.env.FRONTEND_URL || '').replace(/\/?$/, ''),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(null, allowedOrigins[0]);
    },
    credentials: true,
  })
);
app.use(express.json());

app.post('/register-session', registerSession);
app.post('/pseudo', pseudo);
app.post('/createPlaylist', createPlaylistRoute);
app.get('/error', (req, res) => res.json('error.'));

export default app;
