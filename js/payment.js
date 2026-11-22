
/* =========================================
   ACeS SYNC - PAYMENT MANAGEMENT
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
    return student.name || student.studentName || "Unknown Student";
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
   PAYMENT STATISTICS
========================================= */

function renderPaymentStatistics() {
    const totalStudents = document.getElementById("totalStudents");
    const totalPayments = document.getElementById("totalPayments");
    const pendingCount = document.getElementById("pendingCount");

    const approvedPayments = systemData.payments.filter(function (payment) {
        return getPaymentStatus(payment) === "approved";
    });

    const pendingPayments = systemData.payments.filter(function (payment) {
        return getPaymentStatus(payment) === "pending";
    });

    const collections = approvedPayments.reduce(function (total, payment) {
        return total + getPaymentAmount(payment);
    }, 0);

    if (totalStudents) {
        totalStudents.textContent = systemData.students.length;
    }

    if (totalPayments) {
        totalPayments.textContent = money(collections);
    }

    if (pendingCount) {
        pendingCount.textContent = pendingPayments.length;
    }
}

/* =========================================
   RENDER PAYMENT SUBMISSIONS
========================================= */

function renderPaymentSubmissions() {
    const container = document.getElementById("pendingPayments");

    if (!container) {
        return;
    }

    const pendingPayments = systemData.payments.filter(function (payment) {
        return getPaymentStatus(payment) === "pending";
    });

    if (pendingPayments.length === 0) {
        container.innerHTML =
            '<p class="empty-state">No pending payment submissions.</p>';
        return;
    }

    let html = "";

    pendingPayments.forEach(function (payment) {
        const studentId = getPaymentStudentId(payment);

        const student = systemData.students.find(function (item) {
            return getStudentId(item) === studentId;
        });

        const studentName = student
            ? getStudentName(student)
            : "Unknown Student";

        const reference = payment.referenceNumber ||
            payment.reference ||
            "Not provided";

        const method = payment.method ||
            payment.paymentMethod ||
            "Not specified";

        const date = payment.date ||
            payment.submittedAt ||
            payment.createdAt ||
            "Not specified";

        html +=
            '<div class="payment-item">' +
                '<div class="payment-details">' +
                    '<h3>' + escapeHTML(studentName) + '</h3>' +
                    '<p><strong>Student ID:</strong> ' +
                        escapeHTML(studentId) + '</p>' +
                    '<p><strong>Reference Number:</strong> ' +
                        escapeHTML(reference) + '</p>' +
                    '<p><strong>Payment Method:</strong> ' +
                        escapeHTML(method) + '</p>' +
                    '<p><strong>Date Submitted:</strong> ' +
                        escapeHTML(date) + '</p>' +
                    '<p><strong>Status:</strong> ' +
                        '<span class="status-badge status-pending">Pending</span>' +
                    '</p>' +
                    '<div class="payment-amount">' +
                        money(getPaymentAmount(payment)) +
                    '</div>' +
                    '<div class="payment-actions">' +
                        '<button class="approve-button" onclick="verifyPayment(\'' +
                            escapeHTML(payment.id) +
                        '\')">Approve</button>' +
                        '<button class="reject-button" onclick="rejectPayment(\'' +
                            escapeHTML(payment.id) +
                        '\')">Reject</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    });

    container.innerHTML = html;
}

/* =========================================
   FIND PAYMENT
========================================= */

function findPayment(paymentId) {
    return systemData.payments.find(function (payment) {
        return String(payment.id) === String(paymentId);
    });
}

/* =========================================
   VERIFY PAYMENT
========================================= */

function verifyPayment(paymentId) {
    const payment = findPayment(paymentId);

    if (!payment) {
        alert("Payment record not found.");
        return;
    }

    if (getPaymentStatus(payment) !== "pending") {
        alert("This payment has already been processed.");
        return;
    }

    const studentId = getPaymentStudentId(payment);

    const student = systemData.students.find(function (item) {
        return getStudentId(item) === studentId;
    });

    if (!student) {
        alert("Student record not found. Payment cannot be approved.");
        return;
    }

    const amount = getPaymentAmount(payment);

    if (amount <= 0) {
        alert("Invalid payment amount.");
        return;
    }

    const approvedPayments = systemData.payments.filter(function (item) {
        return getPaymentStudentId(item) === studentId &&
            getPaymentStatus(item) === "approved";
    });

    const totalPaid = approvedPayments.reduce(function (total, item) {
        return total + getPaymentAmount(item);
    }, 0);

    const tuition = Number(
        student.discountedTuition ??
        student.tuitionAfterDiscount ??
        student.tuition ??
        student.totalTuition ??
        0
    );

    const remainingBalance = Math.max(0, tuition - totalPaid);

    if (amount > remainingBalance) {
        alert(
            "Payment amount exceeds the student's remaining balance of " +
            money(remainingBalance) + "."
        );
        return;
    }

    const confirmed = confirm(
        "Approve this payment of " + money(amount) +
        " for " + getStudentName(student) + "?"
    );

    if (!confirmed) {
        return;
    }

    payment.status = "Approved";
    payment.verifiedAt = new Date().toLocaleString();

    saveSystemData();
    refreshPaymentsPage();

    alert("Payment successfully approved.");
}

/* =========================================
   REJECT PAYMENT
========================================= */

function rejectPayment(paymentId) {
    const payment = findPayment(paymentId);

    if (!payment) {
        alert("Payment record not found.");
        return;
    }

    if (getPaymentStatus(payment) !== "pending") {
        alert("This payment has already been processed.");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to reject this payment?"
    );

    if (!confirmed) {
        return;
    }

    payment.status = "Rejected";
    payment.rejectedAt = new Date().toLocaleString();

    saveSystemData();
    refreshPaymentsPage();

    alert("Payment submission rejected.");
}

/* =========================================
   REFRESH PAYMENT PAGE
========================================= */

function refreshPaymentsPage() {
    renderPaymentStatistics();
    renderPaymentSubmissions();
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
    refreshPaymentsPage();
});
