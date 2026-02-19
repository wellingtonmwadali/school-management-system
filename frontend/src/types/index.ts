export type UserRole =
  | 'super_admin' | 'principal' | 'deputy_principal' | 'hod'
  | 'class_teacher' | 'subject_teacher' | 'counselor' | 'finance_officer'
  | 'admissions_officer' | 'librarian' | 'medical_officer' | 'transport_coordinator'
  | 'hostel_warden' | 'parent' | 'student' | 'board_member' | 'support_staff';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  schoolId: string;
  avatar?: string;
}

export interface Student {
  _id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  currentClass: string;
  currentStream: string;
  status: 'active' | 'suspended' | 'expelled' | 'transferred' | 'graduated' | 'dropout';
  photo?: string;
  admissionDate: string;
  father?: { name: string; phone: string; email?: string };
  mother?: { name: string; phone: string; email?: string };
  residentialAddress: string;
  isBoarding: boolean;
  usesTransport: boolean;
  createdAt: string;
}

export interface Staff {
  _id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  subjectsTaught: string[];
  classTeacherOf?: string;
  hodOf?: string;
  phone: string;
  email: string;
  employmentType: string;
  isActive: boolean;
}

export interface FeeInvoice {
  _id: string;
  invoiceNumber: string;
  studentId: Student | string;
  academicYear: string;
  term: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue' | 'waived';
  dueDate: string;
  items: { name: string; amount: number; discount: number; penalty: number; net: number }[];
}

export interface AttendanceRecord {
  _id: string;
  studentId: Student | string;
  date: string;
  morningStatus: 'present' | 'absent' | 'late' | 'excused';
  afternoonStatus?: 'present' | 'absent' | 'late' | 'excused';
  class: string;
  stream: string;
}

export interface Exam {
  _id: string;
  name: string;
  type: string;
  academicYear: string;
  term: number;
  classes: string[];
  startDate: string;
  endDate: string;
  isPublished: boolean;
}

export interface Mark {
  _id: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  gradePoints: number;
  remark: string;
  classRank?: number;
  teacherComment?: string;
}

export interface DashboardMetrics {
  totalStudents: number;
  totalStaff: number;
  todayAttendanceRate: number;
  todayPresent: number;
  todayAbsent: number;
  feeCollected: number;
  feeOutstanding: number;
  feeCollectionRate: number;
  openIncidents: number;
  pendingLeaves: number;
  atRiskStudents: number;
}

export interface SchoolConfig {
  _id: string;
  name: string;
  code: string;
  logo?: string;
  motto?: string;
  address: string;
  phone: string;
  email: string;
  type: 'day' | 'boarding' | 'mixed';
  curriculum: string;
  classLevels: string[];
  gradingSchema: { letter: string; minScore: number; maxScore: number; points: number; remark: string }[];
  assessmentWeights: { type: string; weight: number }[];
  promotionCriteria: { minPassMark: number; maxFailedSubjects: number; minAttendancePercent: number };
  currency: string;
  currencySymbol: string;
  feeItems: { name: string; code: string; amount: number; classes: string[]; terms: number[]; isOptional: boolean }[];
  periodsPerDay: number;
  periodDuration: number;
  workingDays: string[];
  smsEnabled: boolean;
  emailEnabled: boolean;
  timezone: string;
  academicYears: { year: string; startDate: string; endDate: string; isCurrent: boolean; terms: { termNumber: number; name: string; startDate: string; endDate: string }[] }[];
}
