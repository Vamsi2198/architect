-- Architect 2.0: tables, access rules and demo data.
-- Paste this whole file into Supabase > SQL Editor and run it once.

-- ---------- Tables ----------

-- A client workspace (Acme Insurance, Northwind Retail, ...)
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Who is in which workspace, and what they do there
create table members (
  workspace_id uuid references workspaces on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null check (role in ('define', 'build', 'approve')),
  primary key (workspace_id, user_id)
);

-- An app being built. The blueprint (screens, agents, data, connections) is stored as JSON.
create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces on delete cascade,
  name text not null,
  framework text not null default 'LangGraph',
  blueprint jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Changes proposed through chat: pending, kept, or undone
create table changes (
  id bigint primary key,
  project_id uuid references projects on delete cascade,
  text text not null,
  status text not null check (status in ('pending', 'kept', 'undone')),
  created_at timestamptz default now()
);

-- Comments pinned on the preview
create table comments (
  id bigint generated always as identity primary key,
  project_id uuid references projects on delete cascade,
  client_id bigint,
  target text,
  body text not null,
  author_name text,
  created_at timestamptz default now()
);
create unique index comments_client_id on comments (project_id, client_id);

-- One sign-off record per project
create table approvals (
  project_id uuid primary key references projects on delete cascade,
  status text not null default 'none' check (status in ('none', 'requested', 'approved', 'changes')),
  updated_at timestamptz default now()
);

-- ---------- Access rules (row level security) ----------
-- Everyone can only see and edit rows in workspaces they belong to.

create or replace function is_member(ws uuid) returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from members where workspace_id = ws and user_id = auth.uid());
$$;

create or replace function project_workspace(p uuid) returns uuid
language sql security definer set search_path = public as $$
  select workspace_id from projects where id = p;
$$;

alter table workspaces enable row level security;
alter table members    enable row level security;
alter table projects   enable row level security;
alter table changes    enable row level security;
alter table comments   enable row level security;
alter table approvals  enable row level security;

create policy "read my workspaces" on workspaces for select using (is_member(id));
create policy "read my memberships" on members for select using (user_id = auth.uid());

create policy "members use projects" on projects for all
  using (is_member(workspace_id)) with check (is_member(workspace_id));
create policy "members use changes" on changes for all
  using (is_member(project_workspace(project_id))) with check (is_member(project_workspace(project_id)));
create policy "members use comments" on comments for all
  using (is_member(project_workspace(project_id))) with check (is_member(project_workspace(project_id)));
create policy "members use approvals" on approvals for all
  using (is_member(project_workspace(project_id))) with check (is_member(project_workspace(project_id)));

-- ---------- Demo data for every new user ----------
-- Called by the app right after sign-in. Creates three client workspaces
-- and the claims project the first time; returns the project id every time.

create or replace function ensure_demo_workspace() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ws uuid;
  pid uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select p.id into pid
  from projects p join members m on m.workspace_id = p.workspace_id
  where m.user_id = auth.uid()
  order by p.created_at
  limit 1;

  if pid is not null then
    return pid;
  end if;

  insert into workspaces (name) values ('Acme Insurance') returning id into ws;
  insert into members values (ws, auth.uid(), 'build');
  insert into projects (workspace_id, name) values (ws, 'Claims triage agent') returning id into pid;
  insert into approvals (project_id) values (pid);
  insert into comments (project_id, target, body, author_name)
    values (pid, 'CLM-2041', 'Can we show the policy limit next to the claim amount?', 'Priya S');

  insert into workspaces (name) values ('Northwind Retail') returning id into ws;
  insert into members values (ws, auth.uid(), 'define');

  insert into workspaces (name) values ('Personal sandbox') returning id into ws;
  insert into members values (ws, auth.uid(), 'build');

  return pid;
end;
$$;

grant execute on function ensure_demo_workspace() to authenticated;

-- ---------- Usage (credits) ----------
-- One row per user per month. The API charges a credit before each model call,
-- so a signed-in user can never spend more than the monthly cap.

create table usage (
  user_id uuid references auth.users on delete cascade,
  month text not null,
  drafts int not null default 0,
  primary key (user_id, month)
);

alter table usage enable row level security;

create policy "read my usage" on usage for select
  using (user_id = auth.uid());

-- Atomically adds one credit and returns true while the user is under the cap.
create or replace function use_credit(p_cap integer) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  m text := to_char(now(), 'YYYY-MM');
  n int;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  insert into usage (user_id, month, drafts) values (auth.uid(), m, 1)
  on conflict (user_id, month) do update set drafts = usage.drafts + 1
  returning drafts into n;
  return n <= p_cap;
end;
$$;

grant execute on function use_credit(integer) to authenticated;

-- ---------- Test runs (real results from /api/test) ----------
create table test_runs (
  id bigint generated always as identity primary key,
  project_id uuid references projects on delete cascade,
  scenario text not null,
  status text not null check (status in ('pass','fail','running')),
  trace jsonb,
  fix text,
  created_at timestamptz default now()
);

alter table test_runs enable row level security;

create policy "members use test_runs" on test_runs for all
  using (is_member(project_workspace(project_id))) with check (is_member(project_workspace(project_id)));

-- ---------- Deployments (real, from /api/publish) ----------
create table deployments (
  id bigint generated always as identity primary key,
  project_id uuid references projects on delete cascade,
  env text not null check (env in ('staging','production')),
  url text not null,
  status text not null default 'live',
  detail text,
  created_at timestamptz default now()
);

alter table deployments enable row level security;

create policy "members use deployments" on deployments for all
  using (is_member(project_workspace(project_id))) with check (is_member(project_workspace(project_id)));

-- ---------- Coding-agent connection events (from /api/mcp calls) ----------
create table connection_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade,
  tool text not null,
  detail text,
  ok boolean default true,
  created_at timestamptz default now()
);

alter table connection_events enable row level security;

create policy "read my connection events" on connection_events for select
  using (user_id = auth.uid());
