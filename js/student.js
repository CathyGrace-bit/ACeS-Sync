
/* =========================================
   ACeS SYNC - STUDENTS MODULE
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
   HELPERS
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
    return String(student.id || student.studentID || student.studentId || "");
}

function getStudentName(student) {
    return student.name || student.studentName || "";
}

function getTuition(student) {
    return Number(student.tuition || student.tuitionExact || 0);
}

function getDiscount(student) {
    return Number(student.discount || student.discountPercent || 0);
}

function getDiscountedTuition(student) {
    const tuition = getTuition(student);
    const discount = getDiscount(student);

    return tuition - (tuition * discount / 100);
}

function getPaid(student) {
    const studentId = getStudentId(student);

    return systemData.payments
        .filter(function(payment) {
            return String(payment.studentId || payment.studentID || "") === studentId &&
                String(payment.status || "").toLowerCase() === "approved";
        })
        .reduce(function(total, payment) {
            return total + Number(payment.amount || 0);
        }, 0);
}

function getBalance(student) {
    return Math.max(getDiscountedTuition(student) - getPaid(student), 0);
}

function getPaymentStatus(student) {
    const balance = getBalance(student);
    const paid = getPaid(student);

    if (balance <= 0) return "Paid";
    if (paid > 0) return "Partial";
    return "Unpaid";
}

/* =========================================
   LOAD AND SAVE DATA
========================================= */

function loadSystemData() {
    try {
        const savedData = localStorage.getItem(DATA_KEY);

        if (savedData) {
            const saved = JSON.parse(savedData);

            if (Array.isArray(saved)) {
                systemData.students = saved;
            } else if (saved && typeof saved === "object") {
                systemData.students = Array.isArray(saved.students) ? saved.students : [];
                systemData.payments = Array.isArray(saved.payments) ? saved.payments : [];
                systemData.permits = Array.isArray(saved.permits) ? saved.permits : [];
                systemData.messages = Array.isArray(saved.messages) ? saved.messages : [];
            }
        }
    } catch (error) {
        console.error("Error loading student records:", error);
    }
}

function saveSystemData() {
    try {
        localStorage.setItem(DATA_KEY, JSON.stringify(systemData));
    } catch (error) {
        console.error("Error saving student records:", error);
        alert("Unable to save student records.");
    }
}

/* =========================================
   ADMIN SESSION CHECK
========================================= */

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

/* =========================================
   RENDER STUDENT TABLE
========================================= */

function renderStudentTable() {
    const table = document.getElementById("adminTable");
    const countText = document.getElementById("countText");

    if (!table) return;

    const searchInput = document.getElementById("searchStudent");
    const courseInput = document.getElementById("filterCourse");
    const yearInput = document.getElementById("filterYear");
    const sectionInput = document.getElementById("filterSection");

    const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const course = courseInput ? courseInput.value : "";
    const year = yearInput ? yearInput.value : "";
    const section = sectionInput ? sectionInput.value.toLowerCase().trim() : "";

    const filteredStudents = systemData.students.filter(function(student) {
        const id = getStudentId(student).toLowerCase();
        const name = getStudentName(student).toLowerCase();
        const studentCourse = String(student.course || "");
        const studentYear = String(student.grade || student.year || "");
        const studentSection = String(student.section || "").toLowerCase();

        const matchesSearch = id.includes(search) || name.includes(search);
        const matchesCourse = !course || studentCourse === course;
        const matchesYear = !year || studentYear === year;
        const matchesSection = !section || studentSection.includes(section);

        return matchesSearch && matchesCourse && matchesYear && matchesSection;
    });

    if (countText) {
        countText.textContent = "Showing " + filteredStudents.length + " of " +
            systemData.students.length + " students";
    }

    if (filteredStudents.length === 0) {
        table.innerHTML =
            '<tr><td colspan="9" class="empty-state">No student records found.</td></tr>';
        return;
    }

    table.innerHTML = filteredStudents.map(function(student) {
        const tuition = getDiscountedTuition(student);
        const paid = getPaid(student);
        const balance = getBalance(student);
        const status = getPaymentStatus(student);

        let statusClass = "unpaid";

        if (status === "Paid") {
            statusClass = "paid";
        } else if (status === "Partial") {
            statusClass = "pending";
        }

        return (
            "<tr>" +
                "<td>" + escapeHTML(getStudentId(student)) + "</td>" +
                "<td>" + escapeHTML(getStudentName(student)) + "</td>" +
                "<td>" + escapeHTML(student.course || "—") + "</td>" +
                "<td>" + escapeHTML(student.grade || student.year || "—") + "</td>" +
                "<td>" + escapeHTML(student.section || "—") + "</td>" +
                "<td>" + money(tuition) + "</td>" +
                "<td>" + money(paid) + "</td>" +
                "<td>" + money(balance) + "</td>" +
                '<td><span class="status ' + statusClass + '">' +
                    escapeHTML(status) +
                "</span></td>" +
            "</tr>"
        );
    }).join("");
}

/* =========================================
   ADD STUDENT
========================================= */

function addStudent() {
    const id = document.getElementById("studentID").value.trim();
    const name = document.getElementById("studentName").value.trim();
    const grade = document.getElementById("studentGrade").value;
    const course = document.getElementById("studentCourse").value;
    const section = document.getElementById("studentSectionAdmin").value.trim();
    const tuition = Number(document.getElementById("tuitionExact").value);
    const discount = Number(document.getElementById("discountPercent").value || 0);
    const initialPaid = Number(document.getElementById("paidExact").value || 0);

    if (!id || !name || !grade || !course || !section) {
        alert("Please complete all student information.");
        return;
    }

    if (!Number.isFinite(tuition) || tuition <= 0) {
        alert("Please enter a valid tuition fee.");
        return;
    }

    if (discount < 0 || discount > 100) {
        alert("Discount must be between 0 and 100.");
        return;
    }

    const discountedTuition = tuition - (tuition * discount / 100);

    if (initialPaid < 0 || initialPaid > discountedTuition) {
        alert("Initial payment cannot exceed the discounted tuition.");
        return;
    }

    const duplicate = systemData.students.some(function(student) {
        return getStudentId(student).toLowerCase() === id.toLowerCase();
    });

    if (duplicate) {
        alert("This Student ID is already registered.");
        return;
    }

    const newStudent = {
        id: id,
        studentID: id,
        name: name,
        studentName: name,
        grade: grade,
        year: grade,
        course: course,
        section: section,
        tuition: tuition,
        discount: discount,
        dateAdded: new Date().toLocaleString()
    };

    systemData.students.push(newStudent);

    if (initialPaid > 0) {
        systemData.payments.push({
            id: "PAY-" + Date.now(),
            studentId: id,
            studentID: id,
            studentName: name,
            amount: initialPaid,
            reference: "INITIAL-PAYMENT",
            method: "Initial Payment",
            date: new Date().toLocaleString(),
            status: "Approved"
        });
    }

    saveSystemData();
    clearStudentForm();
    renderStudentTable();
    updateTuitionPreview();

    alert("Student successfully registered!");
}

/* =========================================
   CLEAR STUDENT FORM
========================================= */

function clearStudentForm() {
    const fieldIds = [
        "studentID",
        "studentName",
        "studentGrade",
        "studentCourse",
        "studentSectionAdmin",
        "tuitionExact"
    ];

    fieldIds.forEach(function(id) {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });

    const discount = document.getElementById("discountPercent");
    const paid = document.getElementById("paidExact");

    if (discount) discount.value = "0";
    if (paid) paid.value = "0";
}

/* =========================================
   TUITION PREVIEW
========================================= */

function updateTuitionPreview() {
    const tuitionInput = document.getElementById("tuitionExact");
    const discountInput = document.getElementById("discountPercent");
    const paidInput = document.getElementById("paidExact");

    const tuition = Number(tuitionInput ? tuitionInput.value : 0);
    const discount = Number(discountInput ? discountInput.value : 0);
    const paid = Number(paidInput ? paidInput.value : 0);

    const discountedTuition = tuition - (tuition * discount / 100);
    const balance = Math.max(discountedTuition - paid, 0);

    const discountedElement = document.getElementById("discountedTuition");
    const balanceElement = document.getElementById("initialBalance");

    if (discountedElement) {
        discountedElement.textContent = money(discountedTuition);
    }

    if (balanceElement) {
        balanceElement.textContent = money(balance);
    }
}

/* =========================================
   LOGOUT
========================================= */

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "../index.html";
}

/* =========================================
   INITIALIZE STUDENTS PAGE
========================================= */

document.addEventListener("DOMContentLoaded", function() {
    if (!checkAdminSession()) return;

    loadSystemData();
    renderStudentTable();
    updateTuitionPreview();

    const filterIds = [
        "searchStudent",
        "filterCourse",
        "filterYear",
        "filterSection"
    ];

    filterIds.forEach(function(id) {
        const field = document.getElementById(id);

        if (field) {
            field.addEventListener("input", renderStudentTable);
            field.addEventListener("change", renderStudentTable);
        }
    });

    const previewIds = [
        "tuitionExact",
        "discountPercent",
        "paidExact"
    ];

    previewIds.forEach(function(id) {
        const field = document.getElementById(id);

        if (field) {
            field.addEventListener("input", updateTuitionPreview);
        }
    });
});
