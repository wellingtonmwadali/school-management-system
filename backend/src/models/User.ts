import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  schoolId: mongoose.Types.ObjectId;
  profileId?: mongoose.Types.ObjectId;
  profileModel?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName: string;
}

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: [
        'super_admin', 'principal', 'deputy_principal', 'hod', 'class_teacher',
        'subject_teacher', 'counselor', 'finance_officer', 'admissions_officer',
        'librarian', 'medical_officer', 'transport_coordinator', 'hostel_warden',
        'parent', 'student', 'board_member', 'support_staff'
      ],
      required: true,
    },
    schoolId: { type: Schema.Types.ObjectId, ref: 'SchoolConfig', required: true },
    profileId: { type: Schema.Types.ObjectId, refPath: 'profileModel' },
    profileModel: { type: String, enum: ['Student', 'Staff', 'Parent'] },
    phone: String,
    avatar: String,
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes for performance (email index is already created by unique: true in schema)
UserSchema.index({ schoolId: 1 });
UserSchema.index({ schoolId: 1, role: 1 });
UserSchema.index({ schoolId: 1, isActive: 1 });
UserSchema.index({ profileId: 1, profileModel: 1 });
UserSchema.index({ lastLogin: 1 });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
