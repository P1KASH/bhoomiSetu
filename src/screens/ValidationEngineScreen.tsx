import { useEffect, useState } from 'react';
import {
  FileText,
  ScrollText,
  GitBranch,
  History,
  Map as MapIcon,
  Workflow,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  ScanSearch,
  GitCompareArrows,
  Radar,
  Brain,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { validationSources, validationChecks, areaSources, getRecord, DEMO_RECORD_ID } from '../data/mockData';
import type { ValidationCheck } from '../types';

const sourceIcons: Record<string, typeof FileText> = {
  FileText,
  ScrollText,
  GitBranch,
  History,
  Map: MapIcon,
};

const engineCapabilities = [
  { icon: ScanSearch, label: 'Rule-Based Validation', desc: 'Structured field-level checks against registry rules' },
  { icon: GitCompareArrows, label: 'Cross-Document Comparison', desc: 'Reconciles fields across sale deed, RoR & mutation' },
  { icon: MapIcon, label: 'GIS Validation', desc: 'Cadastral overlay & parcel area estimation' },
  { icon: Brain, label: 'AI Anomaly Detection', desc: 'Flags outliers and suspicious patterns' },
];

const resultMeta: Record<ValidationCheck['result'], { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  MATCH: { label: 'MATCH', color: 'text-forest-700', bg: 'bg-forest-50', border: 'border-forest-200', icon: CheckCircle2 },
  MISMATCH: { label: 'MISMATCH', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  WARNING: { label: 'WARNING', color: 'text-saffron-700', bg: 'bg-saffron-50', border: 'border-saffron-200', icon: AlertTriangle },
  PENDING: { label: 'PENDING', color: 'text-navy-600', bg: 'bg-navy-50', border: 'border-navy-200', icon: Cpu },
};

export function ValidationEngineScreen() {
  const { navigate } = useRouter();
  const record = getRecord(DEMO_RECORD_ID)!;
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((p) => (p < validationSources.length - 1 ? p + 1 : p));
    }, 800);
    return () => clearInterval(t);
  }, []);

  const sourceY = [40, 110, 180, 250, 320];
  const engineCenterY = 180;

  return (
    <AppLayout title="Validation Engine" breadcrumb={<><span>Workspace</span><span className="text-navy-300">/</span><span>Validation</span></>}>
      <PageHeader
        title="Cross-Source Validation Engine"
        subtitle="Five sources feed one validation engine that cross-checks owner, survey, area, history, and GIS identity."
        actions={
          <button
            onClick={() => navigate({ name: 'explainable', recordId: DEMO_RECORD_ID })}
            className="btn-accent"
          >
            <ShieldCheck className="h-4 w-4" /> View Explainable Result
          </button>
        }
      />

      {/* Record context bar */}
      <div className="panel rounded-lg px-5 py-3 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <span className="font-mono font-semibold text-navy-800 bg-navy-50 px-2 py-0.5 rounded">{record.id}</span>
        <span className="text-navy-500">Owner: <span className="font-medium text-navy-800">{record.owner}</span></span>
        <span className="text-navy-500">Survey: <span className="font-medium text-navy-800">{record.surveyNumber}</span></span>
        <span className="text-navy-500">Area: <span className="font-medium text-navy-800">{record.area}</span></span>
        <span className="text-navy-500">Location: <span className="font-medium text-navy-800">{record.village}, {record.district}</span></span>
      </div>

      {/* The engine visualization — prominent central hub */}
      <div className="panel rounded-lg p-5 lg:p-7 mb-6 overflow-x-auto">
        <div className="min-w-[860px]">
          {/* Section label */}
          <div className="flex items-center justify-between mb-5">
            <div className="text-xs uppercase tracking-wider text-navy-400 font-semibold">Validation Pipeline</div>
            <div className="inline-flex items-center gap-1.5 text-xs text-navy-500 bg-navy-50 px-2.5 py-1 rounded-full border border-navy-200">
              <Cpu className="h-3 w-3" /> {active + 1}/{validationSources.length} sources ingested
            </div>
          </div>

          {/* Main pipeline: sources → engine → output */}
          <div className="grid grid-cols-[260px_1fr_240px] gap-4 items-start">
            {/* Sources column */}
            <div className="space-y-2.5 pt-1">
              <div className="text-[11px] uppercase tracking-wider text-navy-400 font-semibold mb-1 pl-1">Data Sources</div>
              {validationSources.map((s, i) => {
                const Icon = sourceIcons[s.icon] ?? FileText;
                const processed = i <= active;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-3 rounded-md border transition-all ${
                      processed ? 'border-navy-300 bg-white shadow-panel' : 'border-sand-200 bg-sand-50 opacity-50'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${processed ? 'bg-navy-700 text-white' : 'bg-navy-100 text-navy-400'}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-navy-800 block leading-tight">{s.name}</span>
                      {processed && <span className="text-[10px] text-forest-600">Ingested</span>}
                    </div>
                    {processed ? (
                      <CheckCircle2 className="h-4 w-4 text-forest-500 shrink-0" />
                    ) : i === active + 1 ? (
                      <span className="w-2 h-2 rounded-full bg-saffron-400 animate-pulsedot shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Central engine hub with flow lines */}
            <div className="relative flex flex-col items-center pt-1">
              <div className="text-[11px] uppercase tracking-wider text-navy-400 font-semibold mb-1">Validation Engine</div>

              {/* Flow lines SVG connecting sources to engine */}
              <svg width="100%" height="380" viewBox="0 0 360 380" className="absolute top-7 left-0 pointer-events-none" preserveAspectRatio="none">
                {sourceY.map((y, i) => {
                  const done = i <= active;
                  return (
                    <path
                      key={`in-${i}`}
                      d={`M 0 ${y + 10} C 80 ${y + 10}, 100 ${engineCenterY}, 170 ${engineCenterY}`}
                      fill="none"
                      stroke={done ? '#1f6e32' : '#d4dde9'}
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      className={done ? 'animate-flowdash' : ''}
                    />
                  );
                })}
                {/* Output line to verdict */}
                <path
                  d={`M 190 ${engineCenterY} C 270 ${engineCenterY}, 300 ${engineCenterY}, 360 ${engineCenterY}`}
                  fill="none"
                  stroke={active >= validationSources.length - 1 ? '#c2640a' : '#d4dde9'}
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                  className={active >= validationSources.length - 1 ? 'animate-flowdash' : ''}
                />
              </svg>

              {/* Engine core — prominent */}
              <div className="relative z-10 mt-[170px]">
                <div className="bg-navy-800 text-white rounded-xl p-6 text-center shadow-lift border-2 border-saffron-300 w-56">
                  <div className="h-14 w-14 mx-auto rounded-lg bg-saffron-400 text-navy-900 flex items-center justify-center mb-3">
                    <Workflow className="h-7 w-7" />
                  </div>
                  <div className="font-serif text-xl font-semibold">Cross-Check Engine</div>
                  <div className="text-xs text-navy-200 mt-1.5">8 rule-based + AI checks</div>
                  <div className="mt-4 pt-3 border-t border-navy-600 space-y-1.5 text-left">
                    {engineCapabilities.map((c) => {
                      const Icon = c.icon;
                      return (
                        <div key={c.label} className="flex items-center gap-2 text-[11px] text-navy-100">
                          <Icon className="h-3.5 w-3.5 text-saffron-300 shrink-0" />
                          <span className="leading-tight">{c.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Output verdict */}
            <div className="space-y-3 pt-1">
              <div className="text-[11px] uppercase tracking-wider text-navy-400 font-semibold mb-1 pl-1">Output</div>
              <div className="bg-white border-2 border-saffron-300 rounded-lg p-4 text-center shadow-panel">
                <div className="text-xs text-navy-500 mb-2">Validation Verdict</div>
                <div className="space-y-3 py-1">
                  <Metric label="Confidence" value="78" max="/100" tone="saffron" />
                  <div className="h-px bg-sand-200" />
                  <Metric label="Priority" value="MEDIUM" tone="saffron" />
                  <div className="h-px bg-sand-200" />
                  <Metric label="Status" value="NEEDS REVIEW" tone="saffron" />
                </div>
              </div>
              <div className="bg-navy-50 border border-navy-200 rounded-md p-3">
                <div className="text-[11px] font-semibold text-navy-600 uppercase tracking-wide mb-2">Engine Processes</div>
                <div className="space-y-2">
                  {engineCapabilities.map((c) => {
                    const Icon = c.icon;
                    return (
                      <div key={c.label} className="flex items-start gap-2">
                        <Icon className="h-3.5 w-3.5 text-navy-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-medium text-navy-700">{c.label}</div>
                          <div className="text-[10px] text-navy-400 leading-tight">{c.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-sand-200">
            <h3 className="font-serif text-lg font-semibold text-navy-800">Validation Checks</h3>
            <p className="text-xs text-navy-500">8 automated cross-source checks</p>
          </div>
          <div className="divide-y divide-sand-200">
            {validationChecks.map((c) => {
              const m = resultMeta[c.result];
              const Icon = m.icon;
              return (
                <div key={c.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${m.bg} ${m.border} border`}>
                    <Icon className={`h-4 w-4 ${m.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-navy-800 text-sm">{c.label}</span>
                      <span className={`chip ${m.bg} ${m.color} border ${m.border}`}>{m.label}</span>
                    </div>
                    <div className="text-xs text-navy-400 mt-0.5">{c.source}</div>
                    <div className="text-xs text-navy-600 mt-1 leading-snug">{c.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Area deep-dive */}
        <div className="space-y-4">
          <div className="panel rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-sand-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-saffron-600" />
              <h3 className="font-serif text-lg font-semibold text-navy-800">Area Mismatch Deep-Dive</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-navy-600 mb-4">
                The flagged discrepancy across sources for the <span className="font-medium">area</span> field:
              </p>
              <div className="space-y-3">
                {areaSources.map((a) => {
                  const tone =
                    a.tone === 'mismatch'
                      ? 'border-red-300 bg-red-50'
                      : a.tone === 'warning'
                      ? 'border-saffron-200 bg-saffron-50'
                      : 'border-navy-200 bg-navy-50';
                  const dot = a.tone === 'mismatch' ? 'bg-red-500' : a.tone === 'warning' ? 'bg-saffron-400' : 'bg-navy-500';
                  return (
                    <div key={a.source} className={`flex items-center gap-3 p-3 rounded-md border ${tone}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      <span className="text-sm font-medium text-navy-800 flex-1">{a.source}</span>
                      <span className="font-mono font-semibold text-navy-800">{a.value}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 leading-relaxed">
                Sale Deed (2.10) differs from Land Record (2.35) by 0.25 acres — above the 5% tolerance.
                GIS estimate (2.34) aligns with the RoR. Recommend verifying the original registered deed.
              </div>
            </div>
          </div>

          <div className="panel rounded-lg p-5">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-3">Officer Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate({ name: 'explainable', recordId: DEMO_RECORD_ID })} className="btn-primary">
                <ShieldCheck className="h-4 w-4" /> Explainable Result
              </button>
              <button onClick={() => navigate({ name: 'map' })} className="btn-secondary">
                <MapIcon className="h-4 w-4" /> View on Map
              </button>
              <button onClick={() => navigate({ name: 'record', recordId: DEMO_RECORD_ID, tab: 'documents' })} className="btn-secondary">
                <FileText className="h-4 w-4" /> View Documents
              </button>
              <button onClick={() => navigate({ name: 'record', recordId: DEMO_RECORD_ID, tab: 'validation' })} className="btn-secondary">
                <Workflow className="h-4 w-4" /> Full Validation
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value, max, tone }: { label: string; value: string; max?: string; tone: 'forest' | 'saffron' | 'red' }) {
  const color = tone === 'forest' ? 'text-forest-700' : tone === 'red' ? 'text-red-700' : 'text-saffron-700';
  return (
    <div>
      <div className="text-[11px] text-navy-400 uppercase tracking-wide">{label}</div>
      <div className={`font-serif font-semibold ${color} text-lg leading-tight`}>
        {value}
        {max && <span className="text-sm text-navy-400">{max}</span>}
      </div>
    </div>
  );
}
