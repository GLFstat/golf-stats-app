const SUPABASE_URL = "https://xncgytnnekaytqmypdqv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_UiLB55XsY_iD9m_wUNlSwA_UEjBa5fR";

const portalSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listEl = document.getElementById("liveRoundsList");
const detailsEl = document.getElementById("roundDetails");
const refreshBtn = document.getElementById("refreshBtn");
const clearFinishedBtn = document.getElementById("clearFinishedBtn");
const clearLiveBtn = document.getElementById("clearLiveBtn");
const maintenanceStatsEl = document.getElementById("maintenanceStats");
const logoutBtn = document.getElementById("logoutBtn");

let currentRounds = [];

if (refreshBtn) {
  refreshBtn.addEventListener("click", loadLiveRounds);
}

if (clearFinishedBtn) {
  clearFinishedBtn.addEventListener("click", clearFinished);
}

if (clearLiveBtn) {
  clearLiveBtn.addEventListener("click", clearLiveSnapshots);
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    alert("Logout can be wired later.");
  });
}

async function loadLiveRounds() {
  listEl.innerHTML = "Loading...";

  const { data, error } = await portalSupabase
    .from("live_round_status")
    .select("*")
    .order("last_update", { ascending: false });

  if (error) {
    console.error("Error loading live rounds:", error);
    listEl.innerHTML = `<div style="padding:16px;">Error loading rounds.</div>`;
    detailsEl.innerHTML = `<div class="live-round-content empty">Error loading round details.</div>`;
    maintenanceStatsEl.textContent = "Records: error";
    return;
  }

  currentRounds = data || [];
  renderCompletedRounds(currentRounds);
  renderMaintenanceStats(currentRounds);

  if (currentRounds.length > 0) {
    showDetails(currentRounds[0]);
  } else {
    detailsEl.innerHTML = `<div class="live-round-content empty">No live round snapshots found.</div>`;
  }
}

function renderCompletedRounds(rounds) {
  if (!rounds.length) {
    listEl.innerHTML = `<div style="padding:16px 20px;">No rounds found.</div>`;
    return;
  }

  let html = `
    <table class="rounds-table">
      <thead>
        <tr>
          <th>Course</th>
          <th>Date</th>
          <th>Score</th>
          <th>Test</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
  `;

  rounds.forEach((round) => {
    const scoreText = formatScore(round.total_score);
    const dateText = formatDate(round.round_date);
    const isTest = isTestRound(round);

    html += `
      <tr>
        <td>${escapeHtml(round.course_name || "Unknown Course")}</td>
        <td>${escapeHtml(dateText)}</td>
        <td>${escapeHtml(scoreText)}</td>
        <td>${isTest ? `<span class="check-mark">✓</span>` : ``}</td>
        <td>
          <button class="round-action-btn" type="button" onclick="deleteRound('${round.session_id}')">
            Delete
          </button>
        </td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  listEl.innerHTML = html;
}

function showDetails(round) {
  const holes = Array.isArray(round.holes_json) ? round.holes_json : [];
  const holeDisplay = round.current_hole || holes.filter(h => h.saved).length || 0;
  const lastUpdated = formatDateTime(round.last_update);

  let holesHtml = `<div class="holes-grid">`;

  // ===== HOLE TILE DISPLAY (vs PAR) =====
holes.forEach((h) => {
  let display = "-";

  if (h && h.saved && h.score != null) {
    const par = h.par || 4; // fallback for now
    const vsPar = h.score - par;

    display = vsPar === 0
      ? "E"
      : vsPar > 0
        ? `+${vsPar}`
        : `${vsPar}`;
  }

  holesHtml += `
    <div class="hole ${h.saved ? "saved" : ""}">
      <div class="hole-number"><strong>${h.holeNumber ?? "-"}</strong></div>
      <div class="hole-score">${display}</div>
    </div>
  `;
});

  holesHtml += `</div>`;

  detailsEl.innerHTML = `
    <div class="live-player-row">
      <div>
        <div class="live-player-name">${escapeHtml(round.player_name || "Player")}</div>
        <div class="live-course-name">${escapeHtml(round.course_name || "Unknown Course")}</div>
      </div>

      <div class="live-hole-box">
        <div class="live-hole-number">${escapeHtml(String(holeDisplay))}</div>
        <div class="live-hole-of">of 18</div>
      </div>
    </div>
    
    <div class="live-stats-list">
      <div class="live-stat-line total-score-line">
        <strong>Total Score:</strong>
        <span class="total-score-value">
          ${escapeHtml(String(round.total_score ?? 0))} (${escapeHtml(formatScore((round.total_score ?? 0) - ((round.holes_completed ?? 0) * 4), true))} thru ${escapeHtml(String(round.holes_completed ?? 0))})
        </span>
      </div>
      <div class="live-stat-line"><strong>Total Putts:</strong> ${escapeHtml(String(round.total_putts ?? 0))} (thru ${escapeHtml(String(round.holes_completed ?? 0))})</div>
      <div class="live-stat-line"><strong>FIR:</strong> ${escapeHtml(String(round.total_fir ?? 0))} (${escapeHtml(String(round.holes_completed ? Math.round(((round.total_fir ?? 0) / round.holes_completed) * 100) : 0))}% thru ${escapeHtml(String(round.holes_completed ?? 0))})</div>
      <div class="live-stat-line"><strong>GIR:</strong> ${escapeHtml(String(round.total_gir ?? 0))} (${escapeHtml(String(round.holes_completed ? Math.round(((round.total_gir ?? 0) / round.holes_completed) * 100) : 0))}% thru ${escapeHtml(String(round.holes_completed ?? 0))})</div>
      <div class="live-stat-line"><strong>Up & Downs:</strong> ${escapeHtml(String(round.total_up_downs ?? 0))}</div>
      <div class="live-stat-line"><strong>Status:</strong> ${escapeHtml(round.status || "active")}</div>
    </div>

    ${holesHtml}

    <div class="live-footer-row">
      <div class="last-updated">Last updated: ${escapeHtml(lastUpdated)}</div>
      <button class="refresh-main-btn" type="button" onclick="loadLiveRounds()">Refresh</button>
    </div>
  `;
}

function renderMaintenanceStats(rounds) {
  const testCount = rounds.filter(isTestRound).length;
  maintenanceStatsEl.textContent = `Records: ${rounds.length} total, ${testCount} test round(s)`;
}

function formatScore(score, withPlus = false) {
  const num = Number(score);

  if (!Number.isFinite(num)) return "--";
  if (num === 0) return withPlus ? "E" : "EVEN";
  if (num > 0) return `+${num}`;
  return String(num);
}

function formatDate(value) {
  if (!value) return "--";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "--";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function isTestRound(round) {
  const course = (round.course_name || "").toLowerCase();
  const player = (round.player_name || "").toLowerCase();
  return course.includes("test") || player.includes("test");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function clearFinished() {
  const confirmed = confirm("Delete all test rounds?");
  if (!confirmed) return;

  const testRounds = currentRounds.filter(isTestRound).map(round => round.session_id);

  if (!testRounds.length) {
    alert("No test rounds found.");
    return;
  }

  const { error } = await portalSupabase
    .from("live_round_status")
    .delete()
    .in("session_id", testRounds);

  if (error) {
    console.error("Error deleting test rounds:", error);
    alert("Could not delete test rounds.");
    return;
  }

  loadLiveRounds();
}

async function clearLiveSnapshots() {
  const confirmed = confirm("Clear all live round snapshots?");
  if (!confirmed) return;

  const { error } = await portalSupabase
    .from("live_round_status")
    .delete()
    .neq("session_id", "");

  if (error) {
    console.error("Error clearing live snapshots:", error);
    alert("Could not clear live snapshots.");
    return;
  }

  loadLiveRounds();
}

async function deleteRound(sessionId) {
  const confirmed = confirm("Delete this round?");
  if (!confirmed) return;

  const { error } = await portalSupabase
    .from("live_round_status")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    console.error("Error deleting round:", error);
    alert("Could not delete round.");
    return;
  }

  loadLiveRounds();
}

window.loadLiveRounds = loadLiveRounds;
window.deleteRound = deleteRound;

loadLiveRounds();

// Auto refresh every 5 seconds
setInterval(() => {
  loadLiveRounds();
}, 5000);