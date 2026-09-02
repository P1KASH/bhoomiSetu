import { useState } from 'react';
import {
  FileText,
  ScrollText,
  GitBranch,
  Receipt,
  Download,
  Workflow,
  Map as MapIcon,
  History,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { StatusBadge, ConfidenceMeter } from '../components/StatusBadge';
import { getRecord, ownershipHistory, validationChecks, mapParcels, DEMO_RECORD_ID } from '../data/mockData';
import { PARCEL_META } from '../components/StatusBadge';
import type { ValidationCheck } from '../types';

const tabs = [
  { id: 'overview', label: 'Overview', icon: FileText },
  { id: 'documents', label: 'Documents', icon: ScrollText },
  { id: 'history', label: 'Ownership History', icon: History },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'validation', label: 'Validation', icon: ShieldCheck },
];

const resultIcon: Record<ValidationCheck['result'], typeof CheckCircle2> = {
  MATCH: CheckCircle2,
  MISMATCH: XCircle,
  WARNING: AlertTriangle,
  PENDING: CheckCircle2,
};
const resultTone: Record<ValidationCheck['result'], string> = {
  MATCH: 'text-forest-600 bg-forest-50 border-forest-200',
  MISMATCH: 'text-red-600 bg-red-50 border-red-200',
  WARNING: 'text-saffron-600 bg-saffron-50 border-saffron-200',
  PENDING: 'text-navy-600 bg-navy-50 border-navy-200',
};

export function RecordDetailScreen({ recordId, tab: initialTab }: { recordId: string; tab?: string }) {
  const { navigate } = useRouter();
  const [tab, setTab] = useState(initialTab ?? 'overview');
  const record = getRecord(recordId) ?? getRecord(DEMO_RECORD_ID)!;
  const parcel = mapParcels.find((p) => p.surveyNumber === record.surveyNumber);

  return (
    <AppLayout title={`Record ${record.id}`} breadcrumb={<><span>Workspace</span><span className="text-navy-300">/</span><span>Records</span><span className="text-navy-300">/</span><span>{record.id}</span></>}>
      <PageHeader
        title={`Land Record — ${record.id}`}
        subtitle={`${record.owner} · Survey ${record.surveyNumber} · ${record.village}, ${record.district}`}
        actions={
          <>
            <StatusBadge status={record.status} />
            <button onClick={() => navigate({ name: 'validation', recordId: record.id })} className="btn-accent">
              <Workflow className="h-4 w-4" /> Validation Engine
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div className="panel rounded-t-lg border-b-0">
        <div className="flex overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab whitespace-nowrap ${
                  on ? 'border-saffron-400 text-navy-800' : 'border-transparent text-navy-500 hover:text-navy-700'
                }`}
              >
                <Icon className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel rounded-b-lg border-t-0 p-5 lg:p-6">
        {tab === 'overview' && <OverviewTab recordId={record.id} />}
        {tab === 'documents' && <DocumentsTab />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'map' && <MapTab parcel={parcel} />}
        {tab === 'validation' && <ValidationTab recordId={record.id} />}
      </div>
    </AppLayout>
  );
}

function OverviewTab({ recordId }: { recordId: string }) {
  const record = getRecord(recordId) ?? getRecord(DEMO_RECORD_ID)!;
  const fields = [
    { label: 'Unified Land ID', value: record.id, mono: true },
    { label: 'Owner', value: record.owner },
    { label: 'Survey Number', value: record.surveyNumber, mono: true },
    { label: 'Area', value: record.area },
    { label: 'Village', value: record.village },
    { label: 'Taluka', value: record.taluka },
    { label: 'District', value: record.district },
    { label: 'State', value: record.state },
    { label: 'Transaction Date', value: record.transactionDate },
    { label: 'OCR Confidence', value: `${record.ocrConfidence}%` },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h3 className="font-serif text-lg font-semibold text-navy-800 mb-4">Record Summary</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between py-3 border-b border-sand-200">
              <dt className="text-sm text-navy-500">{f.label}</dt>
              <dd className={`text-sm font-medium text-navy-800 ${f.mono ? 'font-mono' : ''}`}>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="space-y-4">
        <div className="bg-sand-50 border border-sand-200 rounded-md p-4">
          <div className="text-xs text-navy-500 uppercase tracking-wide mb-2">Validation Confidence</div>
          <ConfidenceMeter value={record.confidence} />
          <div className="mt-3 text-xs text-navy-500">Priority: <span className="font-medium text-navy-700">{record.priority}</span></div>
          <div className="text-xs text-navy-500">Submitted: <span className="font-medium text-navy-700">{record.submittedAt}</span></div>
        </div>
        <div className="bg-navy-50 border border-navy-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-navy-800 mb-2">Quick Actions</h4>
          <div className="space-y-2">
            <button onClick={() => undefined} className="btn-secondary w-full text-sm justify-start"><FileText className="h-4 w-4" /> Download Summary</button>
            <button onClick={() => undefined} className="btn-secondary w-full text-sm justify-start"><History className="h-4 w-4" /> View Audit Trail</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsTab() {
  const docs = [
    { icon: FileText, name: 'Sale Deed', ref: 'SD-2019-8830', date: '15/06/2019', pages: 4, conf: '94%' },
    { icon: ScrollText, name: 'RoR / 7/12', ref: '7/12-Haveli-1242A', date: '20/06/2019', pages: 2, conf: '93%' },
    { icon: GitBranch, name: 'Mutation Record', ref: 'Mut-2020-0045', date: '10/02/2020', pages: 1, conf: '88%' },
    { icon: Receipt, name: 'Tax Record', ref: 'PT-2023-7741', date: '05/04/2023', pages: 1, conf: '90%' },
  ];
  return (
    <div className="space-y-3">
      <h3 className="font-serif text-lg font-semibold text-navy-800 mb-2">Linked Documents</h3>
      {docs.map((d) => {
        const Icon = d.icon;
        return (
          <div key={d.name} className="flex items-center gap-4 p-4 border border-sand-200 rounded-md hover:bg-sand-50">
            <div className="h-11 w-11 rounded-md bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-navy-800">{d.name}</div>
              <div className="text-xs text-navy-500 font-mono">{d.ref} · {d.date} · {d.pages} pages</div>
            </div>
            <span className="chip bg-forest-50 text-forest-700 border border-forest-200">OCR {d.conf}</span>
            <button className="btn-ghost text-sm"><Download className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

function HistoryTab() {
  return (
    <div>
      <h3 className="font-serif text-lg font-semibold text-navy-800 mb-1">Ownership Timeline</h3>
      <p className="text-sm text-navy-500 mb-6">Chain of title reconstructed from mutation register and sale deeds.</p>
      <div className="relative pl-8">
        {/* vertical line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-navy-200" />
        {ownershipHistory.map((o, i) => {
          const isLast = i === ownershipHistory.length - 1;
          return (
            <div key={i} className="relative pb-7 last:pb-0">
              <div className={`absolute -left-8 top-1.5 h-6 w-6 rounded-full flex items-center justify-center border-2 ${isLast ? 'bg-saffron-400 border-saffron-300 text-navy-900' : 'bg-white border-navy-300 text-navy-600'}`}>
                <span className="text-[10px] font-bold">{i + 1}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm font-semibold text-navy-700 bg-navy-50 px-2 py-0.5 rounded">{o.year}</span>
                <span className="font-serif text-lg font-semibold text-navy-800">{o.owner}</span>
                <span className="text-xs text-navy-500">{o.relation}</span>
              </div>
              <div className="text-xs text-navy-500 font-mono mt-1">{o.deedRef}</div>
              <p className="text-sm text-navy-600 mt-1.5 max-w-xl leading-snug">{o.note}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapTab({ parcel }: { parcel: ReturnType<typeof mapParcels.find> }) {
  const { navigate } = useRouter();
  if (!parcel) return <div className="text-navy-500 text-sm">No parcel linked.</div>;
  const m = PARCEL_META[parcel.status];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#f5f1e8] map-grid-bg rounded-md border border-sand-200 p-2" style={{ minHeight: '300px' }}>
        <svg viewBox="0 0 640 480" className="w-full h-full">
          <path d="M 25 25 L 600 20 L 615 470 L 30 460 Z" fill="none" stroke="#234268" strokeWidth="2" strokeDasharray="8 5" />
          {mapParcels.map((p) => {
            const pm = PARCEL_META[p.status];
            const sel = p.surveyNumber === parcel.surveyNumber;
            return (
              <g key={p.surveyNumber}>
                <polygon
                  points={p.polygon}
                  fill={pm.fill}
                  fillOpacity={sel ? 0.9 : 0.25}
                  stroke={sel ? '#081326' : pm.stroke}
                  strokeWidth={sel ? 3 : 1.5}
                />
                {sel && <text x={p.labelX} y={p.labelY} textAnchor="middle" fontSize="13" fontWeight="700" fill={pm.text}>{p.surveyNumber}</text>}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold text-navy-800">Parcel {parcel.surveyNumber}</h3>
        <div className="space-y-2 text-sm">
          <Row label="Owner" value={parcel.owner} />
          <Row label="Recorded Area" value={parcel.recordedArea} />
          <Row label="GIS Area" value={parcel.gisArea} />
          <Row label="Confidence" value={`${parcel.confidence}/100`} />
          <div className="flex items-center justify-between py-2 border-b border-sand-200">
            <span className="text-navy-500">Status</span>
            <span className="chip" style={{ background: m.fill + '33', color: m.text === '#ffffff' ? m.stroke : m.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.stroke }} />{m.label}
            </span>
          </div>
        </div>
        <button onClick={() => navigate({ name: 'map' })} className="btn-secondary w-full text-sm">
          <MapIcon className="h-4 w-4" /> Open Full Map
        </button>
      </div>
    </div>
  );
}

function ValidationTab({ recordId }: { recordId: string }) {
  const { navigate } = useRouter();
  const record = getRecord(recordId) ?? getRecord(DEMO_RECORD_ID)!;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy-800">Validation Summary</h3>
          <p className="text-sm text-navy-500">8 cross-source checks for {record.id}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-xs text-navy-400">Confidence</div>
            <div className="font-mono font-semibold text-saffron-700">{record.confidence}/100</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-navy-400">Priority</div>
            <div className="font-semibold text-saffron-700">{record.priority}</div>
          </div>
          <button onClick={() => navigate({ name: 'explainable', recordId })} className="btn-primary text-sm">
            <ShieldCheck className="h-4 w-4" /> Explainable Result
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {validationChecks.map((c) => {
          const Icon = resultIcon[c.result];
          const tone = resultTone[c.result];
          return (
            <div key={c.id} className="flex items-start gap-3 p-3.5 border border-sand-200 rounded-md">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 border ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-navy-800 text-sm">{c.label}</span>
                  <span className={`chip border ${tone}`}>{c.result}</span>
                </div>
                <div className="text-xs text-navy-500 mt-1 leading-snug">{c.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => navigate({ name: 'audit', recordId })} className="btn-secondary text-sm">
        <History className="h-4 w-4" /> View Audit Trail <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-sand-200">
      <span className="text-navy-500">{label}</span>
      <span className="font-medium text-navy-800">{value}</span>
    </div>
  );
}
