window.showClubhouseScreen = function () {
    const clubhouseScreen = document.getElementById("clubhouseScreen");
    const roundDetailsScreen = document.getElementById("roundDetailsScreen");
    const appContainer = document.getElementById("appContainer");
    const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");
    const savedRoundsScreen = document.getElementById("savedRoundsScreen");
    const performanceChartsScreen = document.getElementById("performanceChartsScreen");
    const savedRoundsListScreen = document.getElementById("savedRoundsListScreen");

    if (roundDetailsScreen) roundDetailsScreen.style.display = "none";
    if (appContainer) appContainer.style.display = "none";
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.add("hidden");
    if (savedRoundsScreen) savedRoundsScreen.classList.add("hidden");
    if (performanceChartsScreen) performanceChartsScreen.classList.add("hidden");
    if (savedRoundsListScreen) savedRoundsListScreen.classList.add("hidden");
    if (clubhouseScreen) clubhouseScreen.classList.remove("hidden");

    const rounds = JSON.parse(localStorage.getItem("golfStatsCompletedRounds") || "[]");
    const lastRound = rounds[rounds.length - 1];

    if (!lastRound) return;

    const msgEl = document.getElementById("clubhouseMessage");
if (!msgEl || !lastRound) return;

const score = lastRound.summary?.totalScore ?? "--";
const vsPar = lastRound.summary?.vsPar ?? 0;
const fir = lastRound.summary?.firPct ?? "--";
const gir = lastRound.summary?.girPct ?? "--";
const putts = lastRound.summary?.totalPutts ?? "--";


// simple tone logic (safe)
let opener = "Nice work out there!";
if (vsPar < 0) opener = "Excellent round today.";
if (vsPar > 5) opener = "Good effort today — keep building.";

msgEl.innerHTML = `
<p class="clubhouse-center"><strong>${opener}</strong></p>

<p>
Your <strong>${lastRound.details?.courseName || "this course"}</strong> round shows:
</p>

<p>
You hit <strong>${lastRound.summary?.firPct ?? "--"}%</strong> of your fairways <br>and 
<strong>${lastRound.summary?.girPct ?? "--"}%</strong> of your greens in regulation.
</p>

<p>
You finished with <strong>${lastRound.summary?.totalPutts ?? "--"}</strong> putts and <br>a total score of 
<strong>${lastRound.summary?.totalScore ?? "--"}</strong>.
</p>

<p class="clubhouse-center">
<strong>Keep working, stay consistent, <br>keep the momentum going, and <br>we'll see you on the next round!</strong>
</p>
`;

    const courseNameEl = document.getElementById("clubhouseCourseName");
    const scoreEl = document.getElementById("clubhouseScore");
    const firEl = document.getElementById("clubhouseFIR");
    const girEl = document.getElementById("clubhouseGIR");
    const puttsEl = document.getElementById("clubhousePutts");

    if (courseNameEl) {
        courseNameEl.textContent = lastRound.details?.courseName || "Clubhouse";
    }

    if (scoreEl) {
        scoreEl.textContent = lastRound.summary?.totalScore ?? "--";
    }

    if (firEl) {
        firEl.textContent = lastRound.summary?.firPct ? `${lastRound.summary.firPct}%` : "--";
    }

    if (girEl) {
        girEl.textContent = lastRound.summary?.girPct ? `${lastRound.summary.girPct}%` : "--";
    }

    if (puttsEl) {
        puttsEl.textContent = lastRound.summary?.totalPutts ?? "--";
    }

    window.scrollTo(0, 0);
};

window.goToSummaryFromClubhouse = function () {
    const clubhouseScreen = document.getElementById("clubhouseScreen");
    const nineteenthHoleScreen = document.getElementById("nineteenthHoleScreen");

    if (clubhouseScreen) clubhouseScreen.classList.add("hidden");
    if (nineteenthHoleScreen) nineteenthHoleScreen.classList.remove("hidden");

    window.scrollTo(0, 0);
};

window.openClubhouseSummary = function () {

    const rounds = JSON.parse(localStorage.getItem("golfStatsCompletedRounds") || "[]");
    const lastRound = rounds[rounds.length - 1];

    if (!lastRound || !lastRound.holes) return;

    // Use your existing summary popup function
    if (typeof showSummaryForRound === "function") {
        showSummaryForRound(
            lastRound.holes,
            null,
            "clubhouse",
            lastRound.details?.courseName || ""
        );
    } else {
        console.warn("Summary function not found");
    }
};


window.startNewRoundFromClubhouse = function () {
    if (typeof resetCurrentRound === "function") {
        resetCurrentRound();
    }

    // go back to Round Details screen
    const clubhouse = document.getElementById("clubhouseScreen");
    const roundDetails = document.getElementById("roundDetailsScreen");

    if (clubhouse) clubhouse.classList.add("hidden");
    if (roundDetails) roundDetails.classList.remove("hidden");

    if (typeof updateRoundDetailCompletion === "function") {
        updateRoundDetailCompletion();
    }
};