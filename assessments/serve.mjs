/**
 * Assessment server — zero dependencies, plain Node.
 *
 *   node assessments/serve.mjs
 *
 * Serves the assessment at http://localhost:5055 and, on submit, writes the
 * answers to assessments/assessment1/answers.json.
 *
 * Flags:
 *   --port=5055      use a different port
 *   --no-open        don't launch the browser automatically
 *   --allow-retake   permit overwriting an existing answers.json (teacher only)
 */

import { createServer } from "node:http"
import { readFile, writeFile, mkdir, stat } from "node:fs/promises"
import { createHash } from "node:crypto"
import { fileURLToPath } from "node:url"
import { spawn } from "node:child_process"
import path from "node:path"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ANSWER_DIR = path.join(HERE, "assessment1")
const ANSWER_FILE = path.join(ANSWER_DIR, "answers.json")

const args = process.argv.slice(2)
const portArg = args.find(a => a.startsWith("--port="))
const PORT = portArg ? Number(portArg.split("=")[1]) : 5055
const OPEN_BROWSER = !args.includes("--no-open")
const ALLOW_RETAKE = args.includes("--allow-retake")

const STATIC = {
  "/": { file: "index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "index.html", type: "text/html; charset=utf-8" },
  "/questions.json": {
    file: "questions.json",
    type: "application/json; charset=utf-8",
  },
}

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  })
  res.end(payload)
}

async function existingSubmission() {
  try {
    await stat(ANSWER_FILE)
    const raw = await readFile(ANSWER_FILE, "utf8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function readBody(req, limitBytes = 2_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on("data", chunk => {
      size += chunk.length
      if (size > limitBytes) {
        reject(new Error("Payload too large"))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

/** Stable stringify so the hash doesn't depend on key order. */
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

async function handleSubmit(req, res) {
  const already = await existingSubmission()
  if (already != null && !ALLOW_RETAKE) {
    json(res, 409, {
      error:
        "This assessment was already submitted on " +
        (already.submittedAt ?? "an earlier date") +
        ". Ask your teacher to reset it.",
    })
    return
  }

  let payload
  try {
    payload = JSON.parse(await readBody(req))
  } catch {
    json(res, 400, { error: "Could not read the submission." })
    return
  }

  if (typeof payload?.student !== "string" || payload.student.trim() === "") {
    json(res, 400, { error: "A student name is required." })
    return
  }
  if (payload.answers == null || typeof payload.answers !== "object") {
    json(res, 400, { error: "No answers were included in the submission." })
    return
  }

  const record = {
    assessment: payload.assessment ?? "assessment1",
    student: payload.student.trim(),
    startedAt: payload.startedAt ?? null,
    submittedAt: payload.submittedAt ?? new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    durationSeconds: payload.durationSeconds ?? null,
    questionCount: payload.questionCount ?? null,
    answeredCount: payload.answeredCount ?? null,
    answers: payload.answers,
    skipped: payload.skipped ?? [],
    integrity: payload.integrity ?? {},
  }

  record.checksum = {
    algorithm: "sha256",
    value: createHash("sha256").update(canonical(record)).digest("hex"),
    note: "Recomputed by grade.mjs. A mismatch means the file was edited after submission.",
  }

  await mkdir(ANSWER_DIR, { recursive: true })
  await writeFile(ANSWER_FILE, JSON.stringify(record, null, 2) + "\n", "utf8")

  const away = record.integrity.totalSecondsAway ?? 0
  console.log("")
  console.log("  ✓ Submission received from " + record.student)
  console.log("    answered   " + record.answeredCount + " / " + record.questionCount)
  console.log("    duration   " + Math.round((record.durationSeconds ?? 0) / 60) + " min")
  console.log(
    "    tab left   " +
      (record.integrity.focusLossCount ?? 0) +
      " time(s), " +
      away +
      "s away",
  )
  console.log("    written to " + ANSWER_FILE)
  console.log("")
  console.log("  Now commit it:")
  console.log("    git add assessments/assessment1/answers.json")
  console.log('    git commit -m "assessment 1 answers"')
  console.log("    git push")
  console.log("")

  json(res, 200, {
    ok: true,
    path: "assessments/assessment1/answers.json",
    checksum: record.checksum.value,
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost")
  const route = url.pathname

  if (req.method === "POST" && route === "/api/submit") {
    try {
      await handleSubmit(req, res)
    } catch (err) {
      console.error(err)
      json(res, 500, { error: "Server error while saving: " + err.message })
    }
    return
  }

  if (req.method === "GET" && route === "/api/status") {
    const already = await existingSubmission()
    json(res, 200, {
      submitted: already != null && !ALLOW_RETAKE,
      submittedAt: already?.submittedAt ?? null,
    })
    return
  }

  const asset = STATIC[route]
  if (req.method === "GET" && asset != null) {
    try {
      const body = await readFile(path.join(HERE, asset.file))
      res.writeHead(200, { "Content-Type": asset.type, "Cache-Control": "no-store" })
      res.end(body)
    } catch {
      res.writeHead(500, { "Content-Type": "text/plain" })
      res.end("Could not read " + asset.file)
    }
    return
  }

  res.writeHead(404, { "Content-Type": "text/plain" })
  res.end("Not found")
})

server.listen(PORT, () => {
  const url = "http://localhost:" + PORT
  console.log("")
  console.log("  Habit Tracker assessment")
  console.log("  " + url)
  if (ALLOW_RETAKE) console.log("  (retake mode — an existing answers.json will be overwritten)")
  console.log("")
  console.log("  Leave this window open while taking the test. Ctrl+C to stop.")
  console.log("")

  if (OPEN_BROWSER) open(url)
})

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error("\n  Port " + PORT + " is already in use.")
    console.error("  Try:  node assessments/serve.mjs --port=5056\n")
    process.exit(1)
  }
  throw err
})

function open(url) {
  const commands = {
    win32: ["cmd", ["/c", "start", "", url]],
    darwin: ["open", [url]],
  }
  const [cmd, cmdArgs] = commands[process.platform] ?? ["xdg-open", [url]]
  try {
    spawn(cmd, cmdArgs, { detached: true, stdio: "ignore" }).unref()
  } catch {
    console.log("  Could not open the browser automatically — open " + url + " yourself.")
  }
}
