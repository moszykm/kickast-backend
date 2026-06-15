// /api/fixtures — pośrednik (proxy) do API-Football.
// Aplikacja pyta TEN endpoint, a on dokłada ukryty klucz i pyta API-Football.
// Klucz NIGDY nie trafia do aplikacji mobilnej — siedzi tylko tutaj, na serwerze.

const API_BASE = 'https://v3.football.api-sports.io';

// Proste cache w pamięci, żeby nie zużywać limitu zapytań przy każdym wejściu.
// (Na serverless to cache "best effort" — znika gdy funkcja się uśpi, ale i tak pomaga.)
const cache = new Map();
const CACHE_MS = 30 * 1000; // 30 sekund — wyniki na żywo nie muszą być świeższe

export default async function handler(req, res) {
  // CORS — pozwala aplikacji łączyć się z tym backendem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Brak klucza API na serwerze (ustaw API_FOOTBALL_KEY w Vercel).' });
  }

  // Parametry od aplikacji: data (YYYY-MM-DD) i opcjonalnie liga.
  const { date, league, season } = req.query;

  // Budujemy zapytanie do API-Football
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (league) params.set('league', league);
  if (season) params.set('season', season);
  // Domyślnie: dzisiejsze mecze, jeśli nic nie podano
  if (!date && !league) {
    const today = new Date().toISOString().slice(0, 10);
    params.set('date', today);
  }

  const url = `${API_BASE}/fixtures?${params.toString()}`;
  const cacheKey = url;

  // Zwróć z cache, jeśli świeże
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.t < CACHE_MS) {
    return res.status(200).json({ cached: true, ...hit.data });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'x-apisports-key': key, // <-- tu wstrzykiwany jest ukryty klucz
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: 'Błąd API-Football', detail: text.slice(0, 300) });
    }

    const raw = await upstream.json();

    // Przekształcamy odpowiedź API-Football do prostego formatu,
    // który rozumie nasza aplikacja (te same pola co w danych przykładowych).
    const matches = (raw.response || []).map((f) => {
      const status = mapStatus(f.fixture?.status?.short);
      return {
        id: f.fixture?.id,
        league: f.league?.name,
        status,
        minute: f.fixture?.status?.elapsed ? `${f.fixture.status.elapsed}'` : null,
        time: f.fixture?.date ? new Date(f.fixture.date).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : null,
        home: f.teams?.home?.name,
        away: f.teams?.away?.name,
        homeLogo: f.teams?.home?.logo, // oficjalne logo z licencji API — można używać legalnie
        awayLogo: f.teams?.away?.logo,
        hs: f.goals?.home,
        as: f.goals?.away,
      };
    });

    const payload = { count: matches.length, matches };
    cache.set(cacheKey, { t: Date.now(), data: payload });
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ error: 'Nie udało się pobrać danych', detail: String(err).slice(0, 200) });
  }
}

// Mapowanie statusów API-Football na nasze trzy: live / upcoming / finished
function mapStatus(short) {
  const live = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'];
  const finished = ['FT', 'AET', 'PEN'];
  if (live.includes(short)) return 'live';
  if (finished.includes(short)) return 'finished';
  return 'upcoming';
}
