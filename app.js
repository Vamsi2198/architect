const MARK='<svg viewBox="0 0 26 26" aria-hidden="true"><rect x="1" y="1" width="24" height="24" rx="6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 19 L13 6 L19 19 M9.6 14 H16.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const I={
 git:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="9" r="2.5"/><path d="M6 8.5v7M18 11.5c0 3-3 4-7.5 4.5"/></svg>',
 term:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>',
 menu:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
 send:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 check:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
 x:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 g:'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 0 1-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.2 13.6a6 6 0 0 1 0-3.8V7.1H2.7a10 10 0 0 0 0 9.2z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 2.7 7.1l3.5 2.7C7 7.7 9.3 5.9 12 5.9z"/></svg>'
};
const CLIENTS={acme:{name:'Acme Insurance',ab:'AI',projects:3,role:'build'},northwind:{name:'Northwind Retail',ab:'NR',projects:2,role:'define'},personal:{name:'Personal sandbox',ab:'PS',projects:1,role:'build'}};
const ROLE_LABEL={define:'Defining',build:'Building',approve:'Approving'};
const seedLanes=()=>[
 {id:'screens',name:'Screens people use',items:[
  {id:'detail',kind:'Screen',title:'Claim detail',plain:'One claim with the original email, the matched policy, and why the agent routed it where it did.',code:'export default function Claim({ id }) {\n  const c = useClaim(id)\n  return <ClaimView claim={c} trace={c.agentTrace} />\n}'},
  {id:'inbox',kind:'Screen',title:'Claims inbox',plain:'Adjusters see new claims sorted by urgency, with the route the agent suggests.',code:'export default function Inbox() {\n  const claims = useClaims({ sort: "urgency" })\n  return <ClaimList items={claims} showRoute />\n}'}]},
 {id:'agents',name:'Agents',items:[
  {id:'summary',kind:'Agent',links:[['detail','adds a summary']],title:'Summary agent',plain:'Writes a short summary of each claim so the adjuster can decide in under a minute.',code:'summary = Agent(\n  framework="langgraph",\n  output=ClaimSummary,\n  max_words=60,\n)'},
  {id:'triage',kind:'Agent',links:[['inbox','suggests a route'],['summary','hands off each claim']],title:'Triage agent',plain:'Reads each claim email, finds the policy, and routes it to an adjuster. Claims over ₹5L go to a senior adjuster.',code:'triage = Agent(\n  framework="langgraph",\n  tools=[read_email, policy_lookup, route_claim],\n  rules={"escalate_over_inr": 500000},\n)'}]},
 {id:'data',name:'Data',items:[
  {id:'policies',kind:'Table',links:[['summary','gives the cover limit']],title:'Policies',plain:'Every policy with the holder, cover limit, and status.',code:'create table policies (\n  id uuid primary key,\n  holder text,\n  limit_inr int,\n  status text\n);'},
  {id:'claimsT',kind:'Table',links:[['summary','gives claim history']],title:'Claims',plain:'Each claim with its amount, where it was routed, and who picked it up.',code:'create table claims (\n  id uuid primary key,\n  policy_id uuid references policies,\n  amount_inr int,\n  routed_to text\n);'}]},
 {id:'conn',name:'Connections',items:[
  {id:'gmail',kind:'Connection',links:[['triage','sends new claims']],title:'Claims mailbox',plain:'Reads claims@acme.in. It can read but never send.',code:'connect("gmail",\n  inbox="claims@acme.in",\n  scope="read")'},
  {id:'papi',kind:'Connection',links:[['triage','answers policy lookups']],title:'Policy API',plain:'Acme’s policy system, used to look up cover and status.',code:'connect("rest",\n  base_url=env.POLICY_API,\n  auth="oauth")'}]}
];
const seedTests=()=>[
 {id:1,name:'Routes a standard motor claim',s:'pass'},
 {id:2,name:'Refuses to share another holder’s policy',s:'pass'},
 {id:3,name:'Escalates a ₹6L claim to a senior adjuster',s:'fail',trace:[['read_email','ok'],['policy_lookup','POL-88213, limit ₹10L'],['parse_amount','"6,00,000" read as 60000',1],['route_claim','adjuster_2, no escalation',1]],fix:'Triage agent now reads Indian digit grouping (6,00,000) correctly.'},
 {id:4,name:'Asks for a policy number when it’s missing',s:'fail',trace:[['read_email','ok'],['policy_lookup','no policy number found',1],['route_claim','routed to adjuster_1 anyway',1]],fix:'Triage agent now replies asking for the policy number instead of guessing.'},
 {id:5,name:'Ignores a spam email in the claims inbox',s:'pass'},
 {id:6,name:'Summarises a claim in under 60 words',s:'pass'},
 {id:7,name:'Handles a Hindi-language claim email',s:'pass'},
 {id:8,name:'Doesn’t route to an adjuster on leave',s:'pass'},
 {id:9,name:'Flags duplicate claims on one policy',s:'pass'}
];
const seedPerms=()=>[
 {tool:'read_email',what:'Read the claims mailbox',access:'Read only',ok:true},
 {tool:'policy_lookup',what:'Look up a policy',access:'Read only',ok:true},
 {tool:'route_claim',what:'Assign a claim to an adjuster',access:'Writes to Claims',ok:true},
 {tool:'reply_email',what:'Reply to the claimant',access:'Sends email',ok:false}
];
let S={view:'tour',role:'build',client:'acme',notes:false,nav:false,dial:'plain',stage:'blueprint',sel:null,
 lanes:seedLanes(),revealed:99,drafting:false,changes:[],tests:seedTests(),open:3,perms:seedPerms(),
 approval:'none',env:'staging',deploying:false,log:[],live:{staging:false,production:false},credits:{used:0,cap:100},
 imp:{step:1,repo:null,scan:[]},conn:{tool:'claude',state:'waiting',feed:[]},
 pv:{device:'desktop',comment:false,pins:[]},comments:[{who:'Priya S',role:'Client lead',text:'Can we show the policy limit next to the claim amount?',on:'CLM-2041'}],
 project:'Claims triage agent',framework:'LangGraph',prompt:'',drawn:new Map(),drawnInit:false};
const app=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.remove('show'),2600)}
const passCount=()=>S.tests.filter(t=>t.s==='pass').length;
const allPass=()=>S.tests.every(t=>t.s==='pass');
const permsOk=()=>S.perms.every(p=>p.ok);
const note=t=>`<div class="note">${t}</div>`;

/* ---------- pre-app screens ---------- */
function tour(){return `<div class="solo"><div class="solo-inner">
 <div class="mark">${MARK} Architect</div>
 <div class="tour-draw" aria-hidden="true"><svg viewBox="0 0 800 120" preserveAspectRatio="none">
  <g fill="none" stroke="var(--draft)" stroke-width="1.4">
   <rect x="40" y="38" width="120" height="44" rx="8"/><rect x="250" y="38" width="120" height="44" rx="8"/><rect x="460" y="38" width="120" height="44" rx="8" stroke-dasharray="5 4"/><rect x="670" y="38" width="100" height="44" rx="8"/>
   <path d="M160 60H250M370 60H460M580 60H670"/></g>
  <g font-family="IBM Plex Mono,monospace" font-size="12" fill="var(--graphite)"><text x="58" y="64">describe</text><text x="274" y="64">blueprint</text><text x="493" y="64">test</text><text x="692" y="64">ship</text></g></svg></div>
 <h1 style="margin-top:28px;max-width:640px">Walk through Architect as the person you'd be on a real project</h1>
 <p class="muted" style="margin-top:10px;max-width:600px">Each role starts somewhere different. You can switch roles any time from the top bar, and turn on design notes to see why each screen works the way it does.</p>
 <div class="roles">
  <button class="role" data-a="startRole" data-v="define"><h3>I'm defining what to build</h3><span class="who">Business analysts, consultants, domain experts</span><span class="small">Describe an app in plain language and shape it without touching code.</span><span class="starts">Starts on the home screen</span></button>
  <button class="role" data-a="startRole" data-v="build"><h3>I'm building it</h3><span class="who">Developers and solution engineers</span><span class="small">Import a repo or connect Claude Code, Cursor, or Codex, then test and ship agents.</span><span class="starts">Starts on an existing project</span></button>
  <button class="role" data-a="startRole" data-v="approve"><h3>I'm approving it</h3><span class="who">Client sponsors and delivery leads</span><span class="small">Review what's about to ship, leave comments, and sign off on production.</span><span class="starts">Starts on approvals</span></button>
 </div>
 <p class="small muted" style="margin-top:22px">Or <a href="#" data-a="go" data-v="signin" style="color:var(--ink);font-weight:600">start from sign-in</a> to see the full flow.</p>
</div></div>`}
function signin(){return `<div class="solo"><div class="solo-inner signin">
 <div class="mark">${MARK} Architect</div>
 <h2 style="margin-top:28px">Sign in to Architect</h2>
 <p class="muted small" style="margin-top:6px">Use the account your team already works in.</p>
 <div class="stack" style="margin-top:22px">
  <button class="btn oauth" data-a="signedIn" data-v="google">${I.g} Continue with Google</button>
  <button class="btn oauth" data-a="signedIn" data-v="github">${I.git} Continue with GitHub</button>
  <button class="btn oauth" data-a="signedIn"><span style="width:18px;text-align:center">⌘</span> Use your company login (SSO)</button>
 </div>
 <div class="divider">or with email</div>
 <label class="small" for="em">Work email</label>
 <input class="input" id="em" type="email" placeholder="you@company.com" style="margin-top:6px">
 <p id="emErr" class="small" style="color:var(--fail);margin-top:6px;display:none">Enter a work email to get a sign-in link.</p>
 <button class="btn ink" style="width:100%;margin-top:12px" data-a="emailIn">Send sign-in link</button>
 <p class="tiny muted" style="margin-top:18px">Developers can also sign in from the terminal with <code>npx @architect/cli login</code>.</p>
</div></div>`}
function pick(){return `<div class="solo"><div class="solo-inner" style="max-width:560px">
 <div class="mark">${MARK} Architect</div>
 <h2 style="margin-top:28px">Which client are you working on?</h2>
 <p class="muted small" style="margin-top:6px">Each client gets its own workspace, with separate projects, secrets, and people. Your role can differ per client.</p>
 ${note('Consulting teams work across many clients at once. Separate workspaces mean an Acme secret can never end up in a Northwind deploy.')}
 <div class="list" style="margin-top:18px">${Object.entries(CLIENTS).map(([k,c])=>`<div class="item click" data-a="pickClient" data-v="${k}" tabindex="0" role="button"><div class="row"><span class="pav" style="border-radius:8px;background:var(--ink);color:var(--on-ink)">${c.ab}</span><div><div style="font-weight:600">${c.name}</div><div class="small muted">${c.projects} projects</div></div></div><span class="chip">${ROLE_LABEL[c.role]}</span></div>`).join('')}</div>
 <button class="btn" style="margin-top:16px" data-a="toast" data-v="New client workspace created (prototype)">Add a client workspace</button>
</div></div>`}

/* ---------- shell ---------- */
function shell(inner,crumb){
 const c=CLIENTS[S.client];const nApp=(S.approval==='requested'?1:0)+1;
 const nav=(v,label,extra='')=>`<a class="${S.view===v?'on':''}" data-a="go" data-v="${v}"><span>${label}</span>${extra}</a>`;
 return `<div class="app ${S.notes?'notes-on':''}">
 <div class="scrim ${S.nav?'open':''}" data-a="nav"></div>
 <aside class="rail ${S.nav?'open':''}">
  <div class="mark">${MARK} Architect</div>
  <button class="ws" data-a="go" data-v="pick"><span class="av">${c.ab}</span><span style="flex:1;min-width:0"><span style="display:block;font-weight:600;font-size:14px">${c.name}</span><span class="tiny muted">Switch client</span></span></button>
  <nav class="nav">
   ${nav('home','Home')}
   ${nav('approvals','Approvals',`<span class="chip ${nApp>1?'warn':''}">${nApp}</span>`)}
   ${nav('deploys','Deployments')}
   ${nav('settings','Settings')}
   <div class="nav-h">Projects</div>
   <a class="${S.view==='project'?'on':''}" data-a="openProject"><span>${esc(S.project)}</span><span class="dot ${allPass()?'pass':'fail'}"></span></a>
   <a data-a="toast" data-v="Opens Policy Q&A bot (prototype)"><span>Policy Q&amp;A bot</span><span class="dot warn"></span></a>
   <a data-a="toast" data-v="Opens Adjuster dashboard (prototype)"><span>Adjuster dashboard</span><span class="dot pass"></span></a>
   <div class="nav-h">Start something</div>
   ${nav('import','Import a repo')}
   ${nav('connect','Connect a coding agent')}
  </nav>
  <div class="rail-foot">${DB.user?`<a href="#" class="small muted" data-a="signout" style="display:block;margin-bottom:12px">Sign out</a>`:''}
   ${DB.on&&DB.user?(()=>{const left=Math.max(0,S.credits.cap-S.credits.used);const w=Math.min(100,Math.round(S.credits.used/S.credits.cap*100));return `<div class="small row between"><span>Credits this month</span><span class="muted">${left} left</span></div><div class="meter"><i style="width:${w}%"></i></div>`})():`<div class="small row between"><span>Credits this month</span><span class="muted">1,240 left</span></div><div class="meter"><i style="width:38%"></i></div>`}
   <div class="row" style="margin-top:14px"><span class="pav">${initials(me())}</span><div><div class="small" style="font-weight:600">${esc(me())}</div><div class="tiny muted">${ROLE_LABEL[S.role]} in ${c.name}</div></div></div>
  </div>
 </aside>
 <main class="main">
  <div class="top">
   <button class="btn ghost sm menu-btn" data-a="nav" aria-label="Open menu">${I.menu}</button>
   <div class="crumb">${crumb}</div><div class="spacer"></div>
   <label class="small muted hide-sm" for="roleSel">Viewing as</label>
   <select id="roleSel" class="input" style="width:auto;padding:5px 8px;font-size:13px">
    ${['define','build','approve'].map(r=>`<option value="${r}" ${S.role===r?'selected':''}>${ROLE_LABEL[r]}</option>`).join('')}</select>
   <button class="btn sm ${S.notes?'ink':''}" data-a="notes" aria-pressed="${S.notes}"><span class="hide-sm">Design notes</span><span class="show-sm">Notes</span></button>
  </div>
  <div class="page">${inner}</div>
 </main></div>`}

/* ---------- home ---------- */
function home(){
 const c=CLIENTS[S.client];
 return `<h1>What should we build for ${c.name}?</h1>
 <p class="muted" style="margin-top:6px">Describe it the way you'd explain it to a colleague. You'll get a blueprint to check before anything is built.</p>
 ${note('Three ways in, side by side. Nobody gets sorted into a beginner or pro mode on day one.')}
 <div class="sheet prompt-box" style="margin-top:20px">
  <textarea id="prompt" aria-label="Describe your app" placeholder="A claims triage agent that reads the claims inbox, checks each policy, and routes the claim to the right adjuster">${esc(S.prompt)}</textarea>
  <div class="row between" style="margin-top:10px;flex-wrap:wrap">
   <span class="tiny muted">A first blueprint uses about 40 to 60 credits</span>
   <button class="btn ink" data-a="draft">Draft blueprint ${I.send}</button>
  </div>
 </div>
 <div class="sugs">${['Claims triage agent','Customer onboarding assistant','Renewal reminder workflow','Internal policy Q&A bot'].map(s=>`<button class="btn sm" data-a="sug" data-v="${esc(s)}">${esc(s)}</button>`).join('')}</div>
 <div class="doors">
  <button class="door" data-a="go" data-v="import"><span class="ic">${I.git}</span><span><h3>Import a repo</h3><span class="small muted">Bring an existing project. We map it before changing anything.</span></span></button>
  <button class="door" data-a="go" data-v="connect"><span class="ic">${I.term}</span><span><h3>Connect a coding agent</h3><span class="small muted">Keep working in Claude Code, Cursor, or Codex. Ship from here.</span></span></button>
 </div>
 <div class="home-grid">
  <div><h3 style="margin-bottom:10px">Projects</h3><div class="list">
   <div class="item click" data-a="openProject"><div><div style="font-weight:600">${esc(S.project)}</div><div class="small muted">${S.framework}, edited 2 hours ago</div></div><span class="chip ${allPass()?'pass':'fail'}">${passCount()} of ${S.tests.length} tests</span></div>
   <div class="item"><div><div style="font-weight:600">Policy Q&amp;A bot</div><div class="small muted">CrewAI, edited yesterday</div></div><span class="chip warn">Awaiting approval</span></div>
   <div class="item"><div><div style="font-weight:600">Adjuster dashboard</div><div class="small muted">No agents, edited last week</div></div><span class="chip pass">Live</span></div></div></div>
  <div><h3 style="margin-bottom:10px">Waiting on you</h3><div class="list">
   ${allPass()?'':`<div class="item click" data-a="openStage" data-v="test"><span class="small">${S.tests.length-passCount()} failing tests on ${esc(S.project)}</span><span class="dot fail"></span></div>`}
   <div class="item click" data-a="openStage" data-v="preview"><span class="small">Priya left a comment on the claims inbox</span><span class="dot draft"></span></div>
   ${permsOk()?'':`<div class="item click" data-a="openStage" data-v="test"><span class="small">1 agent permission needs review</span><span class="dot warn"></span></div>`}
  </div></div>
 </div>`}

/* ---------- project ---------- */
function stageDot(k){
 if(k==='blueprint')return S.changes.some(c=>c.status==='pending')?'draft':'pass';
 if(k==='preview')return S.comments.length?'draft':'';
 if(k==='test')return allPass()&&permsOk()?'pass':'fail';
 if(k==='approve')return S.approval==='approved'?'pass':S.approval==='requested'?'warn':'';
 if(k==='deploy')return S.live.production?'pass':S.live.staging?'draft':'';
}
function project(){
 const st=[['blueprint','Blueprint'],['preview','Preview'],['test','Test'],['approve','Approve'],['deploy','Deploy']];
 const body={blueprint,preview,test,approve,deploy}[S.stage]();
 return `<div class="proj-head">
  <h2 style="margin-right:auto">${esc(S.project)}</h2>
  <label class="small muted" for="fw">Agent framework</label>
  <select id="fw" class="input" style="width:auto;padding:6px 8px;font-size:13px">${['LangGraph','CrewAI','Lyzr ADK','OpenAI Agents SDK','Google ADK','Bring your own'].map(f=>`<option ${S.framework===f?'selected':''}>${f}</option>`).join('')}</select>
  <div class="dial" role="group" aria-label="Detail level"><button class="${S.dial==='plain'?'on':''}" data-a="dial" data-v="plain" aria-pressed="${S.dial==='plain'}">Plain</button><button class="${S.dial==='code'?'on':''}" data-a="dial" data-v="code" aria-pressed="${S.dial==='code'}">Code</button></div>
 </div>
 ${note('One dial per person, not per product. A BA stays in plain language; a developer flips to code on the same project. Nothing forks.')}
 <nav class="stages" aria-label="Project stages">${st.map(([k,l],i)=>`<button class="stage ${S.stage===k?'on':''}" data-a="stage" data-v="${k}" aria-current="${S.stage===k}"><span class="n">${i+1}</span>${l}${stageDot(k)?`<span class="dot ${stageDot(k)}"></span>`:''}</button>`).join('')}</nav>
 ${body}`}
function edges(){const out=[];S.lanes.forEach(l=>l.items.forEach(b=>(b.links||[]).forEach(([to,lab])=>{if(findBlock(to))out.push([b.id,to,lab])})));return out}
function autoLinks(){
 const L={};S.lanes.forEach(l=>L[l.id]=l.items);const a=L.agents;if(!a.length)return;
  const last=a[a.length-1];L.conn.forEach(c=>c.links=[[last.id,'feeds']]);
 L.data.forEach(d=>d.links=[[a[0].id,'informs']]);
 if(a.length>1)last.links=[[a[0].id,'hands off to']];
 L.screens.forEach((sc,i)=>{const ag=a[i]||last;ag.links=(ag.links||[]).concat([[sc.id,'shows in']])});
}
function drawLines(){
 const cv=document.querySelector('.canvas');const svg=cv&&cv.querySelector('.wires');if(!svg)return;
 if(innerWidth<=900){svg.innerHTML='';return}
 const box=cv.getBoundingClientRect();let paths='';
 edges().forEach(([a,b,lab])=>{
  const ea=cv.querySelector(`.blk[data-v="${a}"]`),eb=cv.querySelector(`.blk[data-v="${b}"]`);if(!ea||!eb)return;
  const A=ea.getBoundingClientRect(),B=eb.getBoundingClientRect();
  const ax=A.left+A.width/2-box.left,ay=A.top+A.height/2-box.top,bx=B.left+B.width/2-box.left,by=B.top+B.height/2-box.top;
  let x1,y1,x2,y2,d;
  if(A.right<B.left||B.right<A.left){
   x1=(bx>ax?A.right:A.left)-box.left;y1=ay;x2=(bx>ax?B.left-4:B.right+4)-box.left;y2=by;const m=(x1+x2)/2;d=`M${x1} ${y1}C${m} ${y1} ${m} ${y2} ${x2} ${y2}`;
  }else{
   x1=ax;y1=(by>ay?A.bottom:A.top)-box.top;x2=bx;y2=(by>ay?B.top-4:B.bottom+4)-box.top;const m=(y1+y2)/2;d=`M${x1} ${y1}C${x1} ${m} ${x2} ${m} ${x2} ${y2}`;
  }
  const k=a+'>'+b,on=S.sel&&(S.sel===a||S.sel===b),pend=findBlock(a).pending||findBlock(b).pending;
  if(!S.drawn.has(k))S.drawn.set(k,S.drawnInit&&!pend?Date.now():0);
  const t=S.drawn.get(k),age=Date.now()-t,isNew=t&&age<800;
  paths+=`<path class="wire${on?' on':''}${pend?' pending':''}${isNew?' new':''}" d="${d}" marker-end="url(#ah)"${isNew?` style="animation-delay:-${age}ms"`:''}/>`;
 });
 S.drawnInit=true;
 svg.innerHTML=`<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="context-stroke" stroke-width="1.6"/></marker></defs>${paths}`;
}
addEventListener('resize',()=>drawLines());
if(document.fonts)document.fonts.ready.then(()=>drawLines());
function findBlock(id){for(const l of S.lanes)for(const b of l.items)if(b.id===id)return b;return null}
function blueprint(){
 let idx=0;const total=S.lanes.reduce((a,l)=>a+l.items.length,0);
 const lanes=S.lanes.map(l=>`<div class="lane-${l.id}"><div class="lane-h"><span>${l.name}</span><span class="mono tiny">${l.items.length}</span></div><div class="items">${l.items.map(b=>{const i=idx++;if(i>=S.revealed)return `<div class="ghost-blk ${S.drafting?'pulse':''}"></div>`;return `<button class="blk ${S.sel===b.id?'sel':''} ${b.pending?'pending':''} ${i===S.revealed-1&&S.drafting?'new':''}" data-a="sel" data-v="${b.id}"><div class="k"><span>${b.kind}</span>${b.pending?'<span style="color:var(--draft)">Proposed</span>':b.mod?'<span style="color:var(--draft)">Changed</span>':''}</div><div class="t">${esc(b.title)}</div>${S.dial==='plain'?`<div class="d">${esc(b.plain)}</div>`:`<pre>${esc(b.code)}</pre>`}</button>`}).join('')}</div></div>`).join('');
 const sel=S.sel&&findBlock(S.sel);
 const insp=sel?`<aside class="sheet insp">
  <div class="row between"><span class="chip">${sel.kind}</span><button class="btn ghost sm" data-a="sel" data-v="" aria-label="Close">${I.x}</button></div>
  <h3 style="margin-top:10px;font-size:17px">${esc(sel.title)}</h3>
  <label class="tiny muted" style="display:block;margin-top:12px" for="plainEd">In plain language</label>
  <textarea class="input" id="plainEd" style="margin-top:4px;min-height:80px">${esc(sel.plain)}</textarea>
  <label class="tiny muted" style="display:block;margin-top:12px">Code</label>
  <pre class="codebox" style="margin-top:4px">${esc(sel.code)}</pre>
  ${(()=>{const rel=edges().filter(e=>e[0]===sel.id||e[1]===sel.id);return rel.length?`<label class="tiny muted" style="display:block;margin-top:12px">Connected to</label><div class="small" style="margin-top:4px">${rel.map(([a,b,l])=>a===sel.id?`<div style="padding:3px 0">${esc(l)} → <b>${esc(findBlock(b).title)}</b></div>`:`<div style="padding:3px 0"><b>${esc(findBlock(a).title)}</b> ${esc(l)}</div>`).join('')}</div>`:''})()}
  ${sel.kind==='Agent'?`<div class="small" style="margin-top:12px">Runs on ${S.framework}. <a href="#" data-a="stage" data-v="test" style="color:var(--draft)">See its test results</a></div>`:''}
  <div class="row" style="margin-top:14px"><button class="btn sm ink" data-a="savePlain">Save description</button><button class="btn sm" data-a="toast" data-v="Opens this file in the code editor (prototype)">Open in editor</button></div>
  <p class="tiny muted" style="margin-top:10px">Editing the description proposes a code change. Editing the code updates the description.</p>
 </aside>`:'';
 const changes=S.changes.slice(-3).map(c=>`<div class="change ${c.status==='pending'?'pending':''}"><div class="small"><b>${c.status==='pending'?'Proposed':c.status==='kept'?'Kept':'Undone'}:</b> ${esc(c.text)}</div>${c.status==='pending'?`<div class="row"><button class="btn sm ink" data-a="keep" data-v="${c.id}">Keep</button><button class="btn sm" data-a="undo" data-v="${c.id}">Undo</button></div>`:''}</div>`).join('');
 return `${S.drafting?`<div class="row small" style="margin-bottom:12px"><span class="dot draft pulse"></span>Drafting the blueprint from your description: ${Math.min(S.revealed,total)} of ${total} parts</div>`:''}
 ${note('The blueprint is the source of truth. Chat proposes changes to it, and you keep or undo each one. Code is always one click away, never in the way.')}
 ${S.drafting?'':'<p class="tiny muted" style="margin-bottom:8px">Tap any part to see what it connects to and why.</p>'}<div class="bp-wrap ${sel?'with-insp':''}"><div class="canvas"><svg class="wires" aria-hidden="true"></svg><div class="lanes">${lanes}</div></div>${insp}</div>
 <div class="cmd">${changes}
  <div class="cmd-bar" style="margin-top:10px"><input id="cmd" placeholder="${S.sel&&sel?`Change ${esc(sel.title).toLowerCase()}…`:'Tell Architect what to change, like “post to Slack when a claim is escalated”'}" aria-label="Describe a change"><span class="tiny muted hide-sm">~8 credits</span><button class="btn ink sm" data-a="send" aria-label="Send">${I.send}</button></div>
 </div>`}
function preview(){
 const claims=[['CLM-2041','Motor, rear-end collision','₹42,000','Adjuster 2','pass'],['CLM-2042','Home, water damage','₹1,80,000','Adjuster 1','pass'],['CLM-2043','Motor, total loss','₹6,00,000','Senior adjuster','warn'],['CLM-2044','Health, cashless request','₹75,000','Needs policy number','fail']];
 const pinsOn=id=>S.pv.pins.filter(p=>p===id).length+S.comments.filter(c=>c.on===id).length;
 return `<div class="row between" style="flex-wrap:wrap;margin-bottom:14px">
  <div class="tabs" style="margin:0"><button class="btn sm ${S.pv.device==='desktop'?'on':''}" data-a="dev" data-v="desktop">Desktop</button><button class="btn sm ${S.pv.device==='phone'?'on':''}" data-a="dev" data-v="phone">Phone</button></div>
  <div class="row"><button class="btn sm ${S.pv.comment?'ink':''}" data-a="cmode" aria-pressed="${S.pv.comment}">${S.pv.comment?'Click a row to comment':'Comment'}</button><button class="btn sm" data-a="share">Copy review link</button></div>
 </div>
 ${note('Approvers get a link that works without an account. Most client sponsors will never sign up, and they shouldn’t have to.')}
 <div class="pv-grid"><div class="frame"><div class="device ${S.pv.device} ${S.pv.comment?'comment-mode':''}">
  <div class="app-bar"><b>Acme claims</b><span class="tiny muted">4 new today</span></div>
  ${claims.map(c=>`<div class="claim" data-a="${S.pv.comment?'pin':''}" data-v="${c[0]}">${pinsOn(c[0])?`<span class="pin">${pinsOn(c[0])}</span>`:''}<div><div style="font-weight:600;font-size:14px">${c[1]}</div><div class="tiny muted mono">${c[0]}</div></div><div style="text-align:right;padding-right:${pinsOn(c[0])?'22px':'0'}"><div style="font-weight:600;font-size:14px">${c[2]}</div><span class="chip ${c[4]}">${c[3]}</span></div></div>`).join('')}
 </div></div>
 <aside><h3 style="margin-bottom:8px">Comments</h3>${S.pv.target?`<div class="sheet" style="padding:12px;margin-bottom:12px"><label class="small" for="cin">Comment on <span class="mono">${S.pv.target}</span></label><textarea class="input" id="cin" style="margin-top:6px;min-height:64px"></textarea><p id="cErr" class="small" style="color:var(--fail);margin-top:6px;display:none">Write a comment first.</p><div class="row" style="margin-top:8px"><button class="btn sm ink" data-a="addC">Add comment</button><button class="btn sm" data-a="pin" data-v="">Cancel</button></div></div>`:''}<div class="list">${S.comments.map(c=>`<div class="item" style="align-items:flex-start"><div class="person" style="align-items:flex-start"><span class="pav">${c.who.split(' ').map(x=>x[0]).join('')}</span><div><div class="small"><b>${esc(c.who)}</b> <span class="muted">on ${c.on}</span></div><div class="small">${esc(c.text)}</div></div></div></div>`).join('')}</div>
 <button class="btn sm" style="margin-top:12px" data-a="toBlueprint">Turn comments into changes</button></aside></div>`}
function test(){
 const p=passCount(),n=S.tests.length,pct=Math.round(p/n*100);
 return `<div class="readiness">
  <div class="sheet stat"><div class="small muted">Scenarios passing</div><div class="v">${p} of ${n}</div><div class="bar"><i style="width:${pct}%"></i></div></div>
  <div class="sheet stat"><div class="small muted">Permissions reviewed</div><div class="v">${S.perms.filter(x=>x.ok).length} of ${S.perms.length}</div></div>
  <div class="sheet stat"><div class="small muted">Cost per 100 claims</div><div class="v">₹38</div><div class="tiny muted">From the last test run</div></div>
 </div>
 ${note('Agents fail differently from screens: the demo works and the fortieth user breaks it. Testing sits between building and shipping, and production waits on it.')}
 <div class="test-grid"><div>
  <div class="row between" style="margin-bottom:8px"><h3>Scenarios</h3><button class="btn sm" data-a="rerun">Run all again</button></div>
  <div class="list">${S.tests.map(t=>`<div class="item click" data-a="openT" data-v="${t.id}" aria-expanded="${S.open===t.id}"><span class="small">${esc(t.name)}</span><span class="chip ${t.s==='pass'?'pass':t.s==='fail'?'fail':'draft'}">${t.s==='pass'?I.check+' Pass':t.s==='fail'?I.x+' Fail':t.s==='fixing'?'Fixing…':'Running…'}</span></div>${S.open===t.id&&t.trace?`<div class="trace">${t.trace.map(l=>`<div class="l ${l[2]?'bad':''}"><span style="min-width:110px">${l[0]}</span><span>${esc(l[1])}</span></div>`).join('')}${t.s==='fail'?`<button class="btn sm ink" style="margin-top:10px" data-a="fix" data-v="${t.id}">Ask Architect to fix this</button>`:t.s==='pass'&&t.fixed?`<div class="tiny" style="color:var(--pass);margin-top:8px">${esc(t.fixed)}</div>`:''}</div>`:''}`).join('')}</div>
  <div class="row" style="margin-top:12px"><input class="input" id="scn" placeholder="Add a scenario, like “a claim sent twice in one hour”"><button class="btn" data-a="addScn">Add</button></div>
  <p id="scnErr" class="small" style="color:var(--fail);margin-top:6px;display:none">Describe the situation you want to test first.</p>
 </div>
 <div><h3 style="margin-bottom:8px">What the agents are allowed to do</h3><div class="list">${S.perms.map((x,i)=>`<div class="item"><div><div class="small" style="font-weight:600">${x.what}</div><div class="tiny muted"><span class="mono">${x.tool}</span>, ${x.access}</div></div>${x.ok?`<span class="chip pass">${I.check} Reviewed</span>`:`<button class="btn sm" data-a="perm" data-v="${i}">Mark reviewed</button>`}</div>`).join('')}</div>
 <p class="tiny muted" style="margin-top:10px">Anything that sends, deletes, or pays needs a person to review it before production.</p></div></div>`}
function gate(){
 const g=[[allPass(),'Scenarios',allPass()?'All passing':`${S.tests.length-passCount()} failing`,'test'],[permsOk(),'Permissions',permsOk()?'All reviewed':`${S.perms.filter(x=>!x.ok).length} to review`,'test'],[S.approval==='approved','Sign-off',S.approval==='approved'?'Approved by Priya S':S.approval==='requested'?'Waiting on Priya S':'Not requested','approve']];
 return `<div class="gate">${g.map(x=>`<div class="sheet g"><div class="row between"><span class="small muted">${x[1]}</span><span class="dot ${x[0]?'pass':'fail'}"></span></div><div style="font-weight:600">${x[2]}</div>${x[0]?'':`<a href="#" class="small" style="color:var(--draft)" data-a="stage" data-v="${x[3]}">Go to ${x[3]}</a>`}</div>`).join('')}</div>`}
function approve(){
 const ready=allPass()&&permsOk();
 let action='';
 if(S.role==='approve'){
  action=S.approval==='requested'?`<div class="sheet" style="padding:18px;margin-top:18px"><h3>Dinesh asked you to approve the production release</h3><p class="small muted" style="margin-top:6px">${ready?'All scenarios pass and every permission has been reviewed.':'Some checks are still open. You can approve anyway, but production will stay blocked until they pass.'}</p><div class="row" style="margin-top:14px"><button class="btn ink" data-a="approveIt">Approve for production</button><button class="btn" data-a="reqChanges">Request changes</button></div></div>`
  :S.approval==='approved'?`<p style="margin-top:18px" class="small">You approved this release.</p>`:`<p style="margin-top:18px" class="small muted">Nothing is waiting for your approval on this project yet.</p>`;
 }else{
  action=S.approval==='none'||S.approval==='changes'?`<div class="sheet" style="padding:18px;margin-top:18px"><h3>Ask for sign-off</h3>${S.approval==='changes'?'<p class="small" style="color:var(--amber);margin-top:6px">Priya asked for changes last time: show the policy limit on the inbox.</p>':''}<p class="small muted" style="margin-top:6px">Priya S (client lead) approves production releases for Acme. She'll get a link that opens without an account.</p><div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn ink" data-a="request">Request approval from Priya</button><button class="btn" data-a="share">Copy review link</button></div></div>`
  :S.approval==='requested'?`<p class="small" style="margin-top:18px">Waiting on Priya S. Switch to “Approving” in the top bar to see her side.</p>`:`<p class="small" style="margin-top:18px">Approved by Priya S. Production is ${ready?'open':'still waiting on checks'}.</p>`;
 }
 return `${note('Who approves is set per client in Settings, not assumed from a job title.')}${gate()}${action}`}
function deploy(){
 const ready=allPass()&&permsOk()&&S.approval==='approved';
 const blocked=S.env==='production'&&!ready;
 const who=S.role==='define';
 return `${note('Staging is always open so people can try things. Production waits for passing scenarios, reviewed permissions, and sign-off.')}
 ${gate()}
 <div class="two" style="margin-top:18px"><div class="sheet" style="padding:18px">
  <h3>Where to</h3>
  <div class="tabs" style="margin-top:10px"><button class="btn sm ${S.env==='staging'?'on':''}" data-a="env" data-v="staging">Staging</button><button class="btn sm ${S.env==='production'?'on':''}" data-a="env" data-v="production">Production</button></div>
  <div class="small"><div class="row between" style="padding:6px 0"><span class="muted">GitHub</span><span class="mono">acme-ai/claims-triage</span></div><div class="row between" style="padding:6px 0"><span class="muted">Branch</span><span class="mono">architect/change-${14+S.changes.length}</span></div><div class="row between" style="padding:6px 0"><span class="muted">Agents run on</span><span>${S.framework}, hosted by Architect</span></div><div class="row between" style="padding:6px 0"><span class="muted">Secrets</span><span>POLICY_API, GMAIL_TOKEN set</span></div></div>
  ${blocked?`<div class="small" style="margin-top:14px;padding:10px 12px;border-radius:8px;background:var(--amber-soft);color:var(--amber)">Production opens when the three checks above are green.</div>`:''}
  ${who?`<p class="small muted" style="margin-top:14px">Deploys are run by builders on this client. You can still share a staging link.</p>`:''}
  <div class="row" style="margin-top:14px;flex-wrap:wrap"><button class="btn ink" data-a="deployGo">${S.deploying?'Deploying…':blocked?'Production is locked':`Deploy to ${S.env}`}</button><button class="btn" data-a="toast" data-v="Pull request opened on acme-ai/claims-triage (prototype)">Open pull request</button></div>
 </div>
 <div><div class="log" aria-live="polite">${S.log.length?S.log.map(l=>`<div>${esc(l)}</div>`).join(''):'<div style="opacity:.6">Deploy output appears here</div>'}</div>
 ${S.live.staging||S.live.production?`<div class="sheet" style="padding:14px;margin-top:12px">${S.live.staging?`<div class="row between small"><span>Staging</span><a href="#" data-a="toast" data-v="Opens the staging app (prototype)" class="mono" style="color:var(--draft)">claims-triage.staging.acme.architect.app</a></div>`:''}${S.live.production?`<div class="row between small" style="margin-top:6px"><span>Production</span><a href="#" data-a="toast" data-v="Opens the live app (prototype)" class="mono" style="color:var(--pass)">claims.acme.in</a></div>`:''}</div>`:''}</div></div>`}

/* ---------- other pages ---------- */
function approvals(){
 return `<h1>Approvals</h1><p class="muted" style="margin-top:6px">Releases that need a person to say yes before they reach real users.</p>
 <div class="list" style="margin-top:20px">
  <div class="item click" data-a="openStage" data-v="approve"><div><div style="font-weight:600">${esc(S.project)}, production release</div><div class="small muted">${S.approval==='requested'?'Requested by Dinesh, waiting on Priya S':S.approval==='approved'?'Approved by Priya S':'Not requested yet'}</div></div><span class="chip ${S.approval==='approved'?'pass':S.approval==='requested'?'warn':''}">${S.approval==='approved'?'Approved':S.approval==='requested'?'Waiting':'Draft'}</span></div>
  <div class="item"><div><div style="font-weight:600">Policy Q&amp;A bot, production release</div><div class="small muted">Requested by Arjun K, waiting on Priya S</div></div><span class="chip warn">Waiting</span></div>
  <div class="item"><div><div style="font-weight:600">Adjuster dashboard, v1.3</div><div class="small muted">Approved by Priya S last week</div></div><span class="chip pass">Approved</span></div>
 </div>`}
function deploys(){
 const rows=[[S.project,S.live.production?'Production':S.live.staging?'Staging':'Not deployed',S.live.production||S.live.staging?'Just now':'',S.live.production?'pass':S.live.staging?'draft':''],['Adjuster dashboard','Production','6 days ago','pass'],['Policy Q&A bot','Staging','Yesterday','draft']];
 return `<h1>Deployments</h1><p class="muted" style="margin-top:6px">Everything running for ${CLIENTS[S.client].name}, and where.</p>
 <div class="list" style="margin-top:20px">${rows.map(r=>`<div class="item"><div><div style="font-weight:600">${esc(r[0])}</div><div class="small muted">${r[2]||'No deploys yet'}</div></div><span class="chip ${r[3]}">${r[1]}</span></div>`).join('')}</div>`}
function settings(){
 const ppl=[['Dinesh','DM','Building'],['Priya S','PS','Approving'],['Arjun K','AK','Building'],['Meera R','MR','Defining']];
 return `<h1>Settings for ${CLIENTS[S.client].name}</h1>
 ${note('Roles describe what someone does on this client, not their job title. A BA who can read SQL gets the same dial as everyone else.')}
 <div class="two" style="margin-top:20px"><div><h3 style="margin-bottom:8px">People and roles</h3><div class="list">${ppl.map(p=>`<div class="item"><div class="person"><span class="pav">${p[1]}</span><span class="small" style="font-weight:600">${p[0]}</span></div><select class="input" style="width:auto;padding:5px 8px;font-size:13px" aria-label="Role for ${p[0]}">${['Defining','Building','Approving'].map(r=>`<option ${r===p[2]?'selected':''}>${r}</option>`).join('')}</select></div>`).join('')}</div>
  <button class="btn sm" style="margin-top:12px" data-a="toast" data-v="Invite sent (prototype)">Invite someone</button></div>
 <div><h3 style="margin-bottom:8px">Connections</h3><div class="list">
  <div class="item"><span class="row small">${I.git} GitHub, acme-ai</span><span class="chip pass">Connected</span></div>
  <div class="item"><span class="small">Gmail, claims@acme.in</span><span class="chip pass">Read only</span></div>
  <div class="item"><span class="small">Slack</span><button class="btn sm" data-a="toast" data-v="Slack connected (prototype)">Connect</button></div>
  <div class="item"><span class="row small">${I.term} Coding agents</span><span class="chip ${S.conn.state==='connected'?'pass':''}">${S.conn.state==='connected'?'1 connected':'None'}</span></div></div>
  <h3 style="margin:20px 0 8px">Production rules</h3><div class="list">
  <div class="item"><span class="small">All scenarios must pass</span><button class="toggle on" aria-label="Required" data-a="tog"></button></div>
  <div class="item"><span class="small">Sign-off from an approver</span><button class="toggle on" aria-label="Required" data-a="tog"></button></div>
  <div class="item"><span class="small">Monthly credit cap for this client</span><span class="small mono">3,000</span></div></div></div></div>`}
function importView(){
 const st=S.imp.step;
 const repos=['acme-ai/claims-portal','acme-ai/policy-service','acme-ai/adjuster-tools'];
 let body='';
 if(st===1)body=`<h3 style="margin:18px 0 8px">Pick a repository</h3><div class="list">${repos.map(r=>`<div class="item click" data-a="pickRepo" data-v="${r}"><span class="row small mono">${I.git} ${r}</span><span class="small muted">Import</span></div>`).join('')}</div><p class="small muted" style="margin-top:12px">Or upload a zip, or paste a public GitHub URL.</p>`;
 if(st===2)body=`<div class="log" style="margin-top:18px">${S.imp.scan.map(l=>`<div>${esc(l)}</div>`).join('')}<div class="pulse">…</div></div>`;
 if(st===3)body=`<h3 style="margin:18px 0 10px">Here's what we found in <span class="mono">${S.imp.repo}</span></h3>
 <div class="map">
  <div class="sheet m"><div class="small muted">Frontend</div><div style="font-weight:600">Next.js 14</div><div class="tiny muted">app/ with 11 routes</div></div>
  <div class="sheet m"><div class="small muted">Backend</div><div style="font-weight:600">FastAPI</div><div class="tiny muted">api/ with 6 endpoints</div></div>
  <div class="sheet m"><div class="small muted">Agents found</div><div style="font-weight:600">2, on CrewAI</div><div class="tiny muted">agents/intake.py, agents/fraud.py</div></div>
 </div>
 <div class="two" style="margin-top:16px"><div class="sheet" style="padding:16px"><h3>Architect can take over</h3><div class="small stack" style="margin-top:10px"><div>${I.check} Hosting and running both agents</div><div>${I.check} Writing test scenarios from your existing tests</div><div>${I.check} Deploys to staging and production</div></div></div>
 <div class="sheet" style="padding:16px"><h3>We'll leave alone</h3><div class="small stack" style="margin-top:10px"><div>Your frontend code and styling</div><div>Your CI in .github/workflows</div><div>Anything you mark as read only</div></div></div></div>
 <div class="row" style="margin-top:16px"><button class="btn ink" data-a="impOpen">Open in Architect</button><button class="btn" data-a="impReset">Pick another repo</button></div>`;
 return `<h1>Import a repo</h1><p class="muted" style="margin-top:6px">We read the project first and show you what we understood before changing a line.</p>${note('A developer decides in the first minute whether a tool understood their code. The map is that proof.')}${body}`}
function connectView(){
 const tools={claude:'Claude Code',cursor:'Cursor',codex:'Codex'};
 const t=S.conn.tool;
 return `<h1>Connect a coding agent</h1><p class="muted" style="margin-top:6px">Keep writing code where you already do. Architect handles agent hosting, tests, secrets, and deploys.</p>
 ${note('We don’t try to replace Claude Code or Cursor. For developers, Architect is where their work gets tested and shipped.')}
 <div class="tabs" style="margin-top:18px">${Object.entries(tools).map(([k,v])=>`<button class="btn sm ${t===k?'on':''}" data-a="ctool" data-v="${k}">${v}</button>`).join('')}</div>
 <div class="two"><div class="stack">
  <div class="small">1. Sign in from your terminal</div><div class="codebox"><pre>npx @architect/cli login --workspace acme</pre><button class="btn sm" data-a="copy">Copy</button></div>
  <div class="small">2. Add Architect as an MCP server in ${tools[t]}</div><div class="codebox"><pre>${esc(`{\n  "mcpServers": {\n    "architect": {\n      "url": "https://mcp.architect.new/acme"\n    }\n  }\n}`)}</pre><button class="btn sm" data-a="copy">Copy</button></div>
  <div class="small muted">Then ask ${tools[t]} things like “deploy this to Architect staging” or “run the Architect scenarios for the triage agent”.</div>
 </div>
 <div class="sheet" style="padding:16px"><div class="row between"><h3>Connection</h3><span class="chip ${S.conn.state==='connected'?'pass':'warn'}">${S.conn.state==='connected'?'Connected':'Waiting for your agent'}</span></div>
  ${S.conn.state==='connected'?`<div class="feed" style="margin-top:10px">${S.conn.feed.map(f=>`<div><span class="dot ${f[1]}"></span>${esc(f[0])}</div>`).join('')}</div><button class="btn sm" style="margin-top:12px" data-a="openStage" data-v="test">See test results</button>`:`<p class="small muted" style="margin-top:8px">This updates on its own once the CLI signs in.</p><button class="btn sm" style="margin-top:12px" data-a="simConn">Simulate a connection</button>`}
 </div></div>`}

/* ---------- render ---------- */
function render(){
 const v=S.view;
 if(v==='tour'){app.innerHTML=tour();return}
 if(v==='signin'){app.innerHTML=signin();return}
 if(v==='pick'){app.innerHTML=`<div class="${S.notes?'notes-on':''}" style="height:100%">${pick()}</div>`;return}
 const c=CLIENTS[S.client].name;
 const map={home:[home,`<b>Home</b>`],project:[project,`${c} / <b>${esc(S.project)}</b>`],approvals:[approvals,'<b>Approvals</b>'],deploys:[deploys,'<b>Deployments</b>'],settings:[settings,'<b>Settings</b>'],import:[importView,'<b>Import a repo</b>'],connect:[connectView,'<b>Connect a coding agent</b>']};
 const [fn,crumb]=map[v];
 const scroller=document.querySelector('.main');const y=scroller?scroller.scrollTop:0;
 app.innerHTML=shell(fn(),crumb);
 const m=document.querySelector('.main');if(m&&render.keep)m.scrollTop=y;render.keep=false;
 const rs=document.getElementById('roleSel');if(rs)rs.onchange=e=>{S.role=e.target.value;if(S.role==='approve'&&S.view==='home')S.view='approvals';if(S.role==='define')S.dial='plain';toast(`Now viewing as ${ROLE_LABEL[S.role].toLowerCase()}`);render()};
 const fw=document.getElementById('fw');if(fw)fw.onchange=e=>{S.framework=e.target.value;S.lanes.forEach(l=>l.items.forEach(b=>{b.code=b.code.replace(/framework="[^"]*"/,`framework="${e.target.value.toLowerCase().replace(/\s+/g,'_')}"`)}));toast(`Agents will run on ${e.target.value}`);render.keep=true;render()};
 requestAnimationFrame(drawLines);
 const cmd=document.getElementById('cmd');if(cmd)cmd.onkeydown=e=>{if(e.key==='Enter')act('send')};
 const pr=document.getElementById('prompt');if(pr)pr.oninput=e=>{S.prompt=e.target.value};
 const scn=document.getElementById('scn');if(scn){scn.onkeydown=e=>{if(e.key==='Enter')act('addScn')};scn.oninput=()=>{document.getElementById('scnErr').style.display='none'}}
}
function go(v){S.view=v;S.nav=false;render();const m=document.querySelector('.main');if(m)m.scrollTop=0;window.scrollTo(0,0)}

/* ---------- drafting (uses Claude if the viewer allows, else a seeded blueprint) ---------- */
let samplePromise=null;
function getSample(){if(!samplePromise)samplePromise=(window.claude&&window.claude.use)?window.claude.use('sample').catch(()=>null):Promise.resolve(null);return samplePromise}
function blueprintPrompt(text,fw){return `You design agentic business apps. From the description below, produce a blueprint as JSON only: {"name": short app name (max 5 words), "lanes":[{"id":"screens","items":[{"title","plain","code"}]},{"id":"agents","items":[...]},{"id":"data","items":[...]},{"id":"conn","items":[...]}]}. Two items per lane. "plain" is one or two plain-English sentences a non-developer understands. "code" is 3 to 5 lines: React for screens, Python Agent(...) with framework="${fw}" for agents, SQL create table for data, connect(...) for connections. Description: ${text}`}
// Returns a blueprint object, or null (then the seeded blueprint is used).
async function draftJSON(text){
 const fw=S.framework.toLowerCase().replace(/\s+/g,'_');
 const sample=await getSample();
 if(sample)return sample.json(blueprintPrompt(text,fw),{modelTier:'quick'});
 if(DB.on&&DB.user){
  const {data}=await DB.sb.auth.getSession();
  const r=await fetch('/api/draft',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+data.session.access_token},body:JSON.stringify({description:text,framework:fw})});
  if(r.ok)return r.json();
 }
 return null;
}
async function draft(){
 const text=(S.prompt||'').trim()||'A claims triage agent that reads the claims inbox, checks each policy, and routes the claim to the right adjuster';
 {let n=text.replace(/^(a|an|the|build|make|create)\s+/i,'').split(/\s+(that|which|to|for|who|where|with)\s+|[,.]/i)[0].trim();n=n.split(/\s+/).slice(0,5).join(' ');S.project=n?n.charAt(0).toUpperCase()+n.slice(1):'New project'}
 S.lanes=seedLanes();S.sel=null;S.changes=[];S.revealed=0;S.drawn=new Map();S.drawnInit=true;S.drafting=true;S.stage='blueprint';S.view='project';render();
 {
  try{
   const out=await draftJSON(text);
   if(out&&Array.isArray(out.lanes)){
    const kinds={screens:'Screen',agents:'Agent',data:'Table',conn:'Connection'};
    S.lanes.forEach(l=>{const g=out.lanes.find(x=>x.id===l.id);if(g&&Array.isArray(g.items)&&g.items.length){l.items=g.items.slice(0,3).map((it,i)=>({id:l.id+'_'+i,kind:kinds[l.id],title:String(it.title||'Untitled'),plain:String(it.plain||''),code:String(it.code||'')}))}});
    autoLinks();
    if(out.name)S.project=String(out.name).slice(0,48);
   }
  }catch(e){}
 }
 const total=S.lanes.reduce((a,l)=>a+l.items.length,0);
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const step=()=>{S.revealed++;render.keep=true;render();if(S.revealed<total)setTimeout(step,reduce?60:380);else{S.drafting=false;S.revealed=99;render.keep=true;render();toast('Blueprint drafted. Check it, then open Preview.');sync();loadUsage()}};
 setTimeout(step,300);
}

/* ---------- database (Supabase). If /api/config has no keys, the app runs as a local demo. ---------- */
const DB={on:false,sb:null,user:null,projectId:null,cap:100};
const me=()=>DB.user?(DB.user.user_metadata&&DB.user.user_metadata.full_name)||DB.user.email:'Dinesh';
const initials=n=>n.split(/[\s@.]+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('');
async function boot(){
 try{
  const r=await fetch('/api/config');
  if(r.ok){const c=await r.json();DB.cap=c.creditCap||100;if(c.url&&c.key&&window.supabase){DB.sb=window.supabase.createClient(c.url,c.key);DB.on=true}}
 }catch(e){}
 if(DB.on){
  const {data}=await DB.sb.auth.getSession();
  if(data.session){await afterLogin(data.session.user);return}
 }
 render();
}
async function afterLogin(user){
 DB.user=user;
 const {data,error}=await DB.sb.rpc('ensure_demo_workspace');
 if(error){toast('Could not load your workspace. Try again.');S.view='signin';render();return}
 DB.projectId=data;
 await loadProject();
 await loadUsage();
 let role=null;try{role=localStorage.getItem('pendingRole');localStorage.removeItem('pendingRole')}catch(e){}
 if(role)act('startRole',role);else{S.view='pick';render()}
}
async function loadProject(){
 const sb=DB.sb,id=DB.projectId;
 const [p,ch,cm,ap]=await Promise.all([
  sb.from('projects').select('*').eq('id',id).single(),
  sb.from('changes').select('*').eq('project_id',id).order('id'),
  sb.from('comments').select('*').eq('project_id',id).order('id'),
  sb.from('approvals').select('*').eq('project_id',id).maybeSingle()]);
 if(p.data){S.project=p.data.name;S.framework=p.data.framework;if(p.data.blueprint)S.lanes=p.data.blueprint}
 if(ch.data)S.changes=ch.data.map(c=>({id:+c.id,text:c.text,status:c.status}));
 if(cm.data)S.comments=cm.data.map(c=>({who:c.author_name,text:c.body,on:c.target}));
 if(ap.data)S.approval=ap.data.status;
}
async function loadUsage(){
 if(!DB.on||!DB.user)return;
 const m=new Date().toISOString().slice(0,7);
 const {data}=await DB.sb.from('usage').select('drafts').eq('user_id',DB.user.id).eq('month',m).maybeSingle();
 S.credits={used:data?data.drafts:0,cap:DB.cap};
}
// Saves the project, its changes, comments and approval. Called after every action, batched.
function sync(){
 if(!DB.on||!DB.projectId)return;
 clearTimeout(sync.t);
 sync.t=setTimeout(async()=>{
  const sb=DB.sb,id=DB.projectId;
  const changeRows=S.changes.map(c=>({id:c.id,project_id:id,text:c.text,status:c.status}));
  const commentRows=S.comments.filter(c=>c.clientId).map(c=>({project_id:id,client_id:c.clientId,target:c.on,body:c.text,author_name:c.who}));
  const res=await Promise.all([
   sb.from('projects').update({name:S.project,framework:S.framework,blueprint:S.lanes,updated_at:new Date().toISOString()}).eq('id',id),
   sb.from('approvals').upsert({project_id:id,status:S.approval,updated_at:new Date().toISOString()}),
   changeRows.length?sb.from('changes').upsert(changeRows):{error:null},
   commentRows.length?sb.from('comments').upsert(commentRows,{onConflict:'project_id,client_id'}):{error:null}]);
  if(res.some(r=>r.error))toast('Couldn’t save that. Check your connection.');
 },600);
}

/* ---------- actions ---------- */
function act(a,v){
 switch(a){
 case 'go':if(v==='signin'||v==='pick'||v==='tour'){S.view=v;render();window.scrollTo(0,0)}else go(v);break;
 case 'startRole':if(DB.on&&!DB.user){try{localStorage.setItem('pendingRole',v)}catch(e){}S.view='signin';render();return}S.role=v;S.client='acme';if(v==='define'){S.dial='plain';go('home')}else if(v==='build'){S.dial='code';S.stage='test';go('project')}else{S.approval='requested';go('approvals')}break;
 case 'signedIn':
  if(DB.on){if(v==='google')DB.sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin}});else toast('Google and email sign-in are live. This option is shown for the design.');return}
  S.view='pick';render();break;
 case 'signout':DB.sb.auth.signOut().then(()=>location.reload());return;
 case 'emailIn':{const e=document.getElementById('em');if(!e.value.trim()||!e.value.includes('@')){document.getElementById('emErr').style.display='block';e.focus();return}if(DB.on){DB.sb.auth.signInWithOtp({email:e.value.trim(),options:{emailRedirectTo:location.origin}}).then(({error})=>toast(error?'Couldn’t send the link. Check the address.':'Check your email for the sign-in link.'));return}toast('Sign-in link sent. Opening your workspaces.');setTimeout(()=>{S.view='pick';render()},700);break}
 case 'pickClient':S.client=v;S.role=CLIENTS[v].role==='define'?'define':S.role;go(S.role==='approve'?'approvals':'home');break;
 case 'nav':S.nav=!S.nav;render.keep=true;render();break;
 case 'notes':S.notes=!S.notes;render.keep=true;render();toast(S.notes?'Design notes on':'Design notes off');break;
 case 'sug':S.prompt=v==='Claims triage agent'?'A claims triage agent that reads the claims inbox, checks each policy, and routes the claim to the right adjuster':v;render.keep=true;render();break;
 case 'draft':draft();break;
 case 'openProject':S.stage='blueprint';go('project');break;
 case 'openStage':S.stage=v;go('project');break;
 case 'stage':S.stage=v;S.view='project';render.keep=true;render();break;
 case 'dial':S.dial=v;render.keep=true;render();break;
 case 'sel':S.sel=v||null;render.keep=true;render();if(v&&innerWidth<=1400){const ins=document.querySelector('.insp');ins&&ins.scrollIntoView({behavior:'smooth',block:'start'})}break;
 case 'savePlain':{const b=findBlock(S.sel);const t=document.getElementById('plainEd').value.trim();if(b&&t&&t!==b.plain){b.plain=t;b.mod=true;S.changes.push({id:Date.now(),text:`${b.title}: code updated to match your new description`,status:'kept'});toast('Description saved. Code updated to match.')}render.keep=true;render();break}
 case 'send':{const el=document.getElementById('cmd');const t=(el&&el.value||'').trim();if(!t){el&&el.focus();toast('Describe the change first');return}
  const id=Date.now();let text;
  if(/slack/i.test(t)){S.lanes[3].items.push({id:'slack'+id,kind:'Connection',title:'Slack alerts',plain:'Posts to #claims-escalations when a claim is escalated.',code:'connect("slack",\n  channel="#claims-escalations",\n  scope="post")',pending:true,change:id});{const tr=findBlock('triage')||S.lanes[1].items[0];if(tr)tr.links=(tr.links||[]).concat([['slack'+id,'posts escalations']])}S.perms.push({tool:'post_slack',what:'Post in #claims-escalations',access:'Sends messages',ok:false});text='Add a Slack connection and post when a claim is escalated'}
  else{const b=findBlock(S.sel)||findBlock('triage')||S.lanes[1].items[0];text=`${b.title}: ${t}`;b.mod=true}
  S.changes.push({id,text,status:'pending'});render.keep=true;render();break}
 case 'keep':{const c=S.changes.find(x=>x.id==v);c.status='kept';S.lanes.forEach(l=>l.items.forEach(b=>{if(b.change==v)b.pending=false}));render.keep=true;render();toast('Change kept');break}
 case 'undo':{const c=S.changes.find(x=>x.id==v);c.status='undone';S.lanes.forEach(l=>{l.items=l.items.filter(b=>b.change!=v)});S.lanes.forEach(l=>l.items.forEach(b=>{if(b.links)b.links=b.links.filter(x=>findBlock(x[0]))}));S.perms=S.perms.filter(p=>!(p.tool==='post_slack'&&/Slack/.test(c.text)));render.keep=true;render();toast('Change undone');break}
 case 'dev':S.pv.device=v;render.keep=true;render();break;
 case 'cmode':S.pv.comment=!S.pv.comment;render.keep=true;render();break;
 case 'pin':if(!v){S.pv.target=null;render.keep=true;render();return}S.pv.target=v;render.keep=true;render();setTimeout(()=>{const c=document.getElementById('cin');c&&c.focus()},30);break;
 case 'addC':{const c=document.getElementById('cin');const t=c.value.trim();if(!t){document.getElementById('cErr').style.display='block';c.focus();return}S.comments.push({clientId:Date.now(),who:me(),role:'',text:t,on:S.pv.target});S.pv.target=null;render.keep=true;render();toast('Comment added');break}
 case 'share':toast('Review link copied. It opens without an account.');break;
 case 'toBlueprint':S.comments.forEach((c,i)=>S.changes.push({id:Date.now()+i,text:`From ${c.who}'s comment: ${c.text}`,status:'pending'}));S.comments=[];S.stage='blueprint';render.keep=true;render();toast('Comments turned into proposed changes');break;
 case 'openT':S.open=S.open==v?null:+v;render.keep=true;render();break;
 case 'fix':{const t=S.tests.find(x=>x.id==v);t.s='fixing';render.keep=true;render();setTimeout(()=>{t.s='pass';t.fixed=t.fix;t.trace=t.trace.map(l=>[l[0],l[2]?'ok after fix':l[1]]);S.changes.push({id:Date.now(),text:t.fix,status:'kept'});findBlock('triage')&&(findBlock('triage').mod=true);render.keep=true;render();toast('Fixed and re-run. Scenario passes.');sync()},1500);break}
 case 'rerun':S.tests.forEach(t=>{if(t.s==='pass')t.s='running'});render.keep=true;render();setTimeout(()=>{S.tests.forEach(t=>{if(t.s==='running')t.s='pass'});render.keep=true;render();toast('Scenarios re-run')},1100);break;
 case 'addScn':{const el=document.getElementById('scn');const t=el.value.trim();if(!t){document.getElementById('scnErr').style.display='block';el.focus();return}const id=Date.now();S.tests.push({id,name:t,s:'running'});render.keep=true;render();setTimeout(()=>{const x=S.tests.find(y=>y.id===id);x.s='pass';render.keep=true;render()},1300);break}
 case 'perm':S.perms[+v].ok=true;render.keep=true;render();break;
 case 'request':S.approval='requested';render.keep=true;render();toast('Approval requested. Priya gets an email with the review link.');break;
 case 'approveIt':S.approval='approved';render.keep=true;render();toast('Approved for production');break;
 case 'reqChanges':S.approval='changes';S.comments.push({who:'Priya S',role:'Client lead',text:'Please add the policy limit before we go live.',on:'CLM-2041'});render.keep=true;render();toast('Changes requested');break;
 case 'env':S.env=v;render.keep=true;render();break;
 case 'deployGo':{
  if(S.deploying)return;
  if(S.role==='define'){toast('Ask a builder on this client to deploy');return}
  if(S.env==='production'&&!(allPass()&&permsOk()&&S.approval==='approved')){toast('Production is locked until the three checks pass');return}
  S.deploying=true;S.log=[];const env=S.env;
  const lines=[`Building ${env} from architect/change-${14+S.changes.length}`,'Installing dependencies',`Packaging agents for ${S.framework}`,`Running ${S.tests.length} scenarios: ${passCount()} passed`,'Loading secrets for Acme Insurance',env==='production'?'Live at claims.acme.in':'Live at claims-triage.staging.acme.architect.app'];
  let i=0;const tick=()=>{S.log.push(lines[i++]);render.keep=true;render();if(i<lines.length)setTimeout(tick,550);else{S.deploying=false;S.live[env]=true;render.keep=true;render();toast(`Deployed to ${env}`)}};tick();break}
 case 'pickRepo':S.imp={step:2,repo:v,scan:[]};render();{const L=['Cloning '+v,'Reading package.json and pyproject.toml','Found Next.js 14 in app/','Found FastAPI in api/','Found 2 CrewAI agents in agents/','Mapping entry points and tests'];let i=0;const t=()=>{S.imp.scan.push(L[i++]);render.keep=true;render();if(i<L.length)setTimeout(t,420);else setTimeout(()=>{S.imp.step=3;render.keep=true;render()},500)};t()}break;
 case 'impReset':S.imp={step:1,repo:null,scan:[]};render();break;
 case 'impOpen':S.project='Claims portal';S.framework='CrewAI';S.dial='code';S.stage='blueprint';S.lanes=seedLanes();S.lanes.forEach(l=>l.items.forEach(b=>b.code=b.code.replace(/framework="[^"]*"/,'framework="crewai"')));go('project');toast('Imported. Your agents now run on Architect.');break;
 case 'ctool':S.conn.tool=v;render.keep=true;render();break;
 case 'copy':toast('Copied');break;
 case 'simConn':{S.conn.state='connected';const n={claude:'Claude Code',cursor:'Cursor',codex:'Codex'}[S.conn.tool];S.conn.feed=[[`${n} signed in as Dinesh`,'pass'],[`${n} pushed agents/triage.py`,'draft']];render.keep=true;render();setTimeout(()=>{S.conn.feed.push(['Scenarios queued for the triage agent','draft']);render.keep=true;render()},900);setTimeout(()=>{S.conn.feed.push([`${passCount()} of ${S.tests.length} scenarios passed`,allPass()?'pass':'fail']);render.keep=true;render()},1900);break}
 case 'tog':toast('Production rules can only be changed by an approver');break;
 case 'toast':toast(v);break;
 }
 sync();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||!t.dataset.a)return;if(t.tagName==='A')e.preventDefault();act(t.dataset.a,t.dataset.v)});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.item.click[data-a]')){e.preventDefault();act(e.target.dataset.a,e.target.dataset.v)}if(e.key==='Escape'&&S.nav){S.nav=false;render()}});
boot();
