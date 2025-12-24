import { useAuth } from "@/contexts/AuthContext";

export function useMe() {
  const { user } = useAuth();
  return user;
}

export function useActiveTenant() {
  const { activeTenant } = useAuth();
  return activeTenant;
}

export function usePermissions() {
  const { permissions, user } = useAuth();
  
  const isSuperAdmin = !!user?.isSuperAdmin || !!permissions?.superAdmin;

  const can = (permission: string) => {
    if (isSuperAdmin) return true;
    return permissions?.permissions?.includes(permission) || false;
  };

  const canAny = (perms: string[]) => {
    if (isSuperAdmin) return true;
    return perms.some(p => permissions?.permissions?.includes(p));
  };

  return {
    isSuperAdmin,
    can,
    canAny
  };
}
