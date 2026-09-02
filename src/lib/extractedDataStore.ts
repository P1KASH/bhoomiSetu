import type { CanonicalMap } from './multilingualExtraction';
import { toNormalizedMap } from './multilingualExtraction';

interface StoredCanonicalData {
  /** Normalized canonical field map (Arabic numerals) for the Validation Engine. */
  normalized: Record<string, string>;
  /** The raw canonical map with display values and language metadata. */
  canonical: CanonicalMap | null;
  /** Document type of the source document. */
  docType: string;
  /** Human-readable source label. */
  sourceLabel: string;
}

let stored: StoredCanonicalData = {
  normalized: {},
  canonical: null,
  docType: '',
  sourceLabel: '',
};

/**
 * Store canonical normalized fields from the multilingual extraction layer.
 * The Validation Engine should consume `getStoredCanonicalFields().normalized`.
 */
export function storeCanonicalFields(
  canonical: CanonicalMap,
  docType: string,
  sourceLabel: string,
): void {
  stored = {
    normalized: toNormalizedMap(canonical),
    canonical,
    docType,
    sourceLabel,
  };
}

/**
 * Legacy store for backward compatibility — accepts a flat key→value map.
 * Prefer storeCanonicalFields() for multilingual documents.
 */
export function storeExtractedFields(fields: Record<string, string>): void {
  stored = {
    normalized: { ...fields },
    canonical: null,
    docType: fields['_docType'] ?? '',
    sourceLabel: fields['_sourceLabel'] ?? '',
  };
}

export function getStoredCanonicalFields(): StoredCanonicalData {
  return stored;
}

export function getStoredNormalizedFields(): Record<string, string> {
  return stored.normalized;
}
