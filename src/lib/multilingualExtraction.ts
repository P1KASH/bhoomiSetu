/**
 * Multilingual field-normalization layer.
 *
 * Sits between raw OCR output and the canonical extracted object consumed by
 * the Validation Engine.  It recognizes both English and Marathi (Devanagari)
 * labels in OCR text, maps them to language-independent canonical field keys,
 * and normalizes Devanagari numerals to Arabic numerals for machine
 * comparison while preserving the original Devanagari value for display.
 */

// ---------------------------------------------------------------------------
// Canonical field keys — the ONLY vocabulary the Validation Engine knows.
// ---------------------------------------------------------------------------

export type CanonicalFieldKey =
  | 'owner'
  | 'survey_number'
  | 'area'
  | 'village'
  | 'taluka'
  | 'district'
  | 'mutation_number'
  | 'mutation_date'
  | 'registration_number'
  | 'registration_date';

export interface CanonicalField {
  key: CanonicalFieldKey;
  /** Display value — original Marathi/Devanagari preserved when available. */
  displayValue: string;
  /** Normalized value — Devanagari numerals converted to Arabic for comparison. */
  normalizedValue: string;
  /** The raw label text that was matched (e.g. "गट क्रमांक" or "Survey No"). */
  matchedLabel: string;
  /** Which language the matched label was in. */
  language: 'en' | 'mr';
  /** Source snippet from OCR for evidence. */
  snippet: string;
  detected: boolean;
}

export interface CanonicalRecord {
  owner: string;
  survey_number: string;
  area: string;
  village: string;
  taluka: string;
  district: string;
  mutation_number: string;
  mutation_date: string;
  registration_number: string;
  registration_date: string;
}

export type CanonicalMap = Partial<Record<CanonicalFieldKey, CanonicalField>>;

// ---------------------------------------------------------------------------
// Devanagari numeral normalization
// ---------------------------------------------------------------------------

const DEVANAGARI_DIGITS = new Map<string, string>([
  ['०', '0'], ['१', '1'], ['२', '2'], ['३', '3'], ['४', '4'],
  ['५', '5'], ['६', '6'], ['७', '7'], ['८', '8'], ['९', '9'],
]);

// Devanagari consonant/vowel → Latin, for normalizing survey suffixes like २अ → 2A
const DEVANAGARI_LETTERS = new Map<string, string>([
  ['अ', 'A'], ['ब', 'B'], ['क', 'K'], ['ग', 'G'], ['ड', 'D'],
  ['च', 'C'], ['ज', 'J'], ['त', 'T'], ['न', 'N'], ['प', 'P'],
  ['म', 'M'], ['य', 'Y'], ['र', 'R'], ['ल', 'L'], ['व', 'V'],
  ['श', 'Sh'], ['स', 'S'], ['ह', 'H'], ['ए', 'E'], ['ई', 'I'],
  ['आ', 'Aa'], ['ओ', 'O'], ['ऊ', 'U'], ['ख', 'Kh'], ['छ', 'Ch'],
  ['थ', 'Th'], ['ध', 'Dh'], ['भ', 'Bh'], ['घ', 'Gh'], ['ठ', 'Th'],
  ['ढ', 'Dh'], ['झ', 'Jh'], ['ष', 'Sh'], ['ण', 'N'], ['फ', 'Ph'],
]);

/** Convert Devanagari numerals (०-९) to Arabic (0-9). Other chars pass through. */
export function normalizeDevanagariNumerals(text: string): string {
  let out = '';
  for (const ch of text) {
    out += DEVANAGARI_DIGITS.get(ch) ?? ch;
  }
  return out;
}

/** Convert Devanagari digits AND letters to Latin equivalents. */
export function normalizeDevanagariText(text: string): string {
  let out = '';
  for (const ch of text) {
    out += DEVANAGARI_DIGITS.get(ch) ?? DEVANAGARI_LETTERS.get(ch) ?? ch;
  }
  return out;
}

/** Check whether text contains any Devanagari numeral characters. */
export function hasDevanagariNumerals(text: string): boolean {
  for (const ch of text) {
    if (DEVANAGARI_DIGITS.has(ch)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Label → canonical-field mapping (English + Marathi)
// ---------------------------------------------------------------------------

interface LabelEntry {
  canonical: CanonicalFieldKey;
  language: 'en' | 'mr';
  /** Regex matching the label portion (without the captured value group). */
  pattern: RegExp;
}

/**
 * Build a label-then-value regex from a label pattern string.
 * Captures everything after the label up to end-of-line as group 1.
 * Tolerates optional colon, dash, or whitespace separators.
 * Anchored to start-of-line so a shorter label doesn't match as a substring
 * inside a longer label.
 */
function labelRegex(label: string): RegExp {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(`^\\s*${escaped}\\s*[:：\\-]?\\s*(.+)`, 'i');
}

const LABEL_ENTRIES: LabelEntry[] = [
  // --- owner (English) ---
  { canonical: 'owner', language: 'en', pattern: /(?:owner|recorded owner|name of (?:the )?owner|purchaser|khatedar)\s*[:：\-]?\s*(.+)/i },
  // --- owner (Marathi) ---
  { canonical: 'owner', language: 'mr', pattern: labelRegex('मालकाचे नाव') },
  { canonical: 'owner', language: 'mr', pattern: labelRegex('मालक') },
  { canonical: 'owner', language: 'mr', pattern: labelRegex('खातेदार') },

  // --- survey_number (English) ---
  { canonical: 'survey_number', language: 'en', pattern: /(?:survey\s*(?:no|number|num)|gut\s*(?:no|number)|cts\s*(?:no|number))\s*\.?\s*[:：\-]?\s*(\d{1,4}[A-Za-z]?(?:\/\d{1,4}[A-Za-z]?)?)/i },
  // --- survey_number (Marathi) --- Combined label must be tried first
  { canonical: 'survey_number', language: 'mr', pattern: new RegExp('^\\s*गट क्रमांक\\s*[/\\-]?\\s*सर्वे क्रमांक\\s*[:：\\-]?\\s*(.+)', 'i') },
  { canonical: 'survey_number', language: 'mr', pattern: labelRegex('गट क्रमांक') },
  { canonical: 'survey_number', language: 'mr', pattern: labelRegex('गट नं.') },
  { canonical: 'survey_number', language: 'mr', pattern: labelRegex('सर्वे क्रमांक') },
  { canonical: 'survey_number', language: 'mr', pattern: labelRegex('सर्वे नं.') },

  // --- area (English) ---
  { canonical: 'area', language: 'en', pattern: /(?:area|extent)\s*[:：\-]?\s*(\d+(?:\.\d+)?\s*(?:acres?|hectares?|ha|gunthe?))/i },
  // --- area (Marathi) ---
  { canonical: 'area', language: 'mr', pattern: labelRegex('एकूण क्षेत्र') },
  { canonical: 'area', language: 'mr', pattern: labelRegex('क्षेत्रफळ') },
  { canonical: 'area', language: 'mr', pattern: labelRegex('क्षेत्र') },

  // --- village (English) ---
  { canonical: 'village', language: 'en', pattern: /(?:village|gaon)\s*[:：\-]?\s+(.+)/i },
  // --- village (Marathi) ---
  { canonical: 'village', language: 'mr', pattern: labelRegex('गाव') },

  // --- taluka (English) ---
  { canonical: 'taluka', language: 'en', pattern: /(?:taluka|tahsil|taluk)\s*[:：\-]?\s+(.+)/i },
  // --- taluka (Marathi) ---
  { canonical: 'taluka', language: 'mr', pattern: labelRegex('तालुका') },

  // --- district (English) ---
  { canonical: 'district', language: 'en', pattern: /(?:district|zila)\s*[:：\-]?\s+(.+)/i },
  // --- district (Marathi) ---
  { canonical: 'district', language: 'mr', pattern: labelRegex('जिल्हा') },

  // --- mutation_number (English) ---
  { canonical: 'mutation_number', language: 'en', pattern: /(?:mutation\s*(?:no|number)|entry\s*(?:no|number))\s*\.?\s*[:：\-]?\s*([A-Z]{0,3}[\-/]?\d{2,4}[\-/]\d{3,8}|\d{3,8})/i },
  // --- mutation_number (Marathi) ---
  { canonical: 'mutation_number', language: 'mr', pattern: labelRegex('फेरफार क्रमांक') },
  { canonical: 'mutation_number', language: 'mr', pattern: labelRegex('फेरफार नं.') },

  // --- mutation_date (English) ---
  { canonical: 'mutation_date', language: 'en', pattern: /(?:mutation\s*date|date\s*of\s*mutation)\s*[:：\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i },
  // --- mutation_date (Marathi) ---
  { canonical: 'mutation_date', language: 'mr', pattern: labelRegex('फेरफार दिनांक') },

  // --- registration_number (English) ---
  { canonical: 'registration_number', language: 'en', pattern: /reg(?:istration)?\s*(?:no|number)?\s*\.?\s*[:：\-]?\s*([A-Z]{0,4}[\-/]?\d{2,4}[\-/]\d{3,8})/i },
  // --- registration_number (Marathi) ---
  { canonical: 'registration_number', language: 'mr', pattern: labelRegex('नोंदणी क्रमांक') },

  // --- registration_date (English) ---
  { canonical: 'registration_date', language: 'en', pattern: /reg(?:istration)?\s*date\s*[:：\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i },
  // --- registration_date (Marathi) ---
  { canonical: 'registration_date', language: 'mr', pattern: labelRegex('नोंदणी दिनांक') },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanValue(s: string): string {
  return s
    .replace(/\s+/g, ' ')
    .replace(/[:：|;\s]+$/, '')
    .replace(/^[:：|;\s]+/, '')
    .trim();
}

/**
 * For Devanagari / Marathi values, keep the proper-name or location tokens.
 * Devanagari script ranges: \u0900-\u097F
 */
function cleanDevanagariValue(raw: string): string {
  let v = cleanValue(raw);
  // Truncate at common English separators that bleed in from OCR line noise
  v = v.split(/\s{2,}/)[0];
  return v;
}

/**
 * Produce the normalized (machine-comparable) value for a canonical field.
 * - survey_number: digits + Devanagari letters (२अ → 2A)
 * - area: digits only, strip unit words (एकर, हेक्टर)
 * - all others: digits only
 */
function normalizeForCanonical(key: CanonicalFieldKey, displayValue: string): string {
  if (key === 'survey_number') {
    return normalizeDevanagariText(displayValue).replace(/\s+/g, '').trim();
  }
  if (key === 'area') {
    return normalizeDevanagariNumerals(displayValue)
      .replace(/\s*(?:एकर|हेक्टर|एकं|acres?|hectares?|ha|gunthe?)\s*$/i, '')
      .trim();
  }
  return normalizeDevanagariNumerals(displayValue);
}

// ---------------------------------------------------------------------------
// Main entry point: parse raw OCR text → canonical map
// ---------------------------------------------------------------------------

/**
 * Parse raw OCR text and produce a map of canonical fields.
 * Both English and Marathi labels are recognized.
 * Devanagari numerals in the normalized value are converted to Arabic.
 * The original Devanagari value is preserved in displayValue.
 */
export function parseMultilingualFields(rawText: string): CanonicalMap {
  const text = rawText.replace(/\r\n/g, '\n');
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const result: CanonicalMap = {};

  for (const entry of LABEL_ENTRIES) {
    // If we already found a value for this canonical key, skip
    if (result[entry.canonical]?.detected) continue;

    for (const line of lines) {
      const m = line.match(entry.pattern);
      if (!m || !m[1]) continue;

      const rawValue = m[1];
      const displayValue = entry.language === 'mr'
        ? cleanDevanagariValue(rawValue)
        : cleanValue(rawValue);

      if (displayValue.length < 1) continue;

      const normalizedValue = normalizeForCanonical(entry.canonical, displayValue);

      // Extract the matched label text from the line for traceability
      const matchStart = m.index ?? 0;
      const valueStart = matchStart + (m[0].length - m[1].length);
      const matchedLabel = line.slice(matchStart, valueStart).replace(/[:：\-\s]+$/, '').trim();

      result[entry.canonical] = {
        key: entry.canonical,
        displayValue,
        normalizedValue,
        matchedLabel,
        language: entry.language,
        snippet: line.trim(),
        detected: true,
      };
      break; // move to next label entry
    }
  }

  return result;
}

/**
 * Convert a canonical map into the flat canonical record shape the
 * Validation Engine consumes.  Uses normalizedValue (Arabic numerals)
 * for all fields.  Missing fields default to empty string.
 */
export function toCanonicalRecord(map: CanonicalMap): CanonicalRecord {
  const get = (k: CanonicalFieldKey): string =>
    map[k]?.detected ? map[k]!.normalizedValue : '';

  return {
    owner: get('owner'),
    survey_number: get('survey_number'),
    area: get('area'),
    village: get('village'),
    taluka: get('taluka'),
    district: get('district'),
    mutation_number: get('mutation_number'),
    mutation_date: get('mutation_date'),
    registration_number: get('registration_number'),
    registration_date: get('registration_date'),
  };
}

/**
 * Convert a canonical map into a simple Record<string,string> of
 * normalized values, suitable for the extracted-data store.
 */
export function toNormalizedMap(map: CanonicalMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(map) as CanonicalFieldKey[]) {
    const field = map[key];
    if (field?.detected) {
      out[key] = field.normalizedValue;
      out[`${key}__display`] = field.displayValue;
      out[`${key}__lang`] = field.language;
    }
  }
  return out;
}
