/**
 * Grader — TEACHER ONLY. Requires answer-key.json, which is gitignored.
 *
 *   node assessments/grade.mjs
 *
 * Prints a score with a per-topic breakdown and an integrity summary, and
 * writes assessments/assessment1/report.md (also gitignored).
 */

import { readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { fileURLToPath } from "node:url"
import path from "node:path"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LETTERS = ["A", "B", "C", "D", "E", "F"]

async function readJson(file, hint) {
  try {
    return JSON.parse(await readFile(path.join(HERE, file), "utf8"))
  } catch (err) {
    console.error("\n  Could not read " + file)
    if (hint) console.error("  " + hint)
    console.error("  (" + err.message + ")\n")
    process.exit(1)
  }
}

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  const keys = Object.keys(value).sort()
  return (
    "{" +
    keys.map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") +
    "}"
  )
}

const questions = await readJson("questions.json")
const key = await readJson(
  "answer-key.json",
  "This is the teacher-only key. It should sit beside grade.mjs and never be committed.",
)
const submission = await readJson(
  "assessment1/answers.json",
  "No submission yet — has the student run serve.mjs, taken the test and pushed?",
)

/* ---------- flatten questions, keeping section membership ---------- */
const lookup = new Map()
let n = 0
for (const section of questions.sections) {
  for (const q of section.questions) {
    n += 1
    lookup.set(q.id, { ...q, number: n, section: section.title })
  }
}

/* ---------- checksum ---------- */
let checksumVerdict = "no checksum recorded"
if (submission.checksum?.value) {
  const { checksum, ...rest } = submission
  const recomputed = createHash("sha256").update(canonical(rest)).digest("hex")
  checksumVerdict =
    recomputed === submission.checksum.value
      ? "OK — file matches what the server wrote"
      : "MISMATCH — answers.json was edited after submission"
}

/* ---------- score ---------- */
const results = []
for (const [id, q] of lookup) {
  const expected = key.key[id]?.correct
  const given = submission.answers?.[id]
  results.push({
    id,
    number: q.number,
    section: q.section,
    prompt: q.prompt,
    options: q.options,
    expected,
    given: given == null ? null : given,
    correct: given != null && given === expected,
    why: key.key[id]?.why ?? "",
  })
}

const total = results.length
const right = results.filter(r => r.correct).length
const skipped = results.filter(r => r.given == null).length
const percent = total === 0 ? 0 : Math.round((right / total) * 100)

const bySection = new Map()
for (const r of results) {
  const bucket = bySection.get(r.section) ?? { right: 0, total: 0 }
  bucket.total += 1
  if (r.correct) bucket.right += 1
  bySection.set(r.section, bucket)
}

/* ---------- console ---------- */
const line = "─".repeat(64)
console.log("")
console.log(line)
console.log("  " + (submission.student ?? "Unknown student") + " — " + questions.title)
console.log(line)
console.log("")
console.log("  Score        " + right + " / " + total + "   (" + percent + "%)")
console.log("  Skipped      " + skipped)
console.log(
  "  Duration     " + Math.round((submission.durationSeconds ?? 0) / 60) + " min",
)
console.log("  Submitted    " + (submission.submittedAt ?? "?"))
console.log("")
console.log("  By topic")
for (const [section, bucket] of bySection) {
  const pct = Math.round((bucket.right / bucket.total) * 100)
  const filled = Math.round((bucket.right / bucket.total) * 20)
  const bar = "█".repeat(filled) + "·".repeat(20 - filled)
  console.log(
    "    " +
      bar +
      "  " +
      String(bucket.right).padStart(2) +
      "/" +
      bucket.total +
      "  " +
      String(pct).padStart(3) +
      "%  " +
      section,
  )
}

const integrity = submission.integrity ?? {}
console.log("")
console.log("  Integrity")
console.log("    checksum          " + checksumVerdict)
console.log("    left the tab      " + (integrity.focusLossCount ?? 0) + " time(s)")
console.log("    total away        " + (integrity.totalSecondsAway ?? 0) + "s")
console.log("    paste attempts    " + (integrity.pasteAttempts?.length ?? 0))
console.log("    copy attempts     " + (integrity.copyAttempts?.length ?? 0))

const longAbsences = (integrity.focusLog ?? []).filter(f => f.awaySeconds >= 20)
if (longAbsences.length > 0) {
  console.log("")
  console.log("    Absences of 20s or more:")
  for (const f of longAbsences) {
    console.log("      " + f.leftAt + "  →  " + f.awaySeconds + "s")
  }
}

const wrong = results.filter(r => !r.correct)
if (wrong.length > 0) {
  console.log("")
  console.log("  Got wrong")
  for (const r of wrong) {
    const gave = r.given == null ? "skipped" : LETTERS[r.given]
    console.log(
      "    Q" +
        String(r.number).padStart(2, "0") +
        "  gave " +
        gave.padEnd(7) +
        " correct " +
        LETTERS[r.expected] +
        "   " +
        r.section,
    )
  }
}
console.log("")
console.log(line)
console.log("")

/* ---------- markdown report ---------- */
const md = []
md.push("# " + (submission.student ?? "Unknown") + " — " + questions.title)
md.push("")
md.push("- **Score:** " + right + " / " + total + " (" + percent + "%)")
md.push("- **Skipped:** " + skipped)
md.push("- **Duration:** " + Math.round((submission.durationSeconds ?? 0) / 60) + " min")
md.push("- **Submitted:** " + (submission.submittedAt ?? "?"))
md.push("- **Checksum:** " + checksumVerdict)
md.push(
  "- **Left the tab:** " +
    (integrity.focusLossCount ?? 0) +
    " time(s), " +
    (integrity.totalSecondsAway ?? 0) +
    "s total",
)
md.push("")
md.push("## By topic")
md.push("")
md.push("| Topic | Score |")
md.push("| --- | --- |")
for (const [section, bucket] of bySection) {
  md.push("| " + section + " | " + bucket.right + " / " + bucket.total + " |")
}
md.push("")
md.push("## Review")
md.push("")
for (const r of results) {
  md.push("### Q" + String(r.number).padStart(2, "0") + (r.correct ? " ✅" : " ❌"))
  md.push("")
  md.push(r.prompt)
  md.push("")
  r.options.forEach((opt, i) => {
    const marks = []
    if (i === r.expected) marks.push("correct")
    if (i === r.given) marks.push("his answer")
    md.push(
      "- **" +
        LETTERS[i] +
        ".** " +
        opt +
        (marks.length > 0 ? "  _(" + marks.join(", ") + ")_" : ""),
    )
  })
  md.push("")
  if (r.why) md.push("> " + r.why)
  md.push("")
}

const reportPath = path.join(HERE, "assessment1", "report.md")
await writeFile(reportPath, md.join("\n"), "utf8")
console.log("  Full review written to assessments/assessment1/report.md")
console.log("")
