#!/usr/bin/env node
/**
 * Fills an EMPTY local database with made-up demo data so you can try the app.
 *
 *   cd backend
 *   node scripts/seed-demo.js
 *
 * Every person, email and phone number below is invented.
 * Safety: it only runs against a local MongoDB (localhost / 127.0.0.1) and only when the
 * database has no users yet. Pass --reset to wipe a LOCAL database first.
 * Never run this against your real database.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../models/userModel');
const Department = require('../models/departmentModel');
const Course = require('../models/courseModel');
const Batch = require('../models/batchModel');
const Student = require('../models/studentModel');
const PC = require('../models/pcModel');
const Attendance = require('../models/attendanceModel');

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@12345';
const RESET = process.argv.includes('--reset');

function isLocal(uri) {
  return /^mongodb:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//.test(uri || '');
}

const FIRST = ['Aisha', 'Arjun', 'Fathima', 'Rahul', 'Meera', 'Nihal', 'Sneha', 'Adil', 'Diya', 'Kiran', 'Hiba', 'Varun'];
const LAST = ['K', 'Nair', 'P', 'Menon', 'S', 'Rahman', 'Das', 'Joseph', 'M', 'Pillai', 'T', 'Varghese'];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!isLocal(uri)) {
    console.error('Refusing to run: MONGO_URI must point to a local MongoDB (mongodb://localhost:27017/...).');
    process.exit(1);
  }
  await mongoose.connect(uri);

  if (RESET) {
    await mongoose.connection.db.dropDatabase();
    console.log('Local database wiped.');
  } else if (await User.countDocuments()) {
    console.error('This database already has users. Use --reset to wipe this LOCAL database first.');
    process.exit(1);
  }

  const admin = await User.create({
    name: 'Demo Admin', email: 'admin@example.com', password: DEMO_PASSWORD, role: 'admin',
  });

  const [cs, des] = await Department.create([
    { name: 'Computer Science', code: 'CS', description: 'Programming and web development', createdBy: admin._id },
    { name: 'Design', code: 'DES', description: 'Graphic design and CAD', createdBy: admin._id },
  ]);

  const teachers = [];
  for (const t of [
    { name: 'Anil Kumar', email: 'teacher@example.com', department: cs._id, employeeId: 'CS-001', specialization: 'Web development' },
    { name: 'Sara Thomas', email: 'sara@example.com', department: des._id, employeeId: 'DES-001', specialization: 'Graphic design' },
  ]) {
    teachers.push(await User.create({ ...t, password: DEMO_PASSWORD, role: 'teacher' }));
  }

  const [web, graphics] = await Course.create([
    {
      name: 'Full Stack Web Development', code: 'FSWD', department: cs._id, level: 'Intermediate',
      category: 'Web Development', duration: { months: 6, hours: 240 }, fees: { amount: 25000 },
      createdBy: admin._id,
    },
    {
      name: 'Graphic Design Essentials', code: 'GDE', department: des._id, level: 'Beginner',
      category: 'Graphics', duration: { months: 3, hours: 120 }, fees: { amount: 12000 },
      createdBy: admin._id,
    },
  ]);

  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  const year = `${start.getFullYear()}-${String(start.getFullYear() + 1).slice(2)}`;
  const [webBatch, gfxBatch] = await Batch.create([
    { name: 'FSWD Morning', course: web._id, academicYear: year, section: 'A', timing: '09:00 AM - 10:30 AM', startDate: start, createdBy: teachers[0]._id },
    { name: 'GDE Afternoon', course: graphics._id, academicYear: year, section: 'A', timing: '02:00 PM - 03:30 PM', startDate: start, createdBy: teachers[1]._id },
  ]);

  const students = [];
  for (let i = 0; i < 12; i++) {
    const inWeb = i < 7;
    students.push(await Student.create({
      name: `${FIRST[i]} ${LAST[i]}`,
      rollNo: `${inWeb ? 'FSWD' : 'GDE'}-${String(i + 1).padStart(3, '0')}`,
      email: `student${i + 1}@example.com`,
      phone: `90000000${String(i + 10)}`,
      department: inWeb ? cs._id : des._id,
      course: inWeb ? web._id : graphics._id,
      batch: inWeb ? webBatch._id : gfxBatch._id,
      totalFees: inWeb ? 25000 : 12000,
    }));
  }

  const pcs = [];
  for (let row = 1; row <= 4; row++) {
    for (let pos = 1; pos <= 5; pos++) {
      pcs.push({ pcNumber: `PC-${String((row - 1) * 5 + pos).padStart(2, '0')}`, row: String(row), position: pos });
    }
  }
  await PC.create(pcs);

  // Ten weekdays of attendance with a realistic mix
  const records = [];
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  let added = 0;
  while (added < 10) {
    day.setDate(day.getDate() - 1);
    if (day.getDay() === 0) continue; // skip Sundays
    added++;
    students.forEach((s, i) => {
      const roll = (i * 7 + added * 3) % 10;
      records.push({
        student: s._id,
        batch: s.batch,
        date: new Date(day),
        status: roll < 7 ? 'present' : roll < 9 ? 'absent' : 'late',
        markedBy: String(s.batch) === String(webBatch._id) ? teachers[0]._id : teachers[1]._id,
      });
    });
  }
  await Attendance.insertMany(records);

  console.log('\nDemo data ready (all made up):');
  console.log('  2 departments, 2 teachers, 2 courses, 2 batches, 12 students, 20 PCs, 10 days of attendance');
  console.log('\nDemo sign-ins (local only):');
  console.log(`  Admin:   admin@example.com   / ${DEMO_PASSWORD}`);
  console.log(`  Teacher: teacher@example.com / ${DEMO_PASSWORD}   (or Employee ID CS-001)`);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  });
}

module.exports = { isLocal };
