/**
 * Shared helpers for serve.mjs and grade.mjs.
 *
 * Layout this assumes:
 *
 *   assessments/
 *     index.html          shared UI
 *     serve.mjs           shared runner
 *     grade.mjs           shared grader
 *     lib.mjs             this file
 *     report.mjs          HTML review renderer
 *     assessment1/
 *       questions.json    the questions
 *       answer-key.json   gitignored
 *       answers.json      written on submit
 *       report.html       the graded review
 *     assessment2/
 *       ...
 */

import { readdir, stat } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"

export const ROOT = path.dirname(fileURLToPath(import.meta.url))

/** Stable stringify so a hash doesn't depend on key order. */
export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  const keys = Object.keys(value).sort()
  return (
    "{" +
    keys.map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") +
    "}"
  )
}

async function exists(file) {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

/** Every assessmentN folder that has a questions.json, in natural order. */
export async function listAssessments() {
  const entries = await readdir(ROOT, { withFileTypes: true })
  const found = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const dir = path.join(ROOT, entry.name)
    if (!(await exists(path.join(dir, "questions.json")))) continue

    found.push({
      id: entry.name,
      dir,
      questions: path.join(dir, "questions.json"),
      key: path.join(dir, "answer-key.json"),
      answers: path.join(dir, "answers.json"),
      report: path.join(dir, "report.html"),
      submitted: await exists(path.join(dir, "answers.json")),
    })
  }

  const num = id => Number(id.replace(/\D/g, "")) || 0
  found.sort((a, b) => num(a.id) - num(b.id) || a.id.localeCompare(b.id))
  return found
}

/**
 * Pick which assessment to act on.
 *
 *   mode "take"   → the first one not yet submitted (what the student wants)
 *   mode "grade"  → the most recent one that HAS been submitted
 *
 * An explicit id always wins.
 */
export async function resolveAssessment(requestedId, mode) {
  const all = await listAssessments()

  if (all.length === 0) {
    throw new Error(
      "No assessments found. Each one needs its own folder with a questions.json, e.g. assessments/assessment1/questions.json",
    )
  }

  if (requestedId) {
    const match = all.find(a => a.id === requestedId)
    if (match == null) {
      throw new Error(
        "No such assessment: " +
          requestedId +
          "\n  Available: " +
          all.map(a => a.id).join(", "),
      )
    }
    return match
  }

  if (mode === "take") {
    return all.find(a => !a.submitted) ?? all[all.length - 1]
  }

  const submitted = all.filter(a => a.submitted)
  if (submitted.length === 0) {
    throw new Error(
      "Nothing has been submitted yet.\n  Available: " +
        all.map(a => a.id).join(", "),
    )
  }
  return submitted[submitted.length - 1]
}
