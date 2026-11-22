
/* =========================================
   ACeS SYNC - EXAM PERMITS MANAGEMENT
========================================= */

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";

let systemData = {
    students: [],
    payments: [],
    permits: [],
    messages: []
};

/* =========================================
   HELPER FUNCTIONS
========================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

function getStudentId(student) {
    return String(student.id || student.studentID || "");
}

function getStudentName(student) {
    return student.name || student.studentName || "Unknown Student";
}

function getStudentCourse(student) {
    return student.course || "Not specified";
}

function getStudentYear(student) {
    return student.grade || student.year || "Not specified";
}

function getStudentSection(student) {
    return student.section || "Not specified";
}

function getPaymentStudentId(payment) {
    return String(payment.studentId || payment.studentID || "");
}

function getPaymentAmount(payment) {
    return Number(payment.amount || payment.paymentAmount || 0);
}

function getPaymentStatus(payment) {
    return String(payment.status || "Pending").toLowerCase();
}

/* =========================================
   LOAD AND SAVE DATA
========================================= */

function loadSystemData() {
    try {
        const saved = localStorage.getItem(DATA_KEY);

        if (!saved) {
            return;
        }

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
            systemData.students = parsed;
            return;
        }

        systemData.students = Array.isArray(parsed.students)
            ? parsed.students : [];

        systemData.payments = Array.isArray(parsed.payments)
            ? parsed.payments : [];

        systemData.permits = Array.isArray(parsed.permits)
            ? parsed.permits : [];

        systemData.messages = Array.isArray(parsed.messages)
            ? parsed.messages : [];

    } catch (error) {
        console.error("Unable to load system data:", error);
    }
}

function saveSystemData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(systemData));
}

/* =========================================
   ADMIN SESSION
========================================= */

function checkAdminSession() {
    try {
        const session = JSON.parse(
            localStorage.getItem(SESSION_KEY) || "null"
        );

        if (!session || session.role !== "admin") {
            window.location.href = "../index.html";
            return false;
        }

        return true;

    } catch (error) {
        window.location.href = "../index.html";
        return false;
    }
}

/* =========================================
   PERMIT ELIGIBILITY
   First verified payment is required.
========================================= */

function hasVerifiedPayment(studentId) {
    return systemData.payments.some(function (payment) {
        return getPaymentStudentId(payment) === String(studentId) &&
            getPaymentStatus(payment) === "approved" &&
            getPaymentAmount(payment) > 0;
    });
}

/* =========================================
   FIND EXISTING PERMIT
========================================= */

function findStudentPermit(studentId) {
    return systemData.permits.find(function (permit) {
        return String(permit.studentId || permit.studentID || "") ===
            String(studentId);
    });
}

/* =========================================
   GENERATE PERMITS
========================================= */

function generateEligiblePermits() {
    let changed = false;

    systemData.students.forEach(function (student) {
        const studentId = getStudentId(student);

        if (!studentId || !hasVerifiedPayment(studentId)) {
            return;
        }

        const existingPermit = findStudentPermit(studentId);

        if (existingPermit) {
            return;
        }

        const permitNumber = "ACLC-EXAM-" +
            new Date().getFullYear() + "-" +
            studentId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

        systemData.permits.push({
            id: "permit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
            studentId: studentId,
            studentID: studentId,
            permitNumber: permitNumber,
            dateGenerated: new Date().toLocaleDateString("en-PH"),
            status: "Generated"
        });

        changed = true;
    });

    if (changed) {
        saveSystemData();
    }
}

/* =========================================
   PERMIT STATISTICS
========================================= */

function renderPermitStatistics() {
    const totalStudents = document.getElementById("totalStudents");
    const permitsCount = document.getElementById("permitsCount");
    const withoutPermitCount = document.getElementById("withoutPermitCount");

    const generatedCount = systemData.students.filter(function (student) {
        return Boolean(findStudentPermit(getStudentId(student)));
    }).length;

    const withoutPermit = systemData.students.length - generatedCount;

    if (totalStudents) {
        totalStudents.textContent = systemData.students.length;
    }

    if (permitsCount) {
        permitsCount.textContent = generatedCount;
    }

    if (withoutPermitCount) {
        withoutPermitCount.textContent = withoutPermit;
    }
}

/* =========================================
   RENDER PERMIT TABLE
========================================= */

function renderPermitTable() {
    const table = document.getElementById("permitTable");
    const searchInput = document.getElementById("permitSearch");
    const filterInput = document.getElementById("permitFilter");
    const countText = document.getElementById("permitCountText");

    if (!table) {
        return;
    }

    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filterValue = filterInput
        ? filterInput.value
        : "";

    const filteredStudents = systemData.students.filter(function (student) {
        const studentId = getStudentId(student);
        const studentName = getStudentName(student);
        const permit = findStudentPermit(studentId);

        const matchesSearch =
            studentId.toLowerCase().includes(searchTerm) ||
            studentName.toLowerCase().includes(searchTerm);

        const matchesFilter =
            filterValue === "" ||
            (filterValue === "generated" && Boolean(permit)) ||
            (filterValue === "not-generated" && !permit);

        return matchesSearch && matchesFilter;
    });

    if (filteredStudents.length === 0) {
        table.innerHTML =
            '<tr><td colspan="8" class="empty-state">' +
            'No student permit records found.</td></tr>';

        if (countText) {
            countText.textContent = "Showing 0 students";
        }

        return;
    }

    let html = "";

    filteredStudents.forEach(function (student) {
        const studentId = getStudentId(student);
        const permit = findStudentPermit(studentId);

        let permitNumber = "—";
        let dateGenerated = "—";
        let statusText = "Not Generated";
        let statusClass = "status-not-generated";

        if (permit) {
            permitNumber = permit.permitNumber || "—";
            dateGenerated = permit.dateGenerated || permit.generatedAt || "—";

            const status = String(permit.status || "Generated").toLowerCase();

            if (status === "rejected") {
                statusText = "Rejected";
                statusClass = "status-rejected";
            } else {
                statusText = "Generated";
                statusClass = "status-generated";
            }
        }

        html +=
            "<tr>" +
                "<td>" + escapeHTML(studentId) + "</td>" +
                "<td>" + escapeHTML(getStudentName(student)) + "</td>" +
                "<td>" + escapeHTML(getStudentCourse(student)) + "</td>" +
                "<td>" + escapeHTML(getStudentYear(student)) + "</td>" +
                "<td>" + escapeHTML(getStudentSection(student)) + "</td>" +
                "<td>" + escapeHTML(permitNumber) + "</td>" +
                "<td>" + escapeHTML(dateGenerated) + "</td>" +
                '<td><span class="status-badge ' + statusClass + '">' +
                    statusText +
                "</span></td>" +
            "</tr>";
    });

    table.innerHTML = html;

    if (countText) {
        countText.textContent =
            "Showing " + filteredStudents.length +
            " of " + systemData.students.length + " students";
    }
}

/* =========================================
   REFRESH PERMIT PAGE
========================================= */

function refreshPermitPage() {
    generateEligiblePermits();
    renderPermitStatistics();
    renderPermitTable();
}

/* =========================================
   LOGOUT
========================================= */

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "../index.html";
}

/* =========================================
   INITIALIZE PAGE
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    if (!checkAdminSession()) {
        return;
    }

    loadSystemData();
    refreshPermitPage();

    const searchInput = document.getElementById("permitSearch");
    const filterInput = document.getElementById("permitFilter");

    if (searchInput) {
        searchInput.addEventListener("input", renderPermitTable);
    }

    if (filterInput) {
        filterInput.addEventListener("change", renderPermitTable);
    }
});
