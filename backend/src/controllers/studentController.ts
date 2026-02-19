import { Request, Response } from 'express';
import Student from '../models/Student';
import User from '../models/User';
import SchoolConfig from '../models/SchoolConfig';
import { AuthRequest } from '../types';

// Generate admission number
const generateAdmissionNumber = async (schoolId: string): Promise<string> => {
  const config = await SchoolConfig.findById(schoolId);
  const year = new Date().getFullYear();
  const count = await Student.countDocuments({ schoolId });
  const seq = String(count + 1).padStart(4, '0');
  return `${config?.code || 'SCH'}-${year}-${seq}`;
};

export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  const { class: cls, stream, status, search, page = 1, limit = 20 } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };

  if (cls) query.currentClass = cls;
  if (stream) query.currentStream = stream;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { admissionNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ currentClass: 1, currentStream: 1, lastName: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: students, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

export const getStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await Student.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
  if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
  res.json({ success: true, data: student });
};

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  const admissionNumber = await generateAdmissionNumber(req.user?.schoolId || '');
  
  const student = await Student.create({
    ...req.body,
    schoolId: req.user?.schoolId,
    admissionNumber,
  });

  // Create portal account
  if (req.body.email) {
    await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.dateOfBirth ? req.body.dateOfBirth.toString().replace(/-/g, '') : 'Pass1234',
      role: 'student',
      schoolId: req.user?.schoolId,
      profileId: student._id,
      profileModel: 'Student',
    });
  }

  res.status(201).json({ success: true, data: student });
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user?.schoolId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
  res.json({ success: true, data: student });
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user?.schoolId },
    { status: 'expelled' },
    { new: true }
  );
  if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
  res.json({ success: true, message: 'Student deactivated' });
};

export const getStudentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const schoolId = req.user?.schoolId;
  
  const [totalActive, byClass, byGender, recentAdmissions] = await Promise.all([
    Student.countDocuments({ schoolId, status: 'active' }),
    Student.aggregate([
      { $match: { schoolId: new (require('mongoose').Types.ObjectId)(schoolId), status: 'active' } },
      { $group: { _id: '$currentClass', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      { $match: { schoolId: new (require('mongoose').Types.ObjectId)(schoolId), status: 'active' } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]),
    Student.find({ schoolId, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName admissionNumber currentClass admissionDate'),
  ]);

  res.json({ success: true, data: { totalActive, byClass, byGender, recentAdmissions } });
};

export const bulkPromote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { fromClass, toClass, studentIds, overrideAll } = req.body;
  
  const query = overrideAll
    ? { schoolId: req.user?.schoolId, currentClass: fromClass }
    : { _id: { $in: studentIds }, schoolId: req.user?.schoolId };

  await Student.updateMany(query, { currentClass: toClass });
  res.json({ success: true, message: `Students promoted from ${fromClass} to ${toClass}` });
};
