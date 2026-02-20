import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import SchoolConfig from '../models/SchoolConfig';
import User from '../models/User';
import Student from '../models/Student';
import Staff from '../models/Staff';
import { Request, LeaveBalance, ApproverSetting } from '../models/Request';
import Parent from '../models/Parent';
import Attendance from '../models/Attendance';

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clean all collections
    await SchoolConfig.deleteMany({});
    await User.deleteMany({});
  await Student.deleteMany({});
  await Staff.deleteMany({});
  await Request.deleteMany({});
  await LeaveBalance.deleteMany({});
  await ApproverSetting.deleteMany({});
  await Parent.deleteMany({});
  console.log('🗑️  Cleaned existing data');

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
    { firstName: 'Peter', lastName: 'Otieno', designation: 'Teacher', department: 'Sciences', role: 'class_teacher', subjectsTaught: ['Mathematics', 'Physics'], classTeacherOf: 'Form 1 East' },
    { firstName: 'Grace', lastName: 'Mwangi', designation: 'Teacher', department: 'Languages', role: 'subject_teacher', subjectsTaught: ['English', 'Literature'] },
    { firstName: 'David', lastName: 'Kipchoge', designation: 'Teacher', department: 'Humanities', role: 'subject_teacher', subjectsTaught: ['History', 'CRE'] },
    { firstName: 'Ann', lastName: 'Chebet', designation: 'HOD Sciences', department: 'Sciences', role: 'hod', subjectsTaught: ['Biology', 'Chemistry'], hodOf: 'Sciences' },
    { firstName: 'Sarah', lastName: 'Mutua', designation: 'Medical Officer', department: 'Medical', role: 'medical_officer', subjectsTaught: [] },
    { firstName: 'John', lastName: 'Omondi', designation: 'Counselor', department: 'Guidance', role: 'counselor', subjectsTaught: [] },
    { firstName: 'Lucy', lastName: 'Njeri', designation: 'Librarian', department: 'Library', role: 'librarian', subjectsTaught: [] },
    { firstName: 'Michael', lastName: 'Wekesa', designation: 'Deputy Principal', department: 'Administration', role: 'deputy_principal', subjectsTaught: [] },
  ];

  const createdStaff: any[] = [];

  for (let i = 0; i < staffData.length; i++) {
    const s = staffData[i];
    const staff = await Staff.create({
      ...s,
      staffId: `STF-${String(i + 3).padStart(4, '0')}`, // Start from 0003
      schoolId: school._id,
      dateOfBirth: new Date('1985-01-01'),
      gender: i % 2 === 0 ? 'male' : 'female',
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
      role: s.role,
      schoolId: school._id,
      profileId: staff._id,
      profileModel: 'Staff',
    });

    // Link userId to staff record
    staff.userId = user._id;
    await staff.save();
    
    createdStaff.push({ staff, user });
  }

  console.log(`✅ Created ${staffData.length} staff members`);

  // Create students
  const classes = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];
  const streams = ['East', 'West', 'North'];
  const firstNames = ['Alice', 'Bob', 'Carol', 'Dan', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
  const lastNames = ['Kamau', 'Otieno', 'Wanjiku', 'Mwangi', 'Odhiambo', 'Kipchoge', 'Auma', 'Njoroge'];

  let studentCount = 0;
  const createdStudents: any[] = [];

  for (const cls of classes) {
    for (const stream of streams) {
      for (let i = 0; i < 10; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        studentCount++;
        const student = await Student.create({
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
        createdStudents.push(student);
      }
    }
  }

  console.log(`✅ Created ${studentCount} students`);

  // Create Leave Balances for all staff
  console.log('📋 Creating leave balances...');
  const allStaff = [
    { staff: principalStaff, user: principal },
    { staff: financeStaff, user: financeUser },
    ...createdStaff
  ];

  for (const { staff, user } of allStaff) {
    await LeaveBalance.create({
      schoolId: school._id,
      staffId: staff._id,
      academicYear: '2025',
      annual: { total: 30, used: Math.floor(Math.random() * 10), remaining: 30 - Math.floor(Math.random() * 10) },
      sick: { total: 14, used: Math.floor(Math.random() * 5), remaining: 14 - Math.floor(Math.random() * 5) },
      maternity: { total: 90, used: 0, remaining: 90 },
      paternity: { total: 14, used: 0, remaining: 14 },
      compassionate: { total: 7, used: 0, remaining: 7 },
      unpaid: { total: 999, used: 0, remaining: 999 },
    });
  }
  console.log(`✅ Created leave balances for ${allStaff.length} staff`);

  // Create Approver Settings
  console.log('👥 Creating approver settings...');
  // Principal approves deputy, finance, and HODs
  for (const { staff, user } of createdStaff) {
    if (['deputy_principal', 'hod', 'finance_officer'].includes(user.role)) {
      await ApproverSetting.create({
        schoolId: school._id,
        subjectId: staff._id,
        subjectModel: 'Staff',
        requestType: 'all',
        approverId: principal._id,
        isActive: true,
      });
    }
  }

  // Deputy principal approves teachers
  const deputyPrincipal = createdStaff.find(s => s.user.role === 'deputy_principal');
  if (deputyPrincipal) {
    for (const { staff, user } of createdStaff) {
      if (['class_teacher', 'subject_teacher', 'counselor', 'librarian'].includes(user.role)) {
        await ApproverSetting.create({
          schoolId: school._id,
          subjectId: staff._id,
          subjectModel: 'Staff',
          requestType: 'all',
          approverId: deputyPrincipal.user._id,
          isActive: true,
        });
      }
    }
  }

  console.log('✅ Created approver settings');

  // Create Requests
  console.log('📝 Creating sample requests...');
  const requestTypes = ['leave', 'medical', 'permission'];
  const leaveTypes = ['annual', 'sick', 'compassionate'];
  const statuses = ['pending', 'approved', 'rejected'];

  // Create leave requests from staff
  for (let i = 0; i < 15; i++) {
    const randomStaff = allStaff[Math.floor(Math.random() * allStaff.length)];
    const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const startDate = new Date('2025-03-01');
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

    const requestData: any = {
      schoolId: school._id,
      requestType,
      requestFor: 'self',
      requestedBy: randomStaff.user._id,
      subjectId: randomStaff.staff._id,
      subjectModel: 'Staff',
      status,
      approverId: principal._id,
      startDate,
      endDate,
      days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      priority: 'medium',
    };

    if (requestType === 'leave') {
      requestData.leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
      requestData.title = `${requestData.leaveType.charAt(0).toUpperCase() + requestData.leaveType.slice(1)} Leave Request`;
      requestData.description = `I would like to request ${requestData.leaveType} leave for personal matters.`;
    } else if (requestType === 'medical') {
      requestData.title = 'Medical Request';
      requestData.description = 'Medical checkup required';
      requestData.medicalReason = 'Routine checkup';
    } else {
      requestData.title = 'Permission Request';
      requestData.description = 'Permission to attend workshop';
    }

    if (status !== 'pending') {
      requestData.reviewedAt = new Date();
      requestData.reviewerNotes = status === 'approved' ? 'Approved' : 'Not available at this time';
    }

    await Request.create(requestData);
  }

  // Create medical requests for students (from medical officer)
  const medicalOfficer = createdStaff.find(s => s.user.role === 'medical_officer');
  if (medicalOfficer) {
    for (let i = 0; i < 10; i++) {
      const randomStudent = createdStudents[Math.floor(Math.random() * createdStudents.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await Request.create({
        schoolId: school._id,
        requestType: 'medical',
        requestFor: 'student',
        requestedBy: medicalOfficer.user._id,
        subjectId: randomStudent._id,
        subjectModel: 'Student',
        status,
        approverId: principal._id,
        title: 'Student Medical Request',
        description: 'Student requires medical attention',
        medicalReason: 'Flu symptoms',
        symptoms: 'Fever, headache, cough',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        days: 2,
        priority: 'high',
        reviewedAt: status !== 'pending' ? new Date() : undefined,
        reviewerNotes: status !== 'pending' ? (status === 'approved' ? 'Approved for medical leave' : 'Parent to handle at home') : undefined,
      });
    }
  }

  console.log('✅ Created 25 sample requests');

  // Create Parents
  console.log('👨‍👩‍👧‍👦 Creating parent records...');
  const parentCount = Math.min(50, createdStudents.length);
  for (let i = 0; i < parentCount; i++) {
    const student = createdStudents[i];
    const parent = await Parent.create({
      schoolId: school._id,
      firstName: student.father?.name?.split(' ')[0] || 'John',
      lastName: student.lastName,
      email: `parent${i + 1}@gmail.com`,
      phone: student.father?.phone || `+254700${String(i).padStart(6, '0')}`,
      idNumber: `ID${String(10000000 + i).padStart(8, '0')}`,
      relationship: 'father',
      occupation: ['Engineer', 'Doctor', 'Teacher', 'Businessman', 'Farmer'][Math.floor(Math.random() * 5)],
      residentialAddress: student.residentialAddress,
      children: [student._id],
      emergencyContact: {
        name: `${student.lastName} Spouse`,
        phone: `+254700${String(i + 1000).padStart(6, '0')}`,
        relationship: 'Spouse',
      },
    });

    // Create user account for parent
    await User.create({
      firstName: parent.firstName,
      lastName: parent.lastName,
      email: parent.email,
      password: 'Parent1234',
      role: 'parent',
      schoolId: school._id,
      profileId: parent._id,
      profileModel: 'Parent',
    });
  }

  console.log('\n🎉 Seed complete!');
  console.log('\n📧 Login credentials:');
  console.log('  Principal:        principal@greenfield.ac.ke / Admin1234');
  console.log('  Deputy Principal: michael@greenfield.ac.ke / Teacher1234');
  console.log('  Finance Officer:  finance@greenfield.ac.ke / Finance1234');
  console.log('  Teacher:          peter@greenfield.ac.ke / Teacher1234');
  console.log('  Medical Officer:  sarah@greenfield.ac.ke / Teacher1234');
  console.log('  Counselor:        john@greenfield.ac.ke / Teacher1234');
  console.log('  Parent:           parent1@gmail.com / Parent1234');
  console.log('\n📊 Summary:');
  console.log(`  - ${allStaff.length} Staff members`);
  console.log(`  - ${studentCount} Students`);
  console.log(`  - ${parentCount} Parents`);
  console.log(`  - 25 Sample requests`);
  console.log(`  - Leave balances for all staff`);
  console.log(`  - Approver settings configured`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('\n❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
