import { useState, useEffect } from "react";
import { api } from "../api";

export function useNotebooks() {
  // all notebooks
  const [notebooks, setNotebooks] = useState([]);

  // fetch all notes on refresh
  useEffect(() => {
    api?.notebooks.getAll().then(setNotebooks);
  }, []);

  // create new note in the selected folder
  async function handleCreateNote(folder, { name, bullets }) {
    const notebook = {
      id: crypto.randomUUID(),
      folderId: folder.id,
      name,
      bullets,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const created = await api.notebooks.create(notebook);
    setNotebooks((prev) => [...prev, created]);
  }

  // update note
  async function handleUpdateNote(updatedNote) {
    const updated = {
      ...updatedNote,
      updatedAt: Date.now(),
    };
    const saved = await api.notebooks.update(updated);
    setNotebooks((prev) =>
      prev.map((note) => (note.id === saved.id ? saved : note))
    );
  }

  //delete note
  async function deleteNote(id) {
    await api.notebooks.delete(id);
    setNotebooks((prev) => prev.filter((note) => note.id != id));
  }

  return { notebooks, handleCreateNote, handleUpdateNote, handleDeleteNote: deleteNote };
}
