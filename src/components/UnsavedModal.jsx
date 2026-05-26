import { motion, AnimatePresence } from 'framer-motion'

const SPRING = { duration: 0.2, ease: [0.16, 1, 0.3, 1] }

/**
 * Shared "Unsaved changes" guard modal.
 *
 * Props:
 *   show      — boolean
 *   isNew     — boolean  (true = new note, false = editing existing)
 *   noteName  — string   (name shown in the body message)
 *   onSave    — () => void
 *   onDiscard — () => void
 */
export default function UnsavedModal({ show, isNew, noteName, onSave, onDiscard }) {
  const displayName = noteName?.trim() || 'Untitled'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={SPRING}
            className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-xl px-5 py-5 w-[min(260px,90vw)] shadow-2xl"
          >
            <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Unsaved changes</p>
            <p className="text-[11px] text-[var(--text-primary)] mb-5 leading-relaxed">
              {isNew
                ? `Save "${displayName}" before continuing?`
                : `Save changes to "${displayName}" before continuing?`
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={onDiscard}
                className="flex-1 py-1.5 rounded-lg text-[11px] text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
              >
                Discard
              </button>
              <button
                onClick={onSave}
                className="flex-1 py-1.5 bg-[#3E8EF7] hover:bg-[#5CA2F8] rounded-lg text-[11px] text-white font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
