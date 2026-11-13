
/* =====================================================
   ACeS SYNC - ACLC MANDAUE
   Main JavaScript
   Connected to index.html and style.css
===================================================== */


/* =====================================================
   1. SYSTEM DATA
===================================================== */

const STORAGE_KEY = "acesSyncData_v1";

let students = [];
let currentStudent = null;


// Load saved student records
function loadSavedData() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        students = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(students)) {
            students = [];
        }

        // Make sure older records have the required properties
        students.forEach(student => {
            if (!Array.isArray(student.payments)) {
                student.payments = [];
            }

            if (student.permit === undefined) {
                student.permit = null;
            }

            if (student.paid === undefined) {
                student.paid = 0;
            }

            if (student.balance === undefined) {
                student.balance = Math.max(
                    Number(student.discountedTuition || 0) -
                    Number(student.paid || 0),
                    0
                );
            }
        });

    } catch (error) {
        console.error("Unable to load saved data:", error);
        students = [];
    }
}


// Save student records
function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(students)
        );
    } catch (error) {
        console.error("Unable to save data:", error);
        alert("Unable to save your data. Check your browser storage.");
    }
}


/* =====================================================
   2. GENERAL FUNCTIONS
===================================================== */

// Get HTML element
function getElement(id) {
    return document.getElementById(id);
}


// Format Philippine peso
function money(amount) {
    return "₱" + Number(amount || 0).toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


// Display a message
function showMessage(element, message, color = "#b42318") {
    if (!element) return;

    element.textContent = message;
    element.style.color = color;
}


// Safely create a table cell
function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}


// Calculate student payment status
function getPaymentStatus(student) {
    if (Number(student.balance) <= 0) {
        return "Paid";
    }

    if (Number(student.paid) > 0) {
        return "Partial";
    }

    return "Unpaid";
}


// Get payment percentage
function getPaymentProgress(student) {
    const tuition = Number(student.discountedTuition || 0);

    if (tuition <= 0) return 0;

    return Math.min(
        (Number(student.paid || 0) / tuition) * 100,
        100
    );
}


/* =====================================================
   3. LOGIN TABS
===================================================== */

function showLogin(type) {
    const student = getElement("studentLogin");
    const admin = getElement("adminLogin");
    const tabs = document.querySelectorAll(".tab");

    if (type === "student") {
        student.classList.remove("hidden");
        admin.classList.add("hidden");

        tabs[0].classList.add("active");
        tabs[1].classList.remove("active");

    } else {
        student.classList.add("hidden");
        admin.classList.remove("hidden");

        tabs[0].classList.remove("active");
        tabs[1].classList.add("active");
    }
}


/* =====================================================
   4. TUITION PREVIEW
===================================================== */

function updateTuitionPreview() {
    const tuition = Number(getElement("tuitionExact").value) || 0;

    let discount = Number(getElement("discountPercent").value) || 0;

    const paid = Number(getElement("paidExact").value) || 0;

    // Keep discount between 0 and 100
    discount = Math.min(Math.max(discount, 0), 100);

    const discountAmount = tuition * (discount / 100);

    const discountedTuition = tuition - discountAmount;

    const balance = Math.max(discountedTuition - paid, 0);

    getElement("discountedTuition").textContent =
        money(discountedTuition);

    getElement("initialBalance").textContent =
        money(balance);
}


/* =====================================================
   5. ADD STUDENT
===================================================== */

function addStudent() {
    const id = getElement("studentID").value.trim();
    const name = getElement("studentName").value.trim();
    const grade = getElement("studentGrade").value;
    const course = getElement("studentCourse").value;
    const section = getElement("studentSectionAdmin").value.trim();

    const tuition = Number(getElement("tuitionExact").value);

    const discount = Number(getElement("discountPercent").value) || 0;

    const paid = Number(getElement("paidExact").value) || 0;


    // Required fields
    if (!id || !name || !grade || !course || !section) {
        alert("Please complete all student information.");
        return;
    }

    // Validate tuition
    if (!Number.isFinite(tuition) || tuition <= 0) {
        alert("Please enter a valid tuition amount.");
        return;
    }

    // Validate discount
    if (discount < 0 || discount > 100) {
        alert("Discount must be between 0% and 100%.");
        return;
    }

    // Validate initial payment
    if (!Number.isFinite(paid) || paid < 0) {
        alert("Please enter a valid initial payment.");
        return;
    }

    const discountAmount = tuition * (discount / 100);

    const discountedTuition = tuition - discountAmount;

    if (paid > discountedTuition) {
        alert("Initial payment cannot exceed the discounted tuition.");
        return;
    }

    // Check duplicate student ID
    const existingStudent = students.find(student =>
        student.id.toLowerCase() === id.toLowerCase()
    );

    if (existingStudent) {
        alert("Student ID already exists.");
        return;
    }

    // Create student record
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

    clearStudentForm();

    alert("Student added successfully!");
}


/* =====================================================
   6. CLEAR STUDENT FORM
===================================================== */

function clearStudentForm() {
    getElement("studentID").value = "";
    getElement("studentName").value = "";
    getElement("studentGrade").value = "";
    getElement("studentCourse").value = "";
    getElement("studentSectionAdmin").value = "";

    getElement("tuitionExact").value = "";
    getElement("discountPercent").value = "0";
    getElement("paidExact").value = "0";

    getElement("discountedTuition").textContent = money(0);
    getElement("initialBalance").textContent = money(0);
}


/* =====================================================
   7. RENDER STUDENT TABLE
===================================================== */

function renderStudents() {
    const table = getElement("adminTable");

    if (!table) return;

    table.innerHTML = "";

    students.forEach(student => {
        const row = document.createElement("tr");

        row.appendChild(createCell(student.id));
        row.appendChild(createCell(student.name));
        row.appendChild(createCell(student.course));
        row.appendChild(createCell(student.grade));
        row.appendChild(createCell(student.section));

        row.appendChild(createCell(money(student.discountedTuition)));
        row.appendChild(createCell(money(student.paid)));
        row.appendChild(createCell(money(student.balance)));

        const statusCell = createCell(getPaymentStatus(student));

        const statusBadge = document.createElement("span");
        statusBadge.className =
            "table-status " + getPaymentStatus(student).toLowerCase();

        statusBadge.textContent = getPaymentStatus(student);

        statusCell.textContent = "";
        statusCell.appendChild(statusBadge);

        row.appendChild(statusCell);

        table.appendChild(row);
    });

    getElement("countText").textContent =
        "Showing " + students.length + " students";
}


/* =====================================================
   8. SEARCH AND FILTER STUDENTS
===================================================== */

function filterStudents() {
    const search = getElement("searchStudent").value.toLowerCase();

    const course = getElement("filterCourse").value;

    const year = getElement("filterYear").value;

    const section = getElement("filterSection").value.toLowerCase();

    const table = getElement("adminTable");

    table.innerHTML = "";

    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.id.toLowerCase().includes(search) ||
            student.name.toLowerCase().includes(search);

        const matchesCourse =
            !course || student.course === course;

        const matchesYear =
            !year || student.grade === year;

        const matchesSection =
            !section ||
            student.section.toLowerCase().includes(section);

        return (
            matchesSearch &&
            matchesCourse &&
            matchesYear &&
            matchesSection
        );
    });

    filteredStudents.forEach(student => {
        const row = document.createElement("tr");

        row.appendChild(createCell(student.id));
        row.appendChild(createCell(student.name));
        row.appendChild(createCell(student.course));
        row.appendChild(createCell(student.grade));
        row.appendChild(createCell(student.section));

        row.appendChild(createCell(money(student.discountedTuition)));
        row.appendChild(createCell(money(student.paid)));
        row.appendChild(createCell(money(student.balance)));

        const status = getPaymentStatus(student);

        const statusCell = createCell("");

        const badge = document.createElement("span");
        badge.className = "table-status " + status.toLowerCase();
        badge.textContent = status;

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        table.appendChild(row);
    });

    getElement("countText").textContent =
        "Showing " + filteredStudents.length + " students";
}


/* =====================================================
   9. ADMIN DASHBOARD STATISTICS
===================================================== */

function updateStats() {
    const totalPayments = students.reduce(
        (total, student) =>
            total + Number(student.paid || 0),
        0
    );

    const permittedStudents = students.filter(
        student => student.permit
    );

    getElement("totalStudents").textContent = students.length;

    getElement("totalPayments").textContent = money(totalPayments);

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

async function adminLogin() {
    const email = getElement("adminId").value.trim();
    const password = getElement("adminPassword").value;
    const message = getElement("adminLoginMessage");

    if (!email || !password) {
        showMessage(message, "Please enter your email and password.");
        return;
    }

    try {
        showMessage(message, "Logging in...", "#93600a");

        // Sign in using Supabase Authentication
        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) throw error;

        // Check whether this account has the admin role
        const { data: roleData, error: roleError } =
            await supabase
                .from("user_roles")
                .select("role")
                .eq("user_id", data.user.id)
                .maybeSingle();

        if (roleError) throw roleError;

        if (!roleData || roleData.role !== "admin") {
            await supabase.auth.signOut();

            showMessage(
                message,
                "Access denied. This account is not an admin."
            );

            return;
        }

        // Open Admin Dashboard
        getElement("loginPage").classList.add("hidden");
        getElement("studentPage").classList.add("hidden");
        getElement("adminPage").classList.remove("hidden");

        showMessage(message, "");

        // We'll connect these dashboard functions to Supabase next.
        await loadAdminStudentsFromSupabase();

    } catch (error) {
        console.error("Admin login error:", error);

        showMessage(
            message,
            error.message || "Unable to log in."
        );
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
   12. LOAD STUDENT DASHBOARD
===================================================== */

function loadStudentDashboard() {
    if (!currentStudent) return;

    const student = currentStudent;

    // Student information
    getElement("displayStudentName").textContent = student.name;

    getElement("displayStudentId").textContent = student.id;

    getElement("displayStudentYear").textContent = student.grade;

    getElement("displayStudentCourse").textContent = student.course;

    getElement("displayStudentSection").textContent = student.section;


    // Tuition information
    getElement("studentTuition").textContent = money(student.tuition);

    getElement("studentDiscount").textContent = student.discount + "%";

    getElement("studentDiscountedTuition").textContent =
        money(student.discountedTuition);


    // Payment information
    getElement("studentPaid").textContent = money(student.paid);

    getElement("studentBalance").textContent = money(student.balance);


    // Payment status
    let status = "No Payment";

    if (student.balance <= 0) {
        status = "Fully Paid";
    } else if (student.paid > 0) {
        status = "Partially Paid";
    }

    getElement("paymentStatus").textContent = status;


    // Payment progress
    const progress = getPaymentProgress(student);

    getElement("paymentProgress").style.width = progress + "%";

    getElement("progressText").textContent =
        progress.toFixed(1) + "% paid";


    // Permit information
    if (student.permit) {
        getElement("permitStatus").textContent = "Generated";

        getElement("studentPermit").textContent = student.permit;

        getElement("permitNote").textContent =
            "Your exam permit is ready.";
    } else {
        getElement("permitStatus").textContent = "Not Yet Generated";

        getElement("studentPermit").textContent = "—";

        getElement("permitNote").textContent =
            "Your permit will be generated after payment verification.";
    }

    renderPaymentHistory();
}


/* =====================================================
   13. STUDENT PAYMENT HISTORY
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
   14. SUBMIT STUDENT PAYMENT
===================================================== */

function submitPayment() {
    if (!currentStudent) return;

    const reference = getElement("paymentReference").value.trim();

    const amount = Number(getElement("paymentAmount").value);

    const method = getElement("paymentMethod").value;

    const message = getElement("paymentMessage");


    if (!reference || !Number.isFinite(amount) || amount <= 0) {
        showMessage(
            message,
            "Please enter a valid reference number and payment amount."
        );

        return;
    }

    // Prevent payment exceeding the remaining balance
    if (amount > currentStudent.balance) {
        showMessage(
            message,
            "Payment cannot exceed your remaining balance."
        );

        return;
    }

    // Check duplicate reference number across all students
    const duplicateReference = students.some(student =>
        student.payments.some(payment =>
            payment.reference.toLowerCase() === reference.toLowerCase()
        )
    );

    if (duplicateReference) {
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

    saveData();

    getElement("paymentReference").value = "";
    getElement("paymentAmount").value = "";

    showMessage(
        message,
        "Payment submitted. Waiting for admin verification.",
        "#93600a"
    );

    renderPaymentHistory();
    renderPendingPayments();
}


/* =====================================================
   15. VERIFY PAYMENT
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

    // Check remaining balance again before verification
    if (payment.amount > student.balance) {
        alert("This payment exceeds the student's remaining balance.");
        return;
    }

    // Mark payment as verified
    payment.status = "Verified";

    payment.verifiedAt = new Date().toISOString();

    // Update student's payment totals
    student.paid += Number(payment.amount);

    student.balance = Math.max(
        student.discountedTuition - student.paid,
        0
    );


    // Generate permit after the first verified payment.
    // This follows the rule in your original JavaScript.
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

    if (currentStudent && currentStudent.id === student.id) {
        loadStudentDashboard();
    }

    alert("Payment successfully verified.");
}


/* =====================================================
   16. ADMIN PENDING PAYMENTS
===================================================== */

function renderPendingPayments() {
    const box = getElement("pendingPayments");

    if (!box) return;

    box.innerHTML = "";

    let found = false;

    students.forEach(student => {
        student.payments.forEach((payment, index) => {

            if (payment.status !== "Verified") {
                found = true;

                const item = document.createElement("div");

                item.className = "payment-item";


                const info = document.createElement("div");

                info.className = "payment-item-info";


                const studentName = document.createElement("strong");
                studentName.textContent = student.name;

                const studentId = document.createElement("span");
                studentId.textContent = "Student ID: " + student.id;

                const reference = document.createElement("span");
                reference.textContent = "Reference: " + payment.reference;

                const amount = document.createElement("strong");
                amount.textContent = money(payment.amount);

                const method = document.createElement("span");
                method.textContent = "Method: " + payment.method;

                const status = document.createElement("span");
                status.textContent = payment.status;


                info.append(
                    studentName,
                    studentId,
                    reference,
                    amount,
                    method,
                    status
                );


                const action = document.createElement("div");

                action.className = "payment-item-action";


                const verifyButton = document.createElement("button");

                verifyButton.type = "button";
                verifyButton.className = "gold-button";
                verifyButton.textContent = "Verify Payment";

                verifyButton.addEventListener("click", () => {
                    verifyPayment(student.id, index);
                });


                action.appendChild(verifyButton);

                item.append(info, action);

                box.appendChild(item);
            }
        });
    });


    if (!found) {
        const empty = document.createElement("p");

        empty.className = "empty-state";
        empty.textContent = "No pending payments.";

        box.appendChild(empty);
    }
}


// Refresh payment verification
function updatePaymentVerification() {
    renderPendingPayments();
}


/* =====================================================
   17. LOGOUT
===================================================== */

function logout() {
    currentStudent = null;

    getElement("adminPage").classList.add("hidden");

    getElement("studentPage").classList.add("hidden");

    getElement("loginPage").classList.remove("hidden");

    // Clear login messages
    showMessage(getElement("adminLoginMessage"), "");
    showMessage(getElement("studentLoginMessage"), "");

    // Clear admin password
    getElement("adminPassword").value = "";

    // Return to student login tab
    showLogin("student");
}


/* =====================================================
   18. INITIALIZE SYSTEM
===================================================== */

function initializeSystem() {
    loadSavedData();

    // Tuition preview listeners
    getElement("tuitionExact").addEventListener(
        "input",
        updateTuitionPreview
    );

    getElement("discountPercent").addEventListener(
        "input",
        updateTuitionPreview
    );

    getElement("paidExact").addEventListener(
        "input",
        updateTuitionPreview
    );


    // Student search and filter listeners
    getElement("searchStudent").addEventListener(
        "input",
        filterStudents
    );

    getElement("filterCourse").addEventListener(
        "change",
        filterStudents
    );

    getElement("filterYear").addEventListener(
        "change",
        filterStudents
    );

    getElement("filterSection").addEventListener(
        "input",
        filterStudents
    );


    // Initial dashboard display
    renderStudents();
    updateStats();
    updateTuitionPreview();
}


// Start system after HTML loads
document.addEventListener("DOMContentLoaded", initializeSystem);
