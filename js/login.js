
/* =====================================================
   ACeS SYNC - ACLC MANDAUE
   LOGIN PAGE JAVASCRIPT
===================================================== */

"use strict";

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";

/* =====================================================
   HELPERS
===================================================== */

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
}

function showMessage(id, message, type = "error") {
    const element = document.getElementById(id);
    if (!element) return;

    element.textContent = message;
    element.style.color =
        type === "success" ? "#16845b" : "#d94b4b";
}

function clearMessages() {
    showMessage("studentLoginMessage", "");
    showMessage("adminLoginMessage", "");
}

function getStudents() {
    try {
        const saved = JSON.parse(localStorage.getItem(DATA_KEY));

        if (Array.isArray(saved)) {
            return saved;
        }

        if (saved && Array.isArray(saved.students)) {
            return saved.students;
        }

        return [];
    } catch (error) {
        console.error("Unable to read student records:", error);
        return [];
    }
}

function saveSession(role, studentId = "") {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        role: role,
        studentId: studentId,
        loginTime: new Date().toISOString()
    }));
}

/* =====================================================
   LOGIN TABS
===================================================== */

function showLogin(type) {
    const studentForm = document.getElementById("studentLogin");
    const adminForm = document.getElementById("adminLogin");

    const studentTab = document.getElementById("studentTab");
    const adminTab = document.getElementById("adminTab");

    if (!studentForm || !adminForm) return;

    clearMessages();

    if (type === "student") {
        studentForm.classList.remove("hidden");
        adminForm.classList.add("hidden");

        studentTab?.classList.add("active");
        adminTab?.classList.remove("active");

        studentTab?.setAttribute("aria-selected", "true");
        adminTab?.setAttribute("aria-selected", "false");
    } else {
        adminForm.classList.remove("hidden");
        studentForm.classList.add("hidden");

        adminTab?.classList.add("active");
        studentTab?.classList.remove("active");

        adminTab?.setAttribute("aria-selected", "true");
        studentTab?.setAttribute("aria-selected", "false");
    }
}

/* =====================================================
   ADMIN LOGIN
   DEMO ACCOUNT: admin / 1234
===================================================== */

function adminLogin(event) {
    if (event) event.preventDefault();

    const username = getValue("adminId");
    const password = getValue("adminPassword");

    if (!username || !password) {
        showMessage(
            "adminLoginMessage",
            "Please enter your admin ID and password."
        );
        return;
    }

    if (username === "admin" && password === "1234") {
        saveSession("admin");

        showMessage(
            "adminLoginMessage",
            "Login successful. Opening Admin Dashboard...",
            "success"
        );

        window.location.href = "admin-dashboard.html";
        return;
    }

    showMessage(
        "adminLoginMessage",
        "Incorrect admin ID or password."
    );
}

/* =====================================================
   STUDENT LOGIN
   ONLY REGISTERED STUDENTS CAN LOGIN
===================================================== */

function studentLogin(event) {
    if (event) event.preventDefault();

    const studentId = getValue("studentId");
    const studentName = getValue("studentNameLogin");
    const grade = getValue("studentYear");
    const course = getValue("studentCourseLogin");
    const section = getValue("studentSection");

    if (!studentId || !studentName || !grade || !course || !section) {
        showMessage(
            "studentLoginMessage",
            "Please complete all student login fields."
        );
        return;
    }

    const students = getStudents();

    const registeredStudent = students.find(student => {
        const id = String(student.id ?? student.studentID ?? "");
        const name = String(student.name ?? student.studentName ?? "");
        const studentGrade = String(student.grade ?? student.year ?? "");
        const studentCourse = String(student.course ?? "");
        const studentSection = String(student.section ?? "");

        return (
            id.toLowerCase() === studentId.toLowerCase() &&
            name.toLowerCase() === studentName.toLowerCase() &&
            studentGrade.toLowerCase() === grade.toLowerCase() &&
            studentCourse.toLowerCase() === course.toLowerCase() &&
            studentSection.toLowerCase() === section.toLowerCase()
        );
    });

    if (!registeredStudent) {
        showMessage(
            "studentLoginMessage",
            "Student record not found. Please check your details or contact the administrator."
        );
        return;
    }

    const registeredId =
        registeredStudent.id ?? registeredStudent.studentID;

    saveSession("student", String(registeredId));

    showMessage(
        "studentLoginMessage",
        "Login successful. Opening Student Dashboard...",
        "success"
    );

    window.location.href = "student-dashboard.html";
}

/* =====================================================
   CHECK EXISTING SESSION
===================================================== */

function checkExistingSession() {
    try {
        const session = JSON.parse(
            localStorage.getItem(SESSION_KEY)
        );

        if (!session) return;

        if (session.role === "admin") {
            window.location.replace("admindashboard.html");
            return;
        }

        if (session.role === "student") {
            const students = getStudents();

            const studentExists = students.some(student => {
                const id = String(
                    student.id ?? student.studentID ?? ""
                );

                return id === String(session.studentId);
            });

            if (studentExists) {
                window.location.replace("student-dashboard.html");
            } else {
                localStorage.removeItem(SESSION_KEY);
            }
        }

    } catch (error) {
        console.error("Session check failed:", error);
        localStorage.removeItem(SESSION_KEY);
    }
}

/* =====================================================
   INITIALIZE LOGIN PAGE
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    showLogin("student");

    checkExistingSession();

});
