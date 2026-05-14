export type UserRole = 'FUNCIONARIO' | 'COORDENADOR' | 'DIRETOR' | 'DEV';

export interface Permission {
    canViewUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canViewReports: boolean;
    canGenerateReports: boolean;
    canViewProcons: boolean;
    canEditProcons: boolean;
    canViewAuditLog: boolean;
    canViewSystemSettings: boolean;
    canAccessDevTools: boolean;
}

export const rolePermissions: Record<UserRole, Permission> = {
    FUNCIONARIO: {
        canViewUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canViewReports: true,
        canGenerateReports: false,
        canViewProcons: false,
        canEditProcons: false,
        canViewAuditLog: false,
        canViewSystemSettings: false,
        canAccessDevTools: false,
    },
    COORDENADOR: {
        canViewUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewReports: true,
        canGenerateReports: true,
        canViewProcons: true,
        canEditProcons: true,
        canViewAuditLog: false,
        canViewSystemSettings: false,
        canAccessDevTools: false,
    },
    DIRETOR: {
        canViewUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewReports: true,
        canGenerateReports: true,
        canViewProcons: true,
        canEditProcons: true,
        canViewAuditLog: true,
        canViewSystemSettings: true,
        canAccessDevTools: false,
    },
    DEV: {
        canViewUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canViewReports: true,
        canGenerateReports: true,
        canViewProcons: true,
        canEditProcons: true,
        canViewAuditLog: true,
        canViewSystemSettings: true,
        canAccessDevTools: true,
    },
};