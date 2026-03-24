import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { registerSession } from './routes/auth.js';
import {
  accountStatus,
  linkOsu,
  spotifyUserPlaylists,
  spotifyPlaylistEditor,
  osuMostPlayedBeatmaps,
} from './routes/account.js';
import { pseudo, createPlaylistRoute, updatePlaylistRoute } from './routes/api.js';

await initDb();

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
app.post('/account-status', accountStatus);
app.post('/account/spotify-playlists', spotifyUserPlaylists);
app.post('/account/spotify-recent-playlists', spotifyUserPlaylists);
app.post('/account/spotify-playlist-editor', spotifyPlaylistEditor);
app.post('/account/osu-most-played', osuMostPlayedBeatmaps);
app.post('/link-osu', linkOsu);
app.post('/pseudo', pseudo);
app.post('/createPlaylist', createPlaylistRoute);
app.post('/updatePlaylist', updatePlaylistRoute);
app.get('/error', (req, res) => res.json('error.'));

export default app;
