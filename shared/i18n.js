import { flattenLangs } from "./langs.js";
import { mergeSamplePacks, SAMPLE_TRANSLATION_PACKS } from "./i18n-packs-sample.js";

const DICT = {
  en: {
    "pref.title": "Preferences",
    "pref.zoom": "Zoom",
    "pref.font": "Font",
    "pref.lang": "Language",
    "pref.appliesSiteWide": "Applies site-wide",
    "pref.langHint": "UI preference (content translation depends on page)",

    "nav.codersTester": "Coders Tester",
    "nav.branches": "Branches",
    "nav.contests": "Contests",
    "nav.leaderboard": "Leaderboard",
    "nav.notifications": "Notifications",
    "nav.bookmarks": "Bookmarks",
    "nav.announcements": "Announcements",
    "nav.settings": "Settings",
    "nav.refer": "Refer & Earn",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.languages": "Languages",

    "crud.create": "Create",
    "crud.read": "Read",
    "crud.update": "Update",
    "crud.delete": "Delete"
  },
  hi: {
    "pref.title": "पसंद",
    "pref.zoom": "ज़ूम",
    "pref.font": "फ़ॉन्ट",
    "pref.lang": "भाषा",
    "pref.appliesSiteWide": "पूरी वेबसाइट पर लागू",
    "pref.langHint": "UI पसंद (कंटेंट अनुवाद पेज पर निर्भर)",

    "nav.codersTester": "कोडर्स टेस्टर",
    "nav.branches": "ब्रांचेस",
    "nav.contests": "कॉन्टेस्ट",
    "nav.leaderboard": "लीडरबोर्ड",
    "nav.notifications": "सूचनाएँ",
    "nav.bookmarks": "बुकमार्क्स",
    "nav.announcements": "घोषणाएँ",
    "nav.settings": "सेटिंग्स",
    "nav.refer": "रेफर और कमाएँ",
    "nav.about": "परिचय",
    "nav.contact": "संपर्क",
    "nav.languages": "भाषाएँ",

    "crud.create": "बनाएँ",
    "crud.read": "पढ़ें",
    "crud.update": "अपडेट",
    "crud.delete": "हटाएँ"
  }
};

const FALLBACK_DICT_CACHE = new Map();

function supportedLangSet() {
  try {
    const s = new Set(flattenLangs().map((l) => String(l.code || "").toLowerCase()).filter(Boolean));
    s.add("en");
    return s;
  } catch {
    return new Set(["en", ...Object.keys(DICT)]);
  }
}

function getDict(lang) {
  const l = String(lang || "en").toLowerCase();
  if (DICT[l]) return DICT[l];
  if (!supportedLangSet().has(l)) return DICT.en;
  if (FALLBACK_DICT_CACHE.has(l)) return FALLBACK_DICT_CACHE.get(l);
  FALLBACK_DICT_CACHE.set(l, DICT.en);
  return DICT.en;
}

function hasLangPack(lang) {
  const l = String(lang || "en").toLowerCase();
  if (l === "en") return true;
  return !!DICT[l] || !!PHRASES[l];
}

function pseudoTranslate(text, lang) {
  const l = String(lang || "en").toLowerCase();
  if (l === "en") return text;
  // Offline fallback: make it obvious the language selection applied even if we don't
  // have a human translation pack yet.
  return `[${l}] ${text}`;
}

// Phrase-level translations (auto mode).
// Keys are literal English strings as they appear in the UI.
// This lets us translate most of the site instantly without adding data-i18n attributes everywhere.
const PHRASES = {
  hi: {
    "Home": "होम",
    "Create": "बनाएँ",
    "Read": "पढ़ें",
    "Update": "अपडेट",
    "Delete": "हटाएँ",
    "Leaderboard": "लीडरबोर्ड",
    "About": "परिचय",
    "Contact": "संपर्क",
    "Refer & Earn": "रेफर और कमाएँ",
    "Browse": "ब्राउज़",
    "Publish": "पब्लिश",
    "Preferences": "पसंद",
    "Settings": "सेटिंग्स",
    "Language": "भाषा",
    "Font": "फ़ॉन्ट",
    "Zoom": "ज़ूम",
    "Contests": "कॉन्टेस्ट",
    "Branches": "ब्रांचेस",
    "Coders Tester": "कोडर्स टेस्टर",
    "Notifications": "सूचनाएँ",
    "Bookmarks": "बुकमार्क्स",
    "Announcements": "घोषणाएँ",
    "Reset": "रीसेट",
    "Save": "सेव",
    "Search": "खोजें",
    "Filters": "फ़िल्टर",
    "Reset Filters": "फ़िल्टर रीसेट करें",
    "All": "सभी",
    "Live": "लाइव",
    "Upcoming": "आगामी",
    "Past": "पिछले",
    "Contest Code": "कॉन्टेस्ट कोड",
    "Contest Name": "कॉन्टेस्ट नाम",
    "Year": "वर्ष",
    "Month": "महीना",
    "Day": "दिन",
    "Hour": "घंटा",
    "Minute": "मिनट",
    "Second": "सेकंड",
    "Duration": "अवधि",
    "Participants": "प्रतिभागी",
    "Start": "शुरू",
    "End": "समाप्त",
    "Status": "स्थिति"
  }
};

// Merge sample translation packs for additional languages
mergeSamplePacks(DICT);

function normalizePhrase(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

function translatePhrase(text, lang) {
  const l = String(lang || "en").toLowerCase();
  if (l === "en") return text;
  const key = normalizePhrase(text);
  const hit = PHRASES[l]?.[key];
  if (hit) return hit;
  if (!hasLangPack(l) && supportedLangSet().has(l)) return pseudoTranslate(text, l);
  return text;
}

function shouldAutoTranslateEl(el) {
  if (!el || el.nodeType !== 1) return false;
  const tag = el.tagName;
  // Don't touch scripts/styles.
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return false;
  // For user-entered fields, we still translate placeholder/title/aria-label,
  // but we avoid mutating the live input value/text.
  // Don't translate inside code/pre blocks.
  if (tag === "CODE" || tag === "PRE") return false;
  return true;
}

function applyAutoPhraseTranslations(lang, root = document) {
  const l = String(lang || "en").toLowerCase();
  const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;
  while (node) {
    const el = node;
    if (shouldAutoTranslateEl(el)) {
      // Translate placeholders for inputs/selects if they exist (skip input/textarea text, handled elsewhere)
      if (el.hasAttribute && el.hasAttribute("placeholder")) {
        const orig = el.getAttribute("data-i18n-orig-placeholder") ?? el.getAttribute("placeholder") ?? "";
        if (!el.hasAttribute("data-i18n-orig-placeholder")) el.setAttribute("data-i18n-orig-placeholder", orig);
        const next = l === "en" ? orig : translatePhrase(orig, l);
        el.setAttribute("placeholder", next);
      }

      // Translate title/aria-label
      const title = el.getAttribute && el.getAttribute("title");
      if (title) {
        const orig = el.getAttribute("data-i18n-orig-title") ?? title;
        if (!el.hasAttribute("data-i18n-orig-title")) el.setAttribute("data-i18n-orig-title", orig);
        const next = l === "en" ? orig : translatePhrase(orig, l);
        el.setAttribute("title", next);
      }
      const aria = el.getAttribute && el.getAttribute("aria-label");
      if (aria) {
        const orig = el.getAttribute("data-i18n-orig-aria") ?? aria;
        if (!el.hasAttribute("data-i18n-orig-aria")) el.setAttribute("data-i18n-orig-aria", orig);
        const next = l === "en" ? orig : translatePhrase(orig, l);
        el.setAttribute("aria-label", next);
      }

      // Translate simple text content (elements that are basically a label)
      const tag = el.tagName;
      if (tag !== "INPUT" && tag !== "TEXTAREA" && el.childElementCount === 0) {
        const text = el.textContent;
        if (text && normalizePhrase(text)) {
          const orig = el.getAttribute("data-i18n-orig-text") ?? text;
          if (!el.hasAttribute("data-i18n-orig-text")) el.setAttribute("data-i18n-orig-text", orig);
          const next = l === "en" ? orig : translatePhrase(orig, l);
          if (next !== text) el.textContent = next;
        }
      }
    }
    node = walker.nextNode();
  }
}

export function t(key, lang = "en") {
  const l = String(lang || "en").toLowerCase();
  const d = getDict(l);
  const base = d?.[key] ?? DICT.en[key] ?? key;
  if (l !== "en" && !DICT[l] && supportedLangSet().has(l)) {
    return pseudoTranslate(base, l);
  }
  return base;
}

export function applyTranslations(lang, root = document) {
  const l = String(lang || "en").toLowerCase();

  const nodes = Array.from(root.querySelectorAll("[data-i18n]"));
  for (const n of nodes) {
    const key = n.getAttribute("data-i18n");
    if (!key) continue;
    n.textContent = t(key, l);
  }

  const htmlNodes = Array.from(root.querySelectorAll("[data-i18n-html]"));
  for (const n of htmlNodes) {
    const key = n.getAttribute("data-i18n-html");
    if (!key) continue;
    n.innerHTML = t(key, l);
  }

  const phNodes = Array.from(root.querySelectorAll("[data-i18n-placeholder]"));
  for (const n of phNodes) {
    const key = n.getAttribute("data-i18n-placeholder");
    if (!key) continue;
    n.setAttribute("placeholder", t(key, l));
  }

  const titleNodes = Array.from(root.querySelectorAll("[data-i18n-title]"));
  for (const n of titleNodes) {
    const key = n.getAttribute("data-i18n-title");
    if (!key) continue;
    const val = t(key, l);
    n.setAttribute("title", val);
    n.setAttribute("aria-label", val);
  }

  // Auto phrase translation across the rest of the DOM.
  applyAutoPhraseTranslations(l, root);

  document.documentElement.setAttribute("data-lang", l);
  document.documentElement.setAttribute("lang", l);
}

export function getSupportedLangs() {
  // Support all language codes present in the selector (100 total: 22 India + 78 global).
  // Most languages will currently fall back to English unless a pack exists in DICT/PHRASES.
  try {
    const codes = Array.from(new Set(flattenLangs().map((l) => String(l.code || "").toLowerCase()).filter(Boolean)));
    if (!codes.includes("en")) codes.unshift("en");
    return codes;
  } catch {
    return Object.keys(DICT);
  }
}
