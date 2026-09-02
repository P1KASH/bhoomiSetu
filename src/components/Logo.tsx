import { Layers, ShieldCheck } from 'lucide-react';

export function Logo({ size = 'md', light = false }: { size?: 'sm' | 'md' | 'lg'; light?: boolean }) {
  const dims = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const title =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-lg';
  const sub = size === 'lg' ? 'text-sm' : 'text-xs';
  const titleColor = light ? 'text-white' : 'text-navy-800';
  const subColor = light ? 'text-navy-200' : 'text-navy-500';
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${dims} rounded-md bg-navy-700 flex items-center justify-center shadow-lift`}
        aria-hidden
      >
        <div className="relative">
          <Layers className="h-5 w-5 text-saffron-300" />
          <ShieldCheck className="h-3 w-3 text-white absolute -bottom-1 -right-1" />
        </div>
      </div>
      <div className="leading-tight">
        <div className={`font-serif font-semibold ${title} ${titleColor}`}>BhoomiSetu</div>
        <div className={`${sub} ${subColor} tracking-wide uppercase`}>
          Land Record Validation
        </div>
      </div>
    </div>
  );
}
