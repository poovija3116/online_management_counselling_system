// ============================================================
// GCE ERODE - COUNSELLOR DASHBOARD
// ============================================================

console.log("COUNSELLOR DASHBOARD RUNNING");

const API_BASE_URL = "http://localhost:5000";


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("counsellorToken")
    );

}


// ============================================================
// AUTHENTICATION
// ============================================================

function checkAuthentication() {

    const token = getToken();

    if (!token) {

        alert("Please login as counsellor.");

        window.location.href = "login.html";

        return false;

    }

    return true;

}


// ============================================================
// HEADERS
// ============================================================

function getHeaders() {

    return {

        "Content-Type": "application/json",

        "Authorization": `Bearer ${getToken()}`

    };

}


// ============================================================
// CHECK WHETHER ALL COUNSELLING ROUNDS ARE COMPLETED
// ============================================================

async function checkAllRoundsCompleted() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/rounds`,
            {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store"
            }
        );


        const data = await response.json();


        console.log(
            "ALL COUNSELLING ROUNDS:",
            data
        );


        // --------------------------------------------------------
        // If API fails, do not show completed screen
        // --------------------------------------------------------

        if (!response.ok || !data.success) {

            return false;

        }


        // --------------------------------------------------------
        // Get rounds
        // --------------------------------------------------------

        const rounds = Array.isArray(data.rounds)
            ? data.rounds
            : [];


        // --------------------------------------------------------
        // No rounds configured
        // --------------------------------------------------------
        //
        // IMPORTANT:
        // No rounds does NOT mean counselling completed.
        //

        if (rounds.length === 0) {

            return false;

        }


        // --------------------------------------------------------
        // Check every configured round
        // --------------------------------------------------------

        const allCompleted =
            rounds.every(round => {

                return (
                    String(
                        round.status || ""
                    ).toLowerCase() === "completed"
                );

            });


        return allCompleted;

    }

    catch (error) {

        console.error(
            "CHECK ALL ROUNDS ERROR:",
            error
        );

        return false;

    }

}


// ============================================================
// SHOW FINAL COUNSELLING COMPLETED SCREEN
// ============================================================

function showCompletedScreen() {

    const normalDashboard =
        document.getElementById(
            "normalDashboard"
        );


    const completedScreen =
        document.getElementById(
            "completedScreen"
        );


    // --------------------------------------------------------
    // Hide normal dashboard
    // --------------------------------------------------------

    if (normalDashboard) {

        normalDashboard.style.display =
            "none";

    }


    // --------------------------------------------------------
    // Show completed screen
    // --------------------------------------------------------

    if (completedScreen) {

        completedScreen.style.display =
            "block";

    }

}


// ============================================================
// SHOW NORMAL COUNSELLOR DASHBOARD
// ============================================================

function showNormalDashboard() {

    const normalDashboard =
        document.getElementById(
            "normalDashboard"
        );


    const completedScreen =
        document.getElementById(
            "completedScreen"
        );


    // --------------------------------------------------------
    // Show normal dashboard
    // --------------------------------------------------------

    if (normalDashboard) {

        normalDashboard.style.display =
            "";

    }


    // --------------------------------------------------------
    // Hide completed screen
    // --------------------------------------------------------

    if (completedScreen) {

        completedScreen.style.display =
            "none";

    }

}


// ============================================================
// LOAD CURRENT ROUND
// ============================================================

async function loadCurrentRound() {

    try {

        // --------------------------------------------------------
        // Check whether ALL configured rounds are completed
        // --------------------------------------------------------

        const allRoundsCompleted =
            await checkAllRoundsCompleted();


        // --------------------------------------------------------
        // ALL ROUNDS COMPLETED
        // --------------------------------------------------------

        if (allRoundsCompleted) {

            showCompletedScreen();

            return;

        }


        // --------------------------------------------------------
        // Counselling is not completely finished
        // Keep normal dashboard visible
        // --------------------------------------------------------

        showNormalDashboard();


        const response = await fetch(
            `${API_BASE_URL}/api/rounds/current`,
            {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store"
            }
        );


        const data = await response.json();


        console.log(
            "CURRENT ROUND:",
            data
        );


        if (
            !response.ok ||
            !data.success ||
            !data.round
        ) {

            showNoCounselling();

            return;

        }


        const round = data.round;


        displayRound(round);

    }

    catch (error) {

        console.error(
            "CURRENT ROUND ERROR:",
            error
        );

        showNoCounselling();

    }

}


// ============================================================
// DISPLAY ROUND
// ============================================================

function displayRound(round) {

    const status = String(
        round.status || ""
    ).toLowerCase();


    // ========================================================
    // CURRENT ROUND
    // ========================================================

    const currentRoundElement =
        document.getElementById(
            "currentRound"
        );


    if (currentRoundElement) {

        currentRoundElement.textContent =
            `ROUND ${String(
                round.round_number
            ).padStart(2, "0")}`;

    }


    // ========================================================
    // ELIGIBLE RANK
    // ========================================================

    const eligibleRankElement =
        document.getElementById(
            "eligibleRank"
        );


    if (eligibleRankElement) {

        eligibleRankElement.textContent =
            `${round.min_rank} – ${round.max_rank}`;

    }


    // ========================================================
    // COUNSELLING STATUS
    // ========================================================

    let statusText =
        "COUNSELLING STATUS";


    let description =
        "Current counselling status loaded.";


    let choiceStatus =
        "NOT STARTED";


    switch (status) {


        // ----------------------------------------------------
        // NOT STARTED
        // ----------------------------------------------------

        case "not_started":

            statusText =
                "COUNSELLING NOT STARTED";


            description =
                "The current round has not started yet.";


            choiceStatus =
                "NOT STARTED";


            break;


        // ----------------------------------------------------
        // CHOICE FILLING OPEN
        // ----------------------------------------------------

        case "preference_open":

            statusText =
                "COUNSELLING IS RUNNING";


            description =
                "Choice filling is currently open for eligible students.";


            choiceStatus =
                "OPEN";


            break;


        // ----------------------------------------------------
        // PREFERENCES LOCKED
        // ----------------------------------------------------

        case "preferences_locked":

            statusText =
                "COUNSELLING IS RUNNING";


            description =
                "Choice filling has been closed. Preferences are locked.";


            choiceStatus =
                "LOCKED";


            break;


        // ----------------------------------------------------
        // ALLOTMENT COMPLETED
        // ----------------------------------------------------

        case "allotment_completed":

            statusText =
                "COUNSELLING IS RUNNING";


            description =
                "Allotment for this round has been completed.";


            choiceStatus =
                "LOCKED";


            break;


        // ----------------------------------------------------
        // PAYMENT PERIOD
        // ----------------------------------------------------

        case "payment_period":

            statusText =
                "COUNSELLING IS RUNNING";


            description =
                "Payment period is currently active for allotted students.";


            choiceStatus =
                "COMPLETED";


            break;


        // ----------------------------------------------------
        // COMPLETED
        // ----------------------------------------------------

        case "completed":

            statusText =
                "ROUND COMPLETED";


            description =
                "This counselling round has been completed.";


            choiceStatus =
                "COMPLETED";


            break;


        // ----------------------------------------------------
        // OTHER STATUS
        // ----------------------------------------------------

        default:

            statusText =
                "COUNSELLING STATUS";


            description =
                "Current counselling status loaded.";


            choiceStatus =
                status || "NOT STARTED";


            break;

    }


    // ========================================================
    // UPDATE STATUS
    // ========================================================

    const counsellingStatusElement =
        document.getElementById(
            "counsellingStatus"
        );


    if (counsellingStatusElement) {

        counsellingStatusElement.textContent =
            statusText;

    }


    // ========================================================
    // UPDATE DESCRIPTION
    // ========================================================

    const statusDescriptionElement =
        document.getElementById(
            "statusDescription"
        );


    if (statusDescriptionElement) {

        statusDescriptionElement.textContent =
            description;

    }


    // ========================================================
    // UPDATE CHOICE FILLING STATUS
    // ========================================================

    const choiceFillingStatusElement =
        document.getElementById(
            "choiceFillingStatus"
        );


    if (choiceFillingStatusElement) {

        choiceFillingStatusElement.textContent =
            choiceStatus;

    }


    // ========================================================
    // UPDATE SCHEDULE
    // ========================================================

    const preferenceStartElement =
        document.getElementById(
            "preferenceStart"
        );


    if (preferenceStartElement) {

        preferenceStartElement.textContent =
            formatDate(
                round.preference_start
            );

    }


    const preferenceEndElement =
        document.getElementById(
            "preferenceEnd"
        );


    if (preferenceEndElement) {

        preferenceEndElement.textContent =
            formatDate(
                round.preference_end
            );

    }


    const allotmentAtElement =
        document.getElementById(
            "allotmentAt"
        );


    if (allotmentAtElement) {

        allotmentAtElement.textContent =
            formatDate(
                round.allotment_at
            );

    }


    const paymentDeadlineElement =
        document.getElementById(
            "paymentDeadline"
        );


    if (paymentDeadlineElement) {

        paymentDeadlineElement.textContent =
            formatDate(
                round.payment_deadline
            );

    }


    // ========================================================
    // CHOICE FILLING TIME
    // ========================================================

    const choiceFillingTimeElement =
        document.getElementById(
            "choiceFillingTime"
        );


    if (choiceFillingTimeElement) {

        choiceFillingTimeElement.textContent =
            getChoiceTime(round);

    }


    // ========================================================
    // UPDATE TIMELINE
    // ========================================================

    updateTimeline(status);

}


// ============================================================
// CHOICE TIME
// ============================================================

function getChoiceTime(round) {

    const status =
        String(
            round.status || ""
        ).toLowerCase();


    // --------------------------------------------------------
    // CHOICE FILLING OPEN
    // --------------------------------------------------------

    if (status === "preference_open") {

        return (
            "Closes: " +
            formatDate(
                round.preference_end
            )
        );

    }


    // --------------------------------------------------------
    // CHOICE FILLING LOCKED
    // --------------------------------------------------------

    if (status === "preferences_locked") {

        return "Choice filling closed";

    }


    // --------------------------------------------------------
    // NOT STARTED
    // --------------------------------------------------------

    if (status === "not_started") {

        return (
            "Opens: " +
            formatDate(
                round.preference_start
            )
        );

    }


    // --------------------------------------------------------
    // ALLOTMENT COMPLETED
    // --------------------------------------------------------

    if (status === "allotment_completed") {

        return "Choice filling completed";

    }


    // --------------------------------------------------------
    // PAYMENT
    // --------------------------------------------------------

    if (status === "payment_period") {

        return "Payment period active";

    }


    // --------------------------------------------------------
    // ROUND COMPLETED
    // --------------------------------------------------------

    if (status === "completed") {

        return "Round completed";

    }


    return "-";

}


// ============================================================
// TIMELINE
// ============================================================

function updateTimeline(status) {

    const steps = [

        {
            id: "stepPreference",

            active: [
                "preference_open",
                "preferences_locked",
                "allotment_completed",
                "payment_period",
                "completed"
            ].includes(status)

        },


        {
            id: "stepLocked",

            active: [
                "preferences_locked",
                "allotment_completed",
                "payment_period",
                "completed"
            ].includes(status)

        },


        {
            id: "stepAllotment",

            active: [
                "allotment_completed",
                "payment_period",
                "completed"
            ].includes(status)

        },


        {
            id: "stepPayment",

            active: [
                "payment_period",
                "completed"
            ].includes(status)

        },


        {
            id: "stepCompleted",

            active:
                status === "completed"

        }

    ];


    steps.forEach(step => {

        const element =
            document.getElementById(
                step.id
            );


        if (!element) {

            return;

        }


        if (step.active) {

            element.classList.add(
                "active"
            );

        }

        else {

            element.classList.remove(
                "active"
            );

        }

    });

}


// ============================================================
// NO COUNSELLING
// ============================================================

function showNoCounselling() {

    const counsellingStatus =
        document.getElementById(
            "counsellingStatus"
        );


    if (counsellingStatus) {

        counsellingStatus.textContent =
            "COUNSELLING NOT RUNNING";

    }


    const statusDescription =
        document.getElementById(
            "statusDescription"
        );


    if (statusDescription) {

        statusDescription.textContent =
            "There is currently no active counselling round.";

    }


    const currentRound =
        document.getElementById(
            "currentRound"
        );


    if (currentRound) {

        currentRound.textContent =
            "-";

    }


    const eligibleRank =
        document.getElementById(
            "eligibleRank"
        );


    if (eligibleRank) {

        eligibleRank.textContent =
            "-";

    }


    const choiceFillingStatus =
        document.getElementById(
            "choiceFillingStatus"
        );


    if (choiceFillingStatus) {

        choiceFillingStatus.textContent =
            "NOT ACTIVE";

    }


    const choiceFillingTime =
        document.getElementById(
            "choiceFillingTime"
        );


    if (choiceFillingTime) {

        choiceFillingTime.textContent =
            "-";

    }


    // --------------------------------------------------------
    // CLEAR SCHEDULE
    // --------------------------------------------------------

    const scheduleFields = [

        "preferenceStart",
        "preferenceEnd",
        "allotmentAt",
        "paymentDeadline"

    ];


    scheduleFields.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.textContent =
                "-";

        }

    });


    // --------------------------------------------------------
    // RESET TIMELINE
    // --------------------------------------------------------

    const timelineSteps = [

        "stepPreference",
        "stepLocked",
        "stepAllotment",
        "stepPayment",
        "stepCompleted"

    ];


    timelineSteps.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.classList.remove(
                "active"
            );

        }

    });

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ============================================================
// AUTO REFRESH
// ============================================================
//
// The Counsellor Dashboard checks the backend every 5 seconds.
// Therefore, changes made in Round Management will appear
// automatically without manually refreshing the page.
//

let dashboardRefreshTimer = null;


function startDashboardAutoRefresh() {

    // Prevent duplicate timers

    if (dashboardRefreshTimer) {

        clearInterval(
            dashboardRefreshTimer
        );

    }


    dashboardRefreshTimer =
        setInterval(
            async () => {

                console.log(
                    "Refreshing counsellor dashboard..."
                );


                await loadCurrentRound();

            },
            5000
        );

}


// ============================================================
// STOP AUTO REFRESH
// ============================================================

function stopDashboardAutoRefresh() {

    if (dashboardRefreshTimer) {

        clearInterval(
            dashboardRefreshTimer
        );


        dashboardRefreshTimer =
            null;

    }

}


// ============================================================
// LOGOUT
// ============================================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            stopDashboardAutoRefresh();


            localStorage.removeItem(
                "token"
            );


            localStorage.removeItem(
                "authToken"
            );


            localStorage.removeItem(
                "counsellorToken"
            );


            window.location.href =
                "login.html";

        }
    );

}


// ============================================================
// STOP REFRESH WHEN PAGE IS HIDDEN
// ============================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            stopDashboardAutoRefresh();

        }

        else {

            // Refresh immediately when
            // counsellor comes back to the page

            loadCurrentRound();


            startDashboardAutoRefresh();

        }

    }
);


// ============================================================
// INITIALIZE DASHBOARD
// ============================================================

async function initializeDashboard() {

    console.log(
        "Initializing counsellor dashboard..."
    );


    if (!checkAuthentication()) {

        return;

    }


    // First load

    await loadCurrentRound();


    // Then keep checking backend

    startDashboardAutoRefresh();


    console.log(
        "Counsellor dashboard ready."
    );

}


// ============================================================
// DOM READY
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);