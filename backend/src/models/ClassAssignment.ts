import mongoose, { Schema, Document } from 'mongoose';

export interface IClassAssignment extends Document {
  schoolId: mongoose.Types.ObjectId;
  class: string;
  stream: string;
  teacher: mongoose.Types.ObjectId;
  academicYear: string;
  term: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassAssignmentSchema = new Schema<IClassAssignment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    class: { type: String, required: true },
    stream: { type: String, required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    academicYear: { type: String, required: true },
    term: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

ClassAssignmentSchema.index({ schoolId: 1, class: 1, stream: 1, isActive: 1 });
ClassAssignmentSchema.index({ teacher: 1, isActive: 1 });

export default mongoose.models.ClassAssignment || mongoose.model<IClassAssignment>('ClassAssignment', ClassAssignmentSchema);
