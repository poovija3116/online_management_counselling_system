/* =========================================================
   GCE ERODE - ALLOTMENT OVERVIEW
   COMBINED ROUND ALLOTMENT
========================================================= */

console.log("🔥 ALLOTMENT OVERVIEW LOADED");


/* =========================================================
   API
========================================================= */

const API_BASE_URL = "http://localhost:5000";


/* =========================================================
   DOM
========================================================= */

const roundSelect =
    document.getElementById("roundSelect");

const programmeFilter =
    document.getElementById("programmeFilter");

const categoryFilter =
    document.getElementById("categoryFilter");

const applyFilters =
    document.getElementById("applyFilters");

const totalApplicants =
    document.getElementById("totalApplicants");

const studentsAllotted =
    document.getElementById("studentsAllotted");

const notAllotted =
    document.getElementById("notAllotted");

const allotmentCompleted =
    document.getElementById("allotmentCompleted");

const completedDate =
    document.getElementById("completedDate");

const allottedPercentage =
    document.getElementById("allottedPercentage");

const notAllottedPercentage =
    document.getElementById("notAllottedPercentage");

const donutChart =
    document.getElementById("donutChart");

const donutTotal =
    document.getElementById("donutTotal");

const legendAllotted =
    document.getElementById("legendAllotted");

const legendNotAllotted =
    document.getElementById("legendNotAllotted");

const programmeChart =
    document.getElementById("programmeChart");

const studentTableBody =
    document.getElementById("studentTableBody");

const studentListCount =
    document.getElementById("studentListCount");


/* =========================================================
   DATA
========================================================= */

let allRounds = [];

let allAllotments = [];

let allStudents = [];


/* =========================================================
   TOKEN
========================================================= */

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("counsellorToken")
    );

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(url, options = {}) {

    const token = getToken();

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            ...options,

            headers: {

                "Content-Type": "application/json",

                ...(token
                    ? {
                        Authorization:
                            `Bearer ${token}`
                    }
                    : {}),

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
            `Request failed: ${response.status}`
        );

    }


    return data;

}


/* =========================================================
   LOAD ROUNDS
========================================================= */

async function loadRounds() {

    try {

        const data =
            await apiRequest("/api/rounds");


        allRounds =
            data.rounds || [];


        populateRoundSelector();


        if (allRounds.length === 0) {

            return;

        }


        /*
         * Find the latest completed/published round.
         */

        const completedRounds =
            allRounds.filter(
                round =>
                    round.status === "completed" ||
                    round.status === "allotment_completed" ||
                    round.allotment_published_at
            );


        if (completedRounds.length > 0) {

            const latest =
                completedRounds[
                    completedRounds.length - 1
                ];


            roundSelect.value =
                String(latest.id);

        }

        else {

            roundSelect.value =
                String(allRounds[0].id);

        }


        await loadAllotments();

    }

    catch (error) {

        console.error(
            "LOAD ROUNDS ERROR:",
            error
        );


        if (roundSelect) {

            roundSelect.innerHTML = `
                <option value="">
                    Unable to load rounds
                </option>
            `;

        }

    }

}


/* =========================================================
   ROUND SELECTOR
========================================================= */

function populateRoundSelector() {

    if (!roundSelect) {

        return;

    }


    roundSelect.innerHTML = "";


    if (allRounds.length === 0) {

        roundSelect.innerHTML = `
            <option value="">
                No rounds available
            </option>
        `;

        return;

    }


    allRounds.forEach(
        round => {

            const option =
                document.createElement("option");


            option.value =
                round.id;


            option.textContent =
                `Round ${round.round_number}`;


            roundSelect.appendChild(option);

        }
    );

}


/* =========================================================
   LOAD ALLOTMENTS
========================================================= */

async function loadAllotments() {

    try {

        showLoading();


        const selectedRoundId =
            roundSelect.value;


        /*
         * Request all allotments from backend.
         *
         * Example:
         *
         * Round 1 completed
         * → Round 1 allotments
         *
         * Round 2 completed
         * → Round 1 + Round 2 allotments
         *
         * Round 3 completed
         * → Round 1 + Round 2 + Round 3 allotments
         */

        const data =
            await apiRequest("/api/allotments");


        allAllotments =
            data.allotments ||
            data.data ||
            [];


        allStudents =
            data.students ||
            [];


        renderOverview(
            Number(selectedRoundId)
        );

    }

    catch (error) {

        console.error(
            "LOAD ALLOTMENTS ERROR:",
            error
        );


        clearTables();

    }

}


/* =========================================================
   GET COMBINED ALLOTMENTS UP TO SELECTED ROUND
========================================================= */

function getCombinedAllotments(roundId) {

    if (!roundId) {

        return [];

    }


    const selectedRound =
        allRounds.find(
            round =>
                Number(round.id) ===
                Number(roundId)
        );


    if (!selectedRound) {

        return [];

    }


    /*
     * Example:
     *
     * Selected Round 1
     * → Round 1
     *
     * Selected Round 2
     * → Round 1 + Round 2
     *
     * Selected Round 3
     * → Round 1 + Round 2 + Round 3
     */

    return allAllotments.filter(
        allotment => {

            const allotmentRound =
                Number(
                    allotment.round_id ||
                    allotment.roundId ||
                    allotment.round_number ||
                    allotment.round
                );


            return (
                allotmentRound <=
                Number(selectedRound.round_number)
            );

        }
    );

}


/* =========================================================
   RENDER OVERVIEW
========================================================= */

function renderOverview(roundId) {

    let allotments =
        getCombinedAllotments(roundId);


    /*
     * DEPARTMENT FILTER
     */

    const programme =
        programmeFilter
            ? programmeFilter.value
            : "all";


    /*
     * CATEGORY FILTER
     */

    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";


    if (programme !== "all") {

        allotments =
            allotments.filter(
                item =>
                    String(
                        item.programme ||
                        item.department ||
                        ""
                    )
                    .toUpperCase()
                    .includes(
                        programme.toUpperCase()
                    )
            );

    }


    if (category !== "all") {

        allotments =
            allotments.filter(
                item =>
                    String(
                        item.community ||
                        item.category ||
                        ""
                    )
                    .toUpperCase() ===
                    category.toUpperCase()
            );

    }


    /*
     * TOTAL APPLICANTS
     */

    const total =
        getTotalApplicants(roundId);


    /*
     * NUMBER OF ALLOTTED STUDENTS
     */

    const allotted =
        allotments.length;


    /*
     * NOT ALLOTTED
     */

    const notSelected =
        Math.max(
            0,
            total - allotted
        );


    updateStatistics(
        total,
        allotted,
        notSelected
    );


    renderDonut(
        total,
        allotted
    );


    renderDepartmentChart(
        allotments
    );


    renderStudentTable(
        allotments
    );

}


/* =========================================================
   TOTAL APPLICANTS
========================================================= */

function getTotalApplicants(roundId) {

    const selectedRound =
        allRounds.find(
            round =>
                Number(round.id) ===
                Number(roundId)
        );


    if (!selectedRound) {

        return allStudents.length;

    }


    const minRank =
        Number(
            selectedRound.min_rank
        );


    const maxRank =
        Number(
            selectedRound.max_rank
        );


    /*
     * If student data is available,
     * count students inside the selected
     * round's rank range.
     */

    if (allStudents.length > 0) {

        const currentRoundStudents =
            allStudents.filter(
                student => {

                    const rank =
                        Number(
                            student.rank_number ||
                            student.rank
                        );


                    return (
                        rank >= minRank &&
                        rank <= maxRank
                    );

                }
            );


        return currentRoundStudents.length;

    }


    /*
     * Otherwise calculate from rank range.
     */

    return (
        maxRank -
        minRank +
        1
    );

}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics(
    total,
    allotted,
    notSelected
) {

    const allottedPercent =
        total > 0
            ? (
                allotted /
                total *
                100
            ).toFixed(1)
            : 0;


    const notAllottedPercent =
        total > 0
            ? (
                notSelected /
                total *
                100
            ).toFixed(1)
            : 0;


    if (totalApplicants) {

        totalApplicants.textContent =
            formatNumber(total);

    }


    if (studentsAllotted) {

        studentsAllotted.textContent =
            formatNumber(allotted);

    }


    if (notAllotted) {

        notAllotted.textContent =
            formatNumber(notSelected);

    }


    if (allottedPercentage) {

        allottedPercentage.textContent =
            `${allottedPercent}% of applicants`;

    }


    if (notAllottedPercentage) {

        notAllottedPercentage.textContent =
            `${notAllottedPercent}% of applicants`;

    }


    const selectedRound =
        allRounds.find(
            round =>
                Number(round.id) ===
                Number(roundSelect.value)
        );


    if (
        selectedRound &&
        (
            selectedRound.status === "completed" ||
            selectedRound.status === "allotment_completed" ||
            selectedRound.allotment_published_at
        )
    ) {

        if (allotmentCompleted) {

            allotmentCompleted.textContent =
                "Yes";

        }


        if (completedDate) {

            completedDate.textContent =
                formatDate(
                    selectedRound.allotment_published_at ||
                    selectedRound.allotment_at
                );

        }

    }

    else {

        if (allotmentCompleted) {

            allotmentCompleted.textContent =
                "No";

        }


        if (completedDate) {

            completedDate.textContent =
                "-";

        }

    }

}


/* =========================================================
   DONUT CHART
========================================================= */

function renderDonut(
    total,
    allotted
) {

    const percent =
        total > 0
            ? (
                allotted /
                total *
                100
            )
            : 0;


    if (donutTotal) {

        donutTotal.textContent =
            formatNumber(total);

    }


    if (legendAllotted) {

        legendAllotted.textContent =
            `${formatNumber(allotted)} (${percent.toFixed(1)}%)`;

    }


    if (legendNotAllotted) {

        legendNotAllotted.textContent =
            `${formatNumber(
                Math.max(
                    0,
                    total - allotted
                )
            )} (${Math.max(
                0,
                100 - percent
            ).toFixed(1)}%)`;

    }


    if (donutChart) {

        donutChart.style.background =
            `conic-gradient(
                #064b31 0% ${percent}%,
                #cce9d9 ${percent}% 100%
            )`;

    }

}


/* =========================================================
   DEPARTMENT CHART
========================================================= */

function renderDepartmentChart(
    allotments
) {

    if (!programmeChart) {

        return;

    }


    programmeChart.innerHTML =
        "";


    const departmentCounts = {};


    allotments.forEach(
        item => {
                const department =
                    item.department_name ||
                    item.department_code ||
                    item.department ||
                    item.programme ||
                    "Other";


            departmentCounts[
                department
            ] =
                (
                    departmentCounts[
                        department
                    ] ||
                    0
                ) + 1;

        }
    );


    const entries =
        Object.entries(
            departmentCounts
        );


    if (entries.length === 0) {

        programmeChart.innerHTML = `
            <div class="loading-row">
                No allotment data available.
            </div>
        `;

        return;

    }


    const max =
        Math.max(
            ...entries.map(
                item =>
                    item[1]
            )
        );


    entries.forEach(
        ([department, count]) => {

            const item =
                document.createElement("div");


            item.className =
                "bar-item";


            const value =
                document.createElement("div");


            value.className =
                "bar-value";


            value.textContent =
                count;


            const bar =
                document.createElement("div");


            bar.className =
                "bar";


            bar.style.height =
                `${Math.max(
                    12,
                    (
                        count /
                        max *
                        145
                    )
                )}px`;


            const label =
                document.createElement("div");


            label.className =
                "bar-label";


            label.textContent =
                department;


            item.appendChild(value);

            item.appendChild(bar);

            item.appendChild(label);


            programmeChart.appendChild(item);

        }
    );

}


/* =========================================================
   STUDENT TABLE
========================================================= */

function renderStudentTable(
    allotments
) {

    if (!studentTableBody) {

        return;

    }


    studentTableBody.innerHTML =
        "";


    if (studentListCount) {

        studentListCount.textContent =
            allotments.length;

    }


    if (allotments.length === 0) {

        studentTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="loading-row">

                    No allotted students found.

                </td>

            </tr>

        `;

        return;

    }


    /*
     * Sort students by rank.
     */

    allotments
        .sort(
            (a, b) =>
                Number(
                    a.rank_number ||
                    a.rank ||
                    999999
                ) -
                Number(
                    b.rank_number ||
                    b.rank ||
                    999999
                )
        )
        .forEach(
            item => {

                const row =
                    document.createElement("tr");


                const rank =
                    item.rank_number ||
                    item.rank ||
                    "-";


                const name =
                    item.student_name ||
                    item.name ||
                    "-";


                const application =
                    item.application_number ||
                    item.application_no ||
                    "-";


                const community =
                    item.community ||
                    item.category ||
                    "-";


                const cutoff =
                    item.cutoff_mark ||
                    item.cutoff ||
                    "-";


                const round =
                    item.round_number ||
                    item.round ||
                    item.round_id ||
                    "-";


              const department =
    item.department_name ||
    item.department_code ||
    item.department ||
    item.programme ||
    "-";

                


                row.innerHTML = `

                    <td>
                        ${escapeHTML(rank)}
                    </td>

                    <td>
                        ${escapeHTML(name)}
                    </td>

                    <td>
                        ${escapeHTML(application)}
                    </td>

                    <td>
                        ${escapeHTML(community)}
                    </td>

                    <td>
                        ${escapeHTML(cutoff)}
                    </td>

                    <td>
                        Round ${escapeHTML(round)}
                    </td>

                    <td>
                        ${escapeHTML(department)}
                    </td>

                   

                    <td>

                        <span
                            class="student-status">

                            ALLOTTED

                        </span>

                    </td>

                `;


                studentTableBody.appendChild(
                    row
                );

            }
        );

}


/* =========================================================
   FILTER BUTTON
========================================================= */

if (applyFilters) {

    applyFilters.addEventListener(
        "click",
        async function () {

            await loadAllotments();

        }
    );

}


/* =========================================================
   ROUND CHANGE
========================================================= */

if (roundSelect) {

    roundSelect.addEventListener(
        "change",
        async function () {

            await loadAllotments();

        }
    );

}


/* =========================================================
   QUICK ACTION - VIEW LIST
========================================================= */

const viewListButton =
    document.getElementById(
        "viewListButton"
    );


if (viewListButton) {

    viewListButton.addEventListener(
        "click",
        function () {

            const panel =
                document.getElementById(
                    "studentListPanel"
                );


            if (panel) {

                panel.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }
    );

}


/* =========================================================
   QUICK ACTION - GENERATE SUMMARY
========================================================= */

const generateSummaryButton =
    document.getElementById(
        "generateSummaryButton"
    );


if (generateSummaryButton) {

    generateSummaryButton.addEventListener(
        "click",
        function () {

            window.print();

        }
    );

}


/* =========================================================
   DOWNLOAD REPORT
========================================================= */

const downloadReportButton =
    document.getElementById(
        "downloadReportButton"
    );


if (downloadReportButton) {

    downloadReportButton.addEventListener(
        "click",
        function () {

            window.print();

        }
    );

}


/* =========================================================
   NOTIFY
========================================================= */

const notifyButton =
    document.getElementById(
        "notifyButton"
    );


if (notifyButton) {

    notifyButton.addEventListener(
        "click",
        function () {

            alert(
                "Student notification feature is ready to connect with your backend."
            );

        }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function formatNumber(number) {

    return Number(
        number || 0
    ).toLocaleString(
        "en-IN"
    );

}


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

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


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


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    if (studentTableBody) {

        studentTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="loading-row">

                    Loading allotted students...

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   CLEAR TABLE
========================================================= */

function clearTables() {

    if (studentTableBody) {

        studentTableBody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="loading-row">

                    No allotment data available.

                </td>

            </tr>

        `;

    }


    if (studentListCount) {

        studentListCount.textContent =
            "0";

    }

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initialize() {

    await loadRounds();

}


document.addEventListener(
    "DOMContentLoaded",
    initialize
);