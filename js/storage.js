function getRoundTotalPutts() {
    return holes.reduce((sum, h) => {
        return sum + ((h && h.saved) ? Number(h.putts || 0) : 0);
    }, 0);
}

// ===== Storage Helpers =====
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error("Storage save failed:", e);
        return false;
    }
}

function loadFromStorage(key, fallback = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.error("Storage load failed:", e);
        return fallback;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error("Storage remove failed:", e);
    }
}

function initializeAppStorage() {
    try {
        const version = Number(localStorage.getItem(APP_VERSION_KEY) || 0);

        if (!localStorage.getItem(COMPLETED_ROUNDS_KEY)) {
            saveToStorage(COMPLETED_ROUNDS_KEY, []);
        }

        if (version < CURRENT_DATA_VERSION) {
            localStorage.setItem(APP_VERSION_KEY, String(CURRENT_DATA_VERSION));
        }
    } catch (e) {
        console.error("Storage init failed:", e);
    }
}

// ===== Completed Round History =====
function getCompletedRounds() {
    const rounds = loadFromStorage(COMPLETED_ROUNDS_KEY, []);
    return Array.isArray(rounds) ? rounds : [];
}

function saveCompletedRounds(rounds) {
    const trimmed = Array.isArray(rounds) ? rounds.slice(0, MAX_COMPLETED_ROUNDS) : [];
    return saveToStorage(COMPLETED_ROUNDS_KEY, trimmed);
}

function addCompletedRound(round) {
    const rounds = getCompletedRounds();
    rounds.unshift(round);
    return saveCompletedRounds(rounds);
}

function generateRoundId() {
    return `round_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSavedHoleCount() {
    return holes.filter(h => h && h.saved).length;
}

function buildCompletedRound() {
    return {
        id: generateRoundId(),
        date: new Date().toISOString(),
        version: CURRENT_DATA_VERSION,
        details: {
            roundDate: getFieldValue("roundDate"),
            roundType: getFieldValue("roundType"),
            courseName: getFieldValue("courseName"),
            startingHole: getFieldValue("startingHole"),
            teeSlope: getFieldValue("teeSlope"),
            teeRating: getFieldValue("teeRating"),
            teeYardage: getFieldValue("teeYardage"),
            frontPar: getFieldValue("frontPar"),
            backPar: getFieldValue("backPar"),
            coursePar: getFieldValue("coursePar")
        },
        holes: holes.map((h, idx) => {
            if (!h) {
                return {
                    hole: idx + 1,
                    fir: false,
                    gir: false,
                    updown: false,
                    sand: false,
                    putts: 0,
                    penalty: 0,
                    score: 0,
                    par: null,
                    saved: false
                };
            }

            return {
                hole: idx + 1,
                fir: !!h.fir,
                gir: !!h.gir,
                updown: !!h.updown,
                sand: !!h.sand,
                putts: Number(h.putts || 0),
                penalty: Number(h.penalty || 0),
                score: Number(h.score || 0),
                par: h.par == null ? null : Number(h.par),
                saved: !!h.saved
            };
        })
    };
}

function archiveCompletedRound() {
    if (!roundJustCompleted || getSavedHoleCount() !== 18) {
        return true;
    }

    if (roundFinalized) {
        return true;
    }

    roundFinalized = true;

    const round = buildCompletedRound();
    round.roundFinalized = true;

    const saved = addCompletedRound(round);

    if (!saved) {
        alert("Could not save round history.");
        roundFinalized = false;
        return false;
    }

    removeFromStorage(STORAGE_KEY);
    removeFromStorage(ROUND_BG_INDEX_KEY);

    // IMPORTANT:
    // Do not clear post-round navigation flags here.
    // The app still needs them so the user can move between
    // Round Details, Round Complete, and 19th Hole normally.
    // These should be cleared later when a new round starts.

    return true;
}

function finalizeCompletedRoundIfNeeded() {
    if (!roundJustCompleted) return true;
    return archiveCompletedRound();
}

function clearActiveRoundStorage() {
    removeFromStorage(STORAGE_KEY);
    removeFromStorage(ROUND_BG_INDEX_KEY);
    roundFinalized = false;
}

function getParsedActiveRound() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch (err) {
        console.error("Failed to parse active round:", err);
        clearActiveRoundStorage();
        return null;
    }
}

function hasResumableRoundData(saved) {
    if (!saved || typeof saved !== "object") return false;

    if (saved.roundFinalized) return false;

    const savedHoles = Array.isArray(saved.holes) ? saved.holes : [];
    const savedRoundDetails = saved.roundDetails || {};

    const hasSavedHoles = savedHoles.some(h => h && h.saved);
    const hasAnyRoundDetails = hasMeaningfulRoundDetails(savedRoundDetails);

    return hasSavedHoles || hasAnyRoundDetails || !!saved.roundJustCompleted;
}

function persistActiveRound() {
    const roundDetails = getRoundDetails();

    const hasSavedHoles = holes.some(h => h && h.saved);
    const hasAnyRoundDetails = hasMeaningfulRoundDetails(roundDetails);

    if (!hasSavedHoles && !hasAnyRoundDetails && !roundStarted && !roundJustCompleted && !postRoundMode) {
        clearActiveRoundStorage();
        updateResumePanel();
        return;
    }

    const payload = {
        roundStarted,
        roundFinalized,
        currentHole,
        currentHoleIndex,
        startingHole,
        playOrder,
        holes,
        roundDetails,
        soundOn,
        roundJustCompleted,
        postRoundMode,
        postRoundReturnTarget,
        lastUpdated: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    updateResumePanel();
}

function saveActiveRound() {
    persistActiveRound();
}

function applyLoadedRound(saved) {
    const savedHoles = Array.isArray(saved.holes) ? saved.holes : [];
    const savedRoundDetails = saved.roundDetails || {};

    roundStarted = !!saved.roundStarted;
    roundFinalized = !!saved.roundFinalized;
    roundJustCompleted = !!saved.roundJustCompleted;
    postRoundMode = !!saved.postRoundMode;
    postRoundReturnTarget = String(saved.postRoundReturnTarget || "");

    currentHole = Number(saved.currentHole) || 1;
    currentHoleIndex = Number(saved.currentHoleIndex) || 0;
    startingHole = Number(saved.startingHole) || 1;

    playOrder = Array.isArray(saved.playOrder) && saved.playOrder.length === 18
        ? saved.playOrder
        : buildPlayOrder(startingHole);

    for (let i = 0; i < 18; i++) {
        holes[i] = savedHoles[i] || null;
    }

    setRoundDetails(savedRoundDetails);

    if (typeof saved.soundOn === "boolean") {
        soundOn = saved.soundOn;
        if (speakerToggle) {
            speakerToggle.textContent = soundOn ? "🔊" : "🔇";
        }
    }

    if (currentHoleIndex < 0 || currentHoleIndex > 17) {
        currentHoleIndex = 0;
    }

    syncCurrentHoleFromIndex();
    updatePostRoundUI();
}

function loadActiveRoundIfPresent() {
    const saved = getParsedActiveRound();

    if (!saved || !hasResumableRoundData(saved)) {
        clearActiveRoundStorage();
        updateResumePanel();
        return false;
    }

    applyLoadedRound(saved);
    updateResumePanel();
    return true;
}

function checkForActiveRoundOnLoad() {
    const saved = getParsedActiveRound();

    if (!saved) {
        updateResumePanel();
        return;
    }

    if (!hasResumableRoundData(saved)) {
        clearActiveRoundStorage();
        updateResumePanel();
        return;
    }

    updateResumePanel();
}