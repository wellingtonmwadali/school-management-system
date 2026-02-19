import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = 'Ksh'): string {
  return `${symbol} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | Date): string {
  return new Date(dateStr).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    present: 'bg-green-100 text-green-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    partial: 'bg-yellow-100 text-yellow-800',
    late: 'bg-yellow-100 text-yellow-800',
    unpaid: 'bg-red-100 text-red-800',
    absent: 'bg-red-100 text-red-800',
    expelled: 'bg-red-100 text-red-800',
    overdue: 'bg-red-100 text-red-800',
    transferred: 'bg-blue-100 text-blue-800',
    excused: 'bg-blue-100 text-blue-800',
    graduated: 'bg-purple-100 text-purple-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    open: 'bg-orange-100 text-orange-800',
    resolved: 'bg-green-100 text-green-800',
    waived: 'bg-gray-100 text-gray-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    super_admin: 'Super Admin', principal: 'Principal', deputy_principal: 'Deputy Principal',
    hod: 'Head of Department', class_teacher: 'Class Teacher', subject_teacher: 'Subject Teacher',
    counselor: 'Counselor', finance_officer: 'Finance Officer', admissions_officer: 'Admissions Officer',
    librarian: 'Librarian', medical_officer: 'Medical Officer', transport_coordinator: 'Transport Coordinator',
    hostel_warden: 'Hostel Warden', parent: 'Parent', student: 'Student',
    board_member: 'Board Member', support_staff: 'Support Staff',
  };
  return map[role] || role;
}

export function getGradeColor(grade: string): string {
  if (['A', 'A-'].includes(grade)) return 'text-green-600 font-bold';
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-blue-600 font-semibold';
  if (['C+', 'C', 'C-'].includes(grade)) return 'text-yellow-600';
  if (['D+', 'D', 'D-'].includes(grade)) return 'text-orange-600';
  return 'text-red-600';
}

export const ROLES_WITH_STUDENT_ACCESS = ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher', 'counselor', 'admissions_officer'];
export const ADMIN_ROLES = ['principal', 'deputy_principal', 'super_admin'];
export const FINANCE_ROLES = ['finance_officer', 'principal'];
