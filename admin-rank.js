document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // FORM ELEMENTS
    // =========================================

    const studentNameInput =
        document.getElementById("studentName");

    const usernameInput =
        document.getElementById("username");

    const dateOfBirthInput =
        document.getElementById("dateOfBirth");

    const applicationNumberInput =
        document.getElementById("applicationNumber");

    const cutoffInput =
        document.getElementById("cutoff");

    const communityInput =
        document.getElementById("community");


    const marksheetVerifiedInput =
        document.getElementById("marksheetVerified");

    const communityVerifiedInput =
        document.getElementById("communityVerified");

    const applicationVerifiedInput =
        document.getElementById("applicationVerified");


    const addStudentButton =
        document.getElementById("addStudentButton");

    const clearButton =
        document.getElementById("clearButton");


    const adminMessage =
        document.getElementById("adminMessage");


    // =========================================
    // TABLE
    // =========================================

    const studentTableBody =
        document.getElementById("studentTableBody");

    const studentSearch =
        document.getElementById("studentSearch");


    // =========================================
    // SUMMARY
    // =========================================

    const totalStudentsElement =
        document.getElementById("totalStudents");

    const verifiedStudentsElement =
        document.getElementById("verifiedStudents");

    const rankGeneratedElement =
        document.getElementById("rankGenerated");


    const currentRankElements =
        document.querySelectorAll(
            "#currentRank, #controlCurrentRank"
        );


    // =========================================
    // CREDENTIALS
    // =========================================

    const credentialsPanel =
        document.getElementById("credentialsPanel");

    const generatedUsername =
        document.getElementById("generatedUsername");

    const generatedPassword =
        document.getElementById("generatedPassword");

    const copyCredentialsButton =
        document.getElementById("copyCredentialsButton");

    const copyMessage =
        document.getElementById("copyMessage");


    // =========================================
    // COUNSELLING CONTROLS
    // =========================================

    const startCounsellingButton =
        document.getElementById(
            "startCounsellingButton"
        );

    const nextRankButton =
        document.getElementById(
            "nextRankButton"
        );


    // =========================================
    // EMAIL CREDENTIAL STATUS
    // =========================================

    const credentialStudentEmail =
        document.getElementById(
            "credentialStudentEmail"
        );

    const emailStatusBadge =
        document.getElementById(
            "emailStatusBadge"
        );

    const credentialEmailStatus =
        document.getElementById(
            "credentialEmailStatus"
        );


    // =========================================
    // DATA
    // =========================================

    let students = [];

    let counsellingStarted = false;

    let activeRank = 0;


    // =========================================
    // INITIAL LOAD
    // =========================================

    loadStudents();

    loadCounsellingState();

    updateSummary();


    // =========================================
    // LOAD STUDENTS FROM MYSQL
    // =========================================

    async function loadStudents() {

        try {

            console.log(
                "Loading students from MySQL..."
            );


            // -------------------------------------
            // GET ADMIN TOKEN
            // -------------------------------------

            const token =
                localStorage.getItem("token");


            if (!token) {

                console.error(
                    "No authentication token found."
                );

                showMessage(
                    "Please login as admin first.",
                    "error"
                );

                displayStudents();

                return;

            }


            // -------------------------------------
            // API REQUEST
            // -------------------------------------

            const response =
                await fetch(
                    "http://https://online-management-counselling-system-1.onrender.com/api/admin/students",
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                "Bearer " + token,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );


            // -------------------------------------
            // READ RESPONSE
            // -------------------------------------

            const data =
                await response.json();


            console.log(
                "ADMIN STUDENTS RESPONSE:",
                data
            );


            // -------------------------------------
            // CHECK RESPONSE
            // -------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to fetch students"
                );

            }


            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to load students"
                );

            }


            // -------------------------------------
            // CONVERT API DATA
            // -------------------------------------

            students =
                Array.isArray(data.students)
                    ? data.students.map(
                        function (student) {

                            return {

                                id:
                                    student.student_id,

                                studentName:
                                    student.student_name || "",

                                username:
                                    student.email || "",

                                password:
                                    "",

                                dateOfBirth:
                                    student.date_of_birth || "",

                                applicationNumber:
                                    student.application?.number || "",

                                cutoff:
                                    student.cutoff_mark ?? "",

                                community:
                                    student.community || "",

                                documentsVerified:
                                    true,

                                /*
                                 * Keep the original database
                                 * rank temporarily.
                                 *
                                 * calculateRanks() will use it
                                 * only as a tie-breaker when
                                 * two students have the same
                                 * cutoff.
                                 */
                                rank:
                                    student.rank || 0,

                                status:
                                    student.overall_status ||
                                    "Verified"

                            };

                        }
                    )
                    : [];


            // -------------------------------------
            // CALCULATE AUTOMATIC RANK
            // -------------------------------------

            calculateRanks();


            // -------------------------------------
            // DISPLAY
            // -------------------------------------

            displayStudents();

            updateSummary();


            console.log(
                "Students loaded:",
                students.length
            );


            if (students.length > 0) {

                showMessage(
                    students.length +
                    " student record(s) loaded successfully.",
                    "success"
                );

            } else {

                showMessage(
                    "No student records found in database.",
                    "error"
                );

            }


        } catch (error) {

            console.error(
                "LOAD STUDENTS ERROR:",
                error
            );


            students = [];


            displayStudents();

            updateSummary();


            showMessage(
                "Unable to load students from database: " +
                error.message,
                "error"
            );

        }

    }


    // =========================================
    // ADD STUDENT
    // =========================================

    if (addStudentButton) {

        addStudentButton.addEventListener(
            "click",
            async function () {

                const name =
                    studentNameInput.value.trim();

                const email =
                    usernameInput.value.trim();

                const dob =
                    dateOfBirthInput.value;

                const applicationNumber =
                    applicationNumberInput.value.trim();

                const cutoffText =
                    cutoffInput.value.trim();

                const community =
                    communityInput.value;


                // ---------------------------------
                // VALIDATION
                // ---------------------------------

                if (
                    name === "" ||
                    email === "" ||
                    dob === "" ||
                    applicationNumber === "" ||
                    cutoffText === "" ||
                    community === ""
                ) {

                    showMessage(
                        "Please fill all student details.",
                        "error"
                    );

                    return;

                }


                if (
                    !marksheetVerifiedInput.checked ||
                    !communityVerifiedInput.checked ||
                    !applicationVerifiedInput.checked
                ) {

                    showMessage(
                        "Please verify all documents before generating the rank.",
                        "error"
                    );

                    return;

                }


                const cutoff =
                    Number(cutoffText);


                if (
                    Number.isNaN(cutoff) ||
                    cutoff < 0 ||
                    cutoff > 200
                ) {

                    showMessage(
                        "Please enter a valid cutoff between 0 and 200.",
                        "error"
                    );

                    return;

                }


                // ---------------------------------
                // GET ADMIN TOKEN
                // ---------------------------------

                const token =
                    localStorage.getItem("token");


                if (!token) {

                    showMessage(
                        "Admin login required.",
                        "error"
                    );

                    return;

                }


                // ---------------------------------
                // CHECK DUPLICATE EMAIL
                // ---------------------------------

                const emailExists =
                    students.some(
                        function (student) {

                            return (
                                String(
                                    student.username || ""
                                ).toLowerCase() ===
                                email.toLowerCase()
                            );

                        }
                    );


                if (emailExists) {

                    showMessage(
                        "This email / username already exists.",
                        "error"
                    );

                    return;

                }


                // ---------------------------------
                // CHECK DUPLICATE APPLICATION
                // ---------------------------------

                const applicationExists =
                    students.some(
                        function (student) {

                            return (
                                String(
                                    student.applicationNumber || ""
                                ).toLowerCase() ===
                                applicationNumber.toLowerCase()
                            );

                        }
                    );


                if (applicationExists) {

                    showMessage(
                        "This application number already exists.",
                        "error"
                    );

                    return;

                }


                // ---------------------------------
                // PASSWORD
                // ---------------------------------

                const password =
                    generatePassword(
                        name,
                        dob
                    );


                try {

                    addStudentButton.disabled =
                        true;

                    addStudentButton.textContent =
                        "ADDING...";


                    // ---------------------------------
                    // ADD STUDENT TO DATABASE
                    // ---------------------------------

                    const response =
                        await fetch(
                            "http://https://online-management-counselling-system-1.onrender.com/api/admin/students",
                            {
                                method: "POST",

                                headers: {

                                    "Authorization":
                                        "Bearer " + token,

                                    "Content-Type":
                                        "application/json"

                                },

                                body: JSON.stringify({

                                    name:
                                        name,

                                    email:
                                        email,

                                    password:
                                        password,

                                    date_of_birth:
                                        dob,

                                    application_number:
                                        applicationNumber,

                                    cutoff_mark:
                                        cutoff,

                                    community:
                                        community

                                })

                            }
                        );


                    const data =
                        await response.json();


                    console.log(
                        "ADD STUDENT RESPONSE:",
                        data
                    );


                    if (!response.ok || !data.success) {

                        throw new Error(
                            data.message ||
                            "Failed to add student"
                        );

                    }


                    // ---------------------------------
                    // SHOW CREDENTIALS
                    // ---------------------------------

                    showCredentials(
                        email,
                        password
                    );


                    // ---------------------------------
                    // EMAIL STATUS
                    // ---------------------------------

                    if (credentialStudentEmail) {

                        credentialStudentEmail.value =
                            email;

                    }


                    if (emailStatusBadge) {

                        emailStatusBadge.textContent =
                            "SENT";

                    }


                    if (credentialEmailStatus) {

                        credentialEmailStatus.textContent =
                            "● Login credentials sent to student's email";

                    }


                    // ---------------------------------
                    // RELOAD DATABASE RECORDS
                    // ---------------------------------

                    await loadStudents();


                    showMessage(
                        "Student added successfully.",
                        "success"
                    );


                    clearForm();


                } catch (error) {

                    console.error(
                        "ADD STUDENT ERROR:",
                        error
                    );


                    showMessage(
                        "Unable to add student: " +
                        error.message,
                        "error"
                    );


                } finally {

                    addStudentButton.disabled =
                        false;

                    addStudentButton.textContent =
                        "ADD STUDENT";

                }

            }
        );

    }


    // =========================================
    // CLEAR
    // =========================================

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            function () {

                clearForm();

                showMessage(
                    "",
                    ""
                );

            }
        );

    }


    // =========================================
    // SEARCH
    // =========================================

    if (studentSearch) {

        studentSearch.addEventListener(
            "input",
            function () {

                displayStudents(
                    studentSearch.value
                );

            }

        );

    }


    // =========================================
    // GENERATE PASSWORD
    // =========================================

    function generatePassword(
        name,
        dob
    ) {

        const cleanName =
            name.replace(/\s+/g, "");


        const dateParts =
            dob.split("-");


        if (
            dateParts.length !== 3
        ) {

            return cleanName;

        }


        const year =
            dateParts[0];

        const month =
            dateParts[1];

        const day =
            dateParts[2];


        return (
            cleanName +
            "@" +
            day +
            month +
            year
        );

    }


    // =========================================
    // AUTOMATIC RANK
    // =========================================
    //
    // RULE:
    // Higher cutoff = higher rank
    //
    // If two students have the same cutoff,
    // their previous database rank is used
    // as the tie-breaker.
    //
    // Every student receives a NEW sequential
    // rank: 1, 2, 3, 4, ...
    // =========================================

    function calculateRanks() {

        students.sort(
            function (a, b) {

                const cutoffA =
                    Number(a.cutoff) || 0;

                const cutoffB =
                    Number(b.cutoff) || 0;


                // ---------------------------------
                // FIRST PRIORITY:
                // HIGHER CUTOFF FIRST
                // ---------------------------------

                if (
                    cutoffB !== cutoffA
                ) {

                    return (
                        cutoffB -
                        cutoffA
                    );

                }


                // ---------------------------------
                // SECOND PRIORITY:
                // SAME CUTOFF
                //
                // Keep previous rank order
                // ---------------------------------

                const oldRankA =
                    Number(a.rank) || 999999;

                const oldRankB =
                    Number(b.rank) || 999999;


                return (
                    oldRankA -
                    oldRankB
                );

            }
        );


        // -----------------------------------------
        // ASSIGN NEW SEQUENTIAL RANK
        // -----------------------------------------

        students.forEach(
            function (student, index) {

                student.rank =
                    index + 1;

            }
        );


        // -----------------------------------------
        // DEBUG OUTPUT
        // -----------------------------------------

        console.log(
            "AUTOMATIC RANK CALCULATION:"
        );


        students.forEach(
            function (student) {

                console.log(
                    "Rank:",
                    student.rank,
                    "| Name:",
                    student.studentName,
                    "| Cutoff:",
                    student.cutoff
                );

            }
        );

    }


    // =========================================
    // DISPLAY TABLE
    // =========================================

    function displayStudents(
        searchText = ""
    ) {

        if (!studentTableBody) {

            return;

        }


        studentTableBody.innerHTML =
            "";


        const search =
            String(searchText)
                .toLowerCase()
                .trim();


        const filteredStudents =
            students.filter(
                function (student) {

                    return (

                        String(
                            student.studentName || ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(
                            student.username || ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(
                            student.applicationNumber || ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(
                            student.community || ""
                        )
                            .toLowerCase()
                            .includes(search)

                    );

                }
            );


        // -----------------------------------------
        // NO RECORDS
        // -----------------------------------------

        if (
            filteredStudents.length === 0
        ) {

            const row =
                document.createElement("tr");


            const cell =
                document.createElement("td");


            cell.colSpan = 7;

            cell.textContent =
                "No student records found.";


            cell.style.textAlign =
                "center";

            cell.style.padding =
                "25px";


            row.appendChild(
                cell
            );


            studentTableBody.appendChild(
                row
            );


            return;

        }


        // -----------------------------------------
        // CREATE ROWS
        // -----------------------------------------

        filteredStudents.forEach(
            function (student) {

                const row =
                    document.createElement("tr");


                // ---------------------------------
                // RANK
                // ---------------------------------

                addCell(
                    row,
                    student.rank || "-"
                );


                // ---------------------------------
                // APPLICATION
                // ---------------------------------

                addCell(
                    row,
                    student.applicationNumber || "-"
                );


                // ---------------------------------
                // NAME
                // ---------------------------------

                addCell(
                    row,
                    student.studentName || "-"
                );


                // ---------------------------------
                // COMMUNITY
                // ---------------------------------

                addCell(
                    row,
                    student.community || "-"
                );


                // ---------------------------------
                // CUTOFF
                // ---------------------------------

                const cutoffValue =
                    Number(student.cutoff);


                addCell(
                    row,
                    Number.isNaN(cutoffValue)
                        ? "-"
                        : cutoffValue.toFixed(2)
                );


                // ---------------------------------
                // USERNAME / EMAIL
                // ---------------------------------

                addCell(
                    row,
                    student.username || "-"
                );


                // ---------------------------------
                // STATUS
                // ---------------------------------

                const statusCell =
                    document.createElement("td");


                const status =
                    document.createElement(
                        "span"
                    );


                status.className =
                    "table-status";


                status.textContent =
                    student.status ||
                    "Verified";


                statusCell.appendChild(
                    status
                );


                row.appendChild(
                    statusCell
                );


                studentTableBody.appendChild(
                    row
                );

            }
        );

    }


    // =========================================
    // ADD TABLE CELL
    // =========================================

    function addCell(
        row,
        value
    ) {

        const cell =
            document.createElement("td");


        cell.textContent =
            value;


        row.appendChild(
            cell
        );

    }


    // =========================================
    // SUMMARY
    // =========================================

    function updateSummary() {

        if (totalStudentsElement) {

            totalStudentsElement.textContent =
                students.length;

        }


        const verifiedCount =
            students.filter(
                function (student) {

                    return (
                        student.documentsVerified === true
                    );

                }
            ).length;


        const rankedCount =
            students.filter(
                function (student) {

                    return (
                        Number(student.rank) > 0
                    );

                }
            ).length;


        if (verifiedStudentsElement) {

            verifiedStudentsElement.textContent =
                verifiedCount;

        }


        if (rankGeneratedElement) {

            rankGeneratedElement.textContent =
                rankedCount;

        }


        currentRankElements.forEach(
            function (element) {

                if (
                    counsellingStarted &&
                    activeRank > 0
                ) {

                    element.textContent =
                        activeRank;

                } else {

                    element.textContent =
                        "-";

                }

            }
        );

    }


    // =========================================
    // COUNSELLING START
    // =========================================

    if (startCounsellingButton) {

        startCounsellingButton.addEventListener(
            "click",
            function () {

                if (
                    students.length === 0
                ) {

                    showMessage(
                        "No students available.",
                        "error"
                    );

                    return;

                }


                // Recalculate ranks before starting
                calculateRanks();


                activeRank = 1;

                counsellingStarted =
                    true;


                saveCounsellingState();

                updateSummary();


                showMessage(
                    "Counselling started. Current rank is 1.",
                    "success"
                );

            }

        );

    }


    // =========================================
    // NEXT RANK
    // =========================================

    if (nextRankButton) {

        nextRankButton.addEventListener(
            "click",
            function () {

                if (
                    !counsellingStarted
                ) {

                    showMessage(
                        "Please start counselling first.",
                        "error"
                    );

                    return;

                }


                if (
                    activeRank >= students.length
                ) {

                    showMessage(
                        "All student ranks have been completed.",
                        "success"
                    );

                    return;

                }


                activeRank =
                    activeRank + 1;


                saveCounsellingState();

                updateSummary();


                showMessage(
                    "Counselling moved to rank " +
                    activeRank +
                    ".",
                    "success"
                );

            }

        );

    }


    // =========================================
    // SHOW CREDENTIALS
    // =========================================

    function showCredentials(
        username,
        password
    ) {

        if (generatedUsername) {

            generatedUsername.textContent =
                username;

        }


        if (generatedPassword) {

            generatedPassword.textContent =
                password;

        }


        if (credentialsPanel) {

            credentialsPanel.style.display =
                "block";

        }


        if (copyMessage) {

            copyMessage.textContent =
                "";

        }

    }


    // =========================================
    // COPY CREDENTIALS
    // =========================================

    if (copyCredentialsButton) {

        copyCredentialsButton.addEventListener(
            "click",
            async function () {

                const username =
                    generatedUsername
                        ? generatedUsername.textContent
                        : "-";


                const password =
                    generatedPassword
                        ? generatedPassword.textContent
                        : "-";


                if (
                    username === "-" ||
                    password === "-"
                ) {

                    return;

                }


                const credentialsText =
                    "GCE Erode Student Login\n" +
                    "Username: " +
                    username +
                    "\nPassword: " +
                    password;


                try {

                    await navigator.clipboard.writeText(
                        credentialsText
                    );


                    if (copyMessage) {

                        copyMessage.textContent =
                            "Credentials copied.";

                    }

                } catch (error) {

                    if (copyMessage) {

                        copyMessage.textContent =
                            "Unable to copy credentials.";

                    }

                }

            }

        );

    }


    // =========================================
    // CLEAR FORM
    // =========================================

    function clearForm() {

        if (studentNameInput) {

            studentNameInput.value =
                "";

        }


        if (usernameInput) {

            usernameInput.value =
                "";

        }


        if (dateOfBirthInput) {

            dateOfBirthInput.value =
                "";

        }


        if (applicationNumberInput) {

            applicationNumberInput.value =
                "";

        }


        if (cutoffInput) {

            cutoffInput.value =
                "";

        }


        if (communityInput) {

            communityInput.value =
                "";

        }


        if (marksheetVerifiedInput) {

            marksheetVerifiedInput.checked =
                false;

        }


        if (communityVerifiedInput) {

            communityVerifiedInput.checked =
                false;

        }


        if (applicationVerifiedInput) {

            applicationVerifiedInput.checked =
                false;

        }

    }


    // =========================================
    // MESSAGE
    // =========================================

    function showMessage(
        message,
        type
    ) {

        if (!adminMessage) {

            return;

        }


        adminMessage.textContent =
            message;


        if (
            type === "success"
        ) {

            adminMessage.style.color =
                "#176B45";

        }
        else if (
            type === "error"
        ) {

            adminMessage.style.color =
                "#b34b4b";

        }
        else {

            adminMessage.style.color =
                "#55745d";

        }

    }


    // =========================================
    // COUNSELLING STATE
    // =========================================

    function loadCounsellingState() {

        try {

            const savedState =
                JSON.parse(
                    localStorage.getItem(
                        "gceCounsellingState"
                    )
                );


            if (
                savedState
            ) {

                counsellingStarted =
                    savedState.started ||
                    false;

                activeRank =
                    savedState.activeRank ||
                    0;

            }

        } catch (error) {

            counsellingStarted =
                false;

            activeRank =
                0;

        }

    }


    // =========================================
    // SAVE COUNSELLING STATE
    // =========================================

    function saveCounsellingState() {

        localStorage.setItem(
            "gceCounsellingState",
            JSON.stringify({

                started:
                    counsellingStarted,

                activeRank:
                    activeRank

            })
        );

    }


});