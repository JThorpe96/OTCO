const form = document.getElementById("leadForm");
const status = document.getElementById("status");
const formLoadTime = Date.now();

// Replace with your deployed Google Apps Script Web App URL
const ENDPOINT = "https://script.google.com/macros/s/AKfycbxVNdSHKn55X6sQjR625r9p1Q4UbFNc0ZqJN4uwqzt5plaeEgk9kOPL6BNh-7us3RIhcg/exec";
const STORAGE_KEY = "offlineLeads";


function saveOffline(data) {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    existing.push({ ...data, timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}


async function sendLead(data) {
    return fetch(ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
    });
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
        status.textContent = "Thank you — we’ll be in touch soon.";
    } catch {
        saveOffline(data);
        status.textContent = "Saved offline — will submit shortly.";
    }
});


window.addEventListener("online", syncOfflineLeads);
syncOfflineLeads();