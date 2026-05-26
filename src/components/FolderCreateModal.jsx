import { useState, useEffect, useRef } from 'react'
import { FolderPlus, X } from 'lucide-react'

export default function FolderCreateModal({ anchorEl, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ bottom: 0, left: 0 })
  const inputRef = useRef(null)

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect()
      setPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      })
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [anchorEl])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 180)
  }

  function handleCreate() {
    if (!name.trim()) return
    onCreate(name.trim())
    handleClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') handleClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={handleClose} />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: pos.bottom,
          left: pos.left,
          transformOrigin: 'bottom left',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(6px)',
          transition: 'opacity 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
        }}
        className="z-50 w-64 bg-[var(--bg-modal)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <FolderPlus size={13} strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold">New Folder</span>
          </div>
          <button
            onClick={handleClose}
            className="w-5 h-5 flex items-center justify-center rounded-md text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <X size={12} />
          </button>
        </div>

        {/* Input */}
        <div className="px-4 pb-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Folder name…"
            className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--border-strong)] focus:bg-[var(--bg-active)] transition-all"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border-subtle)]">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-[11px] text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-3 py-1.5 text-[11px] bg-[#3E8EF7] hover:bg-[#5CA2F8] disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Create
          </button>
        </div>
      </div>
    </>
  )
}
