import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import { userService, type User } from '../../../services/api/user.service';
import { showConfirm, showToast, showLoading, closeLoading } from '../../../utils/alert';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { ResetPasswordModal } from './ResetPasswordModal';
import './UsersPage.css';

export const UsersPage = () => {
  const navigate = useNavigate();
  const { hasPermission, userRole } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filtra usuários baseado no termo de busca
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.USUARIO_ID.toString().includes(searchTerm)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.listarTodos();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      showToast('Erro ao carregar lista de usuários', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleResetPassword = async (userId: number) => {
    const user = users.find(u => u.USUARIO_ID === userId);
    if (user) {
      setUserToReset(user);
      setShowResetModal(true);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'desativar' : 'ativar';
    const title = currentStatus ? 'Desativar Usuário' : 'Ativar Usuário';
    const message = currentStatus
      ? 'Tem certeza que deseja desativar este usuário?'
      : 'Tem certeza que deseja ativar este usuário?';
    const confirmText = currentStatus ? 'Sim, desativar' : 'Sim, ativar';

    const confirmed = await showConfirm(title, message, confirmText, 'Cancelar');

    if (confirmed) {
      showLoading(currentStatus ? 'Desativando usuário...' : 'Ativando usuário...');
      try {
        if (currentStatus) {
          await userService.desativar(userId);  // Chama a rota /desativar/:id
        } else {
          await userService.ativar(userId);     // Chama a rota /ativar/:id
        }
        await loadUsers();
        closeLoading();
        showToast(currentStatus ? 'Usuário desativado com sucesso!' : 'Usuário ativado com sucesso!', 'success');
      } catch (err) {
        closeLoading();
        console.error('Erro ao alterar status:', err);
        showToast('Erro ao alterar status do usuário', 'error');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    loadUsers();
  };

  const handleResetSuccess = () => {
    setShowResetModal(false);
    setUserToReset(null);
    loadUsers();
    showToast('Senha resetada com sucesso!', 'success');
  };

  return (
    <div className="users-page">
      <button className="btn-back" onClick={() => navigate('/')}>
        ← Voltar ao Dashboard
      </button>

      <div className="page-header">
        <div className="header-left">
          <h1>👥 Usuários</h1>
          <p>Gerenciar usuários do sistema</p>
        </div>
        {hasPermission('canEditUsers') && (
          <button className="btn-primary" onClick={handleCreate}>
            + Novo Usuário
          </button>
        )}
      </div>

      {/* Campo de busca */}
      <div className="search-container">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nome, email ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
        <div className="search-info">
          {filteredUsers.length} de {users.length} usuários
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <UserTable
          users={filteredUsers}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onResetPassword={handleResetPassword}
          canEdit={hasPermission('canEditUsers')}
          canDelete={hasPermission('canDeleteUsers')}
          currentUserRole={userRole}
        />
      )}

      {showModal && (
        <UserForm
          user={selectedUser}
          onClose={() => setShowModal(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {showResetModal && userToReset && (
        <ResetPasswordModal
          user={userToReset}
          onClose={() => setShowResetModal(false)}
          onSuccess={handleResetSuccess}
        />
      )}
    </div>
  );
};