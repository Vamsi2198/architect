// Imports a public GitHub repository: reads its file tree via the GitHub API
// (no token needed for public repos), pulls key manifests, and asks Claude to
// map the repo into an Architect blueprint.
const { authenticate, requireAnthropic, claudeJSON } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const auth = await authenticate(req, res);
  if (!auth) return;
  if (!requireAnthropic(res)) return;

  const b = req.body || {};
  const repo = String(b.repo || '').trim()
    .replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '').slice(0, 100);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return res.status(400).json({ error: 'Give the repo as owner/name or a github.com URL' });
  }

  const headers = { 'User-Agent': 'architect-import' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const treeRes = await fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`, { headers });
  if (!treeRes.ok) {
    const msg = treeRes.status === 404
      ? 'Repo not found. Public repos only (set GITHUB_TOKEN for private ones).'
      : `GitHub error ${treeRes.status} (rate limit?)`;
    return res.status(502).json({ error: msg });
  }
  const tree = await treeRes.json();
  const files = (tree.tree || []).filter(x => x.type === 'blob').map(x => x.path);

  // Read the manifest files that tell us what the project is
  const manifestPaths = files.filter(f => /(^|\/)(package\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod)$/.test(f)).slice(0, 4);
  const manifests = [];
  for (const f of manifestPaths) {
    const r = await fetch(`https://raw.githubusercontent.com/${repo}/HEAD/${f}`);
    if (r.ok) manifests.push({ file: f, content: (await r.text()).slice(0, 600) });
  }

  const count = ext => files.filter(f => f.endsWith(ext)).length;
  const agentFiles = files.filter(f => /agent|crew|graph|llm|prompt|chain/i.test(f)).slice(0, 12);
  const topDirs = [...new Set(files.map(f => f.split('/')[0]))].slice(0, 10);

  const stack = {
    repo,
    files: files.length,
    js: count('.js') + count('.jsx') + count('.ts') + count('.tsx'),
    python: count('.py'),
    manifests: manifestPaths,
    agentFiles,
    topDirs
  };

  const prompt = `You are mapping an existing software repository to an app blueprint. From the facts below, produce a blueprint as JSON only: {"name": short app name (max 5 words), "lanes":[{"id":"screens","items":[{"title","plain","code"}]},{"id":"agents","items":[...]},{"id":"data","items":[...]},{"id":"conn","items":[...]}]}. Two items per lane max, only for parts that plausibly exist. "plain" is one plain-English sentence; "code" is 3-5 lines matching what the repo actually uses (React for screens if it has a JS frontend, Python Agent(...) if it has agents, SQL create table for data, connect(...) for connections). If a lane has nothing real, return an empty items array for it.

Repo: ${repo}
Top-level: ${topDirs.join(', ')} (${files.length} files; ${stack.js} JS/TS, ${stack.python} Python)
Manifests:
${manifests.map(m => `--- ${m.file}\n${m.content}`).join('\n')}
Agent-related files: ${agentFiles.join(', ') || 'none detected'}`;

  const out = await claudeJSON(prompt, { maxTokens: 2000 });
  if (out.error) return res.status(502).json({ error: out.error });

  res.status(200).json({ stack, blueprint: out.json });
};
