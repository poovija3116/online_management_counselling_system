
// ============================================
// ADMIN STUDENT MONITORING
// ============================================

const API_BASE_URL = "http://https://online-management-counselling-system-1.onrender.com";

let allStudents = [];


// ============================================
// GET ADMIN TOKEN
// ============================================

function getAdminToken() {

    /*
     * We will check the common localStorage names
     * used by your existing frontend.
     */

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("authToken")
    );
}


// ============================================
// LOAD STUDENTS
// ============================================

async function loadStudents() {

    const loadingMessage =
        document.getElementById("loadingMessage");

    const errorMessage =
        document.getElementById("errorMessage");

    try {

        loadingMessage.style.display = "block";
        errorMessage.style.display = "none";

        const token = getAdminToken();

        if (!token) {

            throw new Error(
                "Admin login token not found. Please login again."
            );
        }


        const response = await fetch(
            `${API_BASE_URL}/api/admin/students`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to fetch student monitoring data"
            );
        }


        allStudents = data.students || [];


        updateSummary();

        applyFilters();


    } catch (error) {

        console.error(
            "STUDENT MONITORING ERROR:",
            error
        );

        errorMessage.textContent =
            error.message;

        errorMessage.style.display =
            "block";

    } finally {

        loadingMessage.style.display =
            "none";
    }
}


// ============================================
// UPDATE SUMMARY
// ============================================

function updateSummary() {

    const totalStudents =
        allStudents.length;

    const totalAllotted =
        allStudents.filter(
            student =>
                student.overall_status === "allotted" ||
                student.overall_status === "confirmed"
        ).length;

    const totalConfirmed =
        allStudents.filter(
            student =>
                student.overall_status === "confirmed"
        ).length;

    const totalNotAllotted =
        allStudents.filter(
            student =>
                student.overall_status === "not_allotted"
        ).length;


    document.getElementById(
        "totalStudents"
    ).textContent =
        totalStudents;


    document.getElementById(
        "totalAllotted"
    ).textContent =
        totalAllotted;


    document.getElementById(
        "totalConfirmed"
    ).textContent =
        totalConfirmed;


    document.getElementById(
        "totalNotAllotted"
    ).textContent =
        totalNotAllotted;
}


// ============================================
// APPLY FILTERS
// ============================================

function applyFilters() {

    const search =
        document.getElementById(
            "searchInput"
        ).value
        .trim()
        .toLowerCase();


    const rank =
        document.getElementById(
            "rankFilter"
        ).value;


    const department =
        document.getElementById(
            "departmentFilter"
        ).value
        .toLowerCase();


    const status =
        document.getElementById(
            "statusFilter"
        ).value
        .toLowerCase();


    const filteredStudents =
        allStudents.filter(student => {

            // SEARCH
            const studentName =
                String(
                    student.student_name || ""
                ).toLowerCase();

            const email =
                String(
                    student.email || ""
                ).toLowerCase();

            const applicationNumber =
                String(
                    student.application?.number || ""
                ).toLowerCase();


            const matchesSearch =
                !search ||
                studentName.includes(search) ||
                email.includes(search) ||
                applicationNumber.includes(search);


            // RANK
            const matchesRank =
                !rank ||
                String(student.rank) ===
                String(rank);


            // DEPARTMENT
            const departmentCode =
                String(
                    student.allotment?.department_code || ""
                ).toLowerCase();


            const matchesDepartment =
                !department ||
                departmentCode === department;


            // STATUS
            const overallStatus =
                String(
                    student.overall_status || ""
                ).toLowerCase();


            const matchesStatus =
                !status ||
                overallStatus === status;


            return (
                matchesSearch &&
                matchesRank &&
                matchesDepartment &&
                matchesStatus
            );

        });


    renderStudents(filteredStudents);
}


// ============================================
// RENDER STUDENTS
// ============================================

function renderStudents(students) {

    const tableBody =
        document.getElementById(
            "studentTableBody"
        );


    const resultCount =
        document.getElementById(
            "resultCount"
        );


    tableBody.innerHTML = "";


    resultCount.textContent =
        `${students.length} student${students.length !== 1 ? "s" : ""}`;


    if (students.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10"
                    style="text-align:center; padding:30px;">
                    No students found
                </td>
            </tr>
        `;

        return;
    }


    students.forEach(student => {

        const application =
            student.application || {};


        const allotment =
            student.allotment || {};


        const payment =
            student.payment || {};


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(student.rank ?? "-")}
                </strong>
            </td>


            <td>
                ${escapeHTML(
                    student.student_name || "-"
                )}
            </td>


            <td>
                ${escapeHTML(
                    student.email || "-"
                )}
            </td>


            <td>
                ${
                    application.number
                    ? `
                        <div>
                            ${escapeHTML(
                                application.number
                            )}
                        </div>

                        <small>
                            ${escapeHTML(
                                application.status || "-"
                            )}
                        </small>
                      `
                    : "-"
                }
            </td>


            <td>
                ${
                    allotment.department_code
                    ? `
                        <strong>
                            ${escapeHTML(
                                allotment.department_code
                            )}
                        </strong>

                        <br>

                        <small>
                            ${escapeHTML(
                                allotment.department_name || ""
                            )}
                        </small>
                      `
                    : "-"
                }
            </td>


            <td>
                ${
                    allotment.seat_number
                    ? escapeHTML(
                        allotment.seat_number
                    )
                    : "-"
                }
            </td>


            <td>
                ${createStatusBadge(
                    allotment.status
                )}
            </td>


            <td>
                ${createStatusBadge(
                    allotment.decision
                )}
            </td>


            <td>
                ${
                    payment.status
                    ? createStatusBadge(
                        payment.status
                    )
                    : "-"
                }
            </td>


            <td>
                ${createStatusBadge(
                    student.overall_status
                )}
            </td>

        `;


        tableBody.appendChild(row);

    });
}


// ============================================
// STATUS BADGE
// ============================================

function createStatusBadge(status) {

    if (!status) {
        return "-";
    }


    const cleanStatus =
        String(status)
            .toLowerCase()
            .replaceAll("_", " ");


    let className =
        "status-badge";


    if (
        status === "allotted"
    ) {

        className +=
            " status-allotted";

    } else if (
        status === "confirmed"
    ) {

        className +=
            " status-confirmed";

    } else if (
        status === "pending"
    ) {

        className +=
            " status-pending";

    } else if (
        status === "paid"
    ) {

        className +=
            " status-paid";

    } else if (
        status === "not_allotted"
    ) {

        className +=
            " status-not-allotted";

    } else if (
        status === "rejected"
    ) {

        className +=
            " status-rejected";
    }


    return `
        <span class="${className}">
            ${escapeHTML(cleanStatus)}
        </span>
    `;
}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================
// CLEAR FILTERS
// ============================================

function clearFilters() {

    document.getElementById(
        "searchInput"
    ).value = "";


    document.getElementById(
        "rankFilter"
    ).value = "";


    document.getElementById(
        "departmentFilter"
    ).value = "";


    document.getElementById(
        "statusFilter"
    ).value = "";


    applyFilters();
}


// ============================================
// EVENT LISTENERS
// ============================================

document
    .getElementById("refreshBtn")
    .addEventListener(
        "click",
        loadStudents
    );


document
    .getElementById("clearFiltersBtn")
    .addEventListener(
        "click",
        clearFilters
    );


document
    .getElementById("searchInput")
    .addEventListener(
        "input",
        applyFilters
    );


document
    .getElementById("rankFilter")
    .addEventListener(
        "input",
        applyFilters
    );


document
    .getElementById("departmentFilter")
    .addEventListener(
        "change",
        applyFilters
    );


document
    .getElementById("statusFilter")
    .addEventListener(
        "change",
        applyFilters
    );


// ============================================
// INITIAL LOAD
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    loadStudents
);

