const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");
const loginRole = document.getElementById("loginRole");
const roleButtons = document.querySelectorAll(".role-button");
const togglePasswordButton = document.getElementById("togglePasswordButton");

const API_BASE_URL = "http://https://online-management-counselling-system-1.onrender.com";

console.log("student-login.js LOADED");

// =====================================================
// PASSWORD VISIBILITY
// =====================================================

if (togglePasswordButton) {


togglePasswordButton.addEventListener("click", function () {

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePasswordButton.textContent = "🙈";
    } else {
        passwordInput.type = "password";
        togglePasswordButton.textContent = "👁";
    }

});


}

// =====================================================
// ROLE BUTTONS
// =====================================================

roleButtons.forEach(function (button) {


button.addEventListener("click", function () {

    roleButtons.forEach(function (btn) {
        btn.classList.remove("active");
    });

    this.classList.add("active");

    loginRole.value = this.dataset.role;

    loginMessage.textContent = "";

    console.log("Selected role:", loginRole.value);

});


});

// =====================================================
// MESSAGE
// =====================================================

function showMessage(message, type) {


loginMessage.textContent = message;

if (type === "success") {
    loginMessage.style.color = "#166534";
} else {
    loginMessage.style.color = "#b91c1c";
}


}

// =====================================================
// BACKEND LOGIN
// =====================================================

async function login(username, password, role) {


try {

    showMessage("Logging in...", "success");

    const response = await fetch(
        API_BASE_URL + "/api/auth/login",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: username,
                password: password
            })
        }
    );

    const data = await response.json();

    console.log("LOGIN STATUS:", response.status);
    console.log("LOGIN RESPONSE:", data);


    if (!response.ok || !data.success) {

        showMessage(
            data.message || "Invalid username or password.",
            "error"
        );

        return;
    }


    if (!data.user) {

        showMessage(
            "User information was not received.",
            "error"
        );

        return;
    }


    if (!data.token) {

        showMessage(
            "Login successful, but token was not received.",
            "error"
        );

        return;
    }


    // =================================================
    // CHECK ROLE
    // =================================================

    if (data.user.role !== role) {

        showMessage(
            "This account does not belong to the selected role.",
            "error"
        );

        return;
    }


    // =================================================
    // CLEAR OLD LOGIN DATA
    // =================================================

    localStorage.removeItem("authToken");
    localStorage.removeItem("studentToken");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("studentLoggedIn");
    localStorage.removeItem("loggedInStudent");


    // =================================================
    // SAVE TOKEN
    // =================================================

    localStorage.setItem("token", data.token);


    // =================================================
    // SAVE USER
    // =================================================

    localStorage.setItem(
        "loggedInUser",
        JSON.stringify(data.user)
    );


    // =================================================
    // SAVE ROLE
    // =================================================

    localStorage.setItem(
        "userRole",
        data.user.role
    );


    console.log(
        "TOKEN SAVED:",
        localStorage.getItem("token")
    );


    // =================================================
    // SUCCESS MESSAGE
    // =================================================

    showMessage(
        "Login successful. Redirecting...",
        "success"
    );


    // =================================================
    // REDIRECT
    // =================================================

    setTimeout(function () {

        if (role === "student") {

            window.location.href = "student-dashboard.html";

        } else if (role === "admin") {

            window.location.href = "admin-main.html";

        } else if (role === "counsellor") {

            window.location.href = "counseller-main.html";

        }

    }, 700);

} catch (error) {

    console.error("LOGIN ERROR:", error);

    showMessage(
        "Cannot connect to server. Make sure the backend is running.",
        "error"
    );

}


}

// =====================================================
// LOGIN FORM
// =====================================================

loginForm.addEventListener("submit", async function (event) {


event.preventDefault();

const username = usernameInput.value.trim();
const password = passwordInput.value.trim();
const role = loginRole.value;


console.log("LOGIN FORM SUBMITTED");
console.log("Email:", username);
console.log("Role:", role);


// =================================================
// VALIDATION
// =================================================

if (!username || !password) {

    showMessage(
        "Please enter username and password.",
        "error"
    );

    return;
}


if (!role) {

    showMessage(
        "Please select a login role.",
        "error"
    );

    return;
}


// =================================================
// LOGIN
// =================================================

await login(
    username,
    password,
    role
);


});
