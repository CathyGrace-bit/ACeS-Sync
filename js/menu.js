
/* =========================================
   ACeS SYNC - ADMIN CONTROL CENTER
   PROFILE | SETTINGS | THEME | BACKUP
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    const topbar = document.querySelector(".topbar");

    if (!topbar) {
        console.error("Admin topbar not found.");
        return;
    }

    const PREF_KEY = "acesSyncMenuPreferences_v1";
    const ACTIVITY_KEY = "acesSyncActivity_v1";
    const SESSION_KEY = "acesSyncSession_v1";
    const DATA_KEY = "acesSyncData_v1";

    const DEFAULTS = {
        nickname: "",
        theme: "light",
        notifications: {
            payments: true,
            concerns: true,
            announcements: true,
            calendar: true
        },
        defaultPage: "dashboardSection",
        fontSize: "normal",
        reducedMotion: false
    };

    /* =====================================
       SAFE STORAGE
    ===================================== */

    function readJSON(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch (error) {
            console.error("Could not read storage:", key, error);
            return fallback;
        }
    }

    function loadPreferences() {
        const saved = readJSON(PREF_KEY, {});

        return {
            ...DEFAULTS,
            ...saved,
            notifications: {
                ...DEFAULTS.notifications,
                ...(saved.notifications || {})
            }
        };
    }

    let preferences = loadPreferences();

    function savePreferences() {
        try {
            localStorage.setItem(
                PREF_KEY,
                JSON.stringify(preferences)
            );
            return true;
        } catch (error) {
            alert("Unable to save your preferences.");
            console.error(error);
            return false;
        }
    }

    function getSession() {
        return readJSON(SESSION_KEY, {});
    }

    function getAdminName() {
        const session = getSession();

        return (
            session.name ||
            session.fullName ||
            session.username ||
            session.email ||
            "Administrator"
        );
    }

    function getDisplayName() {
        return preferences.nickname.trim() || getAdminName();
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    /* =====================================
       ACTIVITY LOG
    ===================================== */

    function recordActivity(action) {
        const activities = readJSON(ACTIVITY_KEY, []);

        activities.unshift({
            action: action,
            date: new Date().toLocaleString()
        });

        try {
            localStorage.setItem(
                ACTIVITY_KEY,
                JSON.stringify(activities.slice(0, 100))
            );
        } catch (error) {
            console.error("Could not save activity log:", error);
        }
    }

    /* =====================================
       THEME AND ACCESSIBILITY
    ===================================== */

    function applyTheme() {
        let activeTheme = preferences.theme;

        if (activeTheme === "system") {
            activeTheme = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches ? "dark" : "light";
        }

        document.documentElement.dataset.theme = activeTheme;
        document.body.dataset.theme = activeTheme;

        document.documentElement.dataset.fontSize =
            preferences.fontSize;

        document.body.dataset.reducedMotion =
            String(preferences.reducedMotion);
    }

    applyTheme();

    if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: dark)")
            .addEventListener?.("change", function () {
                if (preferences.theme === "system") {
                    applyTheme();
                }
            });
    }

    /* =====================================
       HAMBURGER BUTTON
    ===================================== */

    let menuButton = document.querySelector(".menu-toggle");

    if (!menuButton) {
        menuButton = document.createElement("button");
        menuButton.className = "menu-toggle";
        menuButton.type = "button";
        menuButton.textContent = "☰";
        menuButton.setAttribute("aria-label", "Open admin menu");
    }

    const topbarLeft = topbar.querySelector(".topbar-left");

    if (topbarLeft && !topbarLeft.contains(menuButton)) {
        topbarLeft.prepend(menuButton);
    } else if (!topbarLeft && !topbar.contains(menuButton)) {
        topbar.prepend(menuButton);
    }

    /* =====================================
       ADMIN TOOLS PANEL
    ===================================== */

    let menuOverlay = document.querySelector(
        ".admin-tools-overlay"
    );

    if (!menuOverlay) {
        menuOverlay = document.createElement("div");
        menuOverlay.className = "admin-tools-overlay";
        document.body.appendChild(menuOverlay);
    }

    let menuPanel = document.querySelector(
        ".admin-tools-panel"
    );

    if (!menuPanel) {
        menuPanel = document.createElement("aside");
        menuPanel.className = "admin-tools-panel";

        menuPanel.innerHTML = `
            <div class="admin-tools-header">
                <div>
                    <span class="admin-tools-label">ACES SYNC</span>
                    <h2>Admin Control Center</h2>
                    <small>Account and system preferences</small>
                </div>
                <button type="button" class="admin-tools-close"
                    aria-label="Close menu">&times;</button>
            </div>

            <div class="admin-tools-profile">
                <div class="admin-tools-avatar">A</div>
                <div>
                    <strong class="admin-tools-name"></strong>
                    <small>System Administrator</small>
                </div>
            </div>

            <div class="admin-tools-section">
                <p class="admin-tools-heading">MY ACCOUNT</p>
                <button type="button" data-menu-action="profile">
                    <span>👤</span>
                    <span class="admin-menu-copy">
                        <strong>Profile</strong>
                        <small>View account information</small>
                    </span>
                </button>
                <button type="button" data-menu-action="nickname">
                    <span>✏️</span>
                    <span class="admin-menu-copy">
                        <strong>Preferred Nickname</strong>
                        <small>Change your display name</small>
                    </span>
                </button>
            </div>

            <div class="admin-tools-section">
                <p class="admin-tools-heading">PERSONALIZATION</p>
                <button type="button" data-menu-action="appearance">
                    <span>🎨</span>
                    <span class="admin-menu-copy">
                        <strong>Appearance</strong>
                        <small>Light, dark or system theme</small>
                    </span>
                    <small class="admin-theme-label"></small>
                </button>
                <button type="button" data-menu-action="notifications">
                    <span>🔔</span>
                    <span class="admin-menu-copy">
                        <strong>Notifications</strong>
                        <small>Manage individual alerts</small>
                    </span>
                </button>
                <button type="button" data-menu-action="dashboard">
                    <span>▦</span>
                    <span class="admin-menu-copy">
                        <strong>Dashboard Preferences</strong>
                        <small>Choose your starting page</small>
                    </span>
                </button>
                <button type="button" data-menu-action="accessibility">
                    <span>♿</span>
                    <span class="admin-menu-copy">
                        <strong>Accessibility</strong>
                        <small>Text size and motion settings</small>
                    </span>
                </button>
            </div>

            <div class="admin-tools-section">
                <p class="admin-tools-heading">SECURITY & SYSTEM</p>
                <button type="button" data-menu-action="security">
                    <span>🔐</span>
                    <span class="admin-menu-copy">
                        <strong>Security & Privacy</strong>
                        <small>Review account session details</small>
                    </span>
                </button>
                <button type="button" data-menu-action="activity">
                    <span>📋</span>
                    <span class="admin-menu-copy">
                        <strong>Activity Log</strong>
                        <small>Review recorded admin actions</small>
                    </span>
                </button>
                <button type="button" data-menu-action="backup">
                    <span>💾</span>
                    <span class="admin-menu-copy">
                        <strong>Backup & Restore</strong>
                        <small>Protect your system data</small>
                    </span>
                </button>
                <button type="button" data-menu-action="help">
                    <span>❔</span>
                    <span class="admin-menu-copy">
                        <strong>Help & About</strong>
                        <small>System information and guidance</small>
                    </span>
                </button>
            </div>

            <div class="admin-tools-footer">
                <button type="button" class="admin-tools-logout"
                    data-menu-action="logout">
                    ↪ &nbsp; Logout
                </button>
            </div>
        `;

        document.body.appendChild(menuPanel);
    }

    /* =====================================
       DIALOG
    ===================================== */

    let dialogOverlay = document.querySelector(
        ".admin-tools-dialog-overlay"
    );

    if (!dialogOverlay) {
        dialogOverlay = document.createElement("div");
        dialogOverlay.className = "admin-tools-dialog-overlay";

        dialogOverlay.innerHTML = `
            <div class="admin-tools-dialog" role="dialog"
                aria-modal="true">
                <button type="button" class="admin-dialog-close"
                    aria-label="Close dialog">&times;</button>
                <div class="admin-dialog-content"></div>
            </div>
        `;

        document.body.appendChild(dialogOverlay);
    }

    const dialogContent = dialogOverlay.querySelector(
        ".admin-dialog-content"
    );

    function openDialog(title, content) {
        dialogContent.innerHTML = `
            <h2>${escapeHTML(title)}</h2>
            ${content}
        `;

        dialogOverlay.classList.add("active");
    }

    function closeDialog() {
        dialogOverlay.classList.remove("active");
    }

    /* =====================================
       UPDATE MENU DISPLAY
    ===================================== */

    function updateMenuInformation() {
        const displayName = getDisplayName();

        menuPanel.querySelector(
            ".admin-tools-name"
        ).textContent = displayName;

        menuPanel.querySelector(
            ".admin-tools-avatar"
        ).textContent =
            displayName.charAt(0).toUpperCase() || "A";

        menuPanel.querySelector(
            ".admin-theme-label"
        ).textContent =
            preferences.theme.charAt(0).toUpperCase() +
            preferences.theme.slice(1);
    }

    updateMenuInformation();

    /* =====================================
       OPEN / CLOSE MENU
    ===================================== */

    function openMenu() {
        updateMenuInformation();
        menuPanel.classList.add("active");
        menuOverlay.classList.add("active");
        menuButton.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
        menuPanel.classList.remove("active");
        menuOverlay.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");
    }

    menuButton.addEventListener("click", function () {
        menuPanel.classList.contains("active")
            ? closeMenu()
            : openMenu();
    });

    menuPanel.querySelector(
        ".admin-tools-close"
    ).addEventListener("click", closeMenu);

    menuOverlay.addEventListener("click", closeMenu);

    dialogOverlay.querySelector(
        ".admin-dialog-close"
    ).addEventListener("click", closeDialog);

    dialogOverlay.addEventListener("click", function (event) {
        if (event.target === dialogOverlay) closeDialog();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
            closeDialog();
        }
    });

    /* =====================================
       PROFILE
    ===================================== */

    function showProfile() {
        const session = getSession();

        openDialog("Admin Profile", `
            <div class="admin-profile-details">
                <p><strong>Account Name</strong><br>
                    ${escapeHTML(getAdminName())}</p>
                <p><strong>Preferred Nickname</strong><br>
                    ${escapeHTML(preferences.nickname || "Not set")}</p>
                <p><strong>Email Address</strong><br>
                    ${escapeHTML(session.email || "Not available")}</p>
                <p><strong>Account Role</strong><br>
                    ${escapeHTML(session.role || "Administrator")}</p>
            </div>
            <p class="admin-dialog-note">
                Information shown here comes from the current
                admin session and saved preferences.
            </p>
        `);
    }

    /* =====================================
       PREFERRED NICKNAME
    ===================================== */

    function editNickname() {
        openDialog("Preferred Nickname", `
            <p class="admin-dialog-note">
                Choose the name displayed in your Admin Menu.
                Leave it blank to use your account name.
            </p>
            <form id="nicknameForm">
                <label for="nicknameInput">Display name</label>
                <input id="nicknameInput" type="text"
                    maxlength="40"
                    placeholder="Enter preferred nickname"
                    value="${escapeHTML(preferences.nickname)}">
                <button class="admin-dialog-save" type="submit">
                    Save Nickname
                </button>
            </form>
        `);

        document.getElementById("nicknameForm")
            .addEventListener("submit", function (event) {
                event.preventDefault();

                preferences.nickname = document.getElementById(
                    "nicknameInput"
                ).value.trim();

                if (savePreferences()) {
                    updateMenuInformation();
                    recordActivity("Updated preferred nickname");
                    closeDialog();
                }
            });
    }

    /* =====================================
       APPEARANCE
    ===================================== */

    function showAppearance() {
        openDialog("Appearance Settings", `
            <p class="admin-dialog-note">
                Choose how ACeS Sync appears on this device.
            </p>

            <div class="admin-choice-list">
                <label>
                    <input type="radio" name="themeChoice"
                        value="light"
                        ${preferences.theme === "light" ? "checked" : ""}>
                    <span><strong>Light Mode</strong><small>Bright interface</small></span>
                </label>

                <label>
                    <input type="radio" name="themeChoice"
                        value="dark"
                        ${preferences.theme === "dark" ? "checked" : ""}>
                    <span><strong>Dark Mode</strong><small>Dark interface</small></span>
                </label>

                <label>
                    <input type="radio" name="themeChoice"
                        value="system"
                        ${preferences.theme === "system" ? "checked" : ""}>
                    <span><strong>System Default</strong><small>Follow your device appearance</small></span>
                </label>
            </div>

            <button type="button" class="admin-dialog-save"
                data-dialog-action="save-theme">
                Save Appearance
            </button>
        `);
    }

    function saveThemeChoice() {
        const selected = dialogContent.querySelector(
            'input[name="themeChoice"]:checked'
        );

        if (!selected) return;

        preferences.theme = selected.value;

        if (savePreferences()) {
            applyTheme();
            updateMenuInformation();
            recordActivity("Changed appearance to " + selected.value);
            closeDialog();
        }
    }

    /* =====================================
       NOTIFICATION PREFERENCES
    ===================================== */

    function showNotifications() {
        const items = [
            ["payments", "Payment submissions", "New payments awaiting verification"],
            ["concerns", "Student concerns", "New messages and student requests"],
            ["announcements", "Announcements", "School announcement updates"],
            ["calendar", "Calendar reminders", "Upcoming events and deadlines"]
        ];

        const rows = items.map(function (item) {
            return `
                <div class="admin-setting-row">
                    <div>
                        <strong>${item[1]}</strong>
                        <small>${item[2]}</small>
                    </div>
                    <label class="admin-switch">
                        <input type="checkbox"
                            data-notification="${item[0]}"
                            ${preferences.notifications[item[0]] ? "checked" : ""}>
                        <span class="admin-switch-track"></span>
                    </label>
                </div>
            `;
        }).join("");

        openDialog("Notification Preferences", `
            <p class="admin-dialog-note">
                Turn each notification category on or off.
                These settings control your preferences; the
                corresponding alert features must also be connected.
            </p>
            <div class="admin-notification-settings">
                ${rows}
            </div>
        `);
    }

    /* =====================================
       DASHBOARD PREFERENCES
    ===================================== */

    function showDashboardPreferences() {
        const pages = [
            ["dashboardSection", "Admin Dashboard"],
            ["studentRecords", "Student Records"],
            ["paymentVerification", "Payment Verification"],
            ["acesPermits", "Exam Permits"],
            ["announcements", "Announcements"],
            ["quickReports", "Reports"]
        ];

        const options = pages.map(function (page) {
            return `
                <option value="${page[0]}"
                    ${preferences.defaultPage === page[0] ? "selected" : ""}>
                    ${page[1]}
                </option>
            `;
        }).join("");

        openDialog("Dashboard Preferences", `
            <p class="admin-dialog-note">
                Select which page should open first when you
                enter the admin dashboard.
            </p>
            <label for="defaultPageSelect">Default landing page</label>
            <select id="defaultPageSelect">${options}</select>
            <button type="button" class="admin-dialog-save"
                data-dialog-action="save-dashboard">
                Save Preference
            </button>
        `);
    }

    /* =====================================
       ACCESSIBILITY
    ===================================== */

    function showAccessibility() {
        openDialog("Accessibility", `
            <p class="admin-dialog-note">
                Adjust the interface for comfortable viewing.
            </p>

            <label for="fontSizeSelect">Text size</label>
            <select id="fontSizeSelect">
                <option value="normal"
                    ${preferences.fontSize === "normal" ? "selected" : ""}>
                    Normal
                </option>
                <option value="large"
                    ${preferences.fontSize === "large" ? "selected" : ""}>
                    Large
                </option>
                <option value="larger"
                    ${preferences.fontSize === "larger" ? "selected" : ""}>
                    Extra Large
                </option>
            </select>

            <div class="admin-setting-row">
                <div>
                    <strong>Reduce animations</strong>
                    <small>Limit interface movement and transitions</small>
                </div>
                <label class="admin-switch">
                    <input type="checkbox" id="reducedMotionToggle"
                        ${preferences.reducedMotion ? "checked" : ""}>
                    <span class="admin-switch-track"></span>
                </label>
            </div>

            <button type="button" class="admin-dialog-save"
                data-dialog-action="save-accessibility">
                Save Accessibility
            </button>
        `);
    }

    /* =====================================
       SECURITY INFORMATION
    ===================================== */

    function showSecurity() {
        const session = getSession();

        openDialog("Security & Privacy", `
            <div class="admin-profile-details">
                <p><strong>Session status</strong><br>
                    ${session.role === "admin" ? "Admin session detected" : "Session details unavailable"}</p>
                <p><strong>Storage type</strong><br>
                    Browser local storage</p>
            </div>
            <p class="admin-dialog-note">
                Password changes, multi-factor authentication,
                and active-session management require a proper
                authentication backend. This local demo does not
                provide those security features.
            </p>
        `);
    }

    /* =====================================
       ACTIVITY LOG
    ===================================== */

    function showActivityLog() {
        const activities = readJSON(ACTIVITY_KEY, []);

        const html = activities.length
            ? activities.map(function (item) {
                return `
                    <div class="admin-activity-item">
                        <strong>${escapeHTML(item.action)}</strong>
                        <small>${escapeHTML(item.date)}</small>
                    </div>
                `;
            }).join("")
            : "<p>No recorded activities yet.</p>";

        openDialog("Activity Log", `
            <p class="admin-dialog-note">
                Recent actions recorded by this browser.
            </p>
            <div class="admin-activity-list">${html}</div>
        `);
    }

    /* =====================================
       BACKUP AND RESTORE
    ===================================== */

    function showBackup() {
        openDialog("Backup & Restore", `
            <p class="admin-dialog-note">
                Create a copy of your current ACeS Sync data.
                Keep backup files in a safe location.
            </p>

            <div class="admin-backup-option">
                <strong>Download Backup</strong>
                <small>Export your saved student, payment and permit data.</small>
                <button type="button" class="admin-dialog-save"
                    data-dialog-action="export-backup">
                    Download JSON Backup
                </button>
            </div>

            <div class="admin-backup-option">
                <strong>Restore Backup</strong>
                <small>Replace current saved system data using a backup file.</small>
                <input type="file" id="restoreBackupFile"
                    accept=".json,application/json">
                <button type="button" class="admin-dialog-save"
                    data-dialog-action="restore-backup">
                    Restore Selected Backup
                </button>
            </div>

            <p class="admin-dialog-note">
                Restore replaces the current system data in this
                browser. Download a backup first.
            </p>
        `);
    }

    function exportBackup() {
        const rawData = localStorage.getItem(DATA_KEY);

        if (!rawData) {
            alert("No ACeS Sync data was found to back up.");
            return;
        }

        const backup = {
            application: "ACeS Sync",
            backupDate: new Date().toISOString(),
            data: readJSON(DATA_KEY, null)
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "aces-sync-backup-" +
            new Date().toISOString().slice(0, 10) + ".json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        recordActivity("Downloaded system data backup");
    }

    async function restoreBackup() {
        const fileInput = document.getElementById(
            "restoreBackupFile"
        );

        const file = fileInput?.files?.[0];

        if (!file) {
            alert("Please select a JSON backup file first.");
            return;
        }

        const confirmed = confirm(
            "WARNING: Restoring a backup will replace the current " +
            "student, payment and permit data in this browser. " +
            "Have you downloaded a backup of the current data?"
        );

        if (!confirmed) return;

        try {
            const backup = JSON.parse(await file.text());
            const restoredData = backup.data ?? backup;

            if (
                !restoredData ||
                typeof restoredData !== "object" ||
                !Array.isArray(restoredData.students) ||
                !Array.isArray(restoredData.payments) ||
                !Array.isArray(restoredData.permits)
            ) {
                throw new Error("Invalid ACeS Sync backup structure.");
            }

            localStorage.setItem(
                DATA_KEY,
                JSON.stringify(restoredData)
            );

            recordActivity("Restored system data from backup");

            alert(
                "Backup restored. The dashboard will reload " +
                "to display the restored data."
            );

            window.location.reload();

        } catch (error) {
            alert("Restore failed: " + error.message);
            console.error(error);
        }
    }

    /* =====================================
       HELP & ABOUT
    ===================================== */

    function showHelp() {
        openDialog("Help & About", `
            <div class="admin-profile-details">
                <p><strong>System</strong><br>ACeS Sync</p>
                <p><strong>Institution</strong><br>ACLC Mandaue</p>
                <p><strong>Purpose</strong><br>
                    Student records, tuition, payments,
                    permits and administration.</p>
                <p><strong>Current storage</strong><br>
                    Browser local storage</p>
            </div>
            <p class="admin-dialog-note">
                This is the local development version.
                Shared multi-user access requires a connected
                backend and database.
            </p>
        `);
    }

    /* =====================================
       LOGOUT
    ===================================== */

    function performLogout() {
        if (!confirm("Are you sure you want to log out?")) {
            return;
        }

        recordActivity("Admin logged out");
        closeMenu();
        closeDialog();

        if (typeof window.logout === "function") {
            window.logout();
        } else {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = "homepage.html";
        }
    }

    /* =====================================
       MENU ACTIONS
    ===================================== */

    menuPanel.addEventListener("click", function (event) {
        const button = event.target.closest("[data-menu-action]");

        if (!button) return;

        switch (button.dataset.menuAction) {
            case "profile": showProfile(); break;
            case "nickname": editNickname(); break;
            case "appearance": showAppearance(); break;
            case "notifications": showNotifications(); break;
            case "dashboard": showDashboardPreferences(); break;
            case "accessibility": showAccessibility(); break;
            case "security": showSecurity(); break;
            case "activity": showActivityLog(); break;
            case "backup": showBackup(); break;
            case "help": showHelp(); break;
            case "logout": performLogout(); break;
        }
    });

    /* =====================================
       DIALOG ACTIONS
    ===================================== */

    dialogContent.addEventListener("click", function (event) {
        const button = event.target.closest("[data-dialog-action]");

        if (!button) return;

        switch (button.dataset.dialogAction) {
            case "save-theme":
                saveThemeChoice();
                break;

            case "save-dashboard": {
                const select = document.getElementById(
                    "defaultPageSelect"
                );

                if (select) {
                    preferences.defaultPage = select.value;

                    if (savePreferences()) {
                        recordActivity("Updated default dashboard page");
                        closeDialog();
                    }
                }
                break;
            }

            case "save-accessibility": {
                const fontSelect = document.getElementById(
                    "fontSizeSelect"
                );

                const motionToggle = document.getElementById(
                    "reducedMotionToggle"
                );

                preferences.fontSize = fontSelect.value;
                preferences.reducedMotion = motionToggle.checked;

                if (savePreferences()) {
                    applyTheme();
                    recordActivity("Updated accessibility preferences");
                    closeDialog();
                }
                break;
            }

            case "export-backup":
                exportBackup();
                break;

            case "restore-backup":
                restoreBackup();
                break;
        }
    });

    /* =====================================
       LIVE NOTIFICATION SWITCHES
    ===================================== */

    dialogContent.addEventListener("change", function (event) {
        const notification = event.target.dataset.notification;

        if (notification) {
            preferences.notifications[notification] =
                event.target.checked;

            if (savePreferences()) {
                recordActivity(
                    "Notification " + notification + ": " +
                    (event.target.checked ? "ON" : "OFF")
                );
            }
        }
    });

    /* =====================================
       EXISTING SIDEBAR NAVIGATION
    ===================================== */

    const navLinks = document.querySelectorAll(
        ".sidebar-nav a[data-page]"
    );

    const pageSections = document.querySelectorAll(
        ".admin-page-section"
    );

    const pageTitle = document.getElementById("pageTitle");
    const pageSubtitle = document.getElementById("pageSubtitle");

    const pageInformation = {
        dashboardSection: {
            title: "Admin Dashboard",
            subtitle: "Student and payment management"
        },
        studentRecords: {
            title: "Student Records",
            subtitle: "View and manage registered students"
        },
        addStudentSection: {
            title: "Add Student",
            subtitle: "Register a new student"
        },
        importStudents: {
            title: "Import Students",
            subtitle: "Upload student records using CSV"
        },
        paymentVerification: {
            title: "Payment Verification",
            subtitle: "Review and verify student payments"
        },
        acesPermits: {
            title: "Exam Permits",
            subtitle: "Manage student examination permits"
        },
        feeManagement: {
            title: "Fee Management",
            subtitle: "Manage school fees and tuition"
        },
        announcements: {
            title: "Announcements",
            subtitle: "Create and manage school announcements"
        },
        studentConcerns: {
            title: "Student Concerns",
            subtitle: "Review and respond to student concerns"
        },
        quickReports: {
            title: "Reports",
            subtitle: "View and download administrative reports"
        }
    };

    function showPage(pageId) {
        const targetPage = document.getElementById(pageId);

        if (!targetPage) {
            console.warn("Page not found:", pageId);
            return false;
        }

        pageSections.forEach(function (section) {
            section.classList.add("hidden");
        });

        targetPage.classList.remove("hidden");

        navLinks.forEach(function (link) {
            link.classList.toggle(
                "active",
                link.dataset.page === pageId
            );
        });

        const info = pageInformation[pageId];

        if (info) {
            if (pageTitle) pageTitle.textContent = info.title;
            if (pageSubtitle) pageSubtitle.textContent = info.subtitle;
        }

        history.replaceState(null, "", "#" + pageId);
        closeMenu();

        window.scrollTo({
            top: 0,
            behavior: preferences.reducedMotion ? "auto" : "smooth"
        });

        return true;
    }

    navLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            showPage(link.dataset.page);
        });
    });

    /* =====================================
       INITIAL PAGE
    ===================================== */

    const requestedPage = window.location.hash.replace("#", "");

    const pageExists = Array.from(pageSections).some(
        section => section.id === requestedPage
    );

    const preferredPageExists = Array.from(pageSections).some(
        section => section.id === preferences.defaultPage
    );

    const initialPage = pageExists
        ? requestedPage
        : preferredPageExists
            ? preferences.defaultPage
            : "dashboardSection";

    showPage(initialPage);

});
