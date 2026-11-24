<p align="center">
  <img src="frontend/public/icons/icon.svg" width="88" alt="Lab Attendance logo" />
</p>

<h1 align="center">Lab Attendance</h1>

<p align="center">
  Free, open-source attendance and computer-lab booking for training institutes and colleges.<br/>
  React + Express + MongoDB · works offline as an installable app · MIT licensed
</p>

<p align="center">
  <a href="https://github.com/muhammedrifadkp/CADD-Attendance/actions/workflows/ci.yml"><img src="https://github.com/muhammedrifadkp/CADD-Attendance/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" /></a>
</p>

---

Many small training institutes still take attendance on paper and juggle lab PCs on a whiteboard.
Lab Attendance gives admins and teachers one place for students, batches, daily attendance and lab
bookings, and it keeps working when the internet drops.

It started as the attendance system for a computer training centre in Kerala, India, and is now
generic: your institute's name, logo and departments are all settings.

## Features

**Attendance**
- Mark a batch present / absent / late in a few taps, including for a past date
- Calendar view and per-batch and per-student reports
- Export reports to Excel and CSV

**Lab and PCs**
- Lay out your lab's PCs by row and position, with status (active / maintenance / inactive)
- Book PCs for batches by time slot, copy the previous day's bookings, clear slots
- Live availability view for teachers and a maintenance page for admins

**Institute set-up**
- Departments, courses, batches and students, with your own names and codes
- Two roles: **admin** (everything) and **teacher** (their own batches and students)
- Teachers get an Employee ID from their department code (e.g. `CS-001`) and can sign in with it
- Optional welcome email with login details for new teachers (Gmail or any SMTP)
- Dashboard with attendance trends and analytics

**Offline and security**
- Installable PWA; attendance marked offline is saved in the browser and synced later
- JWT access + refresh tokens in httpOnly cookies, bcrypt passwords, account lock after failed sign-ins
- Rate limiting (Redis optional) and Helmet security headers

## Quick start (try it locally)

You need **Node.js 18+** and **MongoDB** running locally (or use a free MongoDB Atlas cluster).

```bash
git clone https://github.com/muhammedrifadkp/CADD-Attendance.git lab-attendance
cd lab-attendance
npm run install-all

cp backend/.env.example backend/.env      # then set JWT_SECRET and JWT_REFRESH_SECRET
npm run seed:demo                         # made-up demo data, local MongoDB only
npm run dev
```

Open http://localhost:5173. The seed prints the demo sign-ins (`admin@example.com` and
`teacher@example.com`). The demo seed refuses to run against anything but a local, empty database.

## Set it up for your institute

1. **Database**: put your MongoDB connection string in `backend/.env` as `MONGO_URI`.
2. **Secrets**: set long random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`.
3. **First admin**:
   ```bash
   cd backend
   node scripts/create-admin.js "Your Name" you@yourinstitute.com
   ```
4. **Branding**: copy `frontend/.env.example` to `frontend/.env.local` (or set these in your host):

   | Variable | Example |
   |---|---|
   | `VITE_INSTITUTE_NAME` | `Sunrise Computer Academy` |
   | `VITE_INSTITUTE_SHORT_NAME` | `SCA` (headers and splash screen) |
   | `VITE_LOGO_URL` | `/logos/my-logo.png` (put the file in `frontend/public/logos/`) |
   | `VITE_APP_NAME` | `SCA Attendance` |

   On the backend, `APP_NAME` and `INSTITUTE_NAME` are used in emails.
5. **Departments**: sign in as admin and add your departments. The department **code** becomes the
   prefix of its teachers' Employee IDs.
6. **Email (optional)**: see [docs/dev-notes/EMAIL_SETUP_GUIDE.md](docs/dev-notes/EMAIL_SETUP_GUIDE.md).

## Deploy

The repo is set up for the frontend on **Vercel** and the backend on **Render** (both have free
plans), with **MongoDB Atlas** for the database.

- **Frontend (Vercel)**: root `frontend`, build `npm run build`, output `dist`. Set `VITE_API_URL`
  to your backend URL plus `/api`, and the branding variables above.
- **Backend (Render)**: root `backend`, start `npm start`. Set the variables from
  `backend/.env.example`, and set `FRONTEND_URL` to your frontend's address (or `CORS_ORIGINS`,
  comma-separated) so the browser may call the API.

More detail: [docs/dev-notes/BUILD_CONFIGURATION.md](docs/dev-notes/BUILD_CONFIGURATION.md).

## Project structure

```
backend/    Express API: models, controllers, routes, middleware, scripts/
frontend/   React 18 + Vite + Tailwind PWA (src/config/branding.js holds the branding)
docs/       Development notes
```

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup and checks
(`cd backend && npm test` runs the API tests without a database). Good first areas:

- Screenshots and a hosted demo for this README
- More API tests, especially ones that use a test database
- Translations (Malayalam, Hindi, Arabic, ...)
- Configurable batch timings and lab rows (currently fixed in the models)

Please open an issue before a large change so we can agree on the approach.

## License

[MIT](LICENSE) © Muhammed Rifad KP
