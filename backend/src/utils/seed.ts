import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import SchoolConfig from '../models/SchoolConfig';
import User from '../models/User';
import Student from '../models/Student';
import Staff from '../models/Staff';

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clean
  await SchoolConfig.deleteMany({});
  await User.deleteMany({});
  await Student.deleteMany({});
  await Staff.deleteMany({});

  // Create school
  const school = await SchoolConfig.create({
    name: 'Greenfield High School',
    code: 'GHS',
    motto: 'Excellence in All We Do',
    address: 'P.O Box 1234, Nairobi',
    phone: '+254700000000',
    email: 'info@greenfield.ac.ke',
    website: 'https://greenfield.ac.ke',
    type: 'mixed',
    curriculum: 'KCSE',
    country: 'Kenya',
    county: 'Nairobi',
    classLevels: ['Form 1', 'Form 2', 'Form 3', 'Form 4'],
    feeItems: [
      { name: 'Tuition Fee', code: 'TF', amount: 15000, classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'], terms: [1, 2, 3], isOptional: false },
      { name: 'Activity Fee', code: 'AF', amount: 2000, classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'], terms: [1, 2, 3], isOptional: false },
      { name: 'Boarding Fee', code: 'BF', amount: 25000, classes: ['Form 1', 'Form 2', 'Form 3', 'Form 4'], terms: [1, 2, 3], isOptional: true },
    ],
    academicYears: [{
      year: '2025',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isCurrent: true,
      terms: [
        { termNumber: 1, name: 'Term 1', startDate: new Date('2025-01-07'), endDate: new Date('2025-04-04') },
        { termNumber: 2, name: 'Term 2', startDate: new Date('2025-05-05'), endDate: new Date('2025-07-25') },
        { termNumber: 3, name: 'Term 3', startDate: new Date('2025-09-01'), endDate: new Date('2025-11-14') },
      ],
    }],
  });

  console.log(`✅ School created: ${school.name}`);

  // Create principal user and staff record
  const principalStaff = await Staff.create({
    firstName: 'James',
    lastName: 'Kamau',
    staffId: 'STF-0001',
    schoolId: school._id,
    dateOfBirth: new Date('1975-01-01'),
    gender: 'male',
    idNumber: '12345678',
    phone: '+254700000001',
    email: 'principal@greenfield.ac.ke',
    designation: 'Principal',
    department: 'Administration',
    subjectsTaught: [],
    employmentDate: new Date('2015-01-01'),
    employmentType: 'permanent',
    homeAddress: 'Nairobi',
    emergencyContact: { name: 'Spouse', relationship: 'Spouse', phone: '+254700000002' },
    leaveBalances: [
      { type: 'Annual', total: 21, used: 0, remaining: 21 },
      { type: 'Sick', total: 10, used: 0, remaining: 10 },
    ],
  });

  const principal = await User.create({
    firstName: 'James',
    lastName: 'Kamau',
    email: 'principal@greenfield.ac.ke',
    password: 'Admin1234',
    role: 'principal',
    schoolId: school._id,
    profileId: principalStaff._id,
    profileModel: 'Staff',
  });

  // Link userId to staff record
  principalStaff.userId = principal._id;
  await principalStaff.save();

  // Create finance officer user and staff record
  const financeStaff = await Staff.create({
    firstName: 'Mary',
    lastName: 'Wanjiku',
    staffId: 'STF-0002',
    schoolId: school._id,
    dateOfBirth: new Date('1980-01-01'),
    gender: 'female',
    idNumber: '23456789',
    phone: '+254700000003',
    email: 'finance@greenfield.ac.ke',
    designation: 'Finance Officer',
    department: 'Finance',
    subjectsTaught: [],
    employmentDate: new Date('2018-01-01'),
    employmentType: 'permanent',
    homeAddress: 'Nairobi',
    emergencyContact: { name: 'Spouse', relationship: 'Spouse', phone: '+254700000004' },
    leaveBalances: [
      { type: 'Annual', total: 21, used: 3, remaining: 18 },
      { type: 'Sick', total: 10, used: 1, remaining: 9 },
    ],
  });

  const financeUser = await User.create({
    firstName: 'Mary',
    lastName: 'Wanjiku',
    email: 'finance@greenfield.ac.ke',
    password: 'Finance1234',
    role: 'finance_officer',
    schoolId: school._id,
    profileId: financeStaff._id,
    profileModel: 'Staff',
  });

  // Link userId to staff record
  financeStaff.userId = financeUser._id;
  await financeStaff.save();

  // Create some staff
  const staffData = [
    { firstName: 'Peter', lastName: 'Otieno', designation: 'Teacher', department: 'Sciences', subjectsTaught: ['Mathematics', 'Physics'], classTeacherOf: 'Form 1 East' },
    { firstName: 'Grace', lastName: 'Mwangi', designation: 'Teacher', department: 'Languages', subjectsTaught: ['English', 'Literature'] },
    { firstName: 'David', lastName: 'Kipchoge', designation: 'Teacher', department: 'Humanities', subjectsTaught: ['History', 'CRE'] },
    { firstName: 'Ann', lastName: 'Chebet', designation: 'HOD Sciences', department: 'Sciences', subjectsTaught: ['Biology', 'Chemistry'], hodOf: 'Sciences' },
  ];

  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i];
    const staff = await Staff.create({
      ...s,
      staffId: `STF-${String(i + 3).padStart(4, '0')}`, // Start from 0003
      schoolId: school._id,
      dateOfBirth: new Date('1985-01-01'),
      gender: 'male',
      idNumber: `3456789${i}`,
      phone: `+25470000001${i}`,
      email: `${s.firstName.toLowerCase()}@greenfield.ac.ke`,
      homeAddress: 'Nairobi',
      employmentDate: new Date('2020-01-01'),
      employmentType: 'permanent',
      emergencyContact: { name: 'Spouse', relationship: 'Spouse', phone: '+254700000001' },
      leaveBalances: [
        { type: 'Annual', total: 21, used: 5, remaining: 16 },
        { type: 'Sick', total: 10, used: 2, remaining: 8 },
      ],
    });

    const user = await User.create({
      firstName: s.firstName,
      lastName: s.lastName,
      email: `${s.firstName.toLowerCase()}@greenfield.ac.ke`,
      password: 'Teacher1234',
      role: 'subject_teacher',
      schoolId: school._id,
      profileId: staff._id,
      profileModel: 'Staff',
    });

    // Link userId to staff record
    staff.userId = user._id;
    await staff.save();
  }

  // Create students
  const classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
  const streams = ['East', 'West', 'North'];
  const firstNames = ['Alice', 'Bob', 'Carol', 'Dan', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
  const lastNames = ['Kamau', 'Otieno', 'Wanjiku', 'Mwangi', 'Odhiambo', 'Kipchoge', 'Auma', 'Njoroge'];

  let studentCount = 0;
  for (const cls of classes) {
    for (const stream of streams) {
      for (let i = 0; i < 10; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        studentCount++;
        await Student.create({
          admissionNumber: `GHS-2024-${String(studentCount).padStart(4, '0')}`,
          schoolId: school._id,
          firstName: fn,
          lastName: ln,
          dateOfBirth: new Date(`${2005 + Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`),
          gender: Math.random() > 0.5 ? 'male' : 'female',
          currentClass: cls,
          currentStream: `${cls} ${stream}`,
          admissionDate: new Date('2024-01-07'),
          yearOfJoining: 2024,
          status: 'active',
          residentialAddress: 'Nairobi, Kenya',
          father: { name: `Mr ${ln}`, phone: `+25470000${String(studentCount).padStart(4, '0')}` },
          primaryContactType: 'father',
          emergencyContacts: [{ name: `Mr ${ln}`, relationship: 'Father', phone: `+25470000${String(studentCount).padStart(4, '0')}` }],
        });
      }
    }
  }

  console.log(`✅ Created ${studentCount} students`);
  console.log('\n🎉 Seed complete!');
  console.log('\n📧 Login credentials:');
  console.log('  Principal: principal@greenfield.ac.ke / Admin1234');
  console.log('  Finance:   finance@greenfield.ac.ke / Finance1234');
  console.log('  Teacher:   peter@greenfield.ac.ke / Teacher1234');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
