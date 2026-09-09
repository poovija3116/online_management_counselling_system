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
// GET ALL ROUNDS
// ============================================================

async function getAllRounds() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/rounds`,
            {
                method: "GET",
                headers: getHeaders(),
                cache: "no-store"
            }
        );


        if (!response.ok) {

            console.error(
                "Rounds API error:",
                response.status
            );

            return [];

        }


        const data = await response.json();


        console.log(
            "ALL ROUNDS:",
            data
        );


        if (!data.success) {

            return [];

        }


        return Array.isArray(data.rounds)
            ? data.rounds
            : [];

    }

    catch (error) {

        console.error(
            "GET ALL ROUNDS ERROR:",
            error
        );

        return [];

    }

}


// ============================================================
// CHECK WHETHER ALL COUNSELLING ROUNDS ARE COMPLETED
// ============================================================

async function checkAllRoundsCompleted() {

    const rounds =
        await getAllRounds();


    // No rounds means counselling is NOT completed.

    if (rounds.length === 0) {

        return false;

    }


    return rounds.every(
        round =>
            String(
                round.status || ""
            ).toLowerCase() === "completed"
    );

}


// ============================================================
// FORMAT COMPLETED PAGE DATE + TIME
//
// IMPORTANT:
// These values come directly from the counsellor's
// Round Management settings.
// ============================================================

function formatCompletedDateTime(value) {

    if (!value) {

        return "Not scheduled";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        }
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// RENDER COMPLETED COUNSELLING PAGE
//
// EVERYTHING BELOW IS DYNAMIC.
//
// No hard-coded counselling dates are used.
// ============================================================

function renderCompletedSchedule(rounds) {

    const timeline =
        document.getElementById(
            "completedTimeline"
        );


    const notifications =
        document.getElementById(
            "completedNotifications"
        );


    const academicYear =
        document.getElementById(
            "completedAcademicYear"
        );


    const footerYear =
        document.getElementById(
            "completedFooterYear"
        );


    // ========================================================
    // FOOTER YEAR
    // ========================================================

    if (footerYear) {

        footerYear.textContent =
            new Date().getFullYear();

    }


    // ========================================================
    // SORT ROUNDS
    //
    // Round 1
    // Round 2
    // Round 3
    // etc.
    // ========================================================

    const sortedRounds =
        [...rounds].sort(
            (a, b) =>
                Number(
                    a.round_number || 0
                ) -
                Number(
                    b.round_number || 0
                )
        );


    // ========================================================
    // ACADEMIC YEAR
    //
    // We don't hard-code 2025 - 2026.
    //
    // It is calculated from the first scheduled round.
    // ========================================================

    if (academicYear) {

        const firstRound =
            sortedRounds[0];


        const firstDate =
            firstRound?.preference_start ||
            firstRound?.allotment_at ||
            firstRound?.payment_deadline;


        if (firstDate) {

            const year =
                new Date(
                    firstDate
                ).getFullYear();


            academicYear.textContent =
                `${year} - ${year + 1}`;

        }

        else {

            academicYear.textContent =
                "-";

        }

    }


    // ========================================================
    // TIMELINE
    // ========================================================

    if (timeline) {

        const timelineItems = [];


        sortedRounds.forEach(
            (round) => {

                const roundNumber =
                    Number(
                        round.round_number || 0
                    );


                const roundLabel =
                    roundNumber > 0
                        ? `Round ${roundNumber}`
                        : "Counselling Round";


                // ============================================
                // CHOICE FILLING
                // ============================================

                if (
                    round.preference_start ||
                    round.preference_end
                ) {

                    timelineItems.push(`

                        <div class="completed-timeline-item">

                            <div class="timeline-marker">
                                ✓
                            </div>

                            <div class="completed-timeline-content">

                                <div class="timeline-title-row">

                                    <strong>
                                        ${escapeHtml(
                                            roundLabel
                                        )}
                                    </strong>

                                    <span>
                                        COMPLETED
                                    </span>

                                </div>

                                <p>

                                    Choice Filling:

                                    ${formatCompletedDateTime(
                                        round.preference_start
                                    )}

                                    –

                                    ${formatCompletedDateTime(
                                        round.preference_end
                                    )}

                                </p>

                            </div>

                        </div>

                    `);

                }


                // ============================================
                // ALLOTMENT
                // ============================================

                if (round.allotment_at) {

                    timelineItems.push(`

                        <div class="completed-timeline-item">

                            <div class="timeline-marker">
                                ✓
                            </div>

                            <div class="completed-timeline-content">

                                <div class="timeline-title-row">

                                    <strong>
                                        ${escapeHtml(
                                            roundLabel
                                        )}
                                        — Allotment
                                    </strong>

                                    <span>
                                        COMPLETED
                                    </span>

                                </div>

                                <p>

                                    Allotment:

                                    ${formatCompletedDateTime(
                                        round.allotment_at
                                    )}

                                </p>

                            </div>

                        </div>

                    `);

                }


                // ============================================
                // PAYMENT
                // ============================================

                if (round.payment_deadline) {

                    timelineItems.push(`

                        <div class="completed-timeline-item">

                            <div class="timeline-marker">
                                ✓
                            </div>

                            <div class="completed-timeline-content">

                                <div class="timeline-title-row">

                                    <strong>
                                        ${escapeHtml(
                                            roundLabel
                                        )}
                                        — Payment
                                    </strong>

                                    <span>
                                        COMPLETED
                                    </span>

                                </div>

                                <p>

                                    Payment Deadline:

                                    ${formatCompletedDateTime(
                                        round.payment_deadline
                                    )}

                                </p>

                            </div>

                        </div>

                    `);

                }

            }
        );


        // ====================================================
        // SHOW TIMELINE
        // ====================================================

        if (timelineItems.length > 0) {

            timeline.innerHTML =
                timelineItems.join("");

        }

        else {

            timeline.innerHTML = `

                <div class="completed-empty-state">

                    No counselling schedule found.

                </div>

            `;

        }

    }


    // ========================================================
    // NOTIFICATIONS
    // ========================================================

    if (notifications) {

        const notificationItems = [];


        sortedRounds.forEach(
            (round) => {

                const roundNumber =
                    Number(
                        round.round_number || 0
                    );


                const roundLabel =
                    roundNumber > 0
                        ? `Round ${roundNumber}`
                        : "Counselling Round";


                // ============================================
                // CHOICE FILLING CLOSED
                // ============================================

                if (round.preference_end) {

                    notificationItems.push(`

                        <div class="completed-notification">

                            <div class="notification-icon">
                                ✓
                            </div>

                            <div class="notification-content">

                                <div class="notification-title-row">

                                    <strong>
                                        ${escapeHtml(
                                            roundLabel
                                        )}
                                        Choice Filling Closed
                                    </strong>

                                    <time>

                                        ${formatCompletedDateTime(
                                            round.preference_end
                                        )}

                                    </time>

                                </div>

                                <p>

                                    The choice-filling window
                                    configured by the counsellor
                                    has been completed.

                                </p>

                            </div>

                        </div>

                    `);

                }


                // ============================================
                // ALLOTMENT COMPLETED
                // ============================================

                if (round.allotment_at) {

                    notificationItems.push(`

                        <div class="completed-notification">

                            <div class="notification-icon">
                                ✓
                            </div>

                            <div class="notification-content">

                                <div class="notification-title-row">

                                    <strong>
                                        ${escapeHtml(
                                            roundLabel
                                        )}
                                        Allotment Completed
                                    </strong>

                                    <time>

                                        ${formatCompletedDateTime(
                                            round.allotment_at
                                        )}

                                    </time>

                                </div>

                                <p>

                                    The allotment time configured
                                    by the counsellor has been
                                    completed.

                                </p>

                            </div>

                        </div>

                    `);

                }


                // ============================================
                // PAYMENT CLOSED
                // ============================================

                if (round.payment_deadline) {

                    notificationItems.push(`

                        <div class="completed-notification">

                            <div class="notification-icon">
                                ✓
                            </div>

                            <div class="notification-content">

                                <div class="notification-title-row">

                                    <strong>
                                        ${escapeHtml(
                                            roundLabel
                                        )}
                                        Payment Window Closed
                                    </strong>

                                    <time>

                                        ${formatCompletedDateTime(
                                            round.payment_deadline
                                        )}

                                    </time>

                                </div>

                                <p>

                                    The payment deadline configured
                                    by the counsellor has passed.

                                </p>

                            </div>

                        </div>

                    `);

                }

            }
        );


        // ====================================================
        // SHOW NOTIFICATIONS
        // ====================================================

        if (notificationItems.length > 0) {

            notifications.innerHTML =
                notificationItems.join("");

        }

        else {

            notifications.innerHTML = `

                <div class="completed-empty-state">

                    No counselling updates found.

                </div>

            `;

        }

    }

}


// ============================================================
// SHOW COMPLETED SCREEN
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


    if (normalDashboard) {

        normalDashboard.style.display =
            "none";

    }


    if (completedScreen) {

        completedScreen.style.display =
            "block";

    }

}


// ============================================================
// SHOW NORMAL DASHBOARD
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


    if (normalDashboard) {

        normalDashboard.style.display =
            "";

    }


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

        // ====================================================
        // GET ALL ROUNDS
        // ====================================================

        const rounds =
            await getAllRounds();


        // ====================================================
        // IF ALL ROUNDS ARE COMPLETED
        // ====================================================

        if (
            rounds.length > 0 &&
            rounds.every(
                round =>
                    String(
                        round.status || ""
                    ).toLowerCase() === "completed"
            )
        ) {

            // IMPORTANT:
            // Use the actual rounds configured by counsellor.

            renderCompletedSchedule(
                rounds
            );


            showCompletedScreen();


            return;

        }


        // ====================================================
        // COUNSELLING STILL RUNNING
        // ====================================================

        showNormalDashboard();


        // ====================================================
        // GET CURRENT ROUND
        // ====================================================

        const response =
            await fetch(
                `${API_BASE_URL}/api/rounds/current`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store"
                }
            );


        const data =
            await response.json();


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


        displayRound(
            data.round
        );

    }

    catch (error) {

        console.error(
            "LOAD CURRENT ROUND ERROR:",
            error
        );


        showNoCounselling();

    }

}


// ============================================================
// DISPLAY CURRENT ROUND
// ============================================================

function displayRound(round) {

    const status =
        String(
            round.status || ""
        ).toLowerCase();


    // ========================================================
    // CURRENT ROUND
    // ========================================================

    const currentRound =
        document.getElementById(
            "currentRound"
        );


    if (currentRound) {

        currentRound.textContent =
            `ROUND ${String(
                round.round_number
            ).padStart(2, "0")}`;

    }


    // ========================================================
    // ELIGIBLE RANK RANGE
    // ========================================================

    const eligibleRank =
        document.getElementById(
            "eligibleRank"
        );


    if (eligibleRank) {

        eligibleRank.textContent =
            `${round.min_rank} – ${round.max_rank}`;

    }


    // ========================================================
    // STATUS
    // ========================================================

    let statusText =
        "COUNSELLING STATUS";


    let description =
        "Current counselling status loaded.";


    let choiceStatus =
        "NOT STARTED";


    switch (status) {

        case "not_started":

            statusText =
                "COUNSELLING NOT STARTED";

            description =
                "The current round has not started yet.";

            choiceStatus =
                "NOT STARTED";

            break;


        case "preference_open":

            statusText =
                "COUNSELLING IS RUNNING";

            description =
                "Choice filling is currently open for eligible students.";

            choiceStatus =
                "OPEN";

            break;


        case "preferences_locked":

            statusText =
                "COUNSELLING IS RUNNING";

            description =
                "Choice filling has been closed. Preferences are locked.";

            choiceStatus =
                "LOCKED";

            break;


        case "allotment_completed":

            statusText =
                "COUNSELLING IS RUNNING";

            description =
                "Allotment for this round has been completed.";

            choiceStatus =
                "LOCKED";

            break;


        case "payment_period":

            statusText =
                "COUNSELLING IS RUNNING";

            description =
                "Payment period is currently active for allotted students.";

            choiceStatus =
                "COMPLETED";

            break;


        case "completed":

            statusText =
                "ROUND COMPLETED";

            description =
                "This counselling round has been completed.";

            choiceStatus =
                "COMPLETED";

            break;


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

    const counsellingStatus =
        document.getElementById(
            "counsellingStatus"
        );


    if (counsellingStatus) {

        counsellingStatus.textContent =
            statusText;

    }


    // ========================================================
    // UPDATE DESCRIPTION
    // ========================================================

    const statusDescription =
        document.getElementById(
            "statusDescription"
        );


    if (statusDescription) {

        statusDescription.textContent =
            description;

    }


    // ========================================================
    // UPDATE CHOICE STATUS
    // ========================================================

    const choiceFillingStatus =
        document.getElementById(
            "choiceFillingStatus"
        );


    if (choiceFillingStatus) {

        choiceFillingStatus.textContent =
            choiceStatus;

    }


    // ========================================================
    // UPDATE SCHEDULE
    //
    // These are also taken directly from the counsellor.
    // ========================================================

    const preferenceStart =
        document.getElementById(
            "preferenceStart"
        );


    if (preferenceStart) {

        preferenceStart.textContent =
            formatDate(
                round.preference_start
            );

    }


    const preferenceEnd =
        document.getElementById(
            "preferenceEnd"
        );


    if (preferenceEnd) {

        preferenceEnd.textContent =
            formatDate(
                round.preference_end
            );

    }


    const allotmentAt =
        document.getElementById(
            "allotmentAt"
        );


    if (allotmentAt) {

        allotmentAt.textContent =
            formatDate(
                round.allotment_at
            );

    }


    const paymentDeadline =
        document.getElementById(
            "paymentDeadline"
        );


    if (paymentDeadline) {

        paymentDeadline.textContent =
            formatDate(
                round.payment_deadline
            );

    }


    // ========================================================
    // CHOICE FILLING TIME
    // ========================================================

    const choiceFillingTime =
        document.getElementById(
            "choiceFillingTime"
        );


    if (choiceFillingTime) {

        choiceFillingTime.textContent =
            getChoiceTime(
                round
            );

    }


    // ========================================================
    // UPDATE TIMELINE
    // ========================================================

    updateTimeline(
        status
    );

}


// ============================================================
// CHOICE FILLING TIME
// ============================================================

function getChoiceTime(round) {

    const status =
        String(
            round.status || ""
        ).toLowerCase();


    if (
        status === "preference_open"
    ) {

        return (
            "Closes: " +
            formatDate(
                round.preference_end
            )
        );

    }


    if (
        status === "preferences_locked"
    ) {

        return "Choice filling closed";

    }


    if (
        status === "not_started"
    ) {

        return (
            "Opens: " +
            formatDate(
                round.preference_start
            )
        );

    }


    if (
        status === "allotment_completed"
    ) {

        return "Choice filling completed";

    }


    if (
        status === "payment_period"
    ) {

        return "Payment period active";

    }


    if (
        status === "completed"
    ) {

        return "Round completed";

    }


    return "-";

}


// ============================================================
// UPDATE TIMELINE
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


    steps.forEach(
        step => {

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

        }
    );

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


    // CLEAR SCHEDULE

    [
        "preferenceStart",
        "preferenceEnd",
        "allotmentAt",
        "paymentDeadline"
    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.textContent =
                    "-";

            }

        }
    );


    // RESET TIMELINE

    [
        "stepPreference",
        "stepLocked",
        "stepAllotment",
        "stepPayment",
        "stepCompleted"
    ].forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.classList.remove(
                    "active"
                );

            }

        }
    );

}


// ============================================================
// FORMAT NORMAL DASHBOARD DATE
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
            minute: "2-digit",
            hour12: true
        }
    );

}


// ============================================================
// AUTO REFRESH
// ============================================================

let dashboardRefreshTimer = null;


function startDashboardAutoRefresh() {

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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        if (!logoutButton) {

            return;

        }


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
);


// ============================================================
// PAGE VISIBILITY
// ============================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (document.hidden) {

            stopDashboardAutoRefresh();

        }

        else {

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


    await loadCurrentRound();


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