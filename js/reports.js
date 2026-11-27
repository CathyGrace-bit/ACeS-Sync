
/* =========================================
   ACeS SYNC - REPORTS JAVASCRIPT
   Compatible with Admin Dashboard
   DATA PRESERVATION VERSION
========================================= */

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";

let systemData = {
    students: [],
    payments: [],
    permits: [],
    calendarEvents: [],
    announcements: [],
    concerns: []
};

// =========================================
// HELPERS
// =========================================

function money(amount) {
    return Number(amount || 0).toLocaleString("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
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
    return String(student.id ?? student.studentID ?? "");
}

function getStudentName(student) {
    return student.name ?? student.studentName ?? "Unnamed Student";
}

function getOriginalTuition(student) {
    return Number(student.tuition ?? student.tuitionFee ?? 0);
}

function getDiscountPercent(student) {
    return Number(student.discountPercent ?? 0);
}

function getDiscountedTuition(student) {
    if (student.discountedTuition !== undefined) {
        return Number(student.discountedTuition) || 0;
    }

    const tuition = getOriginalTuition(student);
    const discount = getDiscountPercent(student);

    return Math.max(0, tuition - (tuition * discount / 100));
}

function getDiscountAmount(student) {
    return Math.max(
        0,
        getOriginalTuition(student) - getDiscountedTuition(student)
    );
}

function getApprovedPayments(studentId) {
    return systemData.payments.filter(payment => {
        const paymentStudentId = String(
            payment.studentId ?? payment.studentID ?? ""
        );

        return (
            paymentStudentId === String(studentId) &&
            String(payment.status || "").toLowerCase() === "approved"
        );
    });
}

function getPaid(student) {
    // Use the same student.paid value as the Admin Dashboard.
    if (student.paid !== undefined && student.paid !== null) {
        return Number(student.paid) || 0;
    }

    // Fallback for older records without a saved paid field.
    return getApprovedPayments(getStudentId(student)).reduce(
        (total, payment) => total + (Number(payment.amount) || 0),
        0
    );
}

function getBalance(student) {
    if (student.balance !== undefined && student.balance !== null) {
        return Math.max(0, Number(student.balance) || 0);
    }

    return Math.max(
        0,
        getDiscountedTuition(student) - getPaid(student)
    );
}

function getPaymentStatus(student) {
    const tuition = getDiscountedTuition(student);
    const paid = getPaid(student);

    if (tuition <= 0 || paid <= 0) {
        return "Unpaid";
    }

    if (paid >= tuition) {
        return "Fully Paid";
    }

    return "Partially Paid";
}

function getStatusClass(status) {
    if (status === "Fully Paid") return "paid";
    if (status === "Partially Paid") return "partial";
    return "unpaid";
}

// =========================================
// LOAD DATA
// =========================================

function loadSystemData() {
    try {
        const saved = JSON.parse(localStorage.getItem(DATA_KEY));

        if (Array.isArray(saved)) {
            systemData.students = saved;
            return;
        }

        if (saved && typeof saved === "object") {
            systemData = {
                ...systemData,
                ...saved,
                students: Array.isArray(saved.students) ? saved.students : [],
                payments: Array.isArray(saved.payments) ? saved.payments : [],
                permits: Array.isArray(saved.permits) ? saved.permits : [],
                calendarEvents: Array.isArray(saved.calendarEvents)
                    ? saved.calendarEvents : [],
                announcements: Array.isArray(saved.announcements)
                    ? saved.announcements : [],
                concerns: Array.isArray(saved.concerns)
                    ? saved.concerns : []
            };
        }
    } catch (error) {
        console.error("Unable to load system data:", error);
        alert("Unable to read saved records. Please check your browser storage.");
    }
}

// =========================================
// ADMIN SESSION
// =========================================

function checkAdminSession() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));

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

// =========================================
// REPORT STATISTICS
// =========================================

function renderReportStatistics() {
    const students = systemData.students;

    const totalStudents = students.length;

    // Total tuition after discounts, matching payable tuition.
    const totalTuition = students.reduce(
        (total, student) => total + getDiscountedTuition(student),
        0
    );

    const totalCollected = students.reduce(
        (total, student) => total + getPaid(student),
        0
    );

    const totalBalance = students.reduce(
        (total, student) => total + getBalance(student),
        0
    );

    document.getElementById("reportTotalStudents").textContent =
        totalStudents;

    document.getElementById("reportTotalTuition").textContent =
        money(totalTuition);

    document.getElementById("reportTotalCollected").textContent =
        money(totalCollected);

    document.getElementById("reportTotalBalance").textContent =
        money(totalBalance);
}

// =========================================
// PAYMENT STATUS SUMMARY
// =========================================

function renderPaymentStatusSummary() {
    let fullyPaid = 0;
    let partiallyPaid = 0;
    let unpaid = 0;

    systemData.students.forEach(student => {
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

// =========================================
// STUDENT FINANCIAL TABLE
// =========================================

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
        : "";

    const filteredStudents = systemData.students.filter(student => {
        const studentId = getStudentId(student).toLowerCase();
        const studentName = String(getStudentName(student)).toLowerCase();

        const status = getPaymentStatus(student);

        const matchesSearch =
            studentId.includes(search) ||
            studentName.includes(search);

        const matchesStatus =
            selectedStatus === "" ||
            (selectedStatus === "Paid" && status === "Fully Paid") ||
            (selectedStatus === "Partial" && status === "Partially Paid") ||
            (selectedStatus === "Unpaid" && status === "Unpaid");

        return matchesSearch && matchesStatus;
    });

    if (filteredStudents.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    No student financial records found.
                </td>
            </tr>
        `;
    } else {
        table.innerHTML = filteredStudents.map(student => {
            const tuition = getOriginalTuition(student);
            const discountPercent = getDiscountPercent(student);
            const discountAmount = getDiscountAmount(student);
            const discountedTuition = getDiscountedTuition(student);
            const paid = getPaid(student);
            const balance = getBalance(student);
            const status = getPaymentStatus(student);

            return `
                <tr>
                    <td>${escapeHTML(getStudentId(student))}</td>

                    <td>${escapeHTML(getStudentName(student))}</td>

                    <td>${escapeHTML(student.course || "-")}</td>

                    <td>${escapeHTML(student.grade || "-")}</td>

                    <td>${money(tuition)}</td>

                    <td>
                        ${discountPercent}%
                        <small>(${money(discountAmount)})</small>
                    </td>

                    <td>${money(discountedTuition)}</td>

                    <td>${money(paid)}</td>

                    <td>${money(balance)}</td>

                    <td>
                        <span class="status-badge ${getStatusClass(status)}">
                            ${status}
                        </span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    const countText = document.getElementById("reportCountText");

    if (countText) {
        countText.textContent =
            `Showing ${filteredStudents.length} of ${systemData.students.length} students`;
    }
}

// =========================================
// REFRESH REPORTS
// =========================================

function refreshReportsPage() {
    renderReportStatistics();
    renderPaymentStatusSummary();
    renderReportTable();
}

// =========================================
// LOGOUT
// =========================================

function logout() {
    if (!confirm("Are you sure you want to log out?")) return;

    localStorage.removeItem(SESSION_KEY);
    window.location.href = "../index.html";
}

// =========================================
// INITIALIZE
// =========================================

document.addEventListener("DOMContentLoaded", function () {
    if (!checkAdminSession()) return;

    loadSystemData();
    refreshReportsPage();

    document.getElementById("reportSearch")
        ?.addEventListener("input", renderReportTable);

    document.getElementById("reportStatusFilter")
        ?.addEventListener("change", renderReportTable);
});
