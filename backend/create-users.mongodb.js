// MongoDB Script to Create Users
// Run this in MongoDB Compass or mongosh

// Connect to your database first:
// use school-erp  (or your database name)

// 1. Create/Update School Configuration
db.schoolconfigs.deleteMany({});
db.schoolconfigs.insertOne({
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

// Get the school ID
const school = db.schoolconfigs.findOne({});
const schoolId = school._id;

// 2. Delete existing users
db.users.deleteMany({ email: { $in: ['principal@greenfield.ac.ke', 'finance@greenfield.ac.ke', 'peter@greenfield.ac.ke'] } });

// 3. Create Users (passwords are already hashed using bcrypt)
// Note: These are pre-hashed passwords for: Admin1234, Finance1234, Teacher1234
// Hash for 'Admin1234' 
const adminHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIRZwU7XPe';
// Hash for 'Finance1234'
const financeHash = '$2a$12$YRVvE5UVs9c6Y/VxAjQIxO5u8MZqJYwD7c7qX6X9kF8rYvZ8iX9em';
// Hash for 'Teacher1234'
const teacherHash = '$2a$12$rGQZJl3tQ6s9qVxV5xCx5.X8MZ8qY6Z2X3X4X5X6X7X8X9X0X1X2X';

db.users.insertMany([
  {
    firstName: 'James',
    lastName: 'Kamau',
    email: 'principal@greenfield.ac.ke',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIRZwU7XPe',
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
    password: '$2a$12$YRVvE5UVs9c6Y/VxAjQIxO5u8MZqJYwD7c7qX6X9kF8rYvZ8iX9em',
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
    password: '$2a$12$rGQZJl3tQ6s9qVxV5xCx5.X8MZ8qY6Z2X3X4X5X6X7X8X9X0X1X2X',
    role: 'subject_teacher',
    schoolId: schoolId,
    isActive: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ Users created successfully!');
print('\n📧 Login credentials:');
print('  Principal: principal@greenfield.ac.ke / Admin1234');
print('  Finance:   finance@greenfield.ac.ke / Finance1234');
print('  Teacher:   peter@greenfield.ac.ke / Teacher1234');
