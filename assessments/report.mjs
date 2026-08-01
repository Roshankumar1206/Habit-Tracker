/**
 * Renders a graded submission as a standalone HTML review page.
 * Called by grade.mjs — no dependencies, no external assets.
 */

const LETTERS = ["A", "B", "C", "D", "E", "F"]

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function tone(pct) {
  return pct >= 75 ? "good" : pct >= 50 ? "mid" : "poor"
}

function topicRows(bySection) {
  return [...bySection]
    .map(([section, bucket]) => {
      const pct = Math.round((bucket.right / bucket.total) * 100)
      return `      <div class="topic">
        <span class="topic-name">${esc(section)}</span>
        <span class="track"><span class="bar ${tone(pct)}" style="width:${pct}%"></span></span>
        <span class="topic-score">${bucket.right}/${bucket.total}</span>
      </div>`
    })
    .join("\n")
}

function optionItem(option, index, result) {
  const isCorrect = index === result.expected
  const isChosen = index === result.given

  const classes = ["opt"]
  if (isCorrect) classes.push("is-correct")
  else if (isChosen) classes.push("is-wrong")

  let tag = ""
  if (isCorrect && isChosen) tag = '<span class="tag ok">his answer — correct</span>'
  else if (isCorrect) tag = '<span class="tag ok">correct answer</span>'
  else if (isChosen) tag = '<span class="tag bad">his answer</span>'

  return `          <li class="${classes.join(" ")}"><span class="letter">${LETTERS[index]}</span><span class="opt-text">${esc(option)}</span>${tag}</li>`
}

function questionCards(results) {
  return results
    .map(r => {
      const opts = r.options.map((o, i) => optionItem(o, i, r)).join("\n")
      const code = r.code
        ? `        <pre class="snippet"><code>${esc(r.code)}</code></pre>\n`
        : ""
      const skippedNote =
        r.given == null
          ? '\n        <p class="skipped-note">He skipped this one.</p>'
          : ""
      const why = r.why
        ? `\n        <p class="why"><strong>Why:</strong> ${esc(r.why)}</p>`
        : ""

      return `      <article class="card ${r.correct ? "right" : "wrong"}" data-correct="${r.correct}">
        <div class="card-head">
          <span class="num">${String(r.number).padStart(2, "0")}</span>
          <span class="mark">${r.correct ? "✓" : "✗"}</span>
          <p class="prompt">${esc(r.prompt)}</p>
        </div>
${code}        <ul class="opts">
${opts}
        </ul>${skippedNote}${why}
      </article>`
    })
    .join("\n")
}

const STYLES = `
  :root {
    --bg:#18181b; --panel:#27272a; --line:#3f3f46; --text:#fafafa;
    --muted:#a1a1aa; --dim:#71717a; --accent:#8b5cf6;
    --good:#22c55e; --mid:#f59e0b; --poor:#ef4444;
  }
  * { box-sizing:border-box; }
  body {
    margin:0; background:var(--bg); color:var(--text); line-height:1.55;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  code, pre {
    font-family:ui-monospace,SFMono-Regular,"Cascadia Mono",Consolas,monospace;
    font-variant-ligatures:none;
  }
  .wrap { max-width:820px; margin:0 auto; padding:2.5rem 1rem 5rem; }

  .eyebrow { color:var(--accent); font-size:.78rem; letter-spacing:.12em;
    text-transform:uppercase; font-weight:600; }
  h1 { font-size:2rem; margin:.35rem 0 1.5rem; letter-spacing:-.02em; }

  .scoreline { display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;
    background:var(--panel); border:1px solid var(--line); border-radius:.9rem; padding:1.5rem; }
  .big { font-size:3.2rem; font-weight:700; line-height:1; letter-spacing:-.03em; }
  .big.good { color:var(--good); } .big.mid { color:var(--mid); } .big.poor { color:var(--poor); }
  .big span { font-size:1.4rem; opacity:.6; }
  .score-meta { color:var(--muted); font-size:.9rem; }
  .score-meta strong { color:var(--text); }

  h2 { font-size:.82rem; text-transform:uppercase; letter-spacing:.1em; color:var(--accent);
    margin:2.5rem 0 1rem; padding-bottom:.5rem; border-bottom:1px solid var(--line); }

  .topic { display:grid; grid-template-columns:1fr 200px 52px; gap:1rem;
    align-items:center; padding:.5rem 0; font-size:.9rem; }
  .topic-name { color:var(--muted); }
  .track { background:var(--bg); border:1px solid var(--line); border-radius:999px;
    height:9px; overflow:hidden; }
  .bar { display:block; height:100%; border-radius:999px; }
  .bar.good { background:var(--good); } .bar.mid { background:var(--mid); } .bar.poor { background:var(--poor); }
  .topic-score { text-align:right; color:var(--dim); font-variant-numeric:tabular-nums; }

  .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:.75rem; }
  .stat { background:var(--panel); border:1px solid var(--line); border-radius:.6rem; padding:.85rem 1rem; }
  .stat-label { color:var(--dim); font-size:.75rem; text-transform:uppercase; letter-spacing:.06em; }
  .stat-value { font-size:1.05rem; margin-top:.2rem; }
  .stat-value.ok { color:var(--good); }
  .stat-value.alert { color:var(--poor); }

  .controls { display:flex; gap:.5rem; margin:2.5rem 0 1.25rem; flex-wrap:wrap; }
  .controls button { background:var(--panel); color:var(--muted); border:1px solid var(--line);
    border-radius:999px; padding:.45rem 1.1rem; font-size:.85rem; cursor:pointer; font-family:inherit; }
  .controls button:hover { color:var(--text); }
  .controls button[aria-pressed="true"] { background:var(--accent); border-color:var(--accent); color:#fff; }

  .card { background:var(--panel); border:1px solid var(--line); border-left-width:3px;
    border-radius:.75rem; padding:1.25rem; margin-bottom:1rem; }
  .card.right { border-left-color:var(--good); }
  .card.wrong { border-left-color:var(--poor); }
  .card-head { display:grid; grid-template-columns:auto auto 1fr; gap:.6rem;
    align-items:baseline; margin-bottom:.9rem; }
  .num { color:var(--dim); font-size:.8rem; font-variant-numeric:tabular-nums; }
  .mark { font-weight:700; }
  .card.right .mark { color:var(--good); }
  .card.wrong .mark { color:var(--poor); }
  .prompt { margin:0; font-size:.97rem; }

  .snippet { background:#131316; border:1px solid var(--line); border-radius:.5rem;
    padding:.8rem 1rem; margin:0 0 .9rem; overflow-x:auto; font-size:.8rem;
    line-height:1.55; color:#d4d4d8; }

  .opts { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.4rem; }
  .opt { display:flex; gap:.65rem; align-items:flex-start; background:var(--bg);
    border:1px solid var(--line); border-radius:.5rem; padding:.55rem .75rem; font-size:.9rem; }
  .opt.is-correct { border-color:var(--good); background:rgba(34,197,94,.1); }
  .opt.is-wrong { border-color:var(--poor); background:rgba(239,68,68,.1); }
  .letter { flex-shrink:0; width:1.3rem; height:1.3rem; border-radius:999px;
    border:1px solid var(--line); display:grid; place-items:center; font-size:.7rem;
    color:var(--muted); margin-top:.1rem; }
  .opt.is-correct .letter { background:var(--good); border-color:var(--good); color:#052e16; font-weight:700; }
  .opt.is-wrong .letter { background:var(--poor); border-color:var(--poor); color:#450a0a; font-weight:700; }
  .opt-text { flex:1; }
  .tag { flex-shrink:0; font-size:.68rem; text-transform:uppercase; letter-spacing:.05em;
    padding:.15rem .5rem; border-radius:.3rem; align-self:center; white-space:nowrap; }
  .tag.ok { background:var(--good); color:#052e16; }
  .tag.bad { background:var(--poor); color:#450a0a; }

  .skipped-note { color:var(--poor); font-size:.85rem; margin:.75rem 0 0; }
  .why { color:var(--muted); font-size:.88rem; margin:.9rem 0 0; padding-top:.8rem;
    border-top:1px solid var(--line); }
  .why strong { color:var(--text); }

  .foot { color:var(--dim); font-size:.78rem; text-align:center; margin-top:3rem; }

  @media (max-width:560px) {
    .topic { grid-template-columns:1fr 44px; }
    .track { display:none; }
    .tag { display:none; }
  }
`

const FILTER_SCRIPT = `
  const buttons = document.querySelectorAll(".controls button")
  const cards = document.querySelectorAll(".card")

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter
      buttons.forEach(b => b.setAttribute("aria-pressed", String(b === btn)))
      cards.forEach(card => {
        const isCorrect = card.dataset.correct === "true"
        const show =
          filter === "all" ||
          (filter === "wrong" && !isCorrect) ||
          (filter === "right" && isCorrect)
        card.style.display = show ? "" : "none"
      })
    })
  })
`

export function renderReport({
  assessmentId,
  title,
  submission,
  results,
  bySection,
  right,
  total,
  skipped,
  percent,
  checksumVerdict,
  integrity,
}) {
  const wrongCount = results.filter(r => !r.correct).length
  const checksumOk = checksumVerdict.startsWith("OK")
  const focusLoss = integrity.focusLossCount ?? 0
  const away = integrity.totalSecondsAway ?? 0
  const pastes = integrity.pasteAttempts?.length ?? 0
  const minutes = Math.round((submission.durationSeconds ?? 0) / 60)

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="icon" href="data:," />
<title>${esc(submission.student ?? "Unknown")} — ${esc(assessmentId)} review</title>
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">${esc(assessmentId)} · ${esc(title)}</div>
  <h1>${esc(submission.student ?? "Unknown student")}</h1>

  <div class="scoreline">
    <div class="big ${tone(percent)}">${percent}<span>%</span></div>
    <div class="score-meta">
      <strong>${right} of ${total}</strong> correct${skipped > 0 ? ` · <strong>${skipped}</strong> skipped` : ""}<br />
      Took <strong>${minutes} minutes</strong><br />
      Submitted ${esc(submission.submittedAt ?? "?")}
    </div>
  </div>

  <h2>By topic</h2>
  <div class="topics">
${topicRows(bySection)}
  </div>

  <h2>Integrity</h2>
  <div class="stats">
    <div class="stat">
      <div class="stat-label">File checksum</div>
      <div class="stat-value ${checksumOk ? "ok" : "alert"}">${checksumOk ? "Verified" : "Mismatch"}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Left the tab</div>
      <div class="stat-value ${focusLoss === 0 ? "ok" : "alert"}">${focusLoss} time(s)</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total time away</div>
      <div class="stat-value ${away === 0 ? "ok" : "alert"}">${away}s</div>
    </div>
    <div class="stat">
      <div class="stat-label">Paste attempts</div>
      <div class="stat-value ${pastes === 0 ? "ok" : "alert"}">${pastes}</div>
    </div>
  </div>

  <h2>Question by question</h2>
  <div class="controls">
    <button data-filter="all" aria-pressed="true">All ${total}</button>
    <button data-filter="wrong" aria-pressed="false">Wrong only (${wrongCount})</button>
    <button data-filter="right" aria-pressed="false">Correct only (${right})</button>
  </div>

  <div class="review">
${questionCards(results)}
  </div>

  <p class="foot">Generated by assessments/grade.mjs</p>
</div>
<script>${FILTER_SCRIPT}</script>
</body>
</html>
`
}
