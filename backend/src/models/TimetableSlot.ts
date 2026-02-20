import mongoose, { Schema, Document } from 'mongoose';

export interface ITimetableSlot extends Document {
  schoolId: mongoose.Types.ObjectId;
  class: string;
  stream: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: string;
  subject: string;
  teacher?: mongoose.Types.ObjectId;
  teacherName?: string;
  room?: string;
  time?: string;
  academicYear: string;
  term: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    class: { type: String, required: true },
    stream: { type: String, required: true },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    period: { type: String, required: true },
    subject: { type: String, required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'Staff' },
    teacherName: String,
    room: String,
    time: String,
    academicYear: { type: String, required: true },
    term: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

TimetableSlotSchema.index({ schoolId: 1, class: 1, stream: 1, day: 1, period: 1 });
TimetableSlotSchema.index({ teacher: 1, day: 1 });

export default mongoose.models.TimetableSlot || mongoose.model<ITimetableSlot>('TimetableSlot', TimetableSlotSchema);
