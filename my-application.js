/* ============================================================
   GCE ERODE - MY APPLICATION
   Student Application Page
============================================================ */

const API_BASE_URL = "http://localhost:5000";


/* ============================================================
   DOM ELEMENTS
============================================================ */

const applicationNumber =
    document.getElementById("applicationNumber");

const submittedDate =
    document.getElementById("submittedDate");

const studentName =
    document.getElementById("studentName");

const dateOfBirth =
    document.getElementById("dateOfBirth");

const gender =
    document.getElementById("gender");

const community =
    document.getElementById("community");

const email =
    document.getElementById("email");

const rank =
    document.getElementById("rank");

const cutoffMark =
    document.getElementById("cutoffMark");

const eligibilityStatus =
    document.getElementById("eligibilityStatus");

const currentRound =
    document.getElementById("currentRound");

const rankRange =
    document.getElementById("rankRange");

const headerStudentName =
    document.getElementById("headerStudentName");

const headerRegisterNumber =
    document.getElementById("headerRegisterNumber");

const profileInitial =
    document.getElementById("profileInitial");


/* ============================================================
   ERROR MODAL ELEMENTS
============================================================ */

const reportErrorButton =
    document.getElementById("reportErrorButton");

const errorModal =
    document.getElementById("errorModal");

const closeErrorModal =
    document.getElementById("closeErrorModal");

const cancelError =
    document.getElementById("cancelError");

const submitError =
    document.getElementById("submitError");

const errorType =
    document.getElementById("errorType");

const incorrectData =
    document.getElementById("incorrectData");

const correctData =
    document.getElementById("correctData");

const errorDescription =
    document.getElementById("errorDescription");

const errorMessage =
    document.getElementById("errorMessage");

const errorCharacterCount =
    document.getElementById("errorCharacterCount");


/* ============================================================
   AUTHENTICATION
============================================================ */

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("studentToken")
    );
}


function checkAuthentication() {

    const token = getToken();

    if (!token) {

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href =
            "student-login.html";

        return false;
    }

    return true;
}


/* ============================================================
   API REQUEST
============================================================ */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token = getToken();

    if (!token) {

        throw new Error(
            "Authentication token not found."
        );
    }


    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {

                "Content-Type":
                    "application/json",

                "Authorization":
                    `Bearer ${token}`,

                ...(options.headers || {})
            }
        }
    );


    let data = {};

    try {

        data = await response.json();

    }
    catch {

        data = {};

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Something went wrong."
        );
    }


    return data;
}


/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateValue;
    }


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const year =
        date.getFullYear();


    return `${day}-${month}-${year}`;
}


/* ============================================================
   FORMAT VALUE
============================================================ */

function displayValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "-";
    }


    return value;
}


/* ============================================================
   SET TEXT SAFELY
============================================================ */

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        displayValue(value);
}


/* ============================================================
   UPDATE PROFILE INITIAL
============================================================ */

function updateProfileInitial(name) {

    if (
        !profileInitial ||
        !name
    ) {

        return;
    }


    const words =
        name.trim().split(/\s+/);


    let initials = "";


    if (words.length >= 2) {

        initials =
            words[0].charAt(0) +
            words[1].charAt(0);

    }
    else {

        initials =
            words[0].substring(0, 2);
    }


    profileInitial.textContent =
        initials.toUpperCase();
}


/* ============================================================
   LOAD APPLICATION DETAILS
============================================================ */

async function loadApplicationDetails() {

    try {

        console.log(
            "📡 Loading student application..."
        );


        /* =====================================================
           GET LOGGED-IN STUDENT APPLICATION
        ===================================================== */

        const data =
            await apiRequest(
                "/api/student/application"
            );


        console.log(
            "📊 Application API response:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Unable to load application."
            );
        }


        /*
         * Backend response:
         *
         * {
         *     success: true,
         *     application: {
         *         ...
         *     }
         * }
         */

        const application =
            data.application ||
            data.student;


        if (!application) {

            throw new Error(
                "Student application data not found."
            );
        }


        console.log(
            "👤 Logged-in student data:",
            application
        );


        /* =====================================================
           APPLICATION NUMBER
        ===================================================== */

        setText(
            applicationNumber,
            application.application_number
        );


        /* =====================================================
           SUBMITTED DATE
        ===================================================== */

        if (application.created_at) {

            setText(
                submittedDate,
                formatDate(
                    application.created_at
                )
            );

        }
        else if (application.submitted_at) {

            setText(
                submittedDate,
                formatDate(
                    application.submitted_at
                )
            );

        }
        else {

            setText(
                submittedDate,
                "-"
            );
        }


        /* =====================================================
           STUDENT INFORMATION
        ===================================================== */

        const name =
            application.name ||
            application.student_name;


        setText(
            studentName,
            name
        );


        setText(
            dateOfBirth,
            formatDate(
                application.date_of_birth
            )
        );


        /*
         * Gender is not collected.
         * If the HTML does not contain #gender,
         * this safely does nothing.
         */

        if (gender) {

            setText(
                gender,
                application.gender
            );
        }


        setText(
            community,
            application.community
        );


        setText(
            email,
            application.email
        );


        /* =====================================================
           ACADEMIC INFORMATION
        ===================================================== */

        setText(
            rank,
            application.rank_number
        );


        setText(
            cutoffMark,
            application.cutoff_mark
        );


        /* =====================================================
           ELIGIBILITY
        ===================================================== */

        let eligibility = "-";


        if (
            application.eligibility_status
        ) {

            eligibility =
                application.eligibility_status;

        }
        else if (
            application.eligible !== undefined
        ) {

            eligibility =
                application.eligible
                    ? "Eligible"
                    : "Pending";

        }
        else if (
            application.rank_number !== null &&
            application.rank_number !== undefined
        ) {

            eligibility =
                "Eligible";
        }


        setText(
            eligibilityStatus,
            eligibility
        );


        /* =====================================================
           CURRENT ROUND
        ===================================================== */

        setText(
            currentRound,
            "-"
        );


        /* =====================================================
           RANK RANGE
        ===================================================== */

        setText(
            rankRange,
            "-"
        );


        /* =====================================================
           HEADER STUDENT NAME
        ===================================================== */

        setText(
            headerStudentName,
            name
        );


        /* =====================================================
           HEADER REGISTER NUMBER
        ===================================================== */

        setText(
            headerRegisterNumber,
            application.application_number
        );


        /* =====================================================
           PROFILE INITIAL
        ===================================================== */

        updateProfileInitial(
            name
        );


        console.log(
            "✅ Student application loaded successfully."
        );


    }
    catch (error) {

        console.error(
            "❌ LOAD APPLICATION ERROR:",
            error
        );


        setText(
            studentName,
            "Unable to load"
        );


        setText(
            email,
            "Unable to load"
        );


        alert(
            "Unable to load your application details.\n\n" +
            error.message
        );
    }
}


/* ============================================================
   OPEN ERROR MODAL
============================================================ */

function openErrorModal() {

    if (!errorModal) {
        return;
    }


    if (errorMessage) {

        errorMessage.textContent =
            "";
    }


    errorModal.classList.add(
        "show"
    );


    if (errorType) {

        errorType.focus();
    }


    document.body.style.overflow =
        "hidden";
}


/* ============================================================
   CLOSE ERROR REPORT MODAL
============================================================ */

function closeErrorReportModal() {

    if (!errorModal) {
        return;
    }


    errorModal.classList.remove(
        "show"
    );


    document.body.style.overflow =
        "";


    if (errorType) {

        errorType.value =
            "";
    }


    if (incorrectData) {

        incorrectData.value =
            "";
    }


    if (correctData) {

        correctData.value =
            "";
    }


    if (errorDescription) {

        errorDescription.value =
            "";
    }


    if (errorMessage) {

        errorMessage.textContent =
            "";
    }


    updateCharacterCount();
}


/* ============================================================
   CHARACTER COUNT
============================================================ */

function updateCharacterCount() {

    if (
        !errorDescription ||
        !errorCharacterCount
    ) {

        return;
    }


    const length =
        errorDescription.value.length;


    errorCharacterCount.textContent =
        length;
}


/* ============================================================
   VALIDATE ERROR REPORT
============================================================ */

function validateErrorReport() {

    /* ========================================================
       INFORMATION TYPE
    ======================================================== */

    if (!errorType) {

        return false;
    }


    if (!errorType.value) {

        if (errorMessage) {

            errorMessage.textContent =
                "Please select the information that contains the error.";
        }


        errorType.focus();

        return false;
    }


    /* ========================================================
       INCORRECT DATA
    ======================================================== */

    const incorrectValue =
        incorrectData
            ? incorrectData.value.trim()
            : "";


    if (!incorrectValue) {

        if (errorMessage) {

            errorMessage.textContent =
                "Please enter the incorrect data currently shown.";
        }


        if (incorrectData) {

            incorrectData.focus();
        }


        return false;
    }


    /* ========================================================
       CORRECT DATA
    ======================================================== */

    const correctValue =
        correctData
            ? correctData.value.trim()
            : "";


    if (!correctValue) {

        if (errorMessage) {

            errorMessage.textContent =
                "Please enter the correct data.";
        }


        if (correctData) {

            correctData.focus();
        }


        return false;
    }


    /* ========================================================
       DESCRIPTION
    ======================================================== */

    const description =
        errorDescription
            ? errorDescription.value.trim()
            : "";


    if (!description) {

        if (errorMessage) {

            errorMessage.textContent =
                "Please describe the error.";
        }


        if (errorDescription) {

            errorDescription.focus();
        }


        return false;
    }


    if (description.length < 5) {

        if (errorMessage) {

            errorMessage.textContent =
                "Please provide a little more detail.";
        }


        if (errorDescription) {

            errorDescription.focus();
        }


        return false;
    }


    return true;
}


/* ============================================================
   CUSTOM CONFIRMATION BOX
============================================================ */

function showCorrectionConfirmation() {

    return new Promise((resolve) => {

        const existing =
            document.getElementById(
                "correctionConfirmModal"
            );


        if (existing) {

            existing.remove();
        }


        const modal =
            document.createElement("div");


        modal.id =
            "correctionConfirmModal";


        modal.style.position =
            "fixed";

        modal.style.inset =
            "0";

        modal.style.background =
            "rgba(0, 0, 0, 0.45)";

        modal.style.display =
            "flex";

        modal.style.alignItems =
            "center";

        modal.style.justifyContent =
            "center";

        modal.style.zIndex =
            "99999";

        modal.style.padding =
            "20px";


        modal.innerHTML = `

            <div style="
                width:100%;
                max-width:420px;
                background:#ffffff;
                border-radius:18px;
                padding:28px;
                text-align:center;
                box-shadow:0 20px 50px rgba(0,0,0,0.18);
                font-family:inherit;
            ">

                <div style="
                    width:52px;
                    height:52px;
                    margin:0 auto 15px;
                    border-radius:50%;
                    background:#e7f5ed;
                    color:#176b45;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:25px;
                    font-weight:700;
                ">
                    ?
                </div>

                <h3 style="
                    margin:0 0 10px;
                    color:#176b45;
                    font-size:20px;
                ">
                    Submit Correction Request?
                </h3>

                <p style="
                    margin:0 0 22px;
                    color:#5f6f67;
                    font-size:14px;
                    line-height:1.6;
                ">
                    Are you sure you want to send this correction
                    request to the Academic Support Cell?
                </p>

                <div style="
                    display:flex;
                    justify-content:center;
                    gap:12px;
                ">

                    <button
                        type="button"
                        id="correctionConfirmCancel"
                        style="
                            border:none;
                            padding:11px 22px;
                            border-radius:10px;
                            background:#eef1ef;
                            color:#45534d;
                            font-weight:600;
                            cursor:pointer;
                        "
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        id="correctionConfirmSubmit"
                        style="
                            border:none;
                            padding:11px 22px;
                            border-radius:10px;
                            background:#176b45;
                            color:#ffffff;
                            font-weight:600;
                            cursor:pointer;
                        "
                    >
                        Submit
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        const cancelButton =
            document.getElementById(
                "correctionConfirmCancel"
            );


        const confirmButton =
            document.getElementById(
                "correctionConfirmSubmit"
            );


        function finish(result) {

            modal.remove();

            resolve(result);
        }


        cancelButton.addEventListener(
            "click",
            () => finish(false)
        );


        confirmButton.addEventListener(
            "click",
            () => finish(true)
        );


        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal
                ) {

                    finish(false);
                }
            }
        );

    });
}


/* ============================================================
   SHOW SUCCESS MESSAGE
============================================================ */

function showCorrectionSuccess() {

    const existing =
        document.getElementById(
            "correctionSuccessModal"
        );


    if (existing) {

        existing.remove();
    }


    const modal =
        document.createElement("div");


    modal.id =
        "correctionSuccessModal";


    modal.style.position =
        "fixed";

    modal.style.inset =
        "0";

    modal.style.background =
        "rgba(0, 0, 0, 0.45)";

    modal.style.display =
        "flex";

    modal.style.alignItems =
        "center";

    modal.style.justifyContent =
        "center";

    modal.style.zIndex =
        "99999";

    modal.style.padding =
        "20px";


    modal.innerHTML = `

        <div style="
            width:100%;
            max-width:420px;
            background:#ffffff;
            border-radius:18px;
            padding:30px;
            text-align:center;
            box-shadow:0 20px 50px rgba(0,0,0,0.18);
            font-family:inherit;
        ">

            <div style="
                width:55px;
                height:55px;
                margin:0 auto 15px;
                border-radius:50%;
                background:#e7f5ed;
                color:#176b45;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:28px;
                font-weight:700;
            ">
                ✓
            </div>

            <h3 style="
                margin:0 0 10px;
                color:#176b45;
                font-size:20px;
            ">
                Correction Request Sent
            </h3>

            <p style="
                margin:0 0 22px;
                color:#5f6f67;
                font-size:14px;
                line-height:1.6;
            ">
                Your correction request has been sent successfully.
                The Academic Support Cell will review it.
            </p>

            <button
                type="button"
                id="correctionSuccessClose"
                style="
                    border:none;
                    padding:11px 28px;
                    border-radius:10px;
                    background:#176b45;
                    color:#ffffff;
                    font-weight:600;
                    cursor:pointer;
                "
            >
                OK
            </button>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "correctionSuccessClose"
        );


    closeButton.addEventListener(
        "click",
        () => modal.remove()
    );

}


/* ============================================================
   SUBMIT CORRECTION REQUEST
============================================================ */

async function submitCorrectionRequest() {

    /* ========================================================
       VALIDATE FORM
    ======================================================== */

    if (
        !validateErrorReport()
    ) {

        return;
    }


    /* ========================================================
       GET FORM VALUES
    ======================================================== */

    const selectedField =
        errorType.value.trim();


    const incorrectValue =
        incorrectData
            ? incorrectData.value.trim()
            : "";


    const correctValue =
        correctData
            ? correctData.value.trim()
            : "";


    const description =
        errorDescription
            ? errorDescription.value.trim()
            : "";


    /* ========================================================
       CONFIRM BEFORE SUBMIT
    ======================================================== */

    const confirmed =
        await showCorrectionConfirmation();


    if (!confirmed) {

        return;
    }


    try {

        /* =====================================================
           DISABLE SUBMIT BUTTON
        ===================================================== */

        if (submitError) {

            submitError.disabled =
                true;

            submitError.textContent =
                "Sending...";
        }


        if (errorMessage) {

            errorMessage.textContent =
                "";
        }


        console.log(
            "📤 Sending correction request:",
            {
                errorType:
                    selectedField,

                incorrectData:
                    incorrectValue,

                correctData:
                    correctValue,

                errorDescription:
                    description
            }
        );


        /* =====================================================
           SEND CORRECTION REQUEST
        ===================================================== */

        const data =
            await apiRequest(
                "/api/student/correction-request",
                {
                    method: "POST",

                    body: JSON.stringify({

                        errorType:
                            selectedField,

                        incorrectData:
                            incorrectValue,

                        correctData:
                            correctValue,

                        errorDescription:
                            description

                    })
                }
            );


        console.log(
            "✅ CORRECTION REQUEST RESPONSE:",
            data
        );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Failed to send correction request."
            );
        }


        /* =====================================================
           CLOSE ERROR MODAL
        ===================================================== */

        closeErrorReportModal();


        /* =====================================================
           SHOW SUCCESS MODAL
        ===================================================== */

        showCorrectionSuccess();


        console.log(
            "✅ Correction request submitted successfully."
        );


    }
    catch (error) {

        console.error(
            "❌ CORRECTION REQUEST ERROR:",
            error
        );


        if (errorMessage) {

            errorMessage.textContent =
                error.message ||
                "Unable to send correction request.";
        }

    }
    finally {

        if (submitError) {

            submitError.disabled =
                false;

            submitError.innerHTML =
                "✈ Submit Error Report";
        }
    }
}


/* ============================================================
   MODAL BACKDROP CLICK
============================================================ */

function handleModalBackgroundClick(
    event
) {

    if (
        event.target === errorModal
    ) {

        closeErrorReportModal();
    }
}


/* ============================================================
   ESCAPE KEY
============================================================ */

function handleEscapeKey(
    event
) {

    if (
        event.key === "Escape" &&
        errorModal &&
        errorModal.classList.contains("show")
    ) {

        closeErrorReportModal();
    }
}


/* ============================================================
   EVENT LISTENERS
============================================================ */


/* ============================================================
   REPORT ERROR
============================================================ */

if (reportErrorButton) {

    reportErrorButton.addEventListener(
        "click",
        openErrorModal
    );
}


/* ============================================================
   CLOSE X
============================================================ */

if (closeErrorModal) {

    closeErrorModal.addEventListener(
        "click",
        closeErrorReportModal
    );
}


/* ============================================================
   CANCEL
============================================================ */

if (cancelError) {

    cancelError.addEventListener(
        "click",
        closeErrorReportModal
    );
}


/* ============================================================
   SUBMIT
============================================================ */

if (submitError) {

    submitError.addEventListener(
        "click",
        submitCorrectionRequest
    );
}


/* ============================================================
   CHARACTER COUNTER
============================================================ */

if (errorDescription) {

    errorDescription.addEventListener(
        "input",
        updateCharacterCount
    );
}


/* ============================================================
   MODAL BACKGROUND
============================================================ */

if (errorModal) {

    errorModal.addEventListener(
        "click",
        handleModalBackgroundClick
    );
}


/* ============================================================
   ESCAPE KEY
============================================================ */

document.addEventListener(
    "keydown",
    handleEscapeKey
);


/* ============================================================
   INITIALIZE
============================================================ */

async function initializeApplicationPage() {

    console.log(
        "🚀 Initializing My Application page..."
    );


    if (
        !checkAuthentication()
    ) {

        return;
    }


    await loadApplicationDetails();


    updateCharacterCount();


    console.log(
        "✅ My Application page initialized."
    );
}


/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    initializeApplicationPage
);