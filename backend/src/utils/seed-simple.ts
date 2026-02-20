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

    // Create principal staff record
    console.log('Creating principal staff...');
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
    });

    console.log('Creating principal user...');
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

    principalStaff.userId = principal._id;
    await principalStaff.save();
    console.log('✅ Principal created');

    console.log('\n🎉 Simple seed complete!');
    console.log('\n📧 Login: principal@greenfield.ac.ke / Admin1234');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();
