# 🏥 MediHistory — Patient Medical Records Management System

A web-based medical records management system that enables **hospitals** and **patients** to securely manage, access, and track medical history through OTP-verified authentication.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Screenshots](#screenshots)
- [Notes & Limitations](#notes--limitations)
- [License](#license)

---

## Overview

MediHistory is a lightweight Node.js application that provides a centralized platform for managing patient medical records. Hospitals can sign up, add new medical records for patients (with OTP verification), and view existing records. Patients can sign up, sign in to view their own records, and see which hospitals have accessed their data — promoting **transparency** and **privacy**.

---

## Features

### 🏥 Hospital Management
- **Sign Up** — Register a hospital with name, address, contact number, and privacy password.
- **Sign In** — OTP-based two-step authentication using phone number + privacy password.
- **Add Medical Records** — Add patient records (disease, medicines, dosage, doctor name) after OTP verification of the patient's mobile number.
- **View Patient Records** — Look up any patient's records by mobile number; access is logged.
- **Change Password** — Update the hospital's privacy password from the dashboard.
- **Forgot Password** — Recover privacy password via console log (simulated SMS).

### 👤 Patient
- **Sign Up** — Register with name, age, mobile number, date of birth, and privacy password.
- **Sign In** — OTP-based two-step authentication using mobile number + privacy password.
- **View Medical Records** — View all medical records associated with your account.
- **Hospital Access Log** — See which hospitals have accessed your records, including their name, address, phone number, and the date/time of access.
- **Change Password** — Update privacy password from the patient dashboard.
- **Forgot Password** — Recover privacy password via console log (simulated SMS).

### 🔐 Security
- OTP-based verification for sign-in and record addition.
- Privacy password required for all authentication flows.
- Session tracking to ensure only authorized hospitals can add records.

---

## Tech Stack

| Technology   | Purpose                        |
|-------------|-------------------------------|
| **Node.js**  | Server runtime                 |
| **Express.js** | Web framework & routing     |
| **body-parser** | Parse form data (URL-encoded) |
| **HTML/CSS** | Frontend UI                    |

---

## Project Structure

```
MediHistory--main/
├── app.js                          # Main server file (Express app + all routes)
├── package.json                    # Node.js project metadata & dependencies
├── public/                         # Static frontend files
│   ├── index.html                  # Home page — sign up / sign in options
│   ├── hospital_signup.html        # Hospital registration form
│   ├── hospital_signin.html        # Hospital sign-in (step 1 — enter phone)
│   ├── hospital_signin_otp.html    # Hospital sign-in OTP page
│   ├── patient_signup.html         # Patient registration form
│   ├── patient_signin.html         # Patient sign-in (step 1 — enter phone)
│   ├── patient_signin_otp.html     # Patient sign-in OTP page
│   └── add_record_step1.html       # Add record — enter patient mobile number
└── README.md                       # Project documentation
```

---

## Getting Started

### Prerequisites

- **Node.js** (v14 or above) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/MediHistory.git
   cd MediHistory--main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   node app.js
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## Usage

### Hospital Workflow

1. **Sign Up** → Click "Hospital Management Sign Up" → Fill in hospital name, address, phone number, and privacy password → Submit.
2. **Sign In** → Click "Hospital Management Sign In" → Enter phone number → Receive OTP (printed to server console) → Enter OTP, hospital name, and privacy password.
3. **Add Record** → From the dashboard, click "Add New Record" → Enter patient's mobile number → OTP is sent to patient (console) → Verify OTP → Fill in record details (patient name, disease, medicines, dosage, doctor name) → Submit.
4. **View Records** → Enter a patient's mobile number and click "View Records".

### Patient Workflow

1. **Sign Up** → Click "Patient Sign Up" → Fill in name, age, mobile number, date of birth, and privacy password → Submit.
2. **Sign In** → Click "Patient Sign In" → Enter mobile number → Receive OTP (printed to server console) → Enter OTP, name, and privacy password.
3. **View Records** → After sign-in, all medical records are displayed in a table.
4. **View Access Log** → Below the records, see which hospitals accessed your data and when.

> **⚠️ Note:** OTPs are printed to the **server console** (terminal where `node app.js` is running). Check the terminal to get the OTP value.

---

## API Endpoints

### Authentication

| Method | Endpoint                   | Description                              |
|--------|---------------------------|------------------------------------------|
| POST   | `/patient_signup`          | Register a new patient                   |
| POST   | `/hospital_signup`         | Register a new hospital                  |
| POST   | `/hospital_signin_step1`   | Hospital sign-in — send OTP              |
| POST   | `/hospital_signin_step2`   | Hospital sign-in — verify OTP & password |
| POST   | `/patient_signin_step1`    | Patient sign-in — send OTP               |
| POST   | `/patient_signin_step2`    | Patient sign-in — verify OTP & password  |
| POST   | `/signout`                 | Sign out and clear session               |

### Records Management

| Method | Endpoint               | Description                                  |
|--------|------------------------|----------------------------------------------|
| POST   | `/add_record_step1`     | Navigate to add record page                  |
| POST   | `/send_otp_record`      | Send OTP to patient for record verification  |
| POST   | `/verify_otp_record`    | Verify OTP and show add record form          |
| POST   | `/add_record_step2`     | Submit new medical record                    |
| POST   | `/view_records`         | View patient records by mobile number        |

### Password Management

| Method | Endpoint                    | Description                           |
|--------|----------------------------|---------------------------------------|
| POST   | `/change_patient_password`  | Change patient privacy password       |
| POST   | `/change_hospital_password` | Change hospital privacy password      |
| POST   | `/patient_forgot_password`  | Recover patient password (via console)|
| POST   | `/hospital_forgot_password` | Recover hospital password (via console)|

### Utility

| Method | Endpoint     | Description                |
|--------|-------------|----------------------------|
| POST   | `/send_otp`  | Generic OTP sender         |
| GET    | `/`          | Serve home page            |

---

## Screenshots

### Home Page
The landing page provides four options:
- Hospital Management Sign Up
- Patient Sign Up
- Hospital Management Sign In
- Patient Sign In

---

## Notes & Limitations

- **In-memory storage** — All data (users, records, OTPs, sessions) is stored in memory. Data is lost when the server restarts. For production, integrate a database (e.g., MongoDB, PostgreSQL).
- **Simulated OTP** — OTPs are logged to the server console rather than sent via SMS. Integrate an SMS API (e.g., Twilio) for real OTP delivery.
- **Single session** — The app uses a single global `currentSession` variable, meaning only one user can be signed in at a time. Use proper session management (e.g., `express-session`) for multi-user support.
- **No HTTPS** — The app runs over HTTP. Use HTTPS in production for secure communication.
- **No input validation/sanitization** — Form inputs are used directly. Add validation and sanitization to prevent injection attacks.

---

## Future Improvements

- 🗄️ Database integration (MongoDB / PostgreSQL)
- 📱 Real SMS/OTP delivery via Twilio or similar service
- 🔒 Session management with `express-session` + cookies
- 🛡️ Input validation and sanitization
- 🎨 Improved UI with modern framework (React, etc.)
- 📊 Admin dashboard with analytics
- 📁 File upload support for medical reports (PDFs, images)
- 🔍 Search and filter functionality for records

---

## License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).
