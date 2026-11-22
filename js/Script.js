
/* =====================================================
   ACeS SYNC - ACLC MANDAUE
   MAIN JAVASCRIPT
   Admin Dashboard + Student Dashboard
===================================================== */

"use strict";

const STORAGE_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";
const SETTINGS_KEY = "acesSyncSettings_v1";

let students = [];
let currentStudent = null;

/* =====================================================
   1. GENERAL HELPERS
===================================================== */

function getElement(id) {
    return document.getElementById(id);
}

function money(amount) {
    return "₱" + Number(amount || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function safeLower(value) {
    return String(value ?? "").trim().toLowerCase();
}

function showMessage(element, message, color = "#b42318") {
    if (!element) return;

    element.textContent = message;
    element.style.color = color;
}

function setText(id, value) {
    const element = getElement(id);
    if (element) element.textContent = value;
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";
    return cell;
}

function getPaymentStatus(student) {
    const balance = Number(student.balance || 0);
    const paid = Number(student.paid || 0);

    if (balance <= 0) return "Paid";
    if (paid > 0) return "Partial";
    return "Unpaid";
}

function getPaymentProgress(student) {
    const tuition = Number(student.discountedTuition || 0);

    if (tuition <= 0) return 0;

    return Math.min(
        (Number(student.paid || 0) / tuition) * 100,
        100
    );
}

/* =====================================================
   2. SHARED LOCAL STORAGE
===================================================== */

function loadSavedData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (!saved) {
            students = [];
            return;
        }

        const parsed = JSON.parse(saved);

        // Supports both the original array and an object
        // that contains a students array.
        if (Array.isArray(parsed)) {
            students = parsed;
        } else if (parsed && Array.isArray(parsed.students)) {
            students = parsed.students;
        } else {
            students = [];
        }

        students.forEach(student => {
            student.id = String(student.id ?? student.studentID ?? "");
            student.name = String(student.name ?? student.studentName ?? "");
            student.grade = String(student.grade ?? student.year ?? "");
            student.course = String(student.course ?? "");
            student.section = String(student.section ?? "");

            student.tuition = Number(student.tuition || 0);
            student.discount = Number(student.discount || 0);

            student.discountedTuition = Number(
                student.discountedTuition ??
                (student.tuition - (student.tuition * student.discount / 100))
            );

            student.paid = Number(student.paid || 0);

            student.balance = Number(
                student.balance ??
                Math.max(student.discountedTuition - student.paid, 0)
            );

            if (!Array.isArray(student.payments)) {
                student.payments = [];
            }

            if (student.permit === undefined) {
                student.permit = null;
            }

            if (student.permitGeneratedAt === undefined) {
                student.permitGeneratedAt = null;
            }
        });

    } catch (error) {
        console.error("Unable to load ACeS Sync data:", error);
        students = [];
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        return true;
    } catch (error) {
        console.error("Unable to save ACeS Sync data:", error);
        alert("Unable to save data. Please check your browser storage.");
        return false;
    }
}

// Shared helper for other scripts that need student records.
function getStudents() {
    return students;
}

function saveStudents(data) {
    if (!Array.isArray(data)) {
        console.error("saveStudents expects an array.");
        return;
    }

    students = data;
    saveData();
}

/* =====================================================
   3. SESSION MANAGEMENT
===================================================== */

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch (error) {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function logout() {
    currentStudent = null;
    clearSession();
    window.location.href = "homepage.html";
}

/* =====================================================
   4. ADMIN DASHBOARD
===================================================== */

function updateStats() {
    const totalPayments = students.reduce(
        (total, student) => total + Number(student.paid || 0),
        0
    );

    const permittedStudents = students.filter(
        student => Boolean(student.permit)
    );

    setText("totalStudents", students.length);
    setText("totalPayments", money(totalPayments));
    setText("permitsCount", permittedStudents.length);

    if (permittedStudents.length > 0) {
        const latestPermit = permittedStudents.reduce((latest, student) => {
            const currentDate = student.permitGeneratedAt || "";
            const latestDate = latest.permitGeneratedAt || "";

            return currentDate > latestDate ? student : latest;
        });

        setText("lastPermit", latestPermit.permit || "Generated");

        setText(
            "lastPermitDate",
            latestPermit.permitGeneratedAt
                ? new Date(latestPermit.permitGeneratedAt).toLocaleDateString("en-PH")
                : "Date unavailable"
        );
    } else {
        setText("lastPermit", "—");
        setText("lastPermitDate", "No permits yet");
    }
}

/* =====================================================
   5. TUITION PREVIEW
===================================================== */

function updateTuitionPreview() {
    const tuition = Number(getElement("tuitionExact")?.value) || 0;
    let discount = Number(getElement("discountPercent")?.value) || 0;
    const paid = Number(getElement("paidExact")?.value) || 0;

    discount = Math.min(Math.max(discount, 0), 100);

    const discountedTuition = tuition - (tuition * discount / 100);
    const balance = Math.max(discountedTuition - paid, 0);

    setText("discountedTuition", money(discountedTuition));
    setText("initialBalance", money(balance));
}

/* =====================================================
   6. ADD STUDENT
===================================================== */

function addStudent() {
    const id = getElement("studentID")?.value.trim() || "";
    const name = getElement("studentName")?.value.trim() || "";
    const grade = getElement("studentGrade")?.value || "";
    const course = getElement("studentCourse")?.value || "";
    const section = getElement("studentSectionAdmin")?.value.trim() || "";

    const tuition = Number(getElement("tuitionExact")?.value);
    const discount = Number(getElement("discountPercent")?.value) || 0;
    const paid = Number(getElement("paidExact")?.value) || 0;

    if (!id || !name || !grade || !course || !section) {
        alert("Please complete all student information.");
        return;
    }

    if (!Number.isFinite(tuition) || tuition <= 0) {
        alert("Please enter a valid tuition amount.");
        return;
    }

    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        alert("Discount must be between 0% and 100%.");
        return;
    }

    if (!Number.isFinite(paid) || paid < 0) {
        alert("Please enter a valid initial payment.");
        return;
    }

    const discountedTuition = tuition - (tuition * discount / 100);

    if (paid > discountedTuition) {
        alert("Initial payment cannot exceed the discounted tuition.");
        return;
    }

    const duplicate = students.some(
        student => safeLower(student.id) === safeLower(id)
    );

    if (duplicate) {
        alert("Student ID already exists.");
        return;
    }

    const student = {
        id,
        name,
        grade,
        course,
        section,
        tuition,
        discount,
        discountedTuition,
        paid,
        balance: Math.max(discountedTuition - paid, 0),
        permit: null,
        permitGeneratedAt: null,
        payments: []
    };

    students.push(student);

    if (!saveData()) {
        students.pop();
        return;
    }

    renderStudents();
    updateStats();
    renderPendingPayments();
    renderPermitPage();
    renderReports();
    clearStudentForm();

    alert("Student added successfully!");
}

/* =====================================================
   7. CLEAR STUDENT FORM
===================================================== */

function clearStudentForm() {
    [
        "studentID",
        "studentName",
        "studentGrade",
        "studentCourse",
        "studentSectionAdmin",
        "tuitionExact"
    ].forEach(id => {
        const element = getElement(id);
        if (element) element.value = "";
    });

    if (getElement("discountPercent")) {
        getElement("discountPercent").value = "0";
    }

    if (getElement("paidExact")) {
        getElement("paidExact").value = "0";
    }

    updateTuitionPreview();
}

/* =====================================================
   8. STUDENT RECORDS TABLE
===================================================== */

function renderStudentRows(list) {
    const table = getElement("adminTable");
    if (!table) return;

    table.innerHTML = "";

    list.forEach(student => {
        const row = document.createElement("tr");

        row.append(
            createCell(student.id),
            createCell(student.name),
            createCell(student.course),
            createCell(student.grade),
            createCell(student.section),
            createCell(money(student.discountedTuition)),
            createCell(money(student.paid)),
            createCell(money(student.balance))
        );

        const statusCell = createCell("");
        const badge = document.createElement("span");
        const status = getPaymentStatus(student);

        badge.className = "table-status " + status.toLowerCase();
        badge.textContent = status;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);
        table.appendChild(row);
    });

    setText("countText", "Showing " + list.length + " students");
}

function renderStudents() {
    renderStudentRows(students);
}

function filterStudents() {
    const search = safeLower(getElement("searchStudent")?.value);
    const course = getElement("filterCourse")?.value || "";
    const year = getElement("filterYear")?.value || "";
    const section = safeLower(getElement("filterSection")?.value);

    const filtered = students.filter(student => {
        const matchesSearch =
            safeLower(student.id).includes(search) ||
            safeLower(student.name).includes(search);

        const matchesCourse = !course || student.course === course;
        const matchesYear = !year || student.grade === year;
        const matchesSection =
            !section || safeLower(student.section).includes(section);

        return matchesSearch && matchesCourse &&
            matchesYear && matchesSection;
    });

    renderStudentRows(filtered);
}

/* =====================================================
   9. STUDENT DASHBOARD
===================================================== */

function loadStudentDashboard() {
    if (!currentStudent) return;

    const student = currentStudent;

    setText("displayStudentName", student.name);
    setText("displayStudentId", student.id);
    setText("displayStudentYear", student.grade);
    setText("displayStudentCourse", student.course);
    setText("displayStudentSection", student.section);

    setText("studentTuition", money(student.tuition));
    setText("studentDiscount", student.discount + "%");
    setText("studentDiscountedTuition", money(student.discountedTuition));
    setText("studentPaid", money(student.paid));
    setText("studentBalance", money(student.balance));

    let status = "No Payment";

    if (student.balance <= 0) {
        status = "Fully Paid";
    } else if (student.paid > 0) {
        status = "Partially Paid";
    }

    setText("paymentStatus", status);

    const progress = getPaymentProgress(student);

    const progressBar = getElement("paymentProgress");
    if (progressBar) {
        progressBar.style.width = progress + "%";
    }

    setText("progressText", progress.toFixed(1) + "% paid");

    if (student.permit) {
        setText("permitStatus", "Generated");
        setText("studentPermit", student.permit);
        setText("permitNote", "Your exam permit is ready.");
    } else {
        setText("permitStatus", "Not Yet Generated");
        setText("studentPermit", "—");
        setText(
            "permitNote",
            "Your permit will be generated after payment verification."
        );
    }

    renderPaymentHistory();
}

/* =====================================================
   10. PAYMENT HISTORY
===================================================== */

function renderPaymentHistory() {
    const history = getElement("paymentHistory");
    if (!history) return;

    history.innerHTML = "";

    if (!currentStudent || currentStudent.payments.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No payment history yet.";
        history.appendChild(empty);
        return;
    }

    currentStudent.payments.forEach(payment => {
        const item = document.createElement("div");
        item.className = "history-item";

        const reference = document.createElement("strong");
        reference.textContent = payment.reference || "No reference";

        const amount = document.createElement("span");
        amount.textContent = money(payment.amount);

        const method = document.createElement("span");
        method.textContent = payment.method || "Not specified";

        const status = document.createElement("span");
        status.textContent = payment.status || "Pending Verification";

        const date = document.createElement("small");
        date.textContent = payment.date
            ? new Date(payment.date).toLocaleString("en-PH")
            : "";

        item.append(reference, amount, method, status, date);
        history.appendChild(item);
    });
}

/* =====================================================
   11. SUBMIT PAYMENT
===================================================== */

function submitPayment() {
    if (!currentStudent) return;

    const reference = getElement("paymentReference")?.value.trim() || "";
    const amount = Number(getElement("paymentAmount")?.value);
    const method = getElement("paymentMethod")?.value || "";
    const message = getElement("paymentMessage");

    if (!reference || !Number.isFinite(amount) || amount <= 0 || !method) {
        showMessage(
            message,
            "Please enter a valid reference, amount, and payment method."
        );
        return;
    }

    if (amount > Number(currentStudent.balance)) {
        showMessage(
            message,
            "Payment cannot exceed your remaining balance."
        );
        return;
    }

    const duplicate = students.some(student =>
        student.payments.some(payment =>
            safeLower(payment.reference) === safeLower(reference)
        )
    );

    if (duplicate) {
        showMessage(
            message,
            "This payment reference number has already been submitted."
        );
        return;
    }

    const payment = {
        reference,
        amount,
        method,
        status: "Pending Verification",
        date: new Date().toISOString()
    };

    currentStudent.payments.push(payment);

    if (!saveData()) {
        currentStudent.payments.pop();
        return;
    }

    const referenceInput = getElement("paymentReference");
    const amountInput = getElement("paymentAmount");

    if (referenceInput) referenceInput.value = "";
    if (amountInput) amountInput.value = "";

    showMessage(
        message,
        "Payment submitted. Waiting for admin verification.",
        "#93600a"
    );

    renderPaymentHistory();
}

/* =====================================================
   12. PENDING PAYMENTS
===================================================== */

function renderPendingPayments() {
    const box = getElement("pendingPayments");
    if (!box) return;

    box.innerHTML = "";
    let pendingCount = 0;

    students.forEach(student => {
        student.payments.forEach((payment, index) => {
            if (payment.status !== "Verified") {
                pendingCount++;

                const item = document.createElement("div");
                item.className = "payment-item";

                const info = document.createElement("div");
                info.className = "payment-item-info";

                const details = [
                    ["strong", student.name],
                    ["span", "Student ID: " + student.id],
                    ["span", "Reference: " + payment.reference],
                    ["strong", money(payment.amount)],
                    ["span", "Method: " + payment.method],
                    ["span", payment.status]
                ];

                details.forEach(([tag, value]) => {
                    const element = document.createElement(tag);
                    element.textContent = value;
                    info.appendChild(element);
                });

                const action = document.createElement("div");
                action.className = "payment-item-action";

                const button = document.createElement("button");
                button.type = "button";
                button.className = "gold-button";
                button.textContent = "Verify Payment";

                button.addEventListener("click", () => {
                    verifyPayment(student.id, index);
                });

                action.appendChild(button);
                item.append(info, action);
                box.appendChild(item);
            }
        });
    });

    if (pendingCount === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "No pending payments.";
        box.appendChild(empty);
    }

    setText("pendingCount", pendingCount);
}

/* =====================================================
   13. VERIFY PAYMENT
===================================================== */

function verifyPayment(studentId, paymentIndex) {
    const student = students.find(
        item => item.id === String(studentId)
    );

    if (!student) return;

    const payment = student.payments[paymentIndex];
    if (!payment) return;

    if (payment.status === "Verified") {
        alert("This payment has already been verified.");
        return;
    }

    if (Number(payment.amount) > Number(student.balance)) {
        alert("This payment exceeds the student's remaining balance.");
        return;
    }

    payment.status = "Verified";
    payment.verifiedAt = new Date().toISOString();

    student.paid = Number(student.paid || 0) + Number(payment.amount);
    student.balance = Math.max(
        Number(student.discountedTuition) - student.paid,
        0
    );

    // Generate a permit after the first verified payment.
    if (!student.permit) {
        student.permit =
            "ACLC-" +
            new Date().getFullYear() +
            "-" +
            Math.floor(100000 + Math.random() * 900000);

        student.permitGeneratedAt = new Date().toISOString();
    }

    if (!saveData()) {
        payment.status = "Pending Verification";
        delete payment.verifiedAt;
        student.paid -= Number(payment.amount);
        student.balance = Math.max(
            Number(student.discountedTuition) - student.paid,
            0
        );
        student.permit = null;
        student.permitGeneratedAt = null;
        return;
    }

    renderStudents();
    updateStats();
    renderPendingPayments();
    renderPermitPage();
    renderReports();

    if (currentStudent && currentStudent.id === student.id) {
        currentStudent = student;
        loadStudentDashboard();
    }

    alert("Payment successfully verified.");
}

/* =====================================================
   14. PAYMENTS PAGE HELPER
===================================================== */

function initializePaymentsPage() {
    updateStats();
    renderPendingPayments();
}

/* =====================================================
   15. EXAM PERMITS
===================================================== */

function renderPermitPage() {
    const table = getElement("permitTable");
    if (!table) return;

    const search = safeLower(getElement("permitSearch")?.value);
    const filter = getElement("permitFilter")?.value || "";

    const filtered = students.filter(student => {
        const matchesSearch =
            safeLower(student.id).includes(search) ||
            safeLower(student.name).includes(search);

        const hasPermit = Boolean(student.permit);

        const matchesFilter =
            !filter ||
            (filter === "generated" && hasPermit) ||
            (filter === "not-generated" && !hasPermit);

        return matchesSearch && matchesFilter;
    });

    table.innerHTML = "";

    filtered.forEach(student => {
        const row = document.createElement("tr");

        row.append(
            createCell(student.id),
            createCell(student.name),
            createCell(student.course),
            createCell(student.grade),
            createCell(student.section),
            createCell(student.permit || "—"),
            createCell(
                student.permitGeneratedAt
                    ? new Date(student.permitGeneratedAt).toLocaleDateString("en-PH")
                    : "—"
            ),
            createCell(student.permit ? "Generated" : "Not Generated")
        );

        table.appendChild(row);
    });

    const permitted = students.filter(student => student.permit).length;

    setText("totalStudents", students.length);
    setText("permitsCount", permitted);
    setText("withoutPermitCount", students.length - permitted);
    setText("permitCountText", "Showing " + filtered.length + " students");
}

/* =====================================================
   16. REPORTS
===================================================== */

function renderReports() {
    const table = getElement("reportTable");
    if (!table) return;

    const search = safeLower(getElement("reportSearch")?.value);
    const statusFilter = getElement("reportStatusFilter")?.value || "";

    const totalTuition = students.reduce(
        (sum, student) => sum + Number(student.discountedTuition || 0),
        0
    );

    const totalCollected = students.reduce(
        (sum, student) => sum + Number(student.paid || 0),
        0
    );

    const totalBalance = students.reduce(
        (sum, student) => sum + Number(student.balance || 0),
        0
    );

    const paidCount = students.filter(
        student => getPaymentStatus(student) === "Paid"
    ).length;

    const partialCount = students.filter(
        student => getPaymentStatus(student) === "Partial"
    ).length;

    const unpaidCount = students.filter(
        student => getPaymentStatus(student) === "Unpaid"
    ).length;

    setText("reportTotalStudents", students.length);
    setText("reportTotalTuition", money(totalTuition));
    setText("reportTotalCollected", money(totalCollected));
    setText("reportTotalBalance", money(totalBalance));
    setText("reportFullyPaid", paidCount);
    setText("reportPartiallyPaid", partialCount);
    setText("reportUnpaid", unpaidCount);

    const filtered = students.filter(student => {
        const matchesSearch =
            safeLower(student.id).includes(search) ||
            safeLower(student.name).includes(search);

        const matchesStatus =
            !statusFilter || getPaymentStatus(student) === statusFilter;

        return matchesSearch && matchesStatus;
    });

    table.innerHTML = "";

    filtered.forEach(student => {
        const row = document.createElement("tr");

        row.append(
            createCell(student.id),
            createCell(student.name),
            createCell(student.course),
            createCell(student.grade),
            createCell(money(student.tuition)),
            createCell(student.discount + "%"),
            createCell(money(student.discountedTuition)),
            createCell(money(student.paid)),
            createCell(money(student.balance)),
            createCell(getPaymentStatus(student))
        );

        table.appendChild(row);
    });

    setText("reportCountText", "Showing " + filtered.length + " students");
}

/* =====================================================
   17. SETTINGS
===================================================== */

function loadSettings() {
    let settings = {};

    try {
        settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (error) {
        settings = {};
    }

    ["schoolName", "systemName", "campusName", "academicYear"].forEach(id => {
        const element = getElement(id);

        if (element && settings[id]) {
            element.value = settings[id];
        }
    });
}

function saveSettings() {
    const settings = {
        schoolName: getElement("schoolName")?.value.trim() || "",
        systemName: getElement("systemName")?.value.trim() || "",
        campusName: getElement("campusName")?.value.trim() || "",
        academicYear: getElement("academicYear")?.value.trim() || ""
    };

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        showMessage(
            getElement("settingsMessage"),
            "Settings saved successfully!",
            "#16845b"
        );
    } catch (error) {
        showMessage(
            getElement("settingsMessage"),
            "Unable to save settings."
        );
    }
}

/* =====================================================
   18. EXPORT STUDENT DATA
===================================================== */

function exportStudentData() {
    if (students.length === 0) {
        alert("There are no student records to export.");
        return;
    }

    const headers = [
        "Student ID",
        "Name",
        "Course",
        "Year",
        "Section",
        "Tuition",
        "Discount",
        "Discounted Tuition",
        "Paid",
        "Balance",
        "Payment Status",
        "Permit Number"
    ];

    const rows = students.map(student => [
        student.id,
        student.name,
        student.course,
        student.grade,
        student.section,
        student.tuition,
        student.discount + "%",
        student.discountedTuition,
        student.paid,
        student.balance,
        getPaymentStatus(student),
        student.permit || ""
    ]);

    const escapeCSV = value =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"';

    const csv = [headers, ...rows]
        .map(row => row.map(escapeCSV).join(","))
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "ACeS-Sync-Student-Records.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

/* =====================================================
   19. PAGE ACCESS CONTROL
===================================================== */

function protectPage() {
    const session = getSession();
    const page = window.location.pathname.split("/").pop().toLowerCase();

    const isStudentPage = page === "student-dashboard.html";
    const isAdminPage = page === "admindashboard.html";

    if (!session || !session.loggedIn) {
        window.location.href = "homepage.html";
        return false;
    }

    if (isAdminPage && session.role !== "admin") {
        window.location.href = "student-dashboard.html";
        return false;
    }

    if (isStudentPage && session.role !== "student") {
        window.location.href = "admindashboard.html";
        return false;
    }

    if (!isAdminPage && !isStudentPage) {
        window.location.href = "homepage.html";
        return false;
    }

    if (session.role === "student") {
        currentStudent = students.find(
            student => student.id === String(session.studentId)
        );

        if (!currentStudent) {
            alert("Student record not found. Please login again.");
            clearSession();
            window.location.href = "homepage.html";
            return false;
        }
    }

    return true;
}

/* =====================================================
   20. PAGE INITIALIZATION
===================================================== */

function initializeSystem() {
    loadSavedData();

    if (!protectPage()) return;

    const page = window.location.pathname.split("/").pop().toLowerCase();

    if (page === "admindashboard.html") {
        renderStudents();
        updateStats();
        renderPendingPayments();
        updateTuitionPreview();
    }

    if (page === "student-dashboard.html") {
        loadStudentDashboard();
    }

    // Tuition preview inputs
    ["tuitionExact", "discountPercent", "paidExact"].forEach(id => {
        const element = getElement(id);

        if (element) {
            element.addEventListener("input", updateTuitionPreview);
        }
    });

    // Student table search and filters
    ["searchStudent", "filterSection"].forEach(id => {
        const element = getElement(id);

        if (element) {
            element.addEventListener("input", filterStudents);
        }
    });

    ["filterCourse", "filterYear"].forEach(id => {
        const element = getElement(id);

        if (element) {
            element.addEventListener("change", filterStudents);
        }
    });

    // Permit search and filter
    if (getElement("permitSearch")) {
        getElement("permitSearch").addEventListener("input", renderPermitPage);
    }

    if (getElement("permitFilter")) {
        getElement("permitFilter").addEventListener("change", renderPermitPage);
    }

    // Reports search and filter
    if (getElement("reportSearch")) {
        getElement("reportSearch").addEventListener("input", renderReports);
    }

    if (getElement("reportStatusFilter")) {
        getElement("reportStatusFilter").addEventListener("change", renderReports);
    }
}

document.addEventListener("DOMContentLoaded", initializeSystem);
