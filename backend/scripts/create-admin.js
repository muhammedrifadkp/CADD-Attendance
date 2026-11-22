#!/usr/bin/env node
/**
 * Creates the first admin account in your database (uses MONGO_URI from backend/.env).
 *
 *   cd backend
 *   node scripts/create-admin.js "Your Name" you@example.com
 *
 * It asks for the password without showing it (or reads ADMIN_PASSWORD if set).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/userModel');

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

async function main() {
  const [name, email] = process.argv.slice(2);
  if (!name || !email) {
    console.error('Usage: node scripts/create-admin.js "Your Name" you@example.com');
    process.exit(1);
  }
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Copy backend/.env.example to backend/.env first.');
    process.exit(1);
  }

  const password = process.env.ADMIN_PASSWORD || await askHidden('Password (at least 8 characters): ');
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  if (await User.findOne({ email: email.toLowerCase().trim() })) {
    console.error(`A user with ${email} already exists.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  await User.create({ name, email, password, role: 'admin' });
  console.log(`Admin ${email} created. You can sign in now.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message);
  await mongoose.disconnect();
  process.exit(1);
});
