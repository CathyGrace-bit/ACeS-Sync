let students = [];
let currentStudent = null;


// LOGIN TAB

function showLogin(type) {

    const student = document.getElementById("studentLogin");
    const admin = document.getElementById("adminLogin");

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


// FORMAT MONEY

function money(amount) {

    return "₱" + Number(amount || 0).toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}
// ADD STUDENT

function addStudent() {

    const id = document.getElementById("studentID").value.trim();
    const name = document.getElementById("studentName").value.trim();
    const grade = document.getElementById("studentGrade").value;
    const course = document.getElementById("studentCourse").value;
    const section = document.getElementById("studentSectionAdmin").value.trim();

    const tuition = Number(
        document.getElementById("tuitionExact").value
    );

    const discount = Number(
        document.getElementById("discountPercent").value
    ) || 0;

    const paid = Number(
        document.getElementById("paidExact").value
    ) || 0;


    // CHECK REQUIRED FIELDS

    if (!id || !name || !grade || !course || !section || !tuition) {

        alert("Please complete all student information.");

        return;
    }


    // CHECK DUPLICATE ID

    const existing = students.find(
        student => student.id === id
    );

    if (existing) {

        alert("Student ID already exists.");

        return;
    }


    // CALCULATE DISCOUNT

    const discountAmount =
        tuition * (discount / 100);

    const discountedTuition =
        tuition - discountAmount;


    // CALCULATE BALANCE

    const balance =
        Math.max(discountedTuition - paid, 0);


    // CREATE STUDENT

    const student = {

        id: id,
        name: name,
        grade: grade,
        course: course,
        section: section,

        tuition: tuition,
        discount: discount,

        discountedTuition: discountedTuition,

        paid: paid,

        balance: balance,

        permit: null,

        payments: []

    };


    // SAVE TO STUDENT LIST

    students.push(student);


    // UPDATE DASHBOARD

    renderStudents();
    updateStats();


    // CLEAR FORM

    clearStudentForm();


    alert("Student added successfully!");

}
// UPDATE TUITION PREVIEW

function updateTuitionPreview() {

    const tuition =
        Number(document.getElementById("tuitionExact").value) || 0;

    const discount =
        Number(document.getElementById("discountPercent").value) || 0;

    const paid =
        Number(document.getElementById("paidExact").value) || 0;


    const discountAmount =
        tuition * (discount / 100);

    const discounted =
        tuition - discountAmount;

    const balance =
        Math.max(discounted - paid, 0);


    document.getElementById("discountedTuition").textContent =
        money(discounted);

    document.getElementById("initialBalance").textContent =
        money(balance);
}
// AUTOMATIC PREVIEW

document.getElementById("tuitionExact")
    .addEventListener("input", updateTuitionPreview);

document.getElementById("discountPercent")
    .addEventListener("input", updateTuitionPreview);

document.getElementById("paidExact")
    .addEventListener("input", updateTuitionPreview);
// RENDER STUDENTS

function renderStudents() {

    const table = document.getElementById("adminTable");

    table.innerHTML = "";

    students.forEach(function(student) {

        const row = document.createElement("tr");

        let status = "Unpaid";

        if (student.balance <= 0) {
            status = "Paid";
        } else if (student.paid > 0) {
            status = "Partial";
        }

        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.course}</td>
            <td>${student.grade}</td>
            <td>${student.section}</td>
            <td>${money(student.discountedTuition)}</td>
            <td>${money(student.paid)}</td>
            <td>${money(student.balance)}</td>
            <td>${status}</td>
        `;

        table.appendChild(row);

    });

    document.getElementById("countText").textContent =
        "Showing " + students.length + " students";
}
// SEARCH AND FILTER STUDENTS

function filterStudents() {

    const search =
        document.getElementById("searchStudent").value
        .toLowerCase();

    const course =
        document.getElementById("filterCourse").value;

    const year =
        document.getElementById("filterYear").value;

    const section =
        document.getElementById("filterSection").value
        .toLowerCase();


    const table =
        document.getElementById("adminTable");

    table.innerHTML = "";


    const filtered = students.filter(function(student) {

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


    filtered.forEach(function(student) {

        const row = document.createElement("tr");

        let status = "Unpaid";

        if (student.balance <= 0) {
            status = "Paid";
        } else if (student.paid > 0) {
            status = "Partial";
        }

        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.course}</td>
            <td>${student.grade}</td>
            <td>${student.section}</td>
            <td>${money(student.discountedTuition)}</td>
            <td>${money(student.paid)}</td>
            <td>${money(student.balance)}</td>
            <td>${status}</td>
        `;

        table.appendChild(row);

    });


    document.getElementById("countText").textContent =
        "Showing " + filtered.length + " students";

}
document.getElementById("searchStudent")
    .addEventListener("input", filterStudents);

document.getElementById("filterCourse")
    .addEventListener("change", filterStudents);

document.getElementById("filterYear")
    .addEventListener("change", filterStudents);

document.getElementById("filterSection")
    .addEventListener("input", filterStudents);
// UPDATE ADMIN STATS

function updateStats() {

    let totalPayments = 0;
    let permits = 0;

    students.forEach(function(student) {

        totalPayments += Number(student.paid || 0);

        if (student.permit) {
            permits++;
        }

    });


    document.getElementById("totalStudents").textContent =
        students.length;

    document.getElementById("totalPayments").textContent =
        money(totalPayments);

    document.getElementById("permitsCount").textContent =
        permits;


    if (permits > 0) {

        const lastStudent =
            students[students.length - 1];

        document.getElementById("lastPermit").textContent =
            lastStudent.permit;

        document.getElementById("lastPermitDate").textContent =
            "Latest permit";

    } else {

        document.getElementById("lastPermit").textContent =
            "—";

        document.getElementById("lastPermitDate").textContent =
            "No permits yet";

    }

}
// CLEAR STUDENT FORM

function clearStudentForm() {

    document.getElementById("studentID").value = "";
    document.getElementById("studentName").value = "";
    document.getElementById("studentGrade").value = "";
    document.getElementById("studentCourse").value = "";
    document.getElementById("studentSectionAdmin").value = "";

    document.getElementById("tuitionExact").value = "";
    document.getElementById("discountPercent").value = "0";
    document.getElementById("paidExact").value = "0";

    document.getElementById("discountedTuition").textContent =
        "₱0.00";

    document.getElementById("initialBalance").textContent =
        "₱0.00";
}
// ADMIN LOGIN

function adminLogin() {

    const id =
        document.getElementById("adminId").value.trim();

    const password =
        document.getElementById("adminPassword").value;

    const message =
        document.getElementById("adminLoginMessage");


    // DEMO LOGIN
    if (id === "admin" && password === "1234") {

        document.getElementById("loginPage")
            .classList.add("hidden");

        document.getElementById("adminPage")
            .classList.remove("hidden");

        renderStudents();
        updateStats();
        renderPendingPayments();

        message.textContent = "";

    } else {

        message.textContent =
            "Incorrect Admin ID or Password.";

        message.style.color = "red";

    }

}
// STUDENT LOGIN

function studentLogin() {

    const id =
        document.getElementById("studentId").value.trim();

    const name =
        document.getElementById("studentNameLogin")
        .value.trim();

    const year =
        document.getElementById("studentYear").value;

    const course =
        document.getElementById("studentCourseLogin").value;

    const section =
        document.getElementById("studentSection").value.trim();

    const message =
        document.getElementById("studentLoginMessage");


    const student = students.find(function(s) {

        return (
            s.id === id &&
            s.name.toLowerCase() === name.toLowerCase() &&
            s.grade === year &&
            s.course === course &&
            s.section.toLowerCase() === section.toLowerCase()
        );

    });


    if (!student) {

        message.textContent =
            "Student record not found. Please check your information.";

        message.style.color = "red";

        return;
    }


    currentStudent = student;


    document.getElementById("loginPage")
        .classList.add("hidden");

    document.getElementById("studentPage")
        .classList.remove("hidden");


    loadStudentDashboard();

}
// LOAD STUDENT DASHBOARD

function loadStudentDashboard() {

    if (!currentStudent) {
        return;
    }


    document.getElementById("displayStudentName")
        .textContent = currentStudent.name;

    document.getElementById("displayStudentId")
        .textContent = currentStudent.id;

    document.getElementById("displayStudentYear")
        .textContent = currentStudent.grade;

    document.getElementById("displayStudentCourse")
        .textContent = currentStudent.course;

    document.getElementById("displayStudentSection")
        .textContent = currentStudent.section;


    // TUITION

    document.getElementById("studentTuition")
        .textContent = money(currentStudent.tuition);

    document.getElementById("studentDiscount")
        .textContent = currentStudent.discount + "%";

    document.getElementById("studentDiscountedTuition")
        .textContent =
        money(currentStudent.discountedTuition);


    // PAYMENT

    document.getElementById("studentPaid")
        .textContent = money(currentStudent.paid);

    document.getElementById("studentBalance")
        .textContent = money(currentStudent.balance);


    // PAYMENT STATUS

    let status = "No Payment";

    if (currentStudent.balance <= 0) {

        status = "Fully Paid";

    } else if (currentStudent.paid > 0) {

        status = "Partially Paid";

    }


    document.getElementById("paymentStatus")
        .textContent = status;


    // PAYMENT PROGRESS

    let progress = 0;

    if (currentStudent.discountedTuition > 0) {

        progress =
            (currentStudent.paid /
            currentStudent.discountedTuition) * 100;

    }

    progress = Math.min(progress, 100);


    document.getElementById("paymentProgress")
        .style.width = progress + "%";


    // PERMIT

    if (currentStudent.permit) {

        document.getElementById("permitStatus")
            .textContent = "Generated";

        document.getElementById("studentPermit")
            .textContent = currentStudent.permit;

        document.getElementById("permitNote")
            .textContent =
            "Your exam permit is ready.";

    }


    renderPaymentHistory();

}
// RENDER PAYMENT HISTORY

function renderPaymentHistory() {

    const history =
        document.getElementById("paymentHistory");

    history.innerHTML = "";


    if (!currentStudent ||
        currentStudent.payments.length === 0) {

        history.innerHTML = `
            <div>
                <small>No payment records yet.</small>
            </div>
        `;

        return;
    }


    currentStudent.payments.forEach(function(payment) {

        const item = document.createElement("div");

        item.innerHTML = `
            <small>${payment.reference}</small>

            <strong>
                ${money(payment.amount)}
            </strong>

            <small>
                ${payment.method}
            </small>

            <small>
                ${payment.status}
            </small>
        `;

        history.appendChild(item);

    });

}
// SUBMIT PAYMENT

function submitPayment() {

    if (!currentStudent) {
        return;
    }

    const reference =
        document.getElementById("paymentReference")
        .value.trim();

    const amount =
        Number(
            document.getElementById("paymentAmount")
            .value
        );

    const method =
        document.getElementById("paymentMethod")
        .value;

    const message =
        document.getElementById("paymentMessage");


    if (!reference || !amount) {

        message.textContent =
            "Please enter the reference number and amount.";

        message.style.color = "red";

        return;
    }


    if (amount <= 0) {

        message.textContent =
            "Payment amount must be greater than 0.";

        message.style.color = "red";

        return;
    }


    const payment = {

        reference: reference,

        amount: amount,

        method: method,

        status: "Pending Verification"

    };


    currentStudent.payments.push(payment);


    message.textContent =
        "Payment submitted. Waiting for admin verification.";

    message.style.color = "#b07b00";


    document.getElementById("paymentReference")
        .value = "";

    document.getElementById("paymentAmount")
        .value = "";


    renderPaymentHistory();
    renderPendingPayments();
}
// VERIFY PAYMENT

function verifyPayment(studentId, paymentIndex) {

    const student = students.find(function(s) {
        return s.id === studentId;
    });

    if (!student) {
        return;
    }

    const payment = student.payments[paymentIndex];

    if (!payment) {
        return;
    }

    if (payment.status === "Verified") {
        return;
    }


    // VERIFY PAYMENT

    payment.status = "Verified";


    // ADD PAYMENT TO STUDENT'S PAID AMOUNT

    student.paid += Number(payment.amount);


    // RECALCULATE BALANCE

    student.balance =
        Math.max(
            student.discountedTuition - student.paid,
            0
        );


    // GENERATE PERMIT

    if (!student.permit) {

        student.permit =
            "ACLC-" +
            new Date().getFullYear() +
            "-" +
            Math.floor(100000 + Math.random() * 900000);

    }


    // UPDATE DASHBOARD

    renderStudents();
    updateStats();
    renderPendingPayments();

    if (currentStudent &&
        currentStudent.id === student.id) {

        loadStudentDashboard();

    }

}
// RENDER PENDING PAYMENTS

function renderPendingPayments() {

    const box =
        document.getElementById("pendingPayments");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    let found = false;


    students.forEach(function(student) {

        student.payments.forEach(function(payment, index) {

            if (payment.status !== "Verified") {

                found = true;


                const item =
                    document.createElement("div");

                item.className = "payment-item";


                item.innerHTML = `
                    <strong>${student.name}</strong>

                    <small>
                        Student ID: ${student.id}
                    </small>

                    <small>
                        Reference: ${payment.reference}
                    </small>

                    <strong>
                        ${money(payment.amount)}
                    </strong>

                    <small>
                        Method: ${payment.method}
                    </small>

                    <button
                        class="gold-button"
                        onclick="verifyPayment('${student.id}', ${index})">
                        Verify Payment
                    </button>
                `;


                box.appendChild(item);

            }

        });

    });


    if (!found) {

        box.innerHTML = `
            <p>No pending payments.</p>
            
        `;

    }
}// UPDATE PAYMENT VERIFICATION

function updatePaymentVerification() {

    renderPendingPayments();

 }


// LOGOUT

function logout() {

    currentStudent = null;

    document.getElementById("adminPage")
        .classList.add("hidden");

    document.getElementById("studentPage")
        .classList.add("hidden");

    document.getElementById("loginPage")
        .classList.remove("hidden");

}
