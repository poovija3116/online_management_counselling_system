// ================================
// COUNSELLING OFFICER DATA
// ================================

const students = [
    {
        rank: 1,
        name: "Student 001",
        applicationNumber: "GCE2026001",
        category: "BC",

        preferences: [
            "CSE",
            "IT",
            "ECE"
        ]
    },

    {
        rank: 2,
        name: "Student 002",
        applicationNumber: "GCE2026002",
        category: "OC",

        preferences: [
            "IT",
            "CSE",
            "EEE"
        ]
    },

    {
        rank: 3,
        name: "Student 003",
        applicationNumber: "GCE2026003",
        category: "MBC",

        preferences: [
            "ECE",
            "CSE",
            "IT"
        ]
    }
];


// ================================
// SEAT DATA
// ================================

const seats = {

    CSE: {
        total: 60,
        occupied: 58
    },

    IT: {
        total: 60,
        occupied: 56
    },

    ECE: {
        total: 60,
        occupied: 60
    },

    EEE: {
        total: 60,
        occupied: 55
    }

};


// ================================
// CURRENT STUDENT
// ================================

let currentStudentIndex = 0;


// ================================
// GET ELEMENTS
// ================================

const currentRank =
    document.getElementById("currentRank");

const studentRank =
    document.getElementById("studentRank");

const studentName =
    document.getElementById("studentName");

const applicationNumber =
    document.getElementById("applicationNumber");

const studentCategory =
    document.getElementById("studentCategory");

const preferenceList =
    document.querySelector(".preference-list");

const seatTableBody =
    document.querySelector("tbody");


// ================================
// DISPLAY STUDENT
// ================================

function displayStudent() {

    const student =
        students[currentStudentIndex];

    currentRank.textContent =
        student.rank;

    studentRank.textContent =
        student.rank;

    studentName.textContent =
        student.name;

    applicationNumber.textContent =
        student.applicationNumber;

    studentCategory.textContent =
        student.category;


    displayPreferences(
        student.preferences
    );

    updateSeatTable();
}


// ================================
// DISPLAY PREFERENCES
// ================================

function displayPreferences(preferences) {

    preferenceList.innerHTML = "";


    preferences.forEach(
        (department, index) => {

            const seat =
                seats[department];

            let vacancy = 0;

            if (seat) {

                vacancy =
                    seat.total -
                    seat.occupied;

            }


            const row =
                document.createElement("div");

            row.className =
                "preference-row";


            const priority =
                document.createElement("div");

            priority.className =
                "priority";

            priority.textContent =
                String(index + 1).padStart(2, "0");


            const departmentElement =
                document.createElement("div");

            departmentElement.className =
                "department";

            departmentElement.textContent =
                department;


            const status =
                document.createElement("div");

            status.className =
                "preference-status";


            if (vacancy > 0) {

                status.classList.add(
                    "available"
                );

                status.textContent =
                    `${vacancy} SEAT AVAILABLE`;

            } else {

                status.classList.add(
                    "full"
                );

                status.textContent =
                    "SEAT FULL";

            }


            row.appendChild(priority);

            row.appendChild(
                departmentElement
            );

            row.appendChild(status);

            preferenceList.appendChild(row);

        }
    );
}


// ================================
// UPDATE SEAT TABLE
// ================================

function updateSeatTable() {

    seatTableBody.innerHTML = "";


    Object.keys(seats).forEach(
        department => {

            const seat =
                seats[department];

            const vacancy =
                seat.total -
                seat.occupied;


            const row =
                document.createElement("tr");


            const departmentCell =
                document.createElement("td");

            departmentCell.textContent =
                department;


            const totalCell =
                document.createElement("td");

            totalCell.textContent =
                seat.total;


            const occupiedCell =
                document.createElement("td");

            occupiedCell.textContent =
                seat.occupied;


            const vacancyCell =
                document.createElement("td");

            vacancyCell.className =
                "vacancy";

            vacancyCell.textContent =
                vacancy;


            const statusCell =
                document.createElement("td");


            const status =
                document.createElement("span");


            if (vacancy > 0) {

                status.className =
                    "seat-available";

                status.textContent =
                    "AVAILABLE";

            } else {

                status.className =
                    "seat-full";

                status.textContent =
                    "FULL";

            }


            statusCell.appendChild(
                status
            );


            row.appendChild(
                departmentCell
            );

            row.appendChild(
                totalCell
            );

            row.appendChild(
                occupiedCell
            );

            row.appendChild(
                vacancyCell
            );

            row.appendChild(
                statusCell
            );


            seatTableBody.appendChild(
                row
            );

        }
    );
}


// ================================
// NEXT STUDENT
// ================================

document
    .getElementById("nextRank")
    .addEventListener(
        "click",
        function () {

            if (
                currentStudentIndex <
                students.length - 1
            ) {

                currentStudentIndex++;

                displayStudent();

            } else {

                alert(
                    "No more students in the list."
                );

            }

        }
    );


// ================================
// PREVIOUS STUDENT
// ================================

document
    .getElementById("previousRank")
    .addEventListener(
        "click",
        function () {

            if (
                currentStudentIndex > 0
            ) {

                currentStudentIndex--;

                displayStudent();

            }

        }
    );


// ================================
// ALLOTMENT MODAL
// ================================

const modal =
    document.getElementById(
        "confirmationModal"
    );

const confirmationMessage =
    document.getElementById(
        "confirmationMessage"
    );


// ================================
// ACCEPT & ALLOT
// ================================

document
    .getElementById("allotSeat")
    .addEventListener(
        "click",
        function () {

            const student =
                students[currentStudentIndex];

            const firstAvailable =
                student.preferences.find(
                    department => {

                        const seat =
                            seats[department];

                        if (!seat) {
                            return false;
                        }

                        return (
                            seat.total -
                            seat.occupied
                        ) > 0;

                    }
                );


            if (!firstAvailable) {

                alert(
                    "No preferred department has an available seat."
                );

                return;

            }


            confirmationMessage.textContent =
                `Confirm ${firstAvailable} seat allotment for Rank ${student.rank}?`;


            modal.classList.add("show");

        }
    );


// ================================
// CONFIRM ALLOTMENT
// ================================

document
    .getElementById("confirmModal")
    .addEventListener(
        "click",
        function () {

            const student =
                students[currentStudentIndex];


            const department =
                student.preferences.find(
                    department => {

                        const seat =
                            seats[department];

                        if (!seat) {
                            return false;
                        }

                        return (
                            seat.total -
                            seat.occupied
                        ) > 0;

                    }
                );


            if (!department) {

                modal.classList.remove(
                    "show"
                );

                return;

            }


            // Increase occupied seats

            seats[department].occupied++;


            modal.classList.remove(
                "show"
            );


            alert(
                `Seat allotted successfully!\n\nRank: ${student.rank}\nDepartment: ${department}`
            );


            displayStudent();

        }
    );


// ================================
// CANCEL MODAL
// ================================

document
    .getElementById("cancelModal")
    .addEventListener(
        "click",
        function () {

            modal.classList.remove(
                "show"
            );

        }
    );


// ================================
// SKIP STUDENT
// ================================

document
    .getElementById("skipStudent")
    .addEventListener(
        "click",
        function () {

            if (
                currentStudentIndex <
                students.length - 1
            ) {

                currentStudentIndex++;

                displayStudent();

            } else {

                alert(
                    "No more students to skip."
                );

            }

        }
    );


// ================================
// LOGOUT
// ================================

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        function () {

            window.location.href =
                "seat-availability.html";

        }
    );


// ================================
// INITIAL LOAD
// ================================

displayStudent();