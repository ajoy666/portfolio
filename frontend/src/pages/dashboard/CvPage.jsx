import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/ui/PageHeader';
import { cvApi } from '../../api/services';
import {
  FileText,
  RefreshCw,
  Download,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ScrollText,
} from 'lucide-react';

export default function CvPage() {
  const qc = useQueryClient();
  const [justGenerated, setJustGenerated] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['cv-status'],
    queryFn: () => cvApi.getStatus().then((r) => r.data),
    refetchInterval: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => cvApi.generate(),
    onSuccess: () => {
      qc.invalidateQueries(['cv-status']);
      setJustGenerated(true);
      setTimeout(() => setJustGenerated(false), 3000);
    },
  });

  const hasCv = status?.exists;
  const meta = status?.meta;

  const formattedDate = meta?.generated_at
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(meta.generated_at))
    : null;

  const formattedSize = meta?.size ? `${(meta.size / 1024).toFixed(1)} KB` : null;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={20} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <PageHeader
        icon={ScrollText}
        title="CV Generator"
        description="Generate your CV as PDF from portfolio data."
        stats={[
          {
            label: 'Status',
            value: hasCv ? 'Ready' : 'Not Generated',
            tone: hasCv ? 'success' : 'default',
          },
        ]}
        action={{
          label: generateMutation.isPending ? 'Generating...' : 'Regenerate CV',
          icon: RefreshCw,
          onClick: () => generateMutation.mutate(),
          disabled: generateMutation.isPending,
          loading: generateMutation.isPending,
        }}
      />

      {/* Body */}
      <div className="px-6 py-8 lg:px-10">
        <div className="mx-auto w-full max-w-2xl space-y-4">
          {/* Success Banner */}
          {justGenerated && (
            <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
              <CheckCircle2 size={15} className="text-green-400 shrink-0" />
              <p className="text-sm text-green-300">
                CV generated successfully and ready to download.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {generateMutation.isError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-300">
                {generateMutation.error?.response?.data?.message ||
                  'Generation failed. Check server logs.'}
              </p>
            </div>
          )}

          {/* CV Card */}
          {hasCv ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              {/* Card header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.05]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                  <FileText size={18} className="text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80">Azi_Fauzi_CV.pdf</p>
                  {formattedDate && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} className="text-white/25" />
                      <p className="text-xs text-white/30">
                        Generated {formattedDate}
                        {formattedSize && ` · ${formattedSize}`}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/cv/preview`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition-all"
                  >
                    <Eye size={12} />
                    Preview
                  </a>
                  <a
                    href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'}/cv/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/[0.06] px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
                  >
                    <Download size={12} />
                    Download
                  </a>
                </div>
              </div>

              {/* Info section */}
              <div className="px-5 py-4">
                <p className="text-xs text-white/25 leading-relaxed">
                  This CV is auto-generated from your portfolio data — profile, skills, and
                  projects. It re-generates automatically whenever you save changes in the admin
                  panel. You can also trigger a manual regeneration from the button above.
                </p>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                <FileText size={20} className="text-white/20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/40">No CV generated yet</p>
                <p className="mt-1 text-xs text-white/20">
                  Click "Regenerate CV" to generate your CV from current portfolio data.
                </p>
              </div>
              <button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-2.5 text-sm text-white/50 hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
              >
                {generateMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {generateMutation.isPending ? 'Generating...' : 'Generate Now'}
              </button>
            </div>
          )}

          {/* Info card: what data is used */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-white/20 mb-3">
              Data sources used in CV
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {['Profile & Bio', 'Skills', 'Projects', 'Social Links'].map((src) => (
                <div
                  key={src}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400/60 shrink-0" />
                  <span className="text-xs text-white/35">{src}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
