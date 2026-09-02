import { useState } from 'react';
import { User, Shield, Settings, ChevronRight, MapPin, Lock } from 'lucide-react';
import { useRouter } from '../router';
import { Logo } from '../components/Logo';

const roles = [
  {
    id: 'citizen',
    label: 'Citizen',
    desc: 'View your land records and validation status',
    icon: User,
    note: 'Read-only access to your registered parcels',
  },
  {
    id: 'officer',
    label: 'Government Officer',
    desc: 'Digitize, validate, and review land records',
    icon: Shield,
    note: 'Primary workspace — full validation tools',
    primary: true,
  },
  {
    id: 'admin',
    label: 'Administrator',
    desc: 'Manage users, audit logs, and system config',
    icon: Settings,
    note: 'System administration and oversight',
  },
];

export function LoginScreen() {
  const { navigate } = useRouter();
  const [selected, setSelected] = useState('officer');

  const continueTo = () => navigate({ name: 'dashboard' });

  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel */}
      <div className="hidden lg:flex w-[46%] bg-navy-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 map-grid-bg opacity-30" />
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-navy-600/40 blur-3xl" />
        <div className="absolute right-10 top-10 w-64 h-64 rounded-full bg-forest-500/10 blur-2xl" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo light size="lg" />
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-saffron-300 bg-navy-700/60 px-3 py-1.5 rounded-full border border-navy-600 mb-5">
              <MapPin className="h-3.5 w-3.5" /> Smart India Hackathon Prototype
            </div>
            <h1 className="font-serif text-4xl leading-tight font-semibold mb-4">
              Intelligent Land Record Digitization &amp; Validation
            </h1>
            <p className="text-navy-200 text-[15px] leading-relaxed">
              BhoomiSetu creates a Unified Land ID and cross-validates every parcel across
              sale deeds, land records, mutation history, and GIS data — with AI that assists
              the officer, never replaces the legal decision.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[
                { k: '1,248', v: 'Records' },
                { k: '987', v: 'Verified' },
                { k: '77', v: 'High Priority' },
              ].map((s) => (
                <div key={s.v} className="bg-navy-700/50 border border-navy-600 rounded-md py-3">
                  <div className="font-serif text-2xl font-semibold text-saffron-300">{s.k}</div>
                  <div className="text-xs text-navy-300 mt-0.5">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-navy-400 max-w-md">
            Prototype for demonstration only. No real government APIs, Aadhaar, payments, or
            legal ownership decisions. All data shown is sample data.
          </p>
        </div>
      </div>

      {/* Right: role selection */}
      <div className="flex-1 flex items-center justify-center p-6 bg-sand-100">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="lg" />
          </div>
          <div className="panel rounded-lg p-7">
            <div className="flex items-center gap-2 text-xs text-navy-500 mb-1">
              <Lock className="h-3.5 w-3.5" /> SECURE ACCESS
            </div>
            <h2 className="font-serif text-2xl font-semibold text-navy-800">Select your role</h2>
            <p className="text-sm text-navy-500 mt-1 mb-6">
              Choose a role to continue. No credentials required for this prototype.
            </p>

            <div className="space-y-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const active = selected === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r.id)}
                    className={`w-full text-left flex items-center gap-4 p-4 rounded-md border-2 transition-all ${
                      active
                        ? 'border-navy-600 bg-navy-50 shadow-lift'
                        : 'border-sand-200 bg-white hover:border-navy-200'
                    }`}
                  >
                    <div
                      className={`h-11 w-11 rounded-md flex items-center justify-center shrink-0 ${
                        active ? 'bg-navy-700 text-white' : 'bg-sand-50 text-navy-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-navy-800">{r.label}</span>
                        {r.primary && (
                          <span className="chip bg-saffron-50 text-saffron-700 border border-saffron-200">
                            Main route
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-navy-500 mt-0.5">{r.desc}</div>
                      <div className="text-[11px] text-navy-400 mt-0.5">{r.note}</div>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border-2 shrink-0 ${
                        active ? 'border-navy-600 bg-navy-600' : 'border-navy-200'
                      }`}
                    >
                      {active && <div className="h-1.5 w-1.5 rounded-full bg-white m-auto mt-[3px]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button onClick={continueTo} className="btn-primary w-full mt-6">
              Continue as {roles.find((r) => r.id === selected)?.label}
              <ChevronRight className="h-4 w-4" />
            </button>
            <p className="text-center text-xs text-navy-400 mt-4">
              By continuing you acknowledge this is a simulated environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
