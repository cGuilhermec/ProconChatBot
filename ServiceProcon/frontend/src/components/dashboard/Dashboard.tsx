import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { modules, type Module } from '../../types/modules';
import { showToast } from '../../utils/alert';
import { ModuleCard } from './cards/ModuleCard';
import { FirstAccessModal } from '../FirstAccessModal';
import './Dashboard.css';

export const Dashboard = () => {
  const { user, logout, isFirstAccess, updateUser } = useAuth();
  const { userRole, isAdmin, isManager } = usePermissions();
  const navigate = useNavigate();
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProcons: 0,
    totalAtendimentos: 0,
    totalAgendamentos: 0,
  });

  useEffect(() => {
    const filteredModules = modules.filter(module =>
      module.permissions.includes(userRole)
    );
    setAvailableModules(filteredModules);
    loadStats();
  }, [userRole]);

  // Verifica se é primeiro acesso e mostra o modal
  useEffect(() => {
    if (isFirstAccess) {
      setShowModal(true);
    }
  }, [isFirstAccess]);

  const loadStats = async () => {
    setStats({
      totalUsers: 42,
      totalProcons: 8,
      totalAtendimentos: 156,
      totalAgendamentos: 23,
    });
  };

  const handleModuleClick = (module: Module) => {
    navigate(module.path);
  };

  const handleLogout = () => {
    logout();
    showToast('Você saiu do sistema', 'success');
    navigate('/login');
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    if (user) {
      updateUser({ ...user, primeiro_acesso: false });
    }
  };

  const handleModalClose = () => {
    showToast('Você precisa trocar sua senha para continuar', 'warning');
    logout();
    navigate('/login');
  };

  const getWelcomeMessage = () => {
    const messages = {
      DEV: '🚀 Acesso total ao sistema e ferramentas de desenvolvimento',
      DIRETOR: '👑 Visão executiva completa do sistema',
      COORDENADOR: '📋 Gerencie usuários, procons e acompanhe indicadores',
      FUNCIONARIO: '💼 Acesse atendimentos e agendamentos',
    };
    return messages[userRole as keyof typeof messages] || messages.FUNCIONARIO;
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <div className="welcome-text">
              <h1>Bem-vindo, {user?.nome}! 👋</h1>
              <p>{getWelcomeMessage()}</p>
            </div>
            <div className="header-actions">
              <div className="role-badge">
                <span className={`role-${userRole?.toLowerCase()}`}>
                  {userRole}
                </span>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Sair">
                <span className="logout-icon">🚪</span>
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Ações Rápidas</h2>
          <div className="actions-grid">
            {isAdmin && (
              <>
                <button className="quick-action-card" onClick={() => navigate('/usuarios')}>
                  <span className="action-icon">👥</span>
                  <span>Novo Usuário</span>
                </button>
                <button className="quick-action-card" onClick={() => navigate('/procons')}>
                  <span className="action-icon">🏢</span>
                  <span>Nova Unidade</span>
                </button>
              </>
            )}
            {(isManager || userRole === 'FUNCIONARIO') && (
              <button className="quick-action-card" onClick={() => navigate('/agendamentos')}>
                <span className="action-icon">📅</span>
                <span>Novo Agendamento</span>
              </button>
            )}
            <button className="quick-action-card" onClick={() => navigate('/perfil')}>
              <span className="action-icon">🔒</span>
              <span>Alterar Senha</span>
            </button>
          </div>
        </div>

        <div className="modules-section">
          <h2>Módulos do Sistema</h2>
          <div className="modules-grid">
            {availableModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                onClick={() => handleModuleClick(module)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Modal de primeiro acesso */}
      <FirstAccessModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        userNome={user?.nome || ''}
      />
    </div>
  );
};