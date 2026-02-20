import { Response } from 'express';
import ClassAssignment from '../models/ClassAssignment';
import Staff from '../models/Staff';
import { AuthRequest } from '../types';

// Get all class assignments
export const getClassAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    const assignments = await ClassAssignment.find({
      schoolId,
      isActive: true,
    })
      .populate('teacher', 'firstName lastName email phone')
      .sort({ class: 1, stream: 1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign class teacher
export const assignClassTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const { class: className, stream, teacherId } = req.body;
    const schoolId = req.user?.schoolId;

    // Check if teacher exists
    const teacher = await Staff.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }

    const academicYear = new Date().getFullYear().toString();

    // Mark previous assignment as inactive
    await ClassAssignment.updateMany(
      { schoolId, class: className, stream, isActive: true },
      { isActive: false }
    );

    // Create new assignment
    const assignment = await ClassAssignment.create({
      schoolId,
      class: className,
      stream,
      teacher: teacherId,
      academicYear,
      term: 1,
    });

    res.json({
      success: true,
      data: assignment,
      message: 'Class teacher assigned successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove class assignment
export const removeClassAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await ClassAssignment.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: 'Class assignment removed successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get my class assignment (for current user)
export const getMyClassAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;

    // Find staff record
    const staff = await Staff.findOne({ userId, schoolId });
    if (!staff) {
      return res.json({ success: true, data: null });
    }

    // Find assignment
    const assignment = await ClassAssignment.findOne({
      schoolId,
      teacher: staff._id,
      isActive: true,
    });

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
