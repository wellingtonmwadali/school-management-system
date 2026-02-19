const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://administrator:Admin%40123@cluster0.jx3bb3x.mongodb.net/school-erp';

async function createUsers() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('school-erp');
    
    // Create or get school
    await db.collection('schoolconfigs').deleteMany({});
    const schoolResult = await db.collection('schoolconfigs').insertOne({
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
      currency: 'KES',
      currencySymbol: 'Ksh',
      feeItems: [],
      academicYears: [],
      periodsPerDay: 9,
      periodDuration: 40,
      breakTimes: [],
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      smsEnabled: false,
      emailEnabled: true,
      whatsappEnabled: false,
      notificationTriggers: [],
      mpesaEnabled: false,
      timezone: 'Africa/Nairobi',
      dateFormat: 'DD/MM/YYYY',
      theme: 'default',
      customFields: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const schoolId = schoolResult.insertedId;
    console.log(`✅ School created with ID: ${schoolId}`);
    
    // Delete existing users
    await db.collection('users').deleteMany({
      email: { $in: ['principal@greenfield.ac.ke', 'finance@greenfield.ac.ke', 'peter@greenfield.ac.ke'] }
    });
    
    // Hash passwords
    const principalPassword = await bcrypt.hash('Admin1234', 12);
    const financePassword = await bcrypt.hash('Finance1234', 12);
    const teacherPassword = await bcrypt.hash('Teacher1234', 12);
    
    // Create users
    await db.collection('users').insertMany([
      {
        firstName: 'James',
        lastName: 'Kamau',
        email: 'principal@greenfield.ac.ke',
        password: principalPassword,
        role: 'principal',
        schoolId: schoolId,
        isActive: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Mary',
        lastName: 'Wanjiku',
        email: 'finance@greenfield.ac.ke',
        password: financePassword,
        role: 'finance_officer',
        schoolId: schoolId,
        isActive: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Peter',
        lastName: 'Otieno',
        email: 'peter@greenfield.ac.ke',
        password: teacherPassword,
        role: 'subject_teacher',
        schoolId: schoolId,
        isActive: true,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    console.log('✅ Users created successfully!');
    console.log('\n📧 Login credentials:');
    console.log('  Principal: principal@greenfield.ac.ke / Admin1234');
    console.log('  Finance:   finance@greenfield.ac.ke / Finance1234');
    console.log('  Teacher:   peter@greenfield.ac.ke / Teacher1234');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createUsers();
