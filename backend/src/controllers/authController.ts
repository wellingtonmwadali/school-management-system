import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import SchoolConfig from '../models/SchoolConfig';
import { AuthRequest } from '../types';

const generateToken = (user: IUser): string => {
  return jwt.sign(
    { id: user._id, role: user.role, schoolId: user.schoolId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
  );
};

export const login = async (req: Request, res: Response): Promise<void> => {
  console.log('🔐 ============================================');
  console.log('🔐 LOGIN REQUEST RECEIVED');
  console.log('🔐 ============================================');
  
  // Check database connection
  console.log('💾 Database connection status:');
  console.log('   - State:', mongoose.connection.readyState);
  console.log('   - 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
  console.log('   - Is connected:', mongoose.connection.readyState === 1);
  console.log('   - Database name:', mongoose.connection.name || 'Not connected');
  console.log('   - Host:', mongoose.connection.host || 'Not connected');
  
  if (mongoose.connection.readyState !== 1) {
    console.log('❌ Database not connected! Cannot proceed with login.');
    res.status(503).json({ 
      success: false, 
      message: 'Database connection unavailable. Please try again later.' 
    });
    return;
  }
  
  const { email, password } = req.body;
  console.log('📧 Email:', email);
  console.log('🔑 Password provided:', !!password);
  console.log('🔑 Password length:', password?.length || 0);

  if (!email || !password) {
    console.log('❌ Validation failed: Missing email or password');
    res.status(400).json({ success: false, message: 'Please provide email and password' });
    return;
  }

  console.log('🔍 Looking up user in database...');
  console.log('🔍 Query: User.findOne({ email: "' + email + '" }).select("+password")');
  
  const user = await User.findOne({ email }).select('+password');

  console.log('📊 Database query completed');
  console.log('📊 Query result:', user ? 'User found' : 'User NOT found');
  
  if (user) {
    console.log('📊 Database returned user document:');
    console.log('   - _id:', user._id);
    console.log('   - firstName:', user.firstName);
    console.log('   - lastName:', user.lastName);
    console.log('   - email:', user.email);
    console.log('   - role:', user.role);
    console.log('   - schoolId:', user.schoolId);
    console.log('   - isActive:', user.isActive);
    console.log('   - password hash exists:', !!user.password);
    console.log('   - password hash length:', user.password?.length || 0);
    console.log('   - lastLogin:', user.lastLogin);
    console.log('   - createdAt:', user.createdAt);
  }

  if (!user) {
    console.log('❌ User not found with email:', email);
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  console.log('✅ User found:', user.firstName, user.lastName);
  console.log('👤 User ID:', user._id);
  console.log('🎭 User role:', user.role);
  console.log('🏫 School ID:', user.schoolId);

  console.log('🔐 Comparing password...');
  console.log('🔐 Candidate password length:', password.length);
  console.log('🔐 Stored password hash:', user.password?.substring(0, 20) + '...');
  console.log('🔐 Calling bcrypt.compare()...');
  
  const passwordMatch = await user.comparePassword(password);
  
  console.log('🔐 bcrypt.compare() completed');
  console.log('🔐 Password match result:', passwordMatch);

  if (!passwordMatch) {
    console.log('❌ Password comparison failed');
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  console.log('🔍 Checking if user is active...');
  console.log('✅ User active status:', user.isActive);

  if (!user.isActive) {
    console.log('❌ Account is deactivated');
    res.status(403).json({ success: false, message: 'Account is deactivated' });
    return;
  }

  console.log('💾 Updating last login timestamp...');
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  console.log('✅ Last login updated');

  console.log('🎟️ Generating JWT token...');
  const token = generateToken(user);
  console.log('✅ Token generated (length):', token.length);

  const responseData = {
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      avatar: user.avatar,
    },
  };

  console.log('📤 Sending success response');
  console.log('👤 Response user data:', responseData.user);
  console.log('🔐 ============================================');
  console.log('🔐 LOGIN SUCCESSFUL');
  console.log('🔐 ============================================');

  res.json(responseData);
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.id);
  res.json({ success: true, data: user });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user?.id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    res.status(400).json({ success: false, message: 'Current password is incorrect' });
    return;
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
};

export const createSchoolAndAdmin = async (req: Request, res: Response): Promise<void> => {
  const { school, admin } = req.body;

  const existing = await SchoolConfig.findOne({ code: school.code });
  if (existing) {
    res.status(400).json({ success: false, message: 'School code already exists' });
    return;
  }

  const schoolConfig = await SchoolConfig.create(school);

  const adminUser = await User.create({
    ...admin,
    role: 'principal',
    schoolId: schoolConfig._id,
  });

  const token = generateToken(adminUser);

  res.status(201).json({
    success: true,
    token,
    school: schoolConfig,
    user: {
      id: adminUser._id,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      email: adminUser.email,
      role: adminUser.role,
    },
  });
};
