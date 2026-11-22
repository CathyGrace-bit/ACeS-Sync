
/* =========================================
   ACeS SYNC - ADMIN DASHBOARD
   Student Records, Tuition and Payments
========================================= */

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";

let systemData = {
    students: [],
    payments: [],
    permits: []
};

// =========================================
// DATA STORAGE
// =========================================

function loadSystemData() {
    try {
        const saved = JSON.parse(localStorage.getItem(DATA_KEY));

        if (saved && !Array.isArray(saved)) {
            systemData = {
                students: Array.isArray(saved.students) ? saved.students : [],
                payments: Array.isArray(saved.payments) ? saved.payments : [],
                permits: Array.isArray(saved.permits) ? saved.permits : []
            };
        }
    } catch (error) {
        console.error("Error loading system data:", error);
    }
}

function saveSystemData() {
    localStorage.setItem(DATA_KEY, JSON.stringify(systemData));
}

// =========================================
// GENERAL HELPERS
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
    return student.name ?? student.studentName ?? "";
}

function getDiscountedTuition(student) {
    if (student.discountedTuition !== undefined) {
        return Number(student.discountedTuition) || 0;
    }

    const tuition = Number(student.tuition) || 0;
    const discount = Number(student.discountPercent) || 0;

    return tuition - (tuition * discount / 100);
}

function getStudentPaid(student) {
    return Number(student.paid) || 0;
}

function getStudentBalance(student) {
    if (student.balance !== undefined) {
        return Math.max(0, Number(student.balance) || 0);
    }

    return Math.max(
        0,
        getDiscountedTuition(student) - getStudentPaid(student)
    );
}

function getPaymentStatus(student) {
    const tuition = getDiscountedTuition(student);
    const paid = getStudentPaid(student);

    if (tuition <= 0 || paid <= 0) return "No Payment";
    if (paid >= tuition) return "Fully Paid";

    return "Partial";
}

// =========================================
// STUDENT REGISTRATION
// =========================================

function addStudent() {
    const id = document.getElementById("studentID").value.trim();
    const name = document.getElementById("studentName").value.trim();
    const grade = document.getElementById("studentGrade").value;
    const course = document.getElementById("studentCourse").value;
    const section = document.getElementById("studentSectionAdmin").value.trim();

    const tuition = Number(document.getElementById("tuitionExact").value);
    const discountPercent = Number(
        document.getElementById("discountPercent").value || 0
    );
    const paid = Number(document.getElementById("paidExact").value || 0);

    if (!id || !name || !grade || !course || !section) {
        alert("Please complete all student information.");
        return;
    }

    if (!Number.isFinite(tuition) || tuition <= 0) {
        alert("Please enter a valid tuition fee.");
        return;
    }

    if (
        !Number.isFinite(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
    ) {
        alert("Discount must be between 0 and 100 percent.");
        return;
    }

    if (!Number.isFinite(paid) || paid < 0) {
        alert("Please enter a valid initial payment.");
        return;
    }

    const duplicate = systemData.students.some(student =>
        getStudentId(student).toLowerCase() === id.toLowerCase()
    );

    if (duplicate) {
        alert("This Student ID is already registered.");
        return;
    }

    const discountedTuition =
        tuition - (tuition * discountPercent / 100);

    if (paid > discountedTuition) {
        alert("Initial payment cannot exceed discounted tuition.");
        return;
    }

    const student = {
        id,
        name,
        grade,
        course,
        section,
        tuition,
        discountPercent,
        discountedTuition,
        paid,
        balance: discountedTuition - paid,
        status: paid >= discountedTuition ? "Fully Paid" :
            paid > 0 ? "Partial" : "No Payment",
        dateRegistered: new Date().toISOString()
    };

    systemData.students.push(student);

    if (paid > 0) {
        systemData.payments.push({
            id: Date.now().toString(),
            studentId: id,
            studentName: name,
            amount: paid,
            reference: "INITIAL-" + id,
            method: "Initial Payment",
            status: "Approved",
            date: new Date().toISOString()
        });
    }

    saveSystemData();
    renderDashboard();
    clearStudentForm();

    alert("Student successfully registered!");
}

function clearStudentForm() {
    const fields = [
        "studentID",
        "studentName",
        "studentGrade",
        "studentCourse",
        "studentSectionAdmin",
        "tuitionExact",
        "discountPercent",
        "paidExact"
    ];

    fields.forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });

    document.getElementById("discountPercent").value = "0";
    document.getElementById("paidExact").value = "0";

    updateTuitionPreview();
}

// =========================================
// TUITION PREVIEW
// =========================================

function updateTuitionPreview() {
    const tuition = Number(
        document.getElementById("tuitionExact")?.value
    ) || 0;

    const discount = Number(
        document.getElementById("discountPercent")?.value
    ) || 0;

    const paid = Number(
        document.getElementById("paidExact")?.value
    ) || 0;

    const discounted = tuition - (tuition * discount / 100);
    const balance = Math.max(0, discounted - paid);

    const discountedDisplay =
        document.getElementById("discountedTuition");

    const balanceDisplay =
        document.getElementById("initialBalance");

    if (discountedDisplay) {
        discountedDisplay.textContent = money(discounted);
    }

    if (balanceDisplay) {
        balanceDisplay.textContent = money(balance);
    }
}

// =========================================
// STUDENT TABLE
// =========================================

function renderStudentTable() {
    const table = document.getElementById("adminTable");
    if (!table) return;

    const search = (
        document.getElementById("searchStudent")?.value || ""
    ).toLowerCase();

    const course = document.getElementById("filterCourse")?.value || "";
    const year = document.getElementById("filterYear")?.value || "";

    const section = (
        document.getElementById("filterSection")?.value || ""
    ).toLowerCase();

    const filtered = systemData.students.filter(student => {
        const id = getStudentId(student).toLowerCase();
        const name = String(getStudentName(student)).toLowerCase();

        return (
            (id.includes(search) || name.includes(search)) &&
            (!course || student.course === course) &&
            (!year || student.grade === year) &&
            (!section ||
                String(student.section || "").toLowerCase().includes(section))
        );
    });

    if (filtered.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    No student records found.
                </td>
            </tr>
        `;
    } else {
        table.innerHTML = filtered.map(student => {
            const status = getPaymentStatus(student);

            return `
                <tr>
                    <td>${escapeHTML(getStudentId(student))}</td>
                    <td>${escapeHTML(getStudentName(student))}</td>
                    <td>${escapeHTML(student.course)}</td>
                    <td>${escapeHTML(student.grade)}</td>
                    <td>${escapeHTML(student.section)}</td>
                    <td>${money(getDiscountedTuition(student))}</td>
                    <td>${money(getStudentPaid(student))}</td>
                    <td>${money(getStudentBalance(student))}</td>
                    <td>${escapeHTML(status)}</td>
                </tr>
            `;
        }).join("");
    }

    const countText = document.getElementById("countText");

    if (countText) {
        countText.textContent =
            `Showing ${filtered.length} of ${systemData.students.length} students`;
    }
}

// =========================================
// DASHBOARD STATISTICS
// =========================================

function renderStatistics() {
    const totalStudents = systemData.students.length;

    const approvedPayments = systemData.payments
        .filter(payment => payment.status === "Approved")
        .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const totalPayments = document.getElementById("totalPayments");
    const studentCount = document.getElementById("totalStudents");
    const permitsCount = document.getElementById("permitsCount");

    if (studentCount) {
        studentCount.textContent = totalStudents;
    }

    if (totalPayments) {
        totalPayments.textContent = money(approvedPayments);
    }

    if (permitsCount) {
        permitsCount.textContent = systemData.permits.length;
    }

    const latestPermit = systemData.permits.length
        ? systemData.permits[systemData.permits.length - 1]
        : null;

    const permitNumber = document.getElementById("lastPermit");
    const permitDate = document.getElementById("lastPermitDate");

    if (permitNumber) {
        permitNumber.textContent = latestPermit
            ? latestPermit.permitNumber || latestPermit.id || "Generated"
            : "—";
    }

    if (permitDate) {
        permitDate.textContent = latestPermit
            ? latestPermit.date
                ? new Date(latestPermit.date).toLocaleDateString()
                : "Permit generated"
            : "No permits yet";
    }
}

// =========================================
// PAYMENT VERIFICATION
// =========================================

function renderPendingPayments() {
    const container = document.getElementById("pendingPayments");
    if (!container) return;

    const pending = systemData.payments.filter(
        payment => payment.status === "Pending"
    );

    if (pending.length === 0) {
        container.innerHTML = `
            <p class="empty-state">No pending payments.</p>
        `;
        return;
    }

    container.innerHTML = pending.map(payment => `
        <article class="payment-item">
            <div>
                <strong>${escapeHTML(payment.studentName || payment.studentId)}</strong>
                <p>Reference: ${escapeHTML(payment.reference || "—")}</p>
                <p>Method: ${escapeHTML(payment.method || "—")}</p>
                <strong>${money(payment.amount)}</strong>
            </div>

            <div class="button-group">
                <button type="button"
                        class="gold-button"
                        onclick="verifyPayment('${escapeHTML(payment.id)}')">
                    Approve
                </button>

                <button type="button"
                        class="white-button"
                        onclick="rejectPayment('${escapeHTML(payment.id)}')">
                    Reject
                </button>
            </div>
        </article>
    `).join("");
}

function verifyPayment(paymentId) {
    const payment = systemData.payments.find(
        item => String(item.id) === String(paymentId)
    );

    if (!payment || payment.status !== "Pending") return;

    const student = systemData.students.find(
        item => getStudentId(item) === String(payment.studentId)
    );

    if (!student) {
        alert("Student record not found. Payment cannot be approved.");
        return;
    }

    const amount = Number(payment.amount) || 0;
    const balance = getStudentBalance(student);

    if (amount <= 0 || amount > balance) {
        alert("This payment amount is invalid or exceeds the student's balance.");
        return;
    }

    if (!confirm(`Approve payment of ${money(amount)}?`)) return;

    payment.status = "Approved";
    payment.verifiedAt = new Date().toISOString();

    student.paid = getStudentPaid(student) + amount;
    student.balance = Math.max(
        0,
        getDiscountedTuition(student) - student.paid
    );
    student.status = getPaymentStatus(student);

    saveSystemData();
    renderDashboard();

    alert("Payment successfully approved.");
}

function rejectPayment(paymentId) {
    const payment = systemData.payments.find(
        item => String(item.id) === String(paymentId)
    );

    if (!payment || payment.status !== "Pending") return;

    if (!confirm("Are you sure you want to reject this payment?")) return;

    payment.status = "Rejected";
    payment.verifiedAt = new Date().toISOString();

    saveSystemData();
    renderDashboard();

    alert("Payment has been rejected.");
}

// =========================================
// LOGOUT
// =========================================

function logout() {
    if (!confirm("Are you sure you want to log out?")) return;

    localStorage.removeItem(SESSION_KEY);
    window.location.href = "homepage.html";
}

// =========================================
// RENDER ALL DASHBOARD DATA
// =========================================

function renderDashboard() {
    renderStatistics();
    renderStudentTable();
    renderPendingPayments();
}

// =========================================
// INITIALIZE ADMIN DASHBOARD
// =========================================

document.addEventListener("DOMContentLoaded", function () {

    let session = null;

    try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (error) {
        localStorage.removeItem(SESSION_KEY);
    }

    if (!session || session.role !== "admin") {
        window.location.href = "homepage.html";
        return;
    }

    loadSystemData();
    renderDashboard();
    updateTuitionPreview();

    [
        "tuitionExact",
        "discountPercent",
        "paidExact"
    ].forEach(id => {
        document.getElementById(id)?.addEventListener(
            "input",
            updateTuitionPreview
        );
    });

    [
        "searchStudent",
        "filterCourse",
        "filterYear",
        "filterSection"
    ].forEach(id => {
        const field = document.getElementById(id);

        field?.addEventListener("input", renderStudentTable);
        field?.addEventListener("change", renderStudentTable);
    });

});
