import { setPillStatus, toast } from "../shared/ui.js";

const el = (id) => document.getElementById(id);

async function init() {
  setPillStatus("Connected", true);
  const form = el("contactForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    // Here you could send to a backend or email service; for now just toast.
    toast("Message sent! We’ll get back to you soon.", "success", 3200);
    form.reset();
  });
}

init();
