import { setPillStatus } from "../shared/ui.js";

const el = (id) => document.getElementById(id);

async function init() {
  setPillStatus("Connected", true);
}

init();
