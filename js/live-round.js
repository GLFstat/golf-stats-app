(function () {
  const LIVE_TABLE = "live_round_status";
  const LIVE_SESSION_KEY = "golfStatsLiveSessionId";

  function getSupabaseClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.sb) return window.sb;
    if (window.supabase && typeof window.supabase.from === "function") return window.supabase;
    return null;
  }

  function makeSessionId() {
    return "live_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function getOrCreateSessionId() {
    let id = localStorage.getItem(LIVE_SESSION_KEY);
    if (!id) {
      id = makeSessionId();
      localStorage.setItem(LIVE_SESSION_KEY, id);
    }
    return id;
  }

  function clearLiveSessionId() {
    localStorage.removeItem(LIVE_SESSION_KEY);
  }

  function safeNum(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

    function getSavedHoles() {
    const liveHoles = Array.isArray(window.holes)
      ? window.holes
      : (typeof holes !== "undefined" && Array.isArray(holes) ? holes : []);

    return liveHoles.filter(h => h && h.saved);
  }

    function buildHolePayload() {
    const liveHoles = Array.isArray(window.holes)
      ? window.holes
      : (typeof holes !== "undefined" && Array.isArray(holes) ? holes : []);

    if (!Array.isArray(liveHoles)) return [];

    return liveHoles.map((hole, index) => ({
      holeNumber: index + 1,
      saved: !!hole?.saved,
      score: hole?.score ?? null,
      putts: hole?.putts ?? null,
      fir: !!hole?.fir,
      gir: !!hole?.gir,
      updown: !!hole?.updown
    }));
  }

    function buildSnapshot() {
    const details =
      typeof getRoundDetails === "function"
        ? getRoundDetails()
        : (window.roundDetails || {});

    const liveCurrentHole =
      typeof currentHole !== "undefined"
        ? currentHole
        : (window.currentHole || 1);

    const savedHoles = getSavedHoles();

    let totalScore = 0;
    let totalPutts = 0;
    let totalFir = 0;
    let totalGir = 0;
    let totalUpDowns = 0;

    savedHoles.forEach(hole => {
      totalScore += safeNum(hole.score);
      totalPutts += safeNum(hole.putts);
      if (hole.fir) totalFir += 1;
      if (hole.gir) totalGir += 1;
      if (hole.updown) totalUpDowns += 1;
    });

    return {
      session_id: getOrCreateSessionId(),
      player_name: details.playerName || "",
      course_name: details.courseName || "",
      round_date: details.roundDate || new Date().toISOString().slice(0, 10),
      current_hole: safeNum(liveCurrentHole, 1),
      holes_completed: savedHoles.length,
      total_score: totalScore,
      total_putts: totalPutts,
      total_fir: totalFir,
      total_gir: totalGir,
      total_up_downs: totalUpDowns,
      status: "active",
      holes_json: buildHolePayload(),
      last_update: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
  }

  async function sendLiveRound(status = "active") {
    const client = getSupabaseClient();
    if (!client) {
      console.warn("No Supabase client found for live round updates.");
      return;
    }

    const payload = buildSnapshot();
    payload.status = status;

    if (status === "finished") {
      payload.current_hole = 18;
    }

    const { error } = await client
      .from(LIVE_TABLE)
      .upsert(payload, { onConflict: "session_id" });

    if (error) {
      console.error("Live round update failed:", error);
    } else {
      console.log("Live round sent:", payload);
    }
  }

  async function deleteLiveRound() {
    const client = getSupabaseClient();
    if (!client) {
      clearLiveSessionId();
      return;
    }

    const sessionId = localStorage.getItem(LIVE_SESSION_KEY);
    if (!sessionId) return;

    const { error } = await client
      .from(LIVE_TABLE)
      .delete()
      .eq("session_id", sessionId);

    if (error) {
      console.error("Live round delete failed:", error);
    } else {
      console.log("Live round deleted.");
    }

    clearLiveSessionId();
  }

   window.startLiveRoundTracking = function () {
    sendLiveRound("active");
  };

  window.updateLiveRoundTracking = function () {
    sendLiveRound("active");
  };

  window.finishLiveRoundTracking = function () {
    sendLiveRound("finished");
  };

  window.deleteLiveRoundTracking = function () {
    deleteLiveRound();
  };

  window.clearLiveSessionId = clearLiveSessionId;
})();