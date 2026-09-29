# Architect 2.0

One product for two kinds of users: people who describe what they want in plain
language, and developers who want the code. A single detail dial per person
(Plain or Code), not two separate modes.

The flow runs from sign-in to deploy: pick a client workspace, describe an app
or import a repo or connect your own coding agent, shape the blueprint, preview
it, test the agents, get sign-off, and ship.

## What's real

| Part | Status |
|---|---|
| Google sign-in and email sign-in links | Real (Supabase Auth) |
| Workspaces, roles, projects, blueprint, proposed changes, comments, approvals | Real, saved in Postgres with row level security |
| Drafting a blueprint from a description | Real (Claude, through `/api/draft`, per-user monthly credit cap) |
| Agent test scenarios | Real — `/api/test` simulates the design with Claude and returns step traces; "Ask Architect to fix this" proposes a design fix via `/api/fix` |
| Repo import | Real for public GitHub repos — `/api/import` reads the file tree and manifests and maps the repo to a blueprint (set `GITHUB_TOKEN` for private repos) |
| Deploys | Real — `/api/publish` generates a complete runnable app from the blueprint and serves it at `/app/<slug>/` |
| Coding-agent connection | Real MCP endpoint at `/api/mcp` (tools: get_blueprint, list_scenarios, run_scenario, publish) — add it to Claude Code, Cursor, or Codex |

If the environment variables aren't set, the app still runs as a local demo
with sample data and AI calls disabled. Opening `index.html` straight from
disk does the same.

## Files

```
index.html            The page shell: styles and markup only
app.js                The whole interface: screens, actions, Supabase sync
dev-server.js         The web server: static files, /api/* routes, /app/* generated apps
api/_lib.js           Shared auth + Claude helpers for the API handlers
api/config.js         Public Supabase URL/key + credit cap for the browser
api/draft.js          Description → blueprint JSON (Claude)
api/test.js           Scenario → simulated execution trace, pass/fail (Claude)
api/fix.js            Failing scenario → proposed design fix (Claude)
api/import.js         GitHub repo → stack facts + blueprint (GitHub API + Claude)
api/publish.js        Blueprint → generated runnable app, written to apps/
api/mcp.js            MCP (JSON-RPC) endpoint for coding agents
supabase/schema.sql   Tables, row level security, demo data, use_credit()
vercel.json           Security headers (kept if you deploy to Vercel instead)
.env.example          The environment variables you need
```

## Database tables

| Table | Holds |
|---|---|
| `workspaces` | One per client |
| `members` | Who is in which workspace, and their role (define, build, approve) |
| `projects` | Each app, with its blueprint as JSON |
| `changes` | Changes proposed through chat, and whether they were kept or undone |
| `comments` | Comments pinned on the preview |
| `approvals` | The sign-off status for each project |
| `usage` | AI credits spent per user per month (drives the meter and the cap) |
| `test_runs` | Real scenario results with traces |
| `deployments` | Real generated-app deployments |
| `connection_events` | MCP tool calls from connected coding agents |

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Project Settings → API |
| `SUPABASE_ANON_KEY` | yes | anon public key |
| `ANTHROPIC_API_KEY` | yes | server only, never reaches the browser |
| `ANTHROPIC_MODEL` | no | defaults to claude-haiku-4-5-20251001 |
| `CREDIT_CAP_MONTHLY` | no | per-user monthly AI credits, default 100 |
| `GITHUB_TOKEN` | no | only for importing private repos |
| `ALLOW_ANONYMOUS_DRAFT` | no | **danger flag** — see below |

## Run locally

```
npm start          # or: node dev-server.js
```

Then open http://localhost:3000. Put your variables in `.env` (git-ignored).
Without a `.env`, the server still runs — it just has no keys.

## Deploy on Render

1. Push this folder to a GitHub repo.
2. Render → **New → Web Service** → connect the repo.
3. Build command: leave empty (there is nothing to build).
4. Start command: `node dev-server.js`
5. Add the environment variables above (Render → your service → Environment).
6. Open the `*.onrender.com` URL.

## The anonymous flag (read this)

`ALLOW_ANONYMOUS_DRAFT=true` lets the AI endpoints work **without sign-in** —
skipping auth and the credit cap. Use it only for local development or a
private preview, and keep a low spend limit on your Anthropic key. Before real
users: finish the Google/email sign-in setup, then **delete this flag** so every
AI call is tied to a signed-in user and the monthly cap.

## Set up sign-in (optional until you need saving)

1. **Supabase:** create a project, paste all of `supabase/schema.sql` into the
   SQL Editor, run it.
2. **Email sign-in** works out of the box. **Google:** create an OAuth client
   (Web) in Google Cloud with redirect URI
   `https://<project>.supabase.co/auth/v1/callback`, publish the consent screen,
   and paste the client ID/secret into Supabase → Authentication → Providers →
   Google.
3. Add your site's URL (e.g. `http://localhost:3000`, your `*.onrender.com`
   URL) to Supabase → Authentication → URL Configuration → Redirect URLs.

The GitHub and SSO buttons on the sign-in screen are placeholders — only
Google and email work.
