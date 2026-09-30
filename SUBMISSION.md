# Architect 2.0 — Submission Answers

Ready-to-paste answers for the form at hiring.lyzrarchitect.space.
Personal questions are marked **[FILL IN]**.

---

## Section 2 — Details of your project submission

**Deployed URL**
```
[FILL IN — your Render URL, e.g. https://architect-xxxx.onrender.com]
```
The app deploys automatically from GitHub on every push. If the deploy shows
`ENOENT: .env`, set these environment variables in the Render dashboard
(Settings → Environment): `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`ANTHROPIC_API_KEY`, `ALLOW_ANONYMOUS_DRAFT=true` (for the demo; remove in
production), then restart the service.

**GitHub repository**
```
https://github.com/Vamsi2198/architect
```
Public, includes `ARCHITECTURE.md` (the architecture write-up with the
Mermaid diagram) at the repo root.

**Architecture diagram**
The diagram lives in `ARCHITECTURE.md` as a Mermaid block (renders on
GitHub). For the upload field, export it: open the repo on GitHub →
`ARCHITECTURE.md` → screenshot the diagram, or paste the Mermaid source into
mermaid.live and download PNG/PDF.

**Describe your architecture (.md file)**
```
ARCHITECTURE.md
```
Already in the repo root. Covers sandboxing, the agent harness, the proxy,
model-agnosticism, GitHub integration, deployment and scaling, plus a
prompt-to-live-app walkthrough.

---

## Section 3 — Just a few more important questions

### Why would a non-technical user pick your platform?

```
- One sentence in, working app out. They describe the app in plain language and watch the blueprint draw itself — no prompts to engineer, no code to read.
- A "detail dial", not two products. The same project is plain English for them and real code for their developer. Nothing forks, nothing gets lost in translation.
- They approve, not build. The Test stage turns their description into concrete scenarios, permissions show exactly what the agent can touch, and production waits for their sign-off.
- Clients don't need accounts. Review links and preview comments work for approvers without sign-up.
- Agents fail differently from screens. Built-in scenario testing and a fix loop means the fortieth user doesn't break what the demo showed.
```

### Why would a technical user pick your platform?

```
- Claude Code / Cursor / Codex keep writing the code — Architect is where that work gets tested, permissioned and shipped, not replaced. A real MCP endpoint lets their agent read the blueprint, run scenarios and publish apps.
- Framework-agnostic by design: LangGraph, CrewAI, OpenAI Agents SDK, Google ADK or bring-your-own. The blueprint is the contract, not the framework.
- Permission surface is explicit: every connection is classified read vs write/send/delete, and anything state-changing needs human review before production.
- Production is a gate, not a button: passing scenarios, reviewed permissions and sign-off are enforced in the deploy flow.
- Import an existing repo and keep working: Architect scans the codebase and turns it into an editable blueprint, so legacy projects get the same test-and-ship pipeline.
- Architecture that scales: stateless API, server-side key proxy, per-user credit caps, sandboxed execution and a model-agnostic router — documented in ARCHITECTURE.md.
```

### How comfortable are you with... (1–5)

- Working directly with multiple clients — **[FILL IN — suggested: 4]**
- Understanding any codebase's architecture and working on it — **[FILL IN — suggested: 4]**
- GTM and marketing strategy — **[FILL IN — suggested: 3]**

### Do you have formal experience working as a software engineer?

**[FILL IN — Yes/No]**

### Expected CTC

**[FILL IN — LPA]**

### How much does work-life balance matter to you?

**[FILL IN — write 2–3 honest lines]**
