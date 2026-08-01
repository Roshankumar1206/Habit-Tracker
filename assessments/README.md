# Assessment 1 — Habit Tracker Understanding Check

40 multiple-choice questions on the React + TypeScript habit tracker in this repo.
Every question is drawn from the actual code in `src/`.

---

## For the student

1. Pull the latest changes.
2. Open a terminal in the **Habit-Tracker** folder and run:

   ```bash
   node assessments/serve.mjs
   ```

3. Your browser opens at `http://localhost:5055`. If it doesn't, open that
   address yourself.
4. Enter your name, answer all 40 questions, and hit **Submit assessment**.
5. Commit and push the answers file:

   ```bash
   git add assessments/assessment1/answers.json
   git commit -m "assessment 1 answers"
   git push
   ```

**Rules**

- Closed book. No AI, no search, no opening the project files.
- No timer — take as long as you need.
- Pasting into the page is disabled. Time spent away from the tab is recorded.
- Your progress autosaves, so refreshing won't lose anything.
- **One submission.** Once submitted, the server refuses to overwrite the file.

Leave the terminal window open the whole time — that's the process writing your
answers to disk.

---

## For the teacher

### Files

| File | Committed? | Purpose |
| --- | --- | --- |
| `index.html` | yes | The test UI. Contains **no** correct answers. |
| `questions.json` | yes | Question text and options only. |
| `serve.mjs` | yes | Zero-dependency Node server; writes `assessment1/answers.json`. |
| `grade.mjs` | yes | Scoring script — you run it. |
| `answer-key.json` | **no** (gitignored) | The correct answers and a one-line explanation each. |
| `assessment1/answers.json` | yes, by the student | The submission. |
| `assessment1/report.md` | **no** (gitignored) | Generated review with the answers in it. |

Because the key never leaves your machine, there is nothing in the pushed repo
that reveals the correct answers — not to him, and not to an AI he points at the
folder.

### Grading

Once he's pushed, pull and run:

```bash
node assessments/grade.mjs
```

You get a score, a per-topic bar chart, an integrity summary, and a full
question-by-question review written to `assessment1/report.md`. That report is
the thing to walk through with him — it shows each question, which option he
picked, the correct one, and why.

### Resetting an attempt

`serve.mjs` refuses to overwrite an existing `answers.json`. To let him retake,
delete the file, or run:

```bash
node assessments/serve.mjs --allow-retake
```

Other flags: `--port=5056`, `--no-open`.

### What the integrity data actually tells you

`answers.json` records, in an `integrity` block:

- every time the tab lost focus, when, and for how long
- attempted pastes (pasting is blocked) and copies
- start time, submit time, total duration
- user agent, screen size, timezone

A pattern of 40-second absences before the harder questions is visible. It is
evidence, not prevention — nothing stops him reading `questions.json` in another
window and asking an AI there.

The `checksum` field is a SHA-256 of the submission computed by the server.
`grade.mjs` recomputes it and flags a mismatch, which catches a hand-edit of the
JSON. It is **not** cryptographically strong — the hashing code is right there in
`serve.mjs` on his machine. The real audit trail is git: have him push
immediately after submitting, and any later edit shows as a second commit.

### Topic breakdown

| Section | Questions | What it probes |
| --- | --- | --- |
| 1. Project Setup & Tooling | 4 | npm scripts, `tsc -b`, `createRoot`, StrictMode |
| 2. Components, JSX & Lists | 6 | keys, index-key bug, `&&` rendering the literal `0`, `children` through `{...props}` |
| 3. State, Events & Immutability | 9 | functional updates, derived state, controlled inputs, `preventDefault`, why `filter`/spread over mutation |
| 4. Effects & Custom Hooks | 7 | cleanup, dependency arrays, stale closures, lazy initializer, `as const` |
| 5. Context API | 4 | prop drilling, the `null` default, the throw-guard, new value identity |
| 6. TypeScript & Button | 4 | `ComponentProps<"button">`, rest props, `.at(-1)!`, `twMerge` |
| 7. App Logic & date-fns | 6 | `weekStartsOn`, disabled Next, tracing `getStreak`, the date reviver |

The questions that separate "watched the video" from "understood it" are Q08
(`{streak && ...}` renders a literal `0`), Q15 (dropping `value` makes the input
uncontrolled), Q22 (stale closure with `[]` deps), Q38 (`getStreak` returns `0`
if today isn't ticked yet) and Q40 (losing the date reviver). If he's shaky, the
weak topic in the bar chart is where to go next.
