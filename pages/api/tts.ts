import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.query;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing text parameter' });
    return;
  }
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ja&client=tw-ob`;
  try {
    const response = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    if (!response.ok) {
      res.status(500).json({ error: 'Failed to fetch TTS audio' });
      return;
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch {
    res.status(500).json({ error: 'Proxy error' });
  }
}
