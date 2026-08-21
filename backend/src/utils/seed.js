/* eslint-disable no-console */
// Run with: npm run seed
// Creates one demo teacher and one demo student so you can log in immediately.
const bcrypt = require('bcryptjs');
const repo = require('../db/repository');

async function seed() {
  const existingTeacher = repo.findOne('teachers', (t) => t.email === 'demo.teacher@college.edu');
  if (!existingTeacher) {
    await repo.insert('teachers', {
      email: 'demo.teacher@college.edu',
      name: 'Demo Teacher',
      department: 'Computer Science',
      employeeId: 'TCH-1001',
      passwordHash: await bcrypt.hash('password123', 10),
    });
    console.log('Created demo teacher: demo.teacher@college.edu / password123');
  } else {
    console.log('Demo teacher already exists, skipping.');
  }

  const existingStudent = repo.findOne('students', (s) => s.rollNumber === 'CSE5001');
  if (!existingStudent) {
    await repo.insert('students', {
      rollNumber: 'CSE5001',
      name: 'Demo Student',
      department: 'Computer Science',
      semester: '5th Semester',
      passwordHash: await bcrypt.hash('password123', 10),
    });
    console.log('Created demo student: CSE5001 / password123');
  } else {
    console.log('Demo student already exists, skipping.');
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
