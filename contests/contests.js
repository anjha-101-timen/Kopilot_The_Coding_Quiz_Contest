import { setPillStatus, toast } from "/shared/ui.js";

function pad2(n){
  const x = Math.max(0, Number(n||0));
  return x < 10 ? `0${x}` : String(x);
}

function fmtDate(d){
  const dt = new Date(d);
  const y = dt.getFullYear();
  const mo = pad2(dt.getMonth()+1);
  const da = pad2(dt.getDate());
  const hh = pad2(dt.getHours());
  const mm = pad2(dt.getMinutes());
  const ss = pad2(dt.getSeconds());
  return `${y}-${mo}-${da} ${hh}:${mm}:${ss}`;
}

function durationMin(start, end){
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.max(0, Math.round((b-a)/60000));
}

function getStatus(now, start, end){
  const n = now.getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (n >= s && n <= e) return "live";
  if (n < s) return "upcoming";
  return "past";
}

// Demo data (replace with Firebase later if desired)
const contests = [
  { code: "CQC_DAILY_01", name: "Daily Coding Challenge", start: "2026-03-04T20:00:00+05:30", end: "2026-03-04T20:45:00+05:30", participants: 2850 },
  { code: "CQC_WEEKLY_09", name: "Weekly Grand Contest", start: "2026-03-09T19:00:00+05:30", end: "2026-03-09T21:00:00+05:30", participants: 12450 },
  { code: "CQC_MONTHLY_03", name: "Monthly Master Challenge", start: "2026-03-31T18:30:00+05:30", end: "2026-03-31T21:30:00+05:30", participants: 51200 },
  { code: "CQC_PAST_21", name: "Interview Prep Sprint", start: "2026-02-14T18:00:00+05:30", end: "2026-02-14T20:00:00+05:30", participants: 9800 },
  { code: "CQC_PAST_22", name: "DSA Speedrun", start: "2026-02-22T10:00:00+05:30", end: "2026-02-22T11:30:00+05:30", participants: 7600 }
];

function fillSelect(sel, opts, placeholder){
  if (!sel) return;
  sel.innerHTML = "";
  const p = document.createElement("option");
  p.value = "";
  p.textContent = placeholder;
  sel.appendChild(p);
  for (const o of opts){
    const opt = document.createElement("option");
    opt.value = String(o.value);
    opt.textContent = String(o.label);
    sel.appendChild(opt);
  }
}

function readNum(id){
  const el = document.getElementById(id);
  if (!el) return null;
  const v = String(el.value||"").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function matchesDateParts(dt, parts){
  if (parts.year && dt.getFullYear() !== parts.year) return false;
  if (parts.month && (dt.getMonth()+1) !== parts.month) return false;
  if (parts.day && dt.getDate() !== parts.day) return false;
  if (parts.hour != null && dt.getHours() !== parts.hour) return false;
  if (parts.minute != null && dt.getMinutes() !== parts.minute) return false;
  if (parts.second != null && dt.getSeconds() !== parts.second) return false;
  return true;
}

function render(){
  const tbody = document.getElementById("contestsTbody");
  const count = document.getElementById("contestsCount");
  if (!tbody) return;

  const now = new Date();

  const status = document.querySelector(".filterTab.on")?.getAttribute("data-status") || "all";
  const fCode = String(document.getElementById("fCode")?.value || "").trim().toLowerCase();
  const fName = String(document.getElementById("fName")?.value || "").trim().toLowerCase();

  const year = Number(document.getElementById("fYear")?.value || "") || null;
  const month = Number(document.getElementById("fMonth")?.value || "") || null;
  const day = Number(document.getElementById("fDay")?.value || "") || null;

  const hourRaw = document.getElementById("fHour")?.value;
  const minuteRaw = document.getElementById("fMinute")?.value;
  const secondRaw = document.getElementById("fSecond")?.value;
  const hour = hourRaw === "" || hourRaw == null ? null : Number(hourRaw);
  const minute = minuteRaw === "" || minuteRaw == null ? null : Number(minuteRaw);
  const second = secondRaw === "" || secondRaw == null ? null : Number(secondRaw);

  const minDur = readNum("fMinDur");
  const maxDur = readNum("fMaxDur");
  const minPart = readNum("fMinPart");
  const maxPart = readNum("fMaxPart");

  const parts = { year, month, day, hour, minute, second };

  const out = contests
    .map((c) => {
      const s = new Date(c.start);
      const e = new Date(c.end);
      const st = getStatus(now, c.start, c.end);
      return { ...c, _start: s, _end: e, _status: st, _dur: durationMin(c.start, c.end) };
    })
    .filter((c) => {
      if (status !== "all" && c._status !== status) return false;
      if (fCode && !String(c.code||"").toLowerCase().includes(fCode)) return false;
      if (fName && !String(c.name||"").toLowerCase().includes(fName)) return false;
      if (!matchesDateParts(c._start, parts)) return false;
      if (minDur != null && c._dur < minDur) return false;
      if (maxDur != null && c._dur > maxDur) return false;
      if (minPart != null && Number(c.participants||0) < minPart) return false;
      if (maxPart != null && Number(c.participants||0) > maxPart) return false;
      return true;
    })
    .sort((a,b)=> a._start.getTime() - b._start.getTime());

  tbody.innerHTML = out
    .map((c) => {
      const st = c._status;
      const label = st === "live" ? "LIVE" : st === "upcoming" ? "UPCOMING" : "PAST";
      return `
        <tr>
          <td>
            <span class="statusPill ${st}">
              <span class="statusDot"></span>
              ${label}
            </span>
          </td>
          <td><div class="mono">${fmtDate(c._start)}</div></td>
          <td><div class="mono">${fmtDate(c._end)}</div></td>
          <td><div class="mono">${c.code}</div></td>
          <td>
            <div class="nameCell">${c.name}</div>
            <div class="subCell">Starts: ${c._start.toLocaleString()}</div>
          </td>
          <td>${c._dur} min</td>
          <td>${Number(c.participants||0).toLocaleString()}</td>
        </tr>
      `;
    })
    .join("");

  if (count) count.textContent = `${out.length} contest(s) shown`;
}

function mount(){
  setPillStatus("Ready", true);

  const years = [];
  const now = new Date();
  const y0 = now.getFullYear() - 2;
  const y1 = now.getFullYear() + 2;
  for (let y=y0; y<=y1; y++) years.push({ value: y, label: String(y) });

  const months = Array.from({length:12}, (_,i)=>({ value: i+1, label: pad2(i+1) }));
  const days = Array.from({length:31}, (_,i)=>({ value: i+1, label: pad2(i+1) }));
  const hours = Array.from({length:24}, (_,i)=>({ value: i, label: pad2(i) }));
  const mins = Array.from({length:60}, (_,i)=>({ value: i, label: pad2(i) }));

  fillSelect(document.getElementById("fYear"), years, "Any");
  fillSelect(document.getElementById("fMonth"), months, "Any");
  fillSelect(document.getElementById("fDay"), days, "Any");
  fillSelect(document.getElementById("fHour"), hours, "Any");
  fillSelect(document.getElementById("fMinute"), mins, "Any");
  fillSelect(document.getElementById("fSecond"), mins, "Any");

  document.querySelectorAll(".filterTab").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".filterTab").forEach((x)=>x.classList.remove("on"));
      b.classList.add("on");
      render();
    });
  });

  const inputs = ["fCode","fName","fYear","fMonth","fDay","fHour","fMinute","fSecond","fMinDur","fMaxDur","fMinPart","fMaxPart"];
  for (const id of inputs){
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  }

  document.getElementById("btnResetFilters")?.addEventListener("click", () => {
    for (const id of inputs){
      const el = document.getElementById(id);
      if (!el) continue;
      el.value = "";
    }
    document.querySelectorAll(".filterTab").forEach((x)=>x.classList.remove("on"));
    document.querySelector(".filterTab[data-status='all']")?.classList.add("on");
    render();
    toast("Filters reset");
  });

  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
