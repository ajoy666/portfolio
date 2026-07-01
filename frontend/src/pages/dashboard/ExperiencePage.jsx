import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { experienceApi } from '../../api/services';
import RichTextEditor from '../../components/editor/RichTextEditor';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Modal from '../../components/Modal';
import {
  BriefcaseBusiness,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  GripVertical,
  MapPin,
  CalendarDays,
} from 'lucide-react';

const EXP_TYPES = ['Full Time', 'Part Time', 'Freelance', 'Intern', 'Contract'];

const EMPTY_FORM = {
  company: '',
  role: '',
  type: '',
  location: '',
  start_date: '',
  end_date: '',
  description: '',
  is_active: true,
};

function formatDisplay(dateStr) {
  if (!dateStr) return 'Present';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ── Draggable List ────────────────────────────────────────────
function DraggableList({ experiences, onEdit, onDelete, onReorderEnd }) {
  const [items, setItems] = useState(experiences);
  const [dragging, setDragging] = useState(null);
  const dragNode = useRef(null);

  useEffect(() => {
    setItems(experiences);
  }, [experiences]);

  const handleDragStart = (e, idx) => {
    dragNode.current = e.currentTarget;
    setDragging(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, idx) => {
    if (idx === dragging) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragging, 1);
      next.splice(idx, 0, moved);
      setDragging(idx);
      return next;
    });
  };

  const handleDragEnd = () => {
    setDragging(null);
    onReorderEnd(items.map((exp) => exp.id));
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-white/25">Drag to reorder — order reflects in generated CV</p>
      {items.map((exp, idx) => (
        <div
          key={exp.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragEnter={(e) => handleDragEnter(e, idx)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={`transition-all duration-150 ${dragging === idx ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}
        >
          <div
            className={`flex items-start gap-4 rounded-2xl border bg-white/[0.02] px-5 py-4 ${
              exp.is_active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-50'
            }`}
          >
            <div className="cursor-grab active:cursor-grabbing mt-1 shrink-0 text-white/15 hover:text-white/40 transition-colors">
              <GripVertical size={14} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-semibold text-white">{exp.role}</span>
                {exp.type && (
                  <span className="rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/40">
                    {exp.type}
                  </span>
                )}
                {!exp.is_active && (
                  <span className="rounded-md border border-yellow-500/20 bg-yellow-500/5 px-1.5 py-0.5 text-[10px] text-yellow-400/60">
                    Hidden
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-white/50">{exp.company}</p>
              <div className="mt-1.5 flex flex-wrap gap-3">
                <span className="flex items-center gap-1 text-xs text-white/25">
                  <CalendarDays size={10} />
                  {formatDisplay(exp.start_date)} – {formatDisplay(exp.end_date)}
                </span>
                {exp.location && (
                  <span className="flex items-center gap-1 text-xs text-white/25">
                    <MapPin size={10} />
                    {exp.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onEdit(exp)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-white/30 hover:text-white hover:border-white/20 transition-all"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(exp)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/15 text-red-400/40 hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ExperiencePage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['experiences'],
    queryFn: () => experienceApi.list().then((r) => r.data?.data ?? r.data),
  });

  const experiences = data ?? [];

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (exp) => {
    setEditTarget(exp);
    setForm({
      company: exp.company ?? '',
      role: exp.role ?? '',
      type: exp.type ?? '',
      location: exp.location ?? '',
      start_date: exp.start_date ? exp.start_date.slice(0, 10) : '',
      end_date: exp.end_date ? exp.end_date.slice(0, 10) : '',
      description: exp.description ?? '',
      is_active: exp.is_active ?? true,
    });
    setErrors({});
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editTarget ? experienceApi.update(editTarget.id, payload) : experienceApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries(['experiences']);
      setModalOpen(false);
    },
    onError: (err) => {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors) setErrors(serverErrors);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => experienceApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries(['experiences']);
      setDeleteTarget(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (order) => experienceApi.reorder(order),
    onSuccess: () => qc.invalidateQueries(['experiences']),
  });

  const validate = () => {
    const e = {};
    if (!form.company.trim()) e.company = 'Company is required';
    if (!form.role.trim()) e.role = 'Role is required';
    if (!form.start_date) e.start_date = 'Start date is required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) {
      setErrors(e2);
      return;
    }
    setErrors({});
    saveMutation.mutate({ ...form, end_date: form.end_date || null });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={20} className="animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full">
        {/* Page Header */}
        <PageHeader
          icon={BriefcaseBusiness}
          title="Experience"
          description="Manage your work history. Shown in generated CV."
          stats={[{ label: 'Total', value: experiences.length }]}
          action={{ label: 'Add Experience', icon: Plus, onClick: openCreate }}
        />

        {/* Body */}
        <div className="px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-3xl">
            {experiences.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.08] py-16">
                <BriefcaseBusiness size={24} className="text-white/15" />
                <p className="text-sm text-white/25">No experience entries yet.</p>
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-4 py-2 text-sm text-white/40 hover:text-white hover:border-white/20 transition-all"
                >
                  <Plus size={13} /> Add First Entry
                </button>
              </div>
            ) : (
              <DraggableList
                experiences={experiences}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
                onReorderEnd={(orderedIds) => reorderMutation.mutate(orderedIds)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Experience' : 'Add Experience'}
        description="This will be reflected in your generated CV."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Role / Position" required>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="Fullstack Developer"
                className={inputCls}
              />
              {errors.role && <Err msg={errors.role} />}
            </Field>
            <Field label="Type">
              <Select
                value={form.type}
                onChange={(v) => setForm({ ...form, type: v })}
                placeholder="— Select type —"
                options={EXP_TYPES.map((t) => ({ value: t, label: t }))}
              />
              {errors.type && <p className="text-xs text-red-400 mt-1">{errors.type}</p>}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company" required>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="PT. Example Company"
                className={inputCls}
              />
              {errors.company && <Err msg={errors.company} />}
            </Field>
            <Field label="Location">
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Jakarta / Remote"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start Date" required>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputCls}
              />
              {errors.start_date && <Err msg={errors.start_date} />}
            </Field>
            <Field label="End Date">
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputCls}
              />
              {!form.end_date && (
                <p className="mt-1 text-xs text-white/25">Leave empty → shown as "Present"</p>
              )}
            </Field>
          </div>

          <Field label="Description">
            <RichTextEditor
              value={form.description}
              onChange={(val) => setForm({ ...form, description: val })}
              placeholder="Describe your responsibilities and achievements..."
              minHeight={160}
            />
          </Field>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                form.is_active ? 'bg-white/30' : 'bg-white/[0.06]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.is_active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-white/50">
              {form.is_active ? 'Visible in CV' : 'Hidden from CV'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-all"
            >
              {saveMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              {editTarget ? 'Save Changes' : 'Add Experience'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Experience?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-white/70">
              <span className="font-medium text-white">{deleteTarget?.role}</span> at{' '}
              <span className="font-medium text-white">{deleteTarget?.company}</span> will be
              permanently deleted.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50 transition-all"
            >
              {deleteMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]';

function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-white/35">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

function Err({ msg }) {
  return <p className="mt-1 text-xs text-red-400">{msg}</p>;
}
