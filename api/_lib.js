// Shared helpers for the /api/* handlers: Supabase auth check and Claude calls.

// ALLOW_ANONYMOUS_DRAFT=true is a local/private-preview escape hatch: it lets
// AI endpoints work without a sign-in session. Never set it on a public site.
function anonymousAllowed() {
  return process.env.ALLOW_ANONYMOUS_DRAFT === 'true';
}

// Verifies the bearer token with Supabase. Returns {token, user} or sends an
// error response and returns null. With the anonymous flag and no token,
// returns {token:null, user:null}.
async function authenticate(req, res) {
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) {
    res.status(503).json({ error: 'Server is not configured' });
    return null;
  }
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (anonymousAllowed() && !token) return { token: null, user: null };
  const who = await fetch(`${sbUrl}/auth/v1/user`, {
    headers: { apikey: sbKey, Authorization: `Bearer ${token}` }
  });
  if (!who.ok) {
    res.status(401).json({ error: 'Sign in first' });
    return null;
  }
  return { token, user: await who.json() };
}

function requireAnthropic(res) {
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'AI is not configured on this server' });
    return false;
  }
  return true;
}

// Calls Claude and parses the reply as JSON. Returns {json} or {error}.
async function claudeJSON(prompt, opts = {}) {
  const { system = 'Reply with JSON only. No prose, no code fences.', maxTokens = 2000, timeoutMs = 45000 } = opts;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) {
      console.error('anthropic error:', r.status);
      return { error: 'Model call failed' };
    }
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
      .replace(/```json|```/g, '').trim();
    try {
      return { json: JSON.parse(text) };
    } catch (e) {
      return { error: 'The model did not return valid JSON' };
    }
  } catch (e) {
    console.error('anthropic request failed:', e.name === 'AbortError' ? 'timeout' : e.message);
    return { error: 'The model took too long. Try again.' };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { anonymousAllowed, authenticate, requireAnthropic, claudeJSON };
