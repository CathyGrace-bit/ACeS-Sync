```javascript
/* =========================================
   ACeS SYNC - STUDENT PROFILE
   ACLC MANDAUE
========================================= */

"use strict";

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";

// =========================================
// LOAD SAVED DATA
// =========================================

function loadProfileData() {
    try {
        const savedData = JSON.parse(localStorage.getItem(DATA_KEY));

        if (Array.isArray(savedData)) {
            return {
                students: savedData,
                payments: [],
                permits: [],
                messages: []
            };
        }

        return {
            students: savedData?.students || [],
            payments: savedData?.payments || [],
            permits: savedData?.permits || [],
            messages: savedData?.messages || []
        };

    } catch (error) {
        console.error("Unable to load student data:", error);

        return {
            students: [],
            payments: [],
            permits: [],
            messages: []
        };
    }
}

// =========================================
// GET CURRENT STUDENT SESSION
// =========================================

function getCurrentProfileStudent() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));

        if (!session || session.type !== "student") {
            return null;
        }

        return session;

    } catch (error) {
        console.error("Unable to read student session:", error);
        return null;
    }
}

// =========================================
// FIND STUDENT RECORD
// =========================================

function findProfileStudent(students, session) {
    const sessionID =
        session.studentId ||
        session.studentID ||
        session.id;

    if (!sessionID) {
        return null;
    }

    return students.find(student => {
        const studentID =
            student.studentID ||
            student.studentId ||
            student.id;

        return String(studentID).trim() === String(sessionID).trim();
    }) || null;
}

// =========================================
// DISPLAY PROFILE
// =========================================

function displayStudentProfile() {
    const session = getCurrentProfileStudent();

    if (!session) {
        alert("Please login using your student account.");
        window.location.href = "homepage.html";
        return;
    }

    const data = loadProfileData();

    const student = findProfileStudent(data.students, session);

    if (!student) {
        alert("Student record not found. Please contact the administrator.");
        window.location.href = "student-dashboard.html";
        return;
    }

    document.getElementById("profileName").textContent =
        student.name || student.fullName || session.name || "Not available";

    document.getElementById("profileID").textContent =
        student.studentID || student.studentId || student.id || "Not available";

    document.getElementById("profileCourse").textContent =
        student.course || "Not available";

    document.getElementById("profileYear").textContent =
        student.yearLevel || student.year || "Not available";

    document.getElementById("profileSection").textContent =
        student.section || "Not available";
}

// =========================================
// LOGOUT
// =========================================

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "homepage.html";
}

// =========================================
// INITIALIZE
// =========================================

document.addEventListener("DOMContentLoaded", function () {
    displayStudentProfile();
});
```