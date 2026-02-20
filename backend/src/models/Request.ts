import mongoose, { Schema, Document } from 'mongoose';

// ========== REQUEST MODEL ==========
// Unified request model for leave, medical, permissions, etc.
export interface IRequest extends Document {
  schoolId: mongoose.Types.ObjectId;
  requestType: 'leave' | 'medical' | 'permission' | 'other';
  requestFor: 'self' | 'student';
  
  // Requester info
  requestedBy: mongoose.Types.ObjectId; // User ID
  requestedByModel: 'Staff' | 'Student' | 'Parent';
  requestedByName: string;
  
  // Subject of request (who it's for)
  subjectId: mongoose.Types.ObjectId; // Staff or Student ID
  subjectModel: 'Staff' | 'Student';
  subjectName: string;
  
  // Request details
  title: string;
  description: string;
  startDate?: Date;
  endDate?: Date;
  totalDays?: number;
  
  // Leave specific
  leaveType?: 'annual' | 'sick' | 'maternity' | 'paternity' | 'compassionate' | 'unpaid' | 'other';
  
  // Medical specific
  medicalReason?: string;
  symptoms?: string;
  diagnosis?: string;
  
  // Approval workflow
  approverId: mongoose.Types.ObjectId; // User ID of approver
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedAt?: Date;
  reviewComments?: string;
  
  // Additional info
  substituteTeacher?: mongoose.Types.ObjectId;
  attachments: string[];
  priority: 'low' | 'medium' | 'high';
  
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    requestType: { 
      type: String, 
      enum: ['leave', 'medical', 'permission', 'other'], 
      required: true 
    },
    requestFor: { 
      type: String, 
      enum: ['self', 'student'], 
      required: true 
    },
    
    // Requester
    requestedBy: { type: Schema.Types.ObjectId, required: true },
    requestedByModel: { 
      type: String, 
      enum: ['Staff', 'Student', 'Parent'], 
      required: true 
    },
    requestedByName: { type: String, required: true },
    
    // Subject
    subjectId: { type: Schema.Types.ObjectId, required: true },
    subjectModel: { 
      type: String, 
      enum: ['Staff', 'Student'], 
      required: true 
    },
    subjectName: { type: String, required: true },
    
    // Details
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: Date,
    endDate: Date,
    totalDays: Number,
    
    // Leave specific
    leaveType: { 
      type: String, 
      enum: ['annual', 'sick', 'maternity', 'paternity', 'compassionate', 'unpaid', 'other'] 
    },
    
    // Medical specific
    medicalReason: String,
    symptoms: String,
    diagnosis: String,
    
    // Approval
    approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approverName: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected', 'cancelled'], 
      default: 'pending' 
    },
    reviewedAt: Date,
    reviewComments: String,
    
    // Additional
    substituteTeacher: { type: Schema.Types.ObjectId, ref: 'Staff' },
    attachments: { type: [String], default: [] },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'], 
      default: 'medium' 
    },
  },
  { timestamps: true }
);

RequestSchema.index({ schoolId: 1, status: 1 });
RequestSchema.index({ subjectId: 1, status: 1 });
RequestSchema.index({ approverId: 1, status: 1 });
RequestSchema.index({ requestedBy: 1 });

// ========== LEAVE BALANCE MODEL ==========
export interface ILeaveBalance extends Document {
  schoolId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  academicYear: string;
  
  annual: { total: number; used: number; remaining: number };
  sick: { total: number; used: number; remaining: number };
  maternity: { total: number; used: number; remaining: number };
  paternity: { total: number; used: number; remaining: number };
  compassionate: { total: number; used: number; remaining: number };
  unpaid: { total: number; used: number; remaining: number };
  
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    academicYear: { type: String, required: true },
    
    annual: {
      total: { type: Number, default: 30 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 30 },
    },
    sick: {
      total: { type: Number, default: 14 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 14 },
    },
    maternity: {
      total: { type: Number, default: 90 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 90 },
    },
    paternity: {
      total: { type: Number, default: 14 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 14 },
    },
    compassionate: {
      total: { type: Number, default: 7 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 7 },
    },
    unpaid: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ schoolId: 1, staffId: 1, academicYear: 1 }, { unique: true });

// ========== APPROVER SETTINGS MODEL ==========
export interface IApproverSetting extends Document {
  schoolId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId; // Staff or Student ID
  subjectModel: 'Staff' | 'Student';
  subjectName: string;
  
  requestType: 'leave' | 'medical' | 'permission' | 'all';
  approverId: mongoose.Types.ObjectId; // User ID
  approverName: string;
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApproverSettingSchema = new Schema<IApproverSetting>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    subjectId: { type: Schema.Types.ObjectId, required: true },
    subjectModel: { type: String, enum: ['Staff', 'Student'], required: true },
    subjectName: { type: String, required: true },
    
    requestType: { 
      type: String, 
      enum: ['leave', 'medical', 'permission', 'all'], 
      required: true 
    },
    approverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approverName: { type: String, required: true },
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ApproverSettingSchema.index({ schoolId: 1, subjectId: 1, requestType: 1 });

export const Request = mongoose.models.Request || mongoose.model<IRequest>('Request', RequestSchema);
export const LeaveBalance = mongoose.models.LeaveBalance || mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
export const ApproverSetting = mongoose.models.ApproverSetting || mongoose.model<IApproverSetting>('ApproverSetting', ApproverSettingSchema);
