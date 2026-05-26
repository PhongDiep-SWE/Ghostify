import TopBar from './components/TopBar'
import FolderNoteList from './components/FolderNoteList'
import LiveModeView from './components/LiveModeView'
import { useFolders, useNotebooks, useLiveMode } from './hooks'

export default function App() {
  const { folders, handleCreateFolder, handleDeleteFolder } = useFolders()
  const { notebooks, handleCreateNote, handleUpdateNote, handleDeleteNote } = useNotebooks()
  const { liveFolder, handleExitLive, handleGoLive }        = useLiveMode()

  if (liveFolder) {
    return (
      <LiveModeView
        folder={liveFolder}
        notes={notebooks.filter(n => n.folderId === liveFolder.id)}
        onExit={handleExitLive}
        onCreateNote={handleCreateNote}
        onUpdateNote={handleUpdateNote}
        onDeleteNote={handleDeleteNote}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden rounded-xl">
      <TopBar />

      <main className="flex flex-1 min-h-0 gap-2 p-2 pt-2">
        <FolderNoteList
          listOfFolders={folders}
          notebooks={notebooks}
          onDeleteFolder={handleDeleteFolder}
          onCreateFolder={handleCreateFolder}
          onCreateNote={handleCreateNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onGoLive={handleGoLive}
        />
      </main>
    </div>
  )
}
