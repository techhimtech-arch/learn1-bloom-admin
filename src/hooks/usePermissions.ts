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
  | 'publish_announcement';

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
    'create_announcement', 'edit_announcement', 'delete_announcement', 'view_announcement', 'publish_announcement'
  ],
  admin: [
    'create_subject', 'edit_subject', 'delete_subject', 'assign_teacher',
    'create_timetable', 'edit_timetable', 'delete_timetable',
    'create_calendar_event', 'edit_calendar_event', 'delete_calendar_event',
    'assign_roll_numbers', 'view_academic_summary',
    'manage_users', 'manage_admissions', 'manage_attendance', 'manage_classes', 'view_reports',
    'create_announcement', 'edit_announcement', 'delete_announcement', 'view_announcement', 'publish_announcement'
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
    'create_announcement', 'edit_announcement', 'view_announcement', 'publish_announcement'
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
      class: 'manage_classes'
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
      attendance: 'manage_attendance'
    };
    return hasPermission(permissionMap[resource] as Permission);
  };

  const canDelete = (resource: string): boolean => {
    const permissionMap: Record<string, Permission> = {
      subject: 'delete_subject',
      timetable: 'delete_timetable',
      calendar_event: 'delete_calendar_event',
      user: 'manage_users'
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
