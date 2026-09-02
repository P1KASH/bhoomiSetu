import type { RecordStatus, ParcelStatus } from '../types';

export const STATUS_META: Record<
  RecordStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  verified: {
    label: 'Verified',
    text: 'text-forest-700',
    bg: 'bg-forest-50',
    border: 'border-forest-200',
    dot: 'bg-forest-500',
  },
  review: {
    label: 'Needs Review',
    text: 'text-saffron-700',
    bg: 'bg-saffron-50',
    border: 'border-saffron-200',
    dot: 'bg-saffron-400',
  },
  priority: {
    label: 'High Priority',
    text: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-600',
  },
};

export const PARCEL_META: Record<
  ParcelStatus,
  { label: string; fill: string; stroke: string; text: string }
> = {
  verified: { label: 'Verified', fill: '#62ad72', stroke: '#1f6e32', text: '#0b2916' },
  review: { label: 'Needs Review', fill: '#f29a2f', stroke: '#c2640a', text: '#371c05' },
  priority: { label: 'High Priority', fill: '#ef4444', stroke: '#991b1b', text: '#ffffff' },
  unvalidated: { label: 'Not Validated', fill: '#c7ced8', stroke: '#8b97a8', text: '#3a4658' },
};

export function StatusBadge({ status }: { status: RecordStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`chip ${m.bg} ${m.text} border ${m.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const tone =
    value >= 90 ? 'bg-forest-500' : value >= 75 ? 'bg-saffron-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-navy-100 overflow-hidden">
        <div className={`h-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-navy-600">{value}/100</span>
    </div>
  );
}
