let currentHole = 1;
let roundData = [];

let currentStats = {
    fir: null,
    gir: null,
    updown: null
};

function setStat(stat, value) {
    currentStats[stat] = value;
}

function saveHole() {
    const putts = document.getElementById("putts").value;

    if (putts === "") {
        alert("Please enter number of putts.");
        return;
    }

    const holeData = {
        hole: currentHole,
        fir: currentStats.fir,
        gir: currentStats.gir,
        updown: currentStats.updown,
        putts: parseInt(putts)
    };

    roundData.push(holeData);

    document.getElementById("message").innerText = 
        "✅ Hole " + currentHole + " saved!";

}

function nextHole() {
    if (roundData.length < currentHole) {
        alert("Please save the hole first.");
        return;
    }

    currentHole++;
    currentStats = { fir: null, gir: null, updown: null };
    document.getElementById("putts").value = "";
    document.getElementById("holeNumber").innerText = "Hole #" + currentHole;
    document.getElementById("message").innerText = "";
}

function viewSummary() {
    let summaryText = "Round Summary:\n\n";

    roundData.forEach(hole => {
        summaryText += 
            "Hole " + hole.hole +
            " | FIR: " + hole.fir +
            " | GIR: " + hole.gir +
            " | Putts: " + hole.putts +
            " | Up&Down: " + hole.updown +
            "\n";
    });

    alert(summaryText);
}
