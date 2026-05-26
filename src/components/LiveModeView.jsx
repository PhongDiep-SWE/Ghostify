import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ArrowLeft, Plus, Search, X, Trash2 } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import UnsavedModal from './UnsavedModal'

// animation
const SPRING = { duration: 0.2, ease: [0.16, 1, 0.3, 1] }

const SHORTCUTS = [
  { keys: ['⌘', '→'], label: 'Next note'      },
  { keys: ['⌘', '←'], label: 'Previous note'  },
  { keys: ['⌘', 'S'], label: 'Save changes'   },
  { keys: ['⌘', 'N'], label: 'New note'        },
  { keys: ['Esc'],     label: 'Go back'         },
  { keys: ['?'],       label: 'Show shortcuts'  },
]

export default function LiveModeView({ folder, notes, onExit, onCreateNote, onUpdateNote, onDeleteNote }) {
  // current note's index
  const [index, setIndex]                   = useState(0)
  // is editing state
  const [editState, setEditState]           = useState(null)
  // unsaved changes for modal
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  // next behavior 
  const [pendingAction, setPendingAction]   = useState(null)
  // new note if click create new note 
  const [queueNewDraft, setQueueNewDraft]   = useState(false)
  // search content in search bar
  const [searchQuery, setSearchQuery]       = useState('')
  // show search bar state
  const [showSearchBar, setShowSearchBar]   = useState(false)
  // show shortcuts state 
  const [showShortcuts, setShowShortcuts]   = useState(false)
  // show delete confirmation state 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const tabRefs    = useRef([])
  const bulletRefs = useRef([])
  const titleRef   = useRef(null)

  // all notes 
  const displayNotes = editState?.isNew
    ? [...notes, { id: '__draft__', name: editState.name, bullets: editState.bullets }]
    : notes
  
  // filtered notes by search content 
  const filteredNotes = searchQuery.trim()
    ? displayNotes.filter(n => {
        const s = searchQuery.trim().toLowerCase()
        return n.name?.toLowerCase().includes(s) || n.bullets?.some(b => b.toLowerCase().includes(s))
      })
    : displayNotes
    
  // current displayed note
  const currentNote   = filteredNotes[index] ?? null

  // current name on displayed note 
  const editedName    = editState ? editState.name : (currentNote?.name ?? '')

  // current bullet points on displayed note 
  const rawBullets    = editState ? editState.bullets : (currentNote?.bullets ?? [])
  const editedBullets = rawBullets.length > 0 ? rawBullets : ['']

  // when typing content in search bar to filter notes, if the current note does not belong to the filtered list -> move to the first note in the filtered list 
  useEffect(() => {
    const hasCurrentNote = filteredNotes.some(n => n === displayNotes[index])
    if (!hasCurrentNote) setIndex(0)
  }, [searchQuery])

  // scroll the horizontal tab to the selected note in the bottom nav
  useEffect(() => {
    tabRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    })
  }, [index])

  // queue new draft after saving a new note (happens when a new note button is clicked when the changes in the current displayed note is not saved)
  useEffect(() => {
    if (!queueNewDraft) return
    setQueueNewDraft(false)
    setEditState({ isNew: true, name: 'Untitled', bullets: [''] })
    setIndex(notes.length)
    setTimeout(() => titleRef.current?.focus(), 0)
  }, [queueNewDraft])

  // hot keys functionalities 
  useEffect(() => {
    function onKeyDown(e) {
      const inInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName)

      if ((e.metaKey || e.ctrlKey) && e.key === 's' && editState) {
        e.preventDefault()
        saveChanges()
        return
      }
      if (e.metaKey && e.key === 'ArrowRight') {
        e.preventDefault()
        if (editState?.isNew) setShowUnsavedModal(true)
        setIndex(prev => Math.min(prev + 1, filteredNotes.length - 1))
        return
      }
      if (e.metaKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        if (editState?.isNew) setShowUnsavedModal(true)
        setIndex(prev => Math.max(prev - 1, 0))
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        requestAction('plus')
        return
      }
      if (e.key === 'Escape') {
        if (showShortcuts)  { setShowShortcuts(false); return }
        if (showSearchBar)  { setShowSearchBar(false); setSearchQuery(''); return }
        requestAction('back')
        return
      }
      if (e.key === '?' && !inInput) {
        setShowShortcuts(prev => !prev)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [editState, showShortcuts, showSearchBar, filteredNotes.length, index])


  function getBaseState() {
    return {
      isNew: false,
      name: currentNote?.name ?? '',
      bullets: currentNote?.bullets?.length ? [...currentNote.bullets] : [''],
    }
  }

  // triggered when title on current displayed notes get changes 
  function updateName(value) {
    setEditState(prev => prev ? { ...prev, name: value } : { ...getBaseState(), name: value })
  }

  // triggered when bullet points on current displayed notes get changes 
  function updateBullet(i, value) {
    setEditState(prev => {
      const base = prev ?? getBaseState()
      const bullets = [...base.bullets]
      bullets[i] = value
      return { ...base, bullets }
    })
  }

  // create & delete bullet points 
  function handleBulletKeyDown(e, i) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setEditState(prev => {
        const base = prev ?? getBaseState()
        const bullets = [...base.bullets]
        bullets.splice(i + 1, 0, '')
        return { ...base, bullets }
      })
      setTimeout(() => bulletRefs.current[i + 1]?.focus(), 0)
    }
    if (e.key === 'Backspace' && editedBullets[i] === '' && editedBullets.length > 1) {
      e.preventDefault()
      setEditState(prev => {
        const base = prev ?? getBaseState()
        return { ...base, bullets: base.bullets.filter((_, idx) => idx !== i) }
      })
      setTimeout(() => bulletRefs.current[i - 1]?.focus(), 0)
    }
  }

  // save new note or updated note 
  async function saveChanges() {
    if (!editState) return
    const name    = editState.name.trim() || 'Untitled'
    const bullets = editState.bullets.filter(b => b.trim())
    setEditState(null)
    if (editState.isNew) {
      await onCreateNote(folder, { name, bullets })
    } else {
      await onUpdateNote({ ...notes[index], name, bullets })
    }
  }


  function requestAction(action) {
    if (editState) {
      setPendingAction(action)
      setShowUnsavedModal(true)
    } else {
      executeAction(action)
    }
  }

  function executeAction(action) {
    if (action === 'back') {
      onExit()
    } else if (action === 'plus') {
      setEditState({ isNew: true, name: 'Untitled', bullets: [''] })
      setIndex(notes.length)
      setTimeout(() => titleRef.current?.focus(), 0)
    } else if (typeof action === 'number') {
      setIndex(action)
    }
  }

  async function handleModalSave() {
    const action = pendingAction
    const wasNew = editState?.isNew
    setShowUnsavedModal(false)
    setPendingAction(null)
    await saveChanges()
    if (action === 'plus' && wasNew) {
      setQueueNewDraft(true)
    } else {
      executeAction(action)
    }
  }

  function handleModalDiscard() {
    const action = pendingAction
    setShowUnsavedModal(false)
    setPendingAction(null)
    setEditState(null)
    executeAction(action)
  }

  // delete note 
  async function handleConfirmDelete() {
    if (!currentNote || currentNote.id === '__draft__') return
    const deletedIndex = index
    setShowDeleteConfirm(false)
    setEditState(null)
    await onDeleteNote(currentNote.id)
    if (deletedIndex >= notes.length - 1) {
      setIndex(Math.max(0, notes.length - 2))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col h-screen rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-live)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border-subtle)] shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
      >
        <button
          onClick={() => requestAction('back')}
          style={{ WebkitAppRegion: 'no-drag' }}
          className="flex items-center gap-1.5 text-[var(--text-live-primary)] transition-colors text-[12px]"
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Back
        </button>

        <span className="text-[12px] font-medium text-[var(--text-live-primary)] absolute left-1/2 -translate-x-1/2 select-none">
          {folder.name}
        </span>

        {/* Right controls */}
        <div style={{ WebkitAppRegion: 'no-drag' }} className="flex items-center gap-2">

          {/* Search */}
          <AnimatePresence mode="wait">
            {showSearchBar ? (
              <motion.div
                key="search-open"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={SPRING}
                className="flex items-center gap-1.5"
              >
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-32 bg-[var(--bg-input)] text-[12px] text-[var(--text-live-primary)] placeholder-[var(--text-faint)] rounded-lg px-2.5 py-1.5 outline-none border border-[var(--border)] focus:border-[var(--border-strong)] focus:bg-[var(--bg-active)] transition-colors"
                />
                <button
                  onClick={() => { setShowSearchBar(false); setSearchQuery('') }}
                  className="text-[var(--text-live-primary)] transition-colors"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="search-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSearchBar(true)}
                className="text-[var(--text-live-primary)] transition-colors"
              >
                <Search size={13} strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Delete current note */}
          <AnimatePresence>
            {currentNote && currentNote.id !== '__draft__' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete note"
                className="text-[var(--text-live-primary)] hover:text-red-400 hover:bg-red-400/[0.08] w-6 h-6 flex items-center justify-center rounded-md transition-colors"
              >
                <Trash2 size={13} strokeWidth={1.5} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Shortcuts toggle */}
          <button
            onClick={() => setShowShortcuts(prev => !prev)}
            className={`w-5 h-5 flex items-center justify-center rounded-md text-[11px] font-semibold border transition-colors
              ${showShortcuts
                ? 'border-[var(--border-strong)] text-[var(--text-live-primary)] bg-[var(--bg-active)]'
                : 'border-[var(--border)] text-[var(--text-live-primary)] hover:border-[var(--border-strong)]'
              }`}
          >
            ?
          </button>
        </div>
      </div>

      {/* Note content */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentNote ? (
            <motion.div
              key={currentNote.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={SPRING}
            >
              <input
                ref={titleRef}
                value={editedName}
                onChange={e => updateName(e.target.value)}
                placeholder="Untitled"
                className="w-full bg-transparent text-[15px] font-semibold text-[var(--text-live-primary)] mb-4 outline-none placeholder-[var(--text-faint)] tracking-tight"
              />
              <ul className="flex flex-col gap-2">
                {editedBullets.map((bullet, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.12, delay: i * 0.02 }}
                    className="flex items-start gap-2.5"
                  >
                    <span className="mt-[8px] w-1 h-1 rounded-full bg-[var(--text-live-primary)] shrink-0" />
                    <TextareaAutosize
                      ref={el => (bulletRefs.current[i] = el)}
                      minRows={1}
                      value={bullet}
                      onChange={e => updateBullet(i, e.target.value)}
                      onKeyDown={e => handleBulletKeyDown(e, i)}
                      placeholder={i === 0 ? 'Add a point…' : ''}
                      className="flex-1 bg-transparent text-[14px] text-[var(--text-live-primary)] outline-none placeholder-[var(--text-faint)] resize-none"
                    />
                  </motion.li>
                ))}
              </ul>
              {editState && (
                <p className="mt-4 text-[11px] text-[var(--text-live-primary)] select-none">⌘S to save</p>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[14px] text-[var(--text-live-primary)] text-center mt-10"
            >
              No notes in this folder
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Tab navigation */}
      <div
        className="flex items-center border-t border-[var(--border-subtle)] shrink-0"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <LayoutGroup>
          <div className="flex flex-1 gap-1 px-3 py-2.5 overflow-x-auto">
            {filteredNotes.map((note, i) => (
              <button
                ref={el => (tabRefs.current[i] = el)}
                key={note.id}
                onClick={() => requestAction(i)}
                className={`relative shrink-0 px-3 py-1 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap
                  ${i === index
                    ? 'text-[var(--tab-pill-text)]'
                    : 'text-[var(--text-live-primary)] hover:bg-[var(--bg-hover)]'
                  }
                `}
              >
                {i === index && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 bg-[var(--tab-pill-bg)] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{note.name || 'Untitled'}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>

        <button
          onClick={() => requestAction('plus')}
          className="w-7 h-7 flex items-center justify-center shrink-0 rounded-full text-[var(--text-live-primary)] hover:bg-[var(--bg-active)] transition-colors mr-2"
        >
          <Plus size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] z-50"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1,   y: 0 }}
              exit={{ opacity: 0,   scale: 0.95, y: 4 }}
              transition={SPRING}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-xl p-5 w-[min(280px,90vw)] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</p>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              <ul className="flex flex-col gap-2.5">
                {SHORTCUTS.map(({ keys, label }) => (
                  <li key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--text-primary)]">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map(k => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 rounded-md text-[11px] text-[var(--text-primary)] font-mono leading-none"
                          style={{ background: 'var(--kbd-bg)', border: '1px solid var(--kbd-border)' }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-[10px] text-[var(--text-primary)] text-center select-none">
                Press{' '}
                <kbd
                  className="px-1 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: 'var(--kbd-bg)', border: '1px solid var(--kbd-border)' }}
                >
                  Esc
                </kbd>
                {' '}or click outside to dismiss
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete note confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center bg-[var(--bg-overlay)] z-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={SPRING}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-xl px-5 py-5 w-[min(280px,90vw)] shadow-2xl"
            >
              <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Delete note</p>
              <p className="text-[11px] text-[var(--text-primary)] mb-5 leading-relaxed">
                <span className="text-[var(--text-primary)]">"{currentNote?.name || 'Untitled'}"</span> will be permanently deleted.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-1.5 rounded-lg text-[11px] text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg text-[11px] text-white font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved changes modal */}
      <UnsavedModal
        show={showUnsavedModal}
        isNew={editState?.isNew ?? false}
        noteName={editState?.name ?? ''}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
      />
    </motion.div>
  )
}
