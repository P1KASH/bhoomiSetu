import {
  History,
  UserCog,
  Cpu,
  FileEdit,
  Flag,
  FilePlus2,
  Send,
  Download,
  Filter,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { auditTrail, getRecord, DEMO_RECORD_ID } from '../data/mockData';
import type { AuditEntry } from '../types';

const actionIcons: Record<string, typeof History> = {
  'Field updated': FileEdit,
  'Flag raised': Flag,
  'Record created': FilePlus2,
  'OCR completed': Cpu,
  'Status changed': Send,
};

const actorTone = (actor: string) =>
  actor.startsWith('System')
    ? { label: 'System', color: 'text-navy-700', bg: 'bg-navy-50', border: 'border-navy-200', icon: Cpu }
    : { label: 'Officer', color: 'text-forest-700', bg: 'bg-forest-50', border: 'border-forest-200', icon: UserCog };

export function AuditScreen({ recordId }: { recordId?: string }) {
  const { navigate } = useRouter();
  const id = recordId ?? DEMO_RECORD_ID;
  const record = getRecord(id);

  return (
    <AppLayout title="Audit Trail" breadcrumb={<><span>Workspace</span><span className="text-navy-300">/</span><span>Audit Trail</span></>}>
      <PageHeader
        title="Audit Trail"
        subtitle={record ? `Complete change history for ${record.id} — ${record.owner}` : 'Complete change history across records'}
        actions={
          <>
            <button className="btn-secondary"><Filter className="h-4 w-4" /> Filter</button>
            <button className="btn-secondary"><Download className="h-4 w-4" /> Export</button>
          </>
        }
      />

      {/* Summary chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <SummaryChip label="Total Events" value={auditTrail.length} tone="navy" />
        <SummaryChip label="System Actions" value={auditTrail.filter((a) => a.actor.startsWith('System')).length} tone="navy" />
        <SummaryChip label="Officer Actions" value={auditTrail.filter((a) => !a.actor.startsWith('System')).length} tone="forest" />
        <SummaryChip label="Flags Raised" value={auditTrail.filter((a) => a.action === 'Flag raised').length} tone="saffron" />
      </div>

      {/* Timeline table */}
      <div className="panel rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-200 flex items-center gap-2">
          <History className="h-5 w-5 text-navy-600" />
          <h3 className="font-serif text-lg font-semibold text-navy-800">Change History</h3>
        </div>

        {/* table header (desktop) */}
        <div className="hidden lg:grid grid-cols-[180px_1fr_1fr_180px_160px] gap-4 px-5 py-3 bg-sand-50 border-b border-sand-200 text-xs font-semibold uppercase tracking-wide text-navy-500">
          <div>Actor</div>
          <div>What changed</div>
          <div>Value change</div>
          <div>Field</div>
          <div>Date / Time</div>
        </div>

        <div className="divide-y divide-sand-200">
          {auditTrail.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={() => navigate({ name: 'record', recordId: id, tab: 'overview' })} className="btn-secondary">
          Back to Record
        </button>
        <button onClick={() => navigate({ name: 'explainable', recordId: id })} className="btn-primary">
          <Send className="h-4 w-4" /> Confirm Send for Review
        </button>
      </div>

      <p className="text-xs text-navy-400 mt-4">
        Every action in BhoomiSetu is immutably logged. Audit trails cannot be edited or deleted by officers.
      </p>
    </AppLayout>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const tone = actorTone(entry.actor);
  const ActionIcon = actionIcons[entry.action] ?? History;
  return (
    <div className="px-5 py-4 hover:bg-sand-50 transition-colors">
      <div className="lg:grid lg:grid-cols-[180px_1fr_1fr_180px_160px] lg:gap-4 lg:items-start flex flex-col gap-2">
        {/* Actor */}
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${tone.bg} ${tone.border} border`}>
            <tone.icon className={`h-4 w-4 ${tone.color}`} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-navy-800 truncate">{entry.actor}</div>
            <span className={`chip ${tone.bg} ${tone.color} border ${tone.border} mt-0.5`}>{tone.label}</span>
          </div>
        </div>

        {/* What changed */}
        <div className="flex items-start gap-2">
          <ActionIcon className="h-4 w-4 text-navy-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-navy-800">{entry.action}</div>
            <div className="text-xs text-navy-600 mt-1 leading-snug">{entry.reason}</div>
          </div>
        </div>

        {/* Value change */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          {entry.oldValue !== '—' && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded font-mono text-xs line-through">
              {entry.oldValue}
            </span>
          )}
          {entry.oldValue !== '—' && <span className="text-navy-400">→</span>}
          <span className="px-2 py-0.5 bg-forest-50 text-forest-700 border border-forest-200 rounded font-mono text-xs">
            {entry.newValue}
          </span>
        </div>

        {/* Field */}
        <div className="text-sm text-navy-600">{entry.field}</div>

        {/* Timestamp */}
        <div className="text-xs font-mono text-navy-500">{entry.timestamp}</div>
      </div>
    </div>
  );
}

function SummaryChip({ label, value, tone }: { label: string; value: number; tone: 'navy' | 'forest' | 'saffron' }) {
  const tones = {
    navy: 'border-navy-200 bg-navy-50 text-navy-700',
    forest: 'border-forest-200 bg-forest-50 text-forest-700',
    saffron: 'border-saffron-200 bg-saffron-50 text-saffron-700',
  };
  return (
    <div className={`panel rounded-md p-4 border-l-4 ${tones[tone]}`}>
      <div className="font-serif text-2xl font-semibold text-navy-800">{value}</div>
      <div className="text-xs text-navy-500 mt-0.5">{label}</div>
    </div>
  );
}
