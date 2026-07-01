import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Select from '../../components/ui/Select';
import PageHeader from '../../components/ui/PageHeader';
import { skillApi } from '../../api/services'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  AlertTriangle,
  FolderPlus,
  Upload,
  GripVertical,
  Layers3,
} from 'lucide-react'
import Modal from '../../components/Modal'

// ── DnD imports ──────────────────────────────────────────────
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']
const LEVEL_COLOR = {
  beginner: 'bg-white/10 text-white/30',
  intermediate: 'bg-blue-500/10 text-blue-400',
  advanced: 'bg-violet-500/10 text-violet-400',
  expert: 'bg-amber-500/10 text-amber-400',
}

const defaultSkillForm = { skill_category_id: '', name: '', icon: '', level: 'intermediate', is_active: true }
const defaultCatForm = { name: '' }

export default function SkillsPage() {
  const qc = useQueryClient()

  // ── Modal states ────────────────────────────────────────────
  const [skillModal, setSkillModal] = useState(false)
  const [catModal, setCatModal] = useState(false)
  const [deleteSkillTarget, setDeleteSkillTarget] = useState(null)
  const [deleteCatTarget, setDeleteCatTarget] = useState(null)

  const [editSkill, setEditSkill] = useState(null)
  const [editCat, setEditCat] = useState(null)
  const [skillForm, setSkillForm] = useState(defaultSkillForm)
  const [catForm, setCatForm] = useState(defaultCatForm)
  const [errors, setErrors] = useState({})

  // ── Query ───────────────────────────────────────────────────
  const { data: categories, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillApi.list().then((r) => r.data.data ?? r.data),
  })

  // ── DnD state ───────────────────────────────────────────────
  // [BARU] State untuk nyimpen urutan category id
  const [catOrder, setCatOrder] = useState([])

  // [BARU] Sync catOrder setiap kali data dari API masuk/berubah
  useEffect(() => {
    if (categories) setCatOrder(categories.map((c) => c.id))
  }, [categories])

  // [BARU] Setup sensor DnD (PointerSensor = support mouse & touch)
  const sensors = useSensors(useSensor(PointerSensor))

  // [BARU] Handler ketika drag selesai
  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = catOrder.indexOf(active.id)
    const newIndex = catOrder.indexOf(over.id)
    const newOrder = arrayMove(catOrder, oldIndex, newIndex)
    setCatOrder(newOrder)
    skillApi.reorderCategories(newOrder) // kirim ke BE
  }

  // [BARU] Categories diurutkan berdasarkan catOrder (bukan urutan dari API)
  const sortedCategories = catOrder
    .map((id) => categories?.find((c) => c.id === id))
    .filter(Boolean)

  const totalSkills = categories?.reduce(
    (total, category) => total + (category.skills?.length ?? 0),
    0
  ) ?? 0

  // ── Open helpers ────────────────────────────────────────────
  const openAddSkill = (categoryId) => {
    setEditSkill(null)
    setSkillForm({ ...defaultSkillForm, skill_category_id: String(categoryId) })
    setErrors({})
    setSkillModal(true)
  }

  const openEditSkill = (skill) => {
    setEditSkill(skill);
    setSkillForm({
      skill_category_id: String(skill.skill_category_id ?? skill.category_id ?? ''),
      name: skill.name ?? '',
      icon: skill.icon ?? '',
      level: skill.level ?? 'intermediate',
      is_active: skill.is_active ?? true,
    });
    setErrors({});
    setSkillModal(true);
  };

  const openAddCat = () => {
    setEditCat(null)
    setCatForm(defaultCatForm)
    setErrors({})
    setCatModal(true)
  }

  const openEditCat = (cat) => {
    setEditCat(cat)
    setCatForm({ name: cat.name ?? '' })
    setErrors({})
    setCatModal(true)
  }

  // ── Mutations ───────────────────────────────────────────────
  const skillSaveMutation = useMutation({
    mutationFn: (data) => (editSkill ? skillApi.update(editSkill.id, data) : skillApi.create(data)),
    onSuccess: () => {
      qc.invalidateQueries(['skills']);
      setSkillModal(false);
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (apiErrors) {
        setErrors(
          Object.fromEntries(
            Object.entries(apiErrors).map(([key, value]) => [
              key,
              Array.isArray(value) ? value[0] : value,
            ])
          )
        );
      }
    },
  });

  const skillDeleteMutation = useMutation({
    mutationFn: (id) => skillApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries(['skills'])
      setDeleteSkillTarget(null)
    },
  })

  const catSaveMutation = useMutation({
    mutationFn: (data) => editCat
      ? skillApi.updateCategory(editCat.id, data)
      : skillApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries(['skills'])
      setCatModal(false)
    },
  })

  const catDeleteMutation = useMutation({
    mutationFn: (id) => skillApi.destroyCategory(id),
    onSuccess: () => {
      qc.invalidateQueries(['skills'])
      setDeleteCatTarget(null)
    },
  })

  // ── Submit handlers ─────────────────────────────────────────
  const handleSkillSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!skillForm.name.trim()) errs.name = 'Name is required'
    if (!skillForm.skill_category_id) errs.skill_category_id = 'Category is required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const fd = new FormData()
    fd.append('skill_category_id', skillForm.skill_category_id)
    fd.append('name', skillForm.name)
    fd.append('level', skillForm.level)
    fd.append('is_active', skillForm.is_active ? '1' : '0')
    if (skillForm.iconFile instanceof File) fd.append('icon', skillForm.iconFile)
    if (editSkill) fd.append('_method', 'PUT')

    skillSaveMutation.mutate(fd)
  }

  const handleCatSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!catForm.name.trim()) errs.name = 'Category name is required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    catSaveMutation.mutate(catForm)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={20} className="animate-spin text-white/30" />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-full">
        {/* Page Header */}
        <PageHeader
          icon={Layers3}
          title="Skills"
          description="Manage your skills grouped by category."
          stats={[
            { label: 'Categories', value: categories?.length ?? 0 },
            { label: 'Skills', value: totalSkills, tone: 'accent' },
          ]}
          action={{ label: 'Add Category', icon: FolderPlus, onClick: openAddCat }}
        />

        {/* Body */}
        <div className="px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {!categories?.length ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-sm text-white/20">No categories yet.</p>
                <button
                  onClick={openAddCat}
                  className="text-xs text-white/40 underline hover:text-white/70 transition-colors"
                >
                  Add your first category
                </button>
              </div>
            ) : (
              // ─────────────────────────────────────────────────────────
              // [BERUBAH] Bagian ini dulu categories.map(...) biasa
              // Sekarang dibungkus DndContext + SortableContext
              // dan pakai sortedCategories (bukan categories langsung)
              // ─────────────────────────────────────────────────────────
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={catOrder} strategy={verticalListSortingStrategy}>
                  {sortedCategories.map((cat) => (
                    <SortableCategoryCard
                      key={cat.id}
                      cat={cat}
                      openAddSkill={openAddSkill}
                      openEditCat={openEditCat}
                      setDeleteCatTarget={setDeleteCatTarget}
                      openEditSkill={openEditSkill}
                      setDeleteSkillTarget={setDeleteSkillTarget}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              // ─────────────────────────────────────────────────────────
            )}
          </div>
        </div>
      </div>

      {/* ── Skill Modal ───────────────────────────────── */}
      <Modal
        open={skillModal}
        onClose={() => setSkillModal(false)}
        title={editSkill ? 'Edit Skill' : 'Add Skill'}
        size="md"
      >
        <form onSubmit={handleSkillSubmit} className="space-y-4">
          {/* Category */}
          <Field label="Category" required>
            <Select
              value={skillForm.skill_category_id}
              onChange={(v) => setSkillForm({ ...skillForm, skill_category_id: v })}
              placeholder="Select category"
              options={(categories ?? []).map((c) => ({ value: String(c.id), label: c.name }))}
            />
            {errors.skill_category_id && (
              <p className="text-xs text-red-400 mt-1">{errors.skill_category_id}</p>
            )}
          </Field>

          {/* Name */}
          <Field label="Skill Name" required>
            <input
              type="text"
              value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              placeholder="e.g. Laravel"
              className={inputCls}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </Field>

          {/* Icon */}
          <Field label="Icon">
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.04] flex items-center justify-center overflow-hidden">
                {skillForm.iconPreview || (editSkill && editSkill.icon_url) ? (
                  <img
                    src={skillForm.iconPreview ?? editSkill.icon_url}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-white/20 text-xs">No icon</span>
                )}
              </div>
              <label className="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/[0.10] bg-white/[0.02] py-3 text-xs text-white/30 hover:border-white/20 hover:text-white/50 transition-all">
                <Upload size={13} />
                Upload icon (PNG, WEBP, SVG)
                <input
                  type="file"
                  accept="image/png,image/webp,image/svg+xml,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setSkillForm({
                      ...skillForm,
                      iconFile: file,
                      iconPreview: URL.createObjectURL(file),
                    });
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </Field>

          {/* Level */}
          <Field label="Level">
            <div className="flex gap-2 flex-wrap">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSkillForm({ ...skillForm, level: l })}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                    skillForm.level === l
                      ? 'border-white/20 bg-white/10 text-white'
                      : 'border-white/[0.06] text-white/30 hover:border-white/10 hover:text-white/50'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm text-white/70">Active</p>
              <p className="text-xs text-white/30">Displayed on the landing page</p>
            </div>
            <div
              onClick={() => setSkillForm({ ...skillForm, is_active: !skillForm.is_active })}
              className={`flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${skillForm.is_active ? 'bg-emerald-500' : 'bg-white/10'}`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${skillForm.is_active ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setSkillModal(false)}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={skillSaveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {skillSaveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {skillSaveMutation.isPending ? 'Saving...' : 'Save Skill'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Category Modal ────────────────────────────── */}
      <Modal
        open={catModal}
        onClose={() => setCatModal(false)}
        title={editCat ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <form onSubmit={handleCatSubmit} className="space-y-4">
          <Field label="Category Name" required>
            <input
              type="text"
              value={catForm.name}
              onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="e.g. Frontend, Backend, Tools"
              className={inputCls}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setCatModal(false)}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={catSaveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {catSaveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {catSaveMutation.isPending ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Skill Confirm ──────────────────────── */}
      <Modal
        open={!!deleteSkillTarget}
        onClose={() => setDeleteSkillTarget(null)}
        title="Delete Skill?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-white/70">
              Skill <span className="font-medium text-white/90">"{deleteSkillTarget?.name}"</span>{' '}
              will be permanently deleted.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteSkillTarget(null)}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => skillDeleteMutation.mutate(deleteSkillTarget.id)}
              disabled={skillDeleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50 transition-all"
            >
              {skillDeleteMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : null}
              {skillDeleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Category Confirm ───────────────────── */}
      <Modal
        open={!!deleteCatTarget}
        onClose={() => setDeleteCatTarget(null)}
        title="Delete Category?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-white/70">
                Category{' '}
                <span className="font-medium text-white/90">"{deleteCatTarget?.name}"</span> will be
                deleted.
              </p>
              {deleteCatTarget?.skills?.length > 0 && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠ All {deleteCatTarget.skills.length} skills inside this category will also be
                  deleted.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteCatTarget(null)}
              className="rounded-lg px-4 py-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => catDeleteMutation.mutate(deleteCatTarget.id)}
              disabled={catDeleteMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50 transition-all"
            >
              {catDeleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : null}
              {catDeleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// SortableCategoryCard — card category + skill reorder di dalamnya
// ─────────────────────────────────────────────────────────────
function SortableCategoryCard({ cat, openAddSkill, openEditCat, setDeleteCatTarget, openEditSkill, setDeleteSkillTarget }) {
  // DnD untuk category card itu sendiri
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  // ── [BARU] State urutan skills di dalam category ini ────────
  const [skillOrder, setSkillOrder] = useState(() => cat.skills?.map((s) => s.id) ?? [])

  // [BARU] Sync kalau data dari API berubah (misal setelah add/delete skill)
  useEffect(() => {
    setSkillOrder(cat.skills?.map((s) => s.id) ?? [])
  }, [cat.skills])

  const skillSensors = useSensors(useSensor(PointerSensor))

  // [BARU] Handler drag skill selesai
  const handleSkillDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = skillOrder.indexOf(active.id)
    const newIndex = skillOrder.indexOf(over.id)
    const newOrder = arrayMove(skillOrder, oldIndex, newIndex)
    setSkillOrder(newOrder)
    skillApi.reorderSkills(newOrder) // kirim ke BE
  }

  // [BARU] Skills diurutkan berdasarkan skillOrder
  const sortedSkills = skillOrder
    .map((id) => cat.skills?.find((s) => s.id === id))
    .filter(Boolean)

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">

      {/* Drag Handle category */}
      <button
        {...attributes}
        {...listeners}
        className="mt-[14px] text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing p-1 shrink-0"
        title="Drag to reorder category"
      >
        <GripVertical size={14} />
      </button>

      <div className="flex-1 rounded-2xl border border-white/[0.06] bg-[#111111] overflow-hidden">

        {/* Category Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-semibold text-white">{cat.name}</p>
            <span className="text-xs text-white/20">{cat.skills?.length ?? 0} skills</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openAddSkill(cat.id)}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              <Plus size={11} /> Add Skill
            </button>
            <button
              onClick={() => openEditCat(cat)}
              className="rounded-lg border border-white/[0.06] p-1.5 text-white/30 hover:text-white hover:border-white/20 transition-all"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => setDeleteCatTarget(cat)}
              className="rounded-lg border border-red-500/10 p-1.5 text-red-400/30 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Skills List */}
        {cat.skills?.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-xs text-white/20">No skills in this category.</p>
          </div>
        ) : (
          // ── [BERUBAH] Dibungkus DndContext + SortableContext ──
          <DndContext sensors={skillSensors} collisionDetection={closestCenter} onDragEnd={handleSkillDragEnd}>
            <SortableContext items={skillOrder} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-white/[0.03]">
                {sortedSkills.map((skill) => (
                  <SortableSkillRow
                    key={skill.id}
                    skill={skill}
                    openEditSkill={openEditSkill}
                    setDeleteSkillTarget={setDeleteSkillTarget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          // ─────────────────────────────────────────────────────
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// [BARU] SortableSkillRow — satu baris skill yang bisa di-drag
// ─────────────────────────────────────────────────────────────
function SortableSkillRow({ skill, openEditSkill, setDeleteSkillTarget }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: skill.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 px-5 py-3">

      {/* Drag handle skill */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing shrink-0"
        title="Drag to reorder skill"
      >
        <GripVertical size={12} />
      </button>

      {/* Icon */}
      <div className="h-8 w-8 shrink-0 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden">
        {skill.icon_url
          ? <img src={skill.icon_url} alt={skill.name} className="h-6 w-6 object-contain" />
          : <span className="text-white/20 text-xs font-bold">{skill.name[0]}</span>
        }
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 font-medium">{skill.name}</p>
      </div>

      {/* Level */}
      <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium capitalize ${LEVEL_COLOR[skill.level]}`}>
        {skill.level}
      </span>

      {/* Active indicator */}
      <div className={`h-1.5 w-1.5 rounded-full ${skill.is_active ? 'bg-emerald-400' : 'bg-white/10'}`} title={skill.is_active ? 'Active' : 'Inactive'} />

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => openEditSkill(skill)}
          className="rounded-lg border border-white/[0.06] p-1.5 text-white/30 hover:text-white hover:border-white/20 transition-all">
          <Pencil size={12} />
        </button>
        <button onClick={() => setDeleteSkillTarget(skill)}
          className="rounded-lg border border-red-500/10 p-1.5 text-red-400/30 hover:text-red-400 hover:border-red-500/30 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
const inputCls = 'w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-white/20 focus:bg-white/[0.06]'

function Field({ label, children, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-white/35">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}