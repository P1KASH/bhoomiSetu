import { useState, useMemo } from 'react';
import {
  Search,
  Layers,
  Filter,
  MapPin,
  X,
  ArrowRight,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Workflow,
} from 'lucide-react';
import { AppLayout, PageHeader } from '../components/AppLayout';
import { useRouter } from '../router';
import { mapParcels, issueFilters } from '../data/mockData';
import { PARCEL_META } from '../components/StatusBadge';
import type { MapParcel, ParcelStatus } from '../types';

const validationFilters: { id: ParcelStatus; label: string }[] = [
  { id: 'verified', label: 'Verified' },
  { id: 'review', label: 'Needs Review' },
  { id: 'priority', label: 'High Priority' },
  { id: 'unvalidated', label: 'Not Validated' },
];

export function MapScreen() {
  const { navigate } = useRouter();
  const [selected, setSelected] = useState<MapParcel | null>(null);
  const [search, setSearch] = useState('');
  const [activeValFilters, setActiveValFilters] = useState<ParcelStatus[]>([]);
  const [activeIssueFilters, setActiveIssueFilters] = useState<string[]>([]);

  const toggleVal = (id: ParcelStatus) =>
    setActiveValFilters((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleIssue = (id: string) =>
    setActiveIssueFilters((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const filtered = useMemo(() => {
    return mapParcels.filter((p) => {
      if (activeValFilters.length && !activeValFilters.includes(p.status)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.surveyNumber.toLowerCase().includes(q) && !p.owner.toLowerCase().includes(q))
          return false;
      }
      // issue filters loosely map to parcel status for the prototype
      if (activeIssueFilters.length) {
        const issues = parcelIssues(p);
        if (!activeIssueFilters.some((f) => issues.includes(f))) return false;
      }
      return true;
    });
  }, [search, activeValFilters, activeIssueFilters]);

  const visibleSet = new Set(filtered.map((p) => p.surveyNumber));

  return (
    <AppLayout title="Land Intelligence Map" breadcrumb={<><span>Workspace</span><span className="text-navy-300">/</span><span>Map</span></>}>
      <PageHeader
        title="Cadastral Validation Map — Village Shivapur"
        subtitle="Each parcel is color-coded by validation status. Click a parcel to inspect its record."
        actions={
          <button onClick={() => navigate({ name: 'validation' })} className="btn-accent">
            <Workflow className="h-4 w-4" /> Validation Engine
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Search */}
          <div className="panel rounded-lg p-4">
            <h3 className="font-serif text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-navy-500" /> Search Parcels
            </h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Survey no. or owner name…"
              className="w-full px-3 py-2 text-sm bg-sand-50 border border-sand-200 rounded-md outline-none focus:border-navy-400"
            />
            <div className="text-xs text-navy-400 mt-2">
              Try “124/2A” or “Rahul Patil”
            </div>
          </div>

          {/* Validation filters */}
          <div className="panel rounded-lg p-4">
            <h3 className="font-serif text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-navy-500" /> Validation Filters
            </h3>
            <div className="space-y-2">
              {validationFilters.map((f) => {
                const m = PARCEL_META[f.id];
                const on = activeValFilters.includes(f.id);
                const count = mapParcels.filter((p) => p.status === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleVal(f.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md border text-sm transition-all ${
                      on ? 'border-navy-400 bg-navy-50' : 'border-sand-200 bg-white hover:bg-sand-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-sm" style={{ background: m.fill, border: `1.5px solid ${m.stroke}` }} />
                    <span className="text-navy-700 flex-1 text-left">{f.label}</span>
                    <span className="text-xs font-mono text-navy-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Issue filters */}
          <div className="panel rounded-lg p-4">
            <h3 className="font-serif text-sm font-semibold text-navy-800 mb-3 flex items-center gap-2">
              <Filter className="h-4 w-4 text-navy-500" /> Issue Filters
            </h3>
            <div className="space-y-2">
              {issueFilters.map((f) => {
                const on = activeIssueFilters.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md border text-sm cursor-pointer transition-all ${
                      on ? 'border-saffron-300 bg-saffron-50' : 'border-sand-200 bg-white hover:bg-sand-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleIssue(f.id)}
                      className="h-3.5 w-3.5 accent-saffron-500"
                    />
                    <span className="text-navy-700 flex-1">{f.label}</span>
                  </label>
                );
              })}
            </div>
            {(activeValFilters.length > 0 || activeIssueFilters.length > 0 || search) && (
              <button
                onClick={() => { setActiveValFilters([]); setActiveIssueFilters([]); setSearch(''); }}
                className="btn-ghost w-full text-xs mt-3"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Legend */}
          <div className="panel rounded-lg p-4">
            <h3 className="font-serif text-sm font-semibold text-navy-800 mb-3">Legend</h3>
            <div className="space-y-1.5">
              {validationFilters.map((f) => {
                const m = PARCEL_META[f.id];
                return (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-navy-600">
                    <span className="w-4 h-4 rounded-sm" style={{ background: m.fill, border: `1.5px solid ${m.stroke}` }} />
                    {m.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Map canvas */}
        <div className="panel rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-sand-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2 text-sm text-navy-600">
              <MapPin className="h-4 w-4 text-saffron-500" />
              <span className="font-medium">Shivapur Village · Haveli · Pune</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 text-navy-500 hover:bg-navy-50 rounded"><ZoomIn className="h-4 w-4" /></button>
              <button className="p-1.5 text-navy-500 hover:bg-navy-50 rounded"><ZoomOut className="h-4 w-4" /></button>
              <button className="p-1.5 text-navy-500 hover:bg-navy-50 rounded"><Crosshair className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="relative bg-[#f5f1e8] map-grid-bg" style={{ minHeight: '520px' }}>
            <svg viewBox="0 0 640 480" className="w-full h-full block" style={{ minHeight: '520px' }}>
              {/* Village boundary */}
              <path
                d="M 25 25 L 600 20 L 615 470 L 30 460 Z"
                fill="none"
                stroke="#234268"
                strokeWidth="2.5"
                strokeDasharray="8 5"
              />
              <text x="30" y="18" fontSize="11" fill="#234268" fontWeight="600">Shivapur Village Boundary</text>

              {/* Water / stream feature — diagonal blue line with width */}
              <path
                d="M 0 380 C 120 360, 260 330, 420 300 S 620 250, 640 230"
                fill="none"
                stroke="#5b9bd5"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M 0 380 C 120 360, 260 330, 420 300 S 620 250, 640 230"
                fill="none"
                stroke="#a8c8e8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text x="250" y="325" fontSize="9" fill="#3f6e95" fontWeight="600" fontStyle="italic">Stream / Nala</text>

              {/* Road — horizontal across mid-map */}
              <line x1="0" y1="160" x2="640" y2="165" stroke="#8b8680" strokeWidth="5" opacity="0.55" />
              <line x1="0" y1="160" x2="640" y2="165" stroke="#d4d0c8" strokeWidth="1.5" strokeDasharray="10 8" opacity="0.8" />
              <text x="500" y="155" fontSize="9" fill="#6b6660" fontWeight="600">Road</text>

              {/* Vertical road segment */}
              <line x1="410" y1="160" x2="420" y2="465" stroke="#8b8680" strokeWidth="4" opacity="0.45" />
              <line x1="410" y1="160" x2="420" y2="465" stroke="#d4d0c8" strokeWidth="1.2" strokeDasharray="8 6" opacity="0.7" />

              {/* North arrow */}
              <g transform="translate(595, 45)">
                <polygon points="0,-12 6,6 0,2 -6,6" fill="#234268" />
                <text x="-3" y="22" fontSize="10" fill="#234268" fontWeight="600">N</text>
              </g>

              {/* Parcels */}
              {mapParcels.map((p) => {
                const m = PARCEL_META[p.status];
                const visible = visibleSet.has(p.surveyNumber);
                const isSel = selected?.surveyNumber === p.surveyNumber;
                const isHighlight = p.surveyNumber === '124/2A';
                return (
                  <g
                    key={p.surveyNumber}
                    onClick={() => setSelected(p)}
                    className="cursor-pointer"
                    style={{ opacity: visible ? 1 : 0.25, transition: 'opacity 0.2s' }}
                  >
                    <polygon
                      points={p.polygon}
                      fill={m.fill}
                      fillOpacity={isSel ? 0.9 : isHighlight ? 0.7 : 0.55}
                      stroke={isSel ? '#081326' : isHighlight ? '#c2640a' : m.stroke}
                      strokeWidth={isSel ? 3 : isHighlight ? 2.8 : 1.8}
                    />
                    {isHighlight && !isSel && (
                      <polygon
                        points={p.polygon}
                        fill="none"
                        stroke="#c2640a"
                        strokeWidth="1.5"
                        strokeDasharray="5 3"
                        opacity="0.8"
                      />
                    )}
                    <text
                      x={p.labelX}
                      y={p.labelY - 6}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fill={m.text}
                    >
                      {p.surveyNumber}
                    </text>
                    <text
                      x={p.labelX}
                      y={p.labelY + 9}
                      textAnchor="middle"
                      fontSize="9"
                      fill={m.text}
                      fillOpacity="0.85"
                    >
                      {p.owner === 'Unassigned' ? 'Unvalidated' : p.owner.split(' ')[0]}
                    </text>
                    {isHighlight && (
                      <g transform={`translate(${p.labelX}, ${p.labelY + 22})`}>
                        <rect x="-32" y="-7" width="64" height="13" rx="2" fill="#c2640a" />
                        <text x="0" y="2" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ffffff">DEMO PARCEL</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Scale indicator */}
              <g transform="translate(35, 450)">
                <line x1="0" y1="0" x2="80" y2="0" stroke="#234268" strokeWidth="2" />
                <line x1="0" y1="-4" x2="0" y2="4" stroke="#234268" strokeWidth="2" />
                <line x1="40" y1="-3" x2="40" y2="3" stroke="#234268" strokeWidth="1.5" />
                <line x1="80" y1="-4" x2="80" y2="4" stroke="#234268" strokeWidth="2" />
                <text x="0" y="16" fontSize="9" fill="#234268" fontWeight="600">0</text>
                <text x="38" y="16" fontSize="9" fill="#234268" fontWeight="600">50</text>
                <text x="74" y="16" fontSize="9" fill="#234268" fontWeight="600">100m</text>
              </g>
            </svg>

            {/* Popup */}
            {selected && (
              <div className="absolute top-4 right-4 w-72 bg-white rounded-lg shadow-lift border border-navy-200 z-10 overflow-hidden">
                <div className="px-4 py-3 bg-navy-700 text-white flex items-center justify-between">
                  <div>
                    <div className="text-xs text-navy-200">Parcel</div>
                    <div className="font-mono font-semibold text-lg">{selected.surveyNumber}</div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-1 hover:bg-navy-600 rounded">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 space-y-2.5 text-sm">
                  <PopupRow label="Owner" value={selected.owner} />
                  <PopupRow label="Recorded Area" value={selected.recordedArea} />
                  <PopupRow label="GIS Area" value={selected.gisArea} />
                  <PopupRow
                    label="Confidence"
                    value={selected.confidence ? `${selected.confidence}/100` : '—'}
                  />
                  <div className="flex items-center justify-between py-1">
                    <span className="text-navy-500">Status</span>
                    <span
                      className="chip"
                      style={{
                        background: PARCEL_META[selected.status].fill + '33',
                        color: PARCEL_META[selected.status].text === '#ffffff' ? PARCEL_META[selected.status].stroke : PARCEL_META[selected.status].text,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: PARCEL_META[selected.status].stroke }} />
                      {PARCEL_META[selected.status].label}
                    </span>
                  </div>
                </div>
                <div className="p-3 border-t border-sand-200 space-y-2">
                  <button
                    onClick={() => navigate({ name: 'record', recordId: `LR-${selected.surveyNumber.replace('/', '')}`, tab: 'overview' })}
                    className="btn-primary w-full text-sm"
                  >
                    Open Record <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate({ name: 'validation' })}
                    className="btn-secondary w-full text-sm"
                  >
                    <Workflow className="h-4 w-4" /> Run Validation
                  </button>
                </div>
              </div>
            )}

            {/* filtered count */}
            <div className="absolute bottom-3 left-3 bg-white/90 border border-sand-200 rounded px-3 py-1.5 text-xs text-navy-600">
              Showing <span className="font-semibold">{filtered.length}</span> of {mapParcels.length} parcels
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function PopupRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-navy-500">{label}</span>
      <span className="font-medium text-navy-800">{value}</span>
    </div>
  );
}

function parcelIssues(p: MapParcel): string[] {
  if (p.status === 'unvalidated') return [];
  const issues: string[] = [];
  if (p.recordedArea !== '—' && p.gisArea !== '—') {
    const rec = parseFloat(p.recordedArea);
    const gis = parseFloat(p.gisArea);
    if (!isNaN(rec) && !isNaN(gis) && Math.abs(rec - gis) > 0.05) issues.push('area', 'gis');
  }
  if (p.confidence > 0 && p.confidence < 85) issues.push('ocr');
  if (p.status === 'priority') issues.push('owner', 'survey');
  if (p.status === 'review') issues.push('area');
  return issues;
}
