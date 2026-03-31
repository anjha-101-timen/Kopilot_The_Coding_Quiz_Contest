# Offline i18n Implementation Guide

## Overview
The Coding Quiz Contest platform supports 100 languages with offline-friendly internationalization. The system falls back to English or pseudo-translation for languages without dedicated translation packs.

## Architecture

### Core Files
- `/shared/i18n.js` - Main i18n engine with fallback logic
- `/shared/i18n-packs-sample.js` - Sample translation packs for 10 languages
- `/shared/langs.js` - Language definitions and codes

### Key Features
1. **Offline Operation** - No external API calls for translations
2. **Instant UI Updates** - All text, placeholders, titles, and aria-labels update immediately
3. **Fallback System** - English fallback → pseudo-translation for unsupported languages
4. **Auto-Translation** - Automatically translates text content across the DOM
5. **100 Language Support** - Supports all language codes in the language selector

## Adding New Language Packs

### Structure
Each language pack follows this structure:
```javascript
{
  "language-code": {
    nav: {
      home: "Translation",
      testseries: "Translation",
      // ... more navigation items
    },
    common: {
      start: "Translation",
      resume: "Translation",
      // ... more common items
    },
    testseries: {
      demo: "Translation",
      "topic-wise": "Translation",
      // ... more test series items
    }
  }
}
```

### Steps to Add a New Language Pack

1. **Create Translation Pack**
   Add your translations to `/shared/i18n-packs-sample.js` or create a new file:
   ```javascript
   export const MY_LANGUAGE_PACKS = {
     "language-code": {
       // translations here
     }
   };
   ```

2. **Import and Merge**
   In `/shared/i18n.js`, import and merge your pack:
   ```javascript
   import { mergeSamplePacks, MY_LANGUAGE_PACKS } from "./my-language-packs.js";
   
   // After DICT declaration:
   mergeSamplePacks(DICT);
   mergeMyPacks(DICT); // Create similar function for your packs
   ```

3. **Add Phrase Translations (Optional)**
   For direct text translation, add to the PHRASES object:
   ```javascript
   const PHRASES = {
     "language-code": {
       "Exact Text": "Translated Text",
       "Another Text": "Translated Text"
     }
   };
   ```

## Supported Language Categories

### Currently Implemented
- **English (en)** - Base language with full translations
- **Hindi (hi)** - Full phrase translations
- **Sample Packs** - 10 languages with common UI translations:
  - Spanish (es)
  - French (fr)
  - German (de)
  - Chinese Simplified (zh-cn)
  - Japanese (ja)
  - Portuguese (pt)
  - Russian (ru)
  - Arabic (ar)
  - Italian (it)
  - Korean (ko)

### Remaining 88 Languages
These will fall back to:
1. English if the language code is supported
2. Pseudo-translation (adds language code prefix) for unknown codes

## Translation Functions

### `t(key, lang)`
Get translation by key with fallback:
```javascript
const text = t("nav.home", "es"); // "Inicio"
```

### `applyTranslations(lang, root)`
Apply translations to DOM elements with data attributes:
```javascript
// Elements with data-i18n="key"
applyTranslations("es");

// Elements with data-i18n-placeholder="key"
// Elements with data-i18n-title="key"
// Elements with data-i18n-html="key"
```

### Auto-Phrase Translation
Automatically translates text content across the DOM using exact string matching.

## Best Practices

1. **Use Keys for Reusable Text** - Prefer `data-i18n="key"` over phrase translation
2. **Provide Exact Text** - Phrase translation requires exact string matches
3. **Test Offline** - Ensure all translations work without network connectivity
4. **Keep Structure Consistent** - Follow the established nested object structure
5. **Add Context** - Include comments for complex translations

## Example Usage

### HTML Elements
```html
<!-- Key-based translation -->
<button data-i18n="common.start">Start</button>

<!-- Attribute translation -->
<input data-i18n-placeholder="search.placeholder" placeholder="Search...">
<div data-i18n-title="help.title" title="Help Text">

<!-- HTML content translation -->
<div data-i18n-html="welcome.message">Welcome <strong>Home</strong></div>
```

### JavaScript
```javascript
import { t, applyTranslations } from "./shared/i18n.js";

// Get translation
const buttonText = t("common.start", "es");

// Apply to entire page
applyTranslations("es");

// Apply to specific container
applyTranslations("es", document.getElementById("my-section"));
```

## Testing Language Support

1. Open browser console
2. Change language: `applyTranslations("your-lang-code")`
3. Verify all UI text updates
4. Check placeholders, titles, and aria-labels
5. Test offline by disabling network

## Future Enhancements

- Add remaining 88 language packs with real translations
- Implement pluralization support
- Add date/time localization
- Include number formatting
- Add RTL language support improvements
