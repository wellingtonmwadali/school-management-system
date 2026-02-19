import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    schoolId: string;
    email: string;
  };
}

export type UserRole =
  | 'super_admin'
  | 'principal'
  | 'deputy_principal'
  | 'hod'
  | 'class_teacher'
  | 'subject_teacher'
  | 'counselor'
  | 'finance_officer'
  | 'admissions_officer'
  | 'librarian'
  | 'medical_officer'
  | 'transport_coordinator'
  | 'hostel_warden'
  | 'parent'
  | 'student'
  | 'board_member'
  | 'support_staff';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type FeeStatus = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'waived';
export type AdmissionStatus = 'inquiry' | 'applied' | 'shortlisted' | 'admitted' | 'rejected' | 'waitlisted';
export type StudentStatus = 'active' | 'suspended' | 'expelled' | 'transferred' | 'graduated' | 'dropout';
export type IncidentSeverity = 'minor' | 'moderate' | 'serious' | 'critical';
export type Gender = 'male' | 'female' | 'other';
export type PaymentMethod = 'cash' | 'mpesa' | 'bank_transfer' | 'cheque' | 'card';
export type NotificationChannel = 'sms' | 'email' | 'whatsapp' | 'in_app';
