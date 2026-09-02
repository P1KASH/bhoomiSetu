import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Map as MapIcon,
  Send,
  ShieldCheck,
  ArrowRight,
  MessageSquareQuote,
  ScanSearch,
  ScrollText,
  MapPin,
  Scale,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { getRecord, DEMO_RECORD_ID } from '../data/mockData';

interface Finding {
  type: 'pass' | 'fail' | 'warn';
  label: string;
  detail: string;
}

const findings: Finding[] = [
  { type: 'pass', label: 'Owner matches', detail: 'Rahul Patil consistent across Sale Deed, RoR, and Mutation.' },
  { type: 'pass', label: 'Survey number exists', detail: '124/2A present in all sources and GIS parcel overlay.' },
  { type: 'pass', label: 'Ownership history consistent', detail: 'Unbroken chain 2010 → 2015 → 2019 → current.' },
  { type: 'fail', label: 'Area mismatch', detail: 'Sale Deed 2.10 acres vs Land Record 2.35 acres (0.25 acre gap).' },
  { type: 'warn', label: 'Minor GIS difference', detail: 'GIS estimate 2.34 vs RoR 2.35 — within tolerance.' },
];

const findingStyle = {
  pass: { icon: CheckCircle2, color: 'text-forest-600', bg: 'bg-forest-50', border: 'border-forest-200', symbol: '✓' },
  fail: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', symbol: '✗' },
  warn: { icon: AlertTriangle, color: 'text-saffron-600', bg: 'bg-saffron-50', border: 'border-saffron-200', symbol: '⚠' },
};

const areaEvidence = [
  { source: 'Sale Deed', ref: 'SD-2019-8830', value: '2.10 acres', icon: FileText, tone: 'mismatch' as const, note: 'Registered conveyance deed, 15 Jun 2019' },
  { source: 'Land Record (RoR / 7/12)', ref: '7/12-Haveli-1242A', value: '2.35 acres', icon: ScrollText, tone: 'reference' as const, note: 'Record of Rights extract' },
  { source: 'GIS / Cadastral Estimate', ref: 'GIS-1242A-overlay', value: '2.34 acres', icon: MapPin, tone: 'warning' as const, note: 'Parcel polygon area estimation' },
];

export function ExplainableScreen() {
  const { navigate } = useRouter();
  const record = getRecord(DEMO_RECORD_ID)!;

  return (
    <AppLayout title="Explainable Validation Result" breadcrumb={<><span>Workspace</span><span className="text-navy-300">/</span><span>Result</span></>}>
      <PageHeader
        title="Explainable Validation Result"
        subtitle="A transparent, human-readable breakdown of every check — what passed, what failed, and the recommendation."
        actions={
          <button onClick={() => navigate({ name: 'validation', recordId: DEMO_RECORD_ID })} className="btn-secondary">
            <ShieldCheck className="h-4 w-4" /> Back to Engine
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Findings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-sand-200">
              <h3 className="font-serif text-lg font-semibold text-navy-800">Check-by-Check Findings</h3>
              <p className="text-xs text-navy-500">Every result is traceable to its source document</p>
            </div>
            <div className="divide-y divide-sand-200">
              {findings.map((f) => {
                const s = findingStyle[f.type];
                const Icon = s.icon;
                return (
                  <div key={f.label} className="px-5 py-4 flex items-start gap-4">
                    <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${s.bg} ${s.border} border`}>
                      <Icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-lg ${s.color}`}>{s.symbol}</span>
                        <span className="font-medium text-navy-800">{f.label}</span>
                      </div>
                      <p className="text-sm text-navy-600 mt-1 leading-snug">{f.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Area Mismatch Deep-Dive */}
          <div className="panel rounded-lg overflow-hidden border-l-4 border-l-red-500">
            <div className="px-5 py-4 border-b border-sand-200 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-serif text-lg font-semibold text-navy-800">Area Mismatch Deep-Dive</h3>
            </div>
            <div className="p-5 space-y-5">
              {/* Per-source values */}
              <div>
                <div className="text-xs uppercase tracking-wider text-navy-400 font-semibold mb-3">Reported Area by Source</div>
                <div className="space-y-2.5">
                  {areaEvidence.map((a) => {
                    const tone =
                      a.tone === 'mismatch'
                        ? 'border-red-300 bg-red-50'
                        : a.tone === 'warning'
                        ? 'border-saffron-200 bg-saffron-50'
                        : 'border-navy-200 bg-navy-50';
                    const dot = a.tone === 'mismatch' ? 'bg-red-500' : a.tone === 'warning' ? 'bg-saffron-400' : 'bg-navy-500';
                    const Icon = a.icon;
                    return (
                      <div key={a.source} className={`flex items-center gap-3 p-3 rounded-md border ${tone}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`} />
                        <div className="h-8 w-8 rounded bg-white/70 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-navy-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-navy-800">{a.source}</div>
                          <div className="text-[11px] text-navy-500 font-mono">{a.ref}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-semibold text-navy-800">{a.value}</div>
                          <div className="text-[10px] text-navy-400">{a.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Difference calculation */}
              <div className="bg-sand-50 border border-sand-200 rounded-md p-4">
                <div className="text-xs uppercase tracking-wider text-navy-400 font-semibold mb-3">Discrepancy Analysis</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border border-sand-200 rounded-md p-3">
                    <div className="text-xs text-navy-500">Sale Deed → Land Record</div>
                    <div className="font-mono text-lg font-semibold text-red-700 mt-0.5">0.25 acres</div>
                    <div className="text-xs text-navy-500 mt-0.5">~11.9% difference</div>
                  </div>
                  <div className="bg-white border border-sand-200 rounded-md p-3">
                    <div className="text-xs text-navy-500">GIS vs Land Record</div>
                    <div className="font-mono text-lg font-semibold text-forest-700 mt-0.5">0.01 acres</div>
                    <div className="text-xs text-navy-500 mt-0.5">~0.4% (within tolerance)</div>
                  </div>
                </div>
              </div>

              {/* Tolerance check */}
              <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-300 rounded-md">
                <div className="h-10 w-10 rounded-md bg-red-600 text-white flex items-center justify-center shrink-0">
                  <Scale className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm text-navy-600">Expected tolerance:</span>
                    <span className="font-mono font-semibold text-navy-800">±5%</span>
                    <span className="text-navy-300">·</span>
                    <span className="text-sm text-navy-600">Observed:</span>
                    <span className="font-mono font-semibold text-red-700">11.9%</span>
                    <span className="chip bg-red-600 text-white border border-red-700">EXCEEDS TOLERANCE</span>
                  </div>
                  <p className="text-xs text-red-700 mt-2">
                    The Sale Deed area deviates from the Land Record by more than double the permitted tolerance.
                    The GIS estimate corroborates the RoR value, suggesting the Sale Deed may contain a transcription error.
                  </p>
                </div>
              </div>

              {/* Evidence trace */}
              <div>
                <div className="text-xs uppercase tracking-wider text-navy-400 font-semibold mb-3 flex items-center gap-1.5">
                  <ScanSearch className="h-3.5 w-3.5" /> Evidence Trace — which source produced each value
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-sand-200 rounded-md overflow-hidden">
                    <thead className="bg-sand-50 text-xs uppercase tracking-wide text-navy-500">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Field</th>
                        <th className="text-left px-3 py-2 font-semibold">Source Document</th>
                        <th className="text-left px-3 py-2 font-semibold">Reference</th>
                        <th className="text-right px-3 py-2 font-semibold">Value</th>
                        <th className="text-left px-3 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-200">
                      <tr className="bg-white">
                        <td className="px-3 py-2.5 font-medium text-navy-800">Area</td>
                        <td className="px-3 py-2.5 text-navy-600">Sale Deed</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-navy-500">SD-2019-8830</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-red-700">2.10 acres</td>
                        <td className="px-3 py-2.5"><span className="chip bg-red-50 text-red-700 border border-red-200">Outlier</span></td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2.5 font-medium text-navy-800">Area</td>
                        <td className="px-3 py-2.5 text-navy-600">RoR / 7/12</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-navy-500">7/12-Haveli-1242A</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-navy-800">2.35 acres</td>
                        <td className="px-3 py-2.5"><span className="chip bg-navy-50 text-navy-700 border border-navy-200">Reference</span></td>
                      </tr>
                      <tr className="bg-white">
                        <td className="px-3 py-2.5 font-medium text-navy-800">Area</td>
                        <td className="px-3 py-2.5 text-navy-600">GIS / Cadastral</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-navy-500">GIS-1242A-overlay</td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-saffron-700">2.34 acres</td>
                        <td className="px-3 py-2.5"><span className="chip bg-saffron-50 text-saffron-700 border border-saffron-200">Corroborates RoR</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Non-legal disclaimer */}
              <div className="flex items-start gap-3 p-4 bg-navy-50 border border-navy-200 rounded-md">
                <ShieldCheck className="h-5 w-5 text-navy-600 shrink-0 mt-0.5" />
                <p className="text-xs text-navy-700 leading-relaxed">
                  <span className="font-semibold">Important:</span> BhoomiSetu flags this discrepancy for officer review only.
                  This system does <span className="font-semibold">not</span> make any legal ownership, fraud, or title
                  determination. The final decision rests with the authorized revenue officer after verifying original documents.
                </p>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="panel rounded-lg p-5 border-l-4 border-l-saffron-400">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-saffron-100 text-saffron-700 flex items-center justify-center shrink-0">
                <MessageSquareQuote className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-saffron-700 font-semibold">System Recommendation</div>
                <p className="font-serif text-lg text-navy-800 mt-1 leading-snug">
                  “Verify the original registered document.”
                </p>
                <p className="text-sm text-navy-600 mt-2">
                  The area mismatch between the Sale Deed (2.10 acres) and the Land Record (2.35 acres)
                  exceeds tolerance. The GIS estimate aligns with the RoR. Retrieve the physically
                  registered sale deed and confirm the recorded area before approving this record.
                </p>
                <p className="text-xs text-navy-400 mt-3 italic">
                  This is an AI recommendation only. The officer makes the final legal decision.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: verdict + actions */}
        <div className="space-y-4">
          <div className="panel rounded-lg overflow-hidden">
            <div className="bg-saffron-400 text-navy-900 px-5 py-4">
              <div className="text-xs uppercase tracking-wider font-semibold">Validation Verdict</div>
              <div className="font-serif text-2xl font-semibold mt-1">Needs Review</div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-sand-200">
                <span className="text-sm text-navy-500">Unified Land ID</span>
                <span className="font-mono font-semibold text-navy-800">{record.id}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-sand-200">
                <span className="text-sm text-navy-500">Confidence</span>
                <span className="font-mono font-semibold text-saffron-700">78 / 100</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-sand-200">
                <span className="text-sm text-navy-500">Priority</span>
                <span className="chip bg-saffron-50 text-saffron-700 border border-saffron-200">MEDIUM</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-navy-500">Checks passed</span>
                <span className="font-medium text-navy-800">3 / 5</span>
              </div>
            </div>
          </div>

          <div className="panel rounded-lg p-5">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-3">Actions</h3>
            <div className="space-y-2">
              <button onClick={() => navigate({ name: 'record', recordId: DEMO_RECORD_ID, tab: 'documents' })} className="btn-secondary w-full justify-start">
                <FileText className="h-4 w-4" /> View Evidence
                <ArrowRight className="h-4 w-4 ml-auto" />
              </button>
              <button onClick={() => navigate({ name: 'record', recordId: DEMO_RECORD_ID, tab: 'documents' })} className="btn-secondary w-full justify-start">
                <FileText className="h-4 w-4" /> View Documents
              </button>
              <button onClick={() => navigate({ name: 'map' })} className="btn-secondary w-full justify-start">
                <MapIcon className="h-4 w-4" /> View Map
              </button>
              <button onClick={() => navigate({ name: 'audit', recordId: DEMO_RECORD_ID })} className="btn-primary w-full justify-start">
                <Send className="h-4 w-4" /> Send for Review
                <ArrowRight className="h-4 w-4 ml-auto" />
              </button>
            </div>
          </div>

          <div className="panel rounded-lg p-4 bg-navy-50 border-navy-200">
            <p className="text-xs text-navy-600 leading-relaxed">
              Sending for review logs the action in the audit trail and routes the record to a
              senior officer for final disposition.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
