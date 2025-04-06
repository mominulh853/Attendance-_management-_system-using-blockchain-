// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Attendance {
    struct Record {
        string name;
        string rollNumber;
        string date;
        string course;
        string status;
    }

    Record[] public records;
    address public admin;

    constructor() {
        admin = msg.sender;
    }

    function markAttendance(
        string memory _name,
        string memory _rollNumber,
        string memory _date,
        string memory _course,
        string memory _status
    ) public {
        require(msg.sender == admin, "Only admin can mark attendance");

        records.push(Record(_name, _rollNumber, _date, _course, _status));
    }

    function getAttendanceCount() public view returns (uint) {
        return records.length;
    }

    function getAttendanceRecord(uint index)
        public
        view
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        require(index < records.length, "Index out of bounds");
        Record memory record = records[index];
        return (record.name, record.rollNumber, record.date, record.course, record.status);
    }
}
