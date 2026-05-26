import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderOpen, Trash2, Plus, FileText, ArrowLeft } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import { formatDate } from '../utils'
import FolderCreateModal from './FolderCreateModal'
import UnsavedModal from './UnsavedModal'

// animation 
const SPRING = { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
const STAGGER_CHILD = (i) => ({ duration: 0.2, delay: i * 0.035, ease: [0.16, 1, 0.3, 1] })

export default function FolderNoteList({
  listOfFolders,
  notebooks,
  onDeleteFolder,
  onCreateFolder,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onGoLive,
}) {
  // current folder info
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [folderToDelete, setFolderToDelete]  = useState(null)

  // new folder modal popup state
  const [showFolderModal, setShowFolderModal] = useState(false)
  const newFolderBtnRef = useRef(null)

  // right content panel state 
  const [view, setView] = useState('list')   // 'list' | 'editor'

  // is editing mode state 
  const [editingNote, setEditingNote] = useState(null) // null = new note
  const [editName, setEditName] = useState('')
  const [editBullets, setEditBullets] = useState([''])

  // unsaved changes state
  const [isDirty, setIsDirty] = useState(false)

  // Unsaved changes modal
  const [showUnsaved, setShowUnsaved]     = useState(false)

  // next behavior state
  const [pendingAction, setPendingAction] = useState(null)

  // deleted note 
  const [noteToDelete, setNoteToDelete] = useState(null)

  const bulletRefs = useRef([])
  const titleRef   = useRef(null)

  // display all notes of selected folder 
  const folderNotes = selectedFolder
    ? notebooks.filter(n => n.folderId === selectedFolder.id)
    : []

  // ⌘S to save
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && view === 'editor' && isDirty) {
        e.preventDefault()
        commitSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view, isDirty, editName, editBullets, editingNote, selectedFolder])

  // create new note
  function enterNewNote() {
    setEditingNote(null)
    setEditName('')
    setEditBullets([''])
    setIsDirty(false)
    setView('editor')
    setTimeout(() => titleRef.current?.focus(), 60)
  }

  // go to existing note 
  function enterNote(note) {
    setEditingNote(note)
    setEditName(note.name || '')
    setEditBullets(note.bullets?.length ? [...note.bullets] : [''])
    setIsDirty(false)
    setView('editor')
    setTimeout(() => titleRef.current?.focus(), 60)
  }

  // back to list view 
  function goBackToList() {
    setView('list')
    setIsDirty(false)
  }

  // detect unsaved changes in either new note or exiting note 
  function requestAction(action) {
    if (isDirty && view === 'editor') {
      setPendingAction(action)
      setShowUnsaved(true)
    } else {
      executeAction(action)
    }
  }

  // list of actions 
  function executeAction(action) {
    if (action === 'back') {
      goBackToList()
    } else if (action === 'new') {
      enterNewNote()
    } else if (action?.type === 'open-note') {
      enterNote(action.note)
    } else if (action?.type === 'switch-folder') {
      setSelectedFolder(action.folder)
      setView('list')
      setIsDirty(false)
    }
  }

  // save new note or updated note 
  async function commitSave() {
    const name = editName.trim() || 'Untitled'
    const bullets = editBullets.filter(b => b.trim())
    if (editingNote) {
      await onUpdateNote({ ...editingNote, name, bullets })
    } else {
      await onCreateNote(selectedFolder, { name, bullets })
    }
    setIsDirty(false)
    setView('list')
  }

  // save new note or updated note on unsaved modal 
  async function handleModalSave() {
    const action = pendingAction
    setShowUnsaved(false)
    setPendingAction(null)
    const name = editName.trim() || 'Untitled'
    const bullets = editBullets.filter(b => b.trim())
    if (editingNote) {
      await onUpdateNote({ ...editingNote, name, bullets })
    } else {
      await onCreateNote(selectedFolder, { name, bullets })
    }
    setIsDirty(false)
    executeAction(action)
  }

  // discard unsaved modal -> delete all unsaved changes  
  function handleModalDiscard() {
    const action = pendingAction
    setShowUnsaved(false)
    setPendingAction(null)
    setIsDirty(false)
    executeAction(action)
  }

  // delete note 
  async function handleConfirmDeleteNote() {
    const note = noteToDelete
    setNoteToDelete(null)
    await onDeleteNote(note.id)
    if (editingNote?.id === note.id) goBackToList()
  }

  // switch folder 
  function handleSelectFolder(folder) {
    const isSame = folder.id === selectedFolder?.id
    const nextFolder = isSame ? null : folder
    requestAction({ type: 'switch-folder', folder: nextFolder })
  }

  function handleBulletChange(i, value) {
    setEditBullets(prev => prev.map((b, idx) => idx === i ? value : b))
    setIsDirty(true)
  }

  function handleBulletKeyDown(e, i) {
    if (e.key === 'Enter' && editBullets.at(-1).trim() !== '') {
      e.preventDefault()
      setEditBullets(prev => {
        const next = [...prev]
        next.splice(i + 1, 0, '')
        return next
      })
      setTimeout(() => bulletRefs.current[i + 1]?.focus(), 0)
    }
    if (e.key === 'Backspace' && editBullets[i] === '' && editBullets.length > 1) {
      e.preventDefault()
      setEditBullets(prev => prev.filter((_, idx) => idx !== i))
      setTimeout(() => bulletRefs.current[i - 1]?.focus(), 0)
    }
  }

  // ──────────────────────────────────────────────────
  return (
    <div className="flex flex-1 min-h-0 min-w-0 gap-2">

      {/* Left column: Folders */}
      <div className="flex flex-col shrink-0 w-[22%] min-w-[160px] max-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">

        <div className="px-4 pt-4 pb-2.5">
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-primary)] font-semibold">
            Folders
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {listOfFolders.length === 0 ? (
            <p className="text-[12px] text-[var(--text-primary)] px-2 py-2">No folders yet</p>
          ) : (
            listOfFolders.map((folder, i) => {
              const isActive = selectedFolder?.id === folder.id
              return (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={STAGGER_CHILD(i)}
                  onClick={() => handleSelectFolder(folder)}
                  className={`
                    group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer mb-0.5
                    transition-colors duration-100
                    ${isActive
                      ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="folder-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[#3E8EF7]"
                      transition={SPRING}
                    />
                  )}

                  {isActive
                    ? <FolderOpen size={13} strokeWidth={1.5} className="shrink-0 text-[var(--folder-icon-active)]" />
                    : <Folder     size={13} strokeWidth={1.5} className="shrink-0" />
                  }

                  <span className="flex-1 text-[13px] truncate leading-none">{folder.name}</span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150">
                    <button
                      onClick={e => { e.stopPropagation(); onGoLive(folder) }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-400/[0.12] hover:bg-emerald-400/[0.22] border border-emerald-400/[0.30] transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 leading-none">Live</span>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setFolderToDelete(folder) }}
                      className="p-1 rounded text-[var(--text-primary)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={11} strokeWidth={1.5} />
                    </button>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

        <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
          <button
            ref={newFolderBtnRef}
            onClick={() => setShowFolderModal(true)}
            className="flex items-center gap-1.5 text-[12px] text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors duration-150 group"
          >
            <Plus size={12} strokeWidth={2} className="group-hover:rotate-90 transition-transform duration-200" />
            New Folder
          </button>
        </div>
      </div>

      {/* Right column: Notes */}
      <div className="flex flex-col flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedFolder ? (
            <motion.div
              key={selectedFolder.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={SPRING}
              className="flex flex-col flex-1 min-h-0 relative"
            >
              {/* Note header (always visible)*/}
              <div className="flex items-center justify-between px-4 pt-4 pb-2.5 shrink-0 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 min-w-0">
                  <AnimatePresence>
                    {view === 'editor' && (
                      <motion.button
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => requestAction('back')}
                        className="flex items-center gap-1 text-[12px] text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
                      >
                        <ArrowLeft size={13} strokeWidth={2} />
                        Back
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-primary)] font-semibold truncate">
                    {selectedFolder.name}
                  </span>
                </div>

                <button
                  onClick={() => requestAction('new')}
                  className="flex items-center gap-1 text-[12px] text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors duration-150 shrink-0"
                >
                  <Plus size={12} strokeWidth={2} />
                  New Note
                </button>
              </div>

              {/* Swappable content area */}
              <AnimatePresence mode="wait">

                {view === 'list' ? (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={SPRING}
                    className="flex-1 overflow-y-auto px-2 py-2"
                  >
                    {folderNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 pb-8">
                        <FileText size={20} strokeWidth={1} className="text-[var(--text-primary)]" />
                        <p className="text-[13px] text-[var(--text-primary)]">No notes yet</p>
                      </div>
                    ) : (
                      folderNotes.map((note, i) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={STAGGER_CHILD(i)}
                          onClick={() => requestAction({ type: 'open-note', note })}
                          className="group flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer transition-colors duration-100 mb-0.5"
                        >
                          <span className="text-[11px] text-[var(--text-primary)] w-4 text-right shrink-0 tabular-nums">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-[13px] text-[var(--text-primary)] truncate">
                            {note.name}
                          </span>
                          <span className="text-[11px] text-[var(--text-primary)] shrink-0 group-hover:text-[var(--text-primary)] transition-colors">
                            {formatDate(note.createdAt)}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); setNoteToDelete(note) }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[var(--text-primary)] hover:text-red-400 hover:bg-red-400/[0.08] transition-all duration-150 shrink-0 -mr-1"
                          >
                            <Trash2 size={11} strokeWidth={1.5} />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </motion.div>

                ) : (
                  <motion.div
                    key="editor"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={SPRING}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    {/* Editor content */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      {/* Title */}
                      <input
                        ref={titleRef}
                        value={editName}
                        onChange={e => { setEditName(e.target.value); setIsDirty(true) }}
                        placeholder="Title…"
                        className="w-full bg-transparent text-[15px] font-semibold text-[var(--text-primary)] outline-none placeholder-[var(--text-faint)] tracking-tight mb-4"
                      />
                      {/* Bullets */}
                      <ul className="flex flex-col gap-0.5">
                        {editBullets.map((bullet, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, y: -3 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.12 }}
                            className="flex items-start gap-3 py-1"
                          >
                            <span className="mt-[7px] w-1 h-1 rounded-full bg-[var(--text-primary)] shrink-0" />
                            <TextareaAutosize
                              ref={el => (bulletRefs.current[i] = el)}
                              minRows={1}
                              value={bullet}
                              onChange={e => handleBulletChange(i, e.target.value)}
                              onKeyDown={e => handleBulletKeyDown(e, i)}
                              placeholder={i === 0 ? 'Add a point…' : ''}
                              className="flex-1 bg-transparent text-[13px] text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none leading-relaxed resize-none"
                            />
                          </motion.li>
                        ))}
                      </ul>
                      {isDirty && (
                        <p className="mt-4 text-[10px] text-[var(--text-primary)] select-none">⌘S to save</p>
                      )}
                    </div>

                    {/* Editor footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)] shrink-0">
                      {/* Delete — only for existing notes */}
                      <div className="w-8">
                        {editingNote && (
                          <button
                            onClick={() => setNoteToDelete(editingNote)}
                            title="Delete note"
                            className="p-1.5 rounded-lg text-[var(--text-primary)] hover:text-red-400 hover:bg-red-400/[0.08] transition-colors"
                          >
                            <Trash2 size={13} strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => requestAction('back')}
                          className="px-3.5 py-1.5 text-[12px] text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={commitSave}
                          className="px-3.5 py-1.5 text-[12px] bg-[#3E8EF7] hover:bg-[#5CA2F8] text-white rounded-lg transition-colors font-medium active:scale-[0.97]"
                        >
                          {editingNote ? 'Update' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Unsaved changes modal */}
              <UnsavedModal
                show={showUnsaved}
                isNew={editingNote === null}
                noteName={editName}
                onSave={handleModalSave}
                onDiscard={handleModalDiscard}
              />
            </motion.div>

          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center justify-center flex-1 gap-2 pb-8"
            >
              <FolderOpen size={24} strokeWidth={1} className="text-[var(--text-primary)]" />
              <p className="text-[13px] text-[var(--text-primary)]">Select a folder</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Note delete confirmation */}
      <AnimatePresence>
        {noteToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)]"
            onClick={() => setNoteToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={SPRING}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-xl p-5 w-[min(300px,90vw)] shadow-2xl"
            >
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Delete note</h2>
              <p className="text-[12px] text-[var(--text-primary)] mb-5 leading-relaxed">
                <span className="text-[var(--text-primary)]">"{noteToDelete.name}"</span> will be permanently deleted.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setNoteToDelete(null)}
                  className="px-3 py-1.5 text-[12px] rounded-lg text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteNote}
                  className="px-3 py-1.5 text-[12px] rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder create modal */}
      {showFolderModal && (
        <FolderCreateModal
          anchorEl={newFolderBtnRef.current}
          onClose={() => setShowFolderModal(false)}
          onCreate={onCreateFolder}
        />
      )}

      {/* Folder delete confirmation */}
      <AnimatePresence>
        {folderToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)]"
            onClick={() => setFolderToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 4 }}
              transition={SPRING}
              onClick={e => e.stopPropagation()}
              className="bg-[var(--bg-modal)] border border-[var(--border)] rounded-xl p-5 w-[min(300px,90vw)] shadow-2xl"
            >
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">Delete folder</h2>
              <p className="text-[12px] text-[var(--text-primary)] mb-5 leading-relaxed">
                <span className="text-[var(--text-primary)]">"{folderToDelete.name}"</span> and all its notes will be permanently deleted.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setFolderToDelete(null)}
                  className="px-3 py-1.5 text-[12px] rounded-lg text-[var(--text-primary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedFolder?.id === folderToDelete.id) { setSelectedFolder(null); setView('list') }
                    onDeleteFolder(folderToDelete.id)
                    setFolderToDelete(null)
                  }}
                  className="px-3 py-1.5 text-[12px] rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
