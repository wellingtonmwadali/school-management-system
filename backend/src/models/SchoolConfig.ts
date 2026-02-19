import mongoose, { Schema, Document } from 'mongoose';

export interface IGradingScale {
  letter: string;
  minScore: number;
  maxScore: number;
  points: number;
  remark: string;
}

export interface IFeeItem {
  name: string;
  code: string;
  amount: number;
  classes: string[];
  terms: number[];
  isOptional: boolean;
}

export interface ITermConfig {
  termNumber: number;
  name: string;
  startDate: Date;
  endDate: Date;
}

export interface IAcademicYear {
  year: string;
  startDate: Date;
  endDate: Date;
  terms: ITermConfig[];
  isCurrent: boolean;
}

export interface ISchoolConfig extends Document {
  name: string;
  code: string;
  logo?: string;
  motto?: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  type: 'day' | 'boarding' | 'mixed';
  curriculum: string;
  country: string;
  county?: string;
  accreditationNumber?: string;
  
  // Academic config
  classLevels: string[];
  streamsPerClass: number;
  gradingSchema: IGradingScale[];
  assessmentWeights: { type: string; weight: number }[];
  promotionCriteria: {
    minPassMark: number;
    maxFailedSubjects: number;
    minAttendancePercent: number;
  };
  
  // Financial config
  currency: string;
  currencySymbol: string;
  feeItems: IFeeItem[];
  latePenaltyPercent: number;
  latePenaltyDays: number;
  
  // Academic calendar
  academicYears: IAcademicYear[];
  
  // Timetable config
  periodsPerDay: number;
  periodDuration: number; // minutes
  breakTimes: { name: string; startPeriod: number; duration: number }[];
  workingDays: string[];
  
  // Notification config
  smsEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  notificationTriggers: {
    event: string;
    channels: string[];
    audience: string[];
    template: string;
    isActive: boolean;
  }[];
  
  // Integration config
  mpesaEnabled: boolean;
  mpesaShortcode?: string;
  mpesaConsumerKey?: string;
  mpesaConsumerSecret?: string;
  
  // System
  timezone: string;
  dateFormat: string;
  theme: string;
  customFields: {
    entity: string;
    fieldName: string;
    fieldType: string;
    isRequired: boolean;
    options?: string[];
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

const GradingScaleSchema = new Schema<IGradingScale>({
  letter: { type: String, required: true },
  minScore: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  points: { type: Number, required: true },
  remark: { type: String, required: true },
});

const SchoolConfigSchema = new Schema<ISchoolConfig>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    logo: String,
    motto: String,
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: String,
    type: { type: String, enum: ['day', 'boarding', 'mixed'], default: 'day' },
    curriculum: { type: String, default: 'KCSE' },
    country: { type: String, default: 'Kenya' },
    county: String,
    accreditationNumber: String,

    classLevels: { type: [String], default: ['Form 1', 'Form 2', 'Form 3', 'Form 4'] },
    streamsPerClass: { type: Number, default: 3 },
    gradingSchema: {
      type: [GradingScaleSchema],
      default: [
        { letter: 'A', minScore: 80, maxScore: 100, points: 12, remark: 'Excellent' },
        { letter: 'A-', minScore: 75, maxScore: 79, points: 11, remark: 'Excellent' },
        { letter: 'B+', minScore: 70, maxScore: 74, points: 10, remark: 'Very Good' },
        { letter: 'B', minScore: 65, maxScore: 69, points: 9, remark: 'Very Good' },
        { letter: 'B-', minScore: 60, maxScore: 64, points: 8, remark: 'Good' },
        { letter: 'C+', minScore: 55, maxScore: 59, points: 7, remark: 'Good' },
        { letter: 'C', minScore: 50, maxScore: 54, points: 6, remark: 'Average' },
        { letter: 'C-', minScore: 45, maxScore: 49, points: 5, remark: 'Below Average' },
        { letter: 'D+', minScore: 40, maxScore: 44, points: 4, remark: 'Below Average' },
        { letter: 'D', minScore: 35, maxScore: 39, points: 3, remark: 'Poor' },
        { letter: 'D-', minScore: 30, maxScore: 34, points: 2, remark: 'Poor' },
        { letter: 'E', minScore: 0, maxScore: 29, points: 1, remark: 'Very Poor' },
      ],
    },
    assessmentWeights: {
      type: [{ type: { type: String }, weight: Number }],
      default: [
        { type: 'CAT', weight: 30 },
        { type: 'End-Term', weight: 70 },
      ],
    },
    promotionCriteria: {
      minPassMark: { type: Number, default: 50 },
      maxFailedSubjects: { type: Number, default: 2 },
      minAttendancePercent: { type: Number, default: 75 },
    },

    currency: { type: String, default: 'KES' },
    currencySymbol: { type: String, default: 'Ksh' },
    feeItems: { type: [], default: [] },
    latePenaltyPercent: { type: Number, default: 5 },
    latePenaltyDays: { type: Number, default: 30 },

    academicYears: { type: [], default: [] },

    periodsPerDay: { type: Number, default: 9 },
    periodDuration: { type: Number, default: 40 },
    breakTimes: {
      type: [],
      default: [
        { name: 'Short Break', startPeriod: 3, duration: 20 },
        { name: 'Lunch Break', startPeriod: 6, duration: 45 },
      ],
    },
    workingDays: { type: [String], default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },

    smsEnabled: { type: Boolean, default: false },
    emailEnabled: { type: Boolean, default: true },
    whatsappEnabled: { type: Boolean, default: false },
    notificationTriggers: { type: [], default: [] },

    mpesaEnabled: { type: Boolean, default: false },
    mpesaShortcode: String,
    mpesaConsumerKey: String,
    mpesaConsumerSecret: String,

    timezone: { type: String, default: 'Africa/Nairobi' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    theme: { type: String, default: 'default' },
    customFields: { type: [], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<ISchoolConfig>('SchoolConfig', SchoolConfigSchema);
