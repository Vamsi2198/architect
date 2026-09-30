// Chat with the Architect about a project: answers against the blueprint.
const { authenticate, requireAnthropic, claudeJSON } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const auth = await authenticate(req, res);
  if (!auth) return;
  if (!requireAnthropic(res)) return;

  const b = req.body || {};
  const message = String(b.message || '').trim();
  if (!message) return res.status(400).json({ error: 'Message missing' });
  const blueprint = Array.isArray(b.blueprint) ? b.blueprint : [];
  const history = Array.isArray(b.history) ? b.history.slice(-10) : [];

  const prompt = `You are the Architect, a product-minded AI that helps teams design agentic business apps. The user is chatting about the app blueprint below. Answer in 2-4 short sentences, be concrete about THEIR blueprint, and if their request implies a change, say what you would change. Stay in character, no preamble.

Blueprint (JSON):
${JSON.stringify(blueprint).slice(0, 6000)}

Recent conversation (JSON):
${JSON.stringify(history.map(m => ({ who: m.who, text: String(m.text || '').slice(0, 300) }))).slice(0, 2000)}

User: ${message}

Reply with JSON only: {"reply":"..."}`;

  const out = await claudeJSON(prompt, { maxTokens: 400 });
  if (out.error) return res.status(502).json({ error: out.error });
  const reply = out.json && typeof out.json.reply === 'string' ? out.json.reply : '';
  if (!reply) return res.status(502).json({ error: 'The model did not return a reply' });
  res.status(200).json({ reply });
};
