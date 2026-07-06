import { useState, useRef, useEffect } from 'react';
import RichTextEditor from '../../components/editor/RichTextEditor';
import Select from '../../components/ui/Select';
import PageHeader from '../../components/ui/PageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, skillApi } from '../../api/services';
import { compressImageFiles } from '../../utils/imageCompression';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
  Globe,
  GitBranch,
  Star,
  X,
  Upload,
  AlertTriangle,
  GripVertical,
  PanelsTopLeft,
} from 'lucide-react';
import Modal from '../../components/Modal';

// ── Carousel ─────────────────────────────────────────────────
function Carousel({ screenshots }) {
  const [idx, setIdx] = useState(0);
  if (!screenshots?.length) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <p className="text-xs text-white/20">No screenshots</p>
      </div>
    );
  }
  const prev = (e) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + screenshots.length) % screenshots.length);
  };
  const next = (e) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % screenshots.length);
  };

  return (
    <div className="relative h-44 overflow-hidden rounded-xl bg-black group">
      <img
        src={screenshots[idx].url}
        alt={screenshots[idx].caption ?? `Screenshot ${idx + 1}`}
        className="h-full w-full object-cover transition-opacity duration-300"
      />
      {screenshots.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-lg bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronLeft size={14} className="text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronRight size={14} className="text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {screenshots.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────
function ProjectCard({ project, onEdit, onDelete, dragHandleProps, order }) {
  const isFeatured = order < 3;

  return (
    <div
      className={`flex flex-col rounded-2xl border overflow-hidden transition-colors ${
        isFeatured ? 'border-amber-500/20' : 'border-white/[0.06]'
      } bg-[#111111]`}
    >
      {/* Featured bar */}
      {isFeatured && (
        <div className="flex items-center gap-1.5 bg-amber-500/10 px-4 py-1.5 border-b border-amber-500/10">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-[10px] font-medium text-amber-400 tracking-wide">
            Featured · #{order + 1}
          </span>
        </div>
      )}

      <Carousel screenshots={project.screenshots} />

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{project.title}</p>
            {project.parent && (
              <span className="inline-flex items-center gap-1 rounded-md border border-sky-500/20 bg-sky-500/[0.06] px-1.5 py-0.5 mt-1 text-[9px] font-medium text-sky-400/80">
                <GitBranch size={9} />
                Part of {project.parent.title}
              </span>
            )}
            <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{project.short_description}</p>
          </div>
          <div className="flex gap-1.5 shrink-0 items-center">
            {/* Order badge for non-featured projects */}
            {!isFeatured && (
              <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/20">
                #{order + 1}
              </span>
            )}
            {/* Drag handle */}
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing rounded p-1 text-white/20 hover:text-white/50 transition-colors"
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                project.status === 'published'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-white/[0.06] text-white/30'
              }`}
            >
              {project.status}
            </span>
          </div>
        </div>

        {project.tech_stack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 5).map((t) => (
              <span
                key={t}
                className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/40"
              >
                {t}
              </span>
            ))}
            {project.tech_stack.length > 5 && (
              <span className="text-[10px] text-white/20">+{project.tech_stack.length - 5}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="flex gap-2">
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg border border-white/[0.06] p-1.5 text-white/30 hover:text-white hover:border-white/20 transition-all"
              >
                <Globe size={13} />
              </a>
            )}
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg border border-white/[0.06] p-1.5 text-white/30 hover:text-white hover:border-white/20 transition-all"
              >
                <GitBranch size={13} />
              </a>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => onEdit(project)}
              className="rounded-lg border border-white/[0.06] p-1.5 text-white/30 hover:text-white hover:border-white/20 transition-all"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(project)}
              className="rounded-lg border border-red-500/10 p-1.5 text-red-400/40 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Screenshot Upload Area ────────────────────────────────────
function ScreenshotUploadArea({
  screenshots,
  uploadedFiles,
  onFilesAdd,
  onFileRemove,
  onDeleteExisting,
  onSetThumbnail,
  isUploading,
}) {
  const [isCompressing, setIsCompressing] = useState(false);

  const handleDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;

    setIsCompressing(true);
    const compressed = await compressImageFiles(files);
    setIsCompressing(false);

    onFilesAdd(compressed);
  };

  const handleInput = async (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    if (!files.length) return;

    setIsCompressing(true);
    const compressed = await compressImageFiles(files);
    setIsCompressing(false);

    onFilesAdd(compressed);
  };

  return (
    <div className="space-y-3">
      {screenshots?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {screenshots.map((ss) => (
            <div
              key={ss.id}
              className="relative group h-20 w-28 overflow-hidden rounded-lg border border-white/[0.08]"
            >
              <img src={ss.url} alt="" className="h-full w-full object-cover" />
              {ss.is_thumbnail && (
                <span className="absolute top-1 left-1 rounded bg-amber-500/80 px-1 text-[9px] font-bold text-black">
                  THUMB
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {!ss.is_thumbnail && (
                  <button
                    type="button"
                    onClick={() => onSetThumbnail(ss.id)}
                    title="Set as thumbnail"
                    className="rounded p-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400"
                  >
                    <Star size={11} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteExisting(ss.id)}
                  className="rounded p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadedFiles?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedFiles.map((f, i) => (
            <div
              key={i}
              className="relative group h-20 w-28 overflow-hidden rounded-lg border border-white/[0.08] border-dashed"
            >
              <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
              <span className="absolute top-1 left-1 rounded bg-blue-500/80 px-1 text-[9px] font-bold text-white">
                NEW
              </span>
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => onFileRemove(i)}
                  className="rounded p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <label
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] py-5 text-sm text-white/30 transition-all hover:border-white/20 hover:bg-white/[0.04]"
      >
        {isCompressing || isUploading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Upload size={15} />
        )}
        <span>
          {isCompressing
            ? 'Compressing...'
            : isUploading
              ? 'Uploading...'
              : 'Drop images or click to upload'}
        </span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={handleInput} />
      </label>
    </div>
  );
}

// ── Tech Stack Autocomplete Input ─────────────────────────────
function TechStackInput({ value, onChange, allSkillNames }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      setActiveIdx(-1);
      return;
    }
    const q = input.toLowerCase();
    const filtered = allSkillNames.filter(
      (name) => name.toLowerCase().includes(q) && !value.includes(name)
    );
    setSuggestions(filtered.slice(0, 6));
    setActiveIdx(-1);
  }, [input, allSkillNames, value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!dropdownRef.current?.contains(e.target) && e.target !== inputRef.current) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
    setSuggestions([]);
    setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const chosen = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
        if (chosen) addTag(chosen);
        return;
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        setActiveIdx(-1);
        return;
      }
    } else {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (input.trim()) addTag(input);
        return;
      }
    }
    if (e.key === 'Backspace' && !input && value.length > 0) onChange(value.slice(0, -1));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-xs text-white/60"
            >
              {t}
              <button
                type="button"
                onClick={() => remove(t)}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search skills, Tab or Enter to add…"
          className={inputCls}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full rounded-xl border border-white/[0.08] bg-[#1a1a1a] py-1 shadow-xl"
          >
            {suggestions.map((name, i) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(name);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  i === activeIdx
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/50 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-white/20">
        Press Tab or Enter to add · Backspace to remove the last item · Custom input is allowed
      </p>
    </div>
  );
}

// ── Drag-to-Reorder Grid ──────────────────────────────────────
function DraggableGrid({ projects, onEdit, onDelete, onReorderEnd }) {
  const [items, setItems] = useState(projects);
  const [dragging, setDragging] = useState(null);
  const dragNode = useRef(null);

  useEffect(() => {
    setItems(projects);
  }, [projects]);

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
    onReorderEnd(items.map((p) => p.id));
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-3 text-[11px] text-white/30">
        <span className="flex items-center gap-1.5">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          Top 3 automatically become Featured
        </span>
        <span className="text-white/10">·</span>
        <span>Drag for reorder</span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((p, idx) => (
          <div
            key={p.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnter={(e) => handleDragEnter(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`transition-opacity duration-150 ${dragging === idx ? 'opacity-40 scale-95' : 'opacity-100'}`}
          >
            <ProjectCard
              project={p}
              order={idx}
              onEdit={onEdit}
              onDelete={onDelete}
              dragHandleProps={{}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Parse BE validation errors (Laravel 422) ─────────────────
function parseBeErrors(errorsObj) {
  const parsed = {};
  let screenshotCount = 0;
  Object.entries(errorsObj).forEach(([key, messages]) => {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (key.startsWith('screenshots')) {
      screenshotCount++;
    } else if (key.startsWith('tech_stack')) {
      if (!parsed.tech_stack) parsed.tech_stack = first;
    } else {
      parsed[key] = first;
    }
  });
  if (screenshotCount > 0) {
    parsed.screenshots = `${screenshotCount} file/files rejected — only JPG, JPEG, PNG, and WEBP files are allowed. SVG is not supported.`;
  }
  return parsed;
}

// ── Default form ──────────────────────────────────────────────
const defaultForm = {
  title: '',
  short_description: '',
  description: '',
  tech_stack: [],
  demo_url: '',
  repo_url: '',
  status: 'draft',
  parent_id: '',
};

// ── Main Page ─────────────────────────────────────────────────
export default function ProjectsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [newScreenshots, setNewScreenshots] = useState([]);
  const [screenshotWarning, setScreenshotWarning] = useState(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.list().then((r) => r.data.data),
  });

  const { data: skillCategories } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillApi.list().then((r) => r.data.data),
  });

  const allSkillNames = skillCategories
    ? skillCategories.flatMap((cat) => cat.skills?.map((s) => s.name) ?? [])
    : [];

  const totalProjects = projects?.length ?? 0;
  const publishedProjects =
    projects?.filter((project) => project.status === 'published').length ?? 0;

  const openCreate = () => {
    setEditTarget(null);
    setForm(defaultForm);
    setNewScreenshots([]);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditTarget(project);
    setForm({
      title: project.title ?? '',
      short_description: project.short_description ?? '',
      description: project.description ?? '',
      tech_stack: project.tech_stack ?? [],
      demo_url: project.demo_url ?? '',
      repo_url: project.repo_url ?? '',
      status: project.status ?? 'draft',
      parent_id: project.parent_id ? String(project.parent_id) : '',
    });
    setNewScreenshots([]);
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setNewScreenshots([]);
    setErrors({});
  };

  // Dismiss toast warning
  const dismissWarning = () => setScreenshotWarning(null);

  // ── Mutations ───────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (fd) => {
      let projectId = editTarget?.id ?? null;

      if (editTarget) {
        await projectApi.update(editTarget.id, fd);
      } else {
        const res = await projectApi.create(fd);
        projectId = res.data.data?.id ?? res.data.id;
      }

      if (newScreenshots.length > 0) {
        try {
          await projectApi.uploadScreenshots(projectId, newScreenshots);
        } catch (ssErr) {
          const data = ssErr?.response?.data;
          const parsed = data?.errors ? parseBeErrors(data.errors) : null;
          const msg =
            parsed?.screenshots ??
            data?.message ??
            'Some screenshots failed to upload. Please try uploading them again from the edit form.';
          const err = new Error('screenshot_warning');
          err.warningMessage = msg;
          err.projectSaved = true;
          throw err;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      closeModal();
    },
    onError: (err) => {
      qc.invalidateQueries(['projects']);
      if (err.projectSaved) {
        closeModal();
        setScreenshotWarning(err.warningMessage);
        return;
      }
      const data = err?.response?.data;
      if (data?.errors) {
        setErrors(parseBeErrors(data.errors));
      } else {
        setErrors({ _global: data?.message ?? 'Something went wrong. Please try again.' });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries(['projects']);
      setDeleteTarget(null);
    },
  });

  const deleteScreenshotMutation = useMutation({
    mutationFn: (id) => projectApi.deleteScreenshot(id),
    onSuccess: () => qc.invalidateQueries(['projects']),
  });

  const setThumbnailMutation = useMutation({
    mutationFn: (id) => projectApi.setThumbnail(id),
    onSuccess: () => qc.invalidateQueries(['projects']),
  });

  const reorderMutation = useMutation({
    mutationFn: (order) => projectApi.reorder(order),
    onSuccess: () => qc.invalidateQueries(['projects']),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.short_description.trim()) errs.short_description = 'Short description is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    saveMutation.mutate(form);
  };

  return (
    <>
      <div className="min-h-full">
        {/* Page Header */}
        <PageHeader
          icon={PanelsTopLeft}
          title="Projects"
          description="Manage and organize your portfolio projects."
          stats={[
            { label: 'Total', value: totalProjects },
            { label: 'Published', value: publishedProjects, tone: 'accent' },
          ]}
          action={{ label: 'Add Project', icon: Plus, onClick: openCreate }}
        />

        {/* Screenshot warning toast */}
        {screenshotWarning && (
          <div className="mx-6 mt-4 lg:mx-10 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-amber-400">
                Project saved, but screenshot failed to upload.
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">{screenshotWarning}</p>
            </div>
            <button
              onClick={dismissWarning}
              className="text-amber-400/50 hover:text-amber-400 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-8 lg:px-10">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 size={20} className="animate-spin text-white/30" />
            </div>
          ) : projects?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <p className="text-sm text-white/20">No projects yet.</p>
              <button
                onClick={openCreate}
                className="text-xs text-white/40 underline hover:text-white/70 transition-colors"
              >
                Add your first project
              </button>
            </div>
          ) : (
            <DraggableGrid
              projects={projects ?? []}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onReorderEnd={(orderedIds) => reorderMutation.mutate(orderedIds)}
            />
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Edit Project' : 'Add Project'}
        description={editTarget ? `Editing "${editTarget.title}"` : 'Fill in your project details.'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Title" required>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="My Awesome Project"
              className={inputCls}
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </Field>
          <Field label="Short Description" required>
            <input
              type="text"
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              placeholder="One-liner shown on project card"
              className={inputCls}
            />
            {errors.short_description && (
              <p className="text-xs text-red-400 mt-1">{errors.short_description}</p>
            )}
          </Field>
          <Field label="Full Description">
            <RichTextEditor
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              error={errors.description}
            />
            {errors.description && (
              <p className="text-xs text-red-400 mt-1">{errors.description}</p>
            )}
          </Field>
          <Field label="Tech Stack">
            <TechStackInput
              value={form.tech_stack}
              onChange={(v) => setForm({ ...form, tech_stack: v })}
              allSkillNames={allSkillNames}
            />
            {errors.tech_stack && <p className="text-xs text-red-400 mt-1">{errors.tech_stack}</p>}
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Demo URL">
              <input
                type="url"
                value={form.demo_url}
                onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
                placeholder="https://demo.example.com"
                className={inputCls}
              />
              {errors.demo_url && <p className="text-xs text-red-400 mt-1">{errors.demo_url}</p>}
            </Field>
            <Field label="Repo URL">
              <input
                type="url"
                value={form.repo_url}
                onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
                placeholder="https://github.com/..."
                className={inputCls}
              />
              {errors.repo_url && <p className="text-xs text-red-400 mt-1">{errors.repo_url}</p>}
            </Field>
          </div>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
            />
          </Field>

          <Field label="Parent Project">
            <Select
              value={form.parent_id}
              onChange={(v) => setForm({ ...form, parent_id: v })}
              placeholder="None — this is a standalone project"
              options={[
                { value: '', label: 'None — this is a standalone project' },
                ...(projects ?? [])
                  .filter((p) => p.id !== editTarget?.id)
                  .map((p) => ({ value: String(p.id), label: p.title })),
              ]}
            />
            <p className="text-[10px] text-white/20 mt-1">
              Pick a parent if this project is a sub-app/child of another project.
            </p>
            {errors.parent_id && <p className="text-xs text-red-400 mt-1">{errors.parent_id}</p>}
          </Field>
          <Field label="Screenshots">
            {errors.screenshots && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-400">{errors.screenshots}</p>
              </div>
            )}
            <ScreenshotUploadArea
              screenshots={
                editTarget ? (projects?.find((p) => p.id === editTarget.id)?.screenshots ?? []) : []
              }
              uploadedFiles={newScreenshots}
              onFilesAdd={(files) => setNewScreenshots((prev) => [...prev, ...files])}
              onFileRemove={(i) => setNewScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
              onDeleteExisting={(id) => deleteScreenshotMutation.mutate(id)}
              onSetThumbnail={(id) => setThumbnailMutation.mutate(id)}
              isUploading={saveMutation.isPending}
            />
          </Field>
          {errors._global && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
              <AlertTriangle size={13} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400">{errors._global}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {saveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {saveMutation.isPending ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ──────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Project?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-white/70">
              Project <span className="font-medium text-white/90">"{deleteTarget?.title}"</span> and
              all of its screenshots will be permanently deleted.
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
              {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
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
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
