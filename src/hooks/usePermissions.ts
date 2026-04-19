import { useAuth } from '@/contexts/AuthContext';

export type Permission = 
  | 'create_subject'
  | 'edit_subject'
  | 'delete_subject'
  | 'assign_teacher'
  | 'create_timetable'
  | 'edit_timetable'
  | 'delete_timetable'
  | 'create_calendar_event'
  | 'edit_calendar_event'
  | 'delete_calendar_event'
  | 'assign_roll_numbers'
  | 'view_academic_summary'
  | 'manage_users'
  | 'manage_admissions'
  | 'manage_attendance'
  | 'manage_classes'
  | 'view_reports'
  | 'create_announcement'
  | 'edit_announcement'
  | 'delete_announcement'
  | 'view_announcement'
  | 'publish_announcement'
  | 'create_assignment'
  | 'view_assignment'
  | 'edit_assignment'
  | 'publish_assignment'
  | 'delete_assignment'
  | 'generate_certificate'
  | 'delete_certificate'
  | 'create_exam_paper'
  | 'edit_exam_paper'
  | 'delete_exam_paper'
  | 'manage_fee_structure'
  | 'edit_fee_structure'
  | 'delete_fee_structure'
  | 'lock_marks'
  | 'delete_marks'
  | 'publish_results';

interface RolePermissions {
  [key: string]: Permission[];
}

const rolePermissions: RolePermissions = {
  school_admin: [
    'create_subject', 'edit_subject', 'delete_subject', 'assign_teacher',
    'create_timetable', 'edit_timetable', 'delete_timetable',
    'create_calendar_event', 'edit_calendar_event', 'delete_calendar_event',
    'assign_roll_numbers', 'view_academic_summary',
    'manage_users', 'manage_admissions', 'manage_attendance', 'manage_classes', 'view_reports',
    'create_announcement', 'edit_announcement', 'delete_announcement', 'view_announcement', 'publish_announcement',
    'create_assignment', 'view_assignment', 'edit_assignment', 'publish_assignment', 'delete_assignment',
    'generate_certificate', 'delete_certificate',
    'create_exam_paper', 'edit_exam_paper', 'delete_exam_paper',
    'manage_fee_structure', 'edit_fee_structure', 'delete_fee_structure',
    'lock_marks', 'delete_marks', 'publish_results'
  ],
  admin: [
    'create_subject', 'edit_subject', 'delete_subject', 'assign_teacher',
    'create_timetable', 'edit_timetable', 'delete_timetable',
    'create_calendar_event', 'edit_calendar_event', 'delete_calendar_event',
    'assign_roll_numbers', 'view_academic_summary',
    'manage_users', 'manage_admissions', 'manage_attendance', 'manage_classes', 'view_reports',
    'create_announcement', 'edit_announcement', 'delete_announcement', 'view_announcement', 'publish_announcement',
    'create_assignment', 'view_assignment', 'edit_assignment', 'publish_assignment', 'delete_assignment',
    'generate_certificate', 'delete_certificate',
    'create_exam_paper', 'edit_exam_paper', 'delete_exam_paper',
    'manage_fee_structure', 'edit_fee_structure', 'delete_fee_structure',
    'lock_marks', 'delete_marks', 'publish_results'
  ],
  principal: [
    'create_subject', 'edit_subject', 'delete_subject', 'assign_teacher',
    'create_timetable', 'edit_timetable', 'delete_timetable',
    'create_calendar_event', 'edit_calendar_event', 'delete_calendar_event',
    'assign_roll_numbers', 'view_academic_summary',
    'manage_admissions', 'manage_attendance', 'manage_classes', 'view_reports',
    'create_announcement', 'edit_announcement', 'delete_announcement', 'view_announcement', 'publish_announcement'
  ],
  teacher: [
    'edit_subject', 'create_timetable', 'edit_timetable',
    'create_calendar_event', 'edit_calendar_event',
    'view_academic_summary', 'manage_attendance',
    'create_announcement', 'edit_announcement', 'view_announcement', 'publish_announcement',
    'create_assignment', 'view_assignment', 'edit_assignment', 'publish_assignment'
  ],
  academic_coordinator: [
    'create_subject', 'edit_subject', 'assign_teacher',
    'create_timetable', 'edit_timetable', 'delete_timetable',
    'create_calendar_event', 'edit_calendar_event', 'delete_calendar_event',
    'assign_roll_numbers', 'view_academic_summary',
    'manage_admissions', 'manage_classes',
    'create_announcement', 'edit_announcement', 'view_announcement', 'publish_announcement'
  ],
  office_staff: [
    'manage_admissions', 'manage_attendance', 'view_reports'
  ]
};

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;
    
    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    
    const userPermissions = rolePermissions[user.role] || [];
    return permissions.some(permission => userPermissions.includes(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user?.role) return false;
    
    const userPermissions = rolePermissions[user.role] || [];
    return permissions.every(permission => userPermissions.includes(permission));
  };

  const canCreate = (resource: string): boolean => {
    const permissionMap: Record<string, Permission> = {
      subject: 'create_subject',
      timetable: 'create_timetable',
      calendar_event: 'create_calendar_event',
      user: 'manage_users',
      admission: 'manage_admissions',
      class: 'manage_classes',
      exam: 'create_exam_paper',
      announcement: 'create_announcement',
      assignment: 'create_assignment'
    };
    return hasPermission(permissionMap[resource] as Permission);
  };

  const canEdit = (resource: string): boolean => {
    const permissionMap: Record<string, Permission> = {
      subject: 'edit_subject',
      timetable: 'edit_timetable',
      calendar_event: 'edit_calendar_event',
      user: 'manage_users',
      admission: 'manage_admissions',
      class: 'manage_classes',
      attendance: 'manage_attendance',
      exam: 'edit_exam_paper',
      announcement: 'edit_announcement',
      assignment: 'edit_assignment',
      fee_structure: 'edit_fee_structure',
      certificate: 'generate_certificate'
    };
    return hasPermission(permissionMap[resource] as Permission);
  };

  const canDelete = (resource: string): boolean => {
    const permissionMap: Record<string, Permission> = {
      subject: 'delete_subject',
      timetable: 'delete_timetable',
      calendar_event: 'delete_calendar_event',
      user: 'manage_users',
      exam: 'delete_exam_paper',
      announcement: 'delete_announcement',
      assignment: 'delete_assignment',
      fee_structure: 'delete_fee_structure',
      certificate: 'delete_certificate',
      marks: 'delete_marks'
    };
    return hasPermission(permissionMap[resource] as Permission);
  };

  const canView = (resource: string): boolean => {
    const permissionMap: Record<string, Permission> = {
      academic_summary: 'view_academic_summary',
      reports: 'view_reports'
    };
    return hasPermission(permissionMap[resource] as Permission);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canEdit,
    canDelete,
    canView,
    userRole: user?.role || null
  };
}
