import { getDeviceId, loadProfileLocal, syncProfile, cpRankProgress } from "./attempts.js";

const el = (id) => document.getElementById(id);

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ensureWidgetMount() {
  if (document.getElementById("cpWidgetChip")) return;

  const topbar = document.querySelector("header.topbar");
  if (!topbar) return;

  const host = document.createElement("div");
  host.id = "cpWidgetHost";
  host.style.display = "flex";
  host.style.alignItems = "center";
  host.style.gap = "12px";

  const chip = document.createElement("button");
  chip.id = "cpWidgetChip";
  chip.type = "button";
  chip.className = "cpWidgetChip";
  chip.setAttribute("aria-label", "Code Points and Level");
  chip.innerHTML = `
    <span class="cpBadge" id="cpWidgetBadge">CP 0</span>
    <span class="cpLabel" id="cpWidgetLabel">Level 1</span>
  `;

  host.appendChild(chip);

  const statusPill = topbar.querySelector("#statusPill");
  if (statusPill && statusPill.parentElement) {
    statusPill.parentElement.insertBefore(host, statusPill);
  } else {
    topbar.appendChild(host);
  }

  const backdrop = document.createElement("div");
  backdrop.className = "cpWidgetBackdrop";
  backdrop.id = "cpWidgetBackdrop";

  const drawer = document.createElement("aside");
  drawer.className = "cpWidgetDrawer";
  drawer.id = "cpWidgetDrawer";
  drawer.setAttribute("role", "dialog");
  drawer.setAttribute("aria-modal", "true");
  drawer.setAttribute("aria-label", "Code Points Information");

  const metricsHtml = `
    <div class="cpWidgetKpis" style="margin-top: 14px">
      <div class="cpWidgetKpi">
        <div class="cpWidgetKpiVal" data-metric="cpTotal">0</div>
        <div class="cpWidgetKpiLab">Current CP</div>
      </div>
      <div class="cpWidgetKpi">
        <div class="cpWidgetKpiVal" data-metric="level">Level 1</div>
        <div class="cpWidgetKpiLab">Current Level</div>
      </div>
      <div class="cpWidgetKpi">
        <div class="cpWidgetKpiVal" data-metric="cpRank">CP Rank 0</div>
        <div class="cpWidgetKpiLab">Current Rank</div>
      </div>
      <div class="cpWidgetKpi">
        <div class="cpWidgetKpiVal" data-metric="toNext">100 to next</div>
        <div class="cpWidgetKpiLab">To Next Level</div>
      </div>
    </div>
  `;

  drawer.innerHTML = `
    <div class="cpWidgetHead">
      <div class="cpWidgetTitleRow">
        <button class="cpWidgetIconBtn" id="cpWidgetBackBtn" type="button" aria-label="Close">←</button>
        <div>
          <div class="cpWidgetTitle">Information</div>
          <div class="cpWidgetSub" id="cpWidgetSmallMeta">Code Points • Leveling</div>
        </div>
      </div>
      <button class="cpWidgetIconBtn" id="cpWidgetCloseBtn" type="button" aria-label="Close">✕</button>
    </div>

    <div class="cpWidgetSegs" id="cpWidgetSegs"></div>

    <div class="cpWidgetBody">
      <section class="cpWidgetSlide" data-step="0">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div class="cpWidgetSub">INTRODUCING</div>
            <div class="cpWidgetBig">Level Up!</div>
            <div class="cpWidgetSub">MAKING CODING PRACTICE FUN</div>
            <div class="cpWidgetSub">Earn CP by attempting quizzes, improving accuracy, and completing more questions. Compete with friends and climb the leaderboard!</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="1">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">What is CP?</div>
            <div class="cpWidgetSub">CP, which stands for <b>Code Points</b>, is your reward currency in Coding Quiz Contest. You earn it through performance and consistency.</div>
            <div class="cpWidgetSub">We use CP to track your progress and power your <b>Level</b>.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="2">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">How do you earn CP in quizzes?</div>
            <div class="cpWidgetSub">You earn CP on every submitted attempt. Higher accuracy and completion give more CP.</div>
            <div class="cpWidgetKpis">
              <div class="cpWidgetKpi">
                <div class="cpWidgetKpiVal">+10</div>
                <div class="cpWidgetKpiLab">Base CP per attempt</div>
              </div>
              <div class="cpWidgetKpi">
                <div class="cpWidgetKpiVal">+Bonus</div>
                <div class="cpWidgetKpiLab">Accuracy + completion</div>
              </div>
            </div>
            <div class="cpWidgetNote">Note: You must submit the attempt to earn CP.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="3">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Level up and level down</div>
            <div class="cpWidgetSub">Your CP affects your <b>CP Rank</b>. Strong attempts push you up. Weak attempts can pull you down.</div>
            <div class="cpWidgetProgress">
              <div class="row" style="justify-content:space-between; gap:10px; align-items:flex-end">
                <div>
                  <div class="cpWidgetKpiVal" id="cpWidgetLevelText">Level 1</div>
                  <div class="cpWidgetKpiLab" id="cpWidgetRankText">CP Rank 0</div>
                </div>
                <div class="cpWidgetKpiVal" id="cpWidgetToNext">100 to next</div>
              </div>
              <div class="cpWidgetBar"><span id="cpWidgetBarFill"></span></div>
            </div>
            <div class="cpWidgetNote">Level is based on CP Rank. Every 100 CP Rank = next level.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="4">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Tips to grow faster</div>
            <div class="cpWidgetSub">Try these to level up quickly:</div>
            <div class="cpWidgetSub" style="text-align:left; max-width: 320px">
              <div>1) Attempt consistently</div>
              <div style="margin-top:6px">2) Improve accuracy (avoid random guesses)</div>
              <div style="margin-top:6px">3) Complete more questions per attempt</div>
            </div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="5">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">What is Leaderboard?</div>
            <div class="cpWidgetSub">The leaderboard compares your recent performance and assigns you a rank using <b>CP Rank</b>. Your rank places you into a zone that decides promotion, safety, or demotion.</div>

            <div class="cpWidgetLevelStrip" aria-label="Leaderboard levels">
              ${Array.from({ length: 10 })
                .map((_, i) => {
                  const n = i + 1;
                  return `<div class=\"cpWidgetLevelBadge\"><div class=\"cpWidgetLevelNum\">${n}</div><div class=\"cpWidgetLevelLab\">Level ${n}</div></div>`;
                })
                .join("")}
            </div>
            <div class="cpWidgetSub">Every coder starts at Level 1 and climbs by staying consistent and improving accuracy.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="6">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">What are zones?</div>
            <div class="cpWidgetSub">Each leaderboard cycle has 3 zones based on your rank:</div>

            <div class="cpWidgetZones">
              <div class="cpWidgetZoneCard prom">
                <div class="cpWidgetZoneIcon">▲</div>
                <div>
                  <div class="cpWidgetZoneTitle">Promotion zone</div>
                  <div class="cpWidgetZoneDesc">Finishing in this zone promotes you to the next level.</div>
                </div>
              </div>
              <div class="cpWidgetZoneCard safe">
                <div class="cpWidgetZoneIcon">●</div>
                <div>
                  <div class="cpWidgetZoneTitle">Safety zone</div>
                  <div class="cpWidgetZoneDesc">No promotion or demotion. You stay at the same level.</div>
                </div>
              </div>
              <div class="cpWidgetZoneCard demo">
                <div class="cpWidgetZoneIcon">▼</div>
                <div>
                  <div class="cpWidgetZoneTitle">Demotion zone</div>
                  <div class="cpWidgetZoneDesc">Finishing here drops you down one level.</div>
                </div>
              </div>
            </div>

            <div class="cpWidgetNote">Zones are determined by your CP Rank during the cycle.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="7">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">How does the leaderboard work?</div>
            <div class="cpWidgetSub">The leaderboard runs in cycles (example: 14 days). During a cycle, your recent attempts influence your CP Rank.</div>
            <div class="cpWidgetSub">At the end of the cycle, your zone decides whether you’re promoted, demoted, or stay put.</div>
            <div class="cpWidgetNote">Why does my CP Rank reset? Cycles keep competition fair and fresh. Your lifetime CP stays, but CP Rank focuses on recent form.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="8">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">How contests boost your CP</div>
            <div class="cpWidgetSub">Coding Quiz Contest events are designed to reward consistency and speed.</div>
            <div class="cpWidgetSub">Participate in contests to earn CP faster, improve your CP Rank, and unlock higher levels through real competition.</div>
            <div class="cpWidgetKpis">
              <div class="cpWidgetKpi">
                <div class="cpWidgetKpiVal">Fast</div>
                <div class="cpWidgetKpiLab">More attempts in less time</div>
              </div>
              <div class="cpWidgetKpi">
                <div class="cpWidgetKpiVal">Fair</div>
                <div class="cpWidgetKpiLab">Rank reflects recent performance</div>
              </div>
            </div>
            <div class="cpWidgetNote">Tip: Accuracy + completion matters more than random guessing.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="9">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Streaks, rewards & consistency</div>
            <div class="cpWidgetSub">Staying consistent is the easiest way to level up.</div>
            <div class="cpWidgetSub">Make a habit of attempting quizzes daily/weekly to steadily grow CP and stabilize your CP Rank during leaderboard cycles.</div>
            <div class="cpWidgetKpis">
              <div class="cpWidgetKpi">
                <div class="cpWidgetKpiVal">Streak</div>
                <div class="cpWidgetKpiLab">Keep attempting regularly</div>
              </div>
              <div class="cpWidgetKpi">
                <div class="cpWidgetKpiVal">Rewards</div>
                <div class="cpWidgetKpiLab">Higher levels unlock more</div>
              </div>
            </div>
            <div class="cpWidgetNote">Your Current CP / Level / Rank below updates live as you play.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="10">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">How CP is calculated (simple model)</div>
            <div class="cpWidgetSub">CP comes from submitted attempts. Better accuracy and completion typically results in better CP outcomes over time.</div>
            <div class="cpWidgetNote">Focus on correctness first, then speed.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="11">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">CP vs CP Rank</div>
            <div class="cpWidgetSub"><b>Current CP</b> is your total accumulated progress.</div>
            <div class="cpWidgetSub"><b>CP Rank</b> is used for leaderboard positioning and leveling.</div>
            <div class="cpWidgetNote">Your rank can change with performance; your total CP grows with activity.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="12">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Level milestones</div>
            <div class="cpWidgetSub">Levels are earned through CP Rank milestones.</div>
            <div class="cpWidgetSub">A higher level improves your credibility on the platform and helps in competitions.</div>
            <div class="cpWidgetNote">Keep your CP Rank stable by avoiding low-effort attempts.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="13">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Progress to next level</div>
            <div class="cpWidgetSub">Your <b>To Next Level</b> metric shows how close you are to leveling up.</div>
            <div class="cpWidgetSub">Consistent good attempts reduce the remaining gap.</div>
            <div class="cpWidgetNote">Try to submit fewer but higher quality attempts.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="14">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Accuracy strategy</div>
            <div class="cpWidgetSub">Accuracy is the fastest way to improve your standing.</div>
            <div class="cpWidgetKpis">
              <div class="cpWidgetKpi"><div class="cpWidgetKpiVal">Read</div><div class="cpWidgetKpiLab">Don’t rush the statement</div></div>
              <div class="cpWidgetKpi"><div class="cpWidgetKpiVal">Eliminate</div><div class="cpWidgetKpiLab">Remove wrong options first</div></div>
            </div>
            <div class="cpWidgetNote">Better accuracy usually stabilizes CP Rank.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="15">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Speed strategy (after accuracy)</div>
            <div class="cpWidgetSub">Once you’re accurate, optimize time per question.</div>
            <div class="cpWidgetSub">Use patterns: common pitfalls, edge cases, and typical traps.</div>
            <div class="cpWidgetNote">Speed without accuracy often hurts leaderboard performance.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="16">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Consistency plan (7-day)</div>
            <div class="cpWidgetSub">A simple plan to level up faster:</div>
            <div class="cpWidgetSub" style="text-align:left; max-width: 340px">
              <div>1) Attempt daily (even 1 quiz)</div>
              <div style="margin-top:6px">2) Review mistakes immediately</div>
              <div style="margin-top:6px">3) Increase attempts on contest days</div>
            </div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="17">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Why rank can drop</div>
            <div class="cpWidgetSub">CP Rank reflects recent performance. Poor attempts can reduce it.</div>
            <div class="cpWidgetSub">If you see rank going down, slow down and prioritize correctness.</div>
            <div class="cpWidgetNote">A short recovery streak can stabilize you again.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="18">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Contest readiness checklist</div>
            <div class="cpWidgetSub" style="text-align:left; max-width: 360px">
              <div>1) Warm up with 5 quick questions</div>
              <div style="margin-top:6px">2) Keep an eye on time</div>
              <div style="margin-top:6px">3) Avoid random guesses</div>
              <div style="margin-top:6px">4) Submit only when sure</div>
            </div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="19">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Streaks explained</div>
            <div class="cpWidgetSub">Streaks reward consistent participation across days/weeks.</div>
            <div class="cpWidgetSub">They help you maintain momentum and improve rank steadily.</div>
            <div class="cpWidgetNote">Try to build a habit: same time every day.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="20">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Rewards by level</div>
            <div class="cpWidgetSub">Higher levels can unlock better recognition and special contest benefits.</div>
            <div class="cpWidgetSub">Keep climbing to access more features and community status.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="21">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Improving through review</div>
            <div class="cpWidgetSub">The best CP growth comes from reviewing wrong answers and learning patterns.</div>
            <div class="cpWidgetKpis">
              <div class="cpWidgetKpi"><div class="cpWidgetKpiVal">Log</div><div class="cpWidgetKpiLab">Note your mistakes</div></div>
              <div class="cpWidgetKpi"><div class="cpWidgetKpiVal">Fix</div><div class="cpWidgetKpiLab">Retest the concept</div></div>
            </div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="22">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Fair play & leaderboard integrity</div>
            <div class="cpWidgetSub">The leaderboard is meaningful only when attempts are genuine.</div>
            <div class="cpWidgetSub">Avoid spamming attempts; it won’t help long-term rank.</div>
            <div class="cpWidgetNote">High quality activity leads to stable growth.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="23">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Common mistakes that slow leveling</div>
            <div class="cpWidgetSub" style="text-align:left; max-width: 360px">
              <div>1) Guessing without reasoning</div>
              <div style="margin-top:6px">2) Not reviewing wrong answers</div>
              <div style="margin-top:6px">3) Being inconsistent (long gaps)</div>
            </div>
            ${metricsHtml}
          </div>
        </div>
      </section>

      <section class="cpWidgetSlide" data-step="24">
        <div class="cpWidgetHero">
          <div class="cpWidgetCenter">
            <div style="font-weight:800; font-size:18px; letter-spacing:-.02em">Your dashboard (live)</div>
            <div class="cpWidgetSub">This is your current snapshot. Use it to track improvement over time.</div>
            <div class="cpWidgetNote">Aim to reduce “to next” steadily with accurate attempts.</div>
            ${metricsHtml}
          </div>
        </div>
      </section>
    </div>

    <div class="cpWidgetFooter">
      <button class="cpWidgetNavBtn" id="cpWidgetPrev" type="button">← Previous</button>
      <button class="cpWidgetNavBtn primary" id="cpWidgetNext" type="button">Next →</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);

  const segWrap = el("cpWidgetSegs");
  if (segWrap) {
    const slides = Array.from(drawer.querySelectorAll(".cpWidgetSlide"));
    segWrap.innerHTML = slides.map(() => `<div class=\"cpWidgetSeg\"><span></span></div>`).join("");
  }

  chip.addEventListener("click", () => openDrawer());
  backdrop.addEventListener("click", () => closeDrawer());
  el("cpWidgetCloseBtn")?.addEventListener("click", () => closeDrawer());
  el("cpWidgetBackBtn")?.addEventListener("click", () => closeDrawer());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  el("cpWidgetPrev")?.addEventListener("click", () => stepBy(-1));
  el("cpWidgetNext")?.addEventListener("click", () => stepBy(1));

  setStep(0);

  try {
    window.cqcpOpenInfoDrawer = (step = 0) => openDrawer(step);
    window.cqcpCloseInfoDrawer = () => closeDrawer();
  } catch {
    // ignore
  }
}

let currentStep = 0;

function setStep(n) {
  const drawer = el("cpWidgetDrawer");
  if (!drawer) return;

  const slides = Array.from(drawer.querySelectorAll(".cpWidgetSlide"));
  const max = Math.max(0, slides.length - 1);
  currentStep = Math.max(0, Math.min(max, Number(n || 0)));

  for (const s of slides) {
    const step = Number(s.getAttribute("data-step") || 0);
    s.classList.toggle("show", step === currentStep);
  }

  const segWrap = el("cpWidgetSegs");
  if (segWrap) {
    const segs = Array.from(segWrap.querySelectorAll(".cpWidgetSeg > span"));
    segs.forEach((seg, i) => {
      seg.style.width = i <= currentStep ? "100%" : "0%";
    });
  }

  const prevBtn = el("cpWidgetPrev");
  const nextBtn = el("cpWidgetNext");
  if (prevBtn) prevBtn.style.opacity = currentStep === 0 ? "0.55" : "1";
  if (nextBtn) nextBtn.textContent = currentStep === max ? "Done" : "Next →";
}

function stepBy(delta) {
  const drawer = el("cpWidgetDrawer");
  if (!drawer) return;

  const slides = Array.from(drawer.querySelectorAll(".cpWidgetSlide"));
  const max = Math.max(0, slides.length - 1);
  const next = currentStep + Number(delta || 0);

  if (next > max) {
    closeDrawer();
    return;
  }
  setStep(next);
}

function openDrawer(step = null) {
  if (step !== null && step !== undefined) setStep(Number(step || 0));
  el("cpWidgetBackdrop")?.classList.add("show");
  el("cpWidgetDrawer")?.classList.add("show");
}

function closeDrawer() {
  el("cpWidgetBackdrop")?.classList.remove("show");
  el("cpWidgetDrawer")?.classList.remove("show");
}

function updateChip(profile) {
  const badge = el("cpWidgetBadge");
  const label = el("cpWidgetLabel");
  if (badge) badge.textContent = `CP ${Math.max(0, Number(profile?.cpTotal || 0))}`;
  if (label) label.textContent = `Level ${Math.max(1, Number(profile?.level || 1))}`;

  const prog = cpRankProgress(profile?.cpRank || 0);
  const lvl = el("cpWidgetLevelText");
  const rk = el("cpWidgetRankText");
  const toNext = el("cpWidgetToNext");
  const fill = el("cpWidgetBarFill");

  if (lvl) lvl.textContent = `Level ${prog.level}`;
  if (rk) rk.textContent = `CP Rank ${Math.max(0, Number(profile?.cpRank || 0))}`;
  if (toNext) toNext.textContent = `${prog.toNext} to next`;
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, prog.inLevel))}%`;

  updateMetrics(profile);
}

function updateMetrics(profile) {
  const p = profile && typeof profile === "object" ? profile : { cpTotal: 0, cpRank: 0, level: 1 };
  const cpTotal = Math.max(0, Number(p.cpTotal || 0));
  const cpRank = Math.max(0, Number(p.cpRank || 0));
  const prog = cpRankProgress(cpRank);
  const level = Math.max(1, Number(p.level || prog.level || 1));

  document.querySelectorAll('[data-metric="cpTotal"]').forEach((n) => (n.textContent = String(cpTotal)));
  document.querySelectorAll('[data-metric="level"]').forEach((n) => (n.textContent = `Level ${level}`));
  document.querySelectorAll('[data-metric="cpRank"]').forEach((n) => (n.textContent = `CP Rank ${cpRank}`));
  document.querySelectorAll('[data-metric="toNext"]').forEach((n) => (n.textContent = `${prog.toNext} to next`));
}

async function init() {
  ensureWidgetMount();

  const deviceId = getDeviceId();
  const local = loadProfileLocal(deviceId);
  updateChip(local);

  try {
    const remote = await syncProfile(deviceId);
    updateChip(remote);
  } catch {
    // ignore
  }

  // Listen for app-wide updates
  window.addEventListener("cqcp:profile", (e) => {
    try {
      const p = e?.detail;
      if (p) updateChip(p);
    } catch {
      // ignore
    }
  });
}

init();
