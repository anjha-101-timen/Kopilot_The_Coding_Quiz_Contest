import { db, api, COL } from "../shared/firebase.js";
import { setPillStatus, toast } from "../shared/ui.js";
import { getDeviceId, loadAttemptsLocal, loadAttemptsFirestore, mergeAttempts, syncQueuedAttempts, loadProfileLocal, syncProfile } from "../shared/attempts.js";

const el = (id) => document.getElementById(id);

const $ = (sel, root = document) => root.querySelector(sel);

function parseQuery() {
  const url = new URL(window.location.href);
  return {
    exam: url.searchParams.get("exam") || ""
  };
}

async function loadQuestions(examId) {
  const qRef = api.collection(db, COL.QUESTIONS);
  const q1 = api.query(qRef, api.where("examId", "==", examId));
  const snap = await api.getDocs(q1);
  const xs = [];
  snap.forEach((d) => xs.push({ id: d.id, ...d.data() }));
  return xs;
}

function computeStaticQuestionAnalysis(questions, exam) {
  const xs = Array.isArray(questions) ? questions : [];
  const base = { count: 0 };
  const byType = new Map();
  const byDifficulty = new Map();
  const tagFreq = new Map();
  let timeLimitSecSum = 0;

  for (const q of xs) {
    const type = String(q?.type || "unknown");
    const diff = String(q?.difficulty || "unknown");
    const tags = Array.isArray(q?.tags) ? q.tags : [];
    const tl = Number(q?.timeLimitSec || 0);
    timeLimitSecSum += Number.isFinite(tl) ? tl : 0;

    ensureAgg(byType, type, base).count++;
    ensureAgg(byDifficulty, diff, base).count++;
    for (const t of tags) {
      const k = String(t || "").trim();
      if (!k) continue;
      tagFreq.set(k, Number(tagFreq.get(k) || 0) + 1);
    }
  }

  const totalQuestions = xs.length;
  const avgTimeLimitSec = totalQuestions ? timeLimitSecSum / totalQuestions : 0;

  return {
    version: 1,
    examId: String(exam?.id || ""),
    examCode: String(exam?.examCode || ""),
    positiveMarks: Number(exam?.positiveMarks ?? 2),
    negativeMarks: Number(exam?.negativeMarks ?? 0),
    totalQuestions,
    avgTimeLimitSec,
    byType: Object.fromEntries(Array.from(byType.entries()).map(([k, v]) => [k, { count: Number(v.count || 0) }])),
    byDifficulty: Object.fromEntries(Array.from(byDifficulty.entries()).map(([k, v]) => [k, { count: Number(v.count || 0) }])),
    topTags: Array.from(tagFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18)
      .map(([tag, count]) => ({ tag, count }))
  };
}

async function ensureStaticQuestionAnalytics(examId, questions, exam) {
  try {
    const id = `q__${String(examId || "")}`;
    const ref = api.doc(db, COL.ANALYTICS, id);
    const snap = await api.getDoc(ref);
    if (snap.exists()) return { id, ...snap.data() };

    const analytics = computeStaticQuestionAnalysis(questions, exam);
    const doc = {
      id,
      kind: "question_static",
      examId: String(examId || ""),
      createdMs: Date.now(),
      analytics,
      updatedAt: api.serverTimestamp()
    };
    await api.setDoc(ref, doc, { merge: true });
    return doc;
  } catch {
    return null;
  }
}

function pct(n, d) {
  const den = Math.max(1, Number(d || 0));
  return (Number(n || 0) / den) * 100;
}

function groupKey(...parts) {
  return parts.map((p) => String(p || "")).join("__");
}

function ensureAgg(map, key, base) {
  if (!map.has(key)) map.set(key, structuredClone(base));
  return map.get(key);
}

function computeQuestionPattern(questions, attempts, exam) {
  const qMap = new Map();
  for (const q of Array.isArray(questions) ? questions : []) qMap.set(String(q.id), q);

  const positive = Number(exam?.positiveMarks ?? 2);
  const negative = Number(exam?.negativeMarks ?? 0);

  const allItems = [];
  for (const a of Array.isArray(attempts) ? attempts : []) {
    const items = Array.isArray(a.items) ? a.items : [];
    for (const it of items) {
      const qid = String(it.qid || "");
      const q = qMap.get(qid) || null;
      allItems.push({
        qid,
        type: String(it.type || q?.type || "unknown"),
        difficulty: String(q?.difficulty || "unknown"),
        tags: Array.isArray(q?.tags) ? q.tags : [],
        status: String(it.status || "skipped"),
        timeMs: Number(it.timeMs || 0)
      });
    }
  }

  const totalQuestions = Array.isArray(questions) ? questions.length : 0;
  const totalSeen = allItems.length;
  const base = { count: 0, correct: 0, incorrect: 0, skipped: 0, timeMs: 0 };

  const byType = new Map();
  const byDifficulty = new Map();
  const byTypeDifficulty = new Map();

  for (const it of allItems) {
    const st = it.status;
    const add = (agg) => {
      agg.count++;
      if (st === "correct") agg.correct++;
      else if (st === "incorrect") agg.incorrect++;
      else agg.skipped++;
      agg.timeMs += Number(it.timeMs || 0);
    };

    add(ensureAgg(byType, it.type, base));
    add(ensureAgg(byDifficulty, it.difficulty, base));
    add(ensureAgg(byTypeDifficulty, groupKey(it.type, it.difficulty), { ...base, type: it.type, difficulty: it.difficulty }));
  }

  const overall = structuredClone(base);
  for (const a of byType.values()) {
    overall.count += a.count;
    overall.correct += a.correct;
    overall.incorrect += a.incorrect;
    overall.skipped += a.skipped;
    overall.timeMs += a.timeMs;
  }

  // Empirical probabilities across attempts (based on item outcomes)
  const pCorrect = overall.count ? overall.correct / overall.count : 0;
  const pIncorrect = overall.count ? overall.incorrect / overall.count : 0;
  const pSkipped = overall.count ? overall.skipped / overall.count : 0;

  // Expected marks per question attempt (random variable)
  const expectedMarksPerQ = pCorrect * positive - pIncorrect * negative;

  return {
    meta: {
      totalQuestions,
      attempts: (attempts || []).length,
      observations: totalSeen,
      positive,
      negative,
      pCorrect,
      pIncorrect,
      pSkipped,
      expectedMarksPerQ
    },
    overall,
    byType,
    byDifficulty,
    byTypeDifficulty
  };
}

function rowHtml(name, agg) {
  const c = Number(agg.correct || 0);
  const i = Number(agg.incorrect || 0);
  const s = Number(agg.skipped || 0);
  const n = Number(agg.count || 0);
  const avgTime = n ? Number(agg.timeMs || 0) / n : 0;
  return `
    <tr>
      <td>${esc(name)}</td>
      <td class="mono">${n}</td>
      <td class="mono">${fmtNum(pct(c, n), 1)}%</td>
      <td class="mono">${fmtNum(pct(i, n), 1)}%</td>
      <td class="mono">${fmtNum(pct(s, n), 1)}%</td>
      <td class="mono">${fmtTime(avgTime)}</td>
    </tr>
  `;
}

function renderQuestionPattern(questions, attempts, exam) {
  const host = el("qAnalysisHost");
  if (!host) return;

  if (!Array.isArray(questions) || !questions.length) {
    host.innerHTML = `<div class="small" style="margin-top:10px">No questions found for this exam.</div>`;
    return;
  }

  const pat = computeQuestionPattern(questions, attempts, exam);
  const m = pat.meta;

  const summary = `
    <div class="qBlock">
      ${statGrid([
        { k: "Questions", v: String(m.totalQuestions) },
        { k: "Attempts analyzed", v: String(m.attempts) },
        { k: "Observations", v: String(m.observations) },
        { k: "+Marks", v: fmtNum(m.positive, 2) },
        { k: "-Marks", v: fmtNum(m.negative, 2) },
        { k: "E[marks/q]", v: fmtNum(m.expectedMarksPerQ, 3) }
      ])}
    </div>
  `;

  const prob = `
    <div class="qBlock">
      <div class="qBlockTitle">Empirical probabilities (from your attempts)</div>
      ${statGrid([
        { k: "P(Correct)", v: fmtNum(m.pCorrect * 100, 1) + "%" },
        { k: "P(Incorrect)", v: fmtNum(m.pIncorrect * 100, 1) + "%" },
        { k: "P(Skipped)", v: fmtNum(m.pSkipped * 100, 1) + "%" }
      ])}
      <div class="small" style="margin-top:8px; opacity:.8">These are based on outcomes stored in attempt history (not global population).</div>
    </div>
  `;

  const typeRows = Array.from(pat.byType.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([k, v]) => rowHtml(k.toUpperCase(), v))
    .join("");

  const diffRows = Array.from(pat.byDifficulty.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .map(([k, v]) => rowHtml(k.toUpperCase(), v))
    .join("");

  const tdRows = Array.from(pat.byTypeDifficulty.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((v) => rowHtml(`${String(v.type || "").toUpperCase()} • ${String(v.difficulty || "").toUpperCase()}`, v))
    .join("");

  const tblHead = `
    <tr>
      <th>Group</th>
      <th class="mono">N</th>
      <th class="mono">%Correct</th>
      <th class="mono">%Incorrect</th>
      <th class="mono">%Skipped</th>
      <th class="mono">Avg time</th>
    </tr>
  `;

  host.innerHTML = `
    ${summary}
    ${prob}

    <div class="qGrid2">
      <div class="qCard">
        <div class="qBlockTitle">By question type</div>
        <table class="tbl" aria-label="Question pattern by type">
          <thead>${tblHead}</thead>
          <tbody>${typeRows || ""}</tbody>
        </table>
      </div>
      <div class="qCard">
        <div class="qBlockTitle">By difficulty</div>
        <table class="tbl" aria-label="Question pattern by difficulty">
          <thead>${tblHead}</thead>
          <tbody>${diffRows || ""}</tbody>
        </table>
      </div>
    </div>

    <div class="qCard" style="margin-top:12px">
      <div class="qBlockTitle">Top type × difficulty buckets</div>
      <div class="small" style="margin-top:6px; opacity:.8">Shows where questions concentrate and how you perform in those buckets.</div>
      <table class="tbl" aria-label="Question pattern by type and difficulty">
        <thead>${tblHead}</thead>
        <tbody>${tdRows || ""}</tbody>
      </table>
    </div>
  `;
}

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function fmtPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}

function fmtTime(ms) {
  const s = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function fmtDate(ms) {
  const d = new Date(Number(ms || 0));
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString();
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function quantile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function fiveNumber(xs) {
  const ys = (xs || []).map((v) => Number(v)).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!ys.length) return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  return {
    min: ys[0],
    q1: quantile(ys, 0.25),
    median: quantile(ys, 0.5),
    q3: quantile(ys, 0.75),
    max: ys[ys.length - 1]
  };
}

function mean(xs) {
  const ys = (xs || []).map((v) => Number(v)).filter((v) => Number.isFinite(v));
  if (!ys.length) return 0;
  return ys.reduce((a, b) => a + b, 0) / ys.length;
}

function std(xs) {
  const ys = (xs || []).map((v) => Number(v)).filter((v) => Number.isFinite(v));
  if (ys.length < 2) return 0;
  const m = mean(ys);
  const v = ys.reduce((acc, x) => acc + (x - m) ** 2, 0) / (ys.length - 1);
  return Math.sqrt(v);
}

function pearson(xs, ys) {
  const pairs = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    const x = Number(xs[i]);
    const y = Number(ys[i]);
    if (Number.isFinite(x) && Number.isFinite(y)) pairs.push([x, y]);
  }
  if (pairs.length < 2) return 0;
  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  const den = Math.sqrt(dx * dy);
  if (!den) return 0;
  return num / den;
}

function linreg(xs, ys) {
  const pairs = [];
  for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
    const x = Number(xs[i]);
    const y = Number(ys[i]);
    if (Number.isFinite(x) && Number.isFinite(y)) pairs.push([x, y]);
  }
  if (pairs.length < 2) return { m: 0, b: 0 };
  const mx = mean(pairs.map((p) => p[0]));
  const my = mean(pairs.map((p) => p[1]));
  let num = 0;
  let den = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    den += (x - mx) ** 2;
  }
  const m = den ? num / den : 0;
  const b = my - m * mx;
  return { m, b };
}

function fmtNum(n, digits = 2) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return v.toFixed(digits);
}

function attemptSeries(attempts) {
  const xs = (attempts || []).slice().sort((a, b) => Number(a.attemptNo || 0) - Number(b.attemptNo || 0));
  return xs.map((a, i) => {
    const s = a.summary || {};
    const attemptNo = Number(a.attemptNo || 0) || i + 1;
    const score = Number(s.score || 0);
    const maxScore = Number(s.maxScore || 0);
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    const timeMs = Number(s.timeTakenMs || 0);
    const accuracy = Number(s.accuracy || 0);
    const correct = Number(s.correct || 0);
    const incorrect = Number(s.incorrect || 0);
    const skipped = Number(s.skipped || 0);
    return { id: a.id, attemptNo, score, maxScore, pct, timeMs, accuracy, correct, incorrect, skipped, createdMs: Number(a.createdMs || 0) };
  });
}

function computeAttemptAnalytics(attempts) {
  const series = attemptSeries(attempts);
  const scores = series.map((x) => x.score);
  const pcts = series.map((x) => x.pct);
  const timesMin = series.map((x) => x.timeMs / 60000);
  const acc = series.map((x) => x.accuracy);

  const score5 = fiveNumber(scores);
  const time5 = fiveNumber(timesMin);
  const acc5 = fiveNumber(acc);

  const corrScoreTime = pearson(scores, timesMin);
  const corrScoreAcc = pearson(scores, acc);
  const trend = linreg(series.map((x) => x.attemptNo), scores);

  const totals = series.reduce(
    (t, a) => {
      t.correct += a.correct;
      t.incorrect += a.incorrect;
      t.skipped += a.skipped;
      return t;
    },
    { correct: 0, incorrect: 0, skipped: 0 }
  );

  return {
    series,
    scores,
    pcts,
    timesMin,
    acc,
    score5,
    time5,
    acc5,
    scoreMean: mean(scores),
    scoreStd: std(scores),
    pctMean: mean(pcts),
    timeMeanMin: mean(timesMin),
    timeStdMin: std(timesMin),
    accMean: mean(acc),
    accStd: std(acc),
    corrScoreTime,
    corrScoreAcc,
    trend,
    totals
  };
}

function svgFrame(w, h, inner) {
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img">${inner}</svg>`;
}

function chartCard(title, subtitle, statsHtml, svgHtml) {
  return `
    <div class="cmpTitle">
      <div>
        <div style="font-weight:800; letter-spacing:-.02em">${esc(title)}</div>
        <div class="small">${esc(subtitle || "")}</div>
      </div>
    </div>
    ${statsHtml || ""}
    ${svgHtml || ""}
  `;
}

function statGrid(items) {
  return `
    <div class="cmpStats">
      ${items
        .map((x) => {
          return `<div class="cmpStat"><div class="k">${esc(x.k)}</div><div class="v">${esc(x.v)}</div></div>`;
        })
        .join("")}
    </div>
  `;
}

function renderLineChart(series) {
  const xs = (series || []).slice();
  if (xs.length < 2) return "";
  const scores = xs.map((a) => Number(a.score || 0));
  const max = Math.max(...scores, 1);
  const w = 740;
  const h = 220;
  const pad = 18;
  const step = (w - pad * 2) / (xs.length - 1);
  const pts = scores
    .map((s, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - s / max);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const labels = xs
    .map((a, i) => {
      const x = pad + i * step;
      const y = h - 6;
      const t = `A${Number(a.attemptNo || i + 1)}`;
      return `<text x="${x.toFixed(1)}" y="${y}" text-anchor="middle" fill="rgba(234,240,255,.55)" font-size="12">${esc(t)}</text>`;
    })
    .join("");

  return svgFrame(
    w,
    h,
    `
      <rect x="0" y="0" width="${w}" height="${h}" fill="color-mix(in srgb, var(--card2) 80%, rgba(255,255,255,.08))" rx="16" />
      <polyline points="${pts}" fill="none" stroke="rgba(245,158,11,.92)" stroke-width="3" />
      ${scores
        .map((s, i) => {
          const x = pad + i * step;
          const y = pad + (h - pad * 2) * (1 - s / max);
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="rgba(245,158,11,.98)" />`;
        })
        .join("")}
      ${labels}
    `
  );
}

function renderBarChart(series) {
  const xs = (series || []).slice();
  if (!xs.length) return "";
  const w = 740;
  const h = 240;
  const pad = 26;
  const barW = (w - pad * 2) / xs.length;
  const values = xs.map((a) => Number(a.pct || 0));
  const max = Math.max(100, ...values);
  const bars = xs
    .map((a, i) => {
      const v = clamp(Number(a.pct || 0), 0, max);
      const bh = (h - pad * 2) * (v / max);
      const x = pad + i * barW + 6;
      const y = h - pad - bh;
      const rx = 10;
      return `
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(6, barW - 12).toFixed(1)}" height="${bh.toFixed(1)}" rx="${rx}" fill="rgba(34,211,238,.45)" stroke="rgba(34,211,238,.25)" />
        <text x="${(x + (barW - 12) / 2).toFixed(1)}" y="${(h - 8).toFixed(1)}" text-anchor="middle" fill="rgba(234,240,255,.55)" font-size="12">A${Number(a.attemptNo || i + 1)}</text>
      `;
    })
    .join("");

  return svgFrame(
    w,
    h,
    `
      <rect x="0" y="0" width="${w}" height="${h}" fill="color-mix(in srgb, var(--card2) 80%, rgba(255,255,255,.08))" rx="16" />
      ${bars}
      <text x="${pad}" y="${pad - 8}" fill="rgba(234,240,255,.55)" font-size="12">Score %</text>
    `
  );
}

function renderScatter(series) {
  const xs = (series || []).slice();
  if (xs.length < 2) return "";
  const w = 740;
  const h = 240;
  const pad = 34;
  const xVals = xs.map((a) => Number(a.timeMs || 0) / 60000);
  const yVals = xs.map((a) => Number(a.score || 0));
  const xMax = Math.max(...xVals, 1);
  const yMax = Math.max(...yVals, 1);

  const pts = xs
    .map((a) => {
      const x = pad + (w - pad * 2) * (Number(a.timeMs || 0) / 60000 / xMax);
      const y = h - pad - (h - pad * 2) * (Number(a.score || 0) / yMax);
      const t = `A${Number(a.attemptNo)} • ${fmtNum(Number(a.timeMs || 0) / 60000, 2)} min • ${fmtNum(a.score, 2)} score`;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="rgba(236,72,153,.75)"><title>${esc(t)}</title></circle>`;
    })
    .join("");

  return svgFrame(
    w,
    h,
    `
      <rect x="0" y="0" width="${w}" height="${h}" fill="color-mix(in srgb, var(--card2) 80%, rgba(255,255,255,.08))" rx="16" />
      <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="rgba(234,240,255,.18)" />
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="rgba(234,240,255,.18)" />
      ${pts}
      <text x="${pad}" y="${pad - 10}" fill="rgba(234,240,255,.55)" font-size="12">Score vs Time (min)</text>
    `
  );
}

function histogramBins(values, binCount = 8) {
  const xs = (values || []).map((v) => Number(v)).filter((v) => Number.isFinite(v));
  if (!xs.length) return { min: 0, max: 1, bins: [] };
  const minV = Math.min(...xs);
  const maxV = Math.max(...xs);
  const span = maxV - minV || 1;
  const bins = Array.from({ length: binCount }, () => 0);
  for (const v of xs) {
    const t = (v - minV) / span;
    const idx = Math.min(binCount - 1, Math.max(0, Math.floor(t * binCount)));
    bins[idx]++;
  }
  return { min: minV, max: maxV, bins };
}

function renderHistogram(values) {
  const { min, max, bins } = histogramBins(values, 9);
  if (!bins.length) return "";
  const w = 740;
  const h = 240;
  const pad = 26;
  const maxBin = Math.max(...bins, 1);
  const barW = (w - pad * 2) / bins.length;
  const bars = bins
    .map((c, i) => {
      const bh = (h - pad * 2) * (c / maxBin);
      const x = pad + i * barW + 6;
      const y = h - pad - bh;
      const lo = min + ((max - min) * i) / bins.length;
      const hi = min + ((max - min) * (i + 1)) / bins.length;
      const t = `${fmtNum(lo, 1)}–${fmtNum(hi, 1)} : ${c}`;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(6, barW - 12).toFixed(1)}" height="${bh.toFixed(1)}" rx="10" fill="rgba(16,185,129,.40)"><title>${esc(t)}</title></rect>`;
    })
    .join("");

  return svgFrame(
    w,
    h,
    `
      <rect x="0" y="0" width="${w}" height="${h}" fill="color-mix(in srgb, var(--card2) 80%, rgba(255,255,255,.08))" rx="16" />
      ${bars}
      <text x="${pad}" y="${pad - 8}" fill="rgba(234,240,255,.55)" font-size="12">Score distribution</text>
    `
  );
}

function piePath(cx, cy, r, a0, a1) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}

function renderPie(totals) {
  const c = Number(totals?.correct || 0);
  const i = Number(totals?.incorrect || 0);
  const s = Number(totals?.skipped || 0);
  const sum = c + i + s;
  if (sum <= 0) return "";
  const w = 740;
  const h = 240;
  const cx = 170;
  const cy = 125;
  const r = 72;
  const parts = [
    { k: "Correct", v: c, fill: "rgba(16,185,129,.55)" },
    { k: "Incorrect", v: i, fill: "rgba(239,68,68,.55)" },
    { k: "Skipped", v: s, fill: "rgba(245,158,11,.50)" }
  ].filter((p) => p.v > 0);
  let a = -Math.PI / 2;
  const wedges = parts
    .map((p) => {
      const da = (p.v / sum) * Math.PI * 2;
      const path = piePath(cx, cy, r, a, a + da);
      a += da;
      const pct = (p.v / sum) * 100;
      return `<path d="${path}" fill="${p.fill}"><title>${esc(`${p.k}: ${p.v} (${pct.toFixed(1)}%)`)}</title></path>`;
    })
    .join("");

  const legend = parts
    .map((p, idx) => {
      const y = 70 + idx * 26;
      const pct = (p.v / sum) * 100;
      return `
        <rect x="320" y="${y - 10}" width="14" height="14" rx="4" fill="${p.fill}" />
        <text x="340" y="${y + 2}" fill="rgba(234,240,255,.70)" font-size="13">${esc(p.k)}: ${p.v} (${pct.toFixed(1)}%)</text>
      `;
    })
    .join("");

  return svgFrame(
    w,
    h,
    `
      <rect x="0" y="0" width="${w}" height="${h}" fill="color-mix(in srgb, var(--card2) 80%, rgba(255,255,255,.08))" rx="16" />
      ${wedges}
      ${legend}
      <text x="${26}" y="${24}" fill="rgba(234,240,255,.55)" font-size="12">Aggregate correctness across attempts</text>
    `
  );
}

function renderComparison(attempts) {
  const host = el("cmpGrid");
  if (!host) return;

  const xs = (attempts || []).slice();
  if (xs.length < 2) {
    host.innerHTML = `<div class="small">Not enough attempts to compare.</div>`;
    return;
  }

  const an = computeAttemptAnalytics(xs);

  const lineHost = $(".chartLine");
  if (lineHost) {
    lineHost.innerHTML = chartCard(
      "Score Trend",
      "Score vs attempt number",
      statGrid([
        { k: "Mean", v: fmtNum(an.scoreMean, 2) },
        { k: "Std", v: fmtNum(an.scoreStd, 2) },
        { k: "Slope", v: fmtNum(an.trend.m, 2) }
      ]),
      renderLineChart(an.series)
    );
  }

  const barHost = $(".chartBar");
  if (barHost) {
    barHost.innerHTML = chartCard(
      "Score % Bars",
      "Normalized score per attempt",
      statGrid([
        { k: "Avg %", v: fmtNum(an.pctMean, 1) + "%" },
        { k: "Best %", v: fmtNum(Math.max(...an.pcts), 1) + "%" },
        { k: "Worst %", v: fmtNum(Math.min(...an.pcts), 1) + "%" }
      ]),
      renderBarChart(an.series)
    );
  }

  const scatterHost = $(".chartScatter");
  if (scatterHost) {
    scatterHost.innerHTML = chartCard(
      "Score vs Time",
      "Does more time improve score?",
      statGrid([
        { k: "Avg Time", v: fmtNum(an.timeMeanMin, 2) + " min" },
        { k: "Corr(score,time)", v: fmtNum(an.corrScoreTime, 2) },
        { k: "Corr(score,acc)", v: fmtNum(an.corrScoreAcc, 2) }
      ]),
      renderScatter(an.series)
    );
  }

  const histHost = $(".chartHistogram");
  if (histHost) {
    const s5 = an.score5;
    histHost.innerHTML = chartCard(
      "Score Histogram",
      "How consistent are your attempts?",
      statGrid([
        { k: "Min", v: fmtNum(s5.min, 1) },
        { k: "Median", v: fmtNum(s5.median, 1) },
        { k: "Max", v: fmtNum(s5.max, 1) }
      ]),
      renderHistogram(an.scores)
    );
  }

  const pieHost = $(".chartPie");
  if (pieHost) {
    pieHost.innerHTML = chartCard(
      "Correctness Mix",
      "Aggregate of correct/incorrect/skipped",
      statGrid([
        { k: "Correct", v: String(an.totals.correct) },
        { k: "Incorrect", v: String(an.totals.incorrect) },
        { k: "Skipped", v: String(an.totals.skipped) }
      ]),
      renderPie(an.totals)
    );
  }
}

async function loadExam(examId) {
  const ref = api.doc(db, COL.EXAMS, examId);
  const snap = await api.getDoc(ref);
  if (!snap.exists()) throw new Error("Exam not found");
  return { id: examId, ...snap.data() };
}

async function loadAttempts(examId, deviceId) {
  const local = loadAttemptsLocal(examId, deviceId);
  let remote = [];
  try {
    remote = await loadAttemptsFirestore(examId, deviceId);
  } catch {
    remote = [];
  }
  return mergeAttempts(local, remote);
}

function renderScoreCard(attempt) {
  const s = attempt?.summary || {};
  const cp = Math.max(0, Number(attempt?.cpEarned || 0));
  return `
    <div>
      <div class="scoreLabel">SCORE</div>
      <div class="scoreValue">${Number(s.score || 0).toFixed(2)}<span class="scoreMax">/${Number(s.maxScore || 0).toFixed(0)}</span></div>
      <div class="scoreHint" style="margin-top:8px">Attempted on: <span class="mono">${esc(fmtDate(attempt?.createdMs))}</span></div>
    </div>
    <div class="row" style="gap:10px; align-items:flex-end">
      <div class="kbd">+${cp} CP</div>
      <div class="kbd">Attempt ${Number(attempt?.attemptNo || 0) || 1}</div>
    </div>
  `;
}

function renderProgress(attempt) {
  const s = attempt?.summary || {};
  const total = Math.max(1, Number(s.total || 0));
  const correct = Number(s.correct || 0);
  const incorrect = Number(s.incorrect || 0);
  const skipped = Number(s.skipped || 0);
  const positive = Number(s.positive || 0);
  const negative = Number(s.negative || 0);

  const marksObtained = correct * positive;
  const marksLost = incorrect * negative;

  const cards = [
    {
      cls: "ok",
      title: "Correct",
      right: `${correct}/${Number(s.total || 0)}`,
      pct: (correct / total) * 100,
      sub: `Marks Obtained +${marksObtained.toFixed(2)}`
    },
    {
      cls: "bad",
      title: "Incorrect",
      right: `${incorrect}/${Number(s.total || 0)}`,
      pct: (incorrect / total) * 100,
      sub: `Marks Lost -${marksLost.toFixed(2)}`
    },
    {
      cls: "warn",
      title: "Skipped",
      right: `${skipped}/${Number(s.total || 0)}`,
      pct: (skipped / total) * 100,
      sub: `Marks Skipped ${skipped}`
    },
    {
      cls: "",
      title: "Accuracy",
      right: fmtPct(s.accuracy || 0),
      pct: Number(s.accuracy || 0),
      sub: " "
    },
    {
      cls: "",
      title: "Completed",
      right: fmtPct(s.completedPct || 0),
      pct: Number(s.completedPct || 0),
      sub: " "
    },
    {
      cls: "",
      title: "Time Taken",
      right: fmtTime(s.timeTakenMs || 0),
      pct: 100,
      sub: " "
    }
  ];

  return cards
    .map((c) => {
      const cls = c.cls ? `progCard ${c.cls}` : "progCard";
      return `
        <div class="${cls}">
          <div class="progTop"><div>${esc(c.title)}</div><div class="kbd">${esc(c.right)}</div></div>
          <div class="bar"><span style="width:${Math.max(0, Math.min(100, Number(c.pct || 0)))}%"></span></div>
          <div class="progSub">${esc(c.sub)}</div>
        </div>
      `;
    })
    .join("");
}

function renderChart(attempts) {
  const xs = (attempts || []).slice();
  if (xs.length < 2) return "<div class=\"small\" style=\"margin-top:10px\">Not enough attempts to compare.</div>";

  const scores = xs.map((a) => Number(a.summary?.score || 0));
  const max = Math.max(...scores, 1);
  const w = 740;
  const h = 220;
  const pad = 18;
  const step = (w - pad * 2) / (xs.length - 1);
  const pts = scores
    .map((s, i) => {
      const x = pad + i * step;
      const y = pad + (h - pad * 2) * (1 - s / max);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const labels = xs
    .map((a, i) => {
      const x = pad + i * step;
      const y = h - 6;
      const t = `A${Number(a.attemptNo || i + 1)}`;
      return `<text x=\"${x.toFixed(1)}\" y=\"${y}\" text-anchor=\"middle\" fill=\"rgba(15,23,42,.55)\" font-size=\"12\">${esc(t)}</text>`;
    })
    .join("");

  return `
    <svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Attempt wise score comparison">
      <rect x="0" y="0" width="${w}" height="${h}" fill="rgba(255,255,255,.60)" rx="16" />
      <polyline points="${pts}" fill="none" stroke="rgba(245,158,11,.85)" stroke-width="3" />
      ${scores
        .map((s, i) => {
          const x = pad + i * step;
          const y = pad + (h - pad * 2) * (1 - s / max);
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="rgba(245,158,11,.95)" />`;
        })
        .join("")}
      ${labels}
    </svg>
  `;
}

function renderStatusGrid(attempt) {
  const items = Array.isArray(attempt?.items) ? attempt.items : [];
  if (!items.length) return "<div class=\"small\" style=\"margin-top:10px\">No attempt items stored.</div>";

  return items
    .map((it) => {
      const st = String(it.status || "skipped");
      const cls = st === "correct" ? "sOk" : st === "incorrect" ? "sBad" : "sSkip";
      return `
        <div class="statusItem ${cls}" title="Q${Number(it.i || 0) + 1} • ${esc(st)} • ${fmtTime(it.timeMs || 0)}">
          <div class="statusNum">${Number(it.i || 0) + 1}</div>
        </div>
      `;
    })
    .join("");
}

function bindAttemptSelect(attempts, onPick) {
  const sel = el("attemptSelect");
  sel.innerHTML = (attempts || [])
    .map((a) => {
      const n = Number(a.attemptNo || 0) || 1;
      return `<option value="${esc(a.id)}">Attempt ${n}</option>`;
    })
    .join("");

  sel.addEventListener("change", () => {
    const id = String(sel.value || "");
    const a = (attempts || []).find((x) => x.id === id);
    if (a) onPick(a);
  });
}

function setActiveAttempt(attempt, attempts) {
  if (!attempt) return;

  el("scoreCard").innerHTML = renderScoreCard(attempt);
  el("progressGrid").innerHTML = renderProgress(attempt);
  el("chartHost").innerHTML = renderChart(attempts);
  renderComparison(attempts);
  el("statusGrid").innerHTML = renderStatusGrid(attempt);

  const s = attempt.summary || {};
  el("attemptMeta").textContent = `Correct ${Number(s.correct || 0)}/${Number(s.total || 0)} • Incorrect ${Number(s.incorrect || 0)} • Skipped ${Number(s.skipped || 0)} • Time ${fmtTime(s.timeTakenMs || 0)}`;

  const sel = el("attemptSelect");
  if (sel) sel.value = String(attempt.id);
}

async function init() {
  try {
    setPillStatus("Connected", true);

    const { exam } = parseQuery();
    if (!exam) {
      toast("Missing exam id.", "error", 3200);
      return;
    }

    const deviceId = getDeviceId();

    // Show locally known CP immediately, then sync with Firestore (best effort).
    const localProfile = loadProfileLocal(deviceId);
    el("cpChip").textContent = `CP ${Math.max(0, Number(localProfile.cpTotal || 0))}`;
    syncProfile(deviceId)
      .then((p) => {
        el("cpChip").textContent = `CP ${Math.max(0, Number(p.cpTotal || 0))}`;
      })
      .catch(() => {});

    el("btnBack").href = `/read/read.html?exam=${encodeURIComponent(exam)}`;
    el("btnReattempt").href = `/play/play.html?exam=${encodeURIComponent(exam)}`;
    el("btnSolutions").href = `/read/read.html?exam=${encodeURIComponent(exam)}`;

    const ex = await loadExam(exam);
    el("examChip").textContent = ex.examCode ? `Code: ${ex.examCode}` : "Exam";
    el("examTitle").textContent = ex.title || "Exam";
    const meta = [
      ex.subject ? `Subject: ${ex.subject}` : "",
      ex.topic ? `Topic: ${ex.topic}` : "",
      `Questions: ${ex.totalQuestions || "—"}`
    ].filter(Boolean);
    el("examMeta").textContent = meta.join(" • ");

    // Try syncing any queued attempts first (non-blocking).
    syncQueuedAttempts(deviceId)
      .then(() => syncProfile(deviceId))
      .then((p) => {
        el("cpChip").textContent = `CP ${Math.max(0, Number(p.cpTotal || 0))}`;
      })
      .catch(() => {});

    const attempts = await loadAttempts(exam, deviceId);
    if (!attempts.length) {
      toast("No attempts found. Try reattempting.", "warn", 2800);
      el("scoreCard").innerHTML = `<div class=\"small\">No attempts found for this exam on this device.</div>`;
      return;
    }

    const questions = await loadQuestions(exam);
    ensureStaticQuestionAnalytics(exam, questions, ex).catch(() => {});

    bindAttemptSelect(attempts, (a) => setActiveAttempt(a, attempts));
    setActiveAttempt(attempts[attempts.length - 1], attempts);
    renderQuestionPattern(questions, attempts, ex);
  } catch (e) {
    setPillStatus("Offline", false);
    toast("Cannot load results. Check Firestore rules/indexes.", "error", 3200);
  }
}

init();
