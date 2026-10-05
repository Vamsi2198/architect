# Builds "Architect - Step by Step Guide.docx" from the captured screenshots.
# Usage: python scripts/make_doc.py
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(HERE, '..', 'docs', 'screenshots')
OUT = os.path.join(HERE, '..', 'Architect-Step-by-Step-Guide.docx')

doc = Document()
style = doc.styles['Normal']
style.font.name = 'Calibri'
style.font.size = Pt(11)

def h(text, level=1):
    doc.add_heading(text, level=level)

def p(text, bold=False, italic=False):
    par = doc.add_paragraph()
    run = par.add_run(text)
    run.bold = bold
    run.italic = italic
    return par

def bullets(items):
    for it in items:
        doc.add_paragraph(it, style='List Bullet')

def shot(name, caption, width=6.4):
    f = os.path.join(SHOTS, name + '.png')
    if not os.path.exists(f):
        p(f'[screenshot missing: {name}]', italic=True)
        return
    doc.add_picture(f, width=Inches(width))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap = doc.add_paragraph()
    run = cap.add_run(caption)
    run.italic = True
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER

# ---------- cover ----------
t = doc.add_heading('Architect — Step-by-Step Guide', 0)
p('Build a complete working app from one plain-English sentence: design, test, approve and deploy — no coding required.', italic=True)
p('Example used in this guide: a todo app with due dates and filters.', italic=True)
doc.add_paragraph()

# ---------- the example ----------
h('The example we will build')
p('This is the entire input — one sentence:')
q = doc.add_paragraph()
r = q.add_run('"A todo app where users add tasks with due dates, mark them done, and filter tasks by today or this week."')
r.bold = True
p('From this sentence Architect designs the whole app, writes tests for it, and deploys it. Follow the steps below.')

# ---------- steps ----------
h('Step 1 — Open the app and describe what you want')
bullets([
    'Open the app URL in your browser (your live link, or http://localhost:3000 when running locally).',
    'No sign-up is needed to try — signing in only saves your projects between visits.',
    'Find the big text box on the Home page and type (or paste) the sentence above.',
])
shot('01-home', 'The Home page — one text box is all you need.')
shot('02-description', 'Type one plain sentence describing your app.')

h('Step 2 — Draft the blueprint')
bullets([
    'Click "Draft blueprint".',
    'In about 15–30 seconds the design draws itself on screen: Screens, Agents, Data tables and Connections.',
    'This blueprint is the plan of your app — nothing is built yet, so you stay in control.',
])
shot('03-blueprint-drafting', 'The blueprint is drawing itself…')
shot('04-blueprint-done', 'The finished blueprint: every part of your app on one screen.')
bullets([
    'Click any block to see what it connects to and why.',
    'Use the Plain / Code toggle (top right): Plain explains each part in everyday language; Code shows the real React / Python / SQL.',
])

h('Step 3 — Ask questions in Chat (optional)')
bullets([
    'Open "Chat" in the left sidebar.',
    'Architect knows your project — ask things like "Review my blueprint" and get answers about YOUR app.',
])
shot('05-chat', 'Chat answers in the context of your blueprint.')

h('Step 4 — Inspect the agents')
bullets([
    'Open "Agents" in the left sidebar.',
    'Each agent card shows its job, the tools it can use, and a Test button.',
])
shot('06-agents', 'Every AI worker in your app, its tools, and a way to test it.')

h('Step 5 — Preview with your data and comment')
bullets([
    'Open the "Preview" tab.',
    'You see the app running with data from YOUR tables — on desktop or phone.',
    'Turn on Comment, click any row, and leave feedback. Clients can comment from a shared link — no account needed.',
])
shot('07-preview', 'The preview shows your real tables filled with sample data.')
shot('08-preview-comment', 'Click any row and comment — feedback stays attached to the data.')

h('Step 6 — Test it like a QA team')
bullets([
    'Open the "Test" tab.',
    'Architect wrote these scenarios specifically for your app (add a task, mark done, filter by today…).',
    'Click a scenario to run it for real. If one fails, click "Ask Architect to fix this" — it repairs the blueprint and re-runs the test.',
    'On the right, review what the agents are allowed to do — anything that sends email or writes data waits for a human.',
])
shot('09-test-scenarios', 'Scenarios generated for this exact app.')
shot('10-test-ran', 'Each scenario runs against the real blueprint and reports Pass or Fail with a trace; failures get a one-click fix.')

h('Step 7 — Connect GitHub and deploy')
bullets([
    'Open the "Deploy" tab.',
    'Click "Connect GitHub" (prototype flow) — your repo and branch appear.',
    'Click "Deploy to staging". Staging is always open so people can try things.',
])
shot('11-deploy', 'The deploy screen: staging one click away; production stays locked until checks pass.')
shot('12-deploy-done', 'Deploy finished — the live link appears.')

h('Step 8 — Open your live app')
bullets([
    'Click the staging link.',
    'A real, working app opens: add a task, mark it done, filter by today or this week.',
])
shot('13-live-app', 'The generated app, live and working.')

# ---------- rule ----------
doc.add_page_break()
h('The one rule that keeps it safe')
p('Staging is open, Production is earned.', bold=True)
p('Anyone can experiment in staging. Nothing reaches your users until the tests pass, the permissions are reviewed, and a person approves the release. The platform enforces this — you do not have to remember it.')

h('Quick reference')
table = doc.add_table(rows=1, cols=2)
table.style = 'Light Grid Accent 1'
hdr = table.rows[0].cells
hdr[0].text = 'I want to…'
hdr[1].text = 'Where'
rows = [
    ('Create an app', 'Home → type a description → Draft blueprint'),
    ('Change something', 'Blueprint → type in the command bar, or use Chat'),
    ('See what it looks like', 'Preview tab'),
    ('Check it works', 'Test tab → run scenarios'),
    ('Control what agents may do', 'Test tab → permissions'),
    ('Get client feedback', 'Preview → Comment → Copy review link'),
    ('Try it live', 'Deploy tab → Deploy to staging'),
    ('Go live for real', 'Deploy tab → approve → Production'),
]
for a, b in rows:
    c = table.add_row().cells
    c[0].text = a
    c[1].text = b

doc.save(OUT)
print('WROTE', OUT)
