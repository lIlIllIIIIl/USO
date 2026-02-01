import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 8081;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`USO API running at http://localhost:${PORT}`);
  });
}
