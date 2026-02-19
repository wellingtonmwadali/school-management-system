import mongoose, { Schema, Document } from 'mongoose';
import { Gender } from '../types';

export interface IStaff extends Document {
  staffId: string;
  schoolId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  nationality: string;
  idNumber: string;
  kraPin?: string;
  nhifNumber?: string;
  nssfNumber?: string;
  tscNumber?: string;
  bloodGroup?: string;
  photo?: string;
  
  designation: string;
  department: string;
  subjectsTaught: string[];
  classTeacherOf?: string;
  hodOf?: string;
  employmentType: 'permanent' | 'contract' | 'part_time' | 'intern';
  employmentDate: Date;
  contractEndDate?: Date;
  salaryGrade?: string;
  bankName?: string;
  bankAccountNumber?: string;
  
  qualifications: {
    degree: string;
    institution: string;
    year: number;
    certificate?: string;
  }[];
  experienceYears: number;
  previousEmployers: { name: string; role: string; from: Date; to: Date }[];
  
  phone: string;
  email: string;
  homeAddress: string;
  emergencyContact: { name: string; relationship: string; phone: string };
  
  isActive: boolean;
  terminationDate?: Date;
  terminationReason?: string;
  
  leaveBalances: { type: string; total: number; used: number; remaining: number }[];
  
  customFields: Record<string, unknown>;
  documents: { name: string; type: string; url: string; uploadedAt: Date }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    staffId: { type: String, required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    nationality: { type: String, default: 'Kenyan' },
    idNumber: { type: String, required: true },
    kraPin: String,
    nhifNumber: String,
    nssfNumber: String,
    tscNumber: String,
    bloodGroup: String,
    photo: String,
    
    designation: { type: String, required: true },
    department: { type: String, required: true },
    subjectsTaught: [String],
    classTeacherOf: String,
    hodOf: String,
    employmentType: { type: String, enum: ['permanent', 'contract', 'part_time', 'intern'], default: 'permanent' },
    employmentDate: { type: Date, required: true },
    contractEndDate: Date,
    salaryGrade: String,
    bankName: String,
    bankAccountNumber: String,
    
    qualifications: [{
      degree: String, institution: String, year: Number, certificate: String,
    }],
    experienceYears: { type: Number, default: 0 },
    previousEmployers: [{
      name: String, role: String, from: Date, to: Date,
    }],
    
    phone: { type: String, required: true },
    email: { type: String, required: true },
    homeAddress: { type: String, required: true },
    emergencyContact: { name: String, relationship: String, phone: String },
    
    isActive: { type: Boolean, default: true },
    terminationDate: Date,
    terminationReason: String,
    
    leaveBalances: [{
      type: { type: String }, total: Number, used: Number, remaining: Number,
    }],
    
    customFields: { type: Schema.Types.Mixed, default: {} },
    documents: [{
      name: String, type: String, url: String, uploadedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

StaffSchema.index({ schoolId: 1, staffId: 1 }, { unique: true });

export default mongoose.model<IStaff>('Staff', StaffSchema);
