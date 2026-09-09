// ==================================================
// STUDENT MODIFICATION
// ==================================================

const API_BASE_URL = "http://localhost:5000";

let students = [];
let correctionRequests = [];
let selectedCorrectionRequestId = null;


// ==================================================
// GET AUTH TOKEN
// ==================================================

function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("adminToken")
    );
}


// ==================================================
// API REQUEST HELPER
// ==================================================

async function apiRequest(url, options = {}) {

    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            ...options,
            headers
        }
    );

    let data;

    try {
        data = await response.json();
    }
    catch {
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Request failed"
        );
    }

    return data;
}


// ==================================================
// ELEMENTS
// ==================================================

const studentSelect =
    document.getElementById("studentSelect");

const modifyForm =
    document.getElementById("modifyForm");

const formMessage =
    document.getElementById("formMessage");

const requestTableBody =
    document.getElementById("requestTableBody");

const viewRequestsBtn =
    document.getElementById("viewRequestsBtn");


// ==================================================
// RESET CURRENT DETAILS
// ==================================================

function resetCurrentDetails() {

    const fields = [
        "currentRank",
        "currentName",
        "currentEmail",
        "currentApplication",
        "currentDob",
        "currentCutoff",
        "currentCommunity"
    ];

    fields.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = "-";
        }

    });
}


// ==================================================
// CLEAR FORM
// ==================================================

function clearModificationForm() {

    const fields = [
        "studentName",
        "studentEmail",
        "applicationNumber",
        "cutoff",
        "dateOfBirth",
        "community"
    ];

    fields.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {
            element.value = "";
        }

    });
}


// ==================================================
// FORMAT DATE
// ==================================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ==================================================
// FORMAT FIELD NAME
// ==================================================

function formatFieldName(field) {

    const fieldNames = {

        name: "Name",

        student_name: "Name",

        date_of_birth: "Date of Birth",

        dob: "Date of Birth",

        community: "Community",

        email: "Email",

        cutoff: "Cutoff",

        cutoff_mark: "Cutoff",

        rank: "Rank",

        rank_number: "Rank",

        application_number: "Application Number",

        application_no: "Application Number",

        other: "Other"
    };

    return (
        fieldNames[field] ||
        field ||
        "-"
    );
}


// ==================================================
// FORMAT STATUS
// ==================================================

function formatStatus(status) {

    if (!status) {
        return "Pending";
    }

    return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
    );
}


// ==================================================
// STATUS CLASS
// ==================================================

function getStatusClass(status) {

    if (!status) {
        return "pending";
    }

    return status
        .toLowerCase()
        .replace(/\s+/g, "-");
}


// ==================================================
// ESCAPE HTML
// ==================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==================================================
// LOAD STUDENTS
// ==================================================

async function loadStudents() {

    try {

        console.log(
            "Loading students..."
        );

        const data =
            await apiRequest(
                "/api/admin/students"
            );

        console.log(
            "STUDENTS RESPONSE:",
            data
        );

        students =
            data.students || [];

        populateStudentSelect();

    }
    catch (error) {

        console.error(
            "LOAD STUDENTS ERROR:",
            error
        );

        if (studentSelect) {

            studentSelect.innerHTML = `
                <option value="">
                    Failed to load students
                </option>
            `;
        }
    }
}


// ==================================================
// POPULATE STUDENT SELECT
// ==================================================

function populateStudentSelect() {

    if (!studentSelect) {
        return;
    }

    studentSelect.innerHTML = `
        <option value="">
            Select Student
        </option>
    `;

    students.forEach(student => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            student.student_id ||
            student.id;

        const rank =
            student.rank_number ??
            student.rank ??
            "-";

        const name =
            student.name ||
            student.student_name ||
            "-";

        option.textContent =
            `Rank ${rank} — ${name}`;

        studentSelect.appendChild(
            option
        );

    });
}


// ==================================================
// FIND SELECTED STUDENT
// ==================================================

function getSelectedStudent() {

    if (!studentSelect) {
        return null;
    }

    const selectedId =
        Number(
            studentSelect.value
        );

    if (!selectedId) {
        return null;
    }

    return students.find(
        student => {

            return Number(
                student.student_id ||
                student.id
            ) === selectedId;

        }
    );
}


// ==================================================
// SHOW STUDENT
// ==================================================

function showStudent(student) {

    if (!student) {

        resetCurrentDetails();

        clearModificationForm();

        return;
    }

    const rank =
        student.rank_number ??
        student.rank ??
        "-";

    const name =
        student.name ||
        student.student_name ||
        "-";

    const email =
        student.email ||
        student.student_email ||
        "-";

    const application =
        student.application_number ||
        student.application?.number ||
        student.application?.application_number ||
        "-";

    const dob =
        student.date_of_birth ||
        student.dob ||
        "";

    const cutoff =
        student.cutoff_mark ??
        student.cutoff ??
        "-";

    const community =
        student.community ||
        "-";


    // ==============================================
    // CURRENT DETAILS
    // ==============================================

    document.getElementById(
        "currentRank"
    ).textContent = rank;

    document.getElementById(
        "currentName"
    ).textContent = name;

    document.getElementById(
        "currentEmail"
    ).textContent = email;

    document.getElementById(
        "currentApplication"
    ).textContent = application;

    document.getElementById(
        "currentDob"
    ).textContent =
        dob
            ? formatDate(dob)
            : "-";

    document.getElementById(
        "currentCutoff"
    ).textContent = cutoff;

    document.getElementById(
        "currentCommunity"
    ).textContent = community;


    // ==============================================
    // MODIFY FORM
    // ==============================================

    document.getElementById(
        "studentName"
    ).value =
        name === "-"
            ? ""
            : name;

    document.getElementById(
        "studentEmail"
    ).value =
        email === "-"
            ? ""
            : email;

    document.getElementById(
        "applicationNumber"
    ).value =
        application === "-"
            ? ""
            : application;

    document.getElementById(
        "cutoff"
    ).value =
        cutoff === "-"
            ? ""
            : cutoff;

    document.getElementById(
        "dateOfBirth"
    ).value =
        dob
            ? formatDate(dob)
            : "";

    document.getElementById(
        "community"
    ).value =
        community === "-"
            ? ""
            : community;
}


// ==================================================
// APPLY CORRECTION REQUEST TO FORM
// ==================================================

function applyCorrectionToForm(request) {

    if (!request) {
        return;
    }

    const field =
        String(
            request.field_name || ""
        )
        .trim()
        .toLowerCase();

    const correctValue =
        String(
            request.correct_data || ""
        )
        .trim();

    if (!correctValue) {
        return;
    }

    console.log(
        "Applying correction:",
        field,
        "=>",
        correctValue
    );


    // ==============================================
    // NAME
    // ==============================================

    if (
        field === "name" ||
        field === "student_name"
    ) {

        document.getElementById(
            "studentName"
        ).value = correctValue;

    }


    // ==============================================
    // EMAIL
    // ==============================================

    else if (
        field === "email"
    ) {

        document.getElementById(
            "studentEmail"
        ).value =
            correctValue.toLowerCase();

    }


    // ==============================================
    // COMMUNITY
    // ==============================================

    else if (
        field === "community"
    ) {

        document.getElementById(
            "community"
        ).value =
            correctValue;

    }


    // ==============================================
    // DATE OF BIRTH
    // ==============================================

    else if (
        field === "date_of_birth" ||
        field === "dob"
    ) {

        document.getElementById(
            "dateOfBirth"
        ).value =
            correctValue;

    }


    // ==============================================
    // CUTOFF
    // ==============================================

    else if (
        field === "cutoff" ||
        field === "cutoff_mark"
    ) {

        document.getElementById(
            "cutoff"
        ).value =
            correctValue;

    }


    // ==============================================
    // APPLICATION NUMBER
    // ==============================================

    else if (
        field === "application_number" ||
        field === "application_no"
    ) {

        document.getElementById(
            "applicationNumber"
        ).value =
            correctValue;

    }
}


// ==================================================
// STUDENT SELECT CHANGE
// ==================================================

if (studentSelect) {

    studentSelect.addEventListener(
        "change",
        function () {

            const student =
                getSelectedStudent();

            selectedCorrectionRequestId =
                null;

            if (student) {

                showStudent(student);

                if (formMessage) {
                    formMessage.textContent = "";
                }

            }
            else {

                resetCurrentDetails();

                clearModificationForm();

                if (formMessage) {
                    formMessage.textContent = "";
                }

            }
        }
    );
}


// ==================================================
// LOAD CORRECTION REQUESTS
// ==================================================

async function loadCorrectionRequests() {

    try {

        console.log(
            "Loading correction requests..."
        );

        const data =
            await apiRequest(
                "/api/admin/correction-requests"
            );

        console.log(
            "CORRECTION REQUESTS RESPONSE:",
            data
        );

        correctionRequests =
            (data.requests || [])
                .filter(
                    request =>
                        String(
                            request.status
                        ).toLowerCase() ===
                        "pending"
                );

        displayCorrectionRequests(
            correctionRequests
        );

    }
    catch (error) {

        console.error(
            "LOAD CORRECTION REQUESTS ERROR:",
            error
        );

        if (requestTableBody) {

            requestTableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="text-align:center; padding:25px;"
                    >
                        Unable to load correction requests.
                    </td>
                </tr>
            `;
        }
    }
}


// ==================================================
// DISPLAY CORRECTION REQUESTS
// ==================================================

function displayCorrectionRequests(requests) {

    if (!requestTableBody) {

        console.error(
            "requestTableBody not found"
        );

        return;
    }

    requestTableBody.innerHTML = "";

    if (requests.length === 0) {

        requestTableBody.innerHTML = `
            <tr>
                <td colspan="6">

                    <div class="empty-request">

                        <div class="empty-request-icon">

                            <i class="fa-solid fa-file-circle-plus"></i>

                        </div>

                        <strong>
                            No correction requests yet.
                        </strong>

                        <span>
                            Student requests will appear here.
                        </span>

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    requests.forEach(
        (request, index) => {

            const row =
                document.createElement(
                    "tr"
                );

            const requestedChange = `
                <div>

                    <strong>
                        ${escapeHtml(
                            request.incorrect_data ||
                            "-"
                        )}
                    </strong>

                    <span>
                        →
                    </span>

                    <strong>
                        ${escapeHtml(
                            request.correct_data ||
                            "-"
                        )}
                    </strong>

                </div>
            `;


            row.innerHTML = `

                <td>
                    ${index + 1}
                </td>

                <td>
                    ${escapeHtml(
                        request.student_name ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        formatFieldName(
                            request.field_name
                        )
                    )}
                </td>

                <td>
                    ${requestedChange}
                </td>

                <td>

                    <span
                        class="request-status ${getStatusClass(
                            request.status
                        )}"
                    >

                        ${escapeHtml(
                            formatStatus(
                                request.status
                            )
                        )}

                    </span>

                </td>

                <td>

                    <button
                        type="button"
                        class="view-btn"
                        data-request-id="${request.id}"
                    >

                        <i class="fa-solid fa-eye"></i>

                        View

                    </button>

                </td>

            `;

            requestTableBody.appendChild(
                row
            );
        }
    );
}


// ==================================================
// VIEW CORRECTION REQUEST
// ==================================================

function viewCorrectionRequest(requestId) {

    const request =
        correctionRequests.find(
            item =>
                Number(item.id) ===
                Number(requestId)
        );

    if (!request) {

        console.error(
            "Correction request not found"
        );

        return;
    }

    console.log(
        "SELECTED CORRECTION REQUEST:",
        request
    );


    // ==============================================
    // SAVE REQUEST ID
    // ==============================================

    selectedCorrectionRequestId =
        Number(request.id);


    // ==============================================
    // SELECT STUDENT
    // ==============================================

    if (studentSelect) {

        studentSelect.value =
            request.student_id;

        const student =
            getSelectedStudent();

        if (student) {

            showStudent(student);
        }
    }


    // ==============================================
    // APPLY REQUESTED CORRECTION
    // ==============================================

    applyCorrectionToForm(
        request
    );


    // ==============================================
    // SHOW REQUEST DETAILS
    // ==============================================

    if (formMessage) {

        formMessage.innerHTML = `
            <strong>
                Correction request selected:
            </strong>

            ${escapeHtml(
                formatFieldName(
                    request.field_name
                )
            )}

            <br>

            <small>

                Current:
                ${escapeHtml(
                    request.incorrect_data ||
                    "-"
                )}

                →

                Correct:
                ${escapeHtml(
                    request.correct_data ||
                    "-"
                )}

            </small>
        `;
    }
}


// ==================================================
// VIEW BUTTON EVENT
// ==================================================

if (requestTableBody) {

    requestTableBody.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    "[data-request-id]"
                );

            if (!button) {
                return;
            }

            const requestId =
                button.dataset.requestId;

            viewCorrectionRequest(
                requestId
            );
        }
    );
}


// ==================================================
// VIEW ALL REQUESTS BUTTON
// ==================================================

if (viewRequestsBtn) {

    viewRequestsBtn.addEventListener(
        "click",
        function () {

            loadCorrectionRequests();

        }
    );
}


// ==================================================
// FORM RESET
// ==================================================

if (modifyForm) {

    modifyForm.addEventListener(
        "reset",
        function () {

            selectedCorrectionRequestId =
                null;

            setTimeout(
                function () {

                    const student =
                        getSelectedStudent();

                    if (student) {

                        showStudent(student);

                    }

                    if (formMessage) {

                        formMessage.textContent =
                            "";

                    }

                },
                0
            );
        }
    );
}


// ==================================================
// CUSTOM CONFIRMATION MODAL
// ==================================================

function createConfirmationModal() {

    // If modal already exists, don't create another one
    if (document.getElementById("updateConfirmModal")) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id =
        "updateConfirmModal";

    modal.innerHTML = `

        <div class="update-confirm-overlay">

            <div class="update-confirm-box">

                <div class="update-confirm-icon">

                    <i class="fa-solid fa-circle-question"></i>

                </div>

                <h3>
                    Confirm Update
                </h3>

                <p>
                    Are you sure you want to update this student's details
                    and resolve the correction request?
                </p>

                <div class="update-confirm-buttons">

                    <button
                        type="button"
                        id="cancelUpdateButton"
                        class="cancel-update-button"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        id="confirmUpdateButton"
                        class="confirm-update-button"
                    >
                        Confirm Update
                    </button>

                </div>

            </div>

        </div>

    `;

    document.body.appendChild(modal);


    // ==============================================
    // MODAL CSS
    // ==============================================

    const style =
        document.createElement("style");

    style.id =
        "updateConfirmModalStyle";

    style.textContent = `

        #updateConfirmModal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 99999;
        }

        #updateConfirmModal.show {
            display: block;
        }

        .update-confirm-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .update-confirm-box {
            width: min(420px, 100%);
            background: #ffffff;
            border-radius: 18px;
            padding: 30px;
            text-align: center;
            box-shadow:
                0 20px 60px rgba(0, 0, 0, 0.20);
            animation: updateConfirmAppear 0.2s ease;
        }

        .update-confirm-icon {
            width: 58px;
            height: 58px;
            margin: 0 auto 15px;
            border-radius: 50%;
            background: #e6f4ec;
            color: #176b45;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 25px;
        }

        .update-confirm-box h3 {
            margin: 0 0 10px;
            color: #145c3b;
            font-size: 20px;
        }

        .update-confirm-box p {
            margin: 0 auto 25px;
            color: #65736c;
            line-height: 1.6;
            font-size: 14px;
            max-width: 340px;
        }

        .update-confirm-buttons {
            display: flex;
            justify-content: center;
            gap: 12px;
        }

        .update-confirm-buttons button {
            border: none;
            border-radius: 10px;
            padding: 11px 18px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition:
                transform 0.15s ease,
                opacity 0.15s ease;
        }

        .update-confirm-buttons button:hover {
            transform: translateY(-1px);
        }

        .cancel-update-button {
            background: #eef1ef;
            color: #52605a;
        }

        .confirm-update-button {
            background: #176b45;
            color: #ffffff;
        }

        .confirm-update-button:hover {
            opacity: 0.92;
        }

        @keyframes updateConfirmAppear {

            from {
                opacity: 0;
                transform: scale(0.95);
            }

            to {
                opacity: 1;
                transform: scale(1);
            }

        }

        @media (max-width: 500px) {

            .update-confirm-box {
                padding: 24px 20px;
            }

            .update-confirm-buttons {
                flex-direction: column;
            }

            .update-confirm-buttons button {
                width: 100%;
            }

        }

    `;

    document.head.appendChild(style);
}


// ==================================================
// SHOW CONFIRMATION MODAL
// ==================================================

function showUpdateConfirmation() {

    return new Promise(resolve => {

        createConfirmationModal();

        const modal =
            document.getElementById(
                "updateConfirmModal"
            );

        const cancelButton =
            document.getElementById(
                "cancelUpdateButton"
            );

        const confirmButton =
            document.getElementById(
                "confirmUpdateButton"
            );

        if (!modal) {

            resolve(false);

            return;
        }


        modal.classList.add("show");


        // ==========================================
        // CANCEL
        // ==========================================

        const cancelHandler = () => {

            cleanup();

            resolve(false);
        };


        // ==========================================
        // CONFIRM
        // ==========================================

        const confirmHandler = () => {

            cleanup();

            resolve(true);
        };


        // ==========================================
        // CLEANUP
        // ==========================================

        function cleanup() {

            modal.classList.remove("show");

            cancelButton.removeEventListener(
                "click",
                cancelHandler
            );

            confirmButton.removeEventListener(
                "click",
                confirmHandler
            );

        }


        cancelButton.addEventListener(
            "click",
            cancelHandler
        );

        confirmButton.addEventListener(
            "click",
            confirmHandler
        );

    });
}


// ==================================================
// UPDATE DETAILS
// ==================================================

if (modifyForm) {

    modifyForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ==========================================
            // CHECK STUDENT
            // ==========================================

            if (!studentSelect.value) {

                if (formMessage) {

                    formMessage.textContent =
                        "Please select a student first.";

                }

                return;
            }


            const student =
                getSelectedStudent();


            if (!student) {

                if (formMessage) {

                    formMessage.textContent =
                        "Student not found.";

                }

                return;
            }


            // ==========================================
            // CHECK CORRECTION REQUEST
            // ==========================================

            if (!selectedCorrectionRequestId) {

                if (formMessage) {

                    formMessage.textContent =
                        "Please select a correction request using the View button first.";

                }

                return;
            }


            // ==========================================
            // FIND REQUEST
            // ==========================================

            const selectedRequest =
                correctionRequests.find(
                    request =>
                        Number(request.id) ===
                        Number(
                            selectedCorrectionRequestId
                        )
                );


            if (!selectedRequest) {

                if (formMessage) {

                    formMessage.textContent =
                        "Selected correction request was not found.";

                }

                return;
            }


            // ==========================================
            // GET UPDATED DATA
            // ==========================================

            const updatedData = {

                name:
                    document.getElementById(
                        "studentName"
                    ).value.trim(),

                email:
                    document.getElementById(
                        "studentEmail"
                    ).value.trim(),

                application_number:
                    document.getElementById(
                        "applicationNumber"
                    ).value.trim(),

                cutoff_mark:
                    document.getElementById(
                        "cutoff"
                    ).value.trim(),

                date_of_birth:
                    document.getElementById(
                        "dateOfBirth"
                    ).value,

                community:
                    document.getElementById(
                        "community"
                    ).value.trim()

            };


            console.log(
                "UPDATED DATA TO SEND:",
                updatedData
            );

            console.log(
                "SELECTED CORRECTION:",
                selectedRequest
            );


            // ==========================================
            // VALIDATION
            // ==========================================

            if (
                !updatedData.name ||
                !updatedData.email ||
                !updatedData.application_number ||
                !updatedData.cutoff_mark ||
                !updatedData.date_of_birth ||
                !updatedData.community
            ) {

                if (formMessage) {

                    formMessage.textContent =
                        "Please fill all student details.";

                }

                return;
            }


            // ==========================================
            // CUSTOM CONFIRMATION
            // ==========================================

            const confirmUpdate =
                await showUpdateConfirmation();


            // ==========================================
            // CANCEL
            // ==========================================

            if (!confirmUpdate) {

                console.log(
                    "Student update cancelled."
                );

                return;
            }


            // ==========================================
            // DISABLE SUBMIT
            // ==========================================

            const submitButton =
                modifyForm.querySelector(
                    'button[type="submit"]'
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.dataset.originalText =
                    submitButton.textContent;

                submitButton.textContent =
                    "Updating...";

            }


            // ==========================================
            // SEND UPDATE
            // ==========================================

            try {

                console.log(
                    "Sending student update..."
                );


                const data =
                    await apiRequest(
                        `/api/admin/correction-requests/${selectedCorrectionRequestId}/resolve`,
                        {
                            method: "PUT",

                            body:
                                JSON.stringify(
                                    updatedData
                                )
                        }
                    );


                console.log(
                    "UPDATE RESPONSE:",
                    data
                );


                // ======================================
                // CHECK BACKEND SUCCESS
                // ======================================

                if (!data.success) {

                    throw new Error(
                        data.message ||
                        "Student update failed"
                    );

                }


                // ======================================
                // CLEAR REQUEST ID
                // ======================================

                selectedCorrectionRequestId =
                    null;


                // ======================================
                // RELOAD FROM DATABASE
                // ======================================

                await loadStudents();

                await loadCorrectionRequests();


                // ======================================
                // FIND UPDATED STUDENT
                // ======================================

                const updatedStudent =
                    students.find(
                        item =>
                            Number(
                                item.student_id ||
                                item.id
                            ) ===
                            Number(
                                data.student.student_id ||
                                data.student.id
                            )
                    );


                if (updatedStudent) {

                    studentSelect.value =
                        data.student.student_id ||
                        data.student.id;

                    showStudent(
                        updatedStudent
                    );

                }
                else {

                    console.warn(
                        "Updated student was not found after reload."
                    );

                }


                // ======================================
                // SUCCESS MESSAGE
                // ======================================

                if (formMessage) {

                    formMessage.textContent =
                        data.emailSent

                            ? "Student details updated successfully. The correction request has been resolved and the student has been notified by email."

                            : "Student details updated successfully. The correction request has been resolved, but the email could not be sent.";

                }

            }
            catch (error) {

                console.error(
                    "UPDATE STUDENT ERROR:",
                    error
                );


                if (formMessage) {

                    formMessage.textContent =
                        error.message ||
                        "Failed to update student details.";

                }

            }
            finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        submitButton.dataset.originalText ||
                        "Update Details";

                }

            }

        }
    );
}


// ==================================================
// INITIALIZE PAGE
// ==================================================

async function initializeStudentModification() {

    console.log(
        "================================="
    );

    console.log(
        "STUDENT MODIFICATION JS LOADED"
    );

    console.log(
        "================================="
    );

    resetCurrentDetails();

    clearModificationForm();

    createConfirmationModal();

    await Promise.all([

        loadStudents(),

        loadCorrectionRequests()

    ]);
}


// ==================================================
// START
// ==================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeStudentModification
);