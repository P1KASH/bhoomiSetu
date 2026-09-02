import {
  ScanText,
  FileText,
  ScrollText,
  GitBranch,
  CheckCircle2,
  Workflow,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { extractedFields, getRecord, DEMO_RECORD_ID } from '../data/mockData';

const sourceIcons: Record<string, typeof FileText> = {
  'Sale Deed': FileText,
  'RoR / 7/12': ScrollText,
};

export function ExtractionScreen() {
  const { navigate } = useRouter();
  const record = getRecord(DEMO_RECORD_ID)!;

  return (
    <AppLayout title="AI Extraction & Unified Land ID" breadcrumb={<><span>Workspace</span><span className="text-navy-300">/</span><span>Extraction</span></>}>
      <PageHeader
        title="AI-Extracted Land Record"
        subtitle="Fields extracted via OCR from uploaded documents and assembled into a Unified Land ID."
        actions={
          <button
            onClick={() => navigate({ name: 'validation', recordId: DEMO_RECORD_ID })}
            className="btn-accent"
          >
            <Workflow className="h-4 w-4" /> Run Validation Engine
          </button>
        }
      />

      {/* Unified Land ID banner */}
      <div className="panel rounded-lg overflow-hidden mb-6 border-2 border-navy-200">
        <div className="bg-navy-700 text-white px-6 py-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-md bg-saffron-400 text-navy-900 flex items-center justify-center shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-navy-200">Unified Land ID</div>
            <div className="font-mono font-serif text-2xl font-semibold">{record.id}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-navy-200">OCR Confidence</div>
            <div className="font-mono text-2xl font-semibold text-saffron-300">91%</div>
          </div>
        </div>
        <div className="px-6 py-3 bg-navy-50 border-t border-navy-200 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="text-navy-500">Owner: <span className="font-medium text-navy-800">{record.owner}</span></span>
          <span className="text-navy-500">Survey: <span className="font-medium text-navy-800">{record.surveyNumber}</span></span>
          <span className="text-navy-500">Area: <span className="font-medium text-navy-800">{record.area}</span></span>
          <span className="text-navy-500">Location: <span className="font-medium text-navy-800">{record.village}, {record.taluka}, {record.district}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extracted fields */}
        <div className="lg:col-span-2 panel rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-sand-200 flex items-center gap-2">
            <ScanText className="h-5 w-5 text-navy-600" />
            <h3 className="font-serif text-lg font-semibold text-navy-800">Extracted Information</h3>
          </div>
          <div className="divide-y divide-sand-200">
            {extractedFields.map((f) => {
              const Icon = sourceIcons[f.source] ?? FileText;
              const tone = f.confidence >= 95 ? 'forest' : f.confidence >= 90 ? 'navy' : 'saffron';
              const barTone = tone === 'forest' ? 'bg-forest-500' : tone === 'navy' ? 'bg-navy-500' : 'bg-saffron-400';
              return (
                <div key={f.label} className="px-5 py-4 flex items-center gap-4 hover:bg-sand-50">
                  <div className="h-9 w-9 rounded-md bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
                    <Icon className="h-4.5 w-4.5" size={18} />
                  </div>
                  <div className="w-32 shrink-0">
                    <div className="text-sm text-navy-500">{f.label}</div>
                    <div className="text-[11px] text-navy-400">{f.source}</div>
                  </div>
                  <div className="flex-1 font-medium text-navy-800">{f.value}</div>
                  <div className="w-28 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-navy-100 overflow-hidden">
                        <div className={`h-full ${barTone}`} style={{ width: `${f.confidence}%` }} />
                      </div>
                      <span className="text-xs font-mono text-navy-600 w-9 text-right">{f.confidence}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 bg-sand-50 border-t border-sand-200 text-xs text-navy-500 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-forest-500" />
            All fields above auto-extraction threshold (85%). Officer must confirm before record is finalized.
          </div>
        </div>

        {/* Side panel: source docs + actions */}
        <div className="space-y-4">
          <div className="panel rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-sand-200">
              <h3 className="font-serif text-lg font-semibold text-navy-800">Source Documents</h3>
            </div>
            <div className="divide-y divide-sand-200">
              {[
                { icon: FileText, name: 'Sale Deed', ref: 'SD-2019-8830', conf: '94%' },
                { icon: ScrollText, name: 'RoR / 7/12', ref: '7/12-Haveli-1242A', conf: '93%' },
                { icon: GitBranch, name: 'Mutation Record', ref: 'Mut-2020-0045', conf: '88%' },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.name} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5" size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-navy-800">{d.name}</div>
                      <div className="text-xs text-navy-500 font-mono">{d.ref}</div>
                    </div>
                    <span className="chip bg-forest-50 text-forest-700 border border-forest-200">{d.conf}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel rounded-lg p-5">
            <h3 className="font-serif text-base font-semibold text-navy-800 mb-3">Next Steps</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate({ name: 'validation', recordId: DEMO_RECORD_ID })}
                className="btn-primary w-full justify-start"
              >
                <Workflow className="h-4 w-4" /> Open Validation Engine
                <ArrowRight className="h-4 w-4 ml-auto" />
              </button>
              <button
                onClick={() => navigate({ name: 'record', recordId: DEMO_RECORD_ID, tab: 'overview' })}
                className="btn-secondary w-full justify-start"
              >
                <FileText className="h-4 w-4" /> View Record Detail
              </button>
              <button
                onClick={() => navigate({ name: 'explainable', recordId: DEMO_RECORD_ID })}
                className="btn-secondary w-full justify-start"
              >
                <CheckCircle2 className="h-4 w-4" /> Validation Result
              </button>
            </div>
          </div>

          <div className="panel rounded-lg p-4 bg-saffron-50 border-saffron-200">
            <p className="text-xs text-saffron-800 leading-relaxed">
              AI extraction assists the officer. Verify the area field (88% confidence) against
              the original registered document before proceeding.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
