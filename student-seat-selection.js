// ==========================================
// STUDENT SEAT SELECTION
// ==========================================

let selectedDepartment = null;


// ==========================================
// SELECT BUTTONS
// ==========================================

const selectButtons =
    document.querySelectorAll(".select-seat");

const modal =
    document.getElementById("confirmationModal");

const modalDepartment =
    document.getElementById("modalDepartment");

const cancelSelection =
    document.getElementById("cancelSelection");

const confirmSelection =
    document.getElementById("confirmSelection");

const selectionMessage =
    document.getElementById("selectionMessage");

const selectedDepartmentText =
    document.getElementById("selectedDepartment");


// ==========================================
// OPEN CONFIRMATION
// ==========================================

selectButtons.forEach(button => {

    button.addEventListener("click", function () {

        const department =
            this.dataset.department;

        selectedDepartment =
            department;

        modalDepartment.textContent =
            department;

        modal.classList.add("show");

    });

});


// ==========================================
// CANCEL
// ==========================================

cancelSelection.addEventListener(
    "click",
    function () {

        selectedDepartment = null;

        modal.classList.remove("show");

    }
);


// ==========================================
// CONFIRM SEAT
// ==========================================

confirmSelection.addEventListener(
    "click",
    async function () {

        if (!selectedDepartment) {
            return;
        }


        // Student information
        // Temporary values for testing

        const studentData = {

            rank: 121,

            name: "Student 121",

            applicationNumber:
                "GCE2026121",

            category: "BC",

            department:
                selectedDepartment

        };


        try {

            const response =
                await fetch(
                    "http://https://online-management-counselling-system-1.onrender.com/api/counselling/select-seat",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                studentData
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                alert(
                    data.message ||
                    "Seat selection failed."
                );

                return;
            }


            // Close modal

            modal.classList.remove(
                "show"
            );


            // Show selected department

            selectedDepartmentText.textContent =
                selectedDepartment;


            selectionMessage.classList.add(
                "show"
            );


            // Disable buttons

            selectButtons.forEach(button => {

                button.disabled = true;

            });


            // Change selected button

            selectButtons.forEach(button => {

                if (
                    button.dataset.department ===
                    selectedDepartment
                ) {

                    button.textContent =
                        "SELECTED";

                }

            });


            alert(
                "Seat selection submitted successfully."
            );


            selectedDepartment = null;

        }
        catch (error) {

            console.error(error);

            alert(
                "Unable to connect to server."
            );

        }

    }
);