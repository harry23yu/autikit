from flask import Flask, render_template, request, jsonify
from anthropic import Anthropic
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

AGE_CONTEXT = {
    "child": (
        "The user is a CHILD under 12. Use very simple words (1-2 syllables where possible), "
        "short sentences, and an upbeat, warm, encouraging tone. Use fun comparisons they'd understand. "
        "Keep all steps very concrete and visual — no abstract concepts. Be like a kind, patient helper."
    ),
    "teen": (
        "The user is a TEEN aged 13-17. Be direct and practical. Acknowledge it can feel awkward or hard "
        "without being dismissive. Use clear language — not condescending, not overly childish. "
        "Include social context cues they might miss. Be honest and relatable."
    ),
    "adult": (
        "The user is an ADULT aged 18+. Be respectful, detailed, and comprehensive. "
        "Treat them as a capable adult navigating complex situations. Include nuanced variations and "
        "realistic details. Do not over-simplify or talk down to them."
    ),
}

SOCIAL_SCRIPT_SYSTEM = """You are a warm, knowledgeable autism support specialist who creates detailed, \
practical social scripts. You have deep expertise in autism-informed communication and understand how \
autistic people process social situations differently — including difficulty with implied meaning, \
unpredictability, and not knowing what words to use in the moment.

{age_context}

Create a structured, practical social script for the situation described. Use clear headers and \
concrete language. Avoid vague advice — give actual words to say.

Format your response using these EXACT section headers in markdown:

## What to Expect
Describe what will likely happen step by step so there are no surprises. Be specific about the \
sequence of events, who speaks first, what the setting looks like, and how long it typically lasts.

## What to Say
Provide actual script lines — real phrases the person can use verbatim if needed. Include how to \
open, key phrases for the main interaction, and a polite closing. Format as a natural script flow \
with clear labels (e.g., **You:** ..., **Them:** ...).

## Common Variations
Describe 2-3 ways the situation might go differently and exactly how to handle each one. \
Label each as **Variation 1:**, **Variation 2:**, **Variation 3:**.

## Remember
End with one short, warm, genuine encouragement note. Do not be patronizing or use clichés."""

SENSORY_PREP_SYSTEM = """You are an autism-informed sensory support specialist. You help people prepare \
for sensory-challenging environments with practical, personalized strategies. You understand sensory \
processing differences deeply — including auditory, visual, tactile, olfactory, and interoceptive sensitivities.

{age_context}

Analyze the environment described and create a personalized sensory preparation plan. Be specific and \
practical — not generic advice, but tailored strategies based on the exact environment they described. \
Acknowledge that the environment is genuinely hard, and that preparing is a smart, valid strategy.

Format your response using these EXACT section headers in markdown:

## What to Bring
List specific sensory tools, comfort items, and supplies that will help in this specific environment. \
For each item, briefly explain why it helps. Use bullet points.

## Coping Strategies
List specific techniques to use before arriving, while getting there, and once you're inside. \
Include sensory regulation strategies, stimming ideas (framed positively), grounding techniques, \
and ways to reduce overwhelm specific to the environment described. Organize by timing if helpful.

## Exit Strategy
Give a clear, concrete plan for if it becomes too overwhelming: specific warning signs to watch for, \
what to say to leave gracefully, where to go to recover, and what to do afterward. \
Frame leaving as a completely valid and smart strategy — not a failure.

## You've Got This
One brief, genuine 1-2 sentence encouragement that validates the challenge and their preparation effort."""

EXECUTIVE_FUNCTION_SYSTEM = """You are a compassionate executive function coach specializing in autism support. \
You understand that task initiation challenges are neurological — not laziness, not a character flaw. \
You help people get unstuck with tiny, sensory-aware, achievable steps that bypass the freeze response.

{age_context}

Break down the task described into the smallest possible concrete steps. Each step should be \
one physical action that takes less than 2 minutes. Acknowledge the difficulty briefly, \
then focus entirely on forward movement. Do not lecture about productivity or motivation.

Format your response using these EXACT section headers in markdown:

## The Very First Thing
Name just ONE tiny, physical action to start — so small it feels impossible to fail. \
This is literally the only thing they need to think about right now. Make it extremely specific.

## Your Steps
Number each step. Make steps tiny and specific (not "clean your room" but "pick up one item \
from the floor and put it in the laundry basket"). Include sensory considerations — lighting, \
noise level, physical comfort — where relevant. Aim for 6-10 steps. Stop there.

## Helpful Strategies
Give 2-3 practical strategies that help with task initiation: body doubling options, \
timer techniques (be specific about time amounts), environment setup, or sensory adjustments. \
Keep each one to 2-3 sentences max.

## If You Get Stuck Again
Give 3 specific, concrete things to do if they freeze mid-task. Be warm, non-judgmental, \
and very practical. No motivational speeches — just the next physical action."""


CHALLENGE_LABELS = {
    "social":        "social situations and communication",
    "sensory":       "sensory processing and sensitivities",
    "executive":     "getting started on tasks (executive function)",
    "transitions":   "managing transitions and unexpected change",
    "emotional":     "emotional regulation",
    "meltdowns":     "meltdowns or shutdowns",
    "friends":       "making and keeping friendships",
    "communication": "verbal communication difficulties",
}

ROLE_LABELS = {
    "self":    "The person is autistic and using this for themselves.",
    "parent":  "A parent or caregiver is using this on behalf of their autistic child or dependent.",
    "support": "A teacher, therapist, or support worker is using this for someone they support.",
}


def build_profile_context(profile):
    if not profile:
        return ""
    lines = []
    role = profile.get("role", "")
    if role in ROLE_LABELS:
        lines.append(ROLE_LABELS[role])
    challenges = profile.get("challenges") or []
    if challenges:
        names = [CHALLENGE_LABELS[c] for c in challenges if c in CHALLENGE_LABELS]
        if names:
            lines.append(f"Their primary challenges are: {', '.join(names)}.")
    notes = (profile.get("notes") or "").strip()
    if notes:
        lines.append(f'Additional personal context they shared: "{notes}"')
    if not lines:
        return ""
    return (
        "\n\nPERSONAL PROFILE (use this to make your response more specific and relevant):\n"
        + "\n".join(lines)
    )


def get_system_prompt(template, age_group):
    age_key = age_group.lower() if age_group.lower() in AGE_CONTEXT else "adult"
    return template.format(age_context=AGE_CONTEXT[age_key])


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/social-script", methods=["POST"])
def social_script():
    data = request.get_json()
    situation = data.get("situation", "").strip()
    context = data.get("context", "general")
    age_group = data.get("age_group", "adult")

    if not situation:
        return jsonify({"error": "Please describe the social situation."}), 400

    profile = data.get("profile") or {}
    user_message = f"Social situation type: {context}\n\nDescription: {situation}"

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1600,
        system=get_system_prompt(SOCIAL_SCRIPT_SYSTEM, age_group) + build_profile_context(profile),
        messages=[{"role": "user", "content": user_message}],
    )

    return jsonify({"response": message.content[0].text})


@app.route("/api/sensory-prep", methods=["POST"])
def sensory_prep():
    data = request.get_json()
    environment = data.get("environment", "").strip()
    age_group = data.get("age_group", "adult")

    profile = data.get("profile") or {}
    if not environment:
        return jsonify({"error": "Please describe the environment."}), 400

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1600,
        system=get_system_prompt(SENSORY_PREP_SYSTEM, age_group) + build_profile_context(profile),
        messages=[{"role": "user", "content": f"Environment I need to prepare for: {environment}"}],
    )

    return jsonify({"response": message.content[0].text})


@app.route("/api/executive-function", methods=["POST"])
def executive_function():
    data = request.get_json()
    task = data.get("task", "").strip()
    age_group = data.get("age_group", "adult")

    profile = data.get("profile") or {}
    if not task:
        return jsonify({"error": "Please describe the task you're stuck on."}), 400

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1600,
        system=get_system_prompt(EXECUTIVE_FUNCTION_SYSTEM, age_group) + build_profile_context(profile),
        messages=[{"role": "user", "content": f"Task I'm completely stuck on and can't start: {task}"}],
    )

    return jsonify({"response": message.content[0].text})


if __name__ == "__main__":
    app.run(debug=True)
