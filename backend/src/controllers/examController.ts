import { Response } from 'express';
import { Exam, SubjectPaper, Mark } from '../models/Exam';
import SchoolConfig from '../models/SchoolConfig';
import { AuthRequest } from '../types';

const computeGrade = (percentage: number, gradingSchema: { letter: string; minScore: number; maxScore: number; points: number; remark: string }[]) => {
  const grade = gradingSchema.find(g => percentage >= g.minScore && percentage <= g.maxScore);
  return grade || { letter: 'E', points: 1, remark: 'Very Poor' };
};

export const getExams = async (req: AuthRequest, res: Response): Promise<void> => {
  const exams = await Exam.find({ schoolId: req.user?.schoolId }).sort({ createdAt: -1 });
  res.json({ success: true, data: exams });
};

export const createExam = async (req: AuthRequest, res: Response): Promise<void> => {
  const exam = await Exam.create({ ...req.body, schoolId: req.user?.schoolId, createdBy: req.user?.id });
  res.status(201).json({ success: true, data: exam });
};

export const updateExam = async (req: AuthRequest, res: Response): Promise<void> => {
  const exam = await Exam.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user?.schoolId },
    req.body, { new: true }
  );
  if (!exam) { res.status(404).json({ success: false, message: 'Exam not found' }); return; }
  res.json({ success: true, data: exam });
};

export const enterMarks = async (req: AuthRequest, res: Response): Promise<void> => {
  const { examId, paperId, marks } = req.body;
  // marks: [{ studentId, marksObtained }]

  const config = await SchoolConfig.findById(req.user?.schoolId);
  const paper = await SubjectPaper.findById(paperId);

  if (!config || !paper) { res.status(404).json({ success: false, message: 'Config or paper not found' }); return; }

  const exam = await Exam.findById(examId);
  if (!exam) { res.status(404).json({ success: false, message: 'Exam not found' }); return; }

  const ops = marks.map((m: { studentId: string; marksObtained: number; teacherComment?: string }) => {
    const percentage = Math.round((m.marksObtained / paper.maxMarks) * 100);
    const gradeInfo = computeGrade(percentage, config.gradingSchema);

    return {
      updateOne: {
        filter: { schoolId: req.user?.schoolId, examId, paperId, studentId: m.studentId },
        update: {
          $set: {
            schoolId: req.user?.schoolId,
            examId,
            paperId,
            studentId: m.studentId,
            subject: paper.subject,
            class: paper.class,
            stream: paper.stream || '',
            academicYear: exam.academicYear,
            term: exam.term,
            marksObtained: m.marksObtained,
            maxMarks: paper.maxMarks,
            percentage,
            grade: gradeInfo.letter,
            gradePoints: gradeInfo.points,
            remark: gradeInfo.remark,
            teacherComment: m.teacherComment,
            enteredBy: req.user?.id,
            enteredAt: new Date(),
          },
        },
        upsert: true,
      },
    };
  });

  await Mark.bulkWrite(ops);

  // Update paper marks entry status
  await SubjectPaper.findByIdAndUpdate(paperId, { isMarksEntered: true });

  // Compute ranks
  const allMarks = await Mark.find({ schoolId: req.user?.schoolId, paperId }).sort({ percentage: -1 });
  const rankOps = allMarks.map((mk, idx) => ({
    updateOne: {
      filter: { _id: mk._id },
      update: { $set: { subjectRank: idx + 1 } },
    },
  }));
  await Mark.bulkWrite(rankOps);

  res.json({ success: true, message: `Marks entered for ${marks.length} students` });
};

export const getStudentReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, examId } = req.params;

  const marks = await Mark.find({
    schoolId: req.user?.schoolId,
    studentId,
    examId,
  });

  const total = marks.reduce((sum, m) => sum + m.marksObtained, 0);
  const maxTotal = marks.reduce((sum, m) => sum + m.maxMarks, 0);
  const meanPercent = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  const meanPoints = marks.length > 0 ? (marks.reduce((sum, m) => sum + m.gradePoints, 0) / marks.length).toFixed(2) : '0';

  const config = await SchoolConfig.findById(req.user?.schoolId);
  const meanGrade = computeGrade(meanPercent, config?.gradingSchema || []);

  res.json({
    success: true,
    data: {
      marks,
      summary: { total, maxTotal, meanPercent, meanPoints, meanGrade: meanGrade.letter },
    },
  });
};

export const getClassResults = async (req: AuthRequest, res: Response): Promise<void> => {
  const { examId, class: cls, stream } = req.query;

  const marks = await Mark.find({
    schoolId: req.user?.schoolId,
    examId,
    class: cls,
    ...(stream && { stream }),
  }).populate('studentId', 'firstName lastName admissionNumber');

  // Group by student
  const studentMap: Record<string, {
    student: unknown;
    subjects: unknown[];
    totalMarks: number;
    maxMarks: number;
    meanPercent: number;
    meanPoints: number;
  }> = {};
  marks.forEach(m => {
    const sid = m.studentId.toString();
    if (!studentMap[sid]) {
      studentMap[sid] = {
        student: m.studentId,
        subjects: [],
        totalMarks: 0,
        maxMarks: 0,
        meanPercent: 0,
        meanPoints: 0,
      };
    }
    studentMap[sid].subjects.push(m);
    studentMap[sid].totalMarks += m.marksObtained;
    studentMap[sid].maxMarks += m.maxMarks;
  });

  const results = Object.values(studentMap)
    .map(s => ({
      ...s,
      meanPercent: s.maxMarks > 0 ? Math.round((s.totalMarks / s.maxMarks) * 100) : 0,
      meanPoints: s.subjects.length > 0 ? parseFloat(((s.subjects as { gradePoints: number }[]).reduce((sum, sub) => sum + sub.gradePoints, 0) / s.subjects.length).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.meanPercent - a.meanPercent)
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  res.json({ success: true, data: results });
};

export const getSubjectAnalysis = async (req: AuthRequest, res: Response): Promise<void> => {
  const { examId } = req.params;
  const mongoose = require('mongoose');

  const analysis = await Mark.aggregate([
    { $match: { schoolId: new mongoose.Types.ObjectId(req.user?.schoolId), examId: new mongoose.Types.ObjectId(examId) } },
    {
      $group: {
        _id: '$subject',
        count: { $sum: 1 },
        avgPercent: { $avg: '$percentage' },
        highest: { $max: '$marksObtained' },
        lowest: { $min: '$marksObtained' },
        passed: { $sum: { $cond: [{ $gte: ['$percentage', 50] }, 1, 0] } },
      },
    },
    { $project: { subject: '$_id', count: 1, avgPercent: { $round: ['$avgPercent', 1] }, highest: 1, lowest: 1, passRate: { $multiply: [{ $divide: ['$passed', '$count'] }, 100] } } },
    { $sort: { avgPercent: -1 } },
  ]);

  res.json({ success: true, data: analysis });
};
