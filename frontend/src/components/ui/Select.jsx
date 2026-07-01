import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-white/20 focus:bg-white/[0.06] hover:border-white/15"
      >
        <span className={selected ? 'text-white' : 'text-white/20'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-white/30 transition-transform shrink-0 ml-2 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                opt.value === value
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              {opt.label}
              {opt.value === value && <Check size={13} className="text-white/50" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
