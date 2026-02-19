import { Response } from 'express';
import Student from '../models/Student';
import { FeeInvoice } from '../models/Fee';
import Attendance from '../models/Attendance';
import { Mark } from '../models/Exam';
import { DisciplineIncident, ClinicVisit } from '../models/OtherModels';
import { LeaveRequest, Notification, Announcement } from '../models/Operations';
import Staff from '../models/Staff';
import { AuthRequest } from '../types';

export const getPrincipalDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const schoolId = req.user?.schoolId;
  const mongoose = require('mongoose');
  const sid = new mongoose.Types.ObjectId(schoolId);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [
    totalStudents, totalStaff,
    todayAttendance, feeStats, openIncidents,
    pendingLeaves, recentAnnouncements, atRiskStudents
  ] = await Promise.all([
    Student.countDocuments({ schoolId, status: 'active' }),
    Staff.countDocuments({ schoolId, isActive: true }),
    Attendance.aggregate([
      { $match: { schoolId: sid, date: today } },
      { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$morningStatus', 'present'] }, 1, 0] } } } },
    ]),
    FeeInvoice.aggregate([
      { $match: { schoolId: sid } },
      { $group: { _id: null, collected: { $sum: '$amountPaid' }, outstanding: { $sum: '$balance' }, expected: { $sum: '$totalAmount' } } },
    ]),
    DisciplineIncident.countDocuments({ schoolId, status: { $in: ['open', 'investigating'] } }),
    LeaveRequest.countDocuments({ schoolId, status: 'pending' }),
    Announcement.find({ schoolId }).sort({ createdAt: -1 }).limit(5).populate('createdBy', 'firstName lastName'),
    // Students below 75% attendance
    Attendance.aggregate([
      { $match: { schoolId: sid } },
      { $group: { _id: '$studentId', total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$morningStatus', 'present'] }, 1, 0] } } } },
      { $project: { rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
      { $match: { rate: { $lt: 75 } } },
      { $count: 'count' },
    ]),
  ]);

  const attendanceRate = todayAttendance[0]?.total > 0
    ? Math.round((todayAttendance[0].present / todayAttendance[0].total) * 100)
    : 0;
  const feeCollectionRate = feeStats[0]?.expected > 0
    ? Math.round((feeStats[0].collected / feeStats[0].expected) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      metrics: {
        totalStudents,
        totalStaff,
        todayAttendanceRate: attendanceRate,
        todayPresent: todayAttendance[0]?.present || 0,
        todayAbsent: (todayAttendance[0]?.total || 0) - (todayAttendance[0]?.present || 0),
        feeCollected: feeStats[0]?.collected || 0,
        feeOutstanding: feeStats[0]?.outstanding || 0,
        feeCollectionRate,
        openIncidents,
        pendingLeaves,
        atRiskStudents: atRiskStudents[0]?.count || 0,
      },
      recentAnnouncements,
    },
  });
};

export const getFinanceDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const schoolId = req.user?.schoolId;
  const mongoose = require('mongoose');
  const sid = new mongoose.Types.ObjectId(schoolId);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayPayments, termStats, collectionByClass, overdueList, monthlyTrend] = await Promise.all([
    // Today's collections
    mongoose.model('FeePayment').aggregate([
      { $match: { schoolId: sid, paidDate: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: '$method', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    FeeInvoice.aggregate([
      { $match: { schoolId: sid } },
      { $group: { _id: null, expected: { $sum: '$totalAmount' }, collected: { $sum: '$amountPaid' }, balance: { $sum: '$balance' } } },
    ]),
    FeeInvoice.aggregate([
      { $match: { schoolId: sid } },
      { $lookup: { from: 'students', localField: 'studentId', foreignField: '_id', as: 'st' } },
      { $unwind: '$st' },
      { $group: { _id: '$st.currentClass', expected: { $sum: '$totalAmount' }, collected: { $sum: '$amountPaid' } } },
      { $project: { class: '$_id', expected: 1, collected: 1, rate: { $multiply: [{ $divide: ['$collected', '$expected'] }, 100] } } },
      { $sort: { class: 1 } },
    ]),
    FeeInvoice.find({ schoolId, status: { $in: ['unpaid', 'overdue'] }, balance: { $gt: 0 } })
      .populate('studentId', 'firstName lastName admissionNumber currentClass')
      .sort({ balance: -1 })
      .limit(10),
    // Monthly collection trend (last 6 months)
    mongoose.model('FeePayment').aggregate([
      { $match: { schoolId: sid } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidDate' } }, amount: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]),
  ]);

  res.json({
    success: true,
    data: { todayPayments, termStats: termStats[0] || {}, collectionByClass, overdueList, monthlyTrend },
  });
};

export const getTeacherDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const schoolId = req.user?.schoolId;
  const userId = req.user?.id;
  const mongoose = require('mongoose');

  const staff = await Staff.findOne({ schoolId, userId: new mongoose.Types.ObjectId(userId) });
  if (!staff) { res.status(404).json({ success: false, message: 'Staff profile not found' }); return; }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][today.getDay()];

  const [myClasses, todayAttendanceMy, pendingMarks, myStudents] = await Promise.all([
    // Get from timetable - what classes this teacher takes
    mongoose.model('TimetableSlot').distinct('class', { schoolId, teacherId: staff._id }),
    // Today's attendance for my stream (if class teacher)
    staff.classTeacherOf ? Attendance.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), date: today, stream: staff.classTeacherOf } },
      { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$morningStatus', 'present'] }, 1, 0] } } } },
    ]) : Promise.resolve([]),
    // Pending mark entry
    mongoose.model('SubjectPaper').countDocuments({ schoolId, teacherId: staff._id, isMarksEntered: false }),
    // Students count for my stream
    staff.classTeacherOf ? Student.countDocuments({ schoolId, currentStream: staff.classTeacherOf, status: 'active' }) : 0,
  ]);

  res.json({
    success: true,
    data: {
      staff: { name: `${staff.firstName} ${staff.lastName}`, classTeacherOf: staff.classTeacherOf, subjectsTaught: staff.subjectsTaught },
      myClasses,
      myStudents,
      todayAttendance: todayAttendanceMy[0] || { total: 0, present: 0 },
      pendingMarks,
    },
  });
};

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const schoolId = req.user?.schoolId;
  const userId = req.user?.id;
  const mongoose = require('mongoose');

  const student = await Student.findOne({ schoolId, userId: new mongoose.Types.ObjectId(userId) });
  if (!student) { res.status(404).json({ success: false, message: 'Student profile not found' }); return; }

  const [attendanceSummary, feeBalance, recentMarks] = await Promise.all([
    Attendance.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), studentId: student._id } },
      { $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$morningStatus', 'present'] }, 1, 0] } } } },
    ]),
    FeeInvoice.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), studentId: student._id } },
      { $group: { _id: null, balance: { $sum: '$balance' }, paid: { $sum: '$amountPaid' } } },
    ]),
    Mark.find({ schoolId, studentId: student._id }).sort({ createdAt: -1 }).limit(10),
  ]);

  const attRate = attendanceSummary[0]?.total > 0
    ? Math.round((attendanceSummary[0].present / attendanceSummary[0].total) * 100) : 0;

  res.json({
    success: true,
    data: {
      student: { name: `${student.firstName} ${student.lastName}`, class: student.currentClass, stream: student.currentStream, admissionNumber: student.admissionNumber },
      attendanceRate: attRate,
      feeBalance: feeBalance[0]?.balance || 0,
      feePaid: feeBalance[0]?.paid || 0,
      recentMarks,
    },
  });
};
