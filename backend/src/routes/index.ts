import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { login, getMe, changePassword, createSchoolAndAdmin } from '../controllers/authController';
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentStats, bulkPromote } from '../controllers/studentController';
import { markAttendance, getClassAttendance, getStudentAttendance, getAttendanceSummary, getAbsenteeList } from '../controllers/attendanceController';
import { getExams, createExam, updateExam, enterMarks, getStudentReport, getClassResults, getSubjectAnalysis } from '../controllers/examController';
import { generateClassInvoices, getInvoices, recordPayment, getFeeStats, getStudentFeeHistory } from '../controllers/feeController';
import {
  getConfig, updateConfig,
  getStaff, createStaff, updateStaff,
  applyLeave, reviewLeave, getLeaves,
  createIncident, getIncidents, updateIncident,
  createCase, getCases,
  getBooks, createBook, checkoutBook, returnBook,
  createClinicVisit, getClinicVisits,
  createAnnouncement, getAnnouncements,
  getNotifications, markNotificationRead,
  getUsers, toggleUserStatus,
} from '../controllers/otherControllers';
import { getPrincipalDashboard, getFinanceDashboard, getTeacherDashboard, getStudentDashboard } from '../controllers/dashboardController';
import { clockIn, clockOut, getStaffAttendance, getMyAttendance, getTodayStatus } from '../controllers/staffAttendanceController';

// Import rate limiters and validation
import { authLimiter, paymentLimiter, uploadLimiter, exportLimiter } from '../middleware/rateLimiter';
import {
  validateLogin,
  validateRegister,
  validatePasswordChange,
  validateStudent,
  validateAttendance,
  validateExam,
  validateFeeInvoice,
  validatePayment,
  validateMongoId,
  validatePagination,
} from '../middleware/validation';
import { cacheHelper } from '../utils/cache';

const router = Router();

// Auth (public)
router.post('/auth/login', authLimiter, validateLogin, login);
router.post('/auth/setup', authLimiter, validateRegister, createSchoolAndAdmin);
router.get('/auth/me', protect, getMe);
router.put('/auth/change-password', protect, validatePasswordChange, changePassword);

// Dashboard (with caching)
router.get('/dashboard/principal', protect, cacheHelper.short, getPrincipalDashboard);
router.get('/dashboard/finance', protect, cacheHelper.short, getFinanceDashboard);
router.get('/dashboard/teacher', protect, cacheHelper.short, getTeacherDashboard);
router.get('/dashboard/student', protect, cacheHelper.short, getStudentDashboard);

// Config
router.get('/config', protect, cacheHelper.long, getConfig);
router.put('/config', protect, authorize('principal', 'super_admin'), updateConfig);

// Users
router.get('/users', protect, authorize('principal', 'super_admin', 'deputy_principal'), validatePagination, cacheHelper.medium, getUsers);
router.put('/users/:id/toggle-status', protect, authorize('principal', 'super_admin'), validateMongoId, toggleUserStatus);

// Students
router.get('/students/stats', protect, cacheHelper.short, getStudentStats);
router.get('/students', protect, validatePagination, cacheHelper.medium, getStudents);
router.post('/students', protect, authorize('principal', 'admissions_officer', 'deputy_principal'), uploadLimiter, validateStudent, createStudent);
router.get('/students/:id', protect, validateMongoId, cacheHelper.medium, getStudent);
router.put('/students/:id', protect, authorize('principal', 'admissions_officer', 'deputy_principal', 'class_teacher'), validateMongoId, validateStudent, updateStudent);
router.delete('/students/:id', protect, authorize('principal'), validateMongoId, deleteStudent);
router.post('/students/bulk-promote', protect, authorize('principal', 'deputy_principal'), bulkPromote);

// Staff
router.get('/staff', protect, validatePagination, cacheHelper.medium, getStaff);
router.post('/staff', protect, authorize('principal', 'super_admin'), uploadLimiter, createStaff);
router.put('/staff/:id', protect, authorize('principal', 'super_admin', 'deputy_principal'), validateMongoId, updateStaff);

// Staff Attendance
router.post('/staff-attendance/clock-in', protect, clockIn);
router.post('/staff-attendance/clock-out', protect, clockOut);
router.get('/staff-attendance/today', protect, getTodayStatus);
router.get('/staff-attendance/my', protect, getMyAttendance);
router.get('/staff-attendance', protect, authorize('principal', 'super_admin', 'deputy_principal'), getStaffAttendance);

// Attendance
router.post('/attendance', protect, validateAttendance, markAttendance);
router.get('/attendance/class', protect, cacheHelper.short, getClassAttendance);
router.get('/attendance/student/:studentId', protect, validateMongoId, cacheHelper.medium, getStudentAttendance);
router.get('/attendance/summary', protect, cacheHelper.short, getAttendanceSummary);
router.get('/attendance/absentees', protect, cacheHelper.short, getAbsenteeList);

// Exams & Marks
router.get('/exams', protect, cacheHelper.medium, getExams);
router.post('/exams', protect, authorize('principal', 'deputy_principal', 'hod'), validateExam, createExam);
router.put('/exams/:id', protect, authorize('principal', 'deputy_principal', 'hod'), validateMongoId, validateExam, updateExam);
router.post('/marks', protect, enterMarks);
router.get('/marks/student/:studentId/exam/:examId', protect, validateMongoId, cacheHelper.long, getStudentReport);
router.get('/marks/class', protect, cacheHelper.medium, getClassResults);
router.get('/marks/analysis/:examId', protect, validateMongoId, exportLimiter, cacheHelper.long, getSubjectAnalysis);

// Fees
router.post('/fees/generate-invoices', protect, authorize('finance_officer', 'principal'), validateFeeInvoice, generateClassInvoices);
router.get('/fees/invoices', protect, validatePagination, cacheHelper.short, getInvoices);
router.post('/fees/payments', protect, authorize('finance_officer', 'principal'), paymentLimiter, validatePayment, recordPayment);
router.get('/fees/stats', protect, authorize('finance_officer', 'principal', 'deputy_principal'), cacheHelper.short, getFeeStats);
router.get('/fees/student/:studentId', protect, validateMongoId, cacheHelper.medium, getStudentFeeHistory);

// Discipline
router.get('/discipline', protect, validatePagination, cacheHelper.medium, getIncidents);
router.post('/discipline', protect, createIncident);
router.put('/discipline/:id', protect, validateMongoId, updateIncident);

// Counseling
router.get('/counseling', protect, validatePagination, cacheHelper.medium, getCases);
router.post('/counseling', protect, createCase);

// Library
router.get('/library/books', protect, validatePagination, cacheHelper.long, getBooks);
router.post('/library/books', protect, authorize('librarian', 'principal'), uploadLimiter, createBook);
router.post('/library/checkout', protect, authorize('librarian'), checkoutBook);
router.put('/library/return/:id', protect, authorize('librarian'), validateMongoId, returnBook);

// Medical
router.get('/medical', protect, validatePagination, cacheHelper.medium, getClinicVisits);
router.post('/medical', protect, createClinicVisit);

// Leave
router.get('/leave', protect, getLeaves);
router.post('/leave', protect, applyLeave);
router.put('/leave/:id/review', protect, authorize('principal', 'deputy_principal', 'hod'), reviewLeave);

// Announcements
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, createAnnouncement);

// Notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

export default router;
