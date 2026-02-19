import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
}

// Define route permissions
const routePermissions: RoutePermission[] = [
  // Dashboard - all authenticated users
  { path: '/dashboard', allowedRoles: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher', 'counselor', 'librarian', 'medical_officer', 'finance_officer', 'admissions_officer', 'super_admin'] },
  
  // Students - most staff
  { path: '/students', allowedRoles: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher', 'counselor', 'admissions_officer', 'finance_officer'] },
  
  // Staff - admin only
  { path: '/staff', allowedRoles: ['principal', 'deputy_principal', 'super_admin'] },
  
  // Attendance - teachers and admin
  { path: '/attendance', allowedRoles: ['principal', 'deputy_principal', 'class_teacher', 'subject_teacher', 'hod'] },
  
  // Staff Attendance - all staff
  { path: '/staff-attendance', allowedRoles: ['principal', 'deputy_principal', 'class_teacher', 'subject_teacher', 'hod', 'finance_officer', 'librarian', 'medical_officer', 'counselor'] },
  
  // Academics - teachers and admin
  { path: '/academics', allowedRoles: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher'] },
  
  // Finance - finance and admin
  { path: '/finance', allowedRoles: ['principal', 'finance_officer', 'deputy_principal'] },
  
  // Discipline - teachers, counselors, admin
  { path: '/discipline', allowedRoles: ['principal', 'deputy_principal', 'class_teacher', 'hod', 'counselor'] },
  
  // Counseling - counselors and admin
  { path: '/counseling', allowedRoles: ['principal', 'deputy_principal', 'counselor'] },
  
  // Library - librarians and admin
  { path: '/library', allowedRoles: ['principal', 'librarian'] },
  
  // Medical - medical officer and admin
  { path: '/medical', allowedRoles: ['principal', 'medical_officer'] },
  
  // Leave - all staff
  { path: '/leave', allowedRoles: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher', 'counselor', 'finance_officer', 'librarian', 'medical_officer'] },
  
  // Communications - admin
  { path: '/communications', allowedRoles: ['principal', 'deputy_principal'] },
  
  // Settings - admin only
  { path: '/settings', allowedRoles: ['principal', 'super_admin'] },
];

/**
 * Check if a user has permission to access a route
 */
export function hasPermission(userRole: UserRole | undefined, path: string): boolean {
  if (!userRole) return false;
  
  // Find the most specific matching route permission
  const matchingPermission = routePermissions
    .filter(p => path.startsWith(p.path))
    .sort((a, b) => b.path.length - a.path.length)[0];
  
  if (!matchingPermission) return true; // No restriction
  
  return matchingPermission.allowedRoles.includes(userRole);
}

/**
 * Hook to protect routes based on user role
 */
export function useRoleProtection(allowedRoles?: UserRole[]) {
  const { user } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, allowedRoles, router]);
  
  return {
    hasAccess: user && (!allowedRoles || allowedRoles.includes(user.role)),
    user,
  };
}

/**
 * Component to conditionally render based on role
 */
interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { user } = useAuthStore();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Get user permissions for a specific feature
 */
export interface FeaturePermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function getFeaturePermissions(
  userRole: UserRole | undefined,
  feature: 'students' | 'staff' | 'attendance' | 'finance' | 'discipline' | 'library' | 'settings'
): FeaturePermissions {
  if (!userRole) {
    return { canView: false, canCreate: false, canEdit: false, canDelete: false };
  }
  
  const adminRoles: UserRole[] = ['principal', 'deputy_principal', 'super_admin'];
  const isAdmin = adminRoles.includes(userRole);
  
  switch (feature) {
    case 'students':
      return {
        canView: ['principal', 'deputy_principal', 'hod', 'class_teacher', 'subject_teacher', 'counselor', 'admissions_officer', 'finance_officer'].includes(userRole),
        canCreate: ['principal', 'deputy_principal', 'admissions_officer'].includes(userRole),
        canEdit: ['principal', 'deputy_principal', 'admissions_officer'].includes(userRole),
        canDelete: ['principal', 'super_admin'].includes(userRole),
      };
    
    case 'staff':
      return {
        canView: isAdmin,
        canCreate: isAdmin,
        canEdit: isAdmin,
        canDelete: ['principal', 'super_admin'].includes(userRole),
      };
    
    case 'attendance':
      return {
        canView: ['principal', 'deputy_principal', 'class_teacher', 'subject_teacher', 'hod'].includes(userRole),
        canCreate: ['principal', 'deputy_principal', 'class_teacher', 'subject_teacher'].includes(userRole),
        canEdit: ['principal', 'deputy_principal', 'class_teacher'].includes(userRole),
        canDelete: isAdmin,
      };
    
    case 'finance':
      return {
        canView: ['principal', 'finance_officer', 'deputy_principal'].includes(userRole),
        canCreate: ['principal', 'finance_officer'].includes(userRole),
        canEdit: ['principal', 'finance_officer'].includes(userRole),
        canDelete: ['principal'].includes(userRole),
      };
    
    case 'discipline':
      return {
        canView: ['principal', 'deputy_principal', 'class_teacher', 'hod', 'counselor'].includes(userRole),
        canCreate: ['principal', 'deputy_principal', 'class_teacher', 'hod', 'counselor'].includes(userRole),
        canEdit: isAdmin,
        canDelete: isAdmin,
      };
    
    case 'library':
      return {
        canView: ['principal', 'librarian', 'class_teacher', 'subject_teacher'].includes(userRole),
        canCreate: ['principal', 'librarian'].includes(userRole),
        canEdit: ['principal', 'librarian'].includes(userRole),
        canDelete: ['principal', 'librarian'].includes(userRole),
      };
    
    case 'settings':
      return {
        canView: isAdmin,
        canCreate: isAdmin,
        canEdit: isAdmin,
        canDelete: ['principal', 'super_admin'].includes(userRole),
      };
    
    default:
      return { canView: false, canCreate: false, canEdit: false, canDelete: false };
  }
}
