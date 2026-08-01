/**
 * Assessment server — zero dependencies, plain Node.
 *
 *   node assessments/serve.mjs                 # the next assessment you haven't done
 *   node assessments/serve.mjs assessment2     # a specific one
 *
 * Serves the assessment at http://localhost:5055 and, on submit, writes the
 * answers to assessments/<assessment>/answers.json.
 *
 * Flags:
 *   --port=5055      use a different port
 *   --no-open        don't launch the browser automatically
 *   --allow-retake   permit overwriting an existing answers.json (teacher only)
 */

import { createServer } from "node:http"
import { readFile, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import path from "node:path"

import { ROOT, canonical, resolveAssessment } from "./lib.mjs"

const args = process.argv.slice(2)
const flags = args.filter(a => a.startsWith("--"))
const requestedId = args.find(a => !a.startsWith("--"))

const portArg = flags.find(a => a.startsWith("--port="))
const PORT = portArg ? Number(portArg.split("=")[1]) : 5055
const OPEN_BROWSER = !flags.includes("--no-open")
const ALLOW_RETAKE = flags.includes("--allow-retake")

let assessment
try {
  assessment = await resolveAssessment(requestedId, "take")
} catch (err) {
  console.error("\n  " + err.message + "\n")
  process.exit(1)
}

function json(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  })
  res.end(JSON.stringify(body))
}

async function existingSubmission() {
  try {
    return JSON.parse(await readFile(assessment.answers, "utf8"))
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
    assessment: assessment.id,
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

  await writeFile(
    assessment.answers,
    JSON.stringify(record, null, 2) + "\n",
    "utf8",
  )

  const relative = path
    .relative(path.dirname(ROOT), assessment.answers)
    .replaceAll("\\", "/")

  console.log("")
  console.log("  ✓ Submission received from " + record.student)
  console.log("    answered   " + record.answeredCount + " / " + record.questionCount)
  console.log("    duration   " + Math.round((record.durationSeconds ?? 0) / 60) + " min")
  console.log(
    "    tab left   " +
      (record.integrity.focusLossCount ?? 0) +
      " time(s), " +
      (record.integrity.totalSecondsAway ?? 0) +
      "s away",
  )
  console.log("    written to " + relative)
  console.log("")
  console.log("  Now commit it:")
  console.log("    git add " + relative)
  console.log('    git commit -m "' + assessment.id + ' answers"')
  console.log("    git push")
  console.log("")

  json(res, 200, { ok: true, path: relative, checksum: record.checksum.value })
}

const server = createServer(async (req, res) => {
  const route = new URL(req.url, "http://localhost").pathname

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
      assessment: assessment.id,
      submitted: already != null && !ALLOW_RETAKE,
      submittedAt: already?.submittedAt ?? null,
    })
    return
  }

  /* The UI is shared; the questions come from the active assessment folder. */
  const assets = {
    "/": { file: path.join(ROOT, "index.html"), type: "text/html; charset=utf-8" },
    "/index.html": {
      file: path.join(ROOT, "index.html"),
      type: "text/html; charset=utf-8",
    },
    "/questions.json": {
      file: assessment.questions,
      type: "application/json; charset=utf-8",
    },
  }

  const asset = assets[route]
  if (req.method === "GET" && asset != null) {
    try {
      const body = await readFile(asset.file)
      res.writeHead(200, { "Content-Type": asset.type, "Cache-Control": "no-store" })
      res.end(body)
    } catch {
      res.writeHead(500, { "Content-Type": "text/plain" })
      res.end("Could not read " + path.basename(asset.file))
    }
    return
  }

  res.writeHead(404, { "Content-Type": "text/plain" })
  res.end("Not found")
})

server.listen(PORT, () => {
  const url = "http://localhost:" + PORT
  console.log("")
  console.log("  Habit Tracker — " + assessment.id)
  console.log("  " + url)
  if (ALLOW_RETAKE) {
    console.log("  (retake mode — an existing answers.json will be overwritten)")
  }
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
