import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Reusable Modal
 * Props:
 *  - open        boolean
 *  - onClose     () => void
 *  - title       string
 *  - description string (optional)
 *  - children    ReactNode
 *  - size        'sm' | 'md' | 'lg' | 'xl'  (default: 'md')
 */
export default function Modal({ open, onClose, title, description, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full ${sizeMap[size]} rounded-2xl border border-white/[0.08] bg-[#161616] shadow-2xl flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-white/30">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}