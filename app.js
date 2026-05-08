const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory store for sign-up details, OTPs, and medical records
let hospitalDetails = [];
let patientDetails = [];
let otpStore = {};
let medicalRecords = {};
let currentSession = null; // Track current session
let hospitalAccessLog = {}; // Track hospital access to patient records
let hospitalDoctors = {}; // Track doctors for each hospital

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Helper: wrap content in styled page
const page = (title, body) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — MediHistory</title>
<link rel="stylesheet" href="/style.css">
</head><body>
    <nav class="navbar">
        <a href="/" class="navbar-brand">🏥 Medi<span>History</span></a>
        <div class="nav-links">
            <a href="/hospital_signup.html" class="nav-link">Hospital Portal</a>
            <a href="/patient_signup.html" class="nav-link">Patient Portal</a>
        </div>
    </nav>
<div class="orb orb-1"></div><div class="orb orb-2"></div>
<div class="container">${body}</div>
</body></html>`;

// Routes
app.post('/send_otp', (req, res) => {
    const { mobile_number } = req.body;
    const otp = generateOTP();
    otpStore[mobile_number] = otp;
    console.log(`OTP for ${mobile_number}: ${otp}`); // Simulate sending OTP
    res.send(page('OTP Sent', `
        <h1>📲 OTP Sent</h1>
        <p>OTP sent to <strong style="color:#00d4aa">${mobile_number}</strong></p>
        <div class="info-badge">💡 Check your server console for the OTP</div>
        <br><a href="/" class="back-link">← Back to Home</a>
    `));
});

app.post('/patient_signup', (req, res) => {
    const { patient_name, patient_age, patient_mobile_number, patient_date_of_birth, patient_privacy_password } = req.body;
    patientDetails.push({ patient_name, patient_age, patient_mobile_number, patient_date_of_birth, patient_privacy_password });
    medicalRecords[patient_mobile_number] = [];
    hospitalAccessLog[patient_mobile_number] = [];
    res.redirect('/');
});

app.post('/hospital_signup', (req, res) => {
    const { hospital_name, hospital_address, hospital_phone_number, hospital_privacy_password } = req.body;
    hospitalDetails.push({ hospital_name, hospital_address, hospital_phone_number, hospital_privacy_password });
    if (!hospitalDoctors[hospital_phone_number]) {
        hospitalDoctors[hospital_phone_number] = [];
    }
    res.redirect('/');
});

app.post('/hospital_signin_step1', (req, res) => {
    const { hospital_phone_number } = req.body;
    const otp = generateOTP();
    otpStore[hospital_phone_number] = otp;
    console.log(`OTP for ${hospital_phone_number}: ${otp}`); // Simulate sending OTP
    res.send(page('Hospital OTP Verification', `
        <h1>🔐 Verify Identity</h1>
        <p>OTP sent to <strong style="color:#00d4aa">${hospital_phone_number}</strong></p>
        <form action="/hospital_signin_step2" method="POST">
            <input type="hidden" name="hospital_phone_number" value="${hospital_phone_number}">
            <input type="text" name="otp" placeholder="Enter 6-digit OTP" required>
            <input type="text" name="hospital_name" placeholder="Hospital Name" required>
            <input type="password" name="hospital_privacy_password" placeholder="Privacy Password" required>
            <button type="submit" class="button">🔑 Sign In</button>
        </form>
        <form action="/hospital_forgot_password" method="POST" style="margin-top:8px">
            <input type="hidden" name="hospital_phone_number" value="${hospital_phone_number}">
            <button type="submit" class="button btn-secondary" style="font-size:.85em">Forgot Password?</button>
        </form>
        <div class="info-badge">💡 Check server console for OTP</div>
    `));
});

app.post('/hospital_signin_step2', (req, res) => {
    const { hospital_phone_number, otp, hospital_name, hospital_privacy_password } = req.body;
    const hospital = hospitalDetails.find(h => h.hospital_phone_number === hospital_phone_number && h.hospital_name === hospital_name && h.hospital_privacy_password === hospital_privacy_password);

    const isAlreadyAuthenticated = currentSession && currentSession.hospital_phone_number === hospital_phone_number && otp === 'SKIP';

    if (hospital && (otpStore[hospital_phone_number] === otp || isAlreadyAuthenticated)) {
        if (!isAlreadyAuthenticated) {
            delete otpStore[hospital_phone_number];
            currentSession = { type: 'hospital', hospital_name, hospital_address: hospital.hospital_address, hospital_phone_number };
        }

        // Calculate Statsn
        let patientsAccessed = new Set();
        Object.keys(hospitalAccessLog).forEach(patientNum => {
            const logs = hospitalAccessLog[patientNum];
            if (logs.some(log => log.hospital_phone_number === hospital_phone_number)) {
                patientsAccessed.add(patientNum);
            }
        });

        const doctors = hospitalDoctors[hospital_phone_number] || [];
        const doctorsHtml = doctors.length > 0
            ? `<ul style="text-align:left; color:rgba(255,255,255,0.8); margin-bottom: 12px; padding-left: 20px;">${doctors.map(d => `<li style="margin-bottom:4px">👨‍⚕️ Dr. ${d.name} <span style="font-size:0.8em; color:#00d4aa;">(${d.specialty})</span></li>`).join('')}</ul>`
            : `<p style="color:rgba(255,255,255,0.4); text-align:center;">No doctors added yet.</p>`;

        res.send(page('Hospital Dashboard', `
            <h1>🏥 ${hospital_name}</h1>
            <p>Hospital Management Dashboard</p>
            
            <div style="display:flex; gap:12px; margin-bottom:20px;">
                <div style="flex:1; background:rgba(0,212,170,0.1); border:1px solid rgba(0,212,170,0.2); padding:16px; border-radius:16px;">
                    <h3 style="margin:0; font-size:2em; color:#00d4aa;">${patientsAccessed.size}</h3>
                    <div style="font-size:0.75em; text-transform:uppercase; color:rgba(255,255,255,0.6); margin-top:4px;">Patients Accessed</div>
                </div>
                <div style="flex:1; background:rgba(0,153,255,0.1); border:1px solid rgba(0,153,255,0.2); padding:16px; border-radius:16px;">
                    <h3 style="margin:0; font-size:2em; color:#0099ff;">${doctors.length}</h3>
                    <div style="font-size:0.75em; text-transform:uppercase; color:rgba(255,255,255,0.6); margin-top:4px;">Registered Doctors</div>
                </div>
            </div>

            <h2>📋 Manage Records</h2>
            <form action="/add_record_step1" method="POST">
                <button type="submit" class="button">➕ Add New Record</button>
            </form>
            <form action="/view_records" method="POST" style="margin-top:8px">
                <input type="tel" name="patient_mobile_number" placeholder="Patient Mobile Number" required>
                <button type="submit" class="button btn-secondary">🔍 View Patient Records</button>
            </form>

            <h2>👨‍⚕️ Hospital Doctors</h2>
            ${doctorsHtml}
            <form action="/add_doctor" method="POST" style="margin-top:8px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;">
                <input type="text" name="doctor_name" placeholder="Doctor Name (e.g. Smith)" required>
                <input type="text" name="doctor_specialty" placeholder="Specialty (e.g. Cardiology)" required>
                <button type="submit" class="button" style="background:linear-gradient(135deg,#9b59b6,#8e44ad);color:#fff">🧑‍⚕️ Add Doctor</button>
            </form>

            <h2>🔒 Change Password</h2>
            <form action="/change_hospital_password" method="POST">
                <input type="hidden" name="hospital_name" value="${hospital_name}">
                <input type="password" name="current_password" placeholder="Current Password" required>
                <input type="password" name="new_password" placeholder="New Password" required>
                <button type="submit" class="button" style="background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff">🔄 Change Password</button>
            </form>
            <form action="/signout" method="POST" style="margin-top:12px">
                <button type="submit" class="button btn-danger">🚪 Sign Out</button>
            </form>
        `));
    } else {
        res.send(page('Error', `
            <h1>❌ Invalid Credentials</h1>
            <p>Invalid credentials or OTP. Please try again.</p>
            <a href="/" class="back-link">← Back to Home</a>
        `));
    }
});

app.post('/patient_signin_step1', (req, res) => {
    const { patient_mobile_number } = req.body;
    const otp = generateOTP();
    otpStore[patient_mobile_number] = otp;
    console.log(`OTP for ${patient_mobile_number}: ${otp}`); // Simulate sending OTP
    res.send(page('Patient OTP Verification', `
        <h1>🔐 Verify Identity</h1>
        <p>OTP sent to <strong style="color:#0099ff">${patient_mobile_number}</strong></p>
        <form action="/patient_signin_step2" method="POST">
            <input type="hidden" name="patient_mobile_number" value="${patient_mobile_number}">
            <input type="text" name="otp" placeholder="Enter 6-digit OTP" required>
            <input type="text" name="patient_name" placeholder="Your Full Name" required>
            <input type="password" name="patient_privacy_password" placeholder="Privacy Password" required>
            <button type="submit" class="button btn-secondary">🔑 Sign In</button>
        </form>
        <form action="/patient_forgot_password" method="POST" style="margin-top:8px">
            <input type="hidden" name="patient_mobile_number" value="${patient_mobile_number}">
            <button type="submit" class="button" style="font-size:.85em;background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.12);box-shadow:none">Forgot Password?</button>
        </form>
        <div class="info-badge">💡 Check server console for OTP</div>
    `));
});

app.post('/patient_signin_step2', (req, res) => {
    const { patient_mobile_number, otp, patient_privacy_password, patient_name } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === patient_mobile_number && p.patient_privacy_password === patient_privacy_password && p.patient_name === patient_name);

    if (patient && otpStore[patient_mobile_number] === otp) {
        delete otpStore[patient_mobile_number];
        currentSession = { type: 'patient', mobile_number: patient_mobile_number };

        const recordsHtml = medicalRecords[patient_mobile_number].length > 0
            ? `<table><tr><th>Patient</th><th>Disease</th><th>Medicines</th><th>Dosage/day</th><th>Doctor</th></tr>
               ${medicalRecords[patient_mobile_number].map(r => `<tr><td>${r.patient_name}</td><td>${r.disease}</td><td>${r.medicines}</td><td>${r.dosage}</td><td>${r.doctor_name}</td></tr>`).join('')}</table>`
            : '<p style="color:rgba(255,255,255,.4)">No medical records found yet.</p>';

        const accessHtml = hospitalAccessLog[patient_mobile_number].length > 0
            ? `<table><tr><th>Hospital</th><th>Address</th><th>Phone</th><th>Date & Time</th></tr>
               ${hospitalAccessLog[patient_mobile_number].map(l => `<tr><td>${l.hospital_name}</td><td>${l.hospital_address}</td><td>${l.hospital_phone_number}</td><td>${l.date}</td></tr>`).join('')}</table>`
            : '<p style="color:rgba(255,255,255,.4)">No hospitals have accessed your records yet.</p>';

        res.send(page('Patient Dashboard', `
            <h1>👤 ${patient.patient_name}</h1>
            <p>Your Health Dashboard</p>
            <h2>📋 Medical Records</h2>
            ${recordsHtml}
            <h2>🏥 Hospital Access Log</h2>
            ${accessHtml}
            <h2>🔒 Change Password</h2>
            <form action="/change_patient_password" method="POST">
                <input type="hidden" name="mobile_number" value="${patient_mobile_number}">
                <input type="password" name="current_password" placeholder="Current Password" required>
                <input type="password" name="new_password" placeholder="New Password" required>
                <button type="submit" class="button" style="background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff">🔄 Change Password</button>
            </form>
            <form action="/signout" method="POST" style="margin-top:12px">
                <button type="submit" class="button btn-danger">🚪 Sign Out</button>
            </form>
        `));
    } else {
        res.send(page('Error', `
            <h1>❌ Invalid Credentials</h1>
            <p>Invalid credentials or OTP. Please try again.</p>
            <a href="/" class="back-link">← Back to Home</a>
        `));
    }
});

app.post('/hospital_forgot_password', (req, res) => {
    const { hospital_phone_number } = req.body;
    const hospital = hospitalDetails.find(h => h.hospital_phone_number === hospital_phone_number);
    if (hospital) {
        console.log(`Privacy password for ${hospital_phone_number}: ${hospital.hospital_privacy_password}`);
        res.send(page('Password Sent', `<h1>📧 Password Sent</h1><p>Privacy password sent to <strong style="color:#00d4aa">${hospital_phone_number}</strong></p><div class="info-badge">💡 Check server console</div><br><a href="/" class="back-link">← Back to Home</a>`));
    } else {
        res.send(page('Error', `<h1>❌ Not Found</h1><p>Hospital not found.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/patient_forgot_password', (req, res) => {
    const { patient_mobile_number } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === patient_mobile_number);
    if (patient) {
        console.log(`Privacy password for ${patient_mobile_number}: ${patient.patient_privacy_password}`);
        res.send(page('Password Sent', `<h1>📧 Password Sent</h1><p>Privacy password sent to <strong style="color:#0099ff">${patient_mobile_number}</strong></p><div class="info-badge">💡 Check server console</div><br><a href="/" class="back-link">← Back to Home</a>`));
    } else {
        res.send(page('Error', `<h1>❌ Not Found</h1><p>Patient not found.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/add_record_step1', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'add_record_step1.html'));
});

app.post('/view_records', (req, res) => {
    const { patient_mobile_number } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === patient_mobile_number);
    if (patient) {
        if (currentSession && currentSession.type === 'hospital') {
            hospitalAccessLog[patient_mobile_number].push({
                hospital_name: currentSession.hospital_name,
                hospital_address: currentSession.hospital_address,
                hospital_phone_number: currentSession.hospital_phone_number,
                date: new Date().toLocaleString()
            });
        }
        const recordsHtml = medicalRecords[patient_mobile_number].length > 0
            ? `<table><tr><th>Patient</th><th>Disease</th><th>Medicines</th><th>Dosage/day</th><th>Doctor</th></tr>
               ${medicalRecords[patient_mobile_number].map(r => `<tr><td>${r.patient_name}</td><td>${r.disease}</td><td>${r.medicines}</td><td>${r.dosage}</td><td>${r.doctor_name}</td></tr>`).join('')}</table>`
            : '<p style="color:rgba(255,255,255,.4)">No records found.</p>';
        res.send(page('Patient Records', `
            <h1>📋 ${patient.patient_name}'s Records</h1>
            ${recordsHtml}
            <form action="/signout" method="POST" style="margin-top:16px">
                <button type="submit" class="button btn-danger">🚪 Sign Out</button>
            </form>
        `));
    } else {
        res.send(page('Error', `<h1>❌ Not Found</h1><p>Patient not found.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/send_otp_record', (req, res) => {
    const { mobile_number } = req.body;
    const otp = generateOTP();
    otpStore[mobile_number] = otp;
    console.log(`OTP for ${mobile_number}: ${otp}`);
    res.send(page('Verify OTP', `
        <h1>📲 OTP Sent</h1>
        <p>OTP sent to patient <strong style="color:#00d4aa">${mobile_number}</strong></p>
        <form action="/verify_otp_record" method="POST">
            <input type="hidden" name="mobile_number" value="${mobile_number}">
            <input type="text" name="otp" placeholder="Enter 6-digit OTP" required>
            <button type="submit" class="button">✅ Verify OTP</button>
        </form>
        <div class="info-badge">💡 Check server console for OTP</div>
    `));
});

app.post('/verify_otp_record', (req, res) => {
    const { mobile_number, otp } = req.body;
    if (otpStore[mobile_number] === otp) {
        delete otpStore[mobile_number];

        let doctorInput = '<input type="text" name="doctor_name" placeholder="Doctor Name" required>';
        if (currentSession && currentSession.type === 'hospital') {
            const doctors = hospitalDoctors[currentSession.hospital_phone_number] || [];
            if (doctors.length > 0) {
                doctorInput = `
                    <select name="doctor_name" class="input-field" required style="background:rgba(255,255,255,.06); color:#fff; border:1px solid rgba(255,255,255,.1); padding:13px 16px; border-radius:12px; margin-bottom:12px;">
                        <option value="" disabled selected>Select a Doctor</option>
                        ${doctors.map(d => `<option value="${d.name}" style="color:#000">Dr. ${d.name} (${d.specialty})</option>`).join('')}
                    </select>
                `;
            } else {
                doctorInput = '<input type="text" name="doctor_name" placeholder="Doctor Name" required><div class="info-badge" style="margin-bottom:12px; margin-top:0;">💡 You can add doctors from your dashboard</div>';
            }
        }

        res.send(page('Add Record', `
            <h1>📝 Add Medical Record</h1>
            <p>OTP verified for <strong style="color:#00d4aa">${mobile_number}</strong></p>
            <form action="/add_record_step2" method="POST">
                <input type="hidden" name="mobile_number" value="${mobile_number}">
                <input type="text" name="patient_name" placeholder="Patient Name" required>
                <input type="text" name="disease" placeholder="Disease / Condition" required>
                <input type="text" name="medicines" placeholder="Prescribed Medicines" required>
                <input type="text" name="dosage" placeholder="Dosage per day" required>
                ${doctorInput}
                <button type="submit" class="button">💾 Save Record</button>
            </form>
        `));
    } else {
        res.send(page('Error', `<h1>❌ Invalid OTP</h1><p>Please try again.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/add_doctor', (req, res) => {
    if (currentSession && currentSession.type === 'hospital') {
        const { doctor_name, doctor_specialty } = req.body;
        if (!hospitalDoctors[currentSession.hospital_phone_number]) {
            hospitalDoctors[currentSession.hospital_phone_number] = [];
        }
        hospitalDoctors[currentSession.hospital_phone_number].push({ name: doctor_name, specialty: doctor_specialty });

        res.send(page('Success', `
            <h1>✅ Doctor Added</h1>
            <p>Dr. ${doctor_name} has been added to your hospital.</p>
            <form action="/hospital_signin_step2" method="POST">
                <input type="hidden" name="hospital_phone_number" value="${currentSession.hospital_phone_number}">
                <input type="hidden" name="otp" value="SKIP">
                <input type="hidden" name="hospital_name" value="${currentSession.hospital_name}">
                <input type="hidden" name="hospital_privacy_password" value="${hospitalDetails.find(h => h.hospital_phone_number === currentSession.hospital_phone_number).hospital_privacy_password}">
                <button type="submit" class="button">← Back to Dashboard</button>
            </form>
            <script>
                // We fake the OTP validation for back navigation in this demo
            </script>
        `));
    } else {
        res.send(page('Error', `<h1>❌ Unauthorized</h1><p>Only hospitals can add doctors.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/add_record_step2', (req, res) => {
    const { mobile_number, patient_name, disease, medicines, dosage, doctor_name } = req.body;
    if (currentSession && currentSession.type === 'hospital') {
        medicalRecords[mobile_number].push({ patient_name, disease, medicines, dosage, doctor_name });
        res.send(page('Success', `<h1>✅ Record Added</h1><p>Medical record saved successfully.</p><a href="/" class="back-link">← Back to Home</a>`));
    } else {
        res.send(page('Error', `<h1>❌ Unauthorized</h1><p>Only hospitals can add records.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/change_patient_password', (req, res) => {
    const { mobile_number, current_password, new_password } = req.body;
    const patient = patientDetails.find(p => p.patient_mobile_number === mobile_number && p.patient_privacy_password === current_password);
    if (patient) {
        patient.patient_privacy_password = new_password;
        res.send(page('Success', `<h1>✅ Password Changed</h1><p>Your password has been updated.</p><a href="/" class="back-link">← Back to Home</a>`));
    } else {
        res.send(page('Error', `<h1>❌ Incorrect Password</h1><p>Current password is wrong.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/change_hospital_password', (req, res) => {
    const { hospital_name, current_password, new_password } = req.body;
    const hospital = hospitalDetails.find(h => h.hospital_name === hospital_name && h.hospital_privacy_password === current_password);
    if (hospital) {
        hospital.hospital_privacy_password = new_password;
        res.send(page('Success', `<h1>✅ Password Changed</h1><p>Hospital password updated.</p><a href="/" class="back-link">← Back to Home</a>`));
    } else {
        res.send(page('Error', `<h1>❌ Incorrect Password</h1><p>Current password is wrong.</p><a href="/" class="back-link">← Back to Home</a>`));
    }
});

app.post('/signout', (req, res) => {
    currentSession = null;
    res.redirect('/');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
