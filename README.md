# Architect 2.0

A redesign of Lyzr Architect for two kinds of users at once: people who describe what they want in plain language, and developers who want the code. The idea is one product with a detail dial per person (Plain or Code), not two separate modes.

The flow runs from sign-in to deploy: pick a client workspace, describe an app or import a repo or connect your own coding agent, shape the blueprint, preview it, test the agents, get sign-off, and ship.

## What's real and what's a dummy flow

| Part | Status |
|---|---|
| Google sign-in and email sign-in links | Real (Supabase Auth) |
| Workspaces, roles, projects, blueprint, proposed changes, comments, approvals | Real, saved in Postgres with row level security |
| Drafting a blueprint from a description | Real (Claude, through `/api/draft`, with a per-user monthly credit cap) |
| Agent tests, repo import, coding-agent connection, deploys | Dummy flows with sample data |

The GitHub and SSO buttons on the sign-in screen are placeholders shown for the design — only Google and email work.

If the environment variables aren't set, the app still runs as a local demo with nothing saved. Opening `index.html` straight from disk does the same.

## Files

```
index.html            The page shell: styles and markup only
app.js                The whole interface logic: screens, actions, Supabase sync
api/config.js         Hands the browser the public Supabase URL and key, plus the credit cap
api/draft.js          Turns a description into a blueprint using Claude (signed-in users only,
                      per-user monthly credit cap, 30s timeout)
supabase/schema.sql   Tables, access rules, the demo data every new user gets, and the
                      use_credit() function that enforces the monthly cap
vercel.json           Security headers (CSP, frame denial, nosniff) for every route
.env.example          The environment variables you need
```

## Where things live

- Colours and spacing: the variables at the top of `<style>` in `index.html`
- Sample data in `app.js`: `seedLanes()`, `seedTests()`, `seedPerms()`
- Screens in `app.js`: one function each (`home()`, `blueprint()`, `preview()`, `test()`, `approve()`, `deploy()`, ...)
- Connections between blueprint parts: the `links` on each block, drawn by `drawLines()`
- Every button: `act()`, one `case` per action
- Saving to the database: `sync()`, called after every action
- Loading after sign-in: `afterLogin()` and `loadProject()`

## Database tables

| Table | Holds |
|---|---|
| `workspaces` | One per client |
| `members` | Who is in which workspace, and their role (define, build, approve) |
| `projects` | Each app, with its blueprint as JSON |
| `changes` | Changes proposed through chat, and whether they were kept or undone |
| `comments` | Comments pinned on the preview |
| `approvals` | The sign-off status for each project |
| `usage` | AI credits spent per user per month (drives the sidebar meter and the cap in `/api/draft`) |

## Set up and deploy

1. **Supabase:** create a project. In the SQL Editor, paste all of `supabase/schema.sql` and run it.
2. **Google sign-in:** in Google Cloud, create an OAuth client (Web application). Add `https://<your-project>.supabase.co/auth/v1/callback` as a redirect URI. Publish the consent screen so any Google account can sign in. In Supabase, go to Authentication, then Providers, then Google, and paste in the client ID and secret.
3. **Anthropic:** create an API key and set a monthly spend limit.
4. **GitHub:** push this folder to a public repo.
5. **Vercel:** import the repo. Add the variables from `.env.example`. Deploy.
6. **Back in Supabase:** under Authentication URL settings, set the Site URL to your Vercel URL and add it to the redirect URLs.
7. **Back in Google Cloud:** add your Vercel URL to the authorized JavaScript origins.
8. Open the site in a private window and sign in with a fresh Google account.

## Run locally

With the Vercel CLI: `npx vercel dev`, then open http://localhost:3000. Put your variables in `.env.local` (it's git-ignored), and add `http://localhost:3000` to the Supabase redirect URLs.

Without any setup: open `index.html` in a browser for the demo version.
