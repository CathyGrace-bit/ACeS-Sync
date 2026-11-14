document.addEventListener("DOMContentLoaded", function () {

    const topbar = document.querySelector(".topbar");

    if (!topbar) {
        console.log("Topbar not found.");
        return;
    }

    // CREATE HAMBURGER BUTTON
    const menuButton = document.createElement("button");
    menuButton.className = "menu-toggle";
    menuButton.innerHTML = "☰";
    menuButton.setAttribute("aria-label", "Open menu");

    topbar.insertBefore(menuButton, topbar.firstChild);

    // CREATE MENU OVERLAY
    const overlay = document.createElement("div");
    overlay.className = "menu-overlay";

    // CREATE SIDE MENU
    const sideMenu = document.createElement("div");
    sideMenu.className = "side-menu";

    sideMenu.innerHTML = `
        <button class="menu-close">&times;</button>

        <h2>ACLC MANDAUE</h2>
        <p>ACeS Sync • 2026-2027</p>

        <a href="#adminOverview">🏠 Dashboard</a>
        <a href="#studentRecords">🎓 Students</a>
        <a href="#paymentVerification">💳 Payments</a>
        <a href="#acesPermits">📄 Exam Permits</a>
        <a href="#acesReports">📊 Reports</a>
        <a href="#acesHelp">❓ Help & Settings</a>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(sideMenu);

    const closeButton = sideMenu.querySelector(".menu-close");

    // OPEN MENU
    function openMenu() {
        sideMenu.classList.add("active");
        overlay.classList.add("active");
    }

    // CLOSE MENU
    function closeMenu() {
        sideMenu.classList.remove("active");
        overlay.classList.remove("active");
    }

    menuButton.addEventListener("click", openMenu);
    closeButton.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    // CLOSE WHEN A MENU LINK IS CLICKED
    sideMenu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });

});