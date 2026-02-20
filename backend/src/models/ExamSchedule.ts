import mongoose, { Schema, Document } from 'mongoose';

export interface IExamSchedule extends Document {
  schoolId: mongoose.Types.ObjectId;
  class: string;
  stream: string;
  subject: string;
  examType: 'CAT' | 'Mid-Term' | 'End-Term' | 'Mock' | 'National';
  date: Date;
  time: string;
  duration: string;
  venue: string;
  academicYear: string;
  term: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExamScheduleSchema = new Schema<IExamSchedule>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    class: { type: String, required: true },
    stream: { type: String, required: true },
    subject: { type: String, required: true },
    examType: {
      type: String,
      enum: ['CAT', 'Mid-Term', 'End-Term', 'Mock', 'National'],
      required: true,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: String,
    venue: String,
    academicYear: { type: String, required: true },
    term: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

ExamScheduleSchema.index({ schoolId: 1, class: 1, stream: 1, examType: 1 });

export default mongoose.models.ExamSchedule || mongoose.model<IExamSchedule>('ExamSchedule', ExamScheduleSchema);
