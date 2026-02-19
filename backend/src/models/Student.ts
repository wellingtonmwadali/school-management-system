import mongoose, { Schema, Document } from 'mongoose';
import { Gender, StudentStatus } from '../types';

export interface IStudent extends Document {
  admissionNumber: string;
  schoolId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  
  // Personal
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: Gender;
  nationality: string;
  religion?: string;
  bloodGroup?: string;
  hasDisability: boolean;
  disabilityDetails?: string;
  photo?: string;
  idNumber?: string;
  nemisNumber?: string;
  kcpeIndexNumber?: string;
  kcpeScore?: number;
  
  // Academic
  currentClass: string;
  currentStream: string;
  admissionDate: Date;
  yearOfJoining: number;
  previousSchool?: string;
  status: StudentStatus;
  house?: string;
  
  // Medical
  medicalConditions: string[];
  allergies: string[];
  medications: string[];
  medicalInsurance?: string;
  
  // Family
  father?: {
    name: string;
    idNumber?: string;
    phone: string;
    email?: string;
    occupation?: string;
    employer?: string;
  };
  mother?: {
    name: string;
    idNumber?: string;
    phone: string;
    email?: string;
    occupation?: string;
    employer?: string;
  };
  guardian?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    idNumber?: string;
  };
  primaryContactType: 'father' | 'mother' | 'guardian';
  
  // Contact
  residentialAddress: string;
  postalAddress?: string;
  emergencyContacts: {
    name: string;
    relationship: string;
    phone: string;
  }[];
  
  // Boarding
  isBoarding: boolean;
  dormitory?: string;
  roomNumber?: string;
  bedNumber?: string;
  
  // Transport
  usesTransport: boolean;
  transportRoute?: string;
  
  customFields: Record<string, unknown>;
  documents: { name: string; type: string; url: string; uploadedAt: Date }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    admissionNumber: { type: String, required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    middleName: String,
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    nationality: { type: String, default: 'Kenyan' },
    religion: String,
    bloodGroup: String,
    hasDisability: { type: Boolean, default: false },
    disabilityDetails: String,
    photo: String,
    idNumber: String,
    nemisNumber: String,
    kcpeIndexNumber: String,
    kcpeScore: Number,
    
    currentClass: { type: String, required: true },
    currentStream: { type: String, required: true },
    admissionDate: { type: Date, required: true },
    yearOfJoining: { type: Number, required: true },
    previousSchool: String,
    status: { type: String, enum: ['active', 'suspended', 'expelled', 'transferred', 'graduated', 'dropout'], default: 'active' },
    house: String,
    
    medicalConditions: [String],
    allergies: [String],
    medications: [String],
    medicalInsurance: String,
    
    father: {
      name: String, idNumber: String, phone: String, email: String, occupation: String, employer: String,
    },
    mother: {
      name: String, idNumber: String, phone: String, email: String, occupation: String, employer: String,
    },
    guardian: {
      name: String, relationship: String, phone: String, email: String, idNumber: String,
    },
    primaryContactType: { type: String, enum: ['father', 'mother', 'guardian'], default: 'father' },
    
    residentialAddress: { type: String, required: true },
    postalAddress: String,
    emergencyContacts: [{
      name: String, relationship: String, phone: String,
    }],
    
    isBoarding: { type: Boolean, default: false },
    dormitory: String,
    roomNumber: String,
    bedNumber: String,
    
    usesTransport: { type: Boolean, default: false },
    transportRoute: String,
    
    customFields: { type: Schema.Types.Mixed, default: {} },
    documents: [{
      name: String, type: String, url: String, uploadedAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

StudentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
StudentSchema.index({ schoolId: 1, currentClass: 1, currentStream: 1 });
StudentSchema.index({ schoolId: 1, status: 1 });

export default mongoose.model<IStudent>('Student', StudentSchema);
