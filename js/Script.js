/* =====================================================
   ACeS SYNC - ACLC MANDAUE
   Main JavaScript
   Supports all separate HTML pages
===================================================== */

const STORAGE_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";
const SETTINGS_KEY = "acesSyncSettings_v1";

let students = [];
let currentStudent = null;


/* =====================================================
   1. GENERAL FUNCTIONS
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

function showMessage(element, message, color = "#b42318") {
    if (!element) return;

    element.textContent = message;
    element.style.color = color;
}

function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";
    return cell;
}

function getPaymentStatus(student) {
    if (Number(student.balance) <= 0) return "Paid";
    if (Number(student.paid) > 0) return "Partial";
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

function safeLower(value) {
    return String(value || "").toLowerCase();
}


/* =====================================================
   2. LOCAL STORAGE
===================================================== */

function loadSavedData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        students = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(students)) students = [];

        students.forEach(student => {
            student.id = String(student.id || "");
            student.name = String(student.name || "");
            student.grade = String(student.grade || "");
            student.course = String(student.course || "");
            student.section = String(student.section || "");

            student.tuition = Number(student.tuition || 0);
            student.discount = Number(student.discount || 0);
            student.discountedTuition = Number(
                student.discountedTuition ??
                (student.tuition - student.tuition * student.discount / 100)
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
        console.error("Unable to load saved data:", error);
        students = [];
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (error) {
        console.error("Unable to save data:", error);
        alert("Unable to save your data. Check your browser storage.");
    }
}


/* =====================================================
   3. SESSION MANAGEMENT
===================================================== */

function saveSession(role, studentId = null) {
    const session = {
        role,
        studentId,
        loggedIn: true
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

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
    window.location.href = "index.html";
}


/* =====================================================
   4. LOGIN TABS
===================================================== */

function showLogin(type) {
    const student = getElement("studentLogin");
    const admin = getElement("adminLogin");
    const tabs = document.querySelectorAll(".tab");

    if (!student || !admin) return;

    if (type === "student") {
        student.classList.remove("hidden");
        admin.classList.add("hidden");

        if (tabs[0]) tabs[0].classList.add("active");
        if (tabs[1]) tabs[1].classList.remove("active");
    } else {
        student.classList.add("hidden");
        admin.classList.remove("hidden");

        if (tabs[0]) tabs[0].classList.remove("active");
        if (tabs[1]) tabs[1].classList.add("active");
    }
}


/* =====================================================
   5. ADMIN LOGIN
===================================================== */

function adminLogin() {
    const id = getElement("adminId")?.value.trim();
    const password = getElement("adminPassword")?.value;
    const message = getElement("adminLoginMessage");

    // DEMO CREDENTIALS
    if (id === "admin" && password === "1234") {
        saveSession("admin");
        showMessage(message, "");
        window.location.href = "homepage.html";
    } else {
        showMessage(message, "Incorrect Admin ID or Password.");
    }
}


/* =====================================================
   6. STUDENT LOGIN
===================================================== */

function studentLogin() {
    const id = getElement("studentId")?.value.trim();
    const name = getElement("studentNameLogin")?.value.trim();
    const year = getElement("studentYear")?.value;
    const course = getElement("studentCourseLogin")?.value;
    const section = getElement("studentSection")?.value.trim();

    const message = getElement("studentLoginMessage");

    if (!id || !name || !year || !course || !section) {
        showMessage(message, "Please complete all student information.");
        return;
    }

    const student = students.find(s =>
        safeLower(s.id) === safeLower(id) &&
        safeLower(s.name) === safeLower(name) &&
        s.grade === year &&
        s.course === course &&
        safeLower(s.section) === safeLower(section)
    );

    if (!student) {
        showMessage(
            message,
            "Student record not found. Please check your information."
        );
        return;
    }

    saveSession("student", student.id);
    showMessage(message, "");
    window.location.href = "student-dashboard.html";
}


/* =====================================================
   7. TUITION PREVIEW
===================================================== */

function updateTuitionPreview() {
    const tuition = Number(getElement("tuitionExact")?.value) || 0;
    let discount = Number(getElement("discountPercent")?.value) || 0;
    const paid = Number(getElement("paidExact")?.value) || 0;

    discount = Math.min(Math.max(discount, 0), 100);

    const discountedTuition = tuition - tuition * discount / 100;
    const balance = Math.max(discountedTuition - paid, 0);

    if (getElement("discountedTuition")) {
        getElement("discountedTuition").textContent =
            money(discountedTuition);
    }

    if (getElement("initialBalance")) {
        getElement("initialBalance").textContent = money(balance);
    }
}


/* =====================================================
   8. ADD STUDENT
===================================================== */

function addStudent() {
    const id = getElement("studentID")?.value.trim();
    const name = getElement("studentName")?.value.trim();
    const grade = getElement("studentGrade")?.value;
    const course = getElement("studentCourse")?.value;
    const section = getElement("studentSectionAdmin")?.value.trim();

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

    if (discount < 0 || discount > 100) {
        alert("Discount must be between 0% and 100%.");
        return;
    }

    if (!Number.isFinite(paid) || paid < 0) {
        alert("Please enter a valid initial payment.");
        return;
    }

    const discountedTuition = tuition - tuition * discount / 100;

    if (paid > discountedTuition) {
        alert("Initial payment cannot exceed the discounted tuition.");
        return;
    }

    if (students.some(s => safeLower(s.id) === safeLower(id))) {
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
        balance: discountedTuition - paid,
        permit: null,
        permitGeneratedAt: null,
        payments: []
    };

    students.push(student);
    saveData();

    renderStudents();
    updateStats();
    renderPendingPayments();
    renderPermitPage();
    renderReports();
    clearStudentForm();

    alert("Student added successfully!");
}


/* =====================================================
   9. CLEAR STUDENT FORM
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
        if (getElement(id)) getElement(id).value = "";
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
   10. STUDENT TABLE
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

    if (getElement("countText")) {
        getElement("countText").textContent =
            "Showing " + list.length + " students";
    }
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
   11. DASHBOARD STATISTICS
===================================================== */

function updateStats() {
    const totalPayments = students.reduce(
        (total, student) => total + Number(student.paid || 0),
        0
    );

    const permitted = students.filter(student => student.permit);

    if (getElement("totalStudents")) {
        getElement("totalStudents").textContent = students.length;
    }

    if (getElement("totalPayments")) {
        getElement("totalPayments").textContent = money(totalPayments);
    }

    getElement("permitsCount").textContent =
        permittedStudents.length;

    if (permittedStudents.length > 0) {
        const latestPermit = permittedStudents.reduce((latest, student) => {
            const currentDate = student.permitGeneratedAt || "";

            const latestDate = latest.permitGeneratedAt || "";

            return currentDate > latestDate ? student : latest;
        });

        getElement("lastPermit").textContent = latestPermit.permit;

        getElement("lastPermitDate").textContent =
            latestPermit.permitGeneratedAt
                ? new Date(latestPermit.permitGeneratedAt).toLocaleDateString("en-PH")
                : "Latest permit";
    } else {
        getElement("lastPermit").textContent = "—";
        getElement("lastPermitDate").textContent = "No permits yet";
    }
}


/* =====================================================
   10. ADMIN LOGIN
===================================================== */

function adminLogin() {
    const id = getElement("adminId").value.trim();

    const password = getElement("adminPassword").value;

    const message = getElement("adminLoginMessage");

    // DEMO LOGIN ONLY
    if (id === "admin" && password === "1234") {
        getElement("loginPage").classList.add("hidden");

        getElement("studentPage").classList.add("hidden");

        getElement("adminPage").classList.remove("hidden");

        showMessage(message, "");

        renderStudents();
        updateStats();
        renderPendingPayments();

    } else {
        showMessage(message, "Incorrect Admin ID or Password.");
    }
}


/* =====================================================
   11. STUDENT LOGIN
===================================================== */

function studentLogin() {
    const id = getElement("studentId").value.trim();

    const name = getElement("studentNameLogin").value.trim();

    const year = getElement("studentYear").value;

    const course = getElement("studentCourseLogin").value;

    const section = getElement("studentSection").value.trim();

    const message = getElement("studentLoginMessage");

    const student = students.find(s => {
        return (
            s.id.toLowerCase() === id.toLowerCase() &&
            s.name.toLowerCase() === name.toLowerCase() &&
            s.grade === year &&
            s.course === course &&
            s.section.toLowerCase() === section.toLowerCase()
        );
    });

    if (!student) {
        showMessage(
            message,
            "Student record not found. Please check your information."
        );

        return;
    }

    currentStudent = student;

    getElement("loginPage").classList.add("hidden");

    getElement("adminPage").classList.add("hidden");

    getElement("studentPage").classList.remove("hidden");

    showMessage(message, "");

    loadStudentDashboard();
}


/* =====================================================
   12. STUDENT DASHBOARD
===================================================== */

function loadStudentDashboard() {
    if (!currentStudent) return;

    const student = currentStudent;

    const setText = (id, value) => {
        if (getElement(id)) getElement(id).textContent = value;
    };

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

    if (getElement("paymentProgress")) {
        getElement("paymentProgress").style.width = progress + "%";
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
   13. PAYMENT HISTORY
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
        reference.textContent = payment.reference;

        const amount = document.createElement("span");
        amount.textContent = money(payment.amount);

        const method = document.createElement("span");
        method.textContent = payment.method;

        const status = document.createElement("span");
        status.textContent = payment.status;

        const date = document.createElement("small");
        date.textContent = payment.date
            ? new Date(payment.date).toLocaleString("en-PH")
            : "";

        item.append(reference, amount, method, status, date);
        history.appendChild(item);
    });
}


/* =====================================================
   14. SUBMIT PAYMENT
===================================================== */

function submitPayment() {
    if (!currentStudent) return;

    const reference = getElement("paymentReference")?.value.trim();
    const amount = Number(getElement("paymentAmount")?.value);
    const method = getElement("paymentMethod")?.value;
    const message = getElement("paymentMessage");

    if (!reference || !Number.isFinite(amount) || amount <= 0 || !method) {
        showMessage(
            message,
            "Please enter a valid reference, amount, and payment method."
        );
        return;
    }

    if (amount > currentStudent.balance) {
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

    currentStudent.payments.push({
        reference,
        amount,
        method,
        status: "Pending Verification",
        date: new Date().toISOString()
    });

    saveData();

    getElement("paymentReference").value = "";
    getElement("paymentAmount").value = "";

    showMessage(
        message,
        "Payment submitted. Waiting for admin verification.",
        "#93600a"
    );

    renderPaymentHistory();
}


/* =====================================================
   15. PENDING PAYMENTS
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

    if (getElement("pendingCount")) {
        getElement("pendingCount").textContent = pendingCount;
    }
}


/* =====================================================
   16. VERIFY PAYMENT
===================================================== */

function verifyPayment(studentId, paymentIndex) {
    const student = students.find(s => s.id === studentId);
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

    if (!student.permit) {
        student.permit =
            "ACLC-" +
            new Date().getFullYear() +
            "-" +
            Math.floor(100000 + Math.random() * 900000);

        student.permitGeneratedAt = new Date().toISOString();
    }

    saveData();

    renderStudents();
    updateStats();
    renderPendingPayments();
    renderPermitPage();
    renderReports();

    if (currentStudent && currentStudent.id === student.id) {
        loadStudentDashboard();
    }

    alert("Payment successfully verified.");
}


/* =====================================================
   17. PAYMENTS PAGE
===================================================== */

function initializePaymentsPage() {
    updateStats();
    renderPendingPayments();
}


/* =====================================================
   18. EXAM PERMITS PAGE
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

    const permitted = students.filter(s => s.permit).length;

    if (getElement("totalStudents")) {
        getElement("totalStudents").textContent = students.length;
    }

    if (getElement("permitsCount")) {
        getElement("permitsCount").textContent = permitted;
    }

    if (getElement("withoutPermitCount")) {
        getElement("withoutPermitCount").textContent =
            students.length - permitted;
    }

    if (getElement("permitCountText")) {
        getElement("permitCountText").textContent =
            "Showing " + filtered.length + " students";
    }
}


/* =====================================================
   19. REPORTS PAGE
===================================================== */

function renderReports() {
    const table = getElement("reportTable");
    if (!table) return;

    const search = safeLower(getElement("reportSearch")?.value);
    const statusFilter = getElement("reportStatusFilter")?.value || "";

    const totalTuition = students.reduce(
        (sum, s) => sum + Number(s.discountedTuition || 0),
        0
    );

    const totalCollected = students.reduce(
        (sum, s) => sum + Number(s.paid || 0),
        0
    );

    const totalBalance = students.reduce(
        (sum, s) => sum + Number(s.balance || 0),
        0
    );

    const paidCount = students.filter(s => getPaymentStatus(s) === "Paid").length;
    const partialCount = students.filter(s => getPaymentStatus(s) === "Partial").length;
    const unpaidCount = students.filter(s => getPaymentStatus(s) === "Unpaid").length;

    const setText = (id, value) => {
        if (getElement(id)) getElement(id).textContent = value;
    };

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
   20. SETTINGS PAGE
===================================================== */

function loadSettings() {
    let settings = {};

    try {
        settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (error) {
        settings = {};
    }

    if (getElement("schoolName") && settings.schoolName) {
        getElement("schoolName").value = settings.schoolName;
    }

    if (getElement("systemName") && settings.systemName) {
        getElement("systemName").value = settings.systemName;
    }

    if (getElement("campusName") && settings.campusName) {
        getElement("campusName").value = settings.campusName;
    }

    if (getElement("academicYear") && settings.academicYear) {
        getElement("academicYear").value = settings.academicYear;
    }
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
   21. EXPORT STUDENT DATA
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
   22. PAGE ACCESS CONTROL
===================================================== */

function protectPage() {
    const session = getSession();
    const page = window.location.pathname.split("/").pop().toLowerCase();

    const isLoginPage = page === "" || page === "index.html";
    const isStudentPage = page === "student-dashboard.html";

    if (isLoginPage) {
        if (session?.loggedIn) {
            if (session.role === "admin") {
                window.location.href = "homepage.html";
                return false;
            }

            if (session.role === "student") {
                window.location.href = "student-dashboard.html";
                return false;
            }
        }

        return true;
    }

    if (!session || !session.loggedIn) {
        window.location.href = "index.html";
        return false;
    }

    if (isStudentPage && session.role !== "student") {
        window.location.href = "homepage.html";
        return false;
    }

    if (!isStudentPage && session.role !== "admin") {
        window.location.href = "student-dashboard.html";
        return false;
    }

    if (session.role === "student") {
        currentStudent = students.find(
            student => student.id === session.studentId
        );

        if (!currentStudent) {
            alert("Student record not found. Please login again.");
            clearSession();
            window.location.href = "index.html";
            return false;
        }
    }

    return true;
}


/* =====================================================
   23. INITIALIZE ALL PAGES
===================================================== */

function initializeSystem() {
    loadSavedData();

    if (!protectPage()) return;

    const page = window.location.pathname.split("/").pop().toLowerCase();

    // LOGIN PAGE
    if (page === "" || page === "index.html") {
        showLogin("student");
        return;
    }

    // ADMIN DASHBOARD
    if (page === "homepage.html") {

    if (getElement("adminPage")) {
        getElement("adminPage").classList.remove("hidden");
    }

    if (getElement("studentPage")) {
        getElement("studentPage").classList.add("hidden");
    }

    renderStudents();
    updateStats();
    renderPendingPayments();
}

    // STUDENTS PAGE
    if (page === "students.html") {
        renderStudents();
        updateTuitionPreview();
    }

    // PAYMENTS PAGE
    if (page === "payments.html") {
        initializePaymentsPage();
    }

    // PERMITS PAGE
    if (page === "permits.html") {
        renderPermitPage();
    }

    // REPORTS PAGE
    if (page === "reports.html") {
        renderReports();
    }

    // SETTINGS PAGE
    if (page === "settings.html") {
        loadSettings();
    }

    // STUDENT DASHBOARD
    if (page === "student-dashboard.html") {
        loadStudentDashboard();
    }

    // TUITION INPUT LISTENERS
    ["tuitionExact", "discountPercent", "paidExact"].forEach(id => {
        if (getElement(id)) {
            getElement(id).addEventListener("input", updateTuitionPreview);
        }
    });

    // STUDENT SEARCH AND FILTERS
    ["searchStudent", "filterSection"].forEach(id => {
        if (getElement(id)) {
            getElement(id).addEventListener("input", filterStudents);
        }
    });

    ["filterCourse", "filterYear"].forEach(id => {
        if (getElement(id)) {
            getElement(id).addEventListener("change", filterStudents);
        }
    });

    // PERMIT SEARCH AND FILTER
    if (getElement("permitSearch")) {
        getElement("permitSearch").addEventListener("input", renderPermitPage);
    }

    if (getElement("permitFilter")) {
        getElement("permitFilter").addEventListener("change", renderPermitPage);
    }

    // REPORT SEARCH AND FILTER
    if (getElement("reportSearch")) {
        getElement("reportSearch").addEventListener("input", renderReports);
    }

    if (getElement("reportStatusFilter")) {
        getElement("reportStatusFilter").addEventListener("change", renderReports);
    }
}


// Start after HTML loads
document.addEventListener("DOMContentLoaded", initializeSystem);