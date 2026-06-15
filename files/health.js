// /api/health — szybkie sprawdzenie, czy backend żyje i czy klucz jest ustawiony.
// NIE pokazuje samego klucza — tylko informację, że istnieje.

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const hasKey = Boolean(process.env.API_FOOTBALL_KEY);
  res.status(200).json({
    ok: true,
    service: 'kickast-backend',
    keyConfigured: hasKey,
    time: new Date().toISOString(),
  });
}
