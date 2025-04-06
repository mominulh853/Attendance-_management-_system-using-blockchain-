from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from pymongo import MongoClient
from flask_session import Session
from web3 import Web3
import json

app = Flask(__name__)
app.secret_key = "your_secret_key"  # Use a strong secret key

# Configure session
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["attendance_db"]
students_collection = db["students"]
admins_collection = db["admins"]
attendance_collection = db["attendance"]

# Connect to Blockchain (Ganache or any RPC Node)
web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:7545"))  # Change to your provider

# Load contract details
with open("build/contracts/Attendance.json") as f:
    contract_data = json.load(f)
    abi = contract_data["abi"]
    contract_address = contract_data["networks"]["5777"]["address"]  # Update network ID if needed

contract = web3.eth.contract(address=contract_address, abi=abi)

# Default account for transactions (Ganache account)
default_account = web3.eth.accounts[0]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/student_login', methods=['GET', 'POST'])
def student_login():
    if request.method == 'POST':
        roll_number = request.form.get('roll_number').strip()
        student = students_collection.find_one({"roll_number": roll_number})

        if student:
            session['roll_number'] = roll_number
            return redirect(url_for('student_dashboard'))
        else:
            return render_template('student_login.html', error="Invalid Roll Number")

    return render_template('student_login.html')

@app.route('/student_dashboard')
def student_dashboard():
    if 'roll_number' not in session:
        return redirect(url_for('student_login'))

    roll_number = session['roll_number']
    student = students_collection.find_one({"roll_number": roll_number}, {"_id": 0})

    # Fetch attendance from MongoDB
    attendance_records = list(attendance_collection.find({"roll_number": roll_number}, {"_id": 0}))

    if not student:
        return redirect(url_for('student_login'))

    return render_template('student_dashboard.html', student=student, attendance_records=attendance_records)

@app.route('/admin_login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        admin = admins_collection.find_one({"username": username})

        if admin:
            session['admin'] = username
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin_login.html', error="Invalid Credentials")
    
    return render_template('admin_login.html')

@app.route('/admin_dashboard')
def admin_dashboard():
    if 'admin' not in session:
        return redirect(url_for('admin_login'))
    
    students = list(students_collection.find({}, {"_id": 0, "name": 1, "roll_number": 1}))
    return render_template('admin_dashboard.html', students=students)

@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    data = request.json

    if not isinstance(data, list) or len(data) == 0:
        return jsonify({"error": "Invalid data format. Expected a non-empty list."}), 400

    for record in data:
        name = record.get('name')
        roll_number = record.get('roll_number')
        date = record.get('date')
        course = record.get('course')
        status = record.get('status')

        if not name or not roll_number or not date or not course or not status:
            return jsonify({"error": "Missing fields in attendance record"}), 400

        # Save attendance to MongoDB
        attendance_collection.insert_one({
            "name": name,
            "roll_number": roll_number,
            "date": date,
            "course": course,
            "status": status
        })

        # Save attendance to blockchain
        try:
            tx_hash = contract.functions.markAttendance(
                name, roll_number, date, course, status
            ).transact({'from': default_account})

            web3.eth.wait_for_transaction_receipt(tx_hash)
        except Exception as e:
            return jsonify({"error": f"Blockchain error: {str(e)}"}), 500

    return jsonify({"message": "✅ Attendance recorded successfully on Blockchain!"}), 201

@app.route('/all_attendance')
def all_attendance():
    records = list(attendance_collection.find({}, {"_id": 0, "name": 1, "roll_number": 1, "date": 1, "course": 1, "status": 1}))
    return render_template('all_attendance.html', attendance_records=records)

@app.route('/admin_logout')
def admin_logout():
    session.pop('admin', None)
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
