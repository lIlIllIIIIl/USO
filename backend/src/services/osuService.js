import axios from 'axios';

const OSU_BASE_URL = process.env.OSU_BASE_URL || 'https://osu.ppy.sh/oauth/token';
const OSU_USER_URL = process.env.OSU_USER_URL || 'https://osu.ppy.sh/api/v2/users/';
const OSU_CLIENT_ID = process.env.OSU_CLIENT_ID;
const OSU_SECRET = process.env.OSU_SECRET;

const replacements = [
  ' (TV Size)', ' (TV edit)', ' [TV Size]', ' [Dictate Edit]',
  ' (Speed Up Ver.)', ' (Swing Arrangement)', ' (From "Kaguya-sama: Love is War")',
  '[ISORA arrange]', '[- karaoke]', '[- Cover]', '[opening]', '- edit'
];

function cleanTitle(title) {
  let t = title;
  for (const r of replacements) {
    t = t.replace(new RegExp(r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '');
  }
  if (t.toLowerCase().includes('feat')) {
    t = t.split(/\s+feat/i)[0].trim();
  }
  return t;
}

const DEFAULT_LIMIT = 20;

export async function getOsuToken(pseudo, options = {}) {
  const limit = Math.min(Number(options.limit) || DEFAULT_LIMIT, 100);
  const offset = Number(options.offset) || 0;

  const tokenRes = await axios.post(OSU_BASE_URL, new URLSearchParams({
    client_id: OSU_CLIENT_ID,
    client_secret: OSU_SECRET,
    grant_type: 'client_credentials',
    scope: 'public',
  }), {
    headers: { Accept: 'application/json' },
  });

  const token = tokenRes.data.access_token;
  const userUrl = `${OSU_USER_URL}${encodeURIComponent(pseudo)}`;
  const userRes = await axios.get(userUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const userData = userRes.data;
  const userId = userData.id;
  const userAvatar = userData.avatar_url;
  const userBmapsCount = userData.beatmap_playcounts_count;

  const musicUrl = `https://osu.ppy.sh/api/v2/users/${userId}/beatmapsets/most_played?limit=${limit}&offset=${offset}`;
  const beatmapsRes = await axios.get(musicUrl, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const raw = beatmapsRes.data || [];
  const musicTitleTab = raw.map((item) => {
    const title = cleanTitle(item.beatmapset?.title || '');
    const musicId = item.beatmap?.beatmapset_id;
    return { id: musicId, titre: title };
  });

  const hasMore = musicTitleTab.length >= limit;
  const nextOffset = offset + musicTitleTab.length;

  return {
    musicTitleTab,
    userInfo: { avatar: userAvatar, baetmapsCount: userBmapsCount },
    hasMore,
    nextOffset,
  };
}
