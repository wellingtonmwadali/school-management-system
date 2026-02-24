import { Response } from 'express';
import SchoolConfig from '../models/SchoolConfig';
import Staff from '../models/Staff';
import User from '../models/User';
import { DisciplineIncident, CounselingCase, Book, BookBorrowing, ClinicVisit, Quote } from '../models/OtherModels';
import { Announcement, Notification, LeaveRequest } from '../models/Operations';
import { AuthRequest } from '../types';

// ========== CONFIG ==========
export const getConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const config = await SchoolConfig.findById(req.user?.schoolId);
  res.json({ success: true, data: config });
};

export const updateConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const config = await SchoolConfig.findByIdAndUpdate(req.user?.schoolId, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: config });
};

// ========== STAFF ==========
export const getStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const { department, search, page = 1, limit = 20 } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (department) query.department = department;
  if (search) query.$or = [
    { firstName: { $regex: search, $options: 'i' } },
    { lastName: { $regex: search, $options: 'i' } },
    { staffId: { $regex: search, $options: 'i' } },
  ];

  const total = await Staff.countDocuments(query);
  const staff = await Staff.find(query)
    .sort({ lastName: 1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ success: true, data: staff, total });
};

export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const count = await Staff.countDocuments({ schoolId: req.user?.schoolId });
  const staffId = `STF-${String(count + 1).padStart(4, '0')}`;

  const staff = await Staff.create({ ...req.body, schoolId: req.user?.schoolId, staffId });

  if (req.body.email) {
    await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.idNumber || 'Staff1234',
      role: req.body.role || 'subject_teacher',
      schoolId: req.user?.schoolId,
      profileId: staff._id,
      profileModel: 'Staff',
    });
  }

  res.status(201).json({ success: true, data: staff });
};

export const updateStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  const staff = await Staff.findOneAndUpdate({ _id: req.params.id, schoolId: req.user?.schoolId }, req.body, { new: true });
  if (!staff) { res.status(404).json({ success: false, message: 'Staff not found' }); return; }
  res.json({ success: true, data: staff });
};

// Get upcoming staff events (birthdays and anniversaries)
export const getUpcomingEvents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schoolId = req.user?.schoolId;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get all staff with necessary fields
    const staff = await Staff.find({ schoolId }).select('firstName lastName dateOfBirth employmentDate department photo');

    // Filter birthdays this month
    const birthdays = staff
      .filter((s) => {
        if (!s.dateOfBirth) return false;
        const dob = new Date(s.dateOfBirth);
        return dob.getMonth() + 1 === currentMonth;
      })
      .map((s) => ({
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        dateOfBirth: s.dateOfBirth,
        department: s.department || 'Staff',
        photo: s.photo || null,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.dateOfBirth!).getDate();
        const dateB = new Date(b.dateOfBirth!).getDate();
        return dateA - dateB;
      });

    // Filter work anniversaries this month
    const anniversaries = staff
      .filter((s) => {
        if (!s.employmentDate) return false;
        const empDate = new Date(s.employmentDate);
        return empDate.getMonth() + 1 === currentMonth && empDate.getFullYear() < currentYear;
      })
      .map((s) => {
        const empDate = new Date(s.employmentDate!);
        const yearsOfService = currentYear - empDate.getFullYear();
        return {
          _id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          employmentDate: s.employmentDate,
          department: s.department || 'Staff',
          photo: s.photo || null,
          yearsOfService,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.employmentDate!).getDate();
        const dateB = new Date(b.employmentDate!).getDate();
        return dateA - dateB;
      });

    res.json({
      success: true,
      data: {
        birthdays,
        anniversaries,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========== LEAVE ==========
export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  const mongoose = require('mongoose');
  const staff = await Staff.findOne({ schoolId: req.user?.schoolId, userId: new mongoose.Types.ObjectId(req.user?.id) });
  if (!staff) { res.status(404).json({ success: false, message: 'Staff profile not found' }); return; }

  const leave = await LeaveRequest.create({ ...req.body, schoolId: req.user?.schoolId, staffId: staff._id });
  res.status(201).json({ success: true, data: leave });
};

export const reviewLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, reviewComments, substituteTeacher } = req.body;
  const leave = await LeaveRequest.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user?.schoolId },
    { status, reviewComments, substituteTeacher, reviewedBy: req.user?.id, reviewedAt: new Date() },
    { new: true }
  );
  if (!leave) { res.status(404).json({ success: false, message: 'Leave request not found' }); return; }
  res.json({ success: true, data: leave });
};

export const getLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, staffId } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (status) query.status = status;
  if (staffId) query.staffId = staffId;

  const leaves = await LeaveRequest.find(query).populate('staffId', 'firstName lastName designation').sort({ createdAt: -1 });
  res.json({ success: true, data: leaves });
};

// ========== DISCIPLINE ==========
export const createIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  const incident = await DisciplineIncident.create({ ...req.body, schoolId: req.user?.schoolId, reportedBy: req.user?.id });
  res.status(201).json({ success: true, data: incident });
};

export const getIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, status, category, severity } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (studentId) query.studentId = studentId;
  if (status) query.status = status;
  if (category) query.category = category;
  if (severity) query.severity = severity;

  const incidents = await DisciplineIncident.find(query).populate('studentId', 'firstName lastName currentStream admissionNumber').sort({ date: -1 });
  res.json({ success: true, data: incidents });
};

export const updateIncident = async (req: AuthRequest, res: Response): Promise<void> => {
  const incident = await DisciplineIncident.findOneAndUpdate({ _id: req.params.id, schoolId: req.user?.schoolId }, req.body, { new: true });
  if (!incident) { res.status(404).json({ success: false, message: 'Incident not found' }); return; }
  res.json({ success: true, data: incident });
};

// ========== COUNSELING ==========
export const createCase = async (req: AuthRequest, res: Response): Promise<void> => {
  const mongoose = require('mongoose');
  const staff = await Staff.findOne({ schoolId: req.user?.schoolId, userId: new mongoose.Types.ObjectId(req.user?.id) });
  const c = await CounselingCase.create({ ...req.body, schoolId: req.user?.schoolId, counselorId: staff?._id });
  res.status(201).json({ success: true, data: c });
};

export const getCases = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, studentId, isUrgent } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (status) query.status = status;
  if (studentId) query.studentId = studentId;
  if (isUrgent === 'true') query.isUrgent = true;
  const cases = await CounselingCase.find(query)
    .populate('studentId', 'firstName lastName admissionNumber currentStream')
    .populate('counselorId', 'firstName lastName')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: cases });
};

export const updateCase = async (req: AuthRequest, res: Response): Promise<void> => {
  const caseItem = await CounselingCase.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user?.schoolId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!caseItem) {
    res.status(404).json({ success: false, message: 'Counseling case not found' });
    return;
  }
  res.json({ success: true, data: caseItem });
};

export const addCaseSession = async (req: AuthRequest, res: Response): Promise<void> => {
  const caseItem = await CounselingCase.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
  if (!caseItem) {
    res.status(404).json({ success: false, message: 'Counseling case not found' });
    return;
  }
  caseItem.sessions.push(req.body);
  await caseItem.save();
  res.json({ success: true, data: caseItem });
};

// ========== LIBRARY ==========
export const getBooks = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, category } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (category) query.category = category;
  if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { author: { $regex: search, $options: 'i' } }];
  const books = await Book.find(query).sort({ title: 1 });
  res.json({ success: true, data: books });
};

export const createBook = async (req: AuthRequest, res: Response): Promise<void> => {
  const book = await Book.create({ ...req.body, schoolId: req.user?.schoolId });
  res.status(201).json({ success: true, data: book });
};

export const checkoutBook = async (req: AuthRequest, res: Response): Promise<void> => {
  const { bookId, borrowerId, borrowerType, dueDate } = req.body;
  const book = await Book.findOne({ _id: bookId, schoolId: req.user?.schoolId });
  if (!book || book.availableCopies <= 0) { res.status(400).json({ success: false, message: 'Book not available' }); return; }

  await BookBorrowing.create({
    schoolId: req.user?.schoolId, bookId, borrowerId, borrowerType,
    checkoutDate: new Date(), dueDate: new Date(dueDate), issuedBy: req.user?.id,
  });
  await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });
  res.json({ success: true, message: 'Book checked out' });
};

export const returnBook = async (req: AuthRequest, res: Response): Promise<void> => {
  const borrowing = await BookBorrowing.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
  if (!borrowing) { res.status(404).json({ success: false, message: 'Borrowing record not found' }); return; }

  const returnDate = new Date();
  const overdueDays = Math.max(0, Math.floor((returnDate.getTime() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  const fine = overdueDays * 10; // Ksh 10 per day

  await BookBorrowing.findByIdAndUpdate(req.params.id, { returnDate, fine, status: fine > 0 ? 'returned' : 'returned' });
  await Book.findByIdAndUpdate(borrowing.bookId, { $inc: { availableCopies: 1 } });
  res.json({ success: true, message: 'Book returned', fine });
};

// ========== MEDICAL ==========
export const createClinicVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  const mongoose = require('mongoose');
  const staff = await Staff.findOne({ schoolId: req.user?.schoolId, userId: new mongoose.Types.ObjectId(req.user?.id) });
  const visit = await ClinicVisit.create({ ...req.body, schoolId: req.user?.schoolId, attendedBy: staff?._id });
  res.status(201).json({ success: true, data: visit });
};

export const getClinicVisits = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (studentId) query.studentId = studentId;
  const visits = await ClinicVisit.find(query)
    .populate('studentId', 'firstName lastName admissionNumber currentClass currentStream')
    .populate('attendedBy', 'firstName lastName')
    .sort({ date: -1 });
  res.json({ success: true, data: visits });
};

export const getMedicalStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const schoolId = req.user?.schoolId;
  
  // Get total medications dispensed count
  const visits = await ClinicVisit.find({ schoolId });
  const medicationsDispensed = visits.reduce((total, visit) => {
    return total + (visit.medicationDispensed?.length || 0);
  }, 0);

  res.json({ 
    success: true, 
    data: { 
      medicationsDispensed 
    } 
  });
};

export const updateClinicVisit = async (req: AuthRequest, res: Response): Promise<void> => {
  const visit = await ClinicVisit.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user?.schoolId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!visit) {
    res.status(404).json({ success: false, message: 'Clinic visit not found' });
    return;
  }
  res.json({ success: true, data: visit });
};

// ========== ANNOUNCEMENTS ==========
export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  const ann = await Announcement.create({ ...req.body, schoolId: req.user?.schoolId, createdBy: req.user?.id });
  res.status(201).json({ success: true, data: ann });
};

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  const { audience } = req.query;
  const query: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (audience) query.audience = { $in: [audience] };
  const anns = await Announcement.find(query).populate('createdBy', 'firstName lastName').sort({ isPinned: -1, createdAt: -1 }).limit(20);
  res.json({ success: true, data: anns });
};

// ========== NOTIFICATIONS ==========
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await Notification.find({ schoolId: req.user?.schoolId, recipientId: req.user?.id })
    .sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: notifications });
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  res.json({ success: true });
};

// ========== USERS MANAGEMENT ==========
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({ schoolId: req.user?.schoolId }).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
  if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, data: { isActive: user.isActive } });
};

// ========== QUOTES ==========
export const getDailyQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get total count of active quotes
    const count = await Quote.countDocuments({ isActive: true });
    
    if (count === 0) {
      res.json({ success: true, data: null });
      return;
    }
    
    // Use current date to get a deterministic but rotating index
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % count;
    
    // Get the quote at that index
    const quote = await Quote.findOne({ isActive: true }).skip(index).limit(1);
    
    res.json({ success: true, data: quote });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching daily quote' });
  }
};

export const getQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  const quotes = await Quote.find({ isActive: true }).sort({ createdAt: -1 });
  res.json({ success: true, data: quotes });
};

export const createQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  const quote = await Quote.create(req.body);
  res.status(201).json({ success: true, data: quote });
};
