import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  resource?: string;
  action?: 'create' | 'edit' | 'delete' | 'view';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  resource,
  action,
  children,
  fallback = null
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canCreate, canEdit, canDelete, canView } = usePermissions();

  let hasAccess = false;

  if (resource && action) {
    switch (action) {
      case 'create':
        hasAccess = canCreate(resource);
        break;
      case 'edit':
        hasAccess = canEdit(resource);
        break;
      case 'delete':
        hasAccess = canDelete(resource);
        break;
      case 'view':
        hasAccess = canView(resource);
        break;
    }
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
