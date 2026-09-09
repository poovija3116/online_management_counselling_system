// ==========================================
// STUDENT DASHBOARD
// ==========================================

console.log("🔥 STUDENT DASHBOARD LOADED");

const API_BASE = "http://localhost:5000";


// ==========================================
// GET TOKEN
// ==========================================

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("studentToken")
    );

}

let token = getToken();


// ==========================================
// ELEMENTS
// ==========================================

const studentName =
    document.getElementById("studentName");

const welcomeName =
    document.getElementById("welcomeName");

const studentNameCard =
    document.getElementById("studentNameCard");

const studentRank =
    document.getElementById("studentRank");

const applicationNumber =
    document.getElementById("applicationNumber");

const applicationStatus =
    document.getElementById("applicationStatus");

const studentCommunity =
    document.getElementById("studentCommunity");

const studentCutoff =
    document.getElementById("studentCutoff");

const currentRound =
    document.getElementById("currentRound");

const roundNumber =
    document.getElementById("roundNumber");

const eligibleRank =
    document.getElementById("eligibleRank");

const yourRank =
    document.getElementById("yourRank");

const roundMessage =
    document.getElementById("roundMessage");

const choiceFillingButton =
    document.getElementById("choiceFillingButton");

const startChoiceFilling =
    document.getElementById("startChoiceFilling");

const editPreferences =
    document.getElementById("editPreferences");

const logoutButton =
    document.getElementById("logoutButton");


// ==========================================
// PREFERENCE STATUS ELEMENTS
// ==========================================

const preferenceIcon =
    document.getElementById("preferenceIcon");

const preferenceStatus =
    document.getElementById("preferenceStatus");

const preferenceMessage =
    document.getElementById("preferenceMessage");

const choiceCount =
    document.getElementById("choiceCount");

const lockStatus =
    document.getElementById("lockStatus");


// ==========================================
// ALLOTMENT ELEMENTS
// ==========================================

const allotmentWaiting =
    document.getElementById("allotmentWaiting");

const allotmentResult =
    document.getElementById("allotmentResult");

const allottedDepartment =
    document.getElementById("allottedDepartment");

const seatNumber =
    document.getElementById("seatNumber");

const allotmentStatus =
    document.getElementById("allotmentStatus");


// ==========================================
// STUDENT DECISION ELEMENTS
// ==========================================

const studentDecisionSection =
    document.getElementById("studentDecisionSection");

const seatDecisionButtons =
    document.getElementById("seatDecisionButtons");

const acceptSeatButton =
    document.getElementById("acceptSeatButton");

const upwardSeatButton =
    document.getElementById("upwardSeatButton");

// IMPORTANT:
// HTML uses declineSeatButton
const declineSeatButton =
    document.getElementById("declineSeatButton");

const seatDecisionTitle =
    document.getElementById("seatDecisionTitle");

const seatDecisionMessage =
    document.getElementById("seatDecisionMessage");

const decisionResult =
    document.getElementById("decisionResult");

const decisionResultIcon =
    document.getElementById("decisionResultIcon");

const decisionResultTitle =
    document.getElementById("decisionResultTitle");

const decisionResultMessage =
    document.getElementById("decisionResultMessage");


// ==========================================
// DECISION CONFIRMATION MODAL
// ==========================================

const decisionConfirmationModal =
    document.getElementById("decisionConfirmationModal");

const decisionConfirmationIcon =
    document.getElementById("decisionConfirmationIcon");

const decisionConfirmationTitle =
    document.getElementById("decisionConfirmationTitle");

const decisionConfirmationMessage =
    document.getElementById("decisionConfirmationMessage");

const decisionConfirmationConfirm =
    document.getElementById("decisionConfirmationConfirm");

const decisionConfirmationCancel =
    document.getElementById("decisionConfirmationCancel");


function showDecisionConfirmation(title, message, icon) {

    return new Promise((resolve) => {

        if (!decisionConfirmationModal ||
            !decisionConfirmationConfirm ||
            !decisionConfirmationCancel) {
            console.error("Decision confirmation modal is missing from student-dashboard.html");
            resolve(false);
            return;
        }

        decisionConfirmationIcon.textContent = icon || "?";
        decisionConfirmationTitle.textContent = title;
        decisionConfirmationMessage.textContent = message;
        decisionConfirmationConfirm.textContent = "Confirm";
        decisionConfirmationCancel.textContent = "Cancel";

        decisionConfirmationModal.classList.add("show");

        const finish = (result) => {
            decisionConfirmationModal.classList.remove("show");
            decisionConfirmationConfirm.removeEventListener("click", onConfirm);
            decisionConfirmationCancel.removeEventListener("click", onCancel);
            document.removeEventListener("keydown", onKeyDown);
            resolve(result);
        };

        const onConfirm = () => finish(true);
        const onCancel = () => finish(false);
        const onKeyDown = (event) => {
            if (event.key === "Escape") finish(false);
        };

        decisionConfirmationConfirm.addEventListener("click", onConfirm);
        decisionConfirmationCancel.addEventListener("click", onCancel);
        document.addEventListener("keydown", onKeyDown);
    });
}


// ==========================================
// ALLOTMENT ORDER ELEMENTS
// ==========================================

const allotmentOrderAction =
    document.getElementById("allotmentOrderAction");

const viewAllotmentOrder =
    document.getElementById("viewAllotmentOrder");

const printAllotmentOrder =
    document.getElementById("printAllotmentOrder");


// ==========================================
// CURRENT DATA
// ==========================================

let selectedRound = null;

let currentStudent = null;

let studentEligible = false;

let choiceFillingOpen = false;

let timingInterval = null;

let roundRefreshInterval = null;

let allotmentRefreshInterval = null;

let decisionProcessing = false;


// ==========================================
// LOGIN CHECK
// ==========================================

if (!token) {

    console.log("❌ No login token found");

    window.location.href =
        "student-login.html";

}


// ==========================================
// AUTH HEADERS
// ==========================================

function getHeaders() {

    const currentToken =
        getToken();

    return {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${currentToken}`

    };

}


// ==========================================
// DATE PARSER
// ==========================================

function parseDate(value) {

    if (!value) {

        return null;

    }


    // MySQL datetime:
    // YYYY-MM-DD HH:MM:SS

    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ) {

        return new Date(
            value.replace(" ", "T")
        );

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(value) {

    const date =
        parseDate(value);


    if (!date) {

        return "-";

    }


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==========================================
// GET CHOICE OPEN TIME
// ==========================================

function getChoiceOpenTime(round) {

    if (!round) {

        return null;

    }


    return (
        parseDate(round.choice_open_at) ||
        parseDate(round.preference_start)
    );

}


// ==========================================
// GET CHOICE CLOSE TIME
// ==========================================

function getChoiceCloseTime(round) {

    if (!round) {

        return null;

    }


    return (
        parseDate(round.choice_close_at) ||
        parseDate(round.preference_end)
    );

}


// ==========================================
// DISABLE EDIT PREFERENCES
// ==========================================

function disableEditPreferences(
    message = "Choice filling is closed."
) {

    if (!editPreferences) {

        return;

    }


    editPreferences.disabled =
        true;

    editPreferences.style.cursor =
        "not-allowed";

    editPreferences.style.background =
        "#9ca3af";

    editPreferences.style.color =
        "#ffffff";

    editPreferences.onclick =
        null;


    console.log(
        "🔒 EDIT PREFERENCES: DISABLED"
    );

}


// ==========================================
// ENABLE EDIT PREFERENCES
// ==========================================

function enableEditPreferences() {

    if (!editPreferences) {

        return;

    }


    editPreferences.disabled =
        false;

    editPreferences.style.cursor =
        "pointer";

    editPreferences.style.background =
        "";

    editPreferences.style.color =
        "";

    editPreferences.onclick =
        function () {

            window.location.href =
                "choice-filling.html";

        };


    console.log(
        "🟢 EDIT PREFERENCES: ENABLED"
    );

}


// ==========================================
// UPDATE EDIT PREFERENCES STATUS
// ==========================================

function updateEditPreferencesStatus() {

    if (!selectedRound) {

        disableEditPreferences(
            "There is no active counselling round."
        );

        return;

    }


    if (!studentEligible) {

        disableEditPreferences(
            "Your rank is not eligible for this round."
        );

        return;

    }


    const openTime =
        getChoiceOpenTime(
            selectedRound
        );

    const closeTime =
        getChoiceCloseTime(
            selectedRound
        );


    const now =
        new Date();


    // --------------------------------------
    // NO SCHEDULE
    // --------------------------------------

    if (!openTime || !closeTime) {

        disableEditPreferences(
            "Choice filling schedule is not configured."
        );

        return;

    }


    // --------------------------------------
    // BEFORE OPEN
    // --------------------------------------

    if (now < openTime) {

        disableEditPreferences(
            "Choice filling has not started yet."
        );

        return;

    }


    // --------------------------------------
    // OPEN
    // --------------------------------------

    if (
        now >= openTime &&
        now < closeTime
    ) {

        enableEditPreferences();

        return;

    }


    // --------------------------------------
    // CLOSED
    // --------------------------------------

    if (now >= closeTime) {

        disableEditPreferences(
            `Choice filling closed at ${formatTime(closeTime)}.`
        );

        return;

    }

}


// ==========================================
// DISABLE CHOICE FILLING
// ==========================================

function disableChoiceFillingButton(
    message
) {

    choiceFillingOpen =
        false;


    // --------------------------------------
    // MAIN BUTTON
    // --------------------------------------

    if (choiceFillingButton) {

        choiceFillingButton.disabled =
            true;

        choiceFillingButton.onclick =
            null;

        choiceFillingButton.style.cursor =
            "not-allowed";

        choiceFillingButton.style.background =
            "#9ca3af";

    }


    // --------------------------------------
    // START BUTTON
    // --------------------------------------

    if (startChoiceFilling) {

        startChoiceFilling.disabled =
            true;

        startChoiceFilling.onclick =
            null;

        startChoiceFilling.style.cursor =
            "not-allowed";

        startChoiceFilling.style.background =
            "#9ca3af";

    }


    // --------------------------------------
    // EDIT PREFERENCES
    // --------------------------------------

    updateEditPreferencesStatus();


    // --------------------------------------
    // MESSAGE
    // --------------------------------------

    if (roundMessage && message) {

        roundMessage.textContent =
            message;

    }

}


// ==========================================
// SHOW NOT STARTED STATE
// ==========================================

function showChoiceFillingNotStarted(
    openTime
) {

    choiceFillingOpen =
        false;


    const message =
        openTime
            ? `Choice filling will open at ${formatTime(openTime)}.`
            : "Choice filling has not started yet.";


    // --------------------------------------
    // MAIN BUTTON
    // --------------------------------------

    if (choiceFillingButton) {

        choiceFillingButton.disabled =
            true;

        choiceFillingButton.textContent =
            "CHOICE FILLING NOT STARTED";

        choiceFillingButton.onclick =
            null;

        choiceFillingButton.style.background =
            "#9ca3af";

        choiceFillingButton.style.cursor =
            "not-allowed";

    }


    // --------------------------------------
    // START BUTTON
    // --------------------------------------

    if (startChoiceFilling) {

        startChoiceFilling.disabled =
            true;

        startChoiceFilling.textContent =
            "CHOICE FILLING NOT STARTED";

        startChoiceFilling.onclick =
            null;

        startChoiceFilling.style.background =
            "#9ca3af";

        startChoiceFilling.style.cursor =
            "not-allowed";

    }


    // --------------------------------------
    // EDIT PREFERENCES
    // --------------------------------------

    disableEditPreferences(
        message
    );


    // --------------------------------------
    // MESSAGE
    // --------------------------------------

    if (roundMessage) {

        roundMessage.textContent =
            message;

    }

}


// ==========================================
// ENABLE CHOICE FILLING
// ==========================================

function enableChoiceFilling() {

    if (!studentEligible) {

        return;

    }


    console.log(
        "🟢 CHOICE FILLING: OPEN"
    );


    choiceFillingOpen =
        true;


    // --------------------------------------
    // OPEN CHOICE FILLING PAGE
    // --------------------------------------

    function openChoiceFillingPage() {

        if (!choiceFillingOpen) {

            console.log(
                "❌ Choice filling is closed"
            );

            return;

        }


        console.log(
            "➡️ Opening choice-filling.html"
        );


        window.location.href =
            "choice-filling.html";

    }


    // --------------------------------------
    // MAIN BUTTON
    // --------------------------------------

    if (choiceFillingButton) {

        choiceFillingButton.disabled =
            false;

        choiceFillingButton.textContent =
            "ENTER CHOICE FILLING →";

        choiceFillingButton.onclick =
            openChoiceFillingPage;

        choiceFillingButton.style.background =
            "";

        choiceFillingButton.style.cursor =
            "pointer";

    }


    // --------------------------------------
    // START BUTTON
    // --------------------------------------

    if (startChoiceFilling) {

        startChoiceFilling.disabled =
            false;

        startChoiceFilling.textContent =
            "ENTER CHOICE FILLING →";

        startChoiceFilling.onclick =
            openChoiceFillingPage;

        startChoiceFilling.style.background =
            "";

        startChoiceFilling.style.cursor =
            "pointer";

    }


    // --------------------------------------
    // EDIT PREFERENCES
    // --------------------------------------

    enableEditPreferences();

}


// ==========================================
// CHECK CHOICE FILLING TIME
// ==========================================

function checkChoiceFillingTiming() {

    if (!selectedRound) {

        disableEditPreferences();

        return;

    }


    // --------------------------------------
    // ELIGIBILITY
    // --------------------------------------

    if (!studentEligible) {

        disableChoiceFillingButton(
            "Your rank is not eligible for this counselling round."
        );

        disableEditPreferences();

        return;

    }


    const openTime =
        getChoiceOpenTime(
            selectedRound
        );


    const closeTime =
        getChoiceCloseTime(
            selectedRound
        );


    const now =
        new Date();


    // --------------------------------------
    // SCHEDULE NOT CONFIGURED
    // --------------------------------------

    if (!openTime || !closeTime) {

        disableChoiceFillingButton(
            "Choice filling schedule has not been configured yet."
        );


        if (choiceFillingButton) {

            choiceFillingButton.textContent =
                "CHOICE FILLING NOT SET";

        }


        if (startChoiceFilling) {

            startChoiceFilling.textContent =
                "CHOICE FILLING NOT SET";

        }


        disableEditPreferences();

        return;

    }


    // --------------------------------------
    // BEFORE OPEN
    // --------------------------------------

    if (now < openTime) {

        showChoiceFillingNotStarted(
            openTime
        );

        return;

    }


    // --------------------------------------
    // OPEN
    // --------------------------------------

    if (
        now >= openTime &&
        now < closeTime
    ) {

        enableChoiceFilling();


        if (roundMessage) {

            roundMessage.textContent =
                "Your rank is eligible for this counselling round. Choice filling is currently open.";

        }

        return;

    }


    // --------------------------------------
    // CLOSED
    // --------------------------------------

    if (now >= closeTime) {

        disableChoiceFillingButton(
            `Choice filling closed at ${formatTime(closeTime)}.`
        );


        if (choiceFillingButton) {

            choiceFillingButton.textContent =
                "CHOICE FILLING CLOSED";

        }


        if (startChoiceFilling) {

            startChoiceFilling.textContent =
                "CHOICE FILLING CLOSED";

        }


        // IMPORTANT:
        // Edit Preferences becomes inactive

        disableEditPreferences(
            `Choice filling closed at ${formatTime(closeTime)}.`
        );

    }

}


// ==========================================
// START TIME MONITOR
// ==========================================

function startTimingMonitor() {

    stopTimingMonitor();


    checkChoiceFillingTiming();


    timingInterval =
        setInterval(
            function () {

                checkChoiceFillingTiming();

            },
            1000
        );


    console.log(
        "⏱️ Choice filling automatic timer started"
    );

}


// ==========================================
// STOP TIME MONITOR
// ==========================================

function stopTimingMonitor() {

    if (timingInterval) {

        clearInterval(
            timingInterval
        );

        timingInterval =
            null;

    }

}


// ==========================================
// LOAD STUDENT PROFILE
// ==========================================

async function loadStudentProfile() {

    try {

        console.log(
            "📡 Loading student profile..."
        );


        const response =
            await fetch(
                `${API_BASE}/api/student/profile`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "📊 STUDENT PROFILE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load student information"
            );

        }


        const student =
            data.student;


        if (!student) {

            throw new Error(
                "Student information is missing"
            );

        }


        currentStudent =
            student;


        // ==================================
        // NAME
        // ==================================

        const name =
            student.name ||
            "Student";


        if (studentName) {

            studentName.textContent =
                name;

        }


        if (welcomeName) {

            welcomeName.textContent =
                name;

        }


        if (studentNameCard) {

            studentNameCard.textContent =
                name;

        }


        // ==================================
        // RANK
        // ==================================

        if (studentRank) {

            if (
                student.rank_number !== null &&
                student.rank_number !== undefined &&
                student.rank_number !== ""
            ) {

                studentRank.textContent =
                    "#" + student.rank_number;

            } else {

                studentRank.textContent =
                    "-";

            }

        }


        // ==================================
        // APPLICATION NUMBER
        // ==================================

        if (applicationNumber) {

            applicationNumber.textContent =
                student.application_number ||
                "-";

        }


        // ==================================
        // APPLICATION STATUS
        // ==================================

        if (applicationStatus) {

            applicationStatus.textContent =
                student.application_status
                    ? String(
                        student.application_status
                    ).toUpperCase()
                    : "PENDING";

        }


        // ==================================
        // COMMUNITY
        // ==================================

        if (studentCommunity) {

            studentCommunity.textContent =
                student.community ||
                "-";

        }


        // ==================================
        // CUTOFF
        // ==================================

        if (studentCutoff) {

            if (
                student.cutoff_mark !== null &&
                student.cutoff_mark !== undefined &&
                student.cutoff_mark !== ""
            ) {

                const cutoff =
                    Number(
                        student.cutoff_mark
                    );


                studentCutoff.textContent =
                    Number.isNaN(cutoff)
                        ? student.cutoff_mark
                        : cutoff.toFixed(2);

            } else {

                studentCutoff.textContent =
                    "-";

            }

        }


        // ==================================
        // SAVE STUDENT
        // ==================================

        localStorage.setItem(
            "loggedInStudent",
            JSON.stringify(student)
        );


        console.log(
            "✅ STUDENT INFORMATION LOADED"
        );


        // ==================================
        // LOAD ROUND
        // ==================================

        await loadCurrentRound(
            student
        );


        // ==================================
        // LOAD ALLOTMENT
        // ==================================

        await loadMyAllotment();

    }

    catch (error) {

        console.error(
            "❌ STUDENT PROFILE ERROR:",
            error
        );


        studentEligible =
            false;


        disableChoiceFillingButton(
            "Unable to verify student information."
        );


        disableEditPreferences();


        if (studentName) {

            studentName.textContent =
                "Unable to load";

        }


        if (welcomeName) {

            welcomeName.textContent =
                "Unable to load";

        }


        if (studentNameCard) {

            studentNameCard.textContent =
                "Unable to load";

        }

    }

}


// ==========================================
// LOAD CURRENT ROUND
// ==========================================

async function loadCurrentRound(student) {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/rounds/current`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "📊 CURRENT ROUND:",
            data
        );


        // ==================================
        // NO ACTIVE ROUND
        // ==================================

        if (
            !response.ok ||
            !data.success ||
            !data.round
        ) {

            selectedRound =
                null;

            studentEligible =
                false;


            disableChoiceFillingButton(
                "There is currently no active counselling round."
            );


            disableEditPreferences();


            if (choiceFillingButton) {

                choiceFillingButton.textContent =
                    "NO ACTIVE ROUND";

            }


            if (startChoiceFilling) {

                startChoiceFilling.textContent =
                    "NO ACTIVE ROUND";

            }


            if (currentRound) {

                currentRound.textContent =
                    "NO ACTIVE ROUND";

            }


            return;

        }


        // ==================================
        // SAVE ROUND
        // ==================================

        const round =
            data.round;


        selectedRound =
            round;


        // ==================================
        // STUDENT RANK
        // ==================================

        const myRank =
            Number(
                student.rank_number
            );


        const minRank =
            Number(
                round.min_rank
            );


        const maxRank =
            Number(
                round.max_rank
            );


        // ==================================
        // ROUND DISPLAY
        // ==================================

        if (currentRound) {

            currentRound.textContent =
                `ROUND ${round.round_number}`;

        }


        if (roundNumber) {

            roundNumber.textContent =
                round.round_number;

        }


        if (eligibleRank) {

            if (
                !Number.isNaN(minRank) &&
                !Number.isNaN(maxRank)
            ) {

                eligibleRank.textContent =
                    `${minRank} - ${maxRank}`;

            } else {

                eligibleRank.textContent =
                    "-";

            }

        }


        if (yourRank) {

            yourRank.textContent =
                Number.isNaN(myRank)
                    ? "-"
                    : myRank;

        }


        // ==================================
        // ELIGIBILITY
        // ==================================

        studentEligible =
            !Number.isNaN(myRank) &&
            !Number.isNaN(minRank) &&
            !Number.isNaN(maxRank) &&
            myRank >= minRank &&
            myRank <= maxRank;


        console.log(
            "🎯 Student Rank:",
            myRank
        );


        console.log(
            "🎯 Eligible:",
            studentEligible
        );


        console.log(
            "🎯 Round Status:",
            round.status
        );


        // ==================================
        // NOT ELIGIBLE
        // ==================================

        if (!studentEligible) {

            if (
                !Number.isNaN(myRank) &&
                myRank < minRank
            ) {

                if (roundMessage) {

                    roundMessage.textContent =
                        "Your rank was processed in an earlier counselling round.";

                }

            }

            else {

                if (roundMessage) {

                    roundMessage.textContent =
                        "Your rank is not included in this counselling round.";

                }

            }


            disableChoiceFillingButton(
                "Your rank is not eligible for this counselling round."
            );


            disableEditPreferences();

            return;

        }


        // ==================================
        // CHECK TIME
        // ==================================

        checkChoiceFillingTiming();

    }

    catch (error) {

        console.error(
            "❌ CURRENT ROUND ERROR:",
            error
        );


        selectedRound =
            null;

        studentEligible =
            false;


        disableChoiceFillingButton(
            "Unable to verify the counselling round timing."
        );


        disableEditPreferences();


        if (currentRound) {

            currentRound.textContent =
                "ROUND INFORMATION UNAVAILABLE";

        }

    }

}


// ==========================================
// AUTOMATIC ROUND REFRESH
// ==========================================

async function refreshCurrentRound() {

    if (!currentStudent) {

        return;

    }


    console.log(
        "🔄 Automatically checking counselling round..."
    );


    await loadCurrentRound(
        currentStudent
    );

}


// ==========================================
// START ROUND AUTO REFRESH
// ==========================================

function startRoundAutoRefresh() {

    if (roundRefreshInterval) {

        clearInterval(
            roundRefreshInterval
        );

    }


    roundRefreshInterval =
        setInterval(
            refreshCurrentRound,
            5000
        );


    console.log(
        "🔄 Automatic round refresh started"
    );

}


// ==========================================
// STOP ROUND AUTO REFRESH
// ==========================================

function stopRoundAutoRefresh() {

    if (roundRefreshInterval) {

        clearInterval(
            roundRefreshInterval
        );

        roundRefreshInterval =
            null;

    }

}


// ==========================================
// LOAD MY ALLOTMENT
// ==========================================

async function loadMyAllotment() {

    try {

        const response =
            await fetch(
                `${API_BASE}/api/allotments/my`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "📊 MY ALLOTMENT:",
            data
        );


        // ==================================
        // NO ALLOTMENT
        // ==================================

        if (
            !response.ok ||
            !data.success ||
            !data.allotment
        ) {

            showNoAllotment();

            return;

        }


        // ==================================
        // ALLOTMENT FOUND
        // ==================================

        const allotment =
            data.allotment;


        console.log(
            "🎉 ALLOTMENT FOUND:",
            allotment
        );


        showAllotment(
            allotment
        );

    }

    catch (error) {

        console.error(
            "❌ ALLOTMENT LOAD ERROR:",
            error
        );

    }

}


// ==========================================
// SHOW NO ALLOTMENT
// ==========================================

function showNoAllotment() {

    if (allotmentWaiting) {

        allotmentWaiting.classList.remove(
            "hidden"
        );

    }


    if (allotmentResult) {

        allotmentResult.classList.add(
            "hidden"
        );

    }


    // VERY IMPORTANT:
    // Never show allotment order when
    // there is no allotment.

    if (allotmentOrderAction) {

        allotmentOrderAction.classList.add(
            "hidden"
        );

    }

}


// ==========================================
// SHOW ALLOTMENT
// ==========================================

function showAllotment(
    allotment
) {

    if (allotmentWaiting) {

        allotmentWaiting.classList.add(
            "hidden"
        );

    }


    if (allotmentResult) {

        allotmentResult.classList.remove(
            "hidden"
        );

    }


    // ======================================
    // DEPARTMENT
    // ======================================

    if (allottedDepartment) {

        allottedDepartment.textContent =
            allotment.department_name ||
            allotment.department ||
            "-";

    }


    // ======================================
    // SEAT
    // ======================================

    if (seatNumber) {

        seatNumber.textContent =
            allotment.seat_number ||
            "-";

    }


    // ======================================
    // STATUS
    // ======================================

    if (allotmentStatus) {

        allotmentStatus.textContent =
            allotment.status
                ? String(
                    allotment.status
                ).toUpperCase()
                : "ALLOTTED";

    }


    // ======================================
    // STUDENT DECISION
    // ======================================

    updateStudentDecisionUI(
        allotment
    );

}


// ==========================================
// UPDATE STUDENT DECISION UI
// ==========================================

function updateStudentDecisionUI(
    allotment
) {

    const decision =
        String(
            allotment.student_decision ||
            "pending"
        ).toLowerCase();


    console.log(
        "🎯 STUDENT DECISION:",
        decision
    );


    // ======================================
    // ALWAYS HIDE ORDER FIRST
    //
    // This prevents an old accepted state
    // from remaining visible while loading.
    // ======================================

    if (allotmentOrderAction) {

        allotmentOrderAction.classList.add(
            "hidden"
        );

    }


    // ======================================
    // PENDING
    // ======================================

    if (decision === "pending") {

        if (seatDecisionButtons) {

            seatDecisionButtons.classList.remove(
                "hidden"
            );

        }


        if (seatDecisionTitle) {

            seatDecisionTitle.textContent =
                "Seat Decision Pending";

        }


        if (seatDecisionMessage) {

            seatDecisionMessage.textContent =
                "Please choose what you want to do with your allotted seat.";

        }


        if (decisionResult) {

            decisionResult.classList.add(
                "hidden"
            );

        }


        enableDecisionButtons();

        return;

    }


    // ======================================
    // ACCEPTED
    // ======================================

    if (decision === "accepted") {

        if (seatDecisionButtons) {

            seatDecisionButtons.classList.add(
                "hidden"
            );

        }


        if (seatDecisionTitle) {

            seatDecisionTitle.textContent =
                "Seat Accepted ✓";

        }


        if (seatDecisionMessage) {

            seatDecisionMessage.textContent =
                "You have accepted your allotted seat.";

        }


        if (decisionResult) {

            decisionResult.classList.remove(
                "hidden"
            );

        }


        if (decisionResultIcon) {

            decisionResultIcon.textContent =
                "✓";

        }


        if (decisionResultTitle) {

            decisionResultTitle.textContent =
                "Seat Accepted";

        }


        if (decisionResultMessage) {

            decisionResultMessage.textContent =
                "Your decision has been recorded successfully.";

        }


        // ==================================
        // IMPORTANT:
        // ONLY ACCEPTED CAN SHOW ORDER
        // ==================================

        if (allotmentOrderAction) {

            allotmentOrderAction.classList.remove(
                "hidden"
            );

        }


        disableDecisionButtons();

        return;

    }


    // ======================================
    // UPWARD
    // ======================================

    if (decision === "upward") {

        if (seatDecisionButtons) {

            seatDecisionButtons.classList.add(
                "hidden"
            );

        }


        if (seatDecisionTitle) {

            seatDecisionTitle.textContent =
                "Upward Request Submitted ↑";

        }


        if (seatDecisionMessage) {

            seatDecisionMessage.textContent =
                "Your upward movement request has been submitted.";

        }


        if (decisionResult) {

            decisionResult.classList.remove(
                "hidden"
            );

        }


        if (decisionResultIcon) {

            decisionResultIcon.textContent =
                "↑";

        }


        if (decisionResultTitle) {

            decisionResultTitle.textContent =
                "Upward Request Submitted";

        }


        if (decisionResultMessage) {

            decisionResultMessage.textContent =
                "You have requested upward movement.";

        }


        // NEVER show allotment order

        if (allotmentOrderAction) {

            allotmentOrderAction.classList.add(
                "hidden"
            );

        }


        disableDecisionButtons();

        return;

    }


    // ======================================
    // REJECTED / DECLINED
    // ======================================

    if (
        decision === "rejected" ||
        decision === "declined"
    ) {

        if (seatDecisionButtons) {

            seatDecisionButtons.classList.add(
                "hidden"
            );

        }


        if (seatDecisionTitle) {

            seatDecisionTitle.textContent =
                "Seat Declined";

        }


        if (seatDecisionMessage) {

            seatDecisionMessage.textContent =
                "You have declined this allotted seat.";

        }


        if (decisionResult) {

            decisionResult.classList.remove(
                "hidden"
            );

        }


        if (decisionResultIcon) {

            decisionResultIcon.textContent =
                "✕";

        }


        if (decisionResultTitle) {

            decisionResultTitle.textContent =
                "Seat Declined";

        }


        if (decisionResultMessage) {

            decisionResultMessage.textContent =
                "Your decision has been recorded.";

        }


        // NEVER show allotment order

        if (allotmentOrderAction) {

            allotmentOrderAction.classList.add(
                "hidden"
            );

        }


        disableDecisionButtons();

        return;

    }


    // ======================================
    // UNKNOWN
    // ======================================

    if (seatDecisionButtons) {

        seatDecisionButtons.classList.add(
            "hidden"
        );

    }


    if (decisionResult) {

        decisionResult.classList.add(
            "hidden"
        );

    }


    if (allotmentOrderAction) {

        allotmentOrderAction.classList.add(
            "hidden"
        );

    }


    disableDecisionButtons();

}


// ==========================================
// ENABLE DECISION BUTTONS
// ==========================================

function enableDecisionButtons() {

    if (decisionProcessing) {

        return;

    }


    if (acceptSeatButton) {

        acceptSeatButton.disabled =
            false;

        acceptSeatButton.style.cursor =
            "pointer";

    }


    if (upwardSeatButton) {

        upwardSeatButton.disabled =
            false;

        upwardSeatButton.style.cursor =
            "pointer";

    }


    if (declineSeatButton) {

        declineSeatButton.disabled =
            false;

        declineSeatButton.style.cursor =
            "pointer";

    }

}


// ==========================================
// DISABLE DECISION BUTTONS
// ==========================================

function disableDecisionButtons() {

    if (acceptSeatButton) {

        acceptSeatButton.disabled =
            true;

        acceptSeatButton.style.cursor =
            "not-allowed";

    }


    if (upwardSeatButton) {

        upwardSeatButton.disabled =
            true;

        upwardSeatButton.style.cursor =
            "not-allowed";

    }


    if (declineSeatButton) {

        declineSeatButton.disabled =
            true;

        declineSeatButton.style.cursor =
            "not-allowed";

    }

}


// ==========================================
// SUBMIT STUDENT DECISION
// ==========================================

async function submitStudentDecision(
    decision
) {

    if (decisionProcessing) {

        return;

    }


    if (
        ![
            "accepted",
            "upward",
            "rejected"
        ].includes(decision)
    ) {

        console.error(
            "❌ Invalid decision:",
            decision
        );

        return;

    }


    // ======================================
    // CONFIRMATION
    // ======================================

    let confirmationMessage =
        "";


    if (decision === "accepted") {

        confirmationMessage =
            "Are you sure you want to accept this seat?";

    }


    if (decision === "upward") {

        confirmationMessage =
            "Are you sure you want to request upward movement?";

    }


    if (decision === "rejected") {

        confirmationMessage =
            "Are you sure you want to decline this seat?";

    }


    const confirmationTitle =
        decision === "accepted"
            ? "Accept Seat?"
            : decision === "upward"
                ? "Request Upward Movement?"
                : "Decline Seat?";

    const confirmationIcon =
        decision === "accepted"
            ? "✓"
            : decision === "upward"
                ? "↑"
                : "!";

    const confirmed =
        await showDecisionConfirmation(
            confirmationTitle,
            confirmationMessage,
            confirmationIcon
        );

    if (!confirmed) {
        return;
    }


    // ======================================
    // PROCESSING
    // ======================================

    decisionProcessing =
        true;


    disableDecisionButtons();


    if (seatDecisionMessage) {

        seatDecisionMessage.textContent =
            "Processing your decision...";

    }


    try {

        console.log(
            "📤 Sending student decision:",
            decision
        );


        const response =
            await fetch(
                `${API_BASE}/api/allotments/decision`,
                {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({
                        decision: decision
                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "📊 DECISION RESPONSE:",
            data
        );


        // ==================================
        // API ERROR
        // ==================================

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to submit your decision."
            );

        }


        // ==================================
        // SUCCESS
        // ==================================

        console.log(
            "✅ Student decision saved:",
            decision
        );


        // Reload from database

        await loadMyAllotment();


        // ==================================
        // SUCCESS MESSAGE
        // ==================================

        if (decision === "accepted") {

            if (seatDecisionMessage) {

                seatDecisionMessage.textContent =
                    "Seat accepted successfully. Your allotment order is now available.";

            }

        }


        if (decision === "upward") {

            if (seatDecisionMessage) {

                seatDecisionMessage.textContent =
                    "Upward request submitted successfully.";

            }

        }


        if (decision === "rejected") {

            if (seatDecisionMessage) {

                seatDecisionMessage.textContent =
                    "Seat declined successfully.";

            }

        }

    }

    catch (error) {

        console.error(
            "❌ DECISION ERROR:",
            error
        );


        if (seatDecisionTitle) {

            seatDecisionTitle.textContent =
                "Decision Failed";

        }


        if (seatDecisionMessage) {

            seatDecisionMessage.textContent =
                error.message ||
                "Unable to save your decision. Please try again.";

        }


        enableDecisionButtons();

    }

    finally {

        decisionProcessing =
            false;

    }

}


// ==========================================
// ACCEPT SEAT
// ==========================================

if (acceptSeatButton) {

    acceptSeatButton.addEventListener(
        "click",
        function () {

            submitStudentDecision(
                "accepted"
            );

        }
    );

}


// ==========================================
// UPWARD
// ==========================================

if (upwardSeatButton) {

    upwardSeatButton.addEventListener(
        "click",
        function () {

            submitStudentDecision(
                "upward"
            );

        }
    );

}


// ==========================================
// DECLINE SEAT
// ==========================================

if (declineSeatButton) {

    declineSeatButton.addEventListener(
        "click",
        function () {

            submitStudentDecision(
                "rejected"
            );

        }
    );

}


// ==========================================
// ALLOTMENT ORDER
// ==========================================

if (viewAllotmentOrder) {

    viewAllotmentOrder.addEventListener(
        "click",
        function () {

            // Safety check:
            // Only navigate if order is currently visible.

            if (
                allotmentOrderAction &&
                allotmentOrderAction.classList.contains(
                    "hidden"
                )
            ) {

                console.log(
                    "❌ Allotment order is not available."
                );

                return;

            }


            window.location.href =
                "student-allotment-order.html";

        }
    );

}


if (printAllotmentOrder) {

    printAllotmentOrder.addEventListener(
        "click",
        function () {

            // Safety check

            if (
                allotmentOrderAction &&
                allotmentOrderAction.classList.contains(
                    "hidden"
                )
            ) {

                console.log(
                    "❌ Allotment order is not available."
                );

                return;

            }


            window.open(
                "student-allotment-order.html",
                "_blank"
            );

        }
    );

}


// ==========================================
// AUTOMATIC ALLOTMENT REFRESH
// ==========================================

function startAllotmentAutoRefresh() {

    if (allotmentRefreshInterval) {

        clearInterval(
            allotmentRefreshInterval
        );

    }


    // Check immediately

    loadMyAllotment();


    // Check every 5 seconds

    allotmentRefreshInterval =
        setInterval(
            loadMyAllotment,
            5000
        );


    console.log(
        "🔄 Automatic allotment refresh started"
    );

}


// ==========================================
// STOP ALLOTMENT REFRESH
// ==========================================

function stopAllotmentAutoRefresh() {

    if (allotmentRefreshInterval) {

        clearInterval(
            allotmentRefreshInterval
        );

        allotmentRefreshInterval =
            null;

    }

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            console.log(
                "🚪 Logging out..."
            );


            stopTimingMonitor();

            stopRoundAutoRefresh();

            stopAllotmentAutoRefresh();


            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "authToken"
            );

            localStorage.removeItem(
                "studentToken"
            );

            localStorage.removeItem(
                "loggedInStudent"
            );

            localStorage.removeItem(
                "studentLoggedIn"
            );


            window.location.href =
                "student-login.html";

        }
    );

}


// ==========================================
// PAGE VISIBILITY
// ==========================================

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            console.log(
                "👁️ Dashboard visible - refreshing data"
            );


            refreshCurrentRound();

            loadMyAllotment();

            checkChoiceFillingTiming();

        }

    }
);


// ==========================================
// START DASHBOARD
// ==========================================

async function initializeDashboard() {

    console.log(
        "🚀 INITIALIZING STUDENT DASHBOARD"
    );


    if (!getToken()) {

        console.log(
            "❌ Authentication token missing"
        );


        window.location.href =
            "student-login.html";


        return;

    }


    // ======================================
    // INITIAL STATE
    // ======================================

    disableChoiceFillingButton(
        "Checking counselling schedule..."
    );


    disableEditPreferences();


    // ======================================
    // LOAD PROFILE
    // ======================================

    await loadStudentProfile();


    // ======================================
    // START AUTOMATIC MONITORS
    // ======================================

    startTimingMonitor();

    startRoundAutoRefresh();

    startAllotmentAutoRefresh();


    // ======================================
    // IMMEDIATE CHECK
    // ======================================

    checkChoiceFillingTiming();

    loadMyAllotment();


    console.log(
        "✅ STUDENT DASHBOARD READY"
    );

}


// ==========================================
// PAGE LOAD
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeDashboard
    );

} else {

    initializeDashboard();

}