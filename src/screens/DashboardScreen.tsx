import {
  FileCheck2,
  AlertTriangle,
  ShieldAlert,
  Files,
  ArrowRight,
  Workflow,
  Map as MapIcon,
  Upload,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { StatusBadge, ConfidenceMeter } from '../components/StatusBadge';
import {
  dashboardStats,
  recentAlerts,
  landRecords,
  DEMO_RECORD_ID,
} from '../data/mockData';
import type { RecordStatus } from '../types';

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  sub,
}: {
  label: string;
  value: number | string;
  icon: typeof Files;
  tone: 'navy' | 'forest' | 'saffron' | 'red';
  sub?: string;
}) {
  const tones = {
    navy: 'border-navy-200 bg-navy-50 text-navy-700',
    forest: 'border-forest-200 bg-forest-50 text-forest-700',
    saffron: 'border-saffron-200 bg-saffron-50 text-saffron-700',
    red: 'border-red-200 bg-red-50 text-red-700',
  };
  return (
    <div className="panel rounded-lg p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-navy-500 font-medium">{label}</div>
          <div className="font-serif text-3xl font-semibold text-navy-800 mt-1">{value}</div>
          {sub && <div className="text-xs text-navy-400 mt-1">{sub}</div>}
        </div>
        <div className={`h-11 w-11 rounded-md flex items-center justify-center border ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const alertTone: Record<string, string> = {
  verified: 'border-l-forest-500',
  review: 'border-l-saffron-400',
  priority: 'border-l-red-500',
};

export function DashboardScreen() {
  const { navigate } = useRouter();
  const queue = landRecords.filter((r) => r.status !== 'verified').slice(0, 5);

  return (
    <AppLayout title="Officer Dashboard" breadcrumb={<><span>Officer Workspace</span></>}>
      <PageHeader
        title="Welcome, Officer Bhosale"
        subtitle="Haveli Taluka · Pune District · Maharashtra — validation summary & review queue"
        actions={
          <>
            <button onClick={() => navigate({ name: 'upload' })} className="btn-secondary">
              <Upload className="h-4 w-4" /> Digitize New
            </button>
            <button
              onClick={() => navigate({ name: 'validation', recordId: DEMO_RECORD_ID })}
              className="btn-accent"
            >
              <Workflow className="h-4 w-4" /> Run Validation
            </button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Land Records" value={dashboardStats.total} icon={Files} tone="navy" sub="Across Haveli taluka" />
        <StatCard label="Verified" value={dashboardStats.verified} icon={FileCheck2} tone="forest" sub="All checks passed" />
        <StatCard label="Needs Review" value={dashboardStats.review} icon={AlertTriangle} tone="saffron" sub="Officer action required" />
        <StatCard label="High Priority" value={dashboardStats.priority} icon={ShieldAlert} tone="red" sub="Critical discrepancies" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Review queue */}
        <div className="xl:col-span-2 panel rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-sand-200 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold text-navy-800">Review Queue</h3>
              <p className="text-xs text-navy-500">Records awaiting officer validation</p>
            </div>
            <button onClick={() => navigate({ name: 'map' })} className="btn-ghost text-sm">
              View on Map <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-sand-200">
            {queue.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate({ name: 'record', recordId: r.id, tab: 'overview' })}
                className="w-full text-left px-5 py-4 hover:bg-sand-50 transition-colors flex items-center gap-4"
              >
                <div className="h-10 w-10 rounded-md bg-navy-50 border border-navy-100 flex items-center justify-center text-xs font-mono font-semibold text-navy-700 shrink-0">
                  {r.id.split('-')[1].slice(0, 4)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-navy-800">{r.id}</span>
                    <StatusBadge status={r.status as RecordStatus} />
                  </div>
                  <div className="text-sm text-navy-600 mt-0.5 truncate">
                    {r.owner} · Survey {r.surveyNumber} · {r.area} · {r.village}, {r.district}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <ConfidenceMeter value={r.confidence} />
                </div>
                <ArrowRight className="h-4 w-4 text-navy-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div className="panel rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-sand-200">
            <h3 className="font-serif text-lg font-semibold text-navy-800">Recent Validation Alerts</h3>
            <p className="text-xs text-navy-500">Last 24 hours</p>
          </div>
          <div className="divide-y divide-sand-200">
            {recentAlerts.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate({ name: 'record', recordId: a.recordId, tab: 'validation' })}
                className={`w-full text-left px-5 py-3.5 border-l-4 ${alertTone[a.severity]} hover:bg-sand-50 transition-colors`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-navy-600">{a.recordId}</span>
                  <span className="text-[11px] text-navy-400">{a.time}</span>
                </div>
                <p className="text-sm text-navy-700 mt-1 leading-snug">{a.text}</p>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-sand-200">
            <button onClick={() => navigate({ name: 'audit' })} className="btn-ghost w-full text-sm justify-center">
              View Full Audit Trail
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <button
          onClick={() => navigate({ name: 'upload' })}
          className="panel rounded-lg p-5 text-left hover:shadow-lift transition-shadow group"
        >
          <Upload className="h-7 w-7 text-saffron-400 mb-3" />
          <div className="font-medium text-navy-800">Digitize a Document</div>
          <p className="text-sm text-navy-500 mt-1">Upload sale deed, RoR, mutation records for AI extraction.</p>
          <span className="text-sm text-navy-600 group-hover:translate-x-1 inline-flex items-center gap-1 mt-3">
            Start <ArrowRight className="h-4 w-4" />
          </span>
        </button>
        <button
          onClick={() => navigate({ name: 'validation', recordId: DEMO_RECORD_ID })}
          className="panel rounded-lg p-5 text-left hover:shadow-lift transition-shadow group"
        >
          <Workflow className="h-7 w-7 text-forest-500 mb-3" />
          <div className="font-medium text-navy-800">Open Validation Engine</div>
          <p className="text-sm text-navy-500 mt-1">See how multiple sources feed into one cross-check for LR-1242A.</p>
          <span className="text-sm text-navy-600 group-hover:translate-x-1 inline-flex items-center gap-1 mt-3">
            Open <ArrowRight className="h-4 w-4" />
          </span>
        </button>
        <button
          onClick={() => navigate({ name: 'map' })}
          className="panel rounded-lg p-5 text-left hover:shadow-lift transition-shadow group"
        >
          <MapIcon className="h-7 w-7 text-navy-600 mb-3" />
          <div className="font-medium text-navy-800">Land Intelligence Map</div>
          <p className="text-sm text-navy-500 mt-1">Cadastral map with validation status per parcel.</p>
          <span className="text-sm text-navy-600 group-hover:translate-x-1 inline-flex items-center gap-1 mt-3">
            Explore <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </div>
    </AppLayout>
  );
}
