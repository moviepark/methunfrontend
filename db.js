const API_BASE = "/api";

/* ---------------- Auth helpers ---------------- */

function token() { return localStorage.getItem("token") || ""; }
function role() { return localStorage.getItem("domainRole") || "UNKNOWN"; }
function accountId() { return localStorage.getItem("accountId") || ""; }

function isAdmin() { return role() === "CAMPAIGN_DIRECTOR"; }
function isOrganizer() { return role() === "FIELD_ORGANIZER"; }
function isVolunteer() { return role() === "OUTREACH_VOLUNTEER"; }

function logout() {
    localStorage.clear();
    window.location.href = "../login/login.html";
}

function requireLogin() {
    if (!token()) {
        window.location.href = "../login/login.html";
        return false;
    }
    return true;
}

/* ---------------- Role-based UI ---------------- */

function applyRolePermissions() {
    const badge = document.getElementById("userBadge");
    badge.textContent = `${role()} • ID ${accountId() || "?"}`;
    if (isAdmin()) badge.classList.add("role-admin");

    // CAMPAIGN_DIRECTOR (admin) gets everything enabled.
    if (isAdmin()) return;

    // Field organizer: create on events/voters/shifts, no deletes.
    if (isOrganizer()) {
        disable(["events-delete", "voters-delete", "shifts-delete", "interactions-delete", "interactions-create"]);
    }

    // Outreach volunteer: only reserve shifts + log interactions.
    if (isVolunteer()) {
        disable([
            "events-create", "events-delete",
            "voters-create", "voters-delete",
            "shifts-create", "shifts-delete",
            "interactions-delete"
        ]);
    }
}

function disable(actions) {
    actions.forEach(action => {
        document.querySelectorAll(`[data-action="${action}"]`).forEach(btn => {
            btn.disabled = true;
            btn.title = "Your role does not have permission for this action.";
        });
    });
}

/* ---------------- Tabs ---------------- */

function setupTabs() {
    const buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
            document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
        });
    });
}

/* ---------------- API core ---------------- */

function pretty(data) {
    if (typeof data === "string") return data;
    return JSON.stringify(data, null, 2);
}

function showResult(data) {
    document.getElementById("result").textContent = pretty(data);
}

async function readResponse(response) {
    const text = await response.text();
    if (!text) return "";
    try { return JSON.parse(text); } catch (e) { return text; }
}

async function api(method, path, body) {
    if (!token()) {
        showResult("Please login first. No JWT token found.");
        return null;
    }

    const headers = { "Authorization": "Bearer " + token() };
    const options = { method, headers };

    if (body !== undefined && body !== null && method !== "GET" && method !== "DELETE") {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(API_BASE + path, options);
        const data = await readResponse(response);

        if (!response.ok) {
            showResult("HTTP " + response.status + "\n" + pretty(data));
            return null;
        }

        showResult(data === "" ? "Success. Server returned an empty response." : data);
        return data;

    } catch (error) {
        showResult("Network error: " + error.message);
        return null;
    }
}

/* ---------------- Table rendering ---------------- */

function renderTable(tableId, rows, columns, deleteAction) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    const list = Array.isArray(rows) ? rows : (rows ? [rows] : []);

    if (!list.length) {
        const colCount = table.querySelectorAll("thead th").length;
        tbody.innerHTML = `<tr><td colspan="${colCount}" class="empty">No records found.</td></tr>`;
        return;
    }

    list.forEach(item => {
        const tr = document.createElement("tr");
        const cells = columns.map(col => `<td>${escapeHtml(col.render(item))}</td>`).join("");
        tr.innerHTML = cells;
        tbody.appendChild(tr);
    });
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "—";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/* ---------------- EVENTS ---------------- */

async function eventsCreate() {
    const body = {
        eventTitle: val("ev_title"),
        eventType: val("ev_type"),
        location: val("ev_location"),
        scheduledDate: val("ev_date"),
        targetCapacity: Number(val("ev_capacity"))
    };

    if (!body.eventTitle || !body.location || !body.scheduledDate || !body.targetCapacity) {
        showResult("Please fill in all event fields before creating.");
        return;
    }

    const result = await api("POST", "/events", body);
    if (result) eventsGetAll();
}

async function eventsGetAll() {
    const data = await api("GET", "/events");
    if (data) {
        renderTable("ev_table", data, [
            { render: r => r.id ?? r.eventId },
            { render: r => r.eventTitle },
            { render: r => r.eventType },
            { render: r => r.location },
            { render: r => r.scheduledDate },
            { render: r => r.targetCapacity }
        ]);
    }
}

async function eventsGetById() {
    const id = val("ev_getid");
    if (!id) { showResult("Enter an Event ID first."); return; }
    await api("GET", "/events/" + id);
}

async function eventsDelete() {
    const id = val("ev_delid");
    if (!id) { showResult("Enter an Event ID to delete."); return; }
    if (!confirm("Delete event #" + id + "? This cannot be undone.")) return;
    const result = await api("DELETE", "/events/" + id);
    eventsGetAll();
}

/* ---------------- VOTERS ---------------- */

async function votersCreate() {
    const body = {
        firstName: val("v_first"),
        lastName: val("v_last"),
        electoralDistrict: val("v_district"),
        contactNumber: val("v_contact"),
        supportScore: Number(val("v_score")),
        engagementStatus: val("v_status")
    };

    if (!body.firstName || !body.lastName || !body.electoralDistrict) {
        showResult("Please fill in first name, last name and district.");
        return;
    }

    const result = await api("POST", "/voters", body);
    if (result) votersGetAll();
}

async function votersGetAll() {
    const data = await api("GET", "/voters");
    if (data) {
        renderTable("v_table", data, [
            { render: r => r.id ?? r.voterId },
            { render: r => [r.firstName, r.lastName].filter(Boolean).join(" ") },
            { render: r => r.electoralDistrict },
            { render: r => r.contactNumber },
            { render: r => r.supportScore },
            { render: r => r.engagementStatus }
        ]);
    }
}

async function votersGetById() {
    const id = val("v_getid");
    if (!id) { showResult("Enter a Voter ID first."); return; }
    await api("GET", "/voters/" + id);
}

async function votersDelete() {
    const id = val("v_delid");
    if (!id) { showResult("Enter a Voter ID to delete."); return; }
    if (!confirm("Delete voter #" + id + "? This cannot be undone.")) return;
    await api("DELETE", "/voters/" + id);
    votersGetAll();
}

/* ---------------- SHIFTS ---------------- */

async function shiftsCreate() {
    const body = {
        eventId: Number(val("s_eventid")),
        startTime: val("s_start"),
        endTime: val("s_end"),
        shiftStatus: val("s_status")
    };

    if (!body.eventId || !body.startTime || !body.endTime) {
        showResult("Please fill in event ID, start time and end time.");
        return;
    }

    const result = await api("POST", "/shifts", body);
    if (result) shiftsGetAll();
}

async function shiftsReserve() {
    const shiftId = val("s_reserveid");
    const accId = val("s_reserveacc");

    if (!shiftId || !accId) {
        showResult("Shift ID and Volunteer Account ID are both required.");
        return;
    }

    const result = await api("POST", "/shifts/" + shiftId + "/reserve?accountId=" + accId);
    if (result) shiftsGetAll();
}

async function shiftsGetAll() {
    const data = await api("GET", "/shifts");
    if (data) {
        renderTable("s_table", data, [
            { render: r => r.id ?? r.shiftId },
            { render: r => r.eventId },
            { render: r => r.startTime },
            { render: r => r.endTime },
            { render: r => r.shiftStatus }
        ]);
    }
}

async function shiftsGetById() {
    const id = val("s_getid");
    if (!id) { showResult("Enter a Shift ID first."); return; }
    await api("GET", "/shifts/" + id);
}

async function shiftsDelete() {
    const id = val("s_delid");
    if (!id) { showResult("Enter a Shift ID to delete."); return; }
    if (!confirm("Delete shift #" + id + "? This cannot be undone.")) return;
    await api("DELETE", "/shifts/" + id);
    shiftsGetAll();
}

/* ---------------- INTERACTIONS ---------------- */

async function interactionsCreate() {
    const body = {
        voterId: Number(val("i_voterid")),
        volunteerId: Number(val("i_volid")),
        interactionChannel: val("i_channel"),
        sentimentDetected: val("i_sentiment"),
        policyIssueTag: val("i_tag"),
        interactionNotes: val("i_notes")
    };

    if (!body.voterId || !body.volunteerId) {
        showResult("Voter ID and Volunteer ID are required.");
        return;
    }

    const result = await api("POST", "/interactions/log", body);
    if (result) interactionsGetAll();
}

async function interactionsGetAll() {
    const data = await api("GET", "/interactions");
    if (data) {
        renderTable("i_table", data, [
            { render: r => r.id ?? r.interactionId },
            { render: r => r.voterId },
            { render: r => r.volunteerId },
            { render: r => r.interactionChannel },
            { render: r => r.sentimentDetected },
            { render: r => r.policyIssueTag }
        ]);
    }
}

async function interactionsGetById() {
    const id = val("i_getid");
    if (!id) { showResult("Enter an Interaction ID first."); return; }
    await api("GET", "/interactions/" + id);
}

async function interactionsDelete() {
    const id = val("i_delid");
    if (!id) { showResult("Enter an Interaction ID to delete."); return; }
    if (!confirm("Delete interaction #" + id + "? This cannot be undone.")) return;
    await api("DELETE", "/interactions/" + id);
    interactionsGetAll();
}

/* ---------------- Utilities & wiring ---------------- */

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

const actionMap = {
    "events-create": eventsCreate,
    "events-getall": eventsGetAll,
    "events-getid": eventsGetById,
    "events-delete": eventsDelete,

    "voters-create": votersCreate,
    "voters-getall": votersGetAll,
    "voters-getid": votersGetById,
    "voters-delete": votersDelete,

    "shifts-create": shiftsCreate,
    "shifts-reserve": shiftsReserve,
    "shifts-getall": shiftsGetAll,
    "shifts-getid": shiftsGetById,
    "shifts-delete": shiftsDelete,

    "interactions-create": interactionsCreate,
    "interactions-getall": interactionsGetAll,
    "interactions-getid": interactionsGetById,
    "interactions-delete": interactionsDelete
};

document.addEventListener("DOMContentLoaded", () => {
    if (!requireLogin()) return;

    applyRolePermissions();
    setupTabs();

    document.querySelectorAll("[data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
            const fn = actionMap[btn.dataset.action];
            if (fn) fn();
        });
    });

    document.getElementById("logoutBtn").addEventListener("click", logout);
    document.getElementById("clearResult").addEventListener("click", () => showResult("Cleared."));

    // Preload the first tab's data automatically.
    eventsGetAll();
});
