import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  Trash2,
  AlertTriangle,
  Mail,
  MailOpen,
  CheckCheck,
  Clock,
  Inbox,
  Search,
  User,
  CalendarDays,
  Square,
  CheckSquare,
} from 'lucide-react'
import PageHeader from '../../components/ui/PageHeader';
import { contactApi } from '../../api/services'
import Modal from '../../components/Modal'

const STATUS_CONFIG = {
  unread: {
    label: 'Unread',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    icon: Mail,
  },
  read: {
    label: 'Read',
    color: 'bg-white/[0.04] text-white/35 border-white/[0.06]',
    dot: 'bg-white/20',
    icon: MailOpen,
  },
  replied: {
    label: 'Replied',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
    icon: CheckCheck,
  },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
  { key: 'replied', label: 'Replied' },
]

function timeAgo(dateStr) {
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)

  if (Number.isNaN(diff)) return '-'
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`

  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitial(name = '?') {
  return name?.trim()?.[0]?.toUpperCase() || '?'
}

function getSnippet(contact) {
  return contact.subject || contact.message || 'No subject'
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.read
  const Icon = cfg.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.color}`}
    >
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

export default function ContactsPage() {
  const qc = useQueryClient()

  const [selected, setSelected] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [skipAutoReadOnce, setSkipAutoReadOnce] = useState(false)

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactApi.list().then((r) => r.data.data ?? r.data),
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['contact', selected?.id],
    queryFn: () => contactApi.show(selected.id).then((r) => r.data.data ?? r.data),
    enabled: !!selected,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => contactApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries(['contacts'])

      if (selected?.id) {
        qc.invalidateQueries(['contact', selected.id])
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => contactApi.destroy(id),
    onSuccess: () => {
      qc.invalidateQueries(['contacts'])
      setDeleteTarget(null)

      if (selected?.id === deleteTarget?.id) {
        setSelected(null)
      }
    },
  })

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }) => {
      await Promise.all(ids.map((id) => contactApi.updateStatus(id, status)))
    },
    onSuccess: () => {
      qc.invalidateQueries(['contacts'])
      clearSelection()
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map((id) => contactApi.destroy(id)))
    },
    onSuccess: () => {
      qc.invalidateQueries(['contacts'])
      clearSelection()
      setBulkDeleteTarget(null)
    },
  })

  const counts = useMemo(() => {
    return {
      all: contacts.length,
      unread: contacts.filter((c) => c.status === 'unread').length,
      read: contacts.filter((c) => c.status === 'read').length,
      replied: contacts.filter((c) => c.status === 'replied').length,
    }
  }, [contacts])

  const filteredContacts = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return contacts.filter((contact) => {
      const matchFilter = filter === 'all' || contact.status === filter

      const searchable = [
        contact.name,
        contact.email,
        contact.subject,
        contact.message,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchSearch = !keyword || searchable.includes(keyword)

      return matchFilter && matchSearch
    })
  }, [contacts, filter, search])

  const visibleIds = useMemo(() => {
    return filteredContacts.map((contact) => contact.id)
  }, [filteredContacts])

  const selectedCount = selectedIds.length

  const isAllVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  const clearSelection = () => {
    setSelectedIds([])
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (isAllVisibleSelected) {
        return prev.filter((id) => !visibleIds.includes(id))
      }

      return Array.from(new Set([...prev, ...visibleIds]))
    })
  }

  const openDetail = (contact) => {
    setSelected(contact)
  }

  const closeDetail = () => {
    const current = detail ?? selected

    if (!skipAutoReadOnce && current?.id && current?.status === 'unread') {
      statusMutation.mutate({
        id: current.id,
        status: 'read',
      })
    }

    setSkipAutoReadOnce(false)
    setSelected(null)
  }

  const handleToggleReadUnread = () => {
    if (!detail) return

    const nextStatus = detail.status === 'unread' ? 'read' : 'unread'

    if (nextStatus === 'unread') {
      setSkipAutoReadOnce(true)
    }

    statusMutation.mutate({
      id: detail.id,
      status: nextStatus,
    })
  }

  const handleDeleteFromModal = () => {
    if (!detail) return

    setDeleteTarget(detail)
    setSelected(null)
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
        {/* Header */}
        <PageHeader
          icon={Inbox}
          title="Contacts"
          description="Messages from your portfolio visitors."
          stats={[
            { label: 'Total', value: counts.all },
            { label: 'Unread', value: counts.unread, tone: 'accent' },
          ]}
        />

        {/* Toolbar */}
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
              {FILTERS.map((item) => {
                const isActive = filter === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-white text-black'
                        : 'text-white/35 hover:bg-white/[0.04] hover:text-white/70'
                    }`}
                  >
                    {item.label}

                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        isActive ? 'bg-black/10 text-black/70' : 'bg-white/[0.05] text-white/25'
                      }`}
                    >
                      {counts[item.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-80">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/20"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages..."
                className="h-10 w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.04]"
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedCount > 0 && (
          <div className="border-b border-white/[0.06] px-5 py-3 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAllVisible}
                  className="text-white/60 transition-colors hover:text-white"
                  title={isAllVisibleSelected ? 'Unselect all' : 'Select all'}
                >
                  {isAllVisibleSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>

                <p className="text-sm font-medium text-white/70">{selectedCount} selected</p>

                <button
                  onClick={clearSelection}
                  className="text-xs text-white/30 transition-colors hover:text-white/70"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    bulkStatusMutation.mutate({
                      ids: selectedIds,
                      status: 'read',
                    })
                  }
                  disabled={bulkStatusMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-xs font-medium text-white/45 transition-all hover:border-white/20 hover:bg-white/[0.04] hover:text-white/80 disabled:opacity-50"
                >
                  <MailOpen size={13} />
                  Mark read
                </button>

                <button
                  onClick={() =>
                    bulkStatusMutation.mutate({
                      ids: selectedIds,
                      status: 'unread',
                    })
                  }
                  disabled={bulkStatusMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 px-3 py-2 text-xs font-medium text-blue-400/80 transition-all hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-300 disabled:opacity-50"
                >
                  <Mail size={13} />
                  Mark unread
                </button>

                <button
                  onClick={() =>
                    bulkStatusMutation.mutate({
                      ids: selectedIds,
                      status: 'replied',
                    })
                  }
                  disabled={bulkStatusMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-400/80 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300 disabled:opacity-50"
                >
                  <CheckCheck size={13} />
                  Mark replied
                </button>

                <button
                  onClick={() => setBulkDeleteTarget([...selectedIds])}
                  disabled={bulkDeleteMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-medium text-red-400/80 transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-300 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-6 sm:px-6 lg:px-10">
          {!filteredContacts.length ? (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.08] bg-white/[0.015] px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] text-white/15">
                <Mail size={22} />
              </div>

              <p className="mt-4 text-sm font-medium text-white/50">
                {search
                  ? 'No messages found.'
                  : filter === 'all'
                    ? 'No messages yet.'
                    : `No ${filter} messages.`}
              </p>

              <p className="mt-1 max-w-sm text-xs leading-5 text-white/25">
                Incoming contact form submissions will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/[0.06] bg-[#101010] shadow-2xl shadow-black/20">
              {/* Desktop Header */}
              <div className="hidden grid-cols-[36px_minmax(220px,0.85fr)_minmax(260px,1.35fr)_130px_100px] border-b border-white/[0.06] bg-white/[0.025] px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/25 lg:grid">
                <button
                  onClick={toggleSelectAllVisible}
                  className="text-white/35 transition-colors hover:text-white"
                  title={isAllVisibleSelected ? 'Unselect all' : 'Select all'}
                >
                  {isAllVisibleSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                </button>

                <span>Sender</span>
                <span>Message</span>
                <span>Date</span>
                <span className="text-right">Status</span>
              </div>

              <div className="divide-y divide-white/[0.05]">
                {filteredContacts.map((contact) => {
                  const cfg = STATUS_CONFIG[contact.status] ?? STATUS_CONFIG.read;
                  const isUnread = contact.status === 'unread';
                  const isSelected = selectedIds.includes(contact.id);

                  return (
                    <article
                      key={contact.id}
                      onClick={() => openDetail(contact)}
                      className={`group cursor-pointer px-4 py-4 transition-all hover:bg-white/[0.025] sm:px-5 ${
                        isUnread ? 'bg-blue-500/[0.025]' : ''
                      } ${isSelected ? 'bg-white/[0.035]' : ''}`}
                    >
                      {/* Desktop Row */}
                      <div className="hidden grid-cols-[36px_minmax(220px,0.85fr)_minmax(260px,1.35fr)_130px_100px] items-center gap-4 lg:grid">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(contact.id);
                          }}
                          className={`text-white/25 transition-colors hover:text-white ${
                            isSelected ? 'text-blue-400' : ''
                          }`}
                          title={isSelected ? 'Unselect' : 'Select'}
                        >
                          {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                        </button>

                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold uppercase ${
                              isUnread
                                ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/15'
                                : 'bg-white/[0.05] text-white/35'
                            }`}
                          >
                            {getInitial(contact.name)}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`truncate text-sm ${
                                  isUnread
                                    ? 'font-semibold text-white'
                                    : 'font-medium text-white/55'
                                }`}
                              >
                                {contact.name || 'Unknown Sender'}
                              </p>

                              {isUnread && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                              )}
                            </div>

                            <p className="mt-0.5 truncate text-xs text-white/25">{contact.email}</p>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p
                            className={`truncate text-sm ${
                              isUnread ? 'font-medium text-white/90' : 'text-white/50'
                            }`}
                          >
                            {getSnippet(contact)}
                          </p>

                          <p className="mt-1 line-clamp-1 text-xs leading-5 text-white/25">
                            {contact.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-white/25">
                          <Clock size={13} />
                          {timeAgo(contact.created_at)}
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <span className={`h-2 w-2 rounded-full ${cfg.dot}`} title={cfg.label} />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(contact);
                            }}
                            className="rounded-xl border border-red-500/10 p-2 text-red-400/25 opacity-0 transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 group-hover:opacity-100"
                            title="Delete message"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Mobile / Tablet Card */}
                      <div className="lg:hidden">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelect(contact.id);
                            }}
                            className={`mt-3 text-white/25 transition-colors hover:text-white ${
                              isSelected ? 'text-blue-400' : ''
                            }`}
                            title={isSelected ? 'Unselect' : 'Select'}
                          >
                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>

                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold uppercase ${
                              isUnread
                                ? 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/15'
                                : 'bg-white/[0.05] text-white/35'
                            }`}
                          >
                            {getInitial(contact.name)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={`truncate text-sm ${
                                      isUnread
                                        ? 'font-semibold text-white'
                                        : 'font-medium text-white/60'
                                    }`}
                                  >
                                    {contact.name || 'Unknown Sender'}
                                  </p>

                                  {isUnread && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                                  )}
                                </div>

                                <p className="mt-0.5 truncate text-xs text-white/25">
                                  {contact.email}
                                </p>
                              </div>

                              <span className="shrink-0 text-[11px] text-white/25">
                                {timeAgo(contact.created_at)}
                              </span>
                            </div>

                            <p
                              className={`mt-3 line-clamp-1 text-sm ${
                                isUnread ? 'font-medium text-white/90' : 'text-white/50'
                              }`}
                            >
                              {getSnippet(contact)}
                            </p>

                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/25">
                              {contact.message}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <StatusBadge status={contact.status} />

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(contact);
                                }}
                                className="rounded-xl border border-red-500/10 p-2 text-red-400/35 transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
                                title="Delete message"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={closeDetail} title="Message Detail" size="lg">
        {detailLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={18} className="animate-spin text-white/30" />
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {/* Sender Card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-base font-semibold uppercase text-white/60">
                  {getInitial(detail.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {detail.name || 'Unknown Sender'}
                      </p>

                      <a
                        href={`mailto:${detail.email}`}
                        className="mt-1 block truncate text-xs text-white/35 transition-colors hover:text-white/70"
                      >
                        {detail.email}
                      </a>
                    </div>

                    <StatusBadge status={detail.status} />
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-white/30 sm:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2">
                      <CalendarDays size={13} className="text-white/20" />
                      {formatDate(detail.created_at)}
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2">
                      <User size={13} className="text-white/20" />
                      Visitor message
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/25">
                Subject
              </p>

              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="text-sm font-medium text-white/80">
                  {detail.subject || 'No subject'}
                </p>
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-white/25">
                Message
              </p>

              <div className="max-h-[42vh] overflow-y-auto rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-white/70">
                  {detail.message || '-'}
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-white/25">
                {detail.status === 'unread'
                  ? 'This message will be marked as read when you close the modal.'
                  : 'You can change this message status manually.'}
              </p>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={handleToggleReadUnread}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 px-3.5 py-2 text-xs font-medium text-blue-400/70 transition-all hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-blue-300 disabled:opacity-50"
                >
                  {detail.status === 'unread' ? <MailOpen size={13} /> : <Mail size={13} />}

                  {detail.status === 'unread' ? 'Mark Read' : 'Mark Unread'}
                </button>

                <button
                  onClick={() =>
                    statusMutation.mutate({
                      id: detail.id,
                      status: detail.status === 'replied' ? 'read' : 'replied',
                    })
                  }
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-white/45 transition-all hover:border-white/20 hover:bg-white/[0.04] hover:text-white/80 disabled:opacity-50"
                >
                  {statusMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : detail.status === 'replied' ? (
                    <MailOpen size={13} />
                  ) : (
                    <CheckCheck size={13} />
                  )}

                  {detail.status === 'replied' ? 'Mark Read' : 'Mark Replied'}
                </button>

                <button
                  onClick={handleDeleteFromModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-3.5 py-2 text-xs font-medium text-red-400/70 transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-400"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Message?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />

            <p className="text-sm leading-6 text-white/70">
              Message from <span className="font-medium text-white/90">"{deleteTarget?.name}"</span>{' '}
              will be permanently deleted.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl px-4 py-2 text-sm text-white/40 transition-colors hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-400 disabled:opacity-50"
            >
              {deleteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}

              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirm */}
      <Modal
        open={!!bulkDeleteTarget}
        onClose={() => setBulkDeleteTarget(null)}
        title="Delete Selected Messages?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />

            <div>
              <p className="text-sm leading-6 text-white/70">
                You are about to delete{' '}
                <span className="font-semibold text-white">
                  {bulkDeleteTarget?.length ?? 0} messages
                </span>{' '}
                at once.
              </p>

              <p className="mt-1 text-xs leading-5 text-white/30">
                This action is permanent and cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setBulkDeleteTarget(null)}
              className="rounded-xl px-4 py-2 text-sm text-white/40 transition-colors hover:text-white"
            >
              Cancel
            </button>

            <button
              onClick={() => bulkDeleteMutation.mutate(bulkDeleteTarget)}
              disabled={bulkDeleteMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-400 disabled:opacity-50"
            >
              {bulkDeleteMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}

              {bulkDeleteMutation.isPending ? 'Deleting...' : 'Yes, Delete All'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}