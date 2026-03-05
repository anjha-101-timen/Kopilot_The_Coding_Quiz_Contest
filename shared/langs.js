export const LANG_GROUPS = [
  {
    group: "India (Scheduled Languages)",
    langs: [
      { code: "as", label: "Assamese" },
      { code: "bn", label: "Bengali" },
      { code: "brx", label: "Bodo" },
      { code: "doi", label: "Dogri" },
      { code: "gu", label: "Gujarati" },
      { code: "hi", label: "Hindi" },
      { code: "kn", label: "Kannada" },
      { code: "ks", label: "Kashmiri" },
      { code: "kok", label: "Konkani" },
      { code: "mai", label: "Maithili" },
      { code: "ml", label: "Malayalam" },
      { code: "mni-Mtei", label: "Manipuri (Meitei)" },
      { code: "mr", label: "Marathi" },
      { code: "ne", label: "Nepali" },
      { code: "or", label: "Odia" },
      { code: "pa", label: "Punjabi" },
      { code: "sa", label: "Sanskrit" },
      { code: "sat", label: "Santali" },
      { code: "sd", label: "Sindhi" },
      { code: "ta", label: "Tamil" },
      { code: "te", label: "Telugu" },
      { code: "ur", label: "Urdu" }
    ]
  },
  {
    group: "Global",
    langs: [
      { code: "en", label: "English" },
      { code: "zh", label: "Mandarin Chinese" },
      { code: "es", label: "Spanish" },
      { code: "ar", label: "Arabic" },
      { code: "fr", label: "French" },
      { code: "pt", label: "Portuguese" },
      { code: "ru", label: "Russian" },
      { code: "de", label: "German" },
      { code: "ja", label: "Japanese" },
      { code: "ko", label: "Korean" }
    ]
  },
  {
    group: "Europe",
    langs: [
      { code: "it", label: "Italian" },
      { code: "nl", label: "Dutch" },
      { code: "el", label: "Greek" },
      { code: "pl", label: "Polish" },
      { code: "uk", label: "Ukrainian" },
      { code: "ro", label: "Romanian" },
      { code: "cs", label: "Czech" },
      { code: "hu", label: "Hungarian" },
      { code: "sv", label: "Swedish" },
      { code: "no", label: "Norwegian" },
      { code: "da", label: "Danish" },
      { code: "fi", label: "Finnish" },
      { code: "sk", label: "Slovak" },
      { code: "bg", label: "Bulgarian" },
      { code: "sr", label: "Serbian" },
      { code: "hr", label: "Croatian" },
      { code: "sl", label: "Slovenian" },
      { code: "lt", label: "Lithuanian" },
      { code: "lv", label: "Latvian" },
      { code: "et", label: "Estonian" }
    ]
  },
  {
    group: "East & Southeast Asia",
    langs: [
      { code: "th", label: "Thai" },
      { code: "vi", label: "Vietnamese" },
      { code: "id", label: "Indonesian" },
      { code: "ms", label: "Malay" },
      { code: "fil", label: "Filipino" },
      { code: "my", label: "Burmese" },
      { code: "km", label: "Khmer" },
      { code: "lo", label: "Lao" },
      { code: "mn", label: "Mongolian" },
      { code: "bo", label: "Tibetan" }
    ]
  },
  {
    group: "Middle East & Central Asia",
    langs: [
      { code: "tr", label: "Turkish" },
      { code: "fa", label: "Persian" },
      { code: "he", label: "Hebrew" },
      { code: "ku", label: "Kurdish" },
      { code: "kk", label: "Kazakh" },
      { code: "uz", label: "Uzbek" },
      { code: "az", label: "Azerbaijani" },
      { code: "hy", label: "Armenian" },
      { code: "ka", label: "Georgian" },
      { code: "ps", label: "Pashto" }
    ]
  },
  {
    group: "Africa",
    langs: [
      { code: "sw", label: "Swahili" },
      { code: "ha", label: "Hausa" },
      { code: "yo", label: "Yoruba" },
      { code: "ig", label: "Igbo" },
      { code: "am", label: "Amharic" },
      { code: "zu", label: "Zulu" },
      { code: "xh", label: "Xhosa" },
      { code: "so", label: "Somali" },
      { code: "af", label: "Afrikaans" },
      { code: "mg", label: "Malagasy" }
    ]
  },
  {
    group: "Americas & Others",
    langs: [
      { code: "qu", label: "Quechua" },
      { code: "gn", label: "Guarani" },
      { code: "ay", label: "Aymara" },
      { code: "ht", label: "Haitian Creole" },
      { code: "ca", label: "Catalan" },
      { code: "eu", label: "Basque" },
      { code: "gl", label: "Galician" },
      { code: "is", label: "Icelandic" },
      { code: "ga", label: "Irish" },
      { code: "cy", label: "Welsh" },
      { code: "sq", label: "Albanian" },
      { code: "mk", label: "Macedonian" },
      { code: "be", label: "Belarusian" },
      { code: "bs", label: "Bosnian" },
      { code: "tt", label: "Tatar" },
      { code: "lb", label: "Luxembourgish" },
      { code: "mi", label: "Maori" },
      { code: "sm", label: "Samoan" }
    ]
  }
];

export function flattenLangs() {
  const out = [];
  for (const g of LANG_GROUPS) {
    for (const l of g.langs) out.push({ ...l, group: g.group });
  }
  return out;
}

export function findLangLabel(code) {
  const c = String(code || "").toLowerCase();
  for (const l of flattenLangs()) {
    if (String(l.code).toLowerCase() === c) return l.label;
  }
  return c || "en";
}
