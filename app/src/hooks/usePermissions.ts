/**
 * RBAC - Role Based Access Control Hook
 * Kullanıcı yetkilerini kontrol etmek için
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { Permission } from '@/types';
import { 
  ROLE_PERMISSIONS,
  hasPermission as checkPermission,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
} from '@/types';

export function usePermissions() {
  const { user } = useAuthStore();
  const userRole = user?.role || 'user';

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);

  const can = (permission: Permission): boolean => {
    return checkPermission(userRole, permission);
  };

  const canAll = (requiredPermissions: Permission[]): boolean => {
    return checkAllPermissions(userRole, requiredPermissions);
  };

  const canAny = (requiredPermissions: Permission[]): boolean => {
    return checkAnyPermission(userRole, requiredPermissions);
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';
  const isEditor = userRole === 'editor';
  const isSupport = userRole === 'support';
  // Admin paneline erişebilen roller (admin, super_admin, editor, support)
  const isStaff = isAdmin || isEditor || isSupport;

  return {
    permissions,
    userRole,
    can,
    canAll,
    canAny,
    isAdmin,
    isSuperAdmin,
    isEditor,
    isSupport,
    isStaff,
  };
}

// Bileşen seviyesinde yetki kontrolü için HOC benzeri hook
export function useRequirePermission(permission: Permission) {
  const { can } = usePermissions();
  return can(permission);
}

export function useRequireAdmin() {
  const { isAdmin } = usePermissions();
  return isAdmin;
}

export function useRequireSuperAdmin() {
  const { isSuperAdmin } = usePermissions();
  return isSuperAdmin;
}
