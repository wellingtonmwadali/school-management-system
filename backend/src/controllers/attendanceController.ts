import { Response } from 'express';
import Attendance from '../models/Attendance';
import Student from '../models/Student';
import { AuthRequest } from '../types';

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { date, class: cls, stream, academicYear, term, records } = req.body;
  // records: [{ studentId, morningStatus, afternoonStatus?, arrivalTime?, notes? }]

  const ops = records.map((r: Record<string, unknown>) => ({
    updateOne: {
      filter: { schoolId: req.user?.schoolId, studentId: r.studentId, date: new Date(date) },
      update: {
        $set: {
          ...r,
          schoolId: req.user?.schoolId,
          date: new Date(date),
          class: cls,
          stream,
          academicYear,
          term,
          markedBy: req.user?.id,
          markedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);
  res.json({ success: true, message: `Attendance marked for ${records.length} students` });
};

export const getClassAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { date, class: cls, stream } = req.query;
  
  const attendance = await Attendance.find({
    schoolId: req.user?.schoolId,
    date: new Date(date as string),
    class: cls,
    stream,
  }).populate('studentId', 'firstName lastName admissionNumber');

  res.json({ success: true, data: attendance });
};

export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.params;
  const { academicYear, term } = req.query;

  const records = await Attendance.find({
    schoolId: req.user?.schoolId,
    studentId,
    ...(academicYear && { academicYear }),
    ...(term && { term: Number(term) }),
  }).sort({ date: -1 });

  const total = records.length;
  const present = records.filter(r => r.morningStatus === 'present').length;
  const absent = records.filter(r => r.morningStatus === 'absent').length;
  const late = records.filter(r => r.morningStatus === 'late').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  res.json({ success: true, data: records, summary: { total, present, absent, late, percentage } });
};

export const getAttendanceSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const { academicYear, term, class: cls } = req.query;
  const schoolId = req.user?.schoolId;
  const mongoose = require('mongoose');

  const matchStage: Record<string, unknown> = {
    schoolId: new mongoose.Types.ObjectId(schoolId),
  };
  if (academicYear) matchStage.academicYear = academicYear;
  if (term) matchStage.term = Number(term);
  if (cls) matchStage.class = cls;

  const summary = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { date: '$date', class: '$class', stream: '$stream' },
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$morningStatus', 'present'] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$morningStatus', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$morningStatus', 'late'] }, 1, 0] } },
      },
    },
    { $sort: { '_id.date': -1 } },
  ]);

  // Daily school-wide attendance rate
  const dailyStats = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$date',
        present: { $sum: { $cond: [{ $eq: ['$morningStatus', 'present'] }, 1, 0] } },
        total: { $sum: 1 },
      },
    },
    { $project: { date: '$_id', rate: { $multiply: [{ $divide: ['$present', '$total'] }, 100] } } },
    { $sort: { date: 1 } },
    { $limit: 30 },
  ]);

  res.json({ success: true, data: summary, dailyStats });
};

export const getAbsenteeList = async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const absentees = await Attendance.find({
    schoolId: req.user?.schoolId,
    date: today,
    morningStatus: 'absent',
  }).populate('studentId', 'firstName lastName admissionNumber currentClass currentStream');

  res.json({ success: true, data: absentees, count: absentees.length });
};
