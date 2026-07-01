import { Loader2 } from 'lucide-react';

const TONE_STYLES = {
  default: {
    border: 'border-white/[0.06]',
    bg: 'bg-white/[0.02]',
    label: 'text-white/25',
    value: 'text-white',
  },
  accent: {
    border: 'border-blue-500/10',
    bg: 'bg-blue-500/[0.04]',
    label: 'text-blue-400/50',
    value: 'text-blue-400',
  },
  success: {
    border: 'border-green-500/10',
    bg: 'bg-green-500/[0.04]',
    label: 'text-green-400/50',
    value: 'text-green-400',
  },
};

export default function PageHeader({ icon: Icon, title, description, stats = [], action }) {
  return (
    <div className="border-b border-white/[0.06] px-4 py-5 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white/70">
            <Icon size={18} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white">{title}</h1>
            <p className="mt-0.5 text-sm text-white/30">{description}</p>
          </div>
        </div>

        {/* Stats + action */}
        <div className="flex flex-wrap items-center gap-2">
          {stats.map((s) => {
            const t = TONE_STYLES[s.tone] ?? TONE_STYLES.default;
            return (
              <div
                key={s.label}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 ${t.border} ${t.bg}`}
              >
                <span className={`text-[10px] font-medium uppercase tracking-wider ${t.label}`}>
                  {s.label}
                </span>
                <span className={`text-sm font-semibold ${t.value}`}>{s.value}</span>
              </div>
            );
          })}

          {action && (
            <button
              onClick={action.onClick}
              disabled={action.disabled}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-white/60 transition-all hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:opacity-40 sm:flex-none"
            >
              {action.loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : action.icon ? (
                <action.icon size={14} />
              ) : null}
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
