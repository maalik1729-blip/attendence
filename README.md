# Employee Attendance App

Full-stack Employee Attendance application with face-based check-in.

- **Backend:** Node.js + Express + MongoDB + Cloudinary + JWT + Nodemailer
- **Frontend:** Expo (React Native) + React Navigation
- **Face check:** face-api.js descriptor comparison (enrollment on first attendance)

## Structure

```
hotel/
├── backend/          # Express API (REST)
│   ├── src/
│   ├── .env.example
│   └── package.json
├── frontend/         # Expo React Native client
│   ├── src/
│   ├── App.js
│   └── package.json
├── .github/workflows # CI/CD
├── SECURITY_AUDIT.md
└── UPGRADE_IDEAS.md
```

## Quick start

### Backend
```bash
cd backend
cp .env.example .env   # fill values
npm install
npm run seed:admin     # creates admin (mobile 1234567890 / pass 0987654321)
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start              # then scan QR in Expo Go
```

Set the API base URL in `frontend/src/config.js`.

## Admin credentials (seeded)
- Mobile: `1234567890`
- Password: `0987654321`

## Flow
1. Employee registers (first name, last name, username, mobile, email).
2. Request sent to admin — admin approves / rejects.
3. On approval, a dynamic password is generated and emailed to the employee.
4. Employee logs in, is forced to change password on first login (Profile screen).
5. Employee marks attendance: tab bar center icon opens the camera → photo → face validated → attendance recorded.
6. Home & Reports show the employee's attendance history; admin sees full stats.
