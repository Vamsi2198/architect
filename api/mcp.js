// Minimal MCP (Model Context Protocol) endpoint so coding agents like
// Claude Code, Cursor and Codex can drive Architect: list scenarios, run them,
// fetch the blueprint, and publish the app. JSON-RPC over HTTP POST.
const { authenticate, requireAnthropic, claudeJSON } = require('./_lib');

const TOOLS = [
  {
    name: 'get_blueprint',
    description: 'Get the current Architect project blueprint (screens, agents, data, connections)',
    inputSchema: { type: 'object', properties: { project_id: { type: 'string' } } }
  },
  {
    name: 'list_scenarios',
    description: 'List the test scenarios for the project',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'run_scenario',
    description: 'Run one test scenario against the blueprint and get the trace',
    inputSchema: {
      type: 'object',
      properties: {
        scenario: { type: 'string', description: 'The scenario to test' },
        blueprint: { type: 'array', description: 'Blueprint lanes (from get_blueprint) — omit to use the demo blueprint' }
      },
      required: ['scenario']
    }
  },
  {
    name: 'publish',
    description: 'Generate and publish a runnable app from the blueprint',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        env: { type: 'string', enum: ['staging', 'production'] }
      },
      required: ['name']
    }
  }
];

const DEMO_SCENARIO = 'Routes a standard claim to the right adjuster';

async function runScenario(scenario, blueprint) {
  const prompt = `You are a rigorous test harness for agentic business apps. Simulate executing this design step by step for the scenario, honouring every rule in the blueprint. Mark steps bad where the design would fail.

Blueprint (JSON):
${JSON.stringify(blueprint || []).slice(0, 6000)}

Scenario: ${scenario}

Reply with JSON only: {"status":"pass" or "fail","trace":[["step","detail",0 or omitted]]}`;
  return claudeJSON(prompt, { maxTokens: 1500 });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const auth = await authenticate(req, res);
  if (!auth) return;

  const rpc = req.body || {};
  const send = result => res.status(200).json({ jsonrpc: '2.0', id: rpc.id ?? null, result });
  const sendErr = (code, message) => res.status(200).json({ jsonrpc: '2.0', id: rpc.id ?? null, error: { code, message } });

  const record = (tool, detail, ok = true) => {
    if (!auth.user) return;
    fetch(`${process.env.SUPABASE_URL}/rest/v1/connection_events`, {
      method: 'POST',
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${auth.token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ user_id: auth.user.id, tool, detail: String(detail).slice(0, 300), ok })
    }).catch(() => {});
  };

  switch (rpc.method) {
    case 'initialize':
      return send({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'architect', version: '1.0.0' }
      });

    case 'ping':
      return send({});

    case 'tools/list':
      return send({ tools: TOOLS });

    case 'tools/call': {
      const name = rpc.params && rpc.params.name;
      const args = (rpc.params && rpc.params.arguments) || {};
      if (!requireAnthropic(res)) return;
      if (name === 'get_blueprint') {
        record('get_blueprint', args.project_id || 'demo');
        return send({ content: [{ type: 'text', text: JSON.stringify(args.blueprint || []) }] });
      }
      if (name === 'list_scenarios') {
        record('list_scenarios', 'demo scenarios');
        return send({ content: [{ type: 'text', text: JSON.stringify([DEMO_SCENARIO, 'Escalates claims over the threshold', 'Refuses to share another holder’s policy']) }] });
      }
      if (name === 'run_scenario') {
        if (!args.scenario) return sendErr(-32602, 'scenario is required');
        record('run_scenario', args.scenario);
        const out = await runScenario(String(args.scenario).slice(0, 600), args.blueprint);
        if (out.error) return sendErr(-32000, out.error);
        return send({ content: [{ type: 'text', text: JSON.stringify(out.json) }] });
      }
      if (name === 'publish') {
        if (!args.name) return sendErr(-32602, 'name is required');
        record('publish', args.name);
        const out = await claudeJSON(
          `Generate a complete self-contained prototype web app (single HTML file, inline CSS/JS, mock data, no external deps) from this blueprint, under 300 lines. Reply with JSON only: {"index.html":"<the file>"}\n\nBlueprint: ${JSON.stringify(args.blueprint || []).slice(0, 5000)}`,
          { maxTokens: 8000, timeoutMs: 90000 }
        );
        if (out.error) return sendErr(-32000, out.error);
        return send({ content: [{ type: 'text', text: JSON.stringify(out.json) }] });
      }
      return sendErr(-32601, `Unknown tool: ${name}`);
    }

    default:
      return sendErr(-32601, `Unknown method: ${rpc.method}`);
  }
};
