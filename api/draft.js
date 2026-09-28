// Turns a plain-language description into a blueprint (JSON) using Claude.
// Only signed-in users can call it, the API key never leaves the server,
// and each user has a monthly credit cap so a leaked token can't run up the bill.

function blueprintPrompt(text, fw) {
  return `You design agentic business apps. From the description below, produce a blueprint as JSON only: {"name": short app name (max 5 words), "lanes":[{"id":"screens","items":[{"title","plain","code"}]},{"id":"agents","items":[...]},{"id":"data","items":[...]},{"id":"conn","items":[...]}]}. Two items per lane. "plain" is one or two plain-English sentences a non-developer understands. "code" is 3 to 5 lines: React for screens, Python Agent(...) with framework="${fw}" for agents, SQL create table for data, connect(...) for connections. Description: ${text}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) return res.status(503).json({ error: 'Server is not configured' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: 'Drafting is not configured on this server' });

  // 1. Check the caller is signed in (asks Supabase who owns this token).
  //    ALLOW_ANONYMOUS_DRAFT=true is a local-development escape hatch only:
  //    it skips auth AND the credit cap. Never set it on a public deployment.
  const allowAnon = process.env.ALLOW_ANONYMOUS_DRAFT === 'true';
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!allowAnon || token) {
    const who = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${token}` }
    });
    if (!who.ok) return res.status(401).json({ error: 'Sign in first' });
  }

  // 2. Build the prompt here, so the endpoint can't be used for anything else.
  const body = req.body || {};
  const description = String(body.description || '').slice(0, 1500);
  const framework = String(body.framework || 'langgraph').replace(/[^a-z_]/g, '').slice(0, 30);
  if (!description) return res.status(400).json({ error: 'Describe the app first' });

  // 3. Spend one credit (atomically checks the monthly cap in Postgres).
  //    Anonymous local calls skip the cap along with auth.
  if (!allowAnon || token) {
    const cap = Math.max(1, parseInt(process.env.CREDIT_CAP_MONTHLY || '100', 10));
    const credit = await fetch(`${sbUrl}/rest/v1/rpc/use_credit`, {
      method: 'POST',
      headers: { apikey: sbKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_cap: cap })
    });
    if (!credit.ok) {
      console.error('use_credit failed:', credit.status);
      return res.status(500).json({ error: 'Could not check usage' });
    }
    if (!(await credit.json())) {
      return res.status(429).json({ error: `Monthly credit cap reached (${cap}). It resets on the 1st.` });
    }
  }

  // 4. Call Claude, with a timeout so a hung request can't pin the function.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let r;
  try {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: 'Reply with JSON only. No prose, no code fences.',
        messages: [{ role: 'user', content: blueprintPrompt(description, framework) }]
      })
    });
  } catch (e) {
    console.error('anthropic request failed:', e.name === 'AbortError' ? 'timeout' : e.message);
    return res.status(504).json({ error: 'The model took too long. Try again.' });
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) {
    console.error('anthropic error:', r.status);
    return res.status(502).json({ error: 'Model call failed' });
  }

  // 5. Pull the JSON out of the reply and send it back.
  const data = await r.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
    .replace(/```json|```/g, '').trim();
  try {
    res.status(200).json(JSON.parse(text));
  } catch (e) {
    res.status(502).json({ error: 'The model did not return valid JSON' });
  }
};
