import { useAuth } from '../context/AuthContext';
import { rolePermissions, type UserRole, type Permission } from '../types/roles';

export const usePermissions = () => {
    const { user } = useAuth();
    const userRole = user?.role as UserRole || 'FUNCIONARIO';

    const permissions: Permission = rolePermissions[userRole];

    const hasPermission = (permission: keyof Permission): boolean => {
        return permissions[permission];
    };

    const isRole = (role: UserRole | UserRole[]): boolean => {
        if (Array.isArray(role)) {
            return role.includes(userRole);
        }
        return userRole === role;
    };

    return {
        userRole,
        permissions,
        hasPermission,
        isRole,
        // Métodos helpers
        isAdmin: isRole(['COORDENADOR', 'DIRETOR', 'DEV']),
        isManager: isRole(['COORDENADOR', 'DIRETOR']),
        isDeveloper: isRole('DEV'),
    };
};