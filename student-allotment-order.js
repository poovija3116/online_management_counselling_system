/* =========================================================
   GCE ERODE
   STUDENT PROVISIONAL ALLOTMENT ORDER
========================================================= */


/* =========================================================
   API
========================================================= */

const API_BASE = "http://https://online-management-counselling-system-1.onrender.com";


/* =========================================================
   DOM
========================================================= */

const printOrderButton =
    document.getElementById("printOrderButton");

const backButton =
    document.getElementById("backButton");


/* =========================================================
   GET TOKEN
========================================================= */

function getToken() {

    return (
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        ""
    );
}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        element.textContent = "-";

        return;
    }

    element.textContent = value;
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {

        return "--/--/2026";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--/--/2026";
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

    return `${day}/${month}/${year}`;
}


/* =========================================================
   AUTH CHECK
========================================================= */

function checkAuthentication() {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "student-login.html";

        return false;
    }

    return true;
}


/* =========================================================
   LOAD ALLOTMENT
========================================================= */

async function loadAllotmentOrder() {

    const token =
        getToken();

    try {

        const response =
            await fetch(
                `${API_BASE}/api/allotments/my`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    }
                }
            );


        /* ---------------------------------------------
           LOGIN EXPIRED
        ---------------------------------------------- */

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem("token");

            sessionStorage.removeItem("token");

            window.location.href =
                "student-login.html";

            return;
        }


        const data =
            await response.json();


        console.log(
            "Allotment API response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load allotment"
            );
        }


        /* ---------------------------------------------
           FIND ALLOTMENT OBJECT
        ---------------------------------------------- */

        let allotment = null;


        if (
            Array.isArray(data)
        ) {

            allotment =
                data.length > 0
                    ? data[0]
                    : null;

        } else if (
            data.allotment
        ) {

            allotment =
                data.allotment;

        } else if (
            Array.isArray(data.data)
        ) {

            allotment =
                data.data.length > 0
                    ? data.data[0]
                    : null;

        } else if (
            data.data
        ) {

            allotment =
                data.data;

        } else {

            allotment =
                data;
        }


        /* ---------------------------------------------
           NO ALLOTMENT
        ---------------------------------------------- */

        if (!allotment) {

            showError(
                "Allotment Order Not Available",
                "Your allotment has not been generated yet."
            );

            return;
        }


        /* ---------------------------------------------
           DECISION CHECK
        ---------------------------------------------- */

        const decision =
            String(
                allotment.student_decision ||
                allotment.decision ||
                ""
            ).toLowerCase();


        /*
         * ORDER IS AVAILABLE ONLY AFTER
         * ACCEPT SEAT
         */

        if (
            decision !== "accepted"
        ) {

            showError(
                "Allotment Order Not Available",
                "Please accept your allotted seat from the Student Dashboard before viewing the allotment order."
            );

            return;
        }


        /* ---------------------------------------------
           POPULATE PAGE
        ---------------------------------------------- */

        populateOrder(
            allotment
        );

    }
    catch (error) {

        console.error(
            "Allotment order error:",
            error
        );

        showError(
            "Unable to Load Allotment Order",
            "Please make sure the counselling server is running and try again."
        );
    }
}


/* =========================================================
   POPULATE ORDER
========================================================= */

function populateOrder(allotment) {

    console.log(
        "Populating order:",
        allotment
    );


    /* =====================================================
       RELATED OBJECTS
    ===================================================== */

    const student =
        allotment.student ||
        {};

    const application =
        allotment.application ||
        {};

    const round =
        allotment.round ||
        {};

    const department =
        allotment.department ||
        {};


    /* =====================================================
       STUDENT DATA
    ===================================================== */

    const studentName =
        allotment.name ||
        allotment.student_name ||
        student.name ||
        "-";


    /* -----------------------------------------------------
       APPLICATION NUMBER
    ----------------------------------------------------- */

    const applicationNumber =
        allotment.application_number ||
        allotment.applicationNo ||
        allotment.application_no ||
        application.application_number ||
        application.application_no ||
        "-";


    /* -----------------------------------------------------
       COMMUNITY
    ----------------------------------------------------- */

    const community =
        allotment.community ||
        student.community ||
        "-";


    /* -----------------------------------------------------
       CATEGORY
    ----------------------------------------------------- */

    const category =
        allotment.category ||
        application.category ||
        "MANAGEMENT";


    /* -----------------------------------------------------
       BRANCH
    ----------------------------------------------------- */

    const branch =
        allotment.department_name ||
        allotment.branch_name ||
        allotment.branch ||
        department.name ||
        "-";


    /* -----------------------------------------------------
       COURSE
       
       IT = B.Tech
       OTHER BRANCHES = B.E.
    ----------------------------------------------------- */

    let course = "B.E.";

    const branchText =
        String(branch)
            .trim()
            .toUpperCase();

    if (
        branchText === "IT" ||
        branchText === "INFORMATION TECHNOLOGY"
    ) {

        course = "B.Tech";
    }


    /* -----------------------------------------------------
       CUTOFF MARK
    ----------------------------------------------------- */

    const cutoff =
        allotment.cutoff_mark ??
        allotment.cutoff ??
        student.cutoff_mark ??
        "-";


    /* -----------------------------------------------------
       RANK
    ----------------------------------------------------- */

    const rank =
        allotment.rank_number ??
        allotment.rank ??
        student.rank_number ??
        "-";


    /* =====================================================
       ALLOTMENT DATA
    ===================================================== */

    const college =
        allotment.college_name ||
        allotment.college ||
        "GOVERNMENT COLLEGE OF ENGINEERING, ERODE";


    const seatCategory =
        allotment.seat_category ||
        allotment.allotted_category ||
        community ||
        "-";


    const seatNumber =
        allotment.seat_number ||
        "-";


    /* =====================================================
       ROUND
    ===================================================== */

    const roundNumber =
        allotment.round_number ??
        round.round_number ??
        "-";


    /* =====================================================
       DATE
    ===================================================== */

    const allottedAt =
        allotment.allotted_at ||
        allotment.created_at ||
        new Date();


    const paymentDeadline =
        allotment.payment_deadline ||
        round.payment_deadline ||
        null;


    /*
     * If a payment deadline exists, use it as the
     * reporting deadline. Otherwise use allotment date.
     */

    const reportingDate =
        paymentDeadline ||
        allottedAt;


    /* =====================================================
       REFERENCE NUMBER
    ===================================================== */

    const allotmentId =
        allotment.id ||
        allotment.allotment_id ||
        "______";


    const reference =
        `GCE/2026/CA/${allotmentId}`;


    /* =====================================================
       SET PAGE DATA
    ===================================================== */

    setText(
        "referenceNumber",
        reference
    );


    setText(
        "allotmentDate",
        formatDate(allottedAt)
    );


    setText(
        "applicationNumber",
        applicationNumber
    );


    setText(
        "studentName",
        studentName
    );


    setText(
        "community",
        community
    );


    setText(
        "category",
        category
    );


    setText(
        "course",
        course
    );


    setText(
        "cutoffMark",
        cutoff
    );


    setText(
        "collegeAllotted",
        college
    );


    setText(
        "branchAllotted",
        branch
    );


    setText(
        "seatCategory",
        seatCategory
    );


    setText(
        "eligibleFor",
        "MANAGEMENT COUNSELLING"
    );


    setText(
        "reportingDate",
        formatDate(reportingDate)
    );


    /* =====================================================
       ACKNOWLEDGEMENT
    ===================================================== */

    setText(
        "ackCollege",
        college
    );


    setText(
        "ackStudentName",
        studentName
    );


    console.log(
        "Allotment order loaded successfully."
    );
}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(title, message) {

    const documentElement =
        document.querySelector(
            ".document"
        );


    if (!documentElement) {
        return;
    }


    documentElement.innerHTML = `

        <div
            style="
                width:210mm;
                height:297mm;
                background:#fff;
                display:flex;
                justify-content:center;
                align-items:center;
                text-align:center;
                padding:30px;
                font-family:Arial,sans-serif;
            ">

            <div>

                <h2
                    style="
                        margin-bottom:12px;
                        color:#333;
                    ">

                    ${escapeHtml(title)}

                </h2>


                <p
                    style="
                        color:#666;
                        max-width:500px;
                        line-height:1.6;
                    ">

                    ${escapeHtml(message)}

                </p>


                <br>


                <button
                    onclick="goBackToDashboard()"
                    style="
                        padding:10px 18px;
                        border:none;
                        background:#1f6b3a;
                        color:#fff;
                        border-radius:4px;
                        cursor:pointer;
                        font-weight:600;
                    ">

                    ← BACK TO DASHBOARD

                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

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


/* =========================================================
   PRINT
========================================================= */

function printOrder() {

    window.print();
}


/* =========================================================
   BACK
========================================================= */

function goBackToDashboard() {

    window.location.href =
        "student-dashboard.html";
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (printOrderButton) {

    printOrderButton.addEventListener(
        "click",
        printOrder
    );
}


if (backButton) {

    backButton.addEventListener(
        "click",
        goBackToDashboard
    );
}


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            !checkAuthentication()
        ) {

            return;
        }

        loadAllotmentOrder();

    }
);