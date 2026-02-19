import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { catchAsync, AppError, logger } from '../middleware/errorHandler';

// Staff Attendance Model (inline for now - could be moved to models/)
interface IStaffAttendance extends mongoose.Document {
  schoolId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  date: Date;
  clockInTime?: Date;
  clockOutTime?: Date;
  clockInLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  status: 'present' | 'absent' | 'late' | 'half_day';
  workingHours?: number;
  notes?: string;
}

const StaffAttendanceSchema = new mongoose.Schema<IStaffAttendance>(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    date: { type: Date, required: true },
    clockInTime: Date,
    clockOutTime: Date,
    clockInLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },
    clockOutLocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
    },
    status: { type: String, enum: ['present', 'absent', 'late', 'half_day'], default: 'present' },
    workingHours: Number,
    notes: String,
  },
  { timestamps: true }
);

// Indexes
StaffAttendanceSchema.index({ schoolId: 1, staffId: 1, date: 1 }, { unique: true });
StaffAttendanceSchema.index({ schoolId: 1, date: 1 });

const StaffAttendance = mongoose.model<IStaffAttendance>('StaffAttendance', StaffAttendanceSchema);

// Clock In
export const clockIn = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { latitude, longitude, accuracy } = req.body;
  const userId = (req as any).user.id;
  const schoolId = (req as any).user.schoolId;
  const userEmail = (req as any).user.email;

  // Get staff record for this user - try both userId and email
  const Staff = mongoose.model('Staff');
  let staff = await Staff.findOne({ 
    schoolId,
    $or: [
      { userId },
      { email: userEmail }
    ]
  });
  
  // If found by email but not linked, link the userId
  if (staff && !staff.userId) {
    staff.userId = userId;
    await staff.save();
  }
  
  if (!staff) {
    logger.warn(`Staff lookup failed - userId: ${userId}, email: ${userEmail}, schoolId: ${schoolId}`);
    return next(new AppError('Staff record not found. If you recently reset the database, please log out and log back in to refresh your session.', 404));
  }

  // Check if already clocked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existingAttendance = await StaffAttendance.findOne({
    schoolId,
    staffId: staff._id,
    date: today,
  });

  if (existingAttendance && existingAttendance.clockInTime) {
    return next(new AppError('Already clocked in today', 400));
  }

  const clockInTime = new Date();
  const expectedTime = new Date();
  expectedTime.setHours(8, 0, 0, 0); // 8:00 AM

  const status = clockInTime > expectedTime ? 'late' : 'present';

  const attendance = await StaffAttendance.findOneAndUpdate(
    { schoolId, staffId: staff._id, date: today },
    {
      clockInTime,
      clockInLocation: { latitude, longitude, accuracy },
      status,
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    message: `Clocked in successfully${status === 'late' ? ' (Late)' : ''}`,
    data: {
      attendanceId: attendance._id,
      userId: userId,
      staffId: staff._id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      clockInTime: attendance.clockInTime,
      location: attendance.clockInLocation,
      status: attendance.status,
      date: attendance.date,
    },
  });
});

// Clock Out
export const clockOut = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { latitude, longitude, accuracy } = req.body;
  const userId = (req as any).user.id;
  const schoolId = (req as any).user.schoolId;
  const userEmail = (req as any).user.email;

  // Get staff record for this user - try both userId and email
  const Staff = mongoose.model('Staff');
  let staff = await Staff.findOne({ 
    schoolId,
    $or: [
      { userId },
      { email: userEmail }
    ]
  });
  
  // If found by email but not linked, link the userId
  if (staff && !staff.userId) {
    staff.userId = userId;
    await staff.save();
  }
  
  if (!staff) {
    logger.warn(`Staff lookup failed - userId: ${userId}, email: ${userEmail}, schoolId: ${schoolId}`);
    return next(new AppError('Staff record not found. If you recently reset the database, please log out and log back in to refresh your session.', 404));
  }

  // Find today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const attendance = await StaffAttendance.findOne({
    schoolId,
    staffId: staff._id,
    date: today,
  });

  if (!attendance || !attendance.clockInTime) {
    return next(new AppError('No clock-in record found for today', 400));
  }

  if (attendance.clockOutTime) {
    return next(new AppError('Already clocked out today', 400));
  }

  const clockOutTime = new Date();
  const workingHours = (clockOutTime.getTime() - attendance.clockInTime.getTime()) / (1000 * 60 * 60);

  attendance.clockOutTime = clockOutTime;
  attendance.clockOutLocation = { latitude, longitude, accuracy };
  attendance.workingHours = Math.round(workingHours * 100) / 100;
  
  // Update status if half day
  if (workingHours < 4) {
    attendance.status = 'half_day';
  }

  await attendance.save();

  res.status(200).json({
    success: true,
    message: 'Clocked out successfully',
    data: {
      attendanceId: attendance._id,
      userId: userId,
      staffId: staff._id,
      staffName: `${staff.firstName} ${staff.lastName}`,
      clockInTime: attendance.clockInTime,
      clockOutTime: attendance.clockOutTime,
      clockInLocation: attendance.clockInLocation,
      clockOutLocation: attendance.clockOutLocation,
      workingHours: attendance.workingHours,
      status: attendance.status,
      date: attendance.date,
    },
  });
});

// Get Staff Attendance Records
export const getStaffAttendance = catchAsync(async (req: Request, res: Response) => {
  const schoolId = (req as any).user.schoolId;
  const { startDate, endDate, staffId } = req.query;

  const filter: any = { schoolId };

  if (staffId) {
    filter.staffId = staffId;
  }

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate as string);
    if (endDate) filter.date.$lte = new Date(endDate as string);
  }

  const attendanceRecords = await StaffAttendance.find(filter)
    .populate('staffId', 'firstName lastName employeeNumber department position')
    .sort({ date: -1, clockInTime: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: attendanceRecords.length,
    data: attendanceRecords,
  });
});

// Get My Attendance
export const getMyAttendance = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id;
  const schoolId = (req as any).user.schoolId;
  const userEmail = (req as any).user.email;

  // Get staff record for this user - try both userId and email
  const Staff = mongoose.model('Staff');
  let staff = await Staff.findOne({ 
    schoolId,
    $or: [
      { userId },
      { email: userEmail }
    ]
  });
  
  // If found by email but not linked, link the userId
  if (staff && !staff.userId) {
    staff.userId = userId;
    await staff.save();
  }
  
  if (!staff) {
    logger.warn(`Staff lookup failed - userId: ${userId}, email: ${userEmail}, schoolId: ${schoolId}`);
    return next(new AppError('Staff record not found. If you recently reset the database, please log out and log back in to refresh your session.', 404));
  }

  const { startDate, endDate } = req.query;
  const filter: any = { schoolId, staffId: staff._id };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate as string);
    if (endDate) filter.date.$lte = new Date(endDate as string);
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filter.date = { $gte: thirtyDaysAgo };
  }

  const attendanceRecords = await StaffAttendance.find(filter)
    .sort({ date: -1 })
    .limit(100);

  res.status(200).json({
    success: true,
    count: attendanceRecords.length,
    data: attendanceRecords,
  });
});

// Get Today's Attendance Status
export const getTodayStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user.id;
  const schoolId = (req as any).user.schoolId;
  const userEmail = (req as any).user.email;

  // Get staff record for this user - try both userId and email
  const Staff = mongoose.model('Staff');
  let staff = await Staff.findOne({ 
    schoolId,
    $or: [
      { userId },
      { email: userEmail }
    ]
  });
  
  // If found by email but not linked, link the userId
  if (staff && !staff.userId) {
    staff.userId = userId;
    await staff.save();
  }
  
  if (!staff) {
    logger.warn(`Staff lookup failed - userId: ${userId}, email: ${userEmail}, schoolId: ${schoolId}`);
    return next(new AppError('Staff record not found. If you recently reset the database, please log out and log back in to refresh your session.', 404));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await StaffAttendance.findOne({
    schoolId,
    staffId: staff._id,
    date: today,
  });

  res.status(200).json({
    success: true,
    data: attendance || null,
  });
});
