import mongoose, { Schema, Document } from 'mongoose';

// ========== TIMETABLE ==========
export interface ITimetableSlot extends Document {
  schoolId: mongoose.Types.ObjectId;
  academicYear: string;
  term: number;
  class: string;
  stream: string;
  day: string;
  period: number;
  subject: string;
  teacherId: mongoose.Types.ObjectId;
  room?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    academicYear: { type: String, required: true },
    term: { type: Number, required: true },
    class: { type: String, required: true },
    stream: { type: String, required: true },
    day: { type: String, required: true },
    period: { type: Number, required: true },
    subject: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    room: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
TimetableSlotSchema.index({ schoolId: 1, academicYear: 1, term: 1, class: 1, stream: 1, day: 1, period: 1 }, { unique: true });

// ========== LEAVE ==========
export interface ILeaveRequest extends Document {
  schoolId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  leaveType: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewComments?: string;
  substituteTeacher?: mongoose.Types.ObjectId;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    leaveType: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reviewComments: String,
    substituteTeacher: { type: Schema.Types.ObjectId, ref: 'Staff' },
    attachments: [String],
  },
  { timestamps: true }
);

// ========== NOTIFICATION ==========
export interface INotification extends Document {
  schoolId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  recipientType: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    recipientId: { type: Schema.Types.ObjectId, required: true },
    recipientType: String,
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: String,
    channel: String,
    isRead: { type: Boolean, default: false },
    readAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);
NotificationSchema.index({ schoolId: 1, recipientId: 1, isRead: 1 });

// ========== ANNOUNCEMENT ==========
export interface IAnnouncement extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  audience: string[];
  isPinned: boolean;
  expiresAt?: Date;
  attachments: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    audience: [String],
    isPinned: { type: Boolean, default: false },
    expiresAt: Date,
    attachments: [String],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const TimetableSlot = mongoose.model<ITimetableSlot>('TimetableSlot', TimetableSlotSchema);
export const LeaveRequest = mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
