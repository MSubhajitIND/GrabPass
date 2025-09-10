# 🎟️ GrabPass

**GrabPass** is a full-stack **event booking and ticketing system** with:
- Admin dashboard to create/manage events
- Online registration with secure payments
- Automatic ticket generation (QR + PDF via email)
- Staff mobile app for scanning/verifying tickets at entry

> Built with **React (Vite)** + **Express/Node.js** + **MongoDB** + **React Native (Expo)**.

---

## 📌 Problem It Solves
Event organizers often struggle with:
- ❌ Manual registration (spreadsheets / paper forms)
- ❌ Offline payments, hard to track
- ❌ Fake or duplicated tickets
- ❌ Slow entry check-in
- ❌ No unified dashboard for events

**GrabPass** provides:
- ✅ Online event booking & secure payment
- ✅ Digital ticket with QR code & PDF
- ✅ Admin dashboard with participant details
- ✅ Mobile app for staff to scan/verify tickets
- ✅ Faster, safer, and smarter event management

---

## ✨ Features
### 👩‍💻 Admin Panel (Web)
- Create events (title, description, banner, seats, price, schedule)
- Edit/Delete events
- View participants (name, student ID, department, email, payment status)
- Manage staff accounts
- Copy public registration link

### 🧑‍🎓 User (Web)
- Browse events
- Register with details (name, email, student code, department)
- Pay via Razorpay (demo/test integration)
- Receive confirmation email with **QR ticket** + **PDF ticket**

### 📱 Staff App (Mobile)
- Staff/Admin login
- View assigned events
- Verify tickets:
  - ✅ Valid → Entry allowed (shows participant details)
  - ⚠️ Already used → Marked as checked-in
  - ❌ Invalid → Blocked
- View full participant list

---

## 🛠️ Tech Stack
### Frontend (Web)
- React + Vite
- Tailwind (with dark/light mode)
- Axios (API calls)

### Backend (Server)
- Node.js + Express
- MongoDB Atlas (Mongoose ODM)
- JWT for authentication & ticket tokens
- bcrypt for password hashing
- Razorpay SDK (payments)
- Nodemailer + PDFKit + qrcode (email + tickets)

### Mobile (Expo / React Native)
- Expo Router + React Navigation
- AsyncStorage (local token storage)
- Axios (API client)
- Dark/Light mode support

### Hosting
- Backend → Render (Web Service)
- Frontend → Render (Static Site)
- Database → MongoDB Atlas
- Mobile → Expo Go / EAS Build

---
