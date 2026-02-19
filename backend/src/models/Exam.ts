import mongoose, { Schema, Document } from 'mongoose';

export interface IExam extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  type: string;
  academicYear: string;
  term: number;
  classes: string[];
  startDate: Date;
  endDate: Date;
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubjectPaper extends Document {
  schoolId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  subject: string;
  class: string;
  stream?: string;
  maxMarks: number;
  passMark: number;
  duration: number;
  examDate: Date;
  teacherId: mongoose.Types.ObjectId;
  marksEntryDeadline?: Date;
  isMarksEntered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMark extends Document {
  schoolId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  paperId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject: string;
  class: string;
  stream: string;
  academicYear: string;
  term: number;
  
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  grade: string;
  gradePoints: number;
  remark: string;
  
  teacherComment?: string;
  enteredBy: mongoose.Types.ObjectId;
  enteredAt: Date;
  
  classRank?: number;
  streamRank?: number;
  subjectRank?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: { type: Number, required: true },
    classes: [String],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const SubjectPaperSchema = new Schema<ISubjectPaper>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    stream: String,
    maxMarks: { type: Number, required: true, default: 100 },
    passMark: { type: Number, required: true, default: 40 },
    duration: { type: Number, required: true, default: 120 },
    examDate: { type: Date, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    marksEntryDeadline: Date,
    isMarksEntered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const MarkSchema = new Schema<IMark>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    paperId: { type: Schema.Types.ObjectId, ref: 'SubjectPaper', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    stream: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: { type: Number, required: true },
    
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String, required: true },
    gradePoints: { type: Number, required: true },
    remark: { type: String, required: true },
    
    teacherComment: String,
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    enteredAt: { type: Date, default: Date.now },
    
    classRank: Number,
    streamRank: Number,
    subjectRank: Number,
  },
  { timestamps: true }
);

// Indexes for Exam
ExamSchema.index({ schoolId: 1, academicYear: 1, term: 1 });
ExamSchema.index({ schoolId: 1, isPublished: 1 });
ExamSchema.index({ startDate: 1, endDate: 1 });

// Indexes for SubjectPaper
SubjectPaperSchema.index({ schoolId: 1, examId: 1 });
SubjectPaperSchema.index({ examId: 1, subject: 1, class: 1, stream: 1 }, { unique: true });
SubjectPaperSchema.index({ schoolId: 1, teacherId: 1 });
SubjectPaperSchema.index({ examDate: 1 });

// Indexes for Mark
MarkSchema.index({ schoolId: 1, examId: 1, studentId: 1, subject: 1 }, { unique: true });
MarkSchema.index({ schoolId: 1, studentId: 1, academicYear: 1 });
MarkSchema.index({ schoolId: 1, examId: 1, class: 1, stream: 1 });
MarkSchema.index({ paperId: 1 });
MarkSchema.index({ schoolId: 1, examId: 1, subject: 1 });

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
export const SubjectPaper = mongoose.model<ISubjectPaper>('SubjectPaper', SubjectPaperSchema);
export const Mark = mongoose.model<IMark>('Mark', MarkSchema);
