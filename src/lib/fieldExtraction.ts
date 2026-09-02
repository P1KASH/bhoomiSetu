export type DocTypeId = 'sale-deed' | 'ror' | 'mutation' | 'property' | 'tax' | 'other';

export interface FieldEvidence {
  sourceDoc: string;
  pageNumber: number | null;
  snippet: string;
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0..100 extraction confidence
  detected: boolean;
  status: 'extracted' | 'uncertain' | 'not-detected' | 'manually-verified';
  evidence: FieldEvidence | null;
  sourceLabel: string; // e.g. "Sale Deed, Page 1"
}

export interface DocTypeSchema {
  id: DocTypeId;
  label: string;
  fields: { key: string; label: string }[];
}

const SCHEMAS: Record<DocTypeId, DocTypeSchema> = {
  'sale-deed': {
    id: 'sale-deed',
    label: 'Sale Deed',
    fields: [
      { key: 'sellerName', label: 'Seller Name' },
      { key: 'purchaserName', label: 'Purchaser / Owner Name' },
      { key: 'fatherName', label: 'Father / Guardian Name' },
      { key: 'surveyNumber', label: 'Survey Number' },
      { key: 'subSurveyNumber', label: 'Sub-Survey Number' },
      { key: 'area', label: 'Area' },
      { key: 'village', label: 'Village' },
      { key: 'taluka', label: 'Taluka' },
      { key: 'district', label: 'District' },
      { key: 'registrationNumber', label: 'Registration Number' },
      { key: 'registrationDate', label: 'Registration Date' },
    ],
  },
  ror: {
    id: 'ror',
    label: 'RoR / 7/12',
    fields: [
      { key: 'recordedOwner', label: 'Recorded Owner' },
      { key: 'surveyNumber', label: 'Survey Number' },
      { key: 'area', label: 'Area' },
      { key: 'village', label: 'Village' },
      { key: 'taluka', label: 'Taluka' },
      { key: 'district', label: 'District' },
      { key: 'landType', label: 'Land Type' },
    ],
  },
  mutation: {
    id: 'mutation',
    label: 'Mutation Record',
    fields: [
      { key: 'previousOwner', label: 'Previous / Existing Owner' },
      { key: 'newOwner', label: 'New Owner / Transferee' },
      { key: 'surveyNumber', label: 'Survey / Gat Number' },
      { key: 'mutationNumber', label: 'Mutation / Entry Number' },
      { key: 'mutationDate', label: 'Mutation Date' },
      { key: 'reason', label: 'Reason / Transaction' },
      { key: 'village', label: 'Village' },
      { key: 'taluka', label: 'Taluka' },
      { key: 'district', label: 'District' },
    ],
  },
  property: {
    id: 'property',
    label: 'Property / Land Record',
    fields: [
      { key: 'ownerName', label: 'Owner Name' },
      { key: 'surveyNumber', label: 'Survey Number' },
      { key: 'area', label: 'Area' },
      { key: 'village', label: 'Village' },
      { key: 'taluka', label: 'Taluka' },
      { key: 'district', label: 'District' },
    ],
  },
  tax: {
    id: 'tax',
    label: 'Tax Record',
    fields: [
      { key: 'ownerName', label: 'Owner Name' },
      { key: 'surveyNumber', label: 'Survey Number' },
      { key: 'area', label: 'Area' },
      { key: 'village', label: 'Village' },
      { key: 'propertyId', label: 'Property ID' },
      { key: 'taxAmount', label: 'Tax Amount' },
    ],
  },
  other: {
    id: 'other',
    label: 'Other',
    fields: [
      { key: 'ownerName', label: 'Owner Name' },
      { key: 'surveyNumber', label: 'Survey Number' },
      { key: 'area', label: 'Area' },
      { key: 'village', label: 'Village' },
      { key: 'taluka', label: 'Taluka' },
      { key: 'district', label: 'District' },
    ],
  },
};

export function getDocSchema(docTypeId: string): DocTypeSchema {
  return SCHEMAS[docTypeId as DocTypeId] ?? SCHEMAS['other'];
}

export function detectDocTypeId(text: string): DocTypeId {
  const lower = text.toLowerCase();
  if (/\bsale\s*deed\b/.test(lower) || /conveyance\s*deed/.test(lower)) return 'sale-deed';
  if (/\b7\s*\/\s*12\b/.test(lower) || /\brecord of rights\b/.test(lower) || /\bror\b/.test(lower)) return 'ror';
  if (/mutation/.test(lower)) return 'mutation';
  if (/property\s*tax|tax\s*receipt/.test(lower)) return 'tax';
  if (/land\s*record|land\s*certificate|property\s*record/.test(lower)) return 'property';
  return 'other';
}

// ---------------------------------------------------------------------------
// Context-aware extraction
// ---------------------------------------------------------------------------

// Stop-words that commonly bleed into captured name values after a label
const NAME_STOPWORDS = new Set([
  'father', 'guardian', 'son', 'daughter', 'wife', 'husband', 'of', 'age',
  'purchaser', 'seller', 'vendor', 'transferee', 'transferor', 'owner',
  'khatedar', 'executant', 'party', 'parties', 's/o', 'd/o', 'w/o',
  'adult', 'resident', 'r/o', 'occupation', 'occupation:',
]);

// Stop-words for location fields
const LOC_STOPWORDS = new Set([
  'district', 'taluka', 'tahsil', 'taluk', 'village', 'gaon',
  'parties', 'page', 'date', 'number', 'survey',
]);

interface MatchResult {
  value: string;
  confidence: number;
  snippet: string;
}

interface ExtractContext {
  text: string;
  lines: string[];
  pageNumber: number | null;
  sourceLabel: string;
}

function extractPersonName(
  ctx: ExtractContext,
  labelPatterns: RegExp[],
  fallbackPatterns: RegExp[],
): MatchResult | null {
  // Strategy 1: labelled line — find the label, then capture only proper-name tokens
  for (const pattern of labelPatterns) {
    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i];
      const m = line.match(pattern);
      if (m && m[1]) {
        const cleaned = cleanName(m[1], ctx.lines[i]);
        if (cleaned.value.length >= 3) return withEvidence(cleaned, ctx, i);
      }
    }
  }
  // Strategy 2: fallback patterns across full text
  for (const pattern of fallbackPatterns) {
    const m = ctx.text.match(pattern);
    if (m && m[1]) {
      const cleaned = cleanName(m[1], m[0]);
      if (cleaned.value.length >= 3) return withEvidence(cleaned, ctx, -1);
    }
  }
  return null;
}

function cleanName(raw: string, fullLine: string): { value: string; snippet: string } {
  let tokens = raw.trim().split(/\s+/);
  // Remove trailing stop-words
  while (tokens.length > 1 && NAME_STOPWORDS.has(tokens[tokens.length - 1].toLowerCase())) {
    tokens.pop();
  }
  // Remove leading stop-words
  while (tokens.length > 1 && NAME_STOPWORDS.has(tokens[0].toLowerCase())) {
    tokens.shift();
  }
  // Keep only tokens that look like proper names (start with uppercase or are mixed-case)
  tokens = tokens.filter((t) => /^[A-Z][a-zA-Z]{1,}$/.test(t) || /^[A-Z]{2,}$/.test(t));
  // Cap at 4 tokens
  tokens = tokens.slice(0, 4);
  const value = titleCase(tokens.join(' '));
  return { value, snippet: fullLine.trim() };
}

function extractLocation(
  ctx: ExtractContext,
  labelPatterns: RegExp[],
): MatchResult | null {
  for (const pattern of labelPatterns) {
    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i];
      const m = line.match(pattern);
      if (m && m[1]) {
        const cleaned = cleanLocation(m[1], line);
        if (cleaned.value.length >= 2) return withEvidence(cleaned, ctx, i);
      }
    }
  }
  return null;
}

function cleanLocation(raw: string, fullLine: string): { value: string; snippet: string } {
  let tokens = raw.trim().split(/\s+/);
  while (tokens.length > 1 && LOC_STOPWORDS.has(tokens[tokens.length - 1].toLowerCase())) {
    tokens.pop();
  }
  while (tokens.length > 1 && LOC_STOPWORDS.has(tokens[0].toLowerCase())) {
    tokens.shift();
  }
  tokens = tokens.filter((t) => /^[A-Z][a-zA-Z]{1,}$/.test(t) || /^[A-Z]{2,}$/.test(t));
  tokens = tokens.slice(0, 3);
  return { value: titleCase(tokens.join(' ')), snippet: fullLine.trim() };
}

function extractPattern(
  ctx: ExtractContext,
  patterns: RegExp[],
  valueTransform?: (v: string) => string,
): MatchResult | null {
  for (const pattern of patterns) {
    for (let i = 0; i < ctx.lines.length; i++) {
      const line = ctx.lines[i];
      const m = line.match(pattern);
      if (m && m[1]) {
        let value = cleanValue(m[1]);
        if (valueTransform) value = valueTransform(value);
        if (value.length >= 1) {
          return { value, confidence: confFor(pattern, value), snippet: line.trim() };
        }
      }
    }
    // Also try full text for patterns that may span lines
    const m = ctx.text.match(pattern);
    if (m && m[1]) {
      let value = cleanValue(m[1]);
      if (valueTransform) value = valueTransform(value);
      if (value.length >= 1) {
        return { value, confidence: confFor(pattern, value), snippet: m[0].trim() };
      }
    }
  }
  return null;
}

function withEvidence(
  cleaned: { value: string; snippet: string },
  ctx: ExtractContext,
  lineIdx: number,
): MatchResult {
  const confidence = cleaned.value.split(/\s+/).length >= 2 ? 95 : 80;
  return { value: cleaned.value, confidence, snippet: cleaned.snippet };
}

function confFor(pattern: RegExp, value: string): number {
  const specificity = Math.min(pattern.source.length / 80, 1);
  return Math.round(Math.min(80 + specificity * 18, 99));
}

function cleanValue(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/[:|;\s]+$/, '').replace(/^[:|;\s]+/, '').trim();
}

function titleCase(s: string): string {
  if (!s) return s;
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Field extractors per key
// ---------------------------------------------------------------------------

function extractByKey(key: string, ctx: ExtractContext): MatchResult | null {
  switch (key) {
    case 'sellerName':
      return extractPersonName(
        ctx,
        [
          /(?:seller|vendor|executant|name of (?:the )?seller|name of (?:the )?vendor)\s*[:\-]?\s*(.+)/i,
        ],
        [
          /(?:executed by|sold by)\s+(.+)/i,
        ],
      );

    case 'previousOwner':
      return extractPersonName(
        ctx,
        [
          /(?:previous owner|old owner|previous holder|existing owner|transferor|name of (?:the )?previous owner|name of (?:the )?old owner|name of (?:the )?existing owner)\s*[:\-]?\s*(.+)/i,
        ],
        [
          /(?:transferred by|mutation from|mutated from)\s+(.+)/i,
        ],
      );

    case 'purchaserName':
    case 'ownerName':
    case 'recordedOwner':
      return extractPersonName(
        ctx,
        [
          /(?:purchaser|owner|transferee|recorded owner|khatedar|name of (?:the )?owner|name of (?:the )?purchaser)\s*[:\-]?\s*(.+)/i,
        ],
        [
          /(?:registered in the name of|in favour of)\s+(.+)/i,
        ],
      );

    case 'newOwner':
      return extractPersonName(
        ctx,
        [
          /(?:new owner|transferee|transferee name|name of (?:the )?new owner|name of (?:the )?transferee|mutation in favour of|mutated to)\s*[:\-]?\s*(.+)/i,
        ],
        [
          /(?:transferred to|mutation to)\s+(.+)/i,
        ],
      );

    case 'fatherName':
      return extractPersonName(
        ctx,
        [
          /(?:father|guardian|father['']?s name)\s*[:\-]?\s*(.+)/i,
          /s\/o\s+(.+)/i,
          /d\/o\s+(.+)/i,
        ],
        [],
      );

    case 'surveyNumber':
      return extractPattern(ctx, [
        /survey\s*(?:no|number|num)\s*\.?\s*[:\-]?\s*(\d{1,4}[A-Za-z]?(?:\/\d{1,4}[A-Za-z]?)?)/i,
        /cts\s*(?:no|number)\s*\.?\s*[:\-]?\s*(\d{1,4}[A-Za-z]?(?:\/\d{1,4}[A-Za-z]?)?)/i,
        /\bgut\s*(?:no|number)\s*\.?\s*[:\-]?\s*(\d{1,4}[A-Za-z]?(?:\/\d{1,4}[A-Za-z]?)?)/i,
        /\bs\.?\s?no\.?\s*[:\-]\s*(\d{1,4}[A-Za-z]?(?:\/\d{1,4}[A-Za-z]?)?)/i,
      ]);

    case 'subSurveyNumber':
      return extractPattern(ctx, [
        /sub[\s-]?survey\s*(?:no|number)?\s*\.?\s*[:\-]?\s*([A-Za-z]?\d{0,4}[A-Za-z]{1,2})/i,
        /plot\s*(?:no|number)\s*\.?\s*[:\-]?\s*(\d{1,4}[A-Za-z]{0,2})/i,
      ]);

    case 'area':
      return extractPattern(ctx, [
        /area\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:acres?|acre|hectares?|ha|sq\.?\s*m|sq\s*meters?|gunthe?))/i,
        /extent\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:acres?|acre|hectares?|ha|gunthe?))/i,
        /measuring\s+(\d+(?:\.\d+)?\s*(?:acres?|hectares?|gunthe?))/i,
        /(\d+(?:\.\d+)?\s*(?:acres?|hectares?|gunthe?))\s*(?:of|land|area)/i,
      ], (v) => v.replace(/\s+/g, ' ').trim());

    case 'village':
      return extractLocation(ctx, [
        /village\s*[:\-]?\s+(.+)/i,
        /gaon\s*[:\-]?\s+(.+)/i,
        /at\s+village\s+(.+)/i,
      ]);

    case 'taluka':
      return extractLocation(ctx, [
        /taluka\s*[:\-]?\s+(.+)/i,
        /tahsil\s*[:\-]?\s+(.+)/i,
        /taluk\s*[:\-]?\s+(.+)/i,
      ]);

    case 'district':
      return extractLocation(ctx, [
        /district\s*[:\-]?\s+(.+)/i,
        /zila\s*[:\-]?\s+(.+)/i,
      ]);

    case 'registrationNumber':
      return extractPattern(ctx, [
        /reg(?:istration)?\s*(?:no|number)?\s*\.?\s*[:\-]?\s*([A-Z]{0,4}[\-/]?\d{2,4}[\-/]\d{3,8})/i,
        /document\s*(?:no|number)\s*\.?\s*[:\-]?\s*([A-Z]{0,4}[\-/]?\d{2,4}[\-/]\d{3,8})/i,
      ]);

    case 'registrationDate':
      return extractPattern(ctx, [
        /reg(?:istration)?\s*date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /date\s*(?:of (?:registration|sale|execution))?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /registered\s+on\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /\bdate\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      ]);

    case 'mutationDate':
      return extractPattern(ctx, [
        /mutation\s*date\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /date\s*of\s*mutation\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /date\s*(?:of (?:mutation|transfer|entry))?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /\bdate\s*[:\-]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      ]);

    case 'mutationNumber':
      return extractPattern(ctx, [
        /mutation\s*(?:no|number)\s*\.?\s*[:\-]?\s*([A-Z]{0,3}[\-/]?\d{2,4}[\-/]\d{3,8})/i,
        /mutation\s*entry\s*(?:no|number)\s*\.?\s*[:\-]?\s*([A-Z]{0,3}[\-/]?\d{2,4}[\-/]\d{3,8})/i,
        /entry\s*(?:no|number)\s*\.?\s*[:\-]?\s*(\d{3,8})/i,
      ]);

    case 'reason':
      return extractPattern(ctx, [
        /(?:reason|nature of mutation|nature of transaction|transaction|mutation type|type of mutation|particulars? of transfer|particulars)\s*[:\-]?\s*(.{5,60})/i,
      ]);

    case 'landType':
      return extractPattern(ctx, [
        /land\s*(?:type|use|classification)\s*[:\-]?\s*([A-Za-z]{3,30})/i,
        /type\s*of\s*land\s*[:\-]?\s*([A-Za-z]{3,30})/i,
      ]);

    case 'propertyId':
      return extractPattern(ctx, [
        /property\s*(?:id|no|number)\s*\.?\s*[:\-]?\s*([A-Z0-9\-\/]{4,20})/i,
      ]);

    case 'taxAmount':
      return extractPattern(ctx, [
        /(?:tax|amount|demand)\s*[:\-]?\s*(?:rs\.?|₹)?\s*([0-9,]+(?:\.\d{1,2})?)/i,
        /(?:rs\.?|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i,
      ]);

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function extractFields(
  rawText: string,
  docTypeId: string,
  pageNumber: number | null = null,
  sourceLabel: string = '',
): ExtractedField[] {
  const schema = getDocSchema(docTypeId);
  const text = rawText.replace(/\r\n/g, '\n').replace(/\|/g, 'I').replace(/~/g, '-');
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const ctx: ExtractContext = { text, lines, pageNumber, sourceLabel };

  return schema.fields.map((fieldDef) => {
    const match = extractByKey(fieldDef.key, ctx);
    if (!match) {
      return {
        key: fieldDef.key,
        label: fieldDef.label,
        value: '',
        confidence: 0,
        detected: false,
        status: 'not-detected' as const,
        evidence: null,
        sourceLabel,
      };
    }

    const isLowConfidence = match.confidence < 75;
    return {
      key: fieldDef.key,
      label: fieldDef.label,
      value: match.value,
      confidence: match.confidence,
      detected: true,
      status: isLowConfidence ? ('uncertain' as const) : ('extracted' as const),
      evidence: {
        sourceDoc: sourceLabel || schema.label,
        pageNumber,
        snippet: match.snippet,
      },
      sourceLabel,
    };
  });
}

export function overallFieldConfidence(fields: ExtractedField[]): number {
  const detected = fields.filter((f) => f.detected);
  if (detected.length === 0) return 0;
  const sum = detected.reduce((acc, f) => acc + f.confidence, 0);
  return Math.round(sum / detected.length);
}

export function fieldCompleteness(fields: ExtractedField[]): { detected: number; total: number } {
  const detected = fields.filter((f) => f.detected).length;
  return { detected, total: fields.length };
}

// ---------------------------------------------------------------------------
// Multilingual canonical extraction — wraps the normalization layer.
// Produces language-independent canonical fields for the Validation Engine.
// ---------------------------------------------------------------------------

import {
  parseMultilingualFields,
  toCanonicalRecord,
  toNormalizedMap,
  normalizeDevanagariNumerals,
  hasDevanagariNumerals,
  type CanonicalMap,
  type CanonicalRecord,
} from './multilingualExtraction';

export type { CanonicalFieldKey, CanonicalField, CanonicalRecord, CanonicalMap } from './multilingualExtraction';
export { normalizeDevanagariNumerals, hasDevanagariNumerals, toCanonicalRecord, toNormalizedMap };

export interface CanonicalExtractionResult {
  fields: ExtractedField[];
  canonical: CanonicalMap;
  canonicalRecord: CanonicalRecord;
  normalizedMap: Record<string, string>;
}

/**
 * Extract fields from raw OCR text using both English and Marathi label
 * recognition.  The returned `fields` array is for UI display (preserves
 * Devanagari).  The `canonical` / `canonicalRecord` / `normalizedMap` are
 * language-independent and intended for the Validation Engine.
 */
export function extractFieldsCanonical(
  rawText: string,
  docTypeId: string,
  pageNumber: number | null = null,
  sourceLabel: string = '',
): CanonicalExtractionResult {
  // Standard English extraction for the UI field table
  const fields = extractFields(rawText, docTypeId, pageNumber, sourceLabel);

  // Multilingual canonical extraction for the Validation Engine
  const canonical = parseMultilingualFields(rawText);
  const canonicalRecord = toCanonicalRecord(canonical);
  const normalizedMap = toNormalizedMap(canonical);

  return { fields, canonical, canonicalRecord, normalizedMap };
}
