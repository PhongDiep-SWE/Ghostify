const Store = require("electron-store");
const dbSchema = require("./schema");

const store = new Store({ schema: dbSchema });

module.exports = store;
