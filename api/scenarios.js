// Proposes test scenarios for a blueprint (used after drafting/importing).
const { authenticate, requireAnthropic, claudeJSON } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const auth = await authenticate(req, res);
  if (!auth) return;
  if (!requireAnthropic(res)) return;

  const b = req.body || {};
  const blueprint = b.blueprint && Array.isArray(b.blueprint) ? b.blueprint : null;
  if (!blueprint) return res.status(400).json({ error: 'Blueprint missing' });

  const prompt = `You are a QA engineer for agentic business apps. From the blueprint below, propose 7 concise end-to-end test scenarios (max 12 words each) covering: the happy path, one edge case, one precision/parsing case, one permission or security case, one language or format edge case, and one lifecycle case. Make them specific to THIS app, not generic.

Blueprint (JSON):
${JSON.stringify(blueprint).slice(0, 6000)}

Reply with JSON only: {"scenarios":["...","..."]}`;

  const out = await claudeJSON(prompt, { maxTokens: 800 });
  if (out.error) return res.status(502).json({ error: out.error });
  res.status(200).json(out.json);
};
