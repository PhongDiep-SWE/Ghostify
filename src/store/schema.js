// @ts-check

/** @type {import('electron-store').Schema<Record<string, any>>} */
const schema = {
  folders: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        notebookIds: { type: "array", items: { type: "string" } },
        createdAt: { type: "number" },
        updatedAt: { type: "number" },
      },
      required: ["id", "name", "notebookIds", "createdAt", "updatedAt"],
    },
    default: [],
  },
  notebooks: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        folderId: { type: "string" },
        name: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
        createdAt: { type: "number" },
        updatedAt: { type: "number" },
      },
      required: ["id", "folderId", "name", "bullets", "createdAt", "updatedAt"],
    },
    default: [],
  },
};

module.exports = schema;
