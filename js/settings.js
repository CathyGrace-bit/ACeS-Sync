
/* =========================================
   ACeS SYNC - SETTINGS JAVASCRIPT
========================================= */

const DATA_KEY = "acesSyncData_v1";
const SESSION_KEY = "acesSyncSession_v1";
const SETTINGS_KEY = "acesSyncSettings_v1";

/* CHECK ADMIN SESSION */

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

/* LOAD SETTINGS */

function loadSettings() {
    let settings = {};

    try {
        settings = JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (error) {
        settings = {};
    }

    document.getElementById("schoolName").value =
        settings.schoolName ||
        "Asian College of Technology - ACLC Mandaue";

    document.getElementById("systemName").value =
        settings.systemName || "ACeS Sync";

    document.getElementById("campusName").value =
        settings.campusName || "ACLC Mandaue";

    document.getElementById("academicYear").value =
        settings.academicYear || "";
}

/* SAVE SETTINGS */

function saveSettings() {
    const schoolName = document.getElementById("schoolName").value.trim();
    const systemName = document.getElementById("systemName").value.trim();
    const campusName = document.getElementById("campusName").value.trim();
    const academicYear = document.getElementById("academicYear").value.trim();

    const message = document.getElementById("settingsMessage");

    if (!schoolName || !systemName || !campusName) {
        message.textContent = "Please complete the required school information.";
        message.className = "settings-message error";
        return;
    }

    const settings = {
        schoolName: schoolName,
        systemName: systemName,
        campusName: campusName,
        academicYear: academicYear
    };

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

        message.textContent = "Settings saved successfully!";
        message.className = "settings-message success";
    } catch (error) {
        message.textContent = "Unable to save settings. Please try again.";
        message.className = "settings-message error";
    }
}

/* EXPORT SYSTEM DATA */

function exportStudentData() {
    const message = document.getElementById("exportMessage");

    try {
        const rawData = localStorage.getItem(DATA_KEY);

        if (!rawData) {
            message.textContent = "No system data found to export.";
            message.className = "settings-message error";
            return;
        }

        const systemData = JSON.parse(rawData);

        const exportData = {
            exportedAt: new Date().toISOString(),
            system: "ACeS Sync",
            institution: "ACLC Mandaue",
            settings: JSON.parse(
                localStorage.getItem(SETTINGS_KEY) || "{}"
            ),
            data: systemData
        };

        const fileContent = JSON.stringify(exportData, null, 4);
        const fileBlob = new Blob(
            [fileContent],
            { type: "application/json" }
        );

        const fileURL = URL.createObjectURL(fileBlob);
        const downloadLink = document.createElement("a");

        downloadLink.href = fileURL;
        downloadLink.download =
            "ACeS-Sync-Backup-" +
            new Date().toISOString().slice(0, 10) +
            ".json";

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        URL.revokeObjectURL(fileURL);

        message.textContent = "System data exported successfully!";
        message.className = "settings-message success";

    } catch (error) {
        console.error("Export error:", error);

        message.textContent = "Unable to export system data.";
        message.className = "settings-message error";
    }
}

/* LOGOUT */

function logout() {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "../index.html";
}

/* INITIALIZE SETTINGS PAGE */

document.addEventListener("DOMContentLoaded", function () {
    if (!checkAdminSession()) return;

    loadSettings();
});
