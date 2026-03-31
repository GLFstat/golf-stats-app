window.showClubhouseScreen = function () {
    const clubhouseScreen = document.getElementById("clubhouseScreen");
    const clubhouseMessage = document.getElementById("clubhouseMessage");

    const roundDetailsScreen = document.getElementById("roundDetailsScreen");
    const appContainer = document.getElementById("appContainer");
    const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");
    const savedRoundsScreen = document.getElementById("savedRoundsScreen");
    const performanceChartsScreen = document.getElementById("performanceChartsScreen");
    const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");

    if (!clubhouseScreen || !clubhouseMessage) {
        alert("Clubhouse screen elements were not found.");
        return;
    }

    let rounds = [];
    try {
        rounds = JSON.parse(localStorage.getItem("golfStatsCompletedRounds") || "[]");
    } catch (e) {
        rounds = [];
    }

    let lastRound = rounds.length ? rounds[rounds.length - 1] : null;

    // Fallback to active round if completed round is not available yet
    if (!lastRound) {
        try {
            lastRound = JSON.parse(localStorage.getItem("golfStatsActiveRound") || "null");
        } catch (e) {
            lastRound = null;
        }
    }

    // If still nothing, do NOT hide the current screen
    if (!lastRound) {
        alert("No round data was found for Clubhouse yet.");
        return;
    }

    if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
    if (savedRoundsScreen) savedRoundsScreen.classList.add("hidden");
    if (performanceChartsScreen) performanceChartsScreen.classList.add("hidden");
    if (savedRoundsListScreen) savedRoundsListScreen.classList.add("hidden");

    clubhouseScreen.classList.remove("hidden");
    clubhouseScreen.style.display = "flex";
    clubhouseScreen.style.opacity = "1";
    clubhouseScreen.style.visibility = "visible";

    const holes = Array.isArray(lastRound.holes)
        ? lastRound.holes.filter(h => h && h.saved)
        : [];

    const totalHoles = holes.length;

    const firOpportunities = holes.filter(h => Number(h.par) >= 4).length;
    const firMade = holes.filter(h => Number(h.par) >= 4 && h.fir).length;
    const fir = firOpportunities ? Math.round((firMade / firOpportunities) * 100) : "--";

    const girMade = holes.filter(h => h.gir).length;
    const gir = totalHoles ? Math.round((girMade / totalHoles) * 100) : "--";

    const putts = totalHoles
        ? holes.reduce((sum, h) => sum + Number(h.putts || 0), 0)
        : "--";

    const score = totalHoles
        ? holes.reduce((sum, h) => sum + Number(h.score || 0), 0)
        : "--";

    const coursePar =
        Number(lastRound.details?.coursePar || lastRound.coursePar || 0);

    const vsPar = coursePar && score !== "--" ? score - coursePar : 0;

    let opener = "Nice work out there!";
    if (vsPar < 0) opener = "Excellent round today.";
    if (vsPar > 5) opener = "Good effort today — keep building.";

    clubhouseMessage.innerHTML = `
        <p class="clubhouse-center"><strong>${opener}</strong></p>

        <p>
            Your round at <strong>${lastRound.details?.courseName || "this course"}</strong> shows:
        </p>

        <p>
            You found <strong>${fir}%</strong> of your fairways <br>and
            <strong>${gir}%</strong> of your greens in regulation.
        </p>

        <p>
            You took <strong>${putts}</strong> putts on your way to <br>a score of
            <strong>${score}</strong>.
        </p>

        <p class="clubhouse-center">
            <strong>Keep working, stay consistent, keep the momentum going, and we'll see you on the next round!</strong>
        </p>
    `;

    window.scrollTo(0, 0);
};

window.openClubhouseSummary = function () {
    const rounds = JSON.parse(localStorage.getItem("golfStatsCompletedRounds") || "[]");
    const lastRound = rounds[rounds.length - 1];

    if (!lastRound || !lastRound.holes) return;

    if (typeof showSummaryForRound === "function") {
        showSummaryForRound(
            lastRound.holes,
            null,
            "clubhouse",
            lastRound.details?.courseName || ""
        );
    }
};

window.startNewRoundFromClubhouse = function () {
    if (typeof resetCurrentRound === "function") {
        resetCurrentRound();
    }

    const clubhouse = document.getElementById("clubhouseScreen");
    const roundDetails = document.getElementById("roundDetailsScreen");

    if (clubhouse) clubhouse.classList.add("hidden");
    if (roundDetails) roundDetails.style.display = "flex";

    if (typeof updateRoundDetailCompletion === "function") {
        updateRoundDetailCompletion();
    }

    window.scrollTo(0, 0);
};

window.closeClubhouseScreen = function () {
    const clubhouse = document.getElementById("clubhouseScreen");
    const wrapUp = document.getElementById("nineteenthHoleScreen");

    if (clubhouse) clubhouse.classList.add("hidden");
    if (wrapUp) wrapUp.classList.remove("hidden");

    window.scrollTo(0, 0);
};





window.showClubhouseDoneScreen = function () {
    const clubhouse = document.getElementById("clubhouseScreen");
    const doneScreen = document.getElementById("clubhouseDoneScreen");
    const btn = document.getElementById("clubhouseDoneStartBtn");

    if (clubhouse) {
        clubhouse.style.transition = "opacity 2s ease";
        clubhouse.style.opacity = "0";
    }

    if (btn) {
        btn.style.opacity = "0";
    }

    setTimeout(() => {
        if (clubhouse) clubhouse.classList.add("hidden");

        if (doneScreen) {
            doneScreen.classList.remove("hidden");
            doneScreen.style.display = "flex";

            requestAnimationFrame(() => {
                doneScreen.classList.add("show");
            });
        }

        if (btn) {
            setTimeout(() => {
                btn.style.opacity = "1";
            }, 2000);
        }

        window.scrollTo(0, 0);
    }, 2000);
};

window.startNewRoundFromClubhouseDone = function () {
    const doneScreen = document.getElementById("clubhouseDoneScreen");

    if (doneScreen) {
        doneScreen.classList.remove("show");
        doneScreen.style.opacity = "0";
    }

    setTimeout(() => {
        if (doneScreen) {
            doneScreen.classList.add("hidden");
            doneScreen.style.display = "none";
        }

        if (typeof resetCurrentRound === "function") {
            resetCurrentRound();
        }

        const roundDetails = document.getElementById("roundDetailsScreen");
        if (roundDetails) roundDetails.style.display = "flex";

        window.scrollTo(0, 0);
    }, 800);
};