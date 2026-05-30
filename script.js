/* ===========================================================
   Of The Century Occasions — "The Editorial"
   Lead capture (Google Apps Script), announcement bar, reveals.
   =========================================================== */

const form = document.getElementById("leadForm");
const status = document.getElementById("status");
const formLoadTime = Date.now();

// Deployed Google Apps Script Web App URL
const ENDPOINT = "https://script.google.com/macros/s/AKfycbxVNdSHKn55X6sQjR625r9p1Q4UbFNc0ZqJN4uwqzt5plaeEgk9kOPL6BNh-7us3RIhcg/exec";
const STORAGE_KEY = "offlineLeads";

function saveOffline(data) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  existing.push({ ...data, timestamp: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

async function sendLead(data) {
  const formBody = new URLSearchParams(data);
  const response = await fetch(ENDPOINT, { method: "POST", body: formBody });
  const text = await response.text();
  console.log("Server response:", text);
  return text;
}

async function syncOfflineLeads() {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (!stored.length) return;

  for (const lead of stored) {
    try {
      await sendLead(lead);
    } catch {
      return; // still offline
    }
  }

  localStorage.removeItem(STORAGE_KEY);
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Submitting…";

    const data = Object.fromEntries(new FormData(form));

    // Honeypot check
    if (data.company) {
      status.textContent = "Submission blocked.";
      return;
    }

    if (Date.now() - formLoadTime < 3000) {
      status.textContent = "Please take a moment before submitting.";
      return;
    }

    if (!navigator.onLine) {
      saveOffline(data);
      form.reset();
      status.textContent = "Saved offline — will submit when online.";
      return;
    }

    try {
      await sendLead(data);
      form.reset();
      status.textContent = "Thank you — I'll be in touch very soon.";
    } catch {
      saveOffline(data);
      status.textContent = "Saved offline — will submit shortly.";
    }
  });
}

// Dismissible announcement bar
const annClose = document.getElementById("annClose");
if (annClose) {
  annClose.addEventListener("click", () => {
    const ann = document.getElementById("ann");
    if (ann) ann.style.display = "none";
  });
}

// Robust scroll reveal: any element whose top enters the lower 90% of the
// viewport (or has been scrolled past) gets revealed.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const els = [].slice.call(document.querySelectorAll(".reveal"));
  if (reduce) { els.forEach((el) => el.classList.add("in")); return; }
  function tick() {
    const vh = window.innerHeight;
    for (let i = els.length - 1; i >= 0; i--) {
      const el = els[i];
      if (el.getBoundingClientRect().top < vh * 0.9) {
        el.classList.add("in");
        els.splice(i, 1);
      }
    }
  }
  window.addEventListener("scroll", tick, { passive: true });
  window.addEventListener("resize", tick);
  window.addEventListener("load", tick);
  tick();
})();

// Sync any offline leads on load and when connectivity returns
window.addEventListener("online", syncOfflineLeads);
syncOfflineLeads();
