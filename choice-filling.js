// ============================================================
// GCE ERODE - CHOICE FILLING
// ============================================================

console.log("🔥 CHOICE FILLING SCRIPT RUNNING 🔥");


// ============================================================
// API
// ============================================================

const API_BASE_URL = "http://https://online-management-counselling-system-1.onrender.com";


// ============================================================
// DOM
// ============================================================

const departmentList =
    document.getElementById("departmentList");

const preferenceList =
    document.getElementById("preferenceList");

const departmentSearch =
    document.getElementById("departmentSearch");

const choiceCount =
    document.getElementById("choiceCount");

const lockPreferencesButton =
    document.getElementById("lockPreferences");


// ============================================================
// CONFIRMATION MODAL
// ============================================================

const confirmationModal =
    document.getElementById("confirmationModal");

const confirmationIcon =
    document.getElementById("confirmationIcon");

const confirmationTitle =
    document.getElementById("confirmationTitle");

const confirmationMessage =
    document.getElementById("confirmationMessage");

const confirmationConfirm =
    document.getElementById("confirmationConfirm");

const confirmationCancel =
    document.getElementById("confirmationCancel");


// ============================================================
// DATA
// ============================================================

let departments = [];

let preferences = [];

let preferencesLocked = false;

let currentRound = null;

let choiceFillingOpen = false;

let timingInterval = null;

let redirecting = false;

let savingPreferences = false;

// Prevent closing popup from appearing every second
let closingConfirmationShown = false;


// ============================================================
// MODAL HELPERS
// ============================================================

function showConfirmationModal(
    title,
    message,
    options = {}
) {

    return new Promise((resolve) => {

        if (!confirmationModal) {

            // Fallback if modal HTML is missing
            console.warn(
                "Confirmation modal not found."
            );

            resolve(
                options.defaultResult ?? true
            );

            return;
        }


        const {
            icon = "✓",
            showCancel = true,
            confirmText = "Confirm",
            cancelText = "Cancel"
        } = options;


        if (confirmationIcon) {

            confirmationIcon.textContent =
                icon;
        }


        if (confirmationTitle) {

            confirmationTitle.textContent =
                title;
        }


        if (confirmationMessage) {

            confirmationMessage.textContent =
                message;
        }


        if (confirmationConfirm) {

            confirmationConfirm.textContent =
                confirmText;

            confirmationConfirm.disabled =
                false;
        }


        if (confirmationCancel) {

            confirmationCancel.textContent =
                cancelText;

            confirmationCancel.style.display =
                showCancel
                    ? ""
                    : "none";
        }


        confirmationModal.classList.add(
            "show"
        );


        const closeModal = () => {

            confirmationModal.classList.remove(
                "show"
            );

        };


        const handleConfirm = () => {

            closeModal();

            cleanup();

            resolve(true);
        };


        const handleCancel = () => {

            closeModal();

            cleanup();

            resolve(false);
        };


        const cleanup = () => {

            if (confirmationConfirm) {

                confirmationConfirm.removeEventListener(
                    "click",
                    handleConfirm
                );
            }


            if (confirmationCancel) {

                confirmationCancel.removeEventListener(
                    "click",
                    handleCancel
                );
            }

        };


        if (confirmationConfirm) {

            confirmationConfirm.addEventListener(
                "click",
                handleConfirm
            );
        }


        if (confirmationCancel) {

            confirmationCancel.addEventListener(
                "click",
                handleCancel
            );
        }

    });
}


// ============================================================
// SHOW ERROR MODAL
// ============================================================

async function showErrorModal(
    title,
    message
) {

    await showConfirmationModal(
        title,
        message,
        {
            icon: "!",
            showCancel: false,
            confirmText: "OK"
        }
    );

}


// ============================================================
// SHOW SUCCESS MODAL
// ============================================================

async function showSuccessModal(
    title,
    message
) {

    await showConfirmationModal(
        title,
        message,
        {
            icon: "✓",
            showCancel: false,
            confirmText: "OK"
        }
    );

}


// ============================================================
// SHOW CHOICE FILLING CLOSED MODAL
// ============================================================

async function showChoiceFillingClosedModal(
    message
) {

    if (closingConfirmationShown) {

        return;
    }


    closingConfirmationShown =
        true;


    await showConfirmationModal(
        "Choice Filling Closed",
        message,
        {
            icon: "🔒",
            showCancel: false,
            confirmText: "OK"
        }
    );

}


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("studentToken")
    );

}


// ============================================================
// AUTHENTICATION
// ============================================================

function checkAuthentication() {

    const token = getToken();


    if (!token) {

        showErrorModal(
            "Session Expired",
            "Your login session has expired. Please login again."
        ).then(() => {

            window.location.href =
                "student-login.html";

        });

        return false;
    }


    return true;
}


// ============================================================
// API HEADERS
// ============================================================

function getHeaders() {

    const token = getToken();


    return {

        "Content-Type": "application/json",

        "Authorization":
            `Bearer ${token}`

    };

}


// ============================================================
// PARSE SERVER DATE
// ============================================================

function parseServerDate(value) {

    if (!value) {

        return null;
    }


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


// ============================================================
// FORMAT TIME
// ============================================================

function formatTime(value) {

    const date =
        value instanceof Date
            ? value
            : parseServerDate(value);


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


// ============================================================
// LOAD CURRENT ROUND
// ============================================================

async function loadCurrentRound() {

    try {

        console.log(
            "📡 Checking counselling round..."
        );


        const response =
            await fetch(
                `${API_BASE_URL}/api/rounds/current`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "📊 CURRENT ROUND RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success ||
            !data.round
        ) {

            handleChoiceFillingClosed(
                "There is currently no active counselling round."
            );

            return null;
        }


        /*
         * If a new round is loaded,
         * allow the closing popup for that round.
         */

        if (
            !currentRound ||
            Number(currentRound.id) !==
            Number(data.round.id)
        ) {

            closingConfirmationShown =
                false;
        }


        currentRound =
            data.round;


        console.log(
            "🎯 CURRENT ROUND:",
            currentRound
        );


        return currentRound;

    }

    catch (error) {

        console.error(
            "❌ ROUND TIMING ERROR:",
            error
        );


        handleChoiceFillingClosed(
            "Unable to verify the counselling round timing."
        );


        return null;
    }
}


// ============================================================
// GET OPEN TIME
// ============================================================

function getChoiceOpenTime(round) {

    if (!round) {

        return null;
    }


    return (
        parseServerDate(
            round.choice_open_at
        ) ||

        parseServerDate(
            round.preference_start
        )
    );
}


// ============================================================
// GET CLOSE TIME
// ============================================================

function getChoiceCloseTime(round) {

    if (!round) {

        return null;
    }


    return (
        parseServerDate(
            round.choice_close_at
        ) ||

        parseServerDate(
            round.preference_end
        )
    );
}


// ============================================================
// CHECK CHOICE FILLING TIMING
// ============================================================

function checkChoiceFillingTiming() {

    if (!currentRound) {

        return;
    }


    const openTime =
        getChoiceOpenTime(
            currentRound
        );


    const closeTime =
        getChoiceCloseTime(
            currentRound
        );


    const now =
        new Date();


    // ========================================================
    // NO OPEN TIME
    // ========================================================

    if (!openTime) {

        disableChoiceFilling(
            "Choice filling opening time has not been configured."
        );

        return;
    }


    // ========================================================
    // NO CLOSE TIME
    // ========================================================

    if (!closeTime) {

        disableChoiceFilling(
            "Choice filling closing time has not been configured."
        );

        return;
    }


    // ========================================================
    // BEFORE OPEN
    // ========================================================

    if (now < openTime) {

        choiceFillingOpen =
            false;


        disableChoiceFilling(
            `Choice filling opens at ${formatTime(openTime)}.`
        );


        return;
    }


    // ========================================================
    // OPEN
    // ========================================================

    if (
        now >= openTime &&
        now < closeTime
    ) {

        if (!choiceFillingOpen) {

            console.log(
                "🟢 CHOICE FILLING IS NOW OPEN"
            );
        }


        choiceFillingOpen =
            true;


        /*
         * Allow the closing confirmation
         * for this round.
         */

        closingConfirmationShown =
            false;


        enableChoiceFilling();


        return;
    }


    // ========================================================
    // CLOSED
    // ========================================================

    if (now >= closeTime) {

        choiceFillingOpen =
            false;


        preferencesLocked =
            true;


        disableChoiceFilling(
            `Choice filling closed at ${formatTime(closeTime)}.`
        );


        /*
         * Show custom confirmation box only once.
         */

        if (!closingConfirmationShown) {

            showChoiceFillingClosedModal(
                `The choice filling time has ended at ${formatTime(closeTime)}. Your preferences are now locked.`
            ).then(() => {

                if (redirecting) {

                    return;
                }


                redirecting =
                    true;


                stopTimingMonitor();


                window.location.href =
                    "student-dashboard.html";

            });

        }

    }

}


// ============================================================
// ENABLE CHOICE FILLING
// ============================================================

function enableChoiceFilling() {

    if (preferencesLocked) {

        return;
    }


    if (lockPreferencesButton) {

        lockPreferencesButton.disabled =
            false;

        lockPreferencesButton.textContent =
            "💾 SAVE PREFERENCES";

        lockPreferencesButton.style.background =
            "";
    }


    if (departmentList) {

        departmentList.style.pointerEvents =
            "auto";

        departmentList.style.opacity =
            "1";
    }


    if (departmentSearch) {

        departmentSearch.disabled =
            false;
    }


    renderPreferences();

    renderDepartments(
        getFilteredDepartments()
    );

}


// ============================================================
// DISABLE CHOICE FILLING
// ============================================================

function disableChoiceFilling(message) {

    choiceFillingOpen =
        false;


    if (lockPreferencesButton) {

        lockPreferencesButton.disabled =
            true;

        lockPreferencesButton.textContent =
            "🔒 CHOICE FILLING CLOSED";

        lockPreferencesButton.style.background =
            "#9ca3af";
    }


    if (departmentSearch) {

        departmentSearch.disabled =
            true;
    }


    if (departmentList) {

        departmentList.style.pointerEvents =
            "none";

        departmentList.style.opacity =
            "0.55";
    }


    const messageElement =
        document.getElementById(
            "roundMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    renderPreferences();

    renderDepartments(
        getFilteredDepartments()
    );

}


// ============================================================
// HANDLE CLOSED PAGE
// ============================================================

function handleChoiceFillingClosed(message) {

    if (redirecting) {

        return;
    }


    choiceFillingOpen =
        false;


    preferencesLocked =
        true;


    disableChoiceFilling(
        message
    );


    stopTimingMonitor();


    /*
     * If this is called because the round doesn't exist,
     * show the custom modal and redirect.
     */

    if (!closingConfirmationShown) {

        closingConfirmationShown =
            true;


        showConfirmationModal(
            "Choice Filling Unavailable",
            message,
            {
                icon: "🔒",
                showCancel: false,
                confirmText: "OK"
            }
        ).then(() => {

            if (redirecting) {

                return;
            }


            redirecting =
                true;


            window.location.href =
                "student-dashboard.html";

        });

    }

}


// ============================================================
// START TIMING MONITOR
// ============================================================

function startTimingMonitor() {

    console.log(
        "⏱️ Choice filling timing monitor started."
    );


    stopTimingMonitor();


    timingInterval =
        setInterval(
            checkChoiceFillingTiming,
            1000
        );

}


// ============================================================
// STOP TIMING MONITOR
// ============================================================

function stopTimingMonitor() {

    if (timingInterval) {

        clearInterval(
            timingInterval
        );

        timingInterval =
            null;
    }

}


// ============================================================
// LOAD STUDENT DETAILS
// ============================================================

async function loadStudentDetails() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/student/profile`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "👤 STUDENT PROFILE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            return;
        }


        const student =
            data.student ||
            data.profile ||
            data.user;


        if (!student) {

            return;
        }


        const name =
            student.name ||
            student.student_name ||
            "Student";


        const rank =
            student.rank_number ??
            student.rank ??
            "-";


        const applicationNumber =
            student.application_number ||
            student.applicationNumber ||
            "-";


        const studentName =
            document.getElementById(
                "studentName"
            );


        const studentNameCard =
            document.getElementById(
                "studentNameCard"
            );


        const studentRank =
            document.getElementById(
                "studentRank"
            );


        const applicationNumberElement =
            document.getElementById(
                "applicationNumber"
            );


        if (studentName) {

            studentName.textContent =
                name;
        }


        if (studentNameCard) {

            studentNameCard.textContent =
                name;
        }


        if (studentRank) {

            studentRank.textContent =
                rank;
        }


        if (applicationNumberElement) {

            applicationNumberElement.textContent =
                applicationNumber;
        }

    }

    catch (error) {

        console.error(
            "❌ STUDENT DETAILS ERROR:",
            error
        );

    }

}


// ============================================================
// LOAD DEPARTMENTS
// ============================================================

async function loadDepartments() {

    try {

        if (!departmentList) {

            return;
        }


        departmentList.innerHTML = `
            <div class="loading">
                Loading departments...
            </div>
        `;


        const response =
            await fetch(
                `${API_BASE_URL}/api/departments`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "🏫 DEPARTMENT RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load departments"
            );
        }


        departments =
            data.departments || [];


        renderDepartments(
            getFilteredDepartments()
        );

    }

    catch (error) {

        console.error(
            "❌ DEPARTMENT ERROR:",
            error
        );


        if (departmentList) {

            departmentList.innerHTML = `
                <div class="loading">
                    Failed to load departments.
                    <br><br>
                    ${escapeHTML(
                        error.message
                    )}
                </div>
            `;
        }

    }

}


// ============================================================
// RENDER DEPARTMENTS
// ============================================================

function renderDepartments(departmentData) {

    if (!departmentList) {

        return;
    }


    if (
        !departmentData ||
        departmentData.length === 0
    ) {

        departmentList.innerHTML = `
            <div class="loading">
                No departments available.
            </div>
        `;

        return;
    }


    departmentList.innerHTML = "";


    departmentData.forEach(
        department => {

            const alreadySelected =
                preferences.some(
                    preference =>
                        Number(
                            preference.department_id
                        ) === Number(
                            department.id
                        )
                );


            const availableSeats =
                Number(
                    department.available_seats || 0
                );


            const item =
                document.createElement("div");


            item.className =
                "department-item";


            item.dataset.departmentId =
                department.id;


            item.innerHTML = `

                <div class="department-info">

                    <span class="department-code">
                        ${escapeHTML(
                            department.code || ""
                        )}
                    </span>

                    <span class="department-name">
                        ${escapeHTML(
                            department.name || ""
                        )}
                    </span>

                    <span class="seat-info">
                        Available Seats:
                        <span class="seat-number">
                            ${availableSeats}
                        </span>
                    </span>

                </div>

                <button
                    class="add-btn"
                    type="button"
                    ${
                        alreadySelected ||
                        !choiceFillingOpen ||
                        preferencesLocked
                            ? "disabled"
                            : ""
                    }>

                    ${
                        alreadySelected
                            ? "ADDED"
                            : "ADD"
                    }

                </button>
            `;


            const addButton =
                item.querySelector(
                    ".add-btn"
                );


            if (addButton) {

                addButton.addEventListener(
                    "click",
                    () => {

                        addPreference(
                            department
                        );

                    }
                );

            }


            departmentList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// ADD PREFERENCE
// ============================================================

function addPreference(department) {

    if (!choiceFillingOpen) {

        showErrorModal(
            "Choice Filling Closed",
            "Choice filling is currently closed."
        );

        return;
    }


    if (preferencesLocked) {

        showErrorModal(
            "Preferences Locked",
            "Your preferences are already locked."
        );

        return;
    }


    const exists =
        preferences.some(
            preference =>
                Number(
                    preference.department_id
                ) === Number(
                    department.id
                )
        );


    if (exists) {

        showErrorModal(
            "Already Selected",
            "This department is already selected."
        );

        return;
    }


    preferences.push({

        department_id:
            Number(
                department.id
            ),

        code:
            department.code || "",

        name:
            department.name || "",

        priority:
            preferences.length + 1

    });


    updatePriorities();

    renderPreferences();

    renderDepartments(
        getFilteredDepartments()
    );

}


// ============================================================
// REMOVE PREFERENCE
// ============================================================

function removePreference(departmentId) {

    if (!choiceFillingOpen) {

        showErrorModal(
            "Choice Filling Closed",
            "Choice filling is currently closed."
        );

        return;
    }


    if (preferencesLocked) {

        return;
    }


    preferences =
        preferences.filter(
            preference =>
                Number(
                    preference.department_id
                ) !== Number(
                    departmentId
                )
        );


    updatePriorities();

    renderPreferences();

    renderDepartments(
        getFilteredDepartments()
    );

}


// ============================================================
// MOVE UP
// ============================================================

function moveUp(index) {

    if (
        !choiceFillingOpen ||
        preferencesLocked
    ) {

        return;
    }


    if (index <= 0) {

        return;
    }


    const temp =
        preferences[index - 1];


    preferences[index - 1] =
        preferences[index];


    preferences[index] =
        temp;


    updatePriorities();

    renderPreferences();

}


// ============================================================
// MOVE DOWN
// ============================================================

function moveDown(index) {

    if (
        !choiceFillingOpen ||
        preferencesLocked
    ) {

        return;
    }


    if (
        index >=
        preferences.length - 1
    ) {

        return;
    }


    const temp =
        preferences[index + 1];


    preferences[index + 1] =
        preferences[index];


    preferences[index] =
        temp;


    updatePriorities();

    renderPreferences();

}


// ============================================================
// UPDATE PRIORITIES
// ============================================================

function updatePriorities() {

    preferences.forEach(
        (
            preference,
            index
        ) => {

            preference.priority =
                index + 1;

        }
    );

}


// ============================================================
// RENDER PREFERENCES
// ============================================================

function renderPreferences() {

    if (!preferenceList) {

        return;
    }


    updateChoiceCount();


    if (
        preferences.length === 0
    ) {

        preferenceList.innerHTML = `

            <div
                id="emptyPreferences"
                class="empty-preferences">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No Preferences Added
                </h3>

                <p>
                    Select departments from the left
                    to add them here.
                </p>

            </div>
        `;

        return;
    }


    preferenceList.innerHTML = "";


    preferences.forEach(
        (
            preference,
            index
        ) => {

            const item =
                document.createElement("div");


            item.className =
                "preference-item";


            item.innerHTML = `

                <div class="priority-number">
                    ${index + 1}
                </div>

                <div class="preference-info">

                    <strong>
                        ${escapeHTML(
                            preference.code
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            preference.name
                        )}
                    </span>

                </div>

                <div class="preference-actions">

                    <button
                        type="button"
                        class="move-btn"
                        title="Move Up"
                        ${
                            index === 0 ||
                            !choiceFillingOpen ||
                            preferencesLocked
                                ? "disabled"
                                : ""
                        }>
                        ↑
                    </button>

                    <button
                        type="button"
                        class="move-btn"
                        title="Move Down"
                        ${
                            index ===
                            preferences.length - 1 ||
                            !choiceFillingOpen ||
                            preferencesLocked
                                ? "disabled"
                                : ""
                        }>
                        ↓
                    </button>

                    <button
                        type="button"
                        class="remove-btn"
                        title="Remove"
                        ${
                            !choiceFillingOpen ||
                            preferencesLocked
                                ? "disabled"
                                : ""
                        }>
                        ×
                    </button>

                </div>
            `;


            const buttons =
                item.querySelectorAll(
                    "button"
                );


            if (buttons[0]) {

                buttons[0].addEventListener(
                    "click",
                    () => {

                        moveUp(index);

                    }
                );

            }


            if (buttons[1]) {

                buttons[1].addEventListener(
                    "click",
                    () => {

                        moveDown(index);

                    }
                );

            }


            if (buttons[2]) {

                buttons[2].addEventListener(
                    "click",
                    () => {

                        removePreference(
                            preference.department_id
                        );

                    }
                );

            }


            preferenceList.appendChild(
                item
            );

        }
    );

}


// ============================================================
// UPDATE CHOICE COUNT
// ============================================================

function updateChoiceCount() {

    if (!choiceCount) {

        return;
    }


    const count =
        preferences.length;


    choiceCount.textContent =
        `${count} ${
            count === 1
                ? "Choice"
                : "Choices"
        }`;

}


// ============================================================
// SAVE PREFERENCES
// ============================================================
//
// Student only saves preferences.
//
// Student does NOT manually lock preferences.
//
// Backend automatically locks them when
// choice_close_at is reached.
// ============================================================

async function savePreferences() {

    if (savingPreferences) {

        return null;
    }


    if (!choiceFillingOpen) {

        throw new Error(
            "Choice filling time has ended."
        );
    }


    if (preferencesLocked) {

        throw new Error(
            "Your preferences are already locked."
        );
    }


    if (preferences.length === 0) {

        throw new Error(
            "Please select at least one department."
        );
    }


    const preferenceIds =
        preferences.map(
            preference =>
                Number(
                    preference.department_id
                )
        );


    console.log(
        "💾 SAVING PREFERENCES:",
        preferenceIds
    );


    savingPreferences =
        true;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/preferences`,
                {
                    method: "POST",

                    headers:
                        getHeaders(),

                    body:
                        JSON.stringify({
                            preferences:
                                preferenceIds
                        })
                }
            );


        const data =
            await response.json();


        console.log(
            "📥 SAVE RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to save preferences"
            );
        }


        console.log(
            "✅ PREFERENCES SAVED SUCCESSFULLY"
        );


        return data;

    }

    finally {

        savingPreferences =
            false;
    }

}


// ============================================================
// SAVE BUTTON
// ============================================================

async function handleSavePreferences() {

    if (savingPreferences) {

        return;
    }


    if (!choiceFillingOpen) {

        await showErrorModal(
            "Choice Filling Closed",
            "Choice filling time has ended."
        );

        return;
    }


    if (preferencesLocked) {

        await showErrorModal(
            "Preferences Locked",
            "Your preferences are already locked."
        );

        return;
    }


    if (preferences.length === 0) {

        await showErrorModal(
            "No Preferences Selected",
            "Please select at least one department."
        );

        return;
    }


    // ========================================================
    // CUSTOM CONFIRMATION BOX
    // ========================================================

    const confirmed =
        await showConfirmationModal(
            "Save Preferences?",
            "Are you sure you want to save your selected department preferences?",
            {
                icon: "✓",
                showCancel: true,
                confirmText: "Confirm",
                cancelText: "Cancel"
            }
        );


    if (!confirmed) {

        console.log(
            "❌ SAVE CANCELLED BY STUDENT"
        );

        return;
    }


    // ========================================================
    // SAVE TO DATABASE
    // ========================================================

    try {

        if (lockPreferencesButton) {

            lockPreferencesButton.disabled =
                true;

            lockPreferencesButton.textContent =
                "💾 SAVING...";
        }


        const data =
            await savePreferences();


        if (!data) {

            return;
        }


        if (lockPreferencesButton) {

            lockPreferencesButton.disabled =
                false;

            lockPreferencesButton.textContent =
                "💾 SAVE PREFERENCES";
        }


        // ====================================================
        // SUCCESS CONFIRMATION BOX
        // ====================================================

        await showSuccessModal(
            "Preferences Saved",
            `Preferences saved successfully! ${data.count || preferences.length} choices saved for Round ${data.round_number || currentRound?.round_number || "-"}. Your preferences will be automatically locked when choice filling closes.`
        );


        console.log(
            "✅ Student preferences saved in database."
        );

    }

    catch (error) {

        console.error(
            "❌ SAVE PREFERENCES ERROR:",
            error
        );


        if (lockPreferencesButton) {

            lockPreferencesButton.disabled =
                false;

            lockPreferencesButton.textContent =
                "💾 SAVE PREFERENCES";
        }


        await showErrorModal(
            "Failed to Save Preferences",
            error.message
        );

    }

}


// ============================================================
// LOAD EXISTING PREFERENCES
// ============================================================

async function loadExistingPreferences() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/preferences`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "📋 EXISTING PREFERENCES:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            return;
        }


        const existing =
            data.preferences || [];


        preferences =
            existing.map(
                preference => ({

                    department_id:
                        Number(
                            preference.department_id
                        ),

                    code:
                        preference.code ||
                        preference.department_code ||
                        "",

                    name:
                        preference.name ||
                        preference.department_name ||
                        "",

                    priority:
                        Number(
                            preference.priority
                        )

                })
            );


        preferences.sort(
            (
                a,
                b
            ) =>
                a.priority -
                b.priority
        );


        updatePriorities();

        renderPreferences();


        // ====================================================
        // CHECK DATABASE LOCK STATUS
        // ====================================================

        const locked =
            existing.some(
                preference =>
                    Number(
                        preference.is_locked
                    ) === 1 ||
                    preference.is_locked === true
            );


        if (locked) {

            preferencesLocked =
                true;

            choiceFillingOpen =
                false;


            if (lockPreferencesButton) {

                lockPreferencesButton.textContent =
                    "🔒 PREFERENCES LOCKED";

                lockPreferencesButton.disabled =
                    true;

                lockPreferencesButton.style.background =
                    "#5c756e";
            }


            if (departmentSearch) {

                departmentSearch.disabled =
                    true;
            }


            if (departmentList) {

                departmentList.style.pointerEvents =
                    "none";

                departmentList.style.opacity =
                    "0.55";
            }


            renderPreferences();

            renderDepartments(
                getFilteredDepartments()
            );
        }

    }

    catch (error) {

        console.error(
            "❌ LOAD EXISTING PREFERENCES ERROR:",
            error
        );
    }

}


// ============================================================
// SEARCH
// ============================================================

function getFilteredDepartments() {

    if (!departmentSearch) {

        return departments;
    }


    const search =
        departmentSearch.value
            .trim()
            .toLowerCase();


    if (!search) {

        return departments;
    }


    return departments.filter(
        department => {

            return (

                String(
                    department.code || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    department.name || ""
                )
                .toLowerCase()
                .includes(search)

            );

        }
    );

}


// ============================================================
// SEARCH EVENT
// ============================================================

if (departmentSearch) {

    departmentSearch.addEventListener(
        "input",
        () => {

            renderDepartments(
                getFilteredDepartments()
            );

        }
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

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

            stopTimingMonitor();


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
                "adminToken"
            );


            window.location.href =
                "student-login.html";

        }
    );

}


// ============================================================
// INITIALIZE CHOICE FILLING
// ============================================================

async function initializeChoiceFilling() {

    console.log(
        "🚀 INITIALIZING CHOICE FILLING..."
    );


    if (!checkAuthentication()) {

        return;
    }


    // ========================================================
    // GET CURRENT ROUND
    // ========================================================

    const round =
        await loadCurrentRound();


    if (!round) {

        return;
    }


    // ========================================================
    // CHECK TIMING
    // ========================================================

    checkChoiceFillingTiming();


    // ========================================================
    // BEFORE OPENING
    // ========================================================

    if (!choiceFillingOpen) {

        const openTime =
            getChoiceOpenTime(
                currentRound
            );


        const now =
            new Date();


        if (
            openTime &&
            now < openTime
        ) {

            await showConfirmationModal(
                "Choice Filling Not Open",
                `Choice filling has not opened yet. Opening time: ${formatTime(openTime)}.`,
                {
                    icon: "⏰",
                    showCancel: false,
                    confirmText: "OK"
                }
            );


            window.location.href =
                "student-dashboard.html";


            return;
        }


        return;
    }


    // ========================================================
    // LOAD DATA
    // ========================================================

    await loadStudentDetails();

    await loadDepartments();

    await loadExistingPreferences();


    // ========================================================
    // FINAL RENDER
    // ========================================================

    renderPreferences();

    renderDepartments(
        getFilteredDepartments()
    );


    // ========================================================
    // START TIMER
    // ========================================================

    startTimingMonitor();


    console.log(
        "✅ CHOICE FILLING READY"
    );

}


// ============================================================
// SAVE BUTTON EVENT
// ============================================================

if (lockPreferencesButton) {

    lockPreferencesButton.addEventListener(
        "click",
        handleSavePreferences
    );

}


// ============================================================
// PAGE LOAD
// ============================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeChoiceFilling
    );

}
else {

    initializeChoiceFilling();

}