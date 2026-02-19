import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../config/database';
import SchoolConfig from '../models/SchoolConfig';
import User from '../models/User';

const createUsers = async () => {
  try {
    await connectDB();
    console.log('🌱 Creating users...');

    // Get or create school
    let school = await SchoolConfig.findOne({});
    
    if (!school) {
      school = await SchoolConfig.create({
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
      });
      console.log(`✅ School created: ${school.name}`);
    } else {
      console.log(`✅ Using existing school: ${school.name}`);
    }

    // Delete existing users to avoid duplicates
    await User.deleteMany({ email: { $in: ['principal@greenfield.ac.ke', 'finance@greenfield.ac.ke', 'peter@greenfield.ac.ke'] } });

    // Create principal
    const principal = await User.create({
      firstName: 'James',
      lastName: 'Kamau',
      email: 'principal@greenfield.ac.ke',
      password: 'Admin1234',
      role: 'principal',
      schoolId: school._id,
    });
    console.log(`✅ Created principal: ${principal.email}`);

    // Create finance officer
    const finance = await User.create({
      firstName: 'Mary',
      lastName: 'Wanjiku',
      email: 'finance@greenfield.ac.ke',
      password: 'Finance1234',
      role: 'finance_officer',
      schoolId: school._id,
    });
    console.log(`✅ Created finance officer: ${finance.email}`);

    // Create teacher
    const teacher = await User.create({
      firstName: 'Peter',
      lastName: 'Otieno',
      email: 'peter@greenfield.ac.ke',
      password: 'Teacher1234',
      role: 'subject_teacher',
      schoolId: school._id,
    });
    console.log(`✅ Created teacher: ${teacher.email}`);

    console.log('\n🎉 Users created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('  Principal: principal@greenfield.ac.ke / Admin1234');
    console.log('  Finance:   finance@greenfield.ac.ke / Finance1234');
    console.log('  Teacher:   peter@greenfield.ac.ke / Teacher1234');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
};

createUsers();
