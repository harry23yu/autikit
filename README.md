# 🧩 AutiKit — AI Support Tools for Autistic People

> Built at the Claude Code Meetup Portland hackathon. Powered by Claude. Made for the autistic community.

---

## What is AutiKit?

AutiKit is a web app that uses Claude to help autistic people — and those who support them — navigate three of the most common everyday challenges:

| Tool | What it does |
|---|---|
| 💬 **Social Script Generator** | Gives you real words to say, step-by-step scripts, and how to handle surprises — for job interviews, phone calls, conflicts, and more |
| 🎧 **Sensory Prep Planner** | Describes exactly what to bring, how to cope, and how to exit gracefully before a sensory-challenging environment |
| ✅ **Task Unsticker** | Breaks any task into tiny, concrete, 2-minute steps for when executive function makes starting feel impossible |

Every response is **personalised**: AutiKit asks 3 quick questions on first use (who you are, your biggest challenges, and any extra context), then tailors every Claude response to that profile. Age is set directly on each tool so it can be adjusted per request.

---

## How Claude is central to this

Claude isn't a feature — it's the entire product. Here's what Claude does under the hood:

**Three deeply engineered system prompts** — one per tool — each with:
- An **age-adaptive tone layer**: separate instruction sets for children, teens, and adults that change how Claude communicates, not just what it says
- A **personal profile injection**: the user's role, challenges, and free-text notes are appended to every system prompt as a `PERSONAL PROFILE` block
- **Strict output formatting**: Claude is instructed to return structured markdown with exact section headers (`## What to Say`, `## Exit Strategy`, `## The Very First Thing`, etc.) so responses are predictable, readable, and usable out of the box

**Example**: an autistic adult with ADHD asking about a job interview gets a different response — in language, depth, and framing — than a parent preparing their 9-year-old for a doctor's visit.

The prompts are written with genuine autism expertise — framing stimming positively, treating sensory exits as valid strategy, describing executive function blocks as neurological rather than motivational.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask |
| AI | Anthropic Claude (`claude-sonnet-4-5`) via official Python SDK |
| Frontend | Vanilla JS, HTML, CSS (no framework) |
| Persistence | Browser `localStorage` for profile data |
| Markdown rendering | `marked.js` |

---

## Running locally

```bash
# 1. Clone and install
pip install -r requirements.txt

# 2. Add your Anthropic API key
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# 3. Run
python app.py
```

Then open `http://localhost:5000`.

---

## Why this problem is worth solving

Autism affects roughly 1 in 36 people. Many autistic people describe the same recurring pain points:

- **Social situations**: not knowing what to say, or scripting conversations in advance as a coping strategy
- **Sensory environments**: having to attend places (hospitals, weddings, school) that are genuinely overwhelming, with no preparation support
- **Task initiation**: knowing what needs to be done but being neurologically unable to start — often mistaken for laziness

Existing tools are either generic productivity apps (not autism-specific), therapist-mediated (inaccessible and expensive), or written in infantilising language that doesn't serve adults.

AutiKit gives anyone — autistic people, parents, teachers — on-demand, personalised, age-appropriate support in seconds.

---

## Demo flow (3 minutes)

1. **Open the app** → welcome screen explains the three tools
2. **Onboarding** → 3-step questionnaire sets role, challenges, and personal context
3. **Social Script**: type *"job interview at a coffee shop, scared about the 'tell me about yourself' question"* → show the structured script with exact phrases
4. **Sensory Prep**: type *"loud birthday party, fluorescent lights, can't leave for 2 hours"* → show the packing list and exit strategy
5. **Task Unsticker**: type *"I need to reply to an important email but I keep freezing"* → show the micro-steps starting with "open your email app"
6. **Age toggle** → switch the age selector on any tool from Adult to Child, run the same query, show how the language completely changes

---

## Project structure

```
autikit/
├── app.py                  # Flask routes + all Claude system prompts
├── requirements.txt
├── .env                    # ANTHROPIC_API_KEY (not committed)
├── templates/
│   └── index.html          # Single-page app
└── static/
    ├── css/style.css
    └── js/app.js           # Onboarding, profile, and API call logic
```
