import bcrypt from 'bcryptjs';
import db from './backend/models/database.ts';
import crypto from 'crypto';

export async function seed() {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    if (userCount && userCount.count > 0) return;
  } catch (err) {
    console.error('Check users table failed, continuing to seed...', err);
  }

  console.log('Seeding database with multi-tier users...');

  const now = new Date().toISOString();

  // 1. Student
<<<<<<< HEAD
  const studentId = 'student-1234';
  const studentHashed = await bcrypt.hash('1234', 10);
  db.prepare('INSERT INTO users (id, fullName, role, dateOfBirth, is_verified, createdAt) VALUES (?, ?, ?, ?, 1, ?)')
=======
  const studentId = crypto.randomUUID();
  const studentHashed = await bcrypt.hash('1234', 10);
  db.prepare('INSERT INTO users (id, fullName, role, dateOfBirth, is_verified, is_approved, createdAt) VALUES (?, ?, ?, ?, 1, 1, ?)')
>>>>>>> master
    .run(studentId, 'John Student', 'student', '2000-01-01', now);
  db.prepare('INSERT INTO access_credentials (user_id, hashed_code) VALUES (?, ?)')
    .run(studentId, studentHashed);

  // 2. Staff (Teacher)
<<<<<<< HEAD
  const staffId = 'staff-5678';
  const staffHashed = await bcrypt.hash('staff123', 10);
  db.prepare('INSERT INTO users (id, fullName, role, email, is_verified, createdAt) VALUES (?, ?, ?, ?, 1, ?)')
=======
  const staffId = crypto.randomUUID();
  const staffHashed = await bcrypt.hash('staff123', 10);
  db.prepare('INSERT INTO users (id, fullName, role, email, is_verified, is_approved, createdAt) VALUES (?, ?, ?, ?, 1, 1, ?)')
>>>>>>> master
    .run(staffId, 'Alice Teacher', 'staff', 'alice@school.edu', now);
  db.prepare('INSERT INTO access_credentials (user_id, hashed_code) VALUES (?, ?)')
    .run(staffId, staffHashed);

  // 3. Admin (Headmaster)
<<<<<<< HEAD
  const adminId = 'admin-9999';
  const adminHashed = await bcrypt.hash('admin123', 10);
  db.prepare('INSERT INTO users (id, fullName, role, email, is_verified, createdAt) VALUES (?, ?, ?, ?, 1, ?)')
=======
  const adminId = crypto.randomUUID();
  const adminHashed = await bcrypt.hash('admin123', 10);
  db.prepare('INSERT INTO users (id, fullName, role, email, is_verified, is_approved, createdAt) VALUES (?, ?, ?, ?, 1, 1, ?)')
>>>>>>> master
    .run(adminId, 'Robert Headmaster', 'admin', 'robert@school.edu', now);
  db.prepare('INSERT INTO access_credentials (user_id, hashed_code) VALUES (?, ?)')
    .run(adminId, adminHashed);

  console.log('--- SEED DATA ---');
  console.log('Student: 2000-01-01 / 1234');
  console.log('Staff: alice@school.edu / staff123');
  console.log('Admin: robert@school.edu / admin123');
}
