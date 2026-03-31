// Contest Hub: mock data + client-side filtering/sorting
import { showToast } from "../shared/ui.js";

const STORAGE_KEY = "cqcpContests";

// Mock data generator
function generateMockContests() {
  const now = new Date();
  const contests = [];
  const codes = ["CQCP01", "CQCP02", "CQCP03", "CQCP04", "CQCP05", "CQCP06", "CQCP07", "CQCP08", "CQCP09", "CQCP10"];
  const names = [
    "Spring Coding Sprint",
    "Algorithm Marathon",
    "Data Structures Fiesta",
    "Dynamic Programming Challenge",
    "Graph Gauntlet",
    "Number Theory Night",
    "String Saga",
    "Greedy Gala",
    "Binary Blitz",
    "Recursion Rumble"
  ];
  const difficulties = ["easy", "medium", "hard"];
  const prizes = ["₹5,000", "₹10,000", "₹20,000", "₹50,000", "₹1,00,000"];

  for (let i = 0; i < 10; i++) {
    const start = new Date(now.getTime() + (i - 5) * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000);
    const duration = 60 + Math.floor(Math.random() * 120); // 60-180 min
    const end = new Date(start.getTime() + duration * 60 * 1000);
    const participants = Math.floor(Math.random() * 500) + 50;
    const status = start > now ? "future" : end > now ? "current" : "past";
    contests.push({
      code: codes[i],
      name: names[i],
      status,
      start: start.toISOString(),
      end: end.toISOString(),
      duration,
      participants,
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      prize: prizes[Math.floor(Math.random() * prizes.length)]
    });
  }
  return contests;
}

// Load contests (mock for now)
function loadContests() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  const mock = generateMockContests();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
  return mock;
}

// Render table
function renderTable(data) {
  const tbody = document.getElementById("contestTableBody");
  const empty = document.getElementById("empty");
  tbody.innerHTML = "";
  if (data.length === 0) {
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";
  data.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="code">${c.code}</span></td>
      <td>${c.name}</td>
      <td><span class="status ${c.status}">${c.status}</span></td>
      <td>${new Date(c.start).toLocaleString()}</td>
      <td>${new Date(c.end).toLocaleString()}</td>
      <td>${c.duration} min</td>
      <td>${c.participants}</td>
      <td><span class="difficulty ${c.difficulty}">${c.difficulty}</span></td>
      <td><span class="prize">${c.prize}</span></td>
      <td>
        <div class="actions">
          <button class="btn ghost" data-code="${c.code}">View</button>
          ${c.status === "future" ? `<button class="btn primary" data-code="${c.code}">Register</button>` : ""}
          ${c.status === "past" ? `<button class="btn ghost" data-code="${c.code}">Results</button>` : ""}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  // Attach simple click handlers
  tbody.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      showToast(`${btn.textContent} for ${btn.dataset.code}`);
    });
  });
}

// Filtering
function applyFilters() {
  const search = document.getElementById("searchInput").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const from = document.getElementById("dateFrom").value;
  const to = document.getElementById("dateTo").value;
  const durMin = Number(document.getElementById("durationMin").value) || 0;
  const durMax = Number(document.getElementById("durationMax").value) || Infinity;
  let filtered = contests.filter(c => {
    if (search && !c.code.toLowerCase().includes(search) && !c.name.toLowerCase().includes(search)) return false;
    if (status && c.status !== status) return false;
    if (from && new Date(c.start) < new Date(from)) return false;
    if (to && new Date(c.end) > new Date(to)) return false;
    if (c.duration < durMin || c.duration > durMax) return false;
    return true;
  });
  renderTable(filtered);
}

// Sorting
let sortKey = null;
let sortAsc = true;
function sortTable(key) {
  if (sortKey === key) {
    sortAsc = !sortAsc;
  } else {
    sortKey = key;
    sortAsc = true;
  }
  contests.sort((a, b) => {
    let av = a[key];
    let bv = b[key];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });
  // Update header classes
  document.querySelectorAll(".contestTable th").forEach(th => {
    th.classList.remove("sorted-asc", "sorted-desc");
    if (th.dataset.sort === key) {
      th.classList.add(sortAsc ? "sorted-asc" : "sorted-desc");
    }
  });
  applyFilters();
}

// Init
let contests = [];
document.addEventListener("DOMContentLoaded", () => {
  contests = loadContests();
  renderTable(contests);

  // Filter inputs
  document.getElementById("btnApply").addEventListener("click", applyFilters);
  document.getElementById("btnReset").addEventListener("click", () => {
    document.getElementById("searchInput").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("dateFrom").value = "";
    document.getElementById("dateTo").value = "";
    document.getElementById("durationMin").value = "";
    document.getElementById("durationMax").value = "";
    renderTable(contests);
  });

  // Sorting
  document.querySelectorAll(".contestTable th[data-sort]").forEach(th => {
    th.addEventListener("click", () => sortTable(th.dataset.sort));
  });

  // Refresh
  document.getElementById("btnRefresh").addEventListener("click", () => {
    contests = generateMockContests(); // re-generate for demo
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contests));
    applyFilters();
    showToast("Contest list refreshed");
  });

  // Create contest (placeholder)
  document.getElementById("btnCreate").addEventListener("click", () => {
    showToast("Create Contest feature coming soon");
  });
});
