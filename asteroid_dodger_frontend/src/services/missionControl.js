//
// Mission Control service: fetch a short, space-themed debrief from OpenAI Chat Completions.
// Uses environment variable VITE_OPENAI_API_KEY (or REACT_APP_VITE_OPENAI_API_KEY as fallback for CRA setups).
//
// PUBLIC_INTERFACE
export async function getMissionComment(stats = {}) {
  /**
   * Request a one-sentence (<=15 words), funny, encouraging, space-themed debrief based on player stats.
   * Returns a string. Handles missing API key and errors gracefully.
   *
   * stats: { score: number, duration?: number, accuracy?: number, asteroidsDodged?: number }
   */
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OPENAI_API_KEY) ||
    (typeof process !== 'undefined' && process.env && process.env.REACT_APP_VITE_OPENAI_API_KEY) ||
    '';

  if (!apiKey) {
    // eslint-disable-next-line no-console
    console.warn(
      '[MissionControl] Missing API key. Set VITE_OPENAI_API_KEY (or REACT_APP_VITE_OPENAI_API_KEY) in .env'
    );
    return 'Signal lost. Try again, pilot!';
  }

  const model = 'gpt-4o-mini'; // per requirements; let server decide availability
  const temperature = 0.8;
  const max_tokens = 30;

  const {
    score = 0,
    duration = null,
    accuracy = null,
    asteroidsDodged = null,
  } = stats || {};

  const durationText =
    typeof duration === 'number' && Number.isFinite(duration) ? `${Math.round(duration)}s` : 'unknown time';
  const accuracyText =
    typeof accuracy === 'number' && Number.isFinite(accuracy) ? `${Math.round(accuracy)}%` : 'n/a';
  const dodgedText =
    typeof asteroidsDodged === 'number' && Number.isFinite(asteroidsDodged) ? `${Math.round(asteroidsDodged)}` : 'n/a';

  const systemPrompt =
    'You are Mission Control for a retro space dodging game. Keep messages brief, upbeat, and space-themed.';
  const userPrompt = [
    'Create exactly one short sentence (max 15 words).',
    'Be funny and encouraging, with a space theme.',
    'Do not include quotes or emojis.',
    `Player summary -> score: ${score}, time: ${durationText}, accuracy: ${accuracyText}, asteroids dodged: ${dodgedText}.`,
  ].join(' ');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('[MissionControl] OpenAI API error:', res.status, await safeText(res));
      return 'Signal lost. Try again, pilot!';
    }

    const data = await res.json();
    const text =
      data?.choices?.[0]?.message?.content?.trim?.() ||
      data?.choices?.[0]?.message?.content ||
      '';

    if (!text) {
      return 'Signal lost. Try again, pilot!';
    }

    // Enforce <= 15 words at client side as well
    const words = String(text).split(/\s+/).filter(Boolean);
    const pruned = words.slice(0, 15).join(' ');
    return pruned;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[MissionControl] Request failed:', e?.message || e);
    return 'Signal lost. Try again, pilot!';
  }
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
