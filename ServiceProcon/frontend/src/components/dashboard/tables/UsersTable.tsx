import { usePermissions } from '../../../hooks/usePermissions';
import './UsersTable.css';

export const UsersTable = () => {
  const { hasPermission } = usePermissions();
  
  // Dados mockados
  const users = [
    { id: 1, name: 'João Silva', email: 'joao@procon.com', role: 'FUNCIONARIO' },
    { id: 2, name: 'Maria Santos', email: 'maria@procon.com', role: 'COORDENADOR' },
  ];

  return (
    <div className="users-table-container">
      {/* Botão de adicionar - apenas quem pode editar */}
      {hasPermission('canEditUsers') && (
        <button className="btn-primary">+ Novo Usuário</button>
      )}
      
      <table className="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Perfil</th>
            {hasPermission('canEditUsers') && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              {hasPermission('canEditUsers') && (
                <td>
                  <button className="btn-edit">✏️</button>
                  {hasPermission('canDeleteUsers') && (
                    <button className="btn-delete">🗑️</button>
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