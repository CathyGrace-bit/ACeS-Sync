
/* =========================================
   ACeS SYNC - ADMIN DASHBOARD
   Student Records, Tuition, Payments,
   Calendar, Notifications and CSV Import
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

let calendarDate = new Date();

// =========================================
// DATA STORAGE
// =========================================

function loadSystemData() {
    try {
        const saved = JSON.parse(localStorage.getItem(DATA_KEY));

        if (saved && typeof saved === "object" && !Array.isArray(saved)) {
            systemData = {
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
        console.error("Error loading system data:", error);
        alert("There was a problem reading saved data. Please check your backup.");
    }
}

function saveSystemData() {
    try {
        localStorage.setItem(DATA_KEY, JSON.stringify(systemData));
        return true;
    } catch (error) {
        console.error("Error saving system data:", error);
        alert("Unable to save data. Your browser storage may be full.");
        return false;
    }
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

function findStudent(studentId) {
    return systemData.students.find(student =>
        getStudentId(student).toLowerCase() ===
        String(studentId).toLowerCase()
    );
}

// =========================================
// STUDENT REGISTRATION
// =========================================

function addStudent() {
    const id = document.getElementById("studentID")?.value.trim();
    const name = document.getElementById("studentName")?.value.trim();
    const grade = document.getElementById("studentGrade")?.value;
    const course = document.getElementById("studentCourse")?.value;
    const section = document.getElementById("studentSectionAdmin")?.value.trim();

    const tuition = Number(document.getElementById("tuitionExact")?.value);
    const discountPercent = Number(
        document.getElementById("discountPercent")?.value || 0
    );
    const paid = Number(document.getElementById("paidExact")?.value || 0);

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

    if (findStudent(id)) {
        alert("This Student ID is already registered.");
        return;
    }

    const discountedTuition =
        tuition - (tuition * discountPercent / 100);

    if (paid > discountedTuition) {
        alert("Initial payment cannot exceed discounted tuition.");
        return;
    }

    const now = new Date().toISOString();

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
        dateRegistered: now
    };

    systemData.students.push(student);

    if (paid > 0) {
        systemData.payments.push({
            id: "PAY-" + Date.now(),
            studentId: id,
            studentName: name,
            amount: paid,
            reference: "INITIAL-" + id,
            method: "Initial Payment",
            status: "Approved",
            date: now
        });
    }

    if (!saveSystemData()) return;

    renderDashboard();
    clearStudentForm();
    renderNotifications();

    alert("Student successfully registered!");
}

function clearStudentForm() {
    [
        "studentID",
        "studentName",
        "studentGrade",
        "studentCourse",
        "studentSectionAdmin",
        "tuitionExact",
        "discountPercent",
        "paidExact"
    ].forEach(id => {
        const field = document.getElementById(id);
        if (field) field.value = "";
    });

    const discountField = document.getElementById("discountPercent");
    const paidField = document.getElementById("paidExact");

    if (discountField) discountField.value = "0";
    if (paidField) paidField.value = "0";

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

    const discountedDisplay = document.getElementById("discountedTuition");
    const balanceDisplay = document.getElementById("initialBalance");

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
        table.innerHTML = filtered.map(student => `
            <tr>
                <td>${escapeHTML(getStudentId(student))}</td>
                <td>${escapeHTML(getStudentName(student))}</td>
                <td>${escapeHTML(student.course)}</td>
                <td>${escapeHTML(student.grade)}</td>
                <td>${escapeHTML(student.section)}</td>
                <td>${money(getDiscountedTuition(student))}</td>
                <td>${money(getStudentPaid(student))}</td>
                <td>${money(getStudentBalance(student))}</td>
                <td>${escapeHTML(getPaymentStatus(student))}</td>
            </tr>
        `).join("");
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
    const approvedPayments = systemData.payments
        .filter(payment =>
            String(payment.status).toLowerCase() === "approved"
        )
        .reduce((total, payment) =>
            total + (Number(payment.amount) || 0), 0
        );

    const studentCount = document.getElementById("totalStudents");
    const totalPayments = document.getElementById("totalPayments");
    const permitsCount = document.getElementById("permitsCount");

    if (studentCount) {
        studentCount.textContent = systemData.students.length;
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

    const pending = systemData.payments.filter(payment =>
        String(payment.status).toLowerCase() === "pending"
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

    if (!payment || String(payment.status).toLowerCase() !== "pending") {
        return;
    }

    const student = findStudent(payment.studentId);

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

    if (!saveSystemData()) return;

    renderDashboard();
    renderNotifications();

    alert("Payment successfully approved.");
}

function rejectPayment(paymentId) {
    const payment = systemData.payments.find(
        item => String(item.id) === String(paymentId)
    );

    if (!payment || String(payment.status).toLowerCase() !== "pending") {
        return;
    }

    if (!confirm("Are you sure you want to reject this payment?")) return;

    payment.status = "Rejected";
    payment.verifiedAt = new Date().toISOString();

    if (!saveSystemData()) return;

    renderDashboard();
    renderNotifications();

    alert("Payment has been rejected.");
}

// =========================================
// CALENDAR - OPEN AND CLOSE
// =========================================

function openCalendar() {
    const panel = document.getElementById("calendarPanel");
    const notificationPanel = document.getElementById("notificationPanel");

    if (!panel) {
        console.error("Calendar panel not found. Check calendarPanel in HTML.");
        return;
    }

    notificationPanel?.classList.add("hidden");
    panel.classList.toggle("hidden");

    if (!panel.classList.contains("hidden")) {
        calendarDate = new Date();
        renderCalendar();
        renderUpcomingEvents();
    }
}

function closeCalendar() {
    document.getElementById("calendarPanel")?.classList.add("hidden");
}

// =========================================
// CALENDAR - RENDER MONTH
// =========================================

function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    const monthLabel = document.getElementById("calendarMonth");

    if (!grid || !monthLabel) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    monthLabel.textContent = calendarDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
    });

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = weekdays.map(day =>
        `<div class="calendar-weekday">${day}</div>`
    ).join("");

    for (let blank = 0; blank < firstDay; blank++) {
        html += `<div class="calendar-day empty-day"></div>`;
    }

    const today = new Date();
    const todayString = formatDateForInput(today);

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = formatDateForInput(date);

        const dayEvents = systemData.calendarEvents.filter(event =>
            event.date === dateString
        );

        const isToday = dateString === todayString;

        html += `
            <button type="button"
                    class="calendar-day ${isToday ? "today" : ""} ${dayEvents.length ? "has-event" : ""}"
                    data-calendar-date="${dateString}"
                    title="${dayEvents.length} event(s)">
                <span>${day}</span>
                ${dayEvents.length
                    ? `<small>${dayEvents.length} event${dayEvents.length > 1 ? "s" : ""}</small>`
                    : ""}
            </button>
        `;
    }

    grid.innerHTML = html;
}

// =========================================
// CALENDAR - DATE FORMAT
// =========================================

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatEventDate(dateString) {
    if (!dateString) return "Date not set";

    const parts = dateString.split("-").map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    return date.toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}

// =========================================
// CALENDAR - MONTH NAVIGATION
// =========================================

function changeCalendarMonth(amount) {
    calendarDate.setMonth(calendarDate.getMonth() + amount);
    renderCalendar();
    renderUpcomingEvents();
}

// =========================================
// CALENDAR - SELECT DATE
// =========================================

function selectCalendarDate(dateString) {
    const dateInput = document.getElementById("eventDate");

    if (dateInput) {
        dateInput.value = dateString;
    }

    renderUpcomingEvents(dateString);
}

// =========================================
// CALENDAR - ADD EVENT
// =========================================

function addCalendarEvent() {
    const titleInput = document.getElementById("eventTitle");
    const dateInput = document.getElementById("eventDate");
    const timeInput = document.getElementById("eventTime");
    const descriptionInput = document.getElementById("eventDescription");

    if (!titleInput || !dateInput || !timeInput || !descriptionInput) {
        alert("Calendar form fields are missing. Please check your HTML.");
        return;
    }

    const title = titleInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    const description = descriptionInput.value.trim();

    if (!title || !date || !time) {
        alert("Please enter the event title, date, and time.");
        return;
    }

    const newEvent = {
        id: "EVENT-" + Date.now(),
        title,
        date,
        time,
        description,
        createdAt: new Date().toISOString()
    };

    systemData.calendarEvents.push(newEvent);

    if (!saveSystemData()) {
        systemData.calendarEvents.pop();
        return;
    }

    // Show the month containing the newly added event.
    const dateParts = date.split("-").map(Number);
    calendarDate = new Date(dateParts[0], dateParts[1] - 1, 1);

    titleInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    descriptionInput.value = "";

    renderCalendar();
    renderUpcomingEvents();
    renderNotifications();

    alert("School event successfully added!");
}

// =========================================
// CALENDAR - UPCOMING EVENTS
// =========================================

function renderUpcomingEvents(selectedDate = "") {
    const container = document.getElementById("upcomingEvents");
    if (!container) return;

    let events = [...systemData.calendarEvents];

    if (selectedDate) {
        events = events.filter(event => event.date === selectedDate);
    } else {
        const today = formatDateForInput(new Date());

        events = events.filter(event => event.date >= today);
    }

    events.sort((a, b) => {
        const dateA = `${a.date || ""}T${a.time || "00:00"}`;
        const dateB = `${b.date || ""}T${b.time || "00:00"}`;

        return dateA.localeCompare(dateB);
    });

    if (events.length === 0) {
        container.innerHTML = `
            <p class="empty-state">
                ${selectedDate
                    ? "No events scheduled for this date."
                    : "No upcoming events."}
            </p>
        `;
        return;
    }

    container.innerHTML = events.map(event => `
        <article class="calendar-event-item">
            <div>
                <strong>${escapeHTML(event.title)}</strong>
                <p>${formatEventDate(event.date)} • ${escapeHTML(event.time || "Time not set")}</p>
                ${event.description
                    ? `<p>${escapeHTML(event.description)}</p>`
                    : ""}
            </div>

            <button type="button"
                    class="white-button"
                    data-delete-event="${escapeHTML(event.id)}">
                Delete
            </button>
        </article>
    `).join("");
}

// =========================================
// CALENDAR - DELETE EVENT
// =========================================

function deleteCalendarEvent(eventId) {
    const index = systemData.calendarEvents.findIndex(event =>
        String(event.id) === String(eventId)
    );

    if (index === -1) return;

    const event = systemData.calendarEvents[index];

    if (!confirm(`Delete "${event.title}" from the calendar?`)) return;

    systemData.calendarEvents.splice(index, 1);

    if (!saveSystemData()) return;

    renderCalendar();
    renderUpcomingEvents();
    renderNotifications();
}

// =========================================
// NOTIFICATIONS
// =========================================

function getDashboardNotifications() {
    const notifications = [];

    const pendingPayments = systemData.payments.filter(payment =>
        String(payment.status).toLowerCase() === "pending"
    );

    pendingPayments.forEach(payment => {
        notifications.push({
            type: "Payment",
            title: "Pending payment verification",
            message: `${payment.studentName || payment.studentId || "Student"} submitted ${money(payment.amount)}.`,
            page: "paymentVerification"
        });
    });

    systemData.concerns.forEach(concern => {
        const status = String(concern.status || "Pending").toLowerCase();

        if (status !== "resolved" && status !== "replied") {
            notifications.push({
                type: "Concern",
                title: "Student concern",
                message: concern.studentName || concern.studentId || "A student submitted a concern.",
                page: "studentConcerns"
            });
        }
    });

    const today = formatDateForInput(new Date());

    systemData.calendarEvents
        .filter(event => event.date >= today)
        .forEach(event => {
            notifications.push({
                type: "Calendar",
                title: "Upcoming school event",
                message: `${event.title} — ${formatEventDate(event.date)}`,
                page: "calendar"
            });
        });

    return notifications;
}

function renderNotifications() {
    const container = document.getElementById("notificationList");
    const count = document.getElementById("notificationCount");

    const notifications = getDashboardNotifications();

    if (count) {
        count.textContent = notifications.length;
        count.classList.toggle("hidden", notifications.length === 0);
    }

    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = `
            <p class="empty-state">No notifications yet.</p>
        `;
        return;
    }

    container.innerHTML = notifications.map((notification, index) => `
        <button type="button"
                class="notification-item"
                data-notification-page="${escapeHTML(notification.page)}">
            <small>${escapeHTML(notification.type)}</small>
            <strong>${escapeHTML(notification.title)}</strong>
            <p>${escapeHTML(notification.message)}</p>
        </button>
    `).join("");
}

function openNotifications() {
    const panel = document.getElementById("notificationPanel");
    const calendarPanel = document.getElementById("calendarPanel");

    if (!panel) return;

    calendarPanel?.classList.add("hidden");
    renderNotifications();
    panel.classList.toggle("hidden");
}

// =========================================
// GLOBAL SEARCH
// =========================================

function handleGlobalSearch() {
    const input = document.getElementById("globalSearch");
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    if (!query) return;

    const student = systemData.students.find(item =>
        getStudentId(item).toLowerCase().includes(query) ||
        String(getStudentName(item)).toLowerCase().includes(query)
    );

    const payment = systemData.payments.find(item =>
        String(item.studentId || "").toLowerCase().includes(query) ||
        String(item.studentName || "").toLowerCase().includes(query) ||
        String(item.reference || "").toLowerCase().includes(query)
    );

    const permit = systemData.permits.find(item =>
        String(item.studentId || "").toLowerCase().includes(query) ||
        String(item.studentName || "").toLowerCase().includes(query) ||
        String(item.permitNumber || item.id || "").toLowerCase().includes(query)
    );

    let targetPage = "";

    if (student) {
        targetPage = "studentRecords";

        const studentSearch = document.getElementById("searchStudent");
        if (studentSearch) {
            studentSearch.value = query;
            renderStudentTable();
        }
    } else if (payment) {
        targetPage = "paymentVerification";
    } else if (permit) {
        targetPage = "acesPermits";

        const permitSearch = document.getElementById("searchPermit");
        if (permitSearch) permitSearch.value = query;
    }

    if (!targetPage) {
        alert("No matching student, payment, or permit was found.");
        return;
    }

    const navigationLink = document.querySelector(
        `.sidebar-nav [data-page="${targetPage}"]`
    );

    navigationLink?.click();

    document.getElementById("calendarPanel")?.classList.add("hidden");
    document.getElementById("notificationPanel")?.classList.add("hidden");
}

// =========================================
// CSV HELPERS
// =========================================

function parseCSVLine(line) {
    const values = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const character = line[i];

        if (character === '"') {
            if (insideQuotes && line[i + 1] === '"') {
                value += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (character === "," && !insideQuotes) {
            values.push(value.trim());
            value = "";
        } else {
            value += character;
        }
    }

    values.push(value.trim());
    return values;
}

function normalizeHeader(value) {
    return String(value || "")
        .replace(/^\uFEFF/, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

// =========================================
// CSV STUDENT IMPORT
// =========================================

async function importStudentCSV() {
    const fileInput = document.getElementById("studentCsvFile");
    const status = document.getElementById("importStatus");
    const file = fileInput?.files?.[0];

    if (!file) {
        alert("Please select a CSV file first.");
        return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
        alert("Please select a CSV file.");
        return;
    }

    try {
        const fileText = await file.text();

        const lines = fileText
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .split("\n")
            .filter(line => line.trim() !== "");

        if (lines.length < 2) {
            alert("The CSV file has no student records.");
            return;
        }

        const headers = parseCSVLine(lines[0]).map(normalizeHeader);

        const findColumn = (...names) =>
            headers.findIndex(header => names.includes(header));

        const columns = {
            id: findColumn("studentid", "id"),
            name: findColumn("fullname", "studentname", "name"),
            course: findColumn("course"),
            grade: findColumn("yeargrade", "year", "grade", "yearlevel"),
            section: findColumn("section"),
            tuition: findColumn("originaltuition", "tuition", "tuitionfee"),
            discount: findColumn("discount", "discountpercent"),
            paid: findColumn("amountpaid", "paid", "initialpayment")
        };

        if (
            columns.id === -1 ||
            columns.name === -1 ||
            columns.course === -1 ||
            columns.grade === -1 ||
            columns.section === -1 ||
            columns.tuition === -1
        ) {
            alert(
                "CSV headers are incomplete. Required columns: Student ID, Full Name, Course, Year / Grade, Section, Original Tuition."
            );
            return;
        }

        let added = 0;
        let skipped = 0;

        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]);

            const value = index =>
                index >= 0 ? String(row[index] || "").trim() : "";

            const id = value(columns.id);
            const name = value(columns.name);
            const course = value(columns.course);
            const grade = value(columns.grade);
            const section = value(columns.section);

            const tuition = Number(value(columns.tuition));
            const discountPercent = Number(value(columns.discount) || 0);
            const paid = Number(value(columns.paid) || 0);

            if (
                !id || !name || !course || !grade || !section ||
                !Number.isFinite(tuition) || tuition <= 0 ||
                !Number.isFinite(discountPercent) ||
                discountPercent < 0 || discountPercent > 100 ||
                !Number.isFinite(paid) || paid < 0
            ) {
                skipped++;
                continue;
            }

            if (findStudent(id)) {
                skipped++;
                continue;
            }

            const discountedTuition =
                tuition - (tuition * discountPercent / 100);

            if (paid > discountedTuition) {
                skipped++;
                continue;
            }

            const now = new Date().toISOString();

            systemData.students.push({
                id,
                name,
                course,
                grade,
                section,
                tuition,
                discountPercent,
                discountedTuition,
                paid,
                balance: discountedTuition - paid,
                status: paid >= discountedTuition ? "Fully Paid" :
                    paid > 0 ? "Partial" : "No Payment",
                dateRegistered: now
            });

            if (paid > 0) {
                systemData.payments.push({
                    id: "PAY-" + Date.now() + "-" + i,
                    studentId: id,
                    studentName: name,
                    amount: paid,
                    reference: "IMPORT-" + id,
                    method: "Imported Initial Payment",
                    status: "Approved",
                    date: now
                });
            }

            added++;
        }

        if (!saveSystemData()) return;

        renderDashboard();
        renderNotifications();

        if (status) {
            status.textContent =
                `Import complete: ${added} added, ${skipped} skipped (duplicate or invalid records).`;
        }

        alert(`CSV import complete!\n\nAdded: ${added}\nSkipped: ${skipped}`);

        fileInput.value = "";

    } catch (error) {
        console.error("CSV import error:", error);
        alert("Unable to read this CSV file.");
    }
}

// =========================================
// CSV REPORT DOWNLOAD
// =========================================

function downloadCSVReport() {
    const students = systemData.students;
    const statusDisplay = document.getElementById("csvReportStatus");

    if (students.length === 0) {
        if (statusDisplay) {
            statusDisplay.textContent = "No student records available to export.";
        }

        alert("No student records available to export.");
        return;
    }

    const headers = [
        "Student ID",
        "Full Name",
        "Course",
        "Year / Grade",
        "Section",
        "Original Tuition",
        "Discount (%)",
        "Discounted Tuition",
        "Amount Paid",
        "Remaining Balance",
        "Payment Status",
        "Date Registered"
    ];

    function escapeCSV(value) {
        let text = String(value ?? "");

        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    const rows = students.map(student => [
        getStudentId(student),
        getStudentName(student),
        student.course || "",
        student.grade || "",
        student.section || "",
        Number(student.tuition) || 0,
        Number(student.discountPercent) || 0,
        getDiscountedTuition(student),
        getStudentPaid(student),
        getStudentBalance(student),
        getPaymentStatus(student),
        student.dateRegistered
            ? new Date(student.dateRegistered).toLocaleString("en-PH")
            : ""
    ]);

    const csvContent = [
        headers,
        ...rows
    ].map(row => row.map(escapeCSV).join(",")).join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const downloadURL = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);

    downloadLink.href = downloadURL;
    downloadLink.download = `ACeS-Sync-Student-Report-${date}.csv`;

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => URL.revokeObjectURL(downloadURL), 1000);

    if (statusDisplay) {
        statusDisplay.textContent =
            `Report prepared: ${students.length} student record(s).`;
    }
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
// RENDER DASHBOARD
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
        console.error("Session reading error:", error);
        localStorage.removeItem(SESSION_KEY);
    }

    if (!session || session.role !== "admin") {
        window.location.href = "homepage.html";
        return;
    }

    loadSystemData();

    renderDashboard();
    updateTuitionPreview();
    renderCalendar();
    renderUpcomingEvents();
    renderNotifications();

    // CSV EXPORT
    document.getElementById("downloadCsvBtn")
        ?.addEventListener("click", downloadCSVReport);

    // CSV IMPORT
    document.getElementById("importCsvBtn")
        ?.addEventListener("click", importStudentCSV);

    // TUITION PREVIEW
    ["tuitionExact", "discountPercent", "paidExact"].forEach(id => {
        document.getElementById(id)?.addEventListener(
            "input",
            updateTuitionPreview
        );
    });

    // STUDENT SEARCH AND FILTERS
    ["searchStudent", "filterCourse", "filterYear", "filterSection"]
        .forEach(id => {
            const field = document.getElementById(id);
            field?.addEventListener("input", renderStudentTable);
            field?.addEventListener("change", renderStudentTable);
        });

    // CALENDAR BUTTON
    document.getElementById("calendarToggle")
        ?.addEventListener("click", openCalendar);

    // CALENDAR MONTH BUTTONS
    document.getElementById("previousMonth")
        ?.addEventListener("click", () => changeCalendarMonth(-1));

    document.getElementById("nextMonth")
        ?.addEventListener("click", () => changeCalendarMonth(1));

    // ADD EVENT BUTTON
    document.getElementById("addEventBtn")
        ?.addEventListener("click", addCalendarEvent);

    // CALENDAR DATE CLICK
    document.getElementById("calendarGrid")
        ?.addEventListener("click", event => {
            const dateButton = event.target.closest("[data-calendar-date]");
            if (!dateButton) return;

            selectCalendarDate(dateButton.dataset.calendarDate);
        });

    // DELETE CALENDAR EVENT
    document.getElementById("upcomingEvents")
        ?.addEventListener("click", event => {
            const deleteButton = event.target.closest("[data-delete-event]");
            if (!deleteButton) return;

            deleteCalendarEvent(deleteButton.dataset.deleteEvent);
        });

    // NOTIFICATION BUTTON
    document.getElementById("notificationToggle")
        ?.addEventListener("click", openNotifications);

    // CLOSE CALENDAR / NOTIFICATION PANELS
    document.querySelectorAll("[data-close-panel]").forEach(button => {
        button.addEventListener("click", () => {
            document.getElementById("calendarPanel")?.classList.add("hidden");
            document.getElementById("notificationPanel")?.classList.add("hidden");
        });
    });

    // NOTIFICATION ITEM CLICK
    document.getElementById("notificationList")
        ?.addEventListener("click", event => {
            const item = event.target.closest("[data-notification-page]");
            if (!item) return;

            const page = item.dataset.notificationPage;

            document.getElementById("notificationPanel")
                ?.classList.add("hidden");

            if (page === "calendar") {
                openCalendar();
                return;
            }

            document.querySelector(
                `.sidebar-nav [data-page="${page}"]`
            )?.click();
        });

    // GLOBAL SEARCH - PRESS ENTER
    document.getElementById("globalSearch")
        ?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                handleGlobalSearch();
            }
        });

    // GLOBAL SEARCH - SEARCH ICON / BUTTON NOT REQUIRED
    document.getElementById("globalSearch")
        ?.addEventListener("change", handleGlobalSearch);
});
