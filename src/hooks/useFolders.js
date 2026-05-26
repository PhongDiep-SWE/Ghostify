import { useState, useEffect } from "react";
import { api } from "../api";

export function useFolders() {
  // folders state
  const [folders, setFolders] = useState([]);

  // fetch all created folders on refresh
  useEffect(() => {
    api?.folders.getAll().then(setFolders);
  }, []);

  // delete chosen folder
  async function handleDeleteFolder(id) {
    await api.folders.delete(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  }

  // create new folder
  async function handleCreateFolder(name) {
    const folder = {
      id: crypto.randomUUID(),
      name,
      notebookIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const created = await api.folders.create(folder);
    setFolders((prev) => [...prev, created]);
  }
  // return object instead of array is because of order independence
  return { folders, handleCreateFolder, handleDeleteFolder };
}
