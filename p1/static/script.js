document.addEventListener("DOMContentLoaded", function () {
    loadStudents();
    loadAllAttendance();
});

let attendanceData = [];

// ✅ Load student list dynamically
function loadStudents() {
    fetch('/students')
        .then(response => response.json())
        .then(data => {
            const studentsList = document.getElementById('studentsList');
            studentsList.innerHTML = '';

            if (data.length === 0) {
                studentsList.innerHTML = "<p>No students found.</p>";
                return;
            }

            data.forEach(student => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${student.roll_number} - ${student.name}</strong>
                    <button class="present-btn" onclick="markAttendance('${student.name}', '${student.roll_number}', 'Present', this)">Present</button>
                    <button class="absent-btn" onclick="markAttendance('${student.name}', '${student.roll_number}', 'Absent', this)">Absent</button>
                `;
                studentsList.appendChild(listItem);
            });
        })
        .catch(error => console.error('⚠️ Error fetching students:', error));
}

// ✅ Mark attendance and toggle button styles
function markAttendance(name, rollNumber, status, button) {
    const dateInput = document.getElementById('attendanceDate').value;
    const courseInput = document.getElementById('courseSelect').value;

    if (!dateInput || !courseInput) {
        alert("⚠️ Please select both a date and a course before marking attendance.");
        return;
    }

    // Find or update existing record
    let existingRecord = attendanceData.find(record => record.roll_number === rollNumber);
    if (existingRecord) {
        existingRecord.status = status;
    } else {
        attendanceData.push({ name, roll_number: rollNumber, date: dateInput, course: courseInput, status });
    }

    // Update button styles dynamically
    let parent = button.parentElement;
    let presentBtn = parent.querySelector('.present-btn');
    let absentBtn = parent.querySelector('.absent-btn');

    presentBtn.style.backgroundColor = (status === 'Present') ? 'green' : '';
    absentBtn.style.backgroundColor = (status === 'Absent') ? 'red' : '';
}

// ✅ Submit attendance records to the backend
function submitAttendance() {
    if (attendanceData.length === 0) {
        alert("⚠️ No attendance data to submit.");
        return;
    }

    fetch('/mark_attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        attendanceData = [];  // Clear stored data
        document.getElementById('attendanceDate').value = ''; // Reset date
        document.getElementById('courseSelect').value = ''; // Reset course selection
        loadAllAttendance(); // Reload attendance records
    })
    .catch(error => {
        console.error('⚠️ Error submitting attendance:', error);
        alert("⚠️ Error submitting attendance. Check console for details.");
    });
}

// ✅ Load all attendance records dynamically
function loadAllAttendance() {
    fetch('/all_attendance')
        .then(response => response.json())
        .then(data => {
            const attendanceTable = document.getElementById('attendanceTable');
            attendanceTable.innerHTML = `
                <tr>
                    <th>Roll No.</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Course</th>
                    <th>Status</th>
                </tr>`;

            if (data.length === 0) {
                attendanceTable.innerHTML += "<tr><td colspan='5'>No attendance records found.</td></tr>";
                return;
            }

            data.forEach(record => {
                let row = document.createElement('tr');
                row.innerHTML = `
                    <td>${record.roll_number}</td>
                    <td>${record.name}</td>
                    <td>${record.date}</td>
                    <td>${record.course}</td>
                    <td>${record.status}</td>
                `;
                attendanceTable.appendChild(row);
            });
        })
        .catch(error => console.error('⚠️ Error loading attendance records:', error));
}
