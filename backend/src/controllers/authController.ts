import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Please provide email and password' });
    return;
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ success: false, message: 'Account is deactivated' });
    return;
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user);

  res.json({
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
  });
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
