require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const checkStaff = async () => {
  await connectDB();
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Staff = mongoose.model('Staff', new mongoose.Schema({}, { strict: false }));
  
  console.log('\n=== USERS ===');
  const users = await User.find().select('firstName lastName email role profileId userId');
  users.forEach(u => {
    console.log(`${u.firstName} ${u.lastName} (${u.email}) - Role: ${u.role}`);
    console.log(`  User ID: ${u._id}`);
    console.log(`  Profile ID: ${u.profileId || 'NONE'}`);
  });
  
  console.log('\n=== STAFF ===');
  const staff = await Staff.find().select('firstName lastName email staffId userId designation');
  staff.forEach(s => {
    console.log(`${s.firstName} ${s.lastName} (${s.email}) - ${s.designation}`);
    console.log(`  Staff ID: ${s.staffId}`);
    console.log(`  User ID: ${s.userId || 'NONE'}`);
    console.log(`  Mongo ID: ${s._id}`);
  });
  
  console.log('\n=== CHECKING LINKS ===');
  for (const user of users) {
    const staffRecord = await Staff.findOne({ 
      $or: [
        { userId: user._id },
        { email: user.email }
      ]
    });
    console.log(`User: ${user.email} -> Staff: ${staffRecord ? staffRecord.staffId : 'NOT FOUND'}`);
  }
  
  await mongoose.connection.close();
  process.exit(0);
};

checkStaff().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
