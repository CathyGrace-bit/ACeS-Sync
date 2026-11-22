
/* =========================================
   ACeS SYNC - STUDENT DASHBOARD
   ACLC MANDAUE
========================================= */

"use strict";

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";

let systemData = {
    students: [],
    payments: [],
    permits: [],
    messages: []
};

let currentStudent = null;

/* =========================================
   GENERAL HELPERS
========================================= */

function money(amount) {
    return "₱" + Number(amount || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHTML(value) {
    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getStudentId(student) {
    if (!student) return "";

    return String(
        student.id || student.studentID || student.studentId || ""
    );
}

function getStudentName(student) {
    if (!student) return "Student";

    return student.name || student.studentName || "Student";
}

function getStudentCourse(student) {
    return student ? (student.course || "—") : "—";
}

function getStudentYear(student) {
    return student ? (student.grade || student.year || "—") : "—";
}

function getStudentSection(student) {
    return student ? (student.section || "—") : "—";
}

function getPaymentStudentId(payment) {
    return String(
        payment.studentId ||
        payment.studentID ||
        payment.studentIdNumber ||
        ""
    );
}

function getPaymentReference(payment) {
    return String(
        payment.reference ||
        payment.referenceNumber ||
        ""
    );
}

function getPaymentAmount(payment) {
    return Number(payment.amount || payment.paymentAmount || 0);
}

function isApproved(payment) {
    return String(payment.status || "").toLowerCase() === "approved";
}

/* =========================================
   LOAD AND SAVE DATA
========================================= */

function loadSystemData() {
    try {
        const savedData = localStorage.getItem(DATA_KEY);

        if (!savedData) return;

        const saved = JSON.parse(savedData);

        if (Array.isArray(saved)) {
            systemData.students = saved;
            return;
        }

        if (saved && typeof saved === "object") {
            systemData.students = Array.isArray(saved.students)
                ? saved.students : [];

            systemData.payments = Array.isArray(saved.payments)
                ? saved.payments : [];

            systemData.permits = Array.isArray(saved.permits)
                ? saved.permits : [];

            systemData.messages = Array.isArray(saved.messages)
                ? saved.messages : [];
        }

    } catch (error) {
        console.error("Unable to load ACeS Sync data:", error);
    }
}

function saveSystemData() {
    try {
        localStorage.setItem(DATA_KEY, JSON.stringify(systemData));
        return true;

    } catch (error) {
        console.error("Unable to save ACeS Sync data:", error);
        alert("Unable to save your data. Please try again.");
        return false;
    }
}

/* =========================================
   STUDENT SESSION
========================================= */

function loadCurrentStudent() {
    let session = null;

    try {
        session = JSON.parse(
            localStorage.getItem(SESSION_KEY) || "null"
        );
    } catch (error) {
        session = null;
    }

    if (!session || session.role !== "student") {
        window.location.href = "homepage.html";
        return false;
    }

    const sessionStudentId = String(session.studentId || "");

    currentStudent = systemData.students.find(function(student) {
        return getStudentId(student) === sessionStudentId;
    });

    if (!currentStudent) {
        localStorage.removeItem(SESSION_KEY);

        alert("Student account not found. Please log in again.");

        window.location.href = "homepage.html";
        return false;
    }

    return true;
}

/* =========================================
   STUDENT PROFILE
========================================= */

function renderStudentProfile() {
    if (!currentStudent) return;

    const name = getStudentName(currentStudent);

    const fields = {
        displayStudentName: name,
        profileStudentName: name,
        displayStudentCourse: getStudentCourse(currentStudent),
        displayStudentId: getStudentId(currentStudent),
        displayStudentYear: getStudentYear(currentStudent),
        displayStudentSection: getStudentSection(currentStudent)
    };

    Object.keys(fields).forEach(function(id) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = fields[id];
        }
    });
}

/* =========================================
   TUITION AND PAYMENT COMPUTATION
========================================= */

function getStudentTuition(student) {
    return Number(
        student.tuition ||
        student.tuitionExact ||
        student.totalTuition ||
        student.tuitionFee ||
        0
    );
}

function getStudentDiscount(student) {
    return Number(
        student.discountPercent ??
        student.discount ??
        0
    );
}

function getDiscountedTuition(student) {
    if (
        student.discountedTuition !== undefined &&
        student.discountedTuition !== null &&
        student.discountedTuition !== ""
    ) {
        return Number(student.discountedTuition);
    }

    if (
        student.tuitionAfterDiscount !== undefined &&
        student.tuitionAfterDiscount !== null &&
        student.tuitionAfterDiscount !== ""
    ) {
        return Number(student.tuitionAfterDiscount);
    }

    const tuition = getStudentTuition(student);
    const discount = getStudentDiscount(student);

    return Math.max(
        tuition - (tuition * discount / 100),
        0
    );
}

function getStudentPaid(student) {
    const studentId = getStudentId(student);

    return systemData.payments
        .filter(function(payment) {
            return (
                getPaymentStudentId(payment) === studentId &&
                isApproved(payment)
            );
        })
        .reduce(function(total, payment) {
            return total + getPaymentAmount(payment);
        }, 0);
}

function getStudentBalance(student) {
    const total = getDiscountedTuition(student);
    const paid = getStudentPaid(student);

    return Math.max(total - paid, 0);
}

function renderStudentTuition() {
    if (!currentStudent) return;

    const tuition = getStudentTuition(currentStudent);
    const discount = getStudentDiscount(currentStudent);
    const discountedTuition = getDiscountedTuition(currentStudent);
    const paid = getStudentPaid(currentStudent);
    const balance = getStudentBalance(currentStudent);

    const fields = {
        studentTuition: money(tuition),
        studentDiscount: discount + "%",
        studentDiscountedTuition: money(discountedTuition),
        studentPaid: money(paid),
        studentBalance: money(balance)
    };

    Object.keys(fields).forEach(function(id) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = fields[id];
        }
    });

    renderPaymentProgress(paid, discountedTuition, balance);
}

/* =========================================
   PAYMENT PROGRESS
========================================= */

function renderPaymentProgress(paid, total, balance) {
    const statusElement = document.getElementById("paymentStatus");
    const progressElement = document.getElementById("paymentProgress");
    const textElement = document.getElementById("progressText");

    let percentage = 0;

    if (total > 0) {
        percentage = Math.min((paid / total) * 100, 100);
    }

    if (progressElement) {
        progressElement.style.width = percentage + "%";
    }

    if (textElement) {
        textElement.textContent = Math.round(percentage) + "% paid";
    }

    if (statusElement) {
        if (balance <= 0) {
            statusElement.textContent = "Fully Paid";
        } else if (paid > 0) {
            statusElement.textContent = "Partially Paid";
        } else {
            statusElement.textContent = "Unpaid";
        }
    }
}

/* =========================================
   EXAM PERMIT
========================================= */

function renderStudentPermit() {
    if (!currentStudent) return;

    const studentId = getStudentId(currentStudent);

    const permit = systemData.permits.find(function(item) {
        return String(
            item.studentId || item.studentID || ""
        ) === studentId;
    });

    const permitElement = document.getElementById("studentPermit");
    const statusElement = document.getElementById("permitStatus");
    const noteElement = document.getElementById("permitNote");

    if (!permit) {
        if (permitElement) {
            permitElement.textContent = "Not Available";
        }

        if (statusElement) {
            statusElement.textContent = "No Permit";
        }

        if (noteElement) {
            noteElement.textContent =
                "Please contact the administration for permit information.";
        }

        return;
    }

    const status = permit.status || "Generated";

    if (permitElement) {
        permitElement.textContent =
            permit.permitNumber || status;
    }

    if (statusElement) {
        statusElement.textContent = status;
    }

    if (noteElement) {
        noteElement.textContent =
            permit.note ||
            permit.remarks ||
            "Please check with the administration for more information.";
    }
}

/* =========================================
   PAYMENT HISTORY
========================================= */

function renderPaymentHistory() {
    const container = document.getElementById("paymentHistory");

    if (!container || !currentStudent) return;

    const studentId = getStudentId(currentStudent);

    const studentPayments = systemData.payments
        .filter(function(payment) {
            return getPaymentStudentId(payment) === studentId;
        })
        .sort(function(a, b) {
            return String(b.date || "").localeCompare(
                String(a.date || "")
            );
        });

    if (studentPayments.length === 0) {
        container.innerHTML =
            '<p class="empty-state">No payment history yet.</p>';
        return;
    }

    container.innerHTML = studentPayments.map(function(payment) {
        const status = payment.status || "Pending";

        return (
            '<div class="history-item">' +
                '<strong>' + money(getPaymentAmount(payment)) + '</strong>' +
                '<p>Reference: ' +
                    escapeHTML(getPaymentReference(payment) || "—") +
                '</p>' +
                '<p>Method: ' +
                    escapeHTML(payment.method || "—") +
                '</p>' +
                '<p>Date: ' +
                    escapeHTML(payment.date || "—") +
                '</p>' +
                '<p>Status: ' +
                    escapeHTML(status) +
                '</p>' +
            '</div>'
        );
    }).join("");
}

/* =========================================
   SUBMIT PAYMENT
========================================= */

function submitPayment() {
    if (!currentStudent) return;

    const referenceInput =
        document.getElementById("paymentReference");

    const amountInput =
        document.getElementById("paymentAmount");

    const methodInput =
        document.getElementById("paymentMethod");

    const messageElement =
        document.getElementById("paymentMessage");

    const reference = referenceInput
        ? referenceInput.value.trim()
        : "";

    const amount = Number(
        amountInput ? amountInput.value : 0
    );

    const method = methodInput
        ? methodInput.value
        : "";

    if (!reference || !amount || amount <= 0 || !method) {
        if (messageElement) {
            messageElement.textContent =
                "Please complete all payment fields.";
        } else {
            alert("Please complete all payment fields.");
        }

        return;
    }

    const balance = getStudentBalance(currentStudent);

    if (balance <= 0) {
        alert("Your tuition is already fully paid.");
        return;
    }

    if (amount > balance) {
        alert(
            "Payment amount cannot be greater than your remaining balance."
        );
        return;
    }

    const duplicateReference = systemData.payments.some(
        function(payment) {
            return getPaymentReference(payment).toLowerCase() ===
                reference.toLowerCase();
        }
    );

    if (duplicateReference) {
        alert("This payment reference has already been submitted.");
        return;
    }

    const newPayment = {
        id: "PAY-" + Date.now(),
        studentId: getStudentId(currentStudent),
        studentID: getStudentId(currentStudent),
        studentName: getStudentName(currentStudent),
        amount: amount,
        reference: reference,
        referenceNumber: reference,
        method: method,
        date: new Date().toLocaleString(),
        status: "Pending"
    };

    systemData.payments.push(newPayment);

    if (!saveSystemData()) {
        systemData.payments.pop();
        return;
    }

    if (referenceInput) referenceInput.value = "";
    if (amountInput) amountInput.value = "";
    if (methodInput) methodInput.value = "";

    if (messageElement) {
        messageElement.textContent =
            "Payment submitted successfully. Waiting for admin verification.";
    } else {
        alert(
            "Payment submitted successfully. Waiting for admin verification."
        );
    }

    renderPaymentHistory();
    renderStudentTuition();
}

/* =========================================
   STUDENT MESSAGES
========================================= */

function renderStudentMessages() {
    const container =
        document.getElementById("studentMessageList");

    if (!container || !currentStudent) return;

    const studentId = getStudentId(currentStudent);

    const messages = systemData.messages
        .filter(function(message) {
            return String(
                message.studentId || message.studentID || ""
            ) === studentId;
        })
        .sort(function(a, b) {
            return String(a.date || "").localeCompare(
                String(b.date || "")
            );
        });

    if (messages.length === 0) {
        container.innerHTML =
            '<p class="empty-state">No messages yet.</p>';
        return;
    }

    container.innerHTML = messages.map(function(message) {
        const sender = message.sender || "Admin";
        const content = message.message || message.text || "";

        return (
            '<div class="message-item">' +
                '<strong>' + escapeHTML(sender) + '</strong>' +
                '<p>' + escapeHTML(content) + '</p>' +
                '<small>' +
                    escapeHTML(message.date || "") +
                '</small>' +
            '</div>'
        );
    }).join("");
}

/* =========================================
   SEND STUDENT MESSAGE
========================================= */

function sendStudentMessage() {
    if (!currentStudent) return;

    const input =
        document.getElementById("studentMessageInput");

    const feedback =
        document.getElementById("studentMessageFeedback");

    const messageText = input
        ? input.value.trim()
        : "";

    if (!messageText) {
        if (feedback) {
            feedback.textContent =
                "Please enter a message first.";
        }

        return;
    }

    const newMessage = {
        id: "MSG-" + Date.now(),
        studentId: getStudentId(currentStudent),
        studentID: getStudentId(currentStudent),
        studentName: getStudentName(currentStudent),
        sender: getStudentName(currentStudent),
        message: messageText,
        date: new Date().toLocaleString(),
        status: "Unread"
    };

    systemData.messages.push(newMessage);

    if (!saveSystemData()) {
        systemData.messages.pop();
        return;
    }

    if (input) {
        input.value = "";
    }

    if (feedback) {
        feedback.textContent =
            "Your message has been sent to the administration.";
    }

    renderStudentMessages();
}

/* =========================================
   LOGOUT
========================================= */

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "homepage.html";
}

/* =========================================
   REFRESH STUDENT DASHBOARD
========================================= */

function refreshStudentDashboard() {
    renderStudentProfile();
    renderStudentTuition();
    renderStudentPermit();
    renderPaymentHistory();
    renderStudentMessages();
}

/* =========================================
   INITIALIZE STUDENT DASHBOARD
========================================= */

document.addEventListener("DOMContentLoaded", function() {
    loadSystemData();

    if (!loadCurrentStudent()) {
        return;
    }

    refreshStudentDashboard();
});
