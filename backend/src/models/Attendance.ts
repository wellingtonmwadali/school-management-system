import mongoose, { Schema, Document } from 'mongoose';
import { AttendanceStatus } from '../types';

export interface IAttendance extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  academicYear: string;
  term: number;
  class: string;
  stream: string;
  
  morningStatus: AttendanceStatus;
  afternoonStatus?: AttendanceStatus;
  
  arrivalTime?: string;
  excuseReason?: string;
  excusedBy?: mongoose.Types.ObjectId;
  notes?: string;
  
  markedBy: mongoose.Types.ObjectId;
  markedAt: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: Date, required: true },
    academicYear: { type: String, required: true },
    term: { type: Number, required: true },
    class: { type: String, required: true },
    stream: { type: String, required: true },
    
    morningStatus: { type: String, enum: ['present', 'absent', 'late', 'excused'], required: true },
    afternoonStatus: { type: String, enum: ['present', 'absent', 'late', 'excused'] },
    
    arrivalTime: String,
    excuseReason: String,
    excusedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

AttendanceSchema.index({ schoolId: 1, date: 1, studentId: 1 }, { unique: true });
AttendanceSchema.index({ schoolId: 1, date: 1, class: 1, stream: 1 });
AttendanceSchema.index({ schoolId: 1, studentId: 1, academicYear: 1, term: 1 });

export default mongoose.model<IAttendance>('Attendance', AttendanceSchema);
