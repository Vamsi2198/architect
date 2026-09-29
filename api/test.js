// Runs one test scenario against a blueprint by simulating the agents with
// Claude: it walks the design step by step and reports where the design
// would fail. Real traces, real pass/fail — no canned data.
const { authenticate, requireAnthropic, claudeJSON } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const auth = await authenticate(req, res);
  if (!auth) return;
  if (!requireAnthropic(res)) return;

  const b = req.body || {};
  const scenario = String(b.scenario || '').slice(0, 600);
  if (!scenario) return res.status(400).json({ error: 'Describe the scenario first' });
  const blueprint = b.blueprint && Array.isArray(b.blueprint) ? b.blueprint : null;
  if (!blueprint) return res.status(400).json({ error: 'Blueprint missing' });

  const prompt = `You are a rigorous test harness for agentic business apps. You are given an app blueprint and a scenario. Simulate executing the design step by step exactly as the agents would run it, honouring every rule, threshold, permission and connection scope in the blueprint. Be strict: if the DESIGN has a gap that would make this scenario fail (missing rule, wrong threshold, unhandled input, permission the agent does not have, unit/parsing issue), mark that step bad.

Blueprint (JSON):
${JSON.stringify(blueprint).slice(0, 6000)}

Scenario: ${scenario}

Reply with JSON only: {"status":"pass" or "fail","trace":[["step_name","one line of detail",0 or omitted],[...]]} — trace is the execution log in order; put 1 as the third element on steps that went wrong. If status is "fail", also include "fix": one sentence describing the design change that makes it pass.`;

  const out = await claudeJSON(prompt, { maxTokens: 1500 });
  if (out.error) return res.status(502).json({ error: out.error });

  // Persist when signed in and tied to a project
  const projectId = String(b.project_id || '');
  if (auth.user && projectId) {
    fetch(`${process.env.SUPABASE_URL}/rest/v1/test_runs`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        project_id: projectId,
        scenario,
        status: out.json.status === 'pass' ? 'pass' : 'fail',
        trace: out.json.trace || null,
        fix: out.json.fix || null
      })
    }).catch(() => {});
  }

  res.status(200).json(out.json);
};
