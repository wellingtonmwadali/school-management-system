import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { login, getMe, changePassword, createSchoolAndAdmin } from '../controllers/authController';
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent, getStudentStats, bulkPromote } from '../controllers/studentController';
import { markAttendance, getClassAttendance, getStudentAttendance, getAttendanceSummary, getAbsenteeList } from '../controllers/attendanceController';
import { getExams, createExam, updateExam, enterMarks, getStudentReport, getClassResults, getSubjectAnalysis, getExamSchedule, uploadExamSchedule, addExamSchedule, uploadMarks, getMarksSummary } from '../controllers/examController';
import { generateClassInvoices, getInvoices, recordPayment, getFeeStats, getStudentFeeHistory } from '../controllers/feeController';
import {
  getConfig, updateConfig,
  getStaff, createStaff, updateStaff, getUpcomingEvents,
  applyLeave, reviewLeave, getLeaves,
  createIncident, getIncidents, updateIncident,
  createCase, getCases, updateCase, addCaseSession,
  getBooks, createBook, checkoutBook, returnBook,
  createClinicVisit, getClinicVisits, updateClinicVisit,
  createAnnouncement, getAnnouncements,
  getNotifications, markNotificationRead,
  getUsers, toggleUserStatus,
  getDailyQuote, getQuotes, createQuote,
} from '../controllers/otherControllers';
import { getPrincipalDashboard, getFinanceDashboard, getTeacherDashboard, getStudentDashboard, getTopPerformingStudents, getTopPerformingClasses } from '../controllers/dashboardController';
import { clockIn, clockOut, getStaffAttendance, getMyAttendance, getTodayStatus } from '../controllers/staffAttendanceController';
import { getTimetable, getUpcomingClasses, uploadTimetable, addTimetableEntry } from '../controllers/timetableController';
import { getClassAssignments, assignClassTeacher, removeClassAssignment, getMyClassAssignment } from '../controllers/classAssignmentController';
import { createRequest, getRequests, getMyRequests, reviewRequest, withdrawRequest, getLeaveBalance, getApproverSettings, getMyApprover, setApprover, getRequestTypeConfigs, getRequestTypeConfig, createRequestTypeConfig, updateRequestTypeConfig, deleteRequestTypeConfig, checkRequestEligibility } from '../controllers/requestController';

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
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// Logging middleware for all routes
router.use((req, res, next) => {
  console.log('🌐 ============================================');
  console.log('🌐 INCOMING REQUEST');
  console.log('🌐 ============================================');
  console.log('📍 Method:', req.method);
  console.log('📍 Path:', req.path);
  console.log('📍 Full URL:', req.originalUrl);
  console.log('📍 Origin:', req.get('origin') || 'Not provided');
  console.log('📍 Content-Type:', req.get('content-type') || 'Not provided');
  console.log('📦 Body:', JSON.stringify(req.body));
  console.log('🌐 ============================================');
  next();
});

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
router.get('/dashboard/top-students', protect, cacheHelper.medium, getTopPerformingStudents);
router.get('/dashboard/top-classes', protect, cacheHelper.medium, getTopPerformingClasses);

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
router.get('/staff/upcoming-events', protect, cacheHelper.short, getUpcomingEvents);

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

// Exam Schedules
router.get('/exams/schedule', protect, cacheHelper.medium, getExamSchedule);
router.post('/exams/schedule', protect, authorize('principal', 'deputy_principal', 'hod'), addExamSchedule);
router.post('/exams/schedule/upload', protect, authorize('principal', 'deputy_principal', 'hod'), upload.single('file'), uploadExamSchedule);
router.post('/exams/marks/upload', protect, authorize('principal', 'deputy_principal', 'subject_teacher', 'class_teacher'), upload.single('file'), uploadMarks);
router.get('/exams/marks/summary', protect, cacheHelper.medium, getMarksSummary);

// Timetable
router.get('/timetable', protect, cacheHelper.medium, getTimetable);
router.get('/timetable/upcoming', protect, cacheHelper.short, getUpcomingClasses);
router.post('/timetable/upload', protect, authorize('principal', 'deputy_principal'), upload.single('file'), uploadTimetable);
router.post('/timetable/entries', protect, authorize('principal', 'deputy_principal'), addTimetableEntry);

// Settings - Class Assignments
router.get('/settings/class-assignments', protect, cacheHelper.medium, getClassAssignments);
router.post('/settings/assign-class-teacher', protect, authorize('principal', 'super_admin', 'deputy_principal'), assignClassTeacher);
router.delete('/settings/class-assignments/:id', protect, authorize('principal', 'super_admin', 'deputy_principal'), validateMongoId, removeClassAssignment);
router.get('/settings/my-class-assignment', protect, cacheHelper.medium, getMyClassAssignment);

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
router.get('/counseling/cases', protect, validatePagination, cacheHelper.medium, getCases);
router.post('/counseling/cases', protect, createCase);
router.put('/counseling/cases/:id', protect, validateMongoId, updateCase);
router.post('/counseling/cases/:id/sessions', protect, validateMongoId, addCaseSession);

// Library
router.get('/library/books', protect, validatePagination, cacheHelper.long, getBooks);
router.post('/library/books', protect, authorize('librarian', 'principal'), uploadLimiter, createBook);
router.post('/library/checkout', protect, authorize('librarian'), checkoutBook);
router.put('/library/return/:id', protect, authorize('librarian'), validateMongoId, returnBook);

// Medical
router.get('/medical/visits', protect, validatePagination, cacheHelper.medium, getClinicVisits);
router.post('/medical/visits', protect, createClinicVisit);
router.patch('/medical/visits/:id', protect, validateMongoId, updateClinicVisit);

// Quotes
router.get('/quotes/daily', protect, cacheHelper.long, getDailyQuote);
router.get('/quotes', protect, cacheHelper.long, getQuotes);
router.post('/quotes', protect, authorize('principal', 'super_admin'), createQuote);

// Leave
router.get('/leave', protect, getLeaves);
router.post('/leave', protect, applyLeave);
router.put('/leave/:id/review', protect, authorize('principal', 'deputy_principal', 'hod'), reviewLeave);

// Requests (new unified system)
router.get('/requests', protect, getRequests);
router.get('/requests/my', protect, getMyRequests);
router.post('/requests', protect, createRequest);
router.put('/requests/:id/review', protect, validateMongoId, reviewRequest);
router.put('/requests/:id/withdraw', protect, validateMongoId, withdrawRequest);
router.get('/requests/leave-balance', protect, getLeaveBalance);

// Approver settings
router.get('/settings/approvers', protect, authorize('principal', 'super_admin'), getApproverSettings);
router.get('/settings/approvers/my', protect, getMyApprover);
router.post('/settings/approvers', protect, authorize('principal', 'super_admin'), setApprover);

// Request type configurations
router.get('/settings/request-types', protect, getRequestTypeConfigs);
router.get('/settings/request-types/:id', protect, validateMongoId, getRequestTypeConfig);
router.post('/settings/request-types', protect, authorize('principal', 'super_admin'), createRequestTypeConfig);
router.put('/settings/request-types/:id', protect, authorize('principal', 'super_admin'), validateMongoId, updateRequestTypeConfig);
router.delete('/settings/request-types/:id', protect, authorize('principal', 'super_admin'), validateMongoId, deleteRequestTypeConfig);
router.get('/settings/request-types/:configId/check-eligibility', protect, validateMongoId, checkRequestEligibility);

// Announcements
router.get('/announcements', protect, getAnnouncements);
router.post('/announcements', protect, authorize('principal', 'super_admin', 'deputy_principal'), createAnnouncement);

// Notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

export default router;
