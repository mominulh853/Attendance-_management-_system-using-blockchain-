const Attendance = artifacts.require("Attendance");

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(Attendance);
    const attendanceInstance = await Attendance.deployed();

    console.log("✅ Attendance Contract Deployed!");
    console.log("📜 Contract Address:", attendanceInstance.address);

    // Example: Initial transaction (optional)
    const admin = accounts[0]; // First account in Ganache as admin

    await attendanceInstance.markAttendance(
        "John Doe",
        "CSE123",
        "2025-03-28",
        "Blockchain",
        "Present",
        { from: admin }
    );

    console.log("📝 Initial attendance record added by admin:", admin);
};
