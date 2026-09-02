import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Upload,
  ScanText,
  Workflow,
  ShieldCheck,
  Map as MapIcon,
  FileText,
  History,
  LogOut,
  Bell,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useRouter, type Route } from '../router';
import { Logo } from './Logo';
import { DEMO_RECORD_ID } from '../data/mockData';

interface NavItem {
  label: string;
  icon: typeof LayoutDashboard;
  route: Route;
  group?: string;
}

const nav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: { name: 'dashboard' } },
  { label: 'Document Upload', icon: Upload, route: { name: 'upload' } },
  { label: 'AI Extraction', icon: ScanText, route: { name: 'extraction', recordId: DEMO_RECORD_ID } },
  { label: 'Validation Engine', icon: Workflow, route: { name: 'validation', recordId: DEMO_RECORD_ID } },
  { label: 'Validation Result', icon: ShieldCheck, route: { name: 'explainable', recordId: DEMO_RECORD_ID } },
  { label: 'Land Intelligence Map', icon: MapIcon, route: { name: 'map' } },
  { label: 'Record Detail', icon: FileText, route: { name: 'record', recordId: DEMO_RECORD_ID, tab: 'overview' } },
  { label: 'Audit Trail', icon: History, route: { name: 'audit', recordId: DEMO_RECORD_ID } },
];

function routeKey(r: Route): string {
  return r.name;
}

export function AppLayout({ children, title, breadcrumb }: { children: ReactNode; title: string; breadcrumb?: ReactNode }) {
  const { route, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeKey = routeKey(route);

  return (
    <div className="min-h-screen flex bg-sand-100">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-navy-800 text-navy-100 flex flex-col transform transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 flex items-center border-b border-navy-700">
          <Logo light />
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <div className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-wider text-navy-400 font-semibold">
            Officer Workspace
          </div>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeKey === routeKey(item.route);
            return (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.route);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-navy-600 text-white border-l-2 border-saffron-300'
                    : 'text-navy-200 hover:bg-navy-700 hover:text-white'
                }`}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" size={18} />
                <span className="text-left flex-1">{item.label}</span>
                {active && <ChevronRight className="h-4 w-4 text-saffron-300" />}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-navy-700">
          <button
            onClick={() => navigate({ name: 'login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-navy-200 hover:bg-navy-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Switch Role / Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-sand-200 flex items-center px-5 gap-4 sticky top-0 z-20">
          <button
            className="lg:hidden p-2 -ml-2 text-navy-700"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-navy-500 hidden sm:flex items-center gap-1.5">
              {breadcrumb}
            </div>
            <h1 className="font-serif text-lg font-semibold text-navy-800 truncate">{title}</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-sand-50 border border-sand-200 rounded-md w-64">
            <Search className="h-4 w-4 text-navy-400" />
            <input
              placeholder="Search survey no, owner, Land ID…"
              className="bg-transparent text-sm outline-none flex-1 placeholder:text-navy-400"
            />
          </div>
          <button className="relative p-2 text-navy-600 hover:bg-navy-50 rounded-md">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-saffron-400 rounded-full" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-sand-200">
            <div className="h-9 w-9 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-semibold">
              SB
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-medium text-navy-800">S. Bhosale</div>
              <div className="text-xs text-navy-500">Revenue Officer · Haveli</div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-5 lg:p-7 max-w-[1400px] w-full mx-auto">{children}</main>
        <footer className="px-6 py-4 text-xs text-navy-400 border-t border-sand-200 bg-white">
          BhoomiSetu is a prototype for demonstration purposes only. It does not make legal
          ownership decisions and is not affiliated with any government body.
        </footer>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-navy-800">{title}</h2>
        {subtitle && <p className="text-sm text-navy-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
