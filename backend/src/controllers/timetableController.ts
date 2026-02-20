import { Request, Response } from 'express';
import TimetableSlot from '../models/TimetableSlot';
import Staff from '../models/Staff';
import { AuthRequest } from '../types';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Get timetable for a specific class
export const getTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const { class: className, stream } = req.query;
    const schoolId = req.user?.schoolId;

    const timetable = await TimetableSlot.find({
      schoolId,
      class: className,
      stream,
      isActive: true,
    })
      .populate('teacher', 'firstName lastName')
      .sort({ day: 1, period: 1 });

    res.json({
      success: true,
      data: timetable,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get upcoming classes for current user (teacher)
export const getUpcomingClasses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;

    // Find staff record
    const staff = await Staff.findOne({ userId, schoolId });
    if (!staff) {
      return res.json({
        success: true,
        data: { today: [], totalClasses: 0, todayClasses: 0 },
      });
    }

    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Get today's classes
    const todayClasses = await TimetableSlot.find({
      schoolId,
      teacher: staff._id,
      day: currentDay,
      isActive: true,
    }).sort({ period: 1 });

    // Get total classes this week
    const weekClasses = await TimetableSlot.countDocuments({
      schoolId,
      teacher: staff._id,
      isActive: true,
    });

    // Format today's classes with status
    const formattedClasses = todayClasses.map((cls, idx) => ({
      period: cls.period,
      time: cls.time || 'TBD',
      subject: cls.subject,
      class: cls.class,
      stream: cls.stream,
      room: cls.room || 'TBD',
      isNext: idx === 0,
      status: idx === 0 ? 'Next' : 'Upcoming',
    }));

    res.json({
      success: true,
      data: {
        today: formattedClasses,
        totalClasses: weekClasses,
        todayClasses: todayClasses.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload timetable from CSV
export const uploadTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const { class: className, stream } = req.body;
    const schoolId = req.user?.schoolId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const results: any[] = [];
    const fileContent = file.buffer.toString('utf-8');

    // Parse CSV
    const readable = Readable.from(fileContent);
    readable
      .pipe(csv())
      .on('data', (data: any) => results.push(data))
      .on('end', async () => {
        try {
          // Delete existing timetable for this class
          await TimetableSlot.deleteMany({ schoolId, class: className, stream });

          // Create new timetable entries
          const academicYear = new Date().getFullYear().toString();
          const timetableEntries = results.map((row) => ({
            schoolId,
            class: className,
            stream,
            day: row.Day || row.day,
            period: row.Period || row.period,
            subject: row.Subject || row.subject,
            teacherName: row.Teacher || row.teacher,
            room: row.Room || row.room,
            time: row.Time || row.time,
            academicYear,
            term: 1,
          }));

          await TimetableSlot.insertMany(timetableEntries);

          res.json({
            success: true,
            message: `Timetable uploaded successfully. ${timetableEntries.length} entries created.`,
          });
        } catch (error: any) {
          res.status(500).json({ success: false, message: error.message });
        }
      });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add single timetable entry
export const addTimetableEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { class: className, stream, day, period, subject, teacher, room } = req.body;
    const schoolId = req.user?.schoolId;
    const academicYear = new Date().getFullYear().toString();

    const entry = await TimetableSlot.create({
      schoolId,
      class: className,
      stream,
      day,
      period,
      subject,
      teacherName: teacher,
      room,
      academicYear,
      term: 1,
    });

    res.json({
      success: true,
      data: entry,
      message: 'Timetable entry added successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
