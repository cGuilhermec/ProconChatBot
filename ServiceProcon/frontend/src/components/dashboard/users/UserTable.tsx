import './UserTable.css';

interface User {
  USUARIO_ID: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  primeiro_acesso: boolean;
}

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onToggleStatus: (userId: number, currentStatus: boolean) => void;
  onResetPassword: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
  currentUserRole: string;
}

export const UserTable = ({
  users,
  onEdit,
  onToggleStatus,
  onResetPassword,
  canEdit,
  canDelete,
  currentUserRole
}: UserTableProps) => {

  // Verifica se o usuário logado pode editar o usuário alvo
  const canEditUser = (targetUser: User) => {
    if (!canEdit) return false;

    // COORDENADOR não pode editar DEV ou DIRETOR
    if (currentUserRole === 'COORDENADOR') {
      return targetUser.role !== 'DEV' && targetUser.role !== 'DIRETOR';
    }

    // DIRETOR e DEV podem editar todos
    return true;
  };

  // Verifica se o usuário logado pode resetar senha do usuário alvo
  const canResetPasswordUser = (targetUser: User) => {
    if (!canEdit) return false;

    // COORDENADOR não pode resetar senha de DEV ou DIRETOR
    if (currentUserRole === 'COORDENADOR') {
      return targetUser.role !== 'DEV' && targetUser.role !== 'DIRETOR';
    }

    // DIRETOR e DEV podem resetar senha de todos
    return true;
  };

  // Verifica se o usuário logado pode desativar/ativar o usuário alvo
  const canToggleStatusUser = (targetUser: User) => {
    if (!canDelete) return false;

    // COORDENADOR não pode desativar DEV ou DIRETOR
    if (currentUserRole === 'COORDENADOR') {
      return targetUser.role !== 'DEV' && targetUser.role !== 'DIRETOR';
    }

    // DIRETOR e DEV podem desativar todos
    return true;
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      DEV: 'badge-dev',
      DIRETOR: 'badge-diretor',
      COORDENADOR: 'badge-coordenador',
      FUNCIONARIO: 'badge-funcionario',
    };
    return badges[role] || 'badge-default';
  };

  const getStatusBadge = (ativo: boolean) => {
    return ativo ? 'badge-active' : 'badge-inactive';
  };

  return (
    <div className="user-table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            <th>Status</th>
            <th>Primeiro Acesso</th>
            {(canEdit || canDelete) && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.USUARIO_ID}>
              <td>{user.USUARIO_ID}</td>
              <td>{user.nome}</td>
              <td>{user.email}</td>
              <td>
                <span className={`badge ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </td>
              <td>
                <span className={`badge ${getStatusBadge(user.ativo)}`}>
                  {user.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                {user.primeiro_acesso ? '✅ Sim' : '❌ Não'}
              </td>
              {(canEdit || canDelete) && (
                <td className="actions">
                  {canEditUser(user) && (
                    <>
                      <button
                        className="btn-icon"
                        onClick={() => onEdit(user)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      {canResetPasswordUser(user) && (
                        <button
                          className="btn-icon"
                          onClick={() => onResetPassword(user.USUARIO_ID)}
                          title="Resetar Senha"
                        >
                          🔑
                        </button>
                      )}
                    </>
                  )}
                  {canToggleStatusUser(user) && (
                    <button
                      className={`btn-icon ${user.ativo ? 'deactivate' : 'activate'}`}
                      onClick={() => onToggleStatus(user.USUARIO_ID, user.ativo)}
                      title={user.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                    >
                      {user.ativo ? '🔴' : '🟢'}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};