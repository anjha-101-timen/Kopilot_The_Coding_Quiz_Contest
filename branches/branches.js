import { toast } from "/shared/ui.js";

function onAction(action, title) {
  if (typeof toast === "function") {
    toast(`${title} • ${action === "start" ? "Start" : "Explore"}`);
    return;
  }
  alert(`${title} • ${action}`);
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const card = btn.closest(".brCard");
  const title = card?.querySelector(".brName")?.textContent?.trim() || "Branch";
  const action = btn.getAttribute("data-action") || "details";
  onAction(action, title);
});
