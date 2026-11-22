
/* =========================================
   ACeS SYNC - REPORTS JAVASCRIPT
========================================= */

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";

let systemData = {
    students: [],
    payments: [],
    permits: [],
    messages: []
};

/* HELPERS */

function money(amount) {
    return "₱" + Number(amount || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

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
    return student.name || student.studentName || "Unnamed Student";
}

function getTuition(student) {
    return Number(
        student.discountedTuition ??
        student.tuition ??
        student.tuitionFee ??
        0
    );
}

function getApprovedPayments(studentId) {
    return systemData.payments.filter(function (payment) {
        const paymentStudentId = String(
            payment.studentId || payment.studentID || ""
        );

        return paymentStudentId === String(studentId) &&
            String(payment.status || "").toLowerCase() === "approved";
    });
}

function getPaid(studentId) {
    return getApprovedPayments(studentId).reduce(function (total, payment) {
        return total + Number(payment.amount || 0);
    }, 0);
}

function getBalance(student) {
    return Math.max(0, getTuition(student) - getPaid(getStudentId(student)));
}

function getPaymentStatus(student) {
    const tuition = getTuition(student);
    const paid = getPaid(getStudentId(student));

    if (tuition <= 0 || paid <= 0) {
        return "Unpaid";
    }

    if (paid >= tuition) {
        return "Fully Paid";
    }

    return "Partially Paid";
}

/* LOAD AND SAVE DATA */

function loadSystemData() {
    try {
        const savedData = JSON.parse(localStorage.getItem(DATA_KEY));

        if (Array.isArray(savedData)) {
            systemData.students = savedData;
        } else if (savedData && typeof savedData === "object") {
            systemData.students = Array.isArray(savedData.students)
                ? savedData.students : [];

            systemData.payments = Array.isArray(savedData.payments)
                ? savedData.payments : [];

            systemData.permits = Array.isArray(savedData.permits)
                ? savedData.permits : [];

            systemData.messages = Array.isArray(savedData.messages)
                ? savedData.messages : [];
        }
    } catch (error) {
        console.error("Unable to load system data:", error);
    }
}

function saveSystemData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(systemData));
}

/* ADMIN SESSION */

function checkAdminSession() {
    let session = null;

    try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (error) {
        session = null;
    }

    if (!session || session.role !== "admin") {
        window.location.href = "../index.html";
        return false;
    }

    return true;
}

/* REPORT TOTALS */

function renderReportStatistics() {
    const students = systemData.students;

    const totalStudents = students.length;

    const totalTuition = students.reduce(function (total, student) {
        return total + getTuition(student);
    }, 0);

    const totalCollected = students.reduce(function (total, student) {
        return total + getPaid(getStudentId(student));
    }, 0);

    const totalBalance = students.reduce(function (total, student) {
        return total + getBalance(student);
    }, 0);

    document.getElementById("reportTotalStudents").textContent =
        totalStudents;

    document.getElementById("reportTotalTuition").textContent =
        money(totalTuition);

    document.getElementById("reportTotalCollected").textContent =
        money(totalCollected);

    document.getElementById("reportTotalBalance").textContent =
        money(totalBalance);
}

/* PAYMENT STATUS SUMMARY */

function renderPaymentStatusSummary() {
    let fullyPaid = 0;
    let partiallyPaid = 0;
    let unpaid = 0;

    systemData.students.forEach(function (student) {
        const status = getPaymentStatus(student);

        if (status === "Fully Paid") {
            fullyPaid++;
        } else if (status === "Partially Paid") {
            partiallyPaid++;
        } else {
            unpaid++;
        }
    });

    document.getElementById("reportFullyPaid").textContent = fullyPaid;
    document.getElementById("reportPartiallyPaid").textContent =
        partiallyPaid;

    document.getElementById("reportUnpaid").textContent = unpaid;
}

/* STUDENT REPORT TABLE */

function renderReportTable() {
    const table = document.getElementById("reportTable");
    const searchInput = document.getElementById("reportSearch");
    const statusFilter = document.getElementById("reportStatusFilter");

    if (!table) return;

    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const selectedStatus = statusFilter
        ? statusFilter.value
        : "all";

    const filteredStudents = systemData.students.filter(function (student) {
        const studentId = getStudentId(student).toLowerCase();
        const studentName = getStudentName(student).toLowerCase();
        const status = getPaymentStatus(student);

        const matchesSearch =
            studentId.includes(search) ||
            studentName.includes(search);

        const matchesStatus =
            selectedStatus === "all" ||
            status.toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    if (filteredStudents.length === 0) {
        table.innerHTML =
            '<tr><td colspan="7" class="empty-message">' +
            'No student records found.' +
            '</td></tr>';
    } else {
        table.innerHTML = filteredStudents.map(function (student) {
            const studentId = getStudentId(student);
            const tuition = getTuition(student);
            const paid = getPaid(studentId);
            const balance = getBalance(student);
            const status = getPaymentStatus(student);

            let statusClass = "unpaid";

            if (status === "Fully Paid") {
                statusClass = "paid";
            } else if (status === "Partially Paid") {
                statusClass = "partial";
            }

            return `
                <tr>
                    <td>${escapeHTML(studentId)}</td>
                    <td>${escapeHTML(getStudentName(student))}</td>
                    <td>${money(tuition)}</td>
                    <td>${money(paid)}</td>
                    <td>${money(balance)}</td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${status}
                        </span>
                    </td>
                    <td>${escapeHTML(student.course || "-")}</td>
                </tr>
            `;
        }).join("");
    }

    const countText = document.getElementById("reportCountText");

    if (countText) {
        countText.textContent =
            "Showing " + filteredStudents.length +
            " of " + systemData.students.length + " students";
    }
}

/* REFRESH REPORTS */

function refreshReportsPage() {
    renderReportStatistics();
    renderPaymentStatusSummary();
    renderReportTable();
}

/* LOGOUT */

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "../index.html";
}

/* INITIALIZE */

document.addEventListener("DOMContentLoaded", function () {
    if (!checkAdminSession()) return;

    loadSystemData();
    refreshReportsPage();

    const searchInput = document.getElementById("reportSearch");
    const statusFilter = document.getElementById("reportStatusFilter");

    if (searchInput) {
        searchInput.addEventListener("input", renderReportTable);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", renderReportTable);
    }
});
