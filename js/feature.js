
/* =========================================
   ACeS SYNC - ADMIN FEATURES
   SEARCH + CALENDAR + NOTIFICATIONS
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const DATA_KEY = "acesSyncData_v1";

    /* LOAD DATA */

    function loadData() {
        try {
            const saved = JSON.parse(localStorage.getItem(DATA_KEY));

            return {
                students: saved?.students || [],
                payments: saved?.payments || [],
                permits: saved?.permits || [],
                calendarEvents: saved?.calendarEvents || [],
                announcements: saved?.announcements || [],
                concerns: saved?.concerns || []
            };
        } catch (error) {
            console.error("Unable to load dashboard data:", error);

            return {
                students: [],
                payments: [],
                permits: [],
                calendarEvents: [],
                announcements: [],
                concerns: []
            };
        }
    }

    function saveData(data) {
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
    }

    let data = loadData();

    /* =====================================
       GLOBAL SEARCH
    ===================================== */

    const globalSearch = document.getElementById("globalSearch");

    if (globalSearch) {

        globalSearch.addEventListener("input", function () {

            const keyword = this.value.trim().toLowerCase();

            if (!keyword) {
                return;
            }

            const studentPage = document.getElementById("studentRecords");

            if (!studentPage) {
                return;
            }

            const studentLink = document.querySelector(
                '.sidebar-nav a[data-page="studentRecords"]'
            );

            if (studentLink) {
                studentLink.click();
            }

            const studentSearch = document.getElementById("searchStudent");

            if (studentSearch) {
                studentSearch.value = this.value;
                studentSearch.dispatchEvent(new Event("input", {
                    bubbles: true
                }));
            }

        });

    }

    /* =====================================
       CALENDAR ELEMENTS
    ===================================== */

    const calendarButton = document.getElementById("calendarButton");
    const calendarPanel = document.getElementById("calendarPanel");
    const notificationButton = document.getElementById("notificationButton");
    const notificationPanel = document.getElementById("notificationPanel");

    const monthLabel = document.getElementById("calendarMonth");
    const calendarGrid = document.getElementById("calendarGrid");

    const previousMonth = document.getElementById("previousMonth");
    const nextMonth = document.getElementById("nextMonth");

    const eventForm = document.getElementById("calendarEventForm");
    const eventList = document.getElementById("calendarEvents");

    let currentDate = new Date();

    /* OPEN AND CLOSE PANELS */

    function closePanels() {
        calendarPanel?.classList.add("hidden");
        notificationPanel?.classList.add("hidden");
    }

    calendarButton?.addEventListener("click", function (event) {
        event.stopPropagation();

        const willOpen = calendarPanel?.classList.contains("hidden");

        closePanels();

        if (willOpen) {
            calendarPanel?.classList.remove("hidden");
            renderCalendar();
        }
    });

    notificationButton?.addEventListener("click", function (event) {
        event.stopPropagation();

        const willOpen = notificationPanel?.classList.contains("hidden");

        closePanels();

        if (willOpen) {
            notificationPanel?.classList.remove("hidden");
            renderNotifications();
        }
    });

    calendarPanel?.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    notificationPanel?.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    document.addEventListener("click", closePanels);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closePanels();
        }
    });

    /* =====================================
       MONTHLY CALENDAR
    ===================================== */

    function renderCalendar() {

        if (!monthLabel || !calendarGrid) {
            return;
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        monthLabel.textContent = currentDate.toLocaleDateString(
            "en-PH",
            {
                month: "long",
                year: "numeric"
            }
        );

        calendarGrid.innerHTML = "";

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        dayNames.forEach(function (day) {

            const dayElement = document.createElement("div");

            dayElement.className = "calendar-day";
            dayElement.textContent = day;

            calendarGrid.appendChild(dayElement);

        });

        for (let i = 0; i < firstDay; i++) {

            const empty = document.createElement("div");

            calendarGrid.appendChild(empty);

        }

        for (let day = 1; day <= daysInMonth; day++) {

            const dateElement = document.createElement("button");

            dateElement.type = "button";
            dateElement.className = "calendar-date";
            dateElement.textContent = day;

            const dateString =
                year + "-" +
                String(month + 1).padStart(2, "0") + "-" +
                String(day).padStart(2, "0");

            const today = new Date();

            if (
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day
            ) {
                dateElement.classList.add("today");
            }

            if (
                data.calendarEvents.some(function (item) {
                    return item.date === dateString;
                })
            ) {
                dateElement.classList.add("has-event");
            }

            dateElement.addEventListener("click", function () {

                const eventDate = document.getElementById("eventDate");

                if (eventDate) {
                    eventDate.value = dateString;
                }

            });

            calendarGrid.appendChild(dateElement);

        }

        renderEvents();

    }

    previousMonth?.addEventListener("click", function () {

        currentDate.setMonth(currentDate.getMonth() - 1);

        renderCalendar();

    });

    nextMonth?.addEventListener("click", function () {

        currentDate.setMonth(currentDate.getMonth() + 1);

        renderCalendar();

    });

    /* =====================================
       ADD CALENDAR EVENT
    ===================================== */

    eventForm?.addEventListener("submit", function (event) {

        event.preventDefault();

        const title = document.getElementById("eventTitle")?.value.trim();
        const date = document.getElementById("eventDate")?.value;
        const time = document.getElementById("eventTime")?.value;
        const description = document.getElementById("eventDescription")?.value.trim();

        if (!title || !date) {
            alert("Please enter an event title and date.");
            return;
        }

        const newEvent = {
            id: "EVT-" + Date.now(),
            title: title,
            date: date,
            time: time || "",
            description: description || "",
            createdAt: new Date().toISOString()
        };

        data.calendarEvents.push(newEvent);

        saveData(data);

        eventForm.reset();

        renderCalendar();

        alert("Calendar event added successfully!");

    });

    /* DISPLAY EVENTS */

    function renderEvents() {

        if (!eventList) {
            return;
        }

        eventList.innerHTML = "";

        const events = [...data.calendarEvents].sort(function (a, b) {
            return a.date.localeCompare(b.date);
        });

        if (events.length === 0) {

            eventList.innerHTML =
                '<p class="empty-state">No calendar events yet.</p>';

            return;
        }

        events.forEach(function (item) {

            const card = document.createElement("div");

            card.className = "notification-item";

            const heading = document.createElement("strong");
            heading.textContent = item.title;

            const date = document.createElement("p");
            date.textContent = item.date + (item.time ? " • " + item.time : "");

            const description = document.createElement("p");
            description.textContent = item.description || "No description.";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "white-button";
            deleteButton.textContent = "Delete Event";

            deleteButton.addEventListener("click", function () {

                if (!confirm("Delete this calendar event?")) {
                    return;
                }

                data.calendarEvents = data.calendarEvents.filter(function (event) {
                    return event.id !== item.id;
                });

                saveData(data);

                renderCalendar();

            });

            card.append(heading, date, description, deleteButton);

            eventList.appendChild(card);

        });

    }

    /* =====================================
       NOTIFICATIONS
    ===================================== */

    function renderNotifications() {

        if (!notificationPanel) {
            return;
        }

        const container = document.getElementById("notificationList");

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const pendingPayments = data.payments.filter(function (payment) {
            return String(payment.status).toLowerCase() === "pending";
        });

        const notifications = [];

        if (pendingPayments.length > 0) {

            notifications.push({
                title: "Pending Payments",
                message: pendingPayments.length +
                    " payment(s) need verification."
            });

        }

        if (data.concerns.length > 0) {

            notifications.push({
                title: "Student Concerns",
                message: data.concerns.length +
                    " student concern(s) recorded."
            });

        }

        if (data.announcements.length > 0) {

            notifications.push({
                title: "Announcements",
                message: data.announcements.length +
                    " announcement(s) available."
            });

        }

        if (notifications.length === 0) {

            container.innerHTML =
                '<p class="empty-state">You have no new notifications.</p>';

            updateNotificationCount(0);

            return;
        }

        notifications.forEach(function (item) {

            const card = document.createElement("div");

            card.className = "notification-item";

            const heading = document.createElement("strong");
            heading.textContent = item.title;

            const message = document.createElement("p");
            message.textContent = item.message;

            card.append(heading, message);

            container.appendChild(card);

        });

        updateNotificationCount(notifications.length);

    }

    function updateNotificationCount(count) {

        const badge = document.getElementById("notificationCount");

        if (!badge) {
            return;
        }

        badge.textContent = count;
        badge.classList.toggle("hidden", count === 0);

    }

    renderNotifications();

});
