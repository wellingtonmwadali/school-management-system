import mongoose, { Schema, Document } from 'mongoose';
import { IncidentSeverity } from '../types';

// ========== DISCIPLINE ==========
export interface IDisciplineIncident extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  time?: string;
  location?: string;
  category: string;
  description: string;
  severity: IncidentSeverity;
  witnesses: string[];
  reportedBy: mongoose.Types.ObjectId;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  sanctions: { type: string; duration?: string; startDate?: Date; endDate?: Date; notes?: string }[];
  parentNotified: boolean;
  parentNotifiedAt?: Date;
  resolution?: string;
  counselorReferral: boolean;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DisciplineIncidentSchema = new Schema<IDisciplineIncident>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true },
    time: String,
    location: String,
    category: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ['minor', 'moderate', 'serious', 'critical'], required: true },
    witnesses: [String],
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'closed'], default: 'open' },
    sanctions: [{ type: { type: String }, duration: String, startDate: Date, endDate: Date, notes: String }],
    parentNotified: { type: Boolean, default: false },
    parentNotifiedAt: Date,
    resolution: String,
    counselorReferral: { type: Boolean, default: false },
    attachments: [String],
  },
  { timestamps: true }
);

// ========== COUNSELING ==========
export interface ICounselingCase extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  counselorId: mongoose.Types.ObjectId;
  presentingIssue: string;
  referralSource: string;
  status: 'open' | 'in_progress' | 'resolved' | 'referred_external' | 'closed';
  isUrgent: boolean;
  sessions: {
    date: Date;
    duration: number;
    notes: string;
    actionPlan: string;
    nextSessionDate?: Date;
  }[];
  externalReferral?: string;
  closedAt?: Date;
  closedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CounselingCaseSchema = new Schema<ICounselingCase>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    counselorId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    presentingIssue: { type: String, required: true },
    referralSource: String,
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'referred_external', 'closed'], default: 'open' },
    isUrgent: { type: Boolean, default: false },
    sessions: [{ date: Date, duration: Number, notes: String, actionPlan: String, nextSessionDate: Date }],
    externalReferral: String,
    closedAt: Date,
    closedReason: String,
  },
  { timestamps: true }
);

// ========== LIBRARY ==========
export interface IBook extends Document {
  schoolId: mongoose.Types.ObjectId;
  isbn?: string;
  title: string;
  author: string;
  subject?: string;
  category: string;
  publisher?: string;
  year?: number;
  locationCode: string;
  totalCopies: number;
  availableCopies: number;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookBorrowing extends Document {
  schoolId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  borrowerId: mongoose.Types.ObjectId;
  borrowerType: 'student' | 'staff';
  checkoutDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fine: number;
  finePaid: boolean;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  issuedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    isbn: String,
    title: { type: String, required: true },
    author: { type: String, required: true },
    subject: String,
    category: { type: String, required: true },
    publisher: String,
    year: Number,
    locationCode: { type: String, required: true },
    totalCopies: { type: Number, required: true, default: 1 },
    availableCopies: { type: Number, required: true, default: 1 },
    coverImage: String,
  },
  { timestamps: true }
);

const BookBorrowingSchema = new Schema<IBookBorrowing>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    borrowerId: { type: Schema.Types.ObjectId, required: true },
    borrowerType: { type: String, enum: ['student', 'staff'] },
    checkoutDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnDate: Date,
    fine: { type: Number, default: 0 },
    finePaid: { type: Boolean, default: false },
    status: { type: String, enum: ['borrowed', 'returned', 'overdue', 'lost'], default: 'borrowed' },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// ========== MEDICAL ==========
export interface IClinicVisit extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  complaint: string;
  assessment: string;
  treatment: string;
  medicationDispensed: { name: string; dosage: string; quantity: number }[];
  referredToHospital: boolean;
  hospitalName?: string;
  parentNotified: boolean;
  attendedBy: mongoose.Types.ObjectId;
  followUpDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClinicVisitSchema = new Schema<IClinicVisit>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    complaint: { type: String, required: true },
    assessment: String,
    treatment: String,
    medicationDispensed: [{ name: String, dosage: String, quantity: Number }],
    referredToHospital: { type: Boolean, default: false },
    hospitalName: String,
    parentNotified: { type: Boolean, default: false },
    attendedBy: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    followUpDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export const DisciplineIncident = mongoose.model<IDisciplineIncident>('DisciplineIncident', DisciplineIncidentSchema);
export const CounselingCase = mongoose.model<ICounselingCase>('CounselingCase', CounselingCaseSchema);
export const Book = mongoose.model<IBook>('Book', BookSchema);
export const BookBorrowing = mongoose.model<IBookBorrowing>('BookBorrowing', BookBorrowingSchema);
export const ClinicVisit = mongoose.model<IClinicVisit>('ClinicVisit', ClinicVisitSchema);
