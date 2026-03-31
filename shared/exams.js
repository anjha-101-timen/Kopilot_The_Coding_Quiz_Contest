import { clampText } from "./ui.js";

export const EXAM_DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

export const ACADEMIC_LEVELS = [
  "Nursery",
  "LKG",
  "UKG",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "6th Year"
];

export const SEMESTERS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export const SECTION_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const SECTION_NUMERIC = Array.from({ length: 99 }, (_, i) => String(i + 1));

export function emptyExam() {
  return {
    title: "",
    academicBranch: "",
    examCode: "",
    subject: "",
    topic: "",
    description: "",

    difficulty: "medium",
    positiveMarks: 2,
    negativeMarks: 0.5,

    scheduledDate: "",
    scheduledTime: "",

    durationHours: 2,
    durationMinutes: 0,

    totalQuestions: 30,
    timePerQuestionMinutes: 1,
    timePerQuestionSeconds: 0,

    academicLevels: [],
    sectionMode: "alpha",
    assignedSections: [],
    semesters: []
  };
}

export function toExamDocModel(m) {
  const x = structuredClone(m);
  x.title = String(x.title || "").trim();
  x.academicBranch = String(x.academicBranch || "").trim();
  x.examCode = String(x.examCode || "").trim();
  x.subject = String(x.subject || "").trim();
  x.topic = String(x.topic || "").trim();
  x.description = String(x.description || "").trim();
  x.difficulty = (x.difficulty || "medium").toLowerCase();

  x.positiveMarks = safeNum(x.positiveMarks, 0, 100, 2);
  x.negativeMarks = safeNum(x.negativeMarks, 0, 100, 0.5);

  x.durationHours = safeInt(x.durationHours, 1, 5, 2);
  x.durationMinutes = safeInt(x.durationMinutes, 0, 59, 0);

  x.totalQuestions = safeInt(x.totalQuestions, 1, 250, 30);
  x.timePerQuestionMinutes = safeInt(x.timePerQuestionMinutes, 0, 10, 1);
  x.timePerQuestionSeconds = safeInt(x.timePerQuestionSeconds, 0, 59, 0);

  x.academicLevels = normalizePickList(x.academicLevels);
  x.assignedSections = normalizePickList(x.assignedSections);
  x.semesters = normalizePickList(x.semesters);
  x.sectionMode = x.sectionMode === "numeric" ? "numeric" : "alpha";

  x.scheduledDate = String(x.scheduledDate || "");
  x.scheduledTime = String(x.scheduledTime || "");

  return x;
}

export function validateExam(m) {
  const errors = [];
  if (!String(m.title || "").trim()) errors.push("Examination title is required.");
  if (!String(m.examCode || "").trim()) errors.push("Examination code is required.");
  if (!String(m.subject || "").trim()) errors.push("Subject is required.");
  if (!String(m.topic || "").trim()) errors.push("Topic is required.");
  return errors;
}

export function renderExamCard(exam) {
  const title = escapeHtml(exam.title || "Untitled Exam");
  const code = escapeHtml(exam.examCode || "—");
  const subject = escapeHtml(exam.subject || "—");
  const topic = escapeHtml(clampText(exam.topic || "", 42));
  const meta = [
    exam.difficulty ? String(exam.difficulty).toUpperCase() : "—",
    `${Number(exam.totalQuestions || 0)} Q`,
    `${Number(exam.durationHours || 0)}h ${String(exam.durationMinutes || 0).padStart(2, "0")}m`
  ];

  return `
    <article class="examCard" data-exam-id="${escapeHtml(exam.id)}">
      <div class="examTop">
        <div class="examTitle">${title}</div>
        <div class="row" style="gap:10px; align-items:center">
          <button class="iconBtn" type="button" data-action="bookmark" data-kind="exam" data-target-id="${escapeHtml(exam.id)}" aria-label="Bookmark">☆</button>
          <span class="kbd">${code}</span>
        </div>
      </div>
      <div class="examSub">${subject} • ${topic || "—"}</div>
      <div class="examMeta">
        ${meta.map((m) => `<span class="tag">${escapeHtml(m)}</span>`).join("")}
      </div>
      <div class="examActions">
        <button class="btn smallBtn" data-action="open">Open</button>
        <a class="btn smallBtn" href="${new URL(`../results/results.html?exam=${encodeURIComponent(exam.id)}`, import.meta.url).href}">Results</a>
        <a class="btn smallBtn ghost" href="${new URL(`../update/update.html?exam=${encodeURIComponent(exam.id)}`, import.meta.url).href}">Manage</a>
      </div>
    </article>
  `;
}

function normalizePickList(v) {
  const xs = Array.isArray(v) ? v : [];
  const set = new Set(xs.map((x) => String(x || "").trim()).filter(Boolean));
  return Array.from(set);
}

function safeInt(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function safeNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
