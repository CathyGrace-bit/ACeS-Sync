document.addEventListener("DOMContentLoaded", function () {

    const adminPage = document.getElementById("adminPage");
    const statsGrid = adminPage
        ? adminPage.querySelector(".stats-grid")
        : null;

    if (!statsGrid) {
        console.log("Dashboard stats section not found.");
        return;
    }

    // GET STUDENT RECORDS FROM ORIGINAL SCRIPT.JS
    function getStudents() {
        return typeof students !== "undefined" && Array.isArray(students)
            ? students
            : [];
    }

    // FORMAT MONEY
    function formatMoney(amount) {
        return "₱" + Number(amount || 0).toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // CREATE EXTRA FEATURES
    const extraFeatures = document.createElement("div");
    extraFeatures.className = "aces-extra-features";

    extraFeatures.innerHTML = `

        <!-- QUICK REPORTS -->
        <div class="aces-feature-card" id="acesReports">
            <h3>📊 Quick Reports</h3>

            <div class="aces-report-grid">

                <div class="aces-report-item">
                    <span>Total Students</span>
                    <strong id="acesReportStudents">0</strong>
                </div>

                <div class="aces-report-item">
                    <span>Total Tuition</span>
                    <strong id="acesReportTuition">₱0.00</strong>
                </div>

                <div class="aces-report-item">
                    <span>Total Collected</span>
                    <strong id="acesReportPaid">₱0.00</strong>
                </div>

            </div>

            <button class="aces-feature-button" id="acesExportReport">
                Download CSV Report
            </button>
        </div>

        <!-- EXAM PERMITS -->
        <div class="aces-feature-card" id="acesPermits">
            <h3>📄 Exam Permit Records</h3>

            <div class="aces-feature-table-wrap">
                <table class="aces-feature-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Permit Number</th>
                        </tr>
                    </thead>

                    <tbody id="acesPermitTable">
                        <tr>
                            <td colspan="3">No permit records yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- QUICK ACTIONS -->
        <div class="aces-feature-card">
            <h3>⚡ Quick Actions</h3>

            <p>Quick access to important admin sections.</p>

            <a href="#studentRecords" class="aces-feature-button">
                View Students
            </a>

            <a href="#paymentVerification" class="aces-feature-button">
                Verify Payments
            </a>

            <a href="#acesPermits" class="aces-feature-button">
                View Permits
            </a>
        </div>

        <!-- HELP AND SETTINGS -->
        <div class="aces-feature-card" id="acesHelp">
            <h3>⚙️ Settings & Help</h3>

            <p>
                Welcome to ACeS Sync Admin Dashboard.
                Use this section to review important reminders.
            </p>

            <div class="aces-help-box">
                <strong>Payment Reminder</strong>
                <p>
                    Always check the student's payment reference
                    before verifying a transaction.
                </p>
            </div>

            <div class="aces-help-box">
                <strong>Student Records Reminder</strong>
                <p>
                    Make sure student information and tuition
                    amounts are correct before saving.
                </p>
            </div>
        </div>

    `;

    statsGrid.insertAdjacentElement("afterend", extraFeatures);


    // UPDATE REPORTS AND PERMITS
    function updateExtraFeatures() {

        const studentList = getStudents();

        let totalTuition = 0;
        let totalPaid = 0;

        studentList.forEach(function (student) {

            totalTuition += Number(
                student.discountedTuition ?? student.tuition ?? 0
            );

            totalPaid += Number(student.paid || 0);

        });

        document.getElementById("acesReportStudents").textContent =
            studentList.length;

        document.getElementById("acesReportTuition").textContent =
            formatMoney(totalTuition);

        document.getElementById("acesReportPaid").textContent =
            formatMoney(totalPaid);


        // UPDATE PERMIT TABLE
        const permitTable = document.getElementById("acesPermitTable");

        const permitStudents = studentList.filter(function (student) {
            return student.permit;
        });

        permitTable.innerHTML = "";

        if (permitStudents.length === 0) {

            permitTable.innerHTML = `
                <tr>
                    <td colspan="3">No permit records yet.</td>
                </tr>
            `;

            return;
        }

        permitStudents.forEach(function (student) {

            const row = document.createElement("tr");

            const idCell = document.createElement("td");
            idCell.textContent = student.id || "";

            const nameCell = document.createElement("td");
            nameCell.textContent = student.name || "";

            const permitCell = document.createElement("td");
            permitCell.textContent =
                typeof student.permit === "string"
                    ? student.permit
                    : "Generated";

            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(permitCell);

            permitTable.appendChild(row);

        });

    }


    // EXPORT REPORT TO CSV
    document.getElementById("acesExportReport")
        .addEventListener("click", function () {

            const studentList = getStudents();

            if (studentList.length === 0) {
                alert("No student records available to export.");
                return;
            }

            const rows = [
                [
                    "Student ID",
                    "Student Name",
                    "Course",
                    "Grade / Year",
                    "Section",
                    "Tuition",
                    "Paid",
                    "Balance",
                    "Permit"
                ]
            ];

            studentList.forEach(function (student) {

                rows.push([
                    student.id || "",
                    student.name || "",
                    student.course || "",
                    student.grade || "",
                    student.section || "",
                    student.discountedTuition ?? student.tuition ?? 0,
                    student.paid || 0,
                    student.balance || 0,
                    student.permit || ""
                ]);

            });

            const csvContent = rows.map(function (row) {

                return row.map(function (value) {

                    return '"' +
                        String(value).replace(/"/g, '""') +
                        '"';

                }).join(",");

            }).join("\n");

            const file = new Blob(
                [csvContent],
                { type: "text/csv;charset=utf-8;" }
            );

            const url = URL.createObjectURL(file);

            const link = document.createElement("a");
            link.href = url;
            link.download = "ACeS-Sync-Student-Report.csv";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

        });


    // INITIAL UPDATE
    updateExtraFeatures();

    // REFRESH WHEN STUDENT DATA CHANGES
    setInterval(updateExtraFeatures, 1200);

});