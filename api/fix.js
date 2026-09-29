// Proposes a design fix for a failing scenario. Returns {fix, code_change}.
const { authenticate, requireAnthropic, claudeJSON } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const auth = await authenticate(req, res);
  if (!auth) return;
  if (!requireAnthropic(res)) return;

  const b = req.body || {};
  const scenario = String(b.scenario || '').slice(0, 600);
  const trace = Array.isArray(b.trace) ? b.trace : null;
  const blueprint = b.blueprint && Array.isArray(b.blueprint) ? b.blueprint : null;
  if (!scenario || !trace || !blueprint) {
    return res.status(400).json({ error: 'Need scenario, trace and blueprint' });
  }

  const prompt = `You are improving an agentic business app. A test scenario failed.

Blueprint (JSON):
${JSON.stringify(blueprint).slice(0, 6000)}

Scenario: ${scenario}

Failing trace:
${trace.map(l => `- ${l[0]}: ${l[1]}${l[2] ? '  <-- went wrong' : ''}`).join('\n')}

Reply with JSON only: {"fix":"one sentence a non-developer understands","code_change":"the exact replacement code for the agent or data block that fixes it, 3-5 lines, matching the blueprint's style"}`;

  const out = await claudeJSON(prompt, { maxTokens: 1200 });
  if (out.error) return res.status(502).json({ error: out.error });
  res.status(200).json(out.json);
};
