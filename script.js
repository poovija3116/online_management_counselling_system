// ==========================================
// ADMIN SEAT AVAILABILITY
// ==========================================

console.log("🔥 CORRECTED SEAT SCRIPT IS RUNNING 🔥");

const API_BASE_URL = "http://https://online-management-counselling-system-1.onrender.com";


// ==========================================
// GET ADMIN TOKEN
// ==========================================

function getAdminToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("authToken")
    );
}


// ==========================================
// COMMUNITY TOTAL SEATS
// TOTAL = 21
// ==========================================

const COMMUNITY_TOTALS = {
    OC: 3,
    BC: 6,
    BCM: 2,
    SC: 5,
    ST: 3,
    SCA: 2
};


// ==========================================
// CATEGORIES
// ==========================================

const CATEGORIES = [
    "OC",
    "BC",
    "BCM",
    "SC",
    "ST",
    "SCA"
];


// ==========================================
// GET COMMUNITY TOTAL
// ==========================================

function getCommunityTotal(departmentCode, category) {
    return Number(COMMUNITY_TOTALS[category] || 0);
}


// ==========================================
// LOAD SEAT DATA
// ==========================================

async function loadSeatData() {

    try {

        console.log("Loading seat availability...");

        const token = getAdminToken();

        if (!token) {

            console.error("Admin token not found.");

            alert("Admin login token not found. Please login again.");

            return;
        }


        const response = await fetch(
            `${API_BASE_URL}/api/departments`,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        const data = await response.json();

        console.log("Seat API response:", data);


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Failed to load seat availability"
            );
        }


        if (!Array.isArray(data.departments)) {

            throw new Error(
                "Departments data is not an array"
            );
        }


        console.log(
            "Departments received:",
            data.departments
        );


        updateSeatTable(data.departments);

    }

    catch (error) {

        console.error(
            "SEAT AVAILABILITY ERROR:",
            error
        );

        alert(
            "Failed to load seat availability: " +
            error.message
        );
    }
}


// ==========================================
// UPDATE TABLE
// ==========================================

function updateSeatTable(departments) {

    const rows = document.querySelectorAll(
        "#seatTableBody tr:not(.total-row)"
    );

    console.log(
        "Table rows found:",
        rows.length
    );


    rows.forEach(row => {

        const branchElement =
            row.querySelector(".branch-name");


        if (!branchElement) {
            return;
        }


        const branch =
            branchElement.textContent
                .trim()
                .toUpperCase();


        const department =
            departments.find(dept => {

                return (
                    String(dept.code)
                        .trim()
                        .toUpperCase()
                    === branch
                );

            });


        if (!department) {

            console.warn(
                "Department not found:",
                branch
            );

            return;
        }


        console.log(
            "Updating:",
            department.code,
            department
        );


        // ======================================
        // COMMUNITY DATA
        // ======================================

        CATEGORIES.forEach(
            (category, index) => {

                const community =
                    department.communities?.[category];


                const occupied =
                    Number(
                        community?.occupied || 0
                    );


                const total =
                    getCommunityTotal(
                        department.code,
                        category
                    );


                const vacancy =
                    Math.max(
                        total - occupied,
                        0
                    );


                /*
                 * TABLE COLUMNS
                 *
                 * 0  = BRANCH
                 *
                 * OC
                 * 1  = TOTAL
                 * 2  = OCCUPIED
                 * 3  = VACANCY
                 *
                 * BC
                 * 4  = TOTAL
                 * 5  = OCCUPIED
                 * 6  = VACANCY
                 *
                 * BCM
                 * 7  = TOTAL
                 * 8  = OCCUPIED
                 * 9  = VACANCY
                 *
                 * SC
                 * 10 = TOTAL
                 * 11 = OCCUPIED
                 * 12 = VACANCY
                 *
                 * ST
                 * 13 = TOTAL
                 * 14 = OCCUPIED
                 * 15 = VACANCY
                 *
                 * SCA
                 * 16 = TOTAL
                 * 17 = OCCUPIED
                 * 18 = VACANCY
                 *
                 * OVERALL
                 * 19 = TOTAL
                 * 20 = OCCUPIED
                 * 21 = VACANCY
                 */


                const startColumn =
                    1 + (index * 3);


                if (row.children[startColumn]) {

                    row.children[startColumn]
                        .textContent = total;
                }


                if (row.children[startColumn + 1]) {

                    row.children[startColumn + 1]
                        .textContent = occupied;
                }


                if (row.children[startColumn + 2]) {

                    row.children[startColumn + 2]
                        .textContent = vacancy;
                }

            }
        );


        // ======================================
        // OVERALL DEPARTMENT TOTAL
        // ======================================

        /*
         * EVERY DEPARTMENT HAS 21 SEATS
         */

        const overallTotal = 21;


        const overallOccupied =
            Number(
                department.occupied_seats || 0
            );


        const overallVacancy =
            Math.max(
                overallTotal - overallOccupied,
                0
            );


        if (row.children[19]) {

            row.children[19]
                .textContent = overallTotal;
        }


        if (row.children[20]) {

            row.children[20]
                .textContent = overallOccupied;
        }


        if (row.children[21]) {

            row.children[21]
                .textContent = overallVacancy;
        }

    });


    // Update bottom TOTAL row

    updateGrandTotals(departments);
}


// ==========================================
// UPDATE BOTTOM TOTAL ROW
// ==========================================

function updateGrandTotals(departments) {

    const totalRow =
        document.querySelector(".total-row");


    if (!totalRow) {

        console.error(
            "Total row not found"
        );

        return;
    }


    // ======================================
    // COMMUNITY TOTALS
    // ======================================

    CATEGORIES.forEach(
        (category, index) => {

            let total = 0;

            let occupied = 0;


            departments.forEach(
                department => {

                    total +=
                        getCommunityTotal(
                            department.code,
                            category
                        );


                    occupied +=
                        Number(
                            department
                                .communities?.[
                                    category
                                ]?.occupied || 0
                        );

                }
            );


            const vacancy =
                Math.max(
                    total - occupied,
                    0
                );


            const startColumn =
                1 + (index * 3);


            if (totalRow.children[startColumn]) {

                totalRow.children[startColumn]
                    .textContent = total;
            }


            if (totalRow.children[startColumn + 1]) {

                totalRow.children[startColumn + 1]
                    .textContent = occupied;
            }


            if (totalRow.children[startColumn + 2]) {

                totalRow.children[startColumn + 2]
                    .textContent = vacancy;
            }

        }
    );


    // ======================================
    // GRAND TOTAL
    // ======================================

    /*
     * 8 departments × 21 seats
     *
     * = 168 seats
     */

    const grandTotal =
        departments.length * 21;


    let grandOccupied = 0;


    departments.forEach(
        department => {

            grandOccupied +=
                Number(
                    department.occupied_seats || 0
                );

        }
    );


    const grandVacancy =
        Math.max(
            grandTotal - grandOccupied,
            0
        );


    if (totalRow.children[19]) {

        totalRow.children[19]
            .textContent = grandTotal;
    }


    if (totalRow.children[20]) {

        totalRow.children[20]
            .textContent = grandOccupied;
    }


    if (totalRow.children[21]) {

        totalRow.children[21]
            .textContent = grandVacancy;
    }


    console.log(
        "GRAND TOTAL:",
        {
            total: grandTotal,
            occupied: grandOccupied,
            vacancy: grandVacancy
        }
    );
}


// ==========================================
// SEARCH BRANCH
// ==========================================

function setupBranchSearch() {

    const branchSearch =
        document.getElementById(
            "branchSearch"
        );


    if (!branchSearch) {

        console.warn(
            "branchSearch input not found"
        );

        return;
    }


    branchSearch.addEventListener(
        "input",
        function () {

            const search =
                this.value
                    .trim()
                    .toLowerCase();


            const rows =
                document.querySelectorAll(
                    "#seatTableBody tr:not(.total-row)"
                );


            rows.forEach(row => {

                const branchElement =
                    row.querySelector(
                        ".branch-name"
                    );


                if (!branchElement) {
                    return;
                }


                const branchName =
                    branchElement
                        .textContent
                        .trim()
                        .toLowerCase();


                row.style.display =
                    branchName.includes(search)
                        ? ""
                        : "none";

            });

        }
    );
}


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "DOM loaded. Loading seat data..."
        );

        setupBranchSearch();

        loadSeatData();

    }
);