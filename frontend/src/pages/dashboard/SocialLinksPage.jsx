import { useState, useEffect } from 'react'  
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageHeader from '../../components/ui/PageHeader';
import { socialApi } from '../../api/services'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  AlertTriangle,
  Globe,
  ExternalLink,
  GripVertical,
  Share2,
} from 'lucide-react'
import { FaGithub, FaLinkedin, FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import Modal from '../../components/Modal'

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PLATFORMS = [
  { value: 'github',    label: 'GitHub',      icon: FaGithub },
  { value: 'linkedin',  label: 'LinkedIn',    icon: FaLinkedin },
  { value: 'twitter',   label: 'Twitter / X', icon: FaXTwitter },
  { value: 'instagram', label: 'Instagram',   icon: FaInstagram },
  { value: 'youtube',   label: 'YouTube',     icon: FaYoutube },
  { value: 'facebook',  label: 'Facebook',    icon: FaFacebook },
  { value: 'website',   label: 'Website',     icon: Globe },
  { value: 'other',     label: 'Other',       icon: ExternalLink },
]

const getPlatformIcon = (platform) => {
  const found = PLATFORMS.find((p) => p.value === platform)
  return found ? found.icon : ExternalLink
}

const defaultForm = { platform: 'github', label: '', url: '', is_active: true }

export default function SocialLinksPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})

  const { data: links, isLoading } = useQuery({
    queryKey: ['socials'],
    queryFn: () => socialApi.list().then((r) => r.data.data ?? r.data),
  })

  const [linkOrder, setLinkOrder] = useState([])

  useEffect(() => {
    if (links) setLinkOrder(links.map((l) => l.id))
  }, [links])

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = linkOrder.indexOf(active.id)
    const newIndex = linkOrder.indexOf(over.id)
    const newOrder = arrayMove(linkOrder, oldIndex, newIndex)
    setLinkOrder(newOrder)
    socialApi.reorder(newOrder)
  }

  const sortedLinks = linkOrder
    .map((id) => links?.find((l) => l.id === id))
    .filter(Boolean)
  const totalLinks = links?.length ?? 0
  const activeLinks = links?.filter((link) => link.is_active).length ?? 0

  const openAdd = () => {
    setEditTarget(null)
    setForm(defaultForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (link) => {
    setEditTarget(link)
    setForm({
      platform: link.platform ?? 'other',
      label: link.label ?? '',
      url: link.url ?? '',
      is_active: link.is_active ?? true,
    })
    setErrors({})
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: (data) => editTarget
      ? socialApi.update(editTarget.id, data)
      : socialApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries(['socials'])
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => socialApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries(['socials'])
      setDeleteTarget(null)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!form.label.trim()) errs.label = 'Label is required'
    if (!form.url.trim()) errs.url = 'URL is required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    saveMutation.mutate(form)
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
          icon={Share2}
          title="Social Links"
          description="Manage your social media and external profile links."
          stats={[
            { label: 'Total', value: totalLinks },
            { label: 'Active', value: activeLinks, tone: 'accent' },
          ]}
          action={{ label: 'Add Link', icon: Plus, onClick: openAdd }}
        />

        {/* Body */}
        <div className="px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-2xl">
            {!links?.length ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-sm text-white/20">No social links yet.</p>
                <button
                  onClick={openAdd}
                  className="text-xs text-white/40 underline hover:text-white/70 transition-colors"
                >
                  Add your first link
                </button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={linkOrder} strategy={verticalListSortingStrategy}>
                  <div className="rounded-2xl border border-white/[0.06] bg-[#111111] divide-y divide-white/[0.04]">
                    {sortedLinks.map((link) => (
                      <SortableLinkRow
                        key={link.id}
                        link={link}
                        openEdit={openEdit}
                        setDeleteTarget={setDeleteTarget}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              // ─────────────────────────────────────────────────────────
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Link' : 'Add Social Link'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform picker */}
          <Field label="Platform" required>
            <div className="grid grid-cols-4 gap-2">
              {PLATFORMS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setForm({
                      ...form,
                      platform: value,
                      label: form.label || label,
                    });
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-[10px] transition-all ${
                    form.platform === value
                      ? 'border-white/20 bg-white/[0.08] text-white'
                      : 'border-white/[0.06] text-white/30 hover:border-white/10 hover:text-white/50'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* Label */}
          <Field label="Label" required>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. GitHub"
              className={inputCls}
            />
            {errors.label && <p className="text-xs text-red-400 mt-1">{errors.label}</p>}
          </Field>

          {/* URL */}
          <Field label="URL" required>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://github.com/username"
              className={inputCls}
            />
            {errors.url && <p className="text-xs text-red-400 mt-1">{errors.url}</p>}
          </Field>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm text-white/70">Visible</p>
              <p className="text-xs text-white/30">Displayed on the landing page</p>
            </div>
            <div
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-white/10'}`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
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
              className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 transition-all"
            >
              {saveMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              {saveMutation.isPending ? 'Saving...' : 'Save Link'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Link?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-white/70">
              Link <span className="font-medium text-white/90">"{deleteTarget?.label}"</span> will
              be permanently deleted.
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

function SortableLinkRow({ link, openEdit, setDeleteTarget }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const Icon = getPlatformIcon(link.platform)

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 px-5 py-3.5">

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-white/15 hover:text-white/40 cursor-grab active:cursor-grabbing shrink-0"
        title="Drag to reorder"
      >
        <GripVertical size={14} />
      </button>

      {/* Platform icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <Icon size={15} className="text-white/50" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/80">{link.label}</p>
        <a
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-white/30 hover:text-white/60 transition-colors truncate block max-w-xs"
        >
          {link.url}
        </a>
      </div>

      {/* Active badge */}
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${link.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/20'}`}>
        {link.is_active ? 'Active' : 'Hidden'}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => openEdit(link)}
          className="rounded-lg border border-white/[0.06] p-1.5 text-white/30 hover:text-white hover:border-white/20 transition-all"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => setDeleteTarget(link)}
          className="rounded-lg border border-red-500/10 p-1.5 text-red-400/30 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          <Trash2 size={13} />
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