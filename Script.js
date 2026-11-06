// ===================================
// ACeS SYNC - ACLC MANDAUE
// JAVASCRIPT
// ===================================


// SHOW STUDENT OR ADMIN LOGIN
function showLogin(type) {

    const studentLogin = document.getElementById("studentLogin");
    const adminLogin = document.getElementById("adminLogin");

    if (studentLogin) {
        studentLogin.classList.toggle("hide", type !== "student");
    }

    if (adminLogin) {
        adminLogin.classList.toggle("hide", type !== "admin");
    }
}


// STUDENT LOGIN
function studentLogin() {

    const studentId = document.getElementById("studentId").value.trim();
    const studentName = document.getElementById("studentNameLogin").value.trim();
    const studentYear = document.getElementById("studentYear").value;
    const studentCourse = document.getElementById("studentCourseLogin").value;
    const studentSection = document.getElementById("studentSection").value.trim();

    const message = document.getElementById("studentLoginMessage");

    if (!studentId || !studentName || !studentYear ||
        !studentCourse || !studentSection) {

        message.textContent = "Please complete all fields.";
        return;
    }

    // CHECK REGISTERED STUDENTS
    const students = JSON.parse(
        localStorage.getItem("students") || "[]"
    );

    const student = students.find(s =>
        s.id === studentId &&
        s.name.toLowerCase() === studentName.toLowerCase() &&
        s.year === studentYear &&
        s.course === studentCourse &&
        s.section.toLowerCase() === studentSection.toLowerCase()
    );

    if (!student) {
        message.textContent =
            "Student record not found. Please contact the registrar.";
        return;
    }

    localStorage.setItem("currentStudent", JSON.stringify(student));

    document.getElementById("loginPage").classList.add("hide");
    document.getElementById("studentPage").classList.remove("hide");

    loadStudentDashboard();
}


// ADMIN LOGIN
function adminLogin() {

    const adminId = document.getElementById("adminId").value.trim();
    const adminPassword = document.getElementById("adminPassword").value;

    const message = document.getElementById("adminLoginMessage");

    // DEMO ADMIN ACCOUNT
    if (adminId === "admin" && adminPassword === "admin123") {

        document.getElementById("loginPage").classList.add("hide");
        document.getElementById("adminPage").classList.remove("hide");

    } else {

        message.textContent = "Invalid admin ID or password.";

    }
}


// STUDENT DASHBOARD
function loadStudentDashboard() {

    const student = JSON.parse(
        localStorage.getItem("currentStudent")
    );

    if (!student) return;

    const tuition = student.tuition || 0;
    const paid = student.paid || 0;
    const balance = tuition - paid;

    const name = document.getElementById("displayStudentName");
    const tuitionDisplay = document.getElementById("displayTuition");
    const paidDisplay = document.getElementById("displayPaid");
    const balanceDisplay = document.getElementById("displayBalance");

    if (name) name.textContent = student.name;

    if (tuitionDisplay)
        tuitionDisplay.textContent = "₱" + tuition.toLocaleString();

    if (paidDisplay)
        paidDisplay.textContent = "₱" + paid.toLocaleString();

    if (balanceDisplay)
        balanceDisplay.textContent = "₱" + balance.toLocaleString();
}


// LOGOUT
function logout() {

    localStorage.removeItem("currentStudent");

    location.reload();

}


// INITIALIZE
document.addEventListener("DOMContentLoaded", function () {

    console.log("ACeS Sync JavaScript successfully loaded!");

});
