export type RecordStatus = 'verified' | 'review' | 'priority';

export type ParcelStatus = 'verified' | 'review' | 'priority' | 'unvalidated';

export interface LandRecord {
  id: string;
  owner: string;
  surveyNumber: string;
  area: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  transactionDate: string;
  status: RecordStatus;
  confidence: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  submittedAt: string;
  ocrConfidence: number;
}

export interface OwnershipEntry {
  year: string;
  owner: string;
  relation: string;
  deedRef: string;
  note: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  reason: string;
}

export interface MapParcel {
  surveyNumber: string;
  owner: string;
  recordedArea: string;
  gisArea: string;
  confidence: number;
  status: ParcelStatus;
  polygon: string; // SVG points
  labelX: number;
  labelY: number;
}

export interface ValidationCheck {
  id: string;
  label: string;
  source: string;
  result: 'MATCH' | 'MISMATCH' | 'WARNING' | 'PENDING';
  detail: string;
}

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
  source: string;
}
